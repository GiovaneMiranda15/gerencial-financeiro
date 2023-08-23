import { BaseModel, beforeSave, column } from "@ioc:Adonis/Lucid/Orm"
import { formatString } from "App/Utils/Format"
import { DateTime } from "luxon"

export default class Terminal extends BaseModel {
  static table = "terminal"

  @column({ isPrimary: true })
  public id: string

  @column()
  public serial: string

  @column()
  public descricao: string | null

  @column()
  public tipo: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async format(estabelecimento: Terminal) {
    estabelecimento.descricao = formatString(estabelecimento.descricao)
  }
}
