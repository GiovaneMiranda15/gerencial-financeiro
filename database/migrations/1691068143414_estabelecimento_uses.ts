import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'estabelecimentos_use'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary().notNullable()
      table.string('nome', 255).notNullable()
      table.string('cnpj', 18).notNullable()
      table.string('chave', 200).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
