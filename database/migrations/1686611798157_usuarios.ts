import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'usuario'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('nome', 150).notNullable()
      table.string('cpf', 11).notNullable().unique()
      table.string('senha', 255).notNullable()
      table.specificType('estabelecimentos', 'varchar[]').nullable()
      table.integer('tipo').notNullable().defaultTo(0)
      table.boolean('ativo').notNullable().defaultTo(true)
      table.string('remember_me_token').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
