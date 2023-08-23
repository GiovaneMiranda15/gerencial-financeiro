import { BaseModel, beforeSave, column } from "@ioc:Adonis/Lucid/Orm"
import { formatString } from "App/Utils/Format"
import { DateTime } from "luxon"

export default class EstabelecimentosUse extends BaseModel {
  static table = "estabelecimentos_use"

  @column({ isPrimary: true })
  public id: string

  @column()
  public nome: string | null

  @column()
  public cnpj: string | null

  @column()
  public chave: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async format(estabelecimento: EstabelecimentosUse) {
    estabelecimento.nome = formatString(estabelecimento.nome)
    estabelecimento.cnpj = formatString(estabelecimento.cnpj)
  }
}
