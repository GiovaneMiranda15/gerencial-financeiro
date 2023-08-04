import EstabelecimentosUse from "App/Models/EstabelecimentoUse";
import api from "App/Utils/Api";
import { handleErrorResponse } from "App/Utils/HandleErrorResponse";

export default class IntegracaoUseController {

    public async buscarRecebimentos({ response, params, auth }) {
        try {
            await auth.use('web').authenticate()

            const dados: any = []

            const estabelecimentos = await EstabelecimentosUse.query().orderBy('nome', 'asc')

            for (const item of estabelecimentos) {
                const recebimentos = await this.consultarRecebimentos(item, params)
                const saldo_final = await this.consultarSaldo(item)
                dados.push({
                    establishment: item.nome, cnpj: item.cnpj,
                    saldo: {
                        quantidade: recebimentos.length,
                        total: recebimentos.reduce((total: number, item: { pagamentos: { valor_pago: string; }[]; }) => total = total + parseFloat(item.pagamentos[0].valor_pago), 0).toFixed(2),
                        tarifa: recebimentos.reduce((total: number, item: { valor_pago: string; valor_liquido_credenciado: string; }) => total = total + (parseFloat(item.valor_pago) - parseFloat(item.valor_liquido_credenciado)), 0).toFixed(2),
                        saldo: recebimentos.reduce((total: number, item: { pagamentos: { valor_liquido_credenciado: string; }[]; }) => total = total + parseFloat(item.pagamentos[0].valor_liquido_credenciado), 0).toFixed(2),
                        saldo_final: saldo_final,
                        recebimentos: await Promise.all(recebimentos.map(async (item) => {
                            return (
                                {
                                   item
                                }
                            )
                        }))
                    }
                })
            }

            return response.status(200).send(dados)
        } catch (error) {
            handleErrorResponse(response, error)
        }
    }

    public async consultarRecebimentos(item: any, params: any) {
        try {
            const { dataInicial, dataFinal } = params
            const options = {
                method: 'post',
                maxBodyLength: Infinity,
                url: `https://api.useboletos.com.br/credenciados/v1/${item.identificador}/cobrancas-pagas`,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Credenciado-Chave': item.chave
                },
                params: {
                    data_inicio: dataInicial,
                    data_fim: dataFinal,
                }
            }

            const result = await api(options)

            return result

        } catch (error) {
            return error
        }
    }

    public async consultarSaldo(item: any) {
        try {
            const options = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://api.useboletos.com.br/credenciados/v1/${item.identificador}/saldo`,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Credenciado-Chave': item.chave
                }
            }

            const result = await api(options)
            return result.saldo_atual

        } catch (error) {
            return error
        }
    }

    public async repasse({ request, response, auth }) {
        try {
            await auth.use('web').authenticate();
            const estabelecimento = await EstabelecimentosUse.query().where('cnpj', request.requestBody.cnpj).first()

            if (estabelecimento) {
                const options = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: `https://api.useboletos.com.br/credenciados/v1/${estabelecimento.id}/repasse`,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Credenciado-Chave': estabelecimento.chave
                    },
                }
                return await api(options).then(() => {
                    return response.status(200).send({ message: "Repasse solicitado" })
                }).catch(() => {
                    return response.status(400).send({ message: "Não foi possivel realizar o repasse" })
                })

            } else {
                return response.status(404).send({ message: "Estabelecimento não encontrado" })
            }
        } catch (error) {
            handleErrorResponse(response, error)
        }
    }
}