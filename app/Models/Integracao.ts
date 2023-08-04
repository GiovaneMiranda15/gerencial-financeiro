import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Integracao extends BaseModel {
  static table = 'integracao'

  @column({ isPrimary: true })
  public id: number

  @column()
  public tipo: number

  @column()
  public chave: string

  @column()
  public identificador: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
