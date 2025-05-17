async function validarToken() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const res = await fetch("http://localhost:8000/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    window.location.href = "login.html";
  }
  localStorage.removeItem("token");

}

validarToken();

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
    const preco = parseFloat(produto.value); // Agora o value é o preço!
    const quantidade = parseInt(quantidadeInput.value);

    const subtotal = preco * quantidade;
    total += subtotal

// Crie o <li> atribuindo todos os dados que vai precisar depois:
    const item = document.createElement("li");

    item.dataset.produto = nome;
    item.dataset.quantidade = quantidade;
    item.dataset.valor = preco; // Valor unitário do produto
    item.textContent = `${nome} x${quantidade} — R$${preco}`;
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

// Lógica de troca de seções no menu
document.querySelectorAll(".menu-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".secao-conteudo").forEach(secao => secao.style.display = "none");
    const secao = item.getAttribute("data-secao");
    document.getElementById(`${secao}-secao`).style.display = "block";

    if (secao === "estoque") carregarEstoque();
  });
});

async function carregarEstoque() {
  const token = localStorage.getItem("token");
  const res = await fetch("http://localhost:8000/integration/estoque", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const tbody = document.querySelector(".tabela-estoque tbody");

  if (res.ok) {
    const data = await res.json();
    tbody.innerHTML = ""; // limpa antes de preencher

    data.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.description}</td>
        <td class="quantidade">${item.quantity}</td>
        <td>
          <button class="btn-adicionar" data-produto="${item.name}">+</button>
          <button class="btn-remover" data-produto="${item.name}">-</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Adiciona event listeners nos botões após preencher
    document.querySelectorAll(".btn-adicionar").forEach((btn) => {
      btn.addEventListener("click", () => alterarEstoque(btn.dataset.produto, "adicionar", 1));
    });

    document.querySelectorAll(".btn-remover").forEach((btn) => {
      btn.addEventListener("click", () => alterarEstoque(btn.dataset.produto, "remover", 1));
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="4">Erro ao carregar estoque.</td></tr>`;
  }
}
async function alterarEstoque(produto, acao, quantity) {

  const response = await fetch(
    `http://localhost:8000/integration/estoque/${encodeURIComponent(produto)}/alterar?acao=${acao}&quantity=${quantity}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (response.ok) {
    await carregarEstoque(); // Atualiza a tabela com os dados atualizados
  } else {
    const error = await response.json();
    alert(`Erro: ${error.detail || "Falha ao alterar estoque"}`);
  }
}
document.getElementById("finalizar").addEventListener("click", async () => {
  const nome = document.getElementById("nome-cliente").value.trim();
  const id = parseInt(document.getElementById("comanda-cliente").value);
  const token = localStorage.getItem("token");
  const lista = document.querySelectorAll("#lista-pedido li");
  const mensagem = document.getElementById("mensagem-pedido") || criarMensagem();

  if (!nome || isNaN(id) || lista.length === 0) {
    mensagem.textContent = "Preencha os dados corretamente antes de finalizar o pedido.";
    mensagem.style.color = "red";
    return;
  }

  let sucesso = true;

  for (const item of lista) {
    const produto = item.dataset.produto;
    const quantidade = parseInt(item.dataset.quantidade);

    const res = await fetch("http://localhost:8000/integration/order/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: nome,
        id: id,
        product: produto,
        quantity: quantidade,
        value : value
      }),
    });

    if (!res.ok) {
      sucesso = false;
      const data = await res.json();
      mensagem.textContent = `Erro ao registrar item: ${produto} (${data.detail || res.status})`;
      mensagem.style.color = "red";
      break;
    }
  }

  if (sucesso) {
    mensagem.textContent = "Pedido finalizado com sucesso!";
    mensagem.style.color = "green";
    document.getElementById("lista-pedido").innerHTML = "";
    document.getElementById("total").textContent = "0.00";
  }
});
async function carregarProdutos() {
  const select = document.getElementById("produto");
  const token = localStorage.getItem("token");

  try {
    const res = await fetch("http://localhost:8000/integration/estoque", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Erro ao carregar produtos");
    }

    const produtos = await res.json();
    select.innerHTML = ""; // limpa antes de preencher

    produtos.forEach(produto => {
      const option = document.createElement("option");
      option.value = produto.value; // Aqui, value = valor/preço recebido do backend
      option.textContent = produto.name;
      option.setAttribute("data-preco", produto.value); // (opcional, para manter compatibilidade)
      select.appendChild(option);
    });

  } catch (err) {
    console.error(err);
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Erro ao carregar produtos";
    select.appendChild(option);
  }
}

// Chame essa função quando a página carregar
window.addEventListener("DOMContentLoaded", carregarProdutos);

function criarMensagem() {
  const p = document.createElement("p");
  p.id = "mensagem-pedido";
  p.style.marginTop = "10px";
  document.getElementById("registrar-secao").appendChild(p);
  return p;
}




});