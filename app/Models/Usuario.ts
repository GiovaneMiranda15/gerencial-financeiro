import Hash from "@ioc:Adonis/Core/Hash"
import { BaseModel, beforeSave, column } from "@ioc:Adonis/Lucid/Orm"
import { formatString } from "App/Utils/Format"
import { DateTime } from "luxon"

export default class Usuario extends BaseModel {
  static table = "usuario"

  @column({ isPrimary: true })
  public id: number

  @column()
  public nome: string | null

  @column()
  public cpf: string

  @column({ serializeAs: null, columnName: "senha" })
  public password: string

  @column()
  public estabelecimentos: string[] | null;

  @column()
  public tipo: number;

  @column()
  public ativo: boolean;

  @column()
  public rememberMeToken: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword(usuario: Usuario) {
    usuario.cpf = usuario.cpf.replace(/[^0-9]/g, "")
    usuario.nome = formatString(usuario.nome)
    if (usuario.$dirty.password) {
      usuario.password = await Hash.make(usuario.password)
    }
  }
}
