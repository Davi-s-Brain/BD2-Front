document.addEventListener("DOMContentLoaded", () => {
  const botoesMenu = document.querySelectorAll(".menu-item");
  const secoes = document.querySelectorAll(".secao-conteudo");

  // Função de controle das seções do menu lateral
  botoesMenu.forEach(botao => {
    botao.addEventListener("click", () => {
      // Alterna a aba ativa
      botoesMenu.forEach(b => b.classList.remove("ativo"));
      botao.classList.add("ativo");

      // Exibe apenas a seção correspondente
      const secaoId = botao.getAttribute("data-secao");
      secoes.forEach(sec => {
        sec.style.display = sec.id === `${secaoId}-secao` ? "block" : "none";
      });
    });
  });

  // Função que atualiza pedidos e o valor de cada item
    const produtoSelect = document.getElementById("produto");
    const quantidadeInput = document.getElementById("quantidade");
    const listaPedido = document.getElementById("lista-pedido");
    const totalSpan = document.getElementById("total");
    const botaoAdicionar = document.getElementById("adicionar");

    let total = 0;

    botaoAdicionar.addEventListener("click", () => {
    const produto = produtoSelect.options[produtoSelect.selectedIndex];
    const nome = produto.text;
    const preco = parseFloat(produto.getAttribute("data-preco"));
    const quantidade = parseInt(quantidadeInput.value);

    if (quantidade < 1 || isNaN(quantidade)) {
        alert("Quantidade inválida");
        return;
    }

    const subtotal = preco * quantidade;
    total += subtotal;

    const item = document.createElement("li");
    item.textContent = `${nome} x${quantidade} — R$${subtotal.toFixed(2)}`;
    listaPedido.appendChild(item);

    totalSpan.textContent = total.toFixed(2);
    quantidadeInput.value = 1;
    });

    // Botão finalizar (pode ser expandido para salvar pedido ou limpar)
    document.getElementById("finalizar").addEventListener("click", () => {
    if (total === 0) {
        alert("Nenhum item adicionado.");
        return;
    }
    alert("Pedido finalizado com sucesso!");
    listaPedido.innerHTML = "";
    total = 0;
    totalSpan.textContent = "0.00";
    });

    // Função que adiciona ou remove itens do estoque -> atualiza qtd
    const botoesAumentar = document.querySelectorAll(".btn-adicionar");
    const botoesDiminuir = document.querySelectorAll(".btn-remover");

    botoesAumentar.forEach(botao => {
        botao.addEventListener("click", () => {
        const linha = botao.closest("tr");
        const campoQtd = linha.querySelector(".quantidade");
        let valor = parseInt(campoQtd.textContent, 10);
        campoQtd.textContent = valor + 1;
        });
    });

    botoesDiminuir.forEach(botao => {
        botao.addEventListener("click", () => {
        const linha = botao.closest("tr");
        const campoQtd = linha.querySelector(".quantidade");
        let valor = parseInt(campoQtd.textContent, 10);
        if (valor > 0) {
            campoQtd.textContent = valor - 1;
        }
        });
    });


});







