import { schema } from '@ioc:Adonis/Core/Validator'
import Usuario from 'App/Models/Usuario'
import { handleErrorResponse } from 'App/Utils/HandleErrorResponse'

export default class UsuarioController {

    public async cadastrar({ request, response, auth }) {
        try {
            await auth.use('web').authenticate()

            const dados = await request.validate({
                schema: schema.create({
                    cpf: schema.string(),
                    password: schema.string(),
                    tipo: schema.number(),
                    estabelecimento: schema.array().members(
                        schema.string()
                    )
                })
            })

            dados.cpf = dados.cpf.replace(/[^0-9]/g, '')

            await Usuario.updateOrCreate({ cpf: dados.cpf }, dados)

            return response.status(201).send('Usuário inserido com sucesso')

        } catch (error) {
            handleErrorResponse(response, error)
        }
    }

    public async ativar({ response, params, auth }) {
        try {
            await auth.use('web').authenticate()

            const usuario = await Usuario.findOrFail(params.id)

            usuario.merge({ ativo: !usuario.ativo })

            await usuario.save()

            return response.status(201).send('Usuário atualizado com sucesso')

        } catch (error) {
            handleErrorResponse(response, error)
        }
    }

    public async login({ request, response, auth }) {
        try {
            const dados = await request.validate({
                schema: schema.create({
                    cpf: schema.string(),
                    senha: schema.string()
                })
            })

            const { cpf, senha } = dados

            
            await auth.use('web').attempt(cpf.replace(/[.-]/g, ''), senha)

            return response.redirect().toRoute('dashboard')

        } catch (error) {
            handleErrorResponse(response, error)
        }
    }

    public async logout({ response, auth }) {
        try {
            await auth.use('web').logout()
            return response.redirect().toRoute('login')
        } catch (error) {
            handleErrorResponse(response, error)
        }
    }
}
