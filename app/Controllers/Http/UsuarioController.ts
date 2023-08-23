import { schema } from "@ioc:Adonis/Core/Validator"
import Usuario from "App/Models/Usuario"
import { handleErrorResponse } from "App/Utils/HandleErrorResponse"

export default class UsuarioController {

    // Função para cadastrar o usuário!
    public async cadastrar({ request, response, auth }) {
        try {
            // Verifica  se usuário está autenticado!
            await auth.use("web").authenticate()

            // Valida os dados informados!
            const dados = await request.validate({
                schema: schema.create({
                    nome: schema.string(),
                    cpf: schema.string(),
                    password: schema.string(),
                    tipo: schema.number(),
                    estabelecimentos: schema.array().members(
                        schema.string()
                    )
                })
            })


            dados.cpf = dados.cpf.replace(/[^0-9]/g, "")

            // Atualiza ou insere o usuário de acordo com o cpf informado!
            await Usuario.updateOrCreate({ cpf: dados.cpf }, dados)

            // Retorna mensagem de sucesso!
            return response.status(201).send({ status: true, mensagem: "Usuário inserido com sucesso" })
        } catch (error) {
            // Chama a função de verificação do erro!
            handleErrorResponse(response, error)
        }
    }

    // Função para login!
    public async login({ request, response, auth }) {
        try {
            // Valida os dados informados!
            const dados = await request.validate({
                schema: schema.create({
                    cpf: schema.string(),
                    senha: schema.string()
                })
            })

            const { cpf, senha } = dados

            // Autentica se o mesmo possui cadastro
            await auth.use("web").attempt(cpf.replace(/[.-]/g, ""), senha)

            // Retorna mensagem de sucesso!
            return response.status(200).send({ status: true, mensagem: "Usuário logado com sucesso!" })
        } catch (error) {
            // Chama a função de verificação do erro!
            handleErrorResponse(response, error)
        }
    }

    // Função para logout!
    public async logout({ response, auth }) {
        try {
            // Realiza o logout!
            await auth.use("web").logout()

            // Retorna mensagem de sucesso!
            return response.status(200).send({ status: true, mensagem: "Usuário deslogado com sucesso!" })
        } catch (error) {
            // Chama a função de verificação do erro!
            handleErrorResponse(response, error)
        }
    }
}
