import { BaseModel, beforeSave, column } from "@ioc:Adonis/Lucid/Orm"
import { formatString } from "App/Utils/Format"
import { DateTime } from "luxon"

export default class EstabelecimentosMesh extends BaseModel {
  static table = "estabelecimentos_mesh"

  @column({ isPrimary: true })
  public id: string

  @column()
  public nome: string | null

  @column()
  public cnpj: string | null

  @column()
  public tipo: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async format(estabelecimento: EstabelecimentosMesh) {
    estabelecimento.nome = formatString(estabelecimento.nome)
    estabelecimento.cnpj = formatString(estabelecimento.cnpj)
  }
}
