/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import "./routes/cart"
| import "./routes/customer"
|
*/

import Route from "@ioc:Adonis/Core/Route"

Route.get("/", async ({ response }) => {
  return response.redirect("login")
})

Route.get("login", async ({ view, response, auth }) => {
  try {
    await auth.use("web").authenticate()
    response.redirect("dashboard")
  } catch (error) {
    return view.render("pages/login")
  }
}).as("login")

Route.get("dashboard", async ({ view, auth }) => {
  try {
    await auth.use("web").authenticate()

    return view.render("pages/home")

  } catch (error) {
    return view.render("pages/login")
  }
}).as("dashboard")

// Api
Route.group(() => {
  Route.group(() => {
    Route.post("logout", "UsuarioController.logout")
    Route.post("login", "UsuarioController.login")
    Route.post("cadastrar", "UsuarioController.cadastrar")
  }).prefix("usuario")

  Route.group(() => {
    Route.post("transacao/:dataInicial/:dataFinal", "IntegracaoMeshController.buscarTransacoes")
    Route.post("cadastrar", "IntegracaoMeshController.cadastrar")
    Route.post("estabelecimentos", "IntegracaoMeshController.buscarEstabelecimento")
    Route.post("vincular", "IntegracaoMeshController.vincularTerminal")
  }).prefix("mesh")

  Route.group(() => {
    Route.post("transacao/:dataInicial/:dataFinal", "IntegracaoUseController.buscarRecebimentos")
    Route.post("cadastrar", "IntegracaoUseController.cadastrar")
    Route.post("estabelecimentos", "IntegracaoUseController.buscarEstabelecimento")
    Route.post("repasse/:identificador", "IntegracaoUseController.repasse")
  }).prefix("use")
}).prefix("api")