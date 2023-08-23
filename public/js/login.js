document.addEventListener("DOMContentLoaded", function () {
    const modalAlerts = document.querySelector(".login-modal-alerts");

    function exibirAlerta(tipo, mensagem) {
        const alert = document.createElement("div");
        alert.classList.add("alert", `alert-${tipo}`, "login-modal-alert");
        alert.setAttribute("role", "alert");
        alert.innerText = mensagem;
        modalAlerts.appendChild(alert);

        setTimeout(() => {
            modalAlerts.removeChild(alert);
        }, 2000); // Remove o alerta após 2 segundos
    }
    
    $("#cpf").inputmask("999.999.999-99", { placeholder: "___.___.___-__" });

    document.getElementById("btn-submit").addEventListener("click", async function (event) {
        event.preventDefault(); // Impede o envio normal do formulário

        const form = document.querySelector(".login-form");
        const formData = new FormData(form);

        try {
            const response = await fetch("/api/usuario/login", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.status === false) {
                exibirAlerta("danger", data.mensagem);
            } else {
                window.location.href = "/dashboard";
            }
        } catch (error) {
            console.error("Erro na solicitação:", error);
        }
    });
});
