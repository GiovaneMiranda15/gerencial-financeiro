    var fetchedData = []; // Armazenar os dados obtidos da API
    function atualizarPagina(filtrado) {
        document.querySelector(".print-button-container").style.display = filtrado ? "block" : "none";
        document.querySelector(".view-buttons").style.display = filtrado ? "block" : "none";
        document.querySelector(".data-fieldset").style.display = filtrado ? "block" : "none";
        document.querySelector(".info").style.display = filtrado ? "none" : "block";
    }

    function updateTableContent(headers) {
        return headers.map(header => `<th>${header}</th>`).join('');
    }

    async function fetchTransacoes(filtro, dataInicial, dataFinal) {
        try {
            const url = filtro !== 'USE' ? `/api/mesh/transacao/${dataInicial}/${dataFinal}` : `/api/use/transacao/${dataInicial}/${dataFinal}`;
            const response = await fetch(url, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Erro na requisição');
            }

            atualizarPagina(true)
            const estabelecimentos = await response.json();
            return estabelecimentos.dados;
        } catch (error) {
            const modalAlerts = document.querySelector(".modal-alerts-dashboard");
            const alert = document.createElement("div");
            alert.classList.add("alert", "alert-danger", "modal-alert-dashboard");
            alert.setAttribute("role", "alert");

            alert.innerText = "Erro ao buscar transações!"

            modalAlerts.appendChild(alert);

            setTimeout(() => {
                modalAlerts.removeChild(alert);
            }, 2000);
            return [];
        }
    }

    function exibirComprovante(transacaoData) {
        const existingModal = document.getElementById("comprovanteModal");
if (existingModal) {
    existingModal.remove();
}

        const modalContent = `
    <style>
    body {
      font-family: Arial, sans-serif;
    }
    .receipt {
      border: 2px solid #333;
      padding: 20px;
      width: 300px;
      margin: 0 auto;
    }
    .receipt-header {
      text-align: center;
      margin-bottom: 10px;
    }
    .receipt-info {
      margin-bottom: 20px;
    }
    .receipt-details {
      font-size: 14px;
    }
    .receipt-details span {
      font-weight: bold;
    }
    .thank-you {
      text-align: center;
      margin-top: 20px;
    }
  </style>
<div class="modal fade" id="comprovanteModal" tabindex="-1" aria-labelledby="comprovanteModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="comprovanteModalLabel">Comprovante de Pagamento</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="comprovante-header">
                    
                </div>
                <hr style="width:100%">
                <div class="comprovante-details">
                    <div class="receipt">
                        <div class="receipt-header">
                        <h3>Comprovante de Pagamento</h3>
                        </div>
                        <div class="receipt-info">
                         <img src="/img/logo-verde.png" alt="Logo Pax Primavera" style="heigth:60px; width:80px">
                        <p><b>Dados do vendedor</b></p>
                        <p><span>Pax Primavera ${transacaoData.cnpj}</span></p>
                        </div>
                        <div class="receipt-details">
                        <p><b>Detalhes do Pagamento</b></p>
                        <p>${transacaoData.transacoes.data} ${transacaoData.transacoes.hora}</p>
                        <p> R$ ${transacaoData.transacoes.total}  ${transacaoData.transacoes.forma_pagamento}</p>
                        <p>Portador: ${transacaoData.transacoes.cliente}</p>
                        <p>Número do Cartão: **** **** **** ${transacaoData.transacoes.ultimos_digitos}</p>
                        <p>Transação: ${transacaoData.transacoes.id}</p>
                        </div>
                    </div>
                </div>
                <hr style="width:100%">
                <div class="comprovante-footer">
                  
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
            </div>
        </div>
    </div>
</div>
`;

        // Insira o modal no documento
        const modalContainer = document.createElement("div");
        modalContainer.innerHTML = modalContent;
        document.body.appendChild(modalContainer);

        // Abra o modal
        const comprovanteModal = new bootstrap.Modal(document.getElementById("comprovanteModal"));
        comprovanteModal.show();
    }

    const confirmButton = document.getElementById("confirmButton");
    const cancelButton = document.getElementById("cancelButton");


    document.addEventListener("DOMContentLoaded", function () {
  // Armazene as seleções feitas pelo usuário
  let selectedEstabelecimentos = [];
  let selectedTipos = [];
  let selectedTerminais = [];

  if (document.querySelector(".dashboard-title").getAttribute("data-dashboard") !== "USE") {
      $('.filtro-terminal').select2({
          placeholder: "Selecione um terminal (opcional)"
      });
  }
  
  $('.filtro-estabelecimento').select2({
      placeholder: "Selecione um estabelecimento (opcional)"
  });

  $('.filtro-tipo').select2({
      placeholder: "Selecione uma forma de pagamento (opcional)"
  });

  // Quando o modal é exibido
  $('#modalFiltro').on('shown.bs.modal', function () {
      // Defina os valores selecionados nos elementos select2
      $('.filtro-estabelecimento').val(selectedEstabelecimentos).trigger('change');
      $('.filtro-tipo').val(selectedTipos).trigger('change');
      $('.filtro-terminal').val(selectedTerminais).trigger('change');
  });

  // Quando o modal é fechado
  $('#modalFiltro').on('hidden.bs.modal', function () {
      // Atualize as seleções feitas pelo usuário
      selectedEstabelecimentos = $('.filtro-estabelecimento').val();
      selectedTipos = $('.filtro-tipo').val();
      selectedTerminais = $('.filtro-terminal').val();
      
      // Remova as classes do modal aberto anteriormente
      $("body").removeClass("modal-open");
      $(".modal-backdrop").remove();
  });
        document.getElementById("data-inicial").value = new Date().toISOString().slice(0, 10)
        document.getElementById("data-final").value = new Date().toISOString().slice(0, 10)
        const btnFiltrar = document.getElementById("filtro");
        const modalFiltro = new bootstrap.Modal(document.getElementById("modalFiltro"));
        const tituloModal = document.querySelector("#modalFiltro .modal-title");
        const filtro = document.querySelector(".dashboard-title");
        const buttonFiltro = document.querySelector(".filter-button");
        const allButton = document.getElementById("view-all");
        const detailedButton = document.getElementById("view-detailed");
        const dataTable = document.getElementById("data-table");
        const btnfiltrarTransacoes = document.getElementById("filtrarTransacoes")
        const btnLimparFiltro = document.getElementById("limparFiltro")
        const btnImprimirTransacoes = document.getElementById("imprimir")

        filtro.innerHTML = filtro.getAttribute("data-dashboard") !== 'USE' ? 'Dashboard Zoop' : "Dashboard Use";

        atualizarPagina(false);

        btnFiltrar.addEventListener("click", () => {
            const selectElement = document.querySelector('.filtro-estabelecimento');
            const selectElementTipo = document.querySelector('.filtro-tipo');
            const selectElementTerminal = document.querySelector('.filtro-terminal');
            if (filtro.getAttribute("data-dashboard") !== "USE") {
                document.getElementById("hora-inicial").style.display = "inline"
                document.getElementById("hora-final").style.display = "inline"
                document.getElementById("valor-inicial").style.display = "inline"
                document.getElementById("valor-final").style.display = "inline"
                document.getElementById("cliente").style.display = "inline"
                document.getElementById("contrato").style.display = "none"
                document.getElementById("observacao").style.display = "none"
                document.getElementById("cartao").style.display = "inline"
                document.getElementById("filtro-tipo").style.display = "inline"
                document.getElementById("filtro-estabelecimento").style.display = "inline"
                document.getElementById("filtro-terminal").style.display = "inline"

            } else {
                document.getElementById("hora-inicial").style.display = "none"
                document.getElementById("hora-final").style.display = "none"
                document.getElementById("valor-inicial").style.display = "inline"
                document.getElementById("valor-final").style.display = "inline"
                document.getElementById("cliente").style.display = "inline"
                document.getElementById("contrato").style.display = "inline"
                document.getElementById("observacao").style.display = "inline"
                document.getElementById("cartao").style.display = "none"
                document.getElementById("filtro-tipo").style.display = "inline"
                document.getElementById("filtro-estabelecimento").style.display = "inline"


                $('.filtro-terminal').removeClass('select2-hidden-accessible');
                $('.filtro-terminal').removeClass('select2-offscreen');
                $('.filtro-terminal').removeClass('select2');
                $('.filtro-terminal').removeAttr('aria-hidden');
                $('.filtro-terminal').removeAttr('data-select2-id');
                $('.filtro-terminal').next('.select2-container').remove();
                document.getElementById("filtro-terminal").style.display = "none"

            }
            selectElement.innerHTML = "";
            selectElementTipo.innerHTML = "";
            selectElementTerminal.innerHTML = "";
            let formaPagamento = new Set();
            let terminal = new Set()
            fetchedData.forEach(estabelecimento => {
                const option = document.createElement('option');
                option.value = estabelecimento.estabelecimento;
                option.text = `${estabelecimento.estabelecimento} - CNPJ: ${estabelecimento.cnpj}`;
                selectElement.appendChild(option);
                estabelecimento.saldo.transacoes.forEach(item => {
                    formaPagamento.add(item.forma_pagamento)
                    terminal.add(item.terminal)
                })
            });

            new Set(formaPagamento).forEach(item => {
                const optionTipo = document.createElement('option');
                optionTipo.value = item;
                optionTipo.text = item;
                selectElementTipo.appendChild(optionTipo);
            })


            if (filtro.getAttribute("data-dashboard") !== "USE") {
                new Set(terminal).forEach(item => {
                    const optionTerminal = document.createElement('option');
                    optionTerminal.value = item;
                    optionTerminal.text = item;
                    selectElementTerminal.appendChild(optionTerminal);
                })
            }

            const tituloModalSelecionado = "Filtrar transações";
            tituloModal.textContent = tituloModalSelecionado;
            modalFiltro.show();
        });

        buttonFiltro.addEventListener("click", async () => {
            const modalAlerts = document.querySelector(".modal-alerts-dashboard");
            const alert = document.createElement("div");
            let dataInicial = document.getElementById('data-inicial').value
            let dataFinal = document.getElementById('data-final').value

            if ((dataInicial && dataFinal) && (dataFinal >= dataInicial)) {
                const loadingModal = document.querySelector(".loading-modal");
                loadingModal.style.display = "flex";
                fetchedData = await fetchTransacoes(filtro.getAttribute("data-dashboard"), dataInicial, dataFinal);
                loadingModal.style.display = "none";
                buscarTransacoes("total");
            } else {
                alert.classList.add("alert", "alert-danger", "modal-alert-dashboard");
                alert.setAttribute("role", "alert");

                alert.innerText = "O período informado é inválido"

                modalAlerts.appendChild(alert);

                setTimeout(() => {
                    modalAlerts.removeChild(alert);
                }, 2000);
            }
        });

        allButton.addEventListener("click", () => {
            buscarTransacoes("total");
            btnFiltrar.style.display = "none"
            allButton.classList.add("active-view");
            detailedButton.classList.remove("active-view");
            btnImprimirTransacoes.setAttribute("data-mode", "total")
        });

        detailedButton.addEventListener("click", () => {
            buscarTransacoes("detailed");
            btnFiltrar.style.display = "inline"
            detailedButton.classList.add("active-view");
            allButton.classList.remove("active-view");
            btnImprimirTransacoes.setAttribute("data-mode", "detailed")
        });

        btnLimparFiltro.addEventListener('click', () => {

            document.getElementById("hora-inicial").value = "";
            document.getElementById("hora-final").value = "";
            document.getElementById("valor-inicial").value = "";
            document.getElementById("valor-final").value = "";
            document.getElementById("cliente").value = "";
            document.getElementById("contrato").value = "";
            document.getElementById("observacao").value = "";
            document.getElementById("cartao").value = "";

            // Limpe as seleções dos elementos select2
            $('.filtro-estabelecimento').val(null).trigger('change');
            $('.filtro-tipo').val(null).trigger('change');
            $('.filtro-terminal').val(null).trigger('change');

            buscarTransacoes('detailed')
        })

        btnfiltrarTransacoes.addEventListener("click", () => { buscarTransacoes('detailed') })

        btnImprimirTransacoes.addEventListener("click", () => { imprimir(btnImprimirTransacoes.getAttribute("data-mode")) })

        document.querySelector(".data-transacoes").addEventListener("click", function (event) {
            if (event.target.classList.contains("comprovante-button")) {
                const transacaoData = JSON.parse(event.target.getAttribute("data-transacao"));
                exibirComprovante(transacaoData);
            }
            if (event.target.classList.contains("repasse-button")) {
                const repasseData = JSON.parse(event.target.getAttribute("data-repasse"));
                var confirmed = confirm("Deseja realmente solicitar o repasse para o CNPJ " + repasseData.cnpj + "?");

                if (confirmed) {
                    fetch('/repasse', {
                        method: 'POST',
                        body: JSON.stringify({ identificador: repasseData.id }),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(response => response.json())
                        .then(data => {
                            alert(data.message)
                            location.reload()
                        })
                        .catch(error => {
                            console.log(error.message)
                        });
                }
               
            }
        });

        function buscarTransacoes(viewMode) {
            let qtd=0;
            let valorTotal=0.00;
            const quantidadeTotal = document.getElementById('quantidade-total')
            const total =document.getElementById('valor-total')
            const dataTransacoes = document.querySelector(".data-transacoes");
            const headerTransacoes = document.querySelector(".header-transacoes");
            dataTransacoes.innerHTML = '';
            headerTransacoes.innerHTML = '';
            quantidadeTotal.innerHTML='';
            total.innerHTML='';
            const newRowCabecalho = document.createElement("tr");
            if (viewMode === "total") {
                newRowCabecalho.innerHTML = filtro.getAttribute("data-dashboard") !== 'USE'
                    ? `<th>Estabelecimento</th><th>Cnpj</th><th>Saldo</th><th>Quant.</th><th>Total Pago</th><th>Total Taxa</th>`
                    : `<th>Estabelecimento</th><th>Cnpj</th><th>Saldo</th><th>Quant.</th><th>Total Pago</th><th>Total Taxa</th><th>Ação</th>`;
            } else {
                newRowCabecalho.innerHTML = filtro.getAttribute("data-dashboard") !== 'USE'
                    ? `<th>Estabelecimento</th><th>Data/Hora</th><th>Tipo</th><th>Valor</th><th>Taxa</th><th>Terminal</th><th>Cliente</th><th>Cartão</th>`
                    : `<th>Estabelecimento</th><th>Cliente</th><th>Valor Boleto</th><th>N. Pedido</th><th>Contrato</th><th>Data Doc.</th><th>Data Venc.</th><th>Data Pag.</th><th>Tipo Pag.</th><th>Valor Pago</th><th>Valor Taxa</th>`;
            }
            headerTransacoes.appendChild(newRowCabecalho);

            let horaInicial = document.getElementById("hora-inicial").value
            let horaFinal = document.getElementById("hora-final").value
            let valorInicial = document.getElementById("valor-inicial").value
            let valorFinal = document.getElementById("valor-final").value
            let cliente = document.getElementById("cliente").value
            let observacao = document.getElementById("observacao").value
            let contrato = document.getElementById("contrato").value
            let cartao = document.getElementById("cartao").value
            let filtroTipo = Array.from(document.querySelectorAll('.filtro-tipo option:checked')).map(option => option.value)
            let filtroEstabelecimento = Array.from(document.querySelectorAll('.filtro-estabelecimento option:checked')).map(option => option.value)
            let filtroTerminal = Array.from(document.querySelectorAll('.filtro-terminal option:checked')).map(option => option.value)

            fetchedData.forEach(item => {
                const newRow = document.createElement("tr");
                if (viewMode === "total") {
                    newRow.innerHTML = filtro.getAttribute("data-dashboard") !== 'USE'
                        ? `<td>${item.estabelecimento}</td><td>${item.cnpj}</td><td>R$ ${item.saldo.saldo}</td><td>${item.saldo.quantidade}</td><td>R$ ${item.saldo.total}</td><td>R$ ${item.saldo.tarifa}</td>`
                        : `<td>${item.estabelecimento}</td><td>${item.cnpj}</td><td>R$ ${item.saldo.saldo}</td><td>${item.saldo.quantidade}</td><td>R$ ${item.saldo.total}</td><td>R$ ${item.saldo.tarifa}</td><td><button data-repasse='${JSON.stringify({id:item.id, cnpj: item.cnpj})}' class="repasse-button">Solicitar Repasse</button>`
                } else if (viewMode === "detailed") {
                    item.saldo.transacoes.forEach(transacao => {
                        const newTransacaoRow = document.createElement("tr");

                        const isFiltered =
                            (!horaInicial || (transacao.hora >= horaInicial)) &&
                            (!horaFinal || (transacao.hora <= horaFinal)) &&
                            (!valorInicial || (parseFloat(transacao.total) >= parseFloat(valorInicial))) &&
                            (!valorFinal || (parseFloat(transacao.total) <= parseFloat(valorFinal))) &&
                            (!cliente || (transacao.cliente.toLowerCase().includes(cliente.toLowerCase()))) &&
                            (!observacao || (transacao.pedido.toLowerCase().includes(observacao.toLowerCase()))) &&
                            (!contrato || (transacao.observacao.toLowerCase().includes(contrato.toLowerCase()))) &&
                            (!cartao || (transacao.primeiros_digitos.toLowerCase().includes(cartao.toLowerCase())) || (transacao.ultimos_digitos.toLowerCase().includes(cartao.toLowerCase()))) &&
                            (filtroTipo.length === 0 || filtroTipo.includes(transacao.forma_pagamento)) &&
                            (filtroEstabelecimento.length === 0 || filtroEstabelecimento.includes(item.estabelecimento)) &&
                            (filtroTerminal.length === 0 || filtroTerminal.includes(transacao.terminal));
                        if (filtro.getAttribute("data-dashboard") !== 'USE' && isFiltered) {
                            newTransacaoRow.innerHTML = `<td>${item.estabelecimento}</td><td>${transacao.data} ${transacao.hora}</td><td>${transacao.forma_pagamento}</td><td>${transacao.total}</td><td>${transacao.taxa}</td><td>${transacao.terminal}</td><td>${transacao.cliente}</td> <td>${transacao.primeiros_digitos}*******${transacao.ultimos_digitos}</td><td><button class="comprovante-button" data-transacao='${JSON.stringify({...item, transacoes: transacao})}'>Comprovante</button></td>`;
                        } else if (isFiltered) {
                            newTransacaoRow.innerHTML = `<td>${item.estabelecimento}</td><td>${transacao.cliente}</td><td>R$ ${transacao.valor_boleto}</td><td>${transacao.pedido}</td><td>${transacao.observacao}</td><td>${transacao.data_documento}</td><td>${transacao.data_vencimento}</td><td>${transacao.data_pagamento}</td><td>${transacao.forma_pagamento}</td><td>R$ ${transacao.total}</td><td>R$ ${transacao.taxa}</td>`;
                        }

                        if (isFiltered) {
                            qtd++;
                            valorTotal+=transacao.total
                            dataTransacoes.appendChild(newTransacaoRow);
                        }
                    });
                }

                dataTransacoes.appendChild(newRow);
            });

            if (viewMode !== "total") {
                quantidadeTotal.innerHTML = `<b>Qtd. Filtrado:</b> ${qtd}`
                total.innerHTML = `<b>Total Filtrado:</b> R$ ${parseFloat(valorTotal).toFixed(2)}`
            }

            document.getElementById("transacoes").setAttribute("data-transacoes", fetchedData)
        }

        function imprimir(viewMode) {

            let dataInitial = document.getElementById('data-inicial').value.split('-')
            let dataFinal = document.getElementById('data-final').value.split('-')
            let dateInitialFormatted = dataInitial[2] + '/' + dataInitial[1] + '/' + dataInitial[0]
            let dateFinalFormatted = dataFinal[2] + '/' + dataFinal[1] + '/' + dataFinal[0]
            let printContent = '<h5>Data Inicial: ' + dateInitialFormatted + ' - Data Final: ' + dateFinalFormatted + '</h5>';
            
            
            if (viewMode === "total") {
                printContent += '<table class="print-table">';
                let newRowCabecalho = "<thead><tr>";
                newRowCabecalho += filtro.getAttribute("data-dashboard") !== 'USE'
                    ? `<th>Estabelecimento</th><th>Cnpj</th><th>Saldo</th><th>Quant.</th><th>Total Pago</th><th>Total Taxa</th>`
                    : `<th>Estabelecimento</th><th>Cnpj</th><th>Saldo</th><th>Quant.</th><th>Total Pago</th><th>Total Taxa</th>`;
                printContent += newRowCabecalho;
                printContent += '</tr></thead>'
            } 
            

            let horaInicial = document.getElementById("hora-inicial").value
            let horaFinal = document.getElementById("hora-final").value
            let valorInicial = document.getElementById("valor-inicial").value
            let valorFinal = document.getElementById("valor-final").value
            let cliente = document.getElementById("cliente").value
            let observacao = document.getElementById("observacao").value
            let contrato = document.getElementById("contrato").value
            let cartao = document.getElementById("cartao").value
            let filtroTipo = Array.from(document.querySelectorAll('.filtro-tipo option:checked')).map(option => option.value)
            let filtroEstabelecimento = Array.from(document.querySelectorAll('.filtro-estabelecimento option:checked')).map(option => option.value)
            let filtroTerminal = Array.from(document.querySelectorAll('.filtro-terminal option:checked')).map(option => option.value)
            printContent += viewMode !== 'total'? '<tbody>':''
            fetchedData.forEach(item => {

                if (viewMode === "total") {
                    let newRow = "<tr>";
                    newRow += filtro.getAttribute("data-dashboard") !== 'USE'
                        ? `<td>${item.estabelecimento}</td><td>${item.cnpj}</td><td>R$ ${item.saldo.saldo}</td><td>${item.saldo.quantidade}</td><td>R$ ${item.saldo.total}</td><td>R$ ${item.saldo.tarifa}</td>`
                        : `<td>${item.estabelecimento}</td><td>${item.cnpj}</td><td>R$ ${item.saldo.saldo}</td><td>${item.saldo.quantidade}</td><td>R$ ${item.saldo.total}</td><td>R$ ${item.saldo.tarifa}</td>`
                    printContent += newRow;
                    printContent += "</tr>"
                    
                } else if (viewMode === "detailed") {
                    printContent += '<h2>' + item.estabelecimento + ' CNPJ '+ item.cnpj +'- Total recebido: R$ ' + item.saldo.total + '</h2>';
                    printContent += '<hr size="6">';

                    let grupo = []
                    item.saldo.transacoes.forEach(transacao => {
                        const isFiltered =
                            (!horaInicial || (transacao.hora >= horaInicial)) &&
                            (!horaFinal || (transacao.hora <= horaFinal)) &&
                            (!valorInicial || (parseFloat(transacao.total) >= parseFloat(valorInicial))) &&
                            (!valorFinal || (parseFloat(transacao.total) <= parseFloat(valorFinal))) &&
                            (!cliente || (transacao.cliente.toLowerCase().includes(cliente.toLowerCase()))) &&
                            (!observacao || (transacao.pedido.toLowerCase().includes(observacao.toLowerCase()))) &&
                            (!contrato || (transacao.observacao.toLowerCase().includes(contrato.toLowerCase()))) &&
                            (!cartao || (transacao.primeiros_digitos.toLowerCase().includes(cartao.toLowerCase())) || (transacao.ultimos_digitos.toLowerCase().includes(cartao.toLowerCase()))) &&
                            (filtroTipo.length === 0 || filtroTipo.includes(transacao.forma_pagamento)) &&
                            (filtroEstabelecimento.length === 0 || filtroEstabelecimento.includes(item.estabelecimento)) &&
                            (filtroTerminal.length === 0 || filtroTerminal.includes(transacao.terminal));
                        if (filtro.getAttribute("data-dashboard") !== 'USE' && isFiltered) {
                            let tr = grupo.findIndex((terminal) => terminal.terminal == transacao.terminal)
                            if(tr!==-1){
                                grupo[tr].total+= parseFloat(transacao.total),
                                grupo[tr].pix+= transacao.forma_pagamento === 'PIX' ? parseFloat(transacao.total) : 0,
                                grupo[tr].credito+= transacao.forma_pagamento === 'CRÉDITO' ? parseFloat(transacao.total): 0,
                                grupo[tr].debito+= transacao.forma_pagamento === 'DÉBITO' ? parseFloat(transacao.total): 0,
                                grupo[tr].outros+= transacao.forma_pagamento === 'OUTROS' ? parseFloat(transacao.total): 0,
                                grupo[tr].transacoes = [...grupo[tr].transacoes, transacao]
                            }else{
                                grupo.push(
                                    {
                                        terminal: transacao.terminal,
                                        total :parseFloat(transacao.total),
                                        pix: transacao.forma_pagamento === 'PIX' ? parseFloat(transacao.total) : 0,
                                        credito: transacao.forma_pagamento === 'CRÉDITO' ? parseFloat(transacao.total): 0,
                                        debito: transacao.forma_pagamento === 'DÉBITO' ? parseFloat(transacao.total): 0,
                                        outros: transacao.forma_pagamento === 'OUTROS' ? parseFloat(transacao.total): 0,
                                        transacoes: [transacao]
                                    }
                                )
                            }
                        }
                    });

                    grupo.forEach((gr)=>{                
                        printContent +=
                          '<h3>Terminal: ' +
                          gr.terminal +
                          ' - Total recebido: R$ ' +
                          gr.total +
                          '</h3>' 
                        
                          
                          printContent += '<li>Credito: R$ ' + gr.credito + '</li>';
                          printContent += '<li>Debito: R$ ' + gr.debito + '</li>';
                          printContent += '<li>Pix: R$ ' + gr.pix + '</li>';
                          printContent += '<li>Outros: R$ ' + gr.outros + '</li>';
                          printContent += '<br>'
                         
                            for (let it = 0; it < gr.transacoes.length; it++) {
                            printContent += '<p>Data/Hora: ' + gr.transacoes[it].data +' '+gr.transacoes[it].hora+'  -   Valor Pago: R$ ' + gr.transacoes[it].total + '  -  Forma Pagamento: '+ gr.transacoes[it].forma_pagamento +'</p>';
                            }
                        
                        printContent += '</ul>';
                        printContent += '<hr size="2" noshade>';
                      }
                    )
                        
                }


            });
            printContent += viewMode !== 'total'? '</tbody></table>':''
            var printWindow = window.open('', '_blank');
            printWindow.document.open();
            printWindow.document.write('<html><head><title>Relatório Zoop</title>');
            printWindow.document.write('<style>');
            printWindow.document.write('.print-table { border-collapse: collapse; }');
            printWindow.document.write('.print-table th, .print-table td { border: 1px solid black; padding: 5px; }');
            printWindow.document.write('</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();

            printWindow.print();

        }
    });
