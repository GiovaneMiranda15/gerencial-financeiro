document.addEventListener("DOMContentLoaded", function () {
    const modalAlerts = document.querySelector(".login-modal-alerts");
    const logoutButton = document.getElementById("logout-button");
    const opcaoVincular = document.getElementById("vincular");
    const opcaoEsZoop = document.getElementById("estabelecimento-zoop");
    const opcaoEsUse = document.getElementById("estabelecimento-use");
    const opcaoDsZoop = document.getElementById("dashboard-zoop");
    const opcaoDsUse = document.getElementById("dashboard-use");
    const opcaoUsuario = document.getElementById("opcao-usuario");
    const modalCadastro = new bootstrap.Modal(document.getElementById("modalCadastro"));
    const tituloModal = document.querySelector("#modalCadastro .modal-title");
    const corpoModal = document.querySelector("#modalCadastro .modal-body");
    const filtro = document.querySelector(".dashboard-title");

    const cnpjUseInput = $('#cnpj-use');
    const cnpjZoopInput = $('#cnpj-zoop');
    const cpfUsuarioInput = $('#cpf-usuario');

    cnpjUseInput.inputmask('99.999.999/9999-99', { placeholder: '__.___.___/____-__' });
    cnpjZoopInput.inputmask('99.999.999/9999-99', { placeholder: '__.___.___/____-__' });
    cpfUsuarioInput.inputmask('999.999.999-99', { placeholder: '___.___.___-__' });

    async function fetchEstabelecimentos() {
        try {
            const response = await fetch('/api/mesh/estabelecimentos', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Erro na requisição');
            }

            const estabelecimentos = await response.json();
            return estabelecimentos;
        } catch (error) {
            console.error('Erro ao buscar estabelecimentos:', error);
            return [];
        }
    }

    function populateEstabelecimentosSelect() {
        fetchEstabelecimentos()
            .then(estabelecimentos => {
                const selectElement = document.querySelector('.select-estabelecimento');

                estabelecimentos.dados.forEach(estabelecimento => {
                    const option = document.createElement('option');
                    option.value = estabelecimento.id;
                    option.text = `${estabelecimento.nome} - CNPJ: ${estabelecimento.cnpj}`;
                    selectElement.appendChild(option);
                });

                $('.select-estabelecimento').select2({
                    placeholder: "Selecione um estabelecimento (opcional)"
                });
            });
    }

    function logout() {
        fetch("/api/usuario/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then(() => {
                window.location.href = "/login";
            })
            .catch(error => {
                console.error("Erro no logout:", error);
            });
    }

    function validaPermissoes() {
        const auth = document.getElementById("info-usuario").getAttribute("data-auth");
        const opcaoUse = document.getElementById("opcao-use");
        const opcaoUsuario = document.getElementById("opcao-usuario");
        const subEstabelecimento = document.getElementById("estabelecimento-zoop");

        if (auth == 0) {
            opcaoUsuario.style.display = "inline";
            opcaoUse.style.display = "inline";
            subEstabelecimento.style.display = "inline";
        }
    }

    const handleOpcaoClick = (formularioSelecionado, tituloModalSelecionado, dataModal) => {
        document.getElementById(formularioSelecionado).style.display = "block";
        tituloModal.textContent = tituloModalSelecionado;
        corpoModal.setAttribute("data-modal", dataModal);
        modalCadastro.show();
    };

    opcaoVincular.addEventListener("click", () => {
        handleOpcaoClick("vincular-terminal", "Vincular Terminal", "vincular-terminal");
    });

    opcaoUsuario.addEventListener("click", () => {
        handleOpcaoClick("cadastro-usuario", "Cadastrar Usuário", "cadastro-usuario");
    });

    opcaoEsUse.addEventListener("click", () => {
        handleOpcaoClick("cadastro-estabelecimento-use", "Cadastrar Estabalecimento USE", "cadastro-estabelecimento-use");
    });

    opcaoEsZoop.addEventListener("click", () => {
        handleOpcaoClick("cadastro-estabelecimento-zoop", "Cadastrar Estabalecimento ZOOP", "cadastro-estabelecimento-zoop");
    });

    opcaoDsZoop.addEventListener("click", () => {
        filtro.innerHTML = "Dashboard Zoop";
        filtro.setAttribute("data-dashboard", "ZOOP");
        document.getElementById("data-inicial").value = new Date().toISOString().slice(0, 10);
        document.getElementById("data-final").value = new Date().toISOString().slice(0, 10);
        atualizarPagina(false);
    });

    opcaoDsUse.addEventListener("click", () => {
        filtro.innerHTML = "Dashboard Use";
        filtro.setAttribute("data-dashboard", "USE");
        document.getElementById("data-inicial").value = new Date().toISOString().slice(0, 10);
        document.getElementById("data-final").value = new Date().toISOString().slice(0, 10);
        atualizarPagina(false);
    });

    logoutButton.addEventListener("click", () => {
        logout();
    });

    validaPermissoes();
    populateEstabelecimentosSelect();
});
