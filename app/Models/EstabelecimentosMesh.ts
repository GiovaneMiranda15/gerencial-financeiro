import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { DateTime } from 'luxon'

export default class EstabelecimentosMesh extends BaseModel {
  static table = 'estabelecimentos_mesh'

  @column({ isPrimary: true })
  public id: string

  @column()
  public nome: string

  @column()
  public cnpj: string

  @column()
  public tipo: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
