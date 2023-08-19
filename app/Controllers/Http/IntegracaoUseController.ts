import { schema } from '@ioc:Adonis/Core/Validator'
import EstabelecimentosUse from "App/Models/EstabelecimentoUse";
import api from "App/Utils/Api";
import { handleErrorResponse } from "App/Utils/HandleErrorResponse";

export default class IntegracaoUseController {

    public async cadastrar({ request, response, auth }) {
        try {
            await auth.use('web').authenticate()

            const dados = await request.validate({
                schema: schema.create({
                    id: schema.string(),
                    nome: schema.string(),
                    cnpj: schema.string(),
                    chave: schema.string()
                })
            })

            await EstabelecimentosUse.updateOrCreate({ id: dados.id }, dados)

            return response.status(201).send('Estabelecimento inserido com sucesso')

        } catch (error) {
            handleErrorResponse(response, error)
        }
    }

    public buscarEstabelecimento = async ({ response, auth }) => {
        try {
            await auth.use('web').authenticate()

            const estabelecimentos = await EstabelecimentosUse.query()

            return response.status(200).send(estabelecimentos)

        } catch (error) {
            handleErrorResponse(response, error)
        }
    }

    public async buscarRecebimentos({ response, params, auth }) {
        try {
            await auth.use('web').authenticate()

            const estabelecimentos = await EstabelecimentosUse.query().orderBy('nome', 'asc')

            // Variável para armazenar os dados
            const dados: any[] = [];

            // Loop pelos estabelecimentos
            for (const item of estabelecimentos) {
                const recebimentos = await this.consultarRecebimentos(item, params);
                const saldo_final = await this.consultarSaldo(item);

                // Função para criar o array de transações
                const criarArrayTransacoes = async (recebimentos: any[]) => {
                    const transacoes: any[] = [];

                    for (const itemRecebimento of recebimentos) {
                        for (const pagamento of itemRecebimento.pagamentos) {
                            transacoes.push({
                                cliente: itemRecebimento.sacado_razao,
                                valor_boleto: itemRecebimento.valor_cobranca,
                                pedido: itemRecebimento.pedido_numero,
                                observacao: itemRecebimento.observacao,
                                origem: itemRecebimento.tipo_cobranca,
                                forma_pagamento: pagamento.origem_pagamento,
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

                // Montagem dos dados
                dados.push({
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


            return response.status(200).send(dados)
        } catch (error) {
            handleErrorResponse(response, error)
        }
    }

    private async consultarRecebimentos(item: any, params: any) {
        try {
            const { dataInicial, dataFinal } = params
            const options = {
                method: 'post',
                maxBodyLength: Infinity,
                url: `https://api.useboletos.com.br/credenciados/v1/${item.id}/cobrancas-pagas`,
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

    private async consultarSaldo(item: any) {
        try {
            const options = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://api.useboletos.com.br/credenciados/v1/${item.id}/saldo`,
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