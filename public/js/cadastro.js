document.addEventListener("DOMContentLoaded", function () {
    const btnSalvar = document.querySelector("#modalCadastro .btn-primary");
    const modalAlerts = document.querySelector(".modal-alerts");

    // Função para exibir um alerta temporário
    function exibirAlerta(tipo, mensagem) {
        const alert = document.createElement("div");
        alert.classList.add("alert", `alert-${tipo}`, "login-modal-alert");
        alert.setAttribute("role", "alert");
        alert.innerText = mensagem;
        modalAlerts.appendChild(alert);

        setTimeout(() => {
            modalAlerts.removeChild(alert);
            if (tipo === "success") {
                $("#myModal").modal("hide");
            }
        }, 2000); // Remove o alerta após 2 segundos
    }

    btnSalvar.addEventListener("click", async () => {
        try {
            const modalBody = document.querySelector('.modal-body');
            const modalContent = modalBody.getAttribute("data-modal");

            const formData = {};

            switch (modalContent) {
                case "cadastro-estabelecimento-zoop":
                case "cadastro-estabelecimento-use":
                    formData.id = document.getElementById(`identificador-${modalContent.split('-')[2]}`).value;
                    formData.nome = document.getElementById(`nome-${modalContent.split('-')[2]}`).value;
                    formData.cnpj = document.getElementById(`cnpj-${modalContent.split('-')[2]}`).value;
                    if (modalContent === "cadastro-estabelecimento-use") {
                        formData.chave = document.getElementById('chave-use').value;
                    }
                    break;
                case "cadastro-usuario":
                    formData.nome = document.getElementById('nome-usuario').value;
                    formData.cpf = document.getElementById('cpf-usuario').value;
                    formData.password = document.getElementById('password-usuario').value;
                    formData.tipo = document.getElementById('tipo-usuario').value;
                    formData.estabelecimentos = Array.from(document.querySelectorAll('.select-estabelecimento option:checked')).map(option => option.value);
                    break;
                case "vincular-terminal":
                    formData.serial = document.getElementById('serie').value;
                    formData.descricao = document.getElementById('descricao').value;
                    formData.tipo = document.getElementById('tipo').value;
                    break;
                default:
                    break;
            }

            const response = await fetch(`/api/${modalContent.split('-')[2]}/cadastrar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData)
            });

            const responseData = await response.json();

            if (responseData.status === false) {
                exibirAlerta("danger", responseData.mensagem);
            } else {
                exibirAlerta("success", responseData.mensagem);
            }

        } catch (error) {
            console.log(error);
            exibirAlerta("danger", error.mensagem);
        }
    });

    $("#modalCadastro").on("hidden.bs.modal", function () {
        $("body").removeClass("modal-open");
        $(".modal-backdrop").remove();

        const fieldsToReset = ["identificador-use", "nome-use", "cnpj-use", "chave-use", "identificador-zoop", "nome-zoop", "cnpj-zoop", "tipo-zoop", "serie", "tipo", "descricao", "nome-usuario", "cpf-usuario", "password-usuario", "tipo-usuario"];

        fieldsToReset.forEach(field => {
            document.getElementById(field).value = "";
        });

        // Limpe as seleções dos elementos select2
        $('.select-estabelecimento').val(null).trigger('change');

        const sectionsToHide = ['vincular-terminal', 'cadastro-usuario', 'cadastro-estabelecimento-zoop', 'cadastro-estabelecimento-use'];
        sectionsToHide.forEach(section => {
            document.getElementById(section).style.display = 'none';
        });
    });
});
