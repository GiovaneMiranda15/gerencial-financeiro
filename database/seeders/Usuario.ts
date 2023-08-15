import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Usuario from 'App/Models/Usuario'
const dados = {
  nome: 'Administrador',
  cpf: '000.000.000-00',
  password: '123789',
  estabelecimento: null,
  tipo: 0,
}

export default class extends BaseSeeder {
  public async run() {
    await Usuario.updateOrCreate({ cpf: dados.cpf.replace(/[^0-9]/g, '') }, dados)
  }
}
