import { schema } from "@ioc:Adonis/Core/Validator"
import Database from "@ioc:Adonis/Lucid/Database"
import EstabelecimentosMesh from "App/Models/EstabelecimentosMesh"
import Integracao from "App/Models/Integracao"
import Terminal from "App/Models/Terminal"
import api from "App/Utils/Api"
import { handleErrorResponse } from "App/Utils/HandleErrorResponse"
import moment from "moment"

export default class UsersController {

    // Função para definir od tipos de pagamento! 
    private tipoPagamento = (tipo: any) => {
        switch (tipo) {
            case "debit":
                return "DÉBITO"
            case "credit":
                return "CRÉDITO"
            case "pix":
                return "PIX"
            default:
                return "OUTROS"
        }
    }

    // Função para buscar o terminal retornado nas transações!
    private buscarTerminal = async (transacao: any, item: any) => {
        // Verifica se a transação possui terminal!
        if (transacao.point_of_sale.identification_number != null) {
            // Busca se o terminal existe no banco!
            const terminal = await Terminal.query().whereILike("id", `${transacao.point_of_sale.identification_number}`).first()
            if (terminal) {
                // Retorna a descrição do terminal ou seu numero serial!
                return (terminal.descricao == "" || terminal.descricao == null) ? terminal.serial : terminal.descricao
            } else {

                const options = {
                    method: "get",
                    maxBodyLength: Infinity,
                    url: `https://api.zoop.ws/v1/card-present/terminals/${transacao.point_of_sale.identification_number}`,
                    headers: {
                        accept: "application/json",
                        authorization: "Basic " + item.chave
                    }
                }

                // Busca o terminal pelo seu identificador na api da zoop!
                const result = await api(options)

                // Retorna caso o terminal não tenha sido localizado!
                if (!result.id) return "TERMINAL NÃO LOCALIZADO"

                // Retorna o serial do terminal!
                return result.serial_number
            }
        } else {
            // Retorna caso a transação não possua terminal!
            return "TERMINAL NÃO LOCALIZADO"
        }
    }

    // Função para buscar os estabelecimentos zoop!
    public buscarEstabelecimento = async ({ response, auth }) => {
        try {
            // Verifica se usuário está autenticado!
            await auth.use("web").authenticate()

            // Busca todos os estabeleciemntos zoop!
            const estabelecimentos = await EstabelecimentosMesh.query()

            // Retorna o array dos estabelecimentos encontrados!
            return response.status(200).send({ status: true, mensagem: "Estabelecimentos retornados com sucesso!", dados: estabelecimentos })

        } catch (error) {
            // Chama a função de verificação do erro!
            handleErrorResponse(response, error)
        }
    }

    // Função para cadastrar estabelecimento zoop!
    public async cadastrar({ request, response, auth }) {
        try {
            // Verifica se usuário está autenticado!
            await auth.use("web").authenticate()

            // Valida os dados informados
            const dados = await request.validate({
                schema: schema.create({
                    id: schema.string(),
                    nome: schema.string(),
                    cnpj: schema.string(),
                    tipo: schema.number()
                })
            })

            // Atualiza ou insere o estabelecimento de acordo com seu identificador!
            await EstabelecimentosMesh.updateOrCreate({ id: dados.id }, dados)

            // Retorna mensagem de sucesso!
            return response.status(201).send({ status: true, mensagem: "Estabelecimento inserido com sucesso!" })
        } catch (error) {
            // Chama a função de verificação do erro!
            handleErrorResponse(response, error)
        }
    }

    // Função para vincular
    public async vincularTerminal({ request, response, auth }) {
        try {
            // Verifica se usuário está autenticado!
            await auth.use("web").authenticate()

            // Valida os dados informados!
            const dados = await request.validate({
                schema: schema.create({
                    serial: schema.string(),
                    descricao: schema.string(),
                    tipo: schema.string()
                })
            })

            // Busca a chave da api de acordo com o tipo informado!
            const integracao = await Integracao.query().where("tipo", dados.tipo).firstOrFail()

            const options = {
                method: "get",
                maxBodyLength: Infinity,
                url: `https://api.zoop.ws/v1/card-present/terminals/search?serial_number=${dados.serial}`,
                headers: {
                    accept: "application/json",
                    authorization: "Basic " + integracao.chave
                }
            }

            // Busca na integração com a zoop o terminal informado!
            const result = await api(options)

            // Retorna erro caso o terminal não tenha sido
            if (!result.id) throw new Error("Terminal não encontrado")

            // Atualiza ou insere o terminal de acordo com seu identificador!
            await Terminal.updateOrCreate({ id: result.id }, { id: result.id, serial: result.serial_number, descricao: dados.descricao, tipo: dados.tipo })

            // Retorna mensagem de sucesso!
            return response.status(201).send({ status: true, mensagem: "Terminal vinculado com sucesso!" })
            
        } catch (error) {
            // Chama a função de verificação do erro!
            handleErrorResponse(response, error)
        }
    }

    // Função para buscar transações!
    public async buscarTransacoes({ response, params, auth }) {
        try {
            // Verifica se usuário está autenticado!
            await auth.use("web").authenticate()
            
            // Pega os dados do usuário autenticado!
            const usuario = await auth.use("web").user
            
            // Busca o estabelecimento e suas respectivas chaves de acesso!
            let estabelecimentos = await Database.query()
                .select([
                    "em.*", "i.chave", "i.identificador"
                ])
                .from("estabelecimentos_mesh as em")
                .leftJoin("integracao as i", "i.tipo", "em.tipo")
                .where((query) => {
                    if (usuario.estabelecimentos !== null)
                        query.whereIn("em.id", usuario.estabelecimentos)
                })
                .orderBy("em.nome", "asc")

            const { dataInicial, dataFinal } = params
            const date_range_gte_formatado = moment(dataInicial + "T04:00:00.000Z").toISOString()
            const date_range_lte_formatado = moment(dataFinal + "T03:59:59.999Z").add(1, "day").toISOString()

            const retorno = new Array()

            for (const item of estabelecimentos) {
                // Chama a função de consulta para as transações do estabelecimento!
                const transacoes = await this.consultarTransacoes(date_range_gte_formatado, date_range_lte_formatado, item)

                retorno.push({
                    estabelecimento: item.nome,
                    cnpj: item.cnpj,
                    saldo: {
                        quantidade: transacoes.length,
                        total: transacoes.reduce((total, item) => total + parseFloat(item.amount), 0).toFixed(2),
                        tarifa: transacoes.reduce((total, item) => total + parseFloat(item.fees), 0).toFixed(2),
                        saldo: transacoes.reduce((total, item) => total + (parseFloat(item.amount) - parseFloat(item.fees)), 0).toFixed(2),
                        transacoes: await Promise.all(
                            transacoes.map(async (transacao) => {
                                // Chama a função de busca de nome do terminal!
                                const descricaoTerminal = await this.buscarTerminal(transacao, item)
                                return {
                                    id: transacao.id,
                                    total: transacao.amount,
                                    forma_pagamento: (this.tipoPagamento(transacao.payment_type)), // Chama a função para retornar o tipo de pagamento!
                                    cliente: transacao.payment_method.holder_name ?? "",
                                    primeiros_digitos: transacao.payment_method.first4_digits ?? "0000",
                                    ultimos_digitos: transacao.payment_method.last4_digits ?? "0000",
                                    data: moment(transacao.updated_at).format("DD/MM/YYYY"),
                                    hora: moment(transacao.updated_at).format("HH:mm"),
                                    terminal: descricaoTerminal,
                                    taxa: transacao.fees
                                }
                            })
                        )
                    }
                })
            }
            // Retorna mensagem de sucesso!
            return response.status(200).send({status: true, mensagem: "Transações retornadas com sucesso!", dados: retorno})
        } catch (error) {
            // Chama a função de verificação do erro!
            handleErrorResponse(response, error)
        }
    }

    // Função para buscar transações!
    private async consultarTransacoes(date_range_gte_formatado: string, date_range_lte_formatado: string, item: any) {

        let page = 1
        let nextPage = true

        let transacoes = new Array()

        while (nextPage) {
            // Monta o filtro a ser passado na requisição!
            let filter = `?limit=1000&page=${page}&offset=0&date_range[gte]=${date_range_gte_formatado}&date_range[lte]=${date_range_lte_formatado}&status=succeeded`

            const options = {
                method: "get",
                maxBodyLength: Infinity,
                url: `https://api.zoop.ws/v1/marketplaces/${item.identificador}/sellers/${item.id}/transactions${filter}`,
                headers: {
                    accept: "application/json",
                    authorization: "Basic " + item.chave
                }
            }

            const result = await api(options)

            if (result.items) {
                // Monta em um array os retornas e continua percorrendo o laço caso necessário!
                transacoes.push(...result.items)
                page < result.total_pages ? page++ : nextPage = false
            }
        }

        return transacoes
    }

}