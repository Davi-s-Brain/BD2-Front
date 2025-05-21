// Valida token e redireciona se inválido
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
    return;
  }
  localStorage.removeItem("token");

}

validarToken();

document.addEventListener("DOMContentLoaded", () => {
  // Carrega lista de produtos no select ao iniciar
  carregarProdutos();

  const menuItems = document.querySelectorAll(".menu-item");
  const secoes    = document.querySelectorAll(".secao-conteudo");

  // Elementos do pedido
  const produtoSelect = document.getElementById("produto");
  const quantidadeInput = document.getElementById("quantidade");
  const listaPedido   = document.getElementById("lista-pedido");
  const totalSpan     = document.getElementById("total");
  const botaoAdicionar = document.getElementById("adicionar");
  let total = 0;

  // Gerencia troca de abas
  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      // ativa item
      menuItems.forEach(i => i.classList.remove("ativo"));
      item.classList.add("ativo");
      // exibe seção
      const sec = item.getAttribute("data-secao");
      secoes.forEach(s => {
        s.style.display = (s.id === `${sec}-secao`) ? "block" : "none";
      });
      // chama ações específicas
      if (sec === "estoque") {
        carregarEstoque();
      } else if (sec === "consultar") {
        fetchOrders();
      }
    });
  });
  // abre aba inicial
  menuItems[0].click();

  // Adiciona item à lista de pedido
  botaoAdicionar.addEventListener("click", () => {
    const opc = produtoSelect.options[produtoSelect.selectedIndex];
    const nome  = opc.text;
    const preco = parseFloat(opc.value);
    const qtd   = parseInt(quantidadeInput.value, 10);
    if (isNaN(preco) || qtd <= 0) return;
    const sub = preco * qtd;
    total += sub;
    const li = document.createElement("li");
    li.dataset.produto   = nome;
    li.dataset.quantidade = qtd;
    li.dataset.valor     = preco;
    li.textContent = `${nome} x${qtd} — R$${preco.toFixed(2)}`;
    listaPedido.appendChild(li);
    totalSpan.textContent = total.toFixed(2);
    quantidadeInput.value = 1;
  });

  // Finaliza pedido
  document.getElementById("finalizar").addEventListener("click", async () => {
    const nomeCliente = document.getElementById("nome-cliente").value.trim();
    const comanda     = parseInt(document.getElementById("comanda-cliente").value, 10);
    const token       = localStorage.getItem("token");
    const itens       = document.querySelectorAll("#lista-pedido li");
    const mensagem    = document.getElementById("mensagem-pedido") || criarMensagem();
    if (!nomeCliente || isNaN(comanda) || itens.length === 0) {
      mensagem.textContent = "Preencha corretamente antes de finalizar o pedido.";
      mensagem.style.color = "red";
      return;
    }
    let sucesso = true;
    for (const li of itens) {
      const res = await fetch("http://localhost:8000/integration/order/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name:     nomeCliente,
          id:       comanda,
          product:  li.dataset.produto,
          quantity: parseInt(li.dataset.quantidade, 10),
          value:    parseFloat(li.dataset.valor)
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        mensagem.textContent = `Erro ao registrar ${li.dataset.produto}: ${data.detail || res.status}`;
        mensagem.style.color = "red";
        sucesso = false;
        break;
      }
    }
    if (sucesso) {
      mensagem.textContent = "Pedido finalizado com sucesso!";
      mensagem.style.color = "green";
      listaPedido.innerHTML = "";
      total = 0;
      totalSpan.textContent = "0.00";
    }
  });

  async function fetchOrders() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch("http://localhost:8000/integration/order/all", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Falha ao buscar pedidos");
    const orders = await res.json();
    const tbody  = document.querySelector("#consultar-secao tbody");
    tbody.innerHTML = "";
    orders.forEach(o => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${o[0]}</td>
        <td>${o[1]}</td>
        <td>${o[2]}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    document.querySelector("#consultar-secao tbody").innerHTML =
      `<tr><td colspan="3">Erro ao carregar pedidos</td></tr>`;
  }
}

  // Carrega dados de estoque
  async function carregarEstoque() {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:8000/integration/estoque", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const tbody = document.querySelector(".tabela-estoque tbody");
    if (res.ok) {
      const data = await res.json();
      tbody.innerHTML = "";
      data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.name}</td>
          <td>${item.description}</td>
          <td class="quantidade">${item.quantity}</td>
          <td>
            <button class="btn-adicionar" data-produto="${item.name}">+</button>
            <button class="btn-remover"  data-produto="${item.name}">-</button>
          </td>
        `;
        tbody.appendChild(row);
      });
      // Eventos de alteração
      tbody.querySelectorAll(".btn-adicionar").forEach(btn =>
        btn.addEventListener("click", () => alterarEstoque(btn.dataset.produto, "adicionar", 1))
      );
      tbody.querySelectorAll(".btn-remover").forEach(btn =>
        btn.addEventListener("click", () => alterarEstoque(btn.dataset.produto, "remover", 1))
      );
    } else {
      tbody.innerHTML = `<tr><td colspan="4">Erro ao carregar estoque.</td></tr>`;
    }
  }

  // Envia alteração de estoque
  async function alterarEstoque(produto, acao, quantity) {
    const res = await fetch(
      `http://localhost:8000/integration/estoque/${encodeURIComponent(produto)}/alterar?acao=${acao}&quantity=${quantity}`,
      { method: "POST" }
    );
    if (res.ok) {
      carregarEstoque();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(`Erro: ${err.detail || "Falha ao alterar estoque"}`);
    }
  }

  // Carrega opções de produtos no select
  async function carregarProdutos() {
    const select = document.getElementById("produto");
    const token  = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8000/integration/estoque", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const produtos = await res.json();
      select.innerHTML = "";
      produtos.forEach(p => {
        const opt = document.createElement("option");
        opt.value       = p.value;
        opt.textContent = p.name;
        select.appendChild(opt);
      });
    } catch {
      select.innerHTML = `<option value="">Erro ao carregar produtos</option>`;
    }
  }

  // Cria parágrafo de mensagem sob o form de pedido
  function criarMensagem() {
    const p = document.createElement("p");
    p.id = "mensagem-pedido";
    p.style.marginTop = "10px";
    document.getElementById("registrar-secao").appendChild(p);
    return p;
  }
});