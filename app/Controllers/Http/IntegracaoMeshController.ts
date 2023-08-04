import { schema } from '@ioc:Adonis/Core/Validator'
import EstabelecimentosMesh from "App/Models/EstabelecimentosMesh"
import Integracao from 'App/Models/Integracao'
import Terminal from "App/Models/Terminal"
import api from "App/Utils/Api"
import { handleErrorResponse } from "App/Utils/HandleErrorResponse"
import moment from "moment"

export default class UsersController {

    private marketplace: string | undefined
    private apiKey: string | undefined

    constructor() {
        this.buscarConexao()
    }

    private buscarConexao = async () => {
        const api = await Integracao.query().first()
        this.marketplace = api?.identificador
        this.apiKey = api?.chave
    }

    private tipoPagamento = (tipo: any) => {
        switch (tipo) {
            case 'debit':
                return 'Débito'
            case 'credit':
                return 'Crédito'
            case 'pix':
                return 'Pix'
            default:
                return 'Outros'
        }
    }

    private buscarTerminal = async (transacao: any, terminais: any) => {
        const terminal = terminais.find((item: { id: any }) => item.id == transacao.point_of_sale.identification_number)
        if (terminal) {
            return (terminal.descricao == '' || terminal.descricao == null) ? terminal.serial : terminal.descricao
        } else {
            const options = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://api.zoop.ws/v1/card-present/terminals/${transacao.point_of_sale.identification_number}`,
                headers: {
                    accept: 'application/json',
                    authorization: 'Basic ' + this.apiKey
                }
            }

            const result = await api(options)

            if (!result.id) return 'Terminal não localizado'

            await Terminal.updateOrCreate({ id: result.id }, { id: result.id, serial: result.serial_number })

            return result.serial_number
        }
    }

    public async cadastrar({ request, response, auth }) {
        try {
            await auth.use('web').authenticate()

            const dados = await request.validate({
                schema: schema.create({
                    id: schema.string(),
                    nome: schema.string(),
                    cnpj: schema.number(),
                })
            })

            await EstabelecimentosMesh.updateOrCreate({ id: dados.id }, dados)

            return response.status(201).send('Estabelecimento inserido com sucesso')

        } catch (error) {
            handleErrorResponse(response, error)
        }
    }

    public async vincularTerminal({ request, response, auth }) {
        try {
            await auth.use('web').authenticate()

            const dados = await request.validate({
                schema: schema.create({
                    serial: schema.string(),
                    descricao: schema.string()
                })
            })

            const options = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://api.zoop.ws/v1/card-present/terminals/search?serial_number=${dados.serial}`,
                headers: {
                    accept: 'application/json',
                    authorization: 'Basic ' + this.apiKey
                }
            }

            const result = await api(options)

            if (!result) throw new Error("Terminal não encontrado");

            await Terminal.updateOrCreate({ id: result.id }, { id: result.id, serial: result.serial_number, descricao: dados.descricao })

            return response.status(201).send("Terminal vinculado com sucesso")
        } catch (error) {
            handleErrorResponse(response, error)
        }
    }

    public async buscarTransacoes({ response, params, auth }) {
        try {
            await auth.use('web').authenticate()
            const usuario = await auth.use('web').user

            const terminal = await Terminal.query()

            const estabelecimentos = usuario.estabelecimento !== null
                ? await EstabelecimentosMesh.query().whereIn('id', usuario.estabelecimento).orderBy('nome', 'asc')
                : await EstabelecimentosMesh.query().orderBy('nome', 'asc')

            const { dataInicial, dataFinal } = params
            const date_range_gte_formatado = moment(dataInicial + "T04:00:00.000Z").toISOString()
            const date_range_lte_formatado = moment(dataFinal + "T03:59:59.999Z").add(1, 'day').toISOString()

            const retorno = new Array()

            for (const item of estabelecimentos) {
                const transacoes = await this.consultarTransacoes(date_range_gte_formatado, date_range_lte_formatado, item.id)
                retorno.push({
                    estabelecimento: item.nome,
                    cnpj: item.cnpj,
                    saldo: {
                        quantidade: transacoes.length,
                        total: transacoes.reduce((total, item) => total = total + parseFloat(item.amount), 0).toFixed(2),
                        tarifa: transacoes.reduce((total, item) => total = total + parseFloat(item.fees), 0).toFixed(2),
                        saldo: transacoes.reduce((total, item) => total = total + (parseFloat(item.amount) - parseFloat(item.fees)), 0).toFixed(2),
                        transacoes: await Promise.all(transacoes.map(async (item) => {
                            const descricaoTerminal = await this.buscarTerminal(item, terminal);
                            return (
                                {
                                    id: item.id,
                                    total: item.amount,
                                    forma_pagamento: (this.tipoPagamento(item.payment_type)),
                                    primeiros_digitos: item.payment_method.first4_digits,
                                    ultimos_digitos: item.payment_method.last4_digits,
                                    data: moment(item.updated_at).format('DD/MM/YYYY'),
                                    hora: moment(item.updated_at).format('HH:mm:ss'),
                                    terminal: descricaoTerminal,
                                    taxa: item.fees
                                }
                            )
                        }))
                    }
                })
            }
            return response.status(200).send(retorno)
        } catch (error) {
            handleErrorResponse(response, error)
        }
    }

    private async consultarTransacoes(date_range_gte_formatado: string, date_range_lte_formatado: string, id: string) {
        let page = 1
        let nextPage = true

        let transacoes = new Array()

        while (nextPage) {
            let filter = `?limit=1000&page=${page}&offset=0&date_range[gte]=${date_range_gte_formatado}&date_range[lte]=${date_range_lte_formatado}&status=succeeded`

            const options = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://api.zoop.ws/v1/marketplaces/${this.marketplace}/sellers/${id}/transactions${filter}`,
                headers: {
                    accept: 'application/json',
                    authorization: 'Basic ' + this.apiKey
                }
            }

            const result = await api(options)

            if (result.items) {
                transacoes.push(...result.items)
                page < result.total_pages ? page++ : nextPage = false
            }
        }

        return transacoes
    }
}