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
}

document.addEventListener("DOMContentLoaded", () => {
  validarToken();

  // Carrega lista de produtos no select ao iniciar
  carregarProdutos();

  const menuItems = document.querySelectorAll(".menu-item");
  const secoes = document.querySelectorAll(".secao-conteudo");

  // Elementos do pedido
  const produtoSelect = document.getElementById("produto");
  const quantidadeInput = document.getElementById("quantidade");
  const listaPedido = document.getElementById("lista-pedido");
  const totalSpan = document.getElementById("total");
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
        carregarPedidos();
      } else if (sec === "resumo") {
        carregarResumoDia();
      } else if (sec === "sair") {
        localStorage.removeItem("token");
        setTimeout(() => window.location.href = "login.html", 1500);
      }
    });
  });

  // abre aba inicial
  menuItems[0].click();

  // Adiciona item à lista de pedido
  botaoAdicionar.addEventListener("click", () => {
    const opc = produtoSelect.options[produtoSelect.selectedIndex];
    const nome = opc.text;
    const preco = parseFloat(opc.value);
    const qtd = parseInt(quantidadeInput.value, 10);
    if (isNaN(preco)) {
      alert("Selecione um produto válido");
      return;
    }
    if (qtd <= 0) {
      alert("Quantidade deve ser maior que zero");
      return;
    }
    const sub = preco * qtd;
    total += sub;
    const li = document.createElement("li");
    li.dataset.produto = nome;
    li.dataset.quantidade = qtd;
    li.dataset.valor = preco;
    li.innerHTML = `
      ${nome} x${qtd} — R$${preco.toFixed(2)}
      <button class="btn-remover-item">🗑️</button>
    `;
    listaPedido.appendChild(li);
    totalSpan.textContent = total.toFixed(2);
    quantidadeInput.value = 1;

    // Adiciona evento para remover item
    li.querySelector(".btn-remover-item").addEventListener("click", () => {
      total -= preco * qtd;
      totalSpan.textContent = total.toFixed(2);
      li.remove();
    });
  });

  // Finaliza pedido (implementação refatorada)
  document.getElementById("finalizar").addEventListener("click", finalizarPedido);

  async function finalizarPedido() {
    const token = localStorage.getItem("token");
    const nomeCliente = document.getElementById('nome-cliente').value.trim();
    const comanda = parseInt(document.getElementById('comanda-cliente').value, 10);
    const itensPedido = Array.from(document.querySelectorAll('#lista-pedido li'));
    const mensagem = document.getElementById("mensagem-pedido") || criarMensagem();

    // Validações
    if (!nomeCliente) {
      mensagem.textContent = "Informe o nome do cliente";
      mensagem.style.color = "red";
      return;
    }

    if (isNaN(comanda)) {
      mensagem.textContent = "Informe um número de comanda válido";
      mensagem.style.color = "red";
      return;
    }

    if (itensPedido.length === 0) {
      mensagem.textContent = "Adicione pelo menos um item ao pedido";
      mensagem.style.color = "red";
      return;
    }

    try {
      // Formata dados
      const agora = new Date();
      const dataPedido = agora.toISOString().split('T')[0];
      const horaPedido = agora.toTimeString().split(' ')[0];

      // Monta itens
      const itens = itensPedido.map(item => ({
        produto: item.dataset.produto,
        quantidade: parseInt(item.dataset.quantidade),
        valor_unitario: parseFloat(item.dataset.valor)
      }));

      // Calcula total
      const valorTotal = itens.reduce((total, item) =>
        total + (item.quantidade * item.valor_unitario), 0);

      // Monta payload
      const payload = {
        Data_pedido: dataPedido,
        Hora_pedido: horaPedido,
        Valor_total_pedido: valorTotal,
        Forma_pagamento: document.querySelector('input[name="forma-pagamento"]:checked')?.value || "Indefinido",
        E_delivery: document.getElementById('check-delivery').checked,
        Observacao: document.getElementById('observacao-pedido').value || "",
        Id_cliente: comanda,
        Id_func: obterIdFuncionario(),
        itens: itens
      };

      // Envia pedido
      const response = await fetch('http://localhost:8000/integration/pedido/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro ${response.status} ao registrar pedido`);
      }

      // Sucesso
      const data = await response.json();
      mensagem.textContent = `Pedido registrado com sucesso!`;
      mensagem.style.color = "green";

      // Limpa formulário
      limparFormulario();

      // Atualiza dashboard
      carregarResumoDia();

    } catch (error) {
      console.error("Erro detalhado:", error);
      mensagem.textContent = `Falha: ${error.message}`;
      mensagem.style.color = "red";
    }
  }

  function limparFormulario() {
    document.getElementById('nome-cliente').value = '';
    document.getElementById('comanda-cliente').value = '';
    document.getElementById('lista-pedido').innerHTML = '';
    document.getElementById('total').textContent = '0.00';
    document.getElementById('observacao-pedido').value = '';
    document.getElementById('check-delivery').checked = false;
    total = 0; // Reseta total global
  }

  // Função auxiliar para obter ID do funcionário
  function obterIdFuncionario() {
    // Implemente conforme seu sistema de autenticação
    return 1; // Exemplo fixo - substitua pelo valor real
  }

  // Filtro de pedidos
  document.getElementById("btn-filtrar").addEventListener("click", carregarPedidos);
  document.getElementById("btn-limpar-filtro").addEventListener("click", () => {
    document.getElementById("filtro-data").value = "";
    carregarPedidos();
  });

  // Carrega lista de pedidos
  async function carregarPedidos() {
    const token = localStorage.getItem("token");
    const filtroData = document.getElementById("filtro-data").value;
    let url = "http://localhost:8000/integration/pedido/";

    if (filtroData) {
      url += `?data=${filtroData}`;
    }

    try {
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Falha ao buscar pedidos");

      const pedidos = await res.json();
      const tbody = document.querySelector("#consultar-secao tbody");
      tbody.innerHTML = "";

      pedidos.forEach(pedido => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${pedido.Id_pedido}</td>
          <td>${pedido.Data_pedido}</td>
          <td>${pedido.Hora_pedido}</td>
          <td>R$ ${pedido.Valor_total_pedido.toFixed(2)}</td>
          <td>${pedido.Forma_pagamento}</td>
          <td>${pedido.E_delivery ? 'Sim' : 'Não'}</td>
          <td>${pedido.Id_cliente}</td>
          <td>${pedido.Id_func}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      document.querySelector("#consultar-secao tbody").innerHTML =
        `<tr><td colspan="8">Erro ao carregar pedidos</td></tr>`;
    }
  }

  async function carregarEstoque() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8000/integration/estoque", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Falha ao carregar estoque");

      const data = await res.json();
      const tbody = document.querySelector(".tabela-estoque tbody");
      tbody.innerHTML = "";

      data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.nome}</td>
          <td>${item.tipo}</td>
          <td class="quantidade">${item.quantidade}</td>
          <td>${item.peso}g</td>
          <td>R$ ${item.preco.toFixed(2)}</td>
          <td>
            <button class="btn-adicionar" data-nome="${item.nome}">+</button>
            <button class="btn-remover" data-nome="${item.nome}">-</button>
          </td>
        `;
        tbody.appendChild(row);
      });

      // Adiciona os eventos depois de criar toda a tabela
      tbody.querySelectorAll(".btn-adicionar").forEach(btn => {
        btn.addEventListener("click", () => {
          alterarEstoque(btn.dataset.nome, "adicionar", 1);
        });
      });

      tbody.querySelectorAll(".btn-remover").forEach(btn => {
        btn.addEventListener("click", () => {
          alterarEstoque(btn.dataset.nome, "remover", 1);
        });
      });

    } catch (error) {
      console.error("Erro ao carregar estoque:", error);
      const tbody = document.querySelector(".tabela-estoque tbody");
      tbody.innerHTML = `<tr><td colspan="6">Erro ao carregar dados do estoque.</td></tr>`;
    }
  }

  // Envia alteração de estoque
  async function alterarEstoque(produto, acao, quantity) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `http://localhost:8000/integration/estoque/${encodeURIComponent(produto)}/alterar?acao=${acao}&quantity=${quantity}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.ok) {
        carregarEstoque();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Erro: ${err.detail || "Falha ao alterar estoque"}`);
      }
    } catch (error) {
      alert("Erro de conexão ao alterar estoque");
    }
  }

  async function carregarProdutos() {
    const select = document.getElementById("produto");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:8000/integration/estoque", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error();

      const produtos = await res.json();
      select.innerHTML = "";

      produtos.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.preco;
        opt.textContent = `${p.nome} (${p.tipo}) - R$ ${p.preco.toFixed(2)}`;
        opt.dataset.id = p.id;
        select.appendChild(opt);
      });

    } catch {
      select.innerHTML = `<option value="">Erro ao carregar produtos</option>`;
    }
  }

  async function carregarResumoDia() {
    try {
      const token = localStorage.getItem("token");

      // 1. Carrega todos os dados em paralelo para melhor performance
      const [resTotal, resPedidos, resCategorias] = await Promise.all([
        fetch('http://localhost:8000/integration/pedido/total-hoje/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:8000/integration/pedido/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:8000/carrinho/contagem-categorias', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // 2. Processa os totais do dia
      if (resTotal.ok) {
        const dataTotal = await resTotal.json();
        document.getElementById('lucro-dia').textContent =
          dataTotal.total.toFixed(2).replace('.', ',');
      }

      // 3. Processa os pedidos
      let pedidos = [];
      if (resPedidos.ok) {
        pedidos = await resPedidos.json();

        // Atualiza totais
        document.getElementById('total-pedidos').textContent = pedidos.length;

        // Calcula pedidos delivery
        const deliveryCount = pedidos.filter(p => p.E_delivery).length;
        document.getElementById('total-delivery').textContent = deliveryCount;

        // Calcula ticket médio se houver pedidos
        if (pedidos.length > 0) {
          const totalVendas = pedidos.reduce((sum, p) => sum + p.Valor_total_pedido, 0);
          const ticketMedio = totalVendas / pedidos.length;
          document.getElementById('ticket-medio').textContent =
            `R$ ${ticketMedio.toFixed(2).replace('.', ',')}`;
        }
      }

      // 4. Processa as categorias
      if (resCategorias.ok) {
        const categoriasData = await resCategorias.json();
        const categoriasVendas = categoriasData.categorias || {};

        // Define todas as categorias possíveis com valores padrão 0
        const categoriasCompletas = {
          'lancamento': 0,
          'acompanhamento': 0,
          'sobremesa': 0,
          'bebida': 0,
          'outros': 0,
          ...categoriasVendas
        };

        // Encontra o valor máximo para normalizar as barras
        const maxValue = Math.max(...Object.values(categoriasCompletas));

        // Encontra a categoria mais vendida
        let topCategoria = '';
        let topValue = 0;

        // Atualiza a exibição para cada categoria
        for (const [categoria, valor] of Object.entries(categoriasCompletas)) {
          const elementoValor = document.getElementById(`value-${categoria}`);
          const elementoBarra = document.getElementById(`bar-${categoria}`);

          if (elementoValor && elementoBarra) {
            elementoValor.textContent = valor;

            // Calcula a largura da barra proporcional ao valor máximo
            const largura = maxValue > 0 ? (valor / maxValue * 100) : 0;
            elementoBarra.style.width = `${largura}%`;

            // Atualiza categoria mais vendida
            if (valor > topValue) {
              topValue = valor;
              topCategoria = categoria;
            }
          }
        }

        // Atualiza destaque da categoria mais vendida
        if (topCategoria) {
          const labels = {
            'lancamento': 'Lançamentos',
            'acompanhamento': 'Acompanhamentos',
            'sobremesa': 'Sobremesas',
            'bebida': 'Bebidas',
            'outros': 'Outros'
          };
          document.getElementById('top-categoria').textContent = labels[topCategoria];
        }
      }

    } catch (error) {
      console.error("Erro ao carregar resumo do dia:", error);

      // Mostra mensagem de erro no console e para o usuário
      const errorMsg = document.createElement('div');
      errorMsg.className = 'error-message';
      errorMsg.textContent = 'Erro ao carregar dados. Tente recarregar a página.';
      document.getElementById('resumo-secao').appendChild(errorMsg);

      // Remove a mensagem após 5 segundos
      setTimeout(() => {
        if (errorMsg.parentNode) {
          errorMsg.parentNode.removeChild(errorMsg);
        }
      }, 5000);
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