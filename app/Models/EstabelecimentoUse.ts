import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

export default class EstabelecimentosUse extends BaseModel {
  static table = 'estabelecimentos_use'

  @column({ isPrimary: true })
  public id: string

  @column()
  public nome: string

  @column()
  public cnpj: string

  @column()
  public chave: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
