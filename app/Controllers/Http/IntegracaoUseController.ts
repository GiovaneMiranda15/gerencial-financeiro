import { schema } from "@ioc:Adonis/Core/Validator";
import EstabelecimentosUse from "App/Models/EstabelecimentoUse";
import api from "App/Utils/Api";
import { handleErrorResponse } from "App/Utils/HandleErrorResponse";

export default class IntegracaoUseController {

    
    // Função para definir od tipos de pagamento! 
    private tipoPagamento = (tipo: any, cobranca:any) => {
        switch (true) {
            case (cobranca == 'BOLETO_PIX' && tipo == 'PIX'):
                return "QRCODE BOLETO"
            case (cobranca == 'BOLETO_PIX' && tipo == 'BOLETO'):
                return "BOLETO"
            case (cobranca == 'PIX_AVULSO' && tipo == 'PIX'):
                return "PIX"
            default:
                return "OUTROS"
        }
    }

    // Função para cadastrar estabelecimento use!
    public async cadastrar({ request, response, auth }) {
        try {
            // Valida se usuário está autenticado!
            await auth.use("web").authenticate()

            // Valida os dados informados!
            const dados = await request.validate({
                schema: schema.create({
                    id: schema.string(),
                    nome: schema.string(),
                    cnpj: schema.string(),
                    chave: schema.string()
                })
            })

            // Atualiza ou insere o estabalecimento de acordo com seu id!
            await EstabelecimentosUse.updateOrCreate({ id: dados.id }, dados)

            // Retorna mensagem de sucesso!
            return response.status(201).send({ status: true, mensagem: "Estabelecimento inserido com sucesso" })

        } catch (error) {
            // Chama a função de verificação do erro!
            handleErrorResponse(response, error)
        }
    }

    // Função para buscar estabelecimentos use!
    public buscarEstabelecimento = async ({ response, auth }) => {
        try {
            // Verifica se usuário está autenticado!
            await auth.use("web").authenticate()

            // Busca os estabelecimentos!
            const estabelecimentos = await EstabelecimentosUse.query()

            // Retorna mensagem de sucesso!
            return response.status(200).send({ status: true, mensagem: "Estabelecimentos retornados com sucesso", dados: estabelecimentos })

        } catch (error) {
            // Chama a função de verificação do erro!
            handleErrorResponse(response, error)
        }
    }

    // Função para buscar transações!
    public async buscarRecebimentos({ response, params, auth }) {
        try {
            // Verifica se usuário está autenticado!
            await auth.use("web").authenticate()

            // Busca os estabelecimentos use!
            const estabelecimentos = await EstabelecimentosUse.query().orderBy("nome", "asc")

            // Variável para armazenar os dados!
            const dados: any[] = [];

            // Loop pelos estabelecimentos!
            for (const item of estabelecimentos) {
                // Chama função para consultar os recebimentos!
                const recebimentos = await this.consultarRecebimentos(item, params);
                // Chama a função para consultar o saldo do estabelecimento!
                const saldo_final = await this.consultarSaldo(item);

                // Função para criar o array de transações!
                const criarArrayTransacoes = async (recebimentos: any[]) => {
                    const transacoes: any[] = [];

                    for (const itemRecebimento of recebimentos) {
                        for (const pagamento of itemRecebimento.pagamentos) {
                            console.log(itemRecebimento.tipo_cobranca+"/"+pagamento.origem_pagamento)
                            transacoes.push({
                                cliente: itemRecebimento.sacado_razao,
                                valor_boleto: itemRecebimento.valor_cobranca,
                                pedido: itemRecebimento.pedido_numero,
                                observacao: itemRecebimento.observacao,
                                origem: itemRecebimento.tipo_cobranca,
                                forma_pagamento:  (this.tipoPagamento(pagamento.origem_pagamento, itemRecebimento.tipo_cobranca)), // Chama a função para retornar o tipo de pagamento!
                                data_documento: itemRecebimento.data_documento,
                                data_vencimento: itemRecebimento.data_vencimento,
                                data_pagamento: pagamento.data_quitacao,
                                total: pagamento.valor_pago,
                                taxa: pagamento.valor_taxa_credenciado
                            });
                        }
                    }

                    return transacoes;
                };

                // Montagem dos dados!
                dados.push({
                    id: item.id,
                    estabelecimento: item.nome,
                    cnpj: item.cnpj,
                    saldo: {
                        quantidade: recebimentos.reduce((total: number, item: any) => total + item.pagamentos.length, 0),
                        total: recebimentos.reduce((total: number, item: any) => total + item.pagamentos.reduce((subtotal: number, pagamento: any) => subtotal + parseFloat(pagamento.valor_pago), 0), 0).toFixed(2),
                        tarifa: recebimentos.reduce((total: number, item: any) => total + item.pagamentos.reduce((subtotal: number, pagamento: any) => subtotal + parseFloat(pagamento.valor_taxa_credenciado), 0), 0).toFixed(2),
                        saldo: saldo_final,
                        transacoes: await criarArrayTransacoes(recebimentos)
                    }
                });
            }

            // Retorna mensagem de sucesso!
            return response.status(200).send({ status: true, mensagem: "Transações retornadas com sucesso", dados: dados })
        } catch (error) {
            // Chama a função de verificação do erro!
            handleErrorResponse(response, error)
        }
    }

    // Função para consultar os recebimentos de acordo com o estabelecimento!
    private async consultarRecebimentos(item: any, params: any) {
        try {
            const { dataInicial, dataFinal } = params
            const options = {
                method: "post",
                maxBodyLength: Infinity,
                url: `https://api.useboletos.com.br/credenciados/v1/${item.id}/cobrancas-pagas`,
                headers: {
                    "Content-Type": "application/json",
                    "X-Credenciado-Chave": item.chave
                },
                params: {
                    data_inicio: dataInicial,
                    data_fim: dataFinal,
                }
            }

            // Chama a requisição de acordo com a integração!
            const result = await api(options)

            return result

        } catch (error) {
            return error
        }
    }

    // Função para consultar o saldo do estabelecimento!
    private async consultarSaldo(item: any) {
        try {
            const options = {
                method: "get",
                maxBodyLength: Infinity,
                url: `https://api.useboletos.com.br/credenciados/v1/${item.id}/saldo`,
                headers: {
                    "Content-Type": "application/json",
                    "X-Credenciado-Chave": item.chave
                }
            }

            // Chama a requisição de acordo com a integração!
            const result = await api(options)

            return result.saldo_atual

        } catch (error) {
            return error
        }
    }

    // Função para solicitar o repasse do estabelecimento! 
    public async repasse({ response, params, auth }) {
        try {
            // Verifica  se usuário está autenticado!
            await auth.use("web").authenticate();

            // Busca o estabelecimento informado!
            const estabelecimento = await EstabelecimentosUse.query().where("id", params.identificador).first()

            if (estabelecimento) {
                const options = {
                    method: "post",
                    maxBodyLength: Infinity,
                    url: `https://api.useboletos.com.br/credenciados/v1/${estabelecimento.id}/repasse`,
                    headers: {
                        "Content-Type": "application/json",
                        "X-Credenciado-Chave": estabelecimento.chave
                    },
                }

                // Chama a requisição de acordo com a integração!
                return await api(options).then(() => {
                    return response.status(200).send({ status: true, mensagem: "Repasse solicitado" })
                }).catch(() => {
                    return response.status(400).send({ status: false, mensagem: "Não foi possivel realizar o repasse" })
                })
            } else {
                return response.status(404).send({ status: false, mensagem: "Estabelecimento não encontrado" })
            }
        } catch (error) {
            // Chama a função de verificação do erro!
            handleErrorResponse(response, error)
        }
    }
}