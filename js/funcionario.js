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
  // Formulário de ambiente
  const formAmbiente = document.getElementById('form-ambiente');
  if (formAmbiente) {
    formAmbiente.addEventListener('submit', salvarAmbiente);
  }

  // Botão de novo ambiente
  const btnNovo = document.getElementById('btn-novo');
  if (btnNovo) {
    btnNovo.addEventListener('click', limparFormAmbiente);
  }
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
      } else if (sec === "ambientes") {
        carregarAmbientes();
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
        Id_pedido : Date.now() + Math.floor(Math.random() * 1000),
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

function formatarDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function gerarUltimosDias(qtdDias = 7) {
  const datas = [];
  const hoje = new Date();

  for (let i = qtdDias - 1; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - i);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    datas.push(`${ano}-${mes}-${dia}`);
  }

  return datas;
}

async function carregarResumoDia() {
  try {
    const token = localStorage.getItem("token");
    const datas = gerarUltimosDias(8); // últimos 7 dias + hoje
    const headers = { Authorization: `Bearer ${token}` };

    const promessas = datas.map(data =>
      fetch(`http://localhost:8000/integration/pedido/resumo-balanco/?data_inicio=${data}&data_fim=${data}`, {
        headers
      }).then(res => res.ok ? res.json() : { total_vendas: 0 })
    );

    const resultados = await Promise.all(promessas);

    // Atualiza os indicadores com o dia mais recente (hoje)
    const hoje = resultados[7];
    document.getElementById('total-pedidos').textContent = hoje.total_pedidos;
    document.getElementById('lucro-dia').textContent = hoje.total_vendas
      .toFixed(2).replace('.', ',');
    document.getElementById('ticket-medio').textContent =
      `R$ ${hoje.ticket_medio.toFixed(2).replace('.', ',')}`;

    // Monta o gráfico
    const ctx = document.getElementById("grafico-vendas").getContext("2d");
    const grafico = new Chart(ctx, {
      type: "line",
      data: {
        labels: datas.map(d => d.slice(5)), // ex: "06-30"
        datasets: [{
          label: "Vendas Diárias (R$)",
          data: resultados.map(r => r.total_vendas),
          borderColor: "#3498db",
          backgroundColor: "rgba(52,152,219,0.1)",
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          tooltip: { callbacks: {
            label: ctx => `R$ ${ctx.raw.toFixed(2).replace('.', ',')}`
          }}
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: val => `R$ ${val.toFixed(2).replace('.', ',')}`
            }
          }
        }
      }
    });

  } catch (error) {
    console.error("Erro ao carregar resumo do dia:", error);

    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.textContent = 'Erro ao carregar dados. Tente recarregar a página.';
    document.getElementById('resumo-secao').appendChild(errorMsg);

    setTimeout(() => {
      if (errorMsg.parentNode) {
        errorMsg.parentNode.removeChild(errorMsg);
      }
    }, 5000);
  }
}
// ==============================================
// FUNÇÕES PARA GERENCIAMENTO DE AMBIENTES
// ==============================================

const API_BASE = 'http://localhost:8000';
const ambienteSecao = document.getElementById('ambientes-secao');
const loadingAmbientes = document.getElementById('loading-ambientes');
const listaAmbientes = document.getElementById('lista-ambientes');

// Suponha que você armazene o ID da franquia em algum local seguro ao logar:
const franquiaId = 1

function carregarAmbientes() {
  if (!franquiaId) {
    alert('ID da franquia não encontrado.');
    return;
  }

  loadingAmbientes.style.display = 'block';
  listaAmbientes.innerHTML = '';

  fetch(`${API_BASE}/ambiente/?franquia_id=${franquiaId}`)
    .then(resp => {
      if (!resp.ok) throw new Error('Erro na resposta da API');
      return resp.json();
    })
    .then(data => {
      data.forEach(amb => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
          <td>${amb.Id_Amb}</td>
          <td>${amb.Id_franquia}</td>
          <td>${amb.Tamanho_ambiente}</td>
          <td>${amb.Quantidade_desse_ambiente}</td>
          <td>${amb.Nivel_limpeza}</td>
          <td>${amb.Detetizado ? 'Sim' : 'Não'}</td>
          <td>${formatarTipo(amb)}</td>        `;
        listaAmbientes.appendChild(linha);
      });
    })
    .catch(err => {
      console.error('Erro ao carregar ambientes:', err);
      alert('Erro ao carregar ambientes.');
    })
    .finally(() => {
      loadingAmbientes.style.display = 'none';
    });
}

function formatarTipo(amb) {
  if (amb.Salao && amb.Cozinha) return 'Salão e Cozinha';
  if (amb.Salao) return 'Salão';
  if (amb.Cozinha) return 'Cozinha';
  return 'Outro';
}

function deletarAmbiente(idAmbiente) {
  if (!confirm('Deseja excluir este ambiente?')) return;

  fetch(`${API_BASE}/ambiente/${idAmbiente}`, { method: 'DELETE' })
    .then(resp => {
      if (!resp.ok) throw new Error('Erro ao excluir ambiente');
      carregarAmbientes();
    })
    .catch(err => {
      console.error('Erro ao excluir ambiente:', err);
      alert('Erro ao excluir ambiente.');
    });
}

// Controle de menu
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.secao-conteudo').forEach(sec => sec.style.display = 'none');
    document.querySelector(`#${item.dataset.secao}-secao`).style.display = 'block';

    if (item.dataset.secao === 'ambientes') carregarAmbientes();
  });
});
});
