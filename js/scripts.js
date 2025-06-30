document.addEventListener("DOMContentLoaded", async function () {
  const menuLateral = document.querySelector(".menu-lateral");
  const secoesMenu = menuLateral?.querySelectorAll(".secao-menu");
  const username = localStorage.getItem("username");

  async function buscarPrimeiroNome(username) {
    try {
      const resposta = await fetch(`http://localhost:8000/auth/email/${encodeURIComponent(username)}`);
      if (!resposta.ok) {
        throw new Error(`Erro HTTP: ${resposta.status}`);
      }

      const dados = await resposta.json();
      const primeiroNome = dados.Primeiro_nome_client;
      console.log("Primeiro nome do cliente:", primeiroNome);
      return primeiroNome;
    } catch (erro) {
      console.error("Erro ao buscar cliente:", erro);
      return null;
    }
  }

  if (username) {
    const saudacao = document.getElementById("saudacao");
    const primeiroNome = await buscarPrimeiroNome(username);
    if (saudacao && primeiroNome) {
      saudacao.textContent = `Oi, ${primeiroNome}!`;
    }
  }

  secoesMenu.forEach((secao) => {
    secao.addEventListener("click", function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      secoesMenu.forEach((s) => s.classList.remove("ativo"));
      this.classList.add("ativo");

      const secaoId = this.getAttribute("data-secao");
      console.log(`Seção "${secaoId}" foi clicada.`);

      const todasSecoesProdutos = document.querySelectorAll(".lista-produtos");
      todasSecoesProdutos.forEach((sec) => (sec.style.display = "none"));

      const secaoAlvo = document.getElementById(`${secaoId}-secao`);
      if (secaoAlvo) {
        secaoAlvo.style.display = "block";
      } else if (secaoId === "lancamentos") {
        document.getElementById("lancamentos-secao").style.display = "block";
      } else if (secaoId === "acompanhamentos") {
        document.getElementById("acompanhamentos-secao").style.display =
          "block";
      } else if (secaoId === "sobremesas") {
        document.getElementById("sobremesa-secao").style.display = "block";
      } else if (secaoId === "bebidas") {
        document.getElementById("bebidas-secao").style.display = "block";
      }
    });
  });

  // Inicializa exibindo apenas a seção "lancamentos"
  const todasSecoesProdutos = document.querySelectorAll(".lista-produtos");
  todasSecoesProdutos.forEach((sec) => (sec.style.display = "none"));
  const secaoLancamentos = document.getElementById("lancamentos-secao");
  if (secaoLancamentos) {
    secaoLancamentos.style.display = "block";
  }

  // === SERVIÇO DE CARRINHO ===
  const carrinhoService = {
    async obterCarrinho() {
      try {
        const response = await fetch('http://localhost:8000/carrinho/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Erro ao obter carrinho');
        return await response.json();
      } catch (error) {
        console.error('Erro ao obter carrinho:', error);
        return { itens: [] };
      }
    },

    async adicionarItem(item) {
      try {
        const { id_cliente, ...itemClean } = item;

        const response = await fetch(`http://localhost:8000/carrinho/item`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(itemClean)
        });
        if (!response.ok) throw new Error('Erro ao adicionar item');
        return await response.json();
      } catch (error) {
        console.error('Erro ao adicionar item:', error);
        return null;
      }
    },

    async removerItem(idItem) {
      try {
        const response = await fetch(`http://localhost:8000/carrinho/item/${idItem}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Erro ao remover item');
        return await response.json();
      } catch (error) {
        console.error('Erro ao remover item:', error);
        return null;
      }
    }
  };

  // Inicializa o carrinho
  let carrinho = [];
  let valorTotal = 0;

  // Busca o carrinho do servidor ao carregar
  async function inicializarCarrinho() {
    const carrinhoAPI = await carrinhoService.obterCarrinho();
    carrinho = carrinhoAPI.itens || [];
    valorTotal = carrinho.reduce((total, item) => total + item.preco, 0);
    document.querySelector('.valor-total').textContent = `R$ ${valorTotal.toFixed(2)}`;
    atualizarSacolaExpandida();
    atualizarResumoPagamento();
  }

  // === VERIFICAÇÃO DE DISPONIBILIDADE ===
  async function verificarDisponibilidadeItens() {
    try {
      const itensPorTipo = {
        lanche: null,
        bebida: null,
        sobremesa: null,
        acompanhamento: null
      };

      // Classifica os itens do carrinho por tipo
      carrinho.forEach(item => {
        if (item.categoria === 'lançamento' && !itensPorTipo.lanche) {
          itensPorTipo.lanche = item.id_item;
        } else if (item.categoria === 'bebida' && !itensPorTipo.bebida) {
          itensPorTipo.bebida = item.id_item;
        } else if (item.categoria === 'sobremesa' && !itensPorTipo.sobremesa) {
          itensPorTipo.sobremesa = item.id_item;
        } else if (item.categoria === 'acompanhamento' && !itensPorTipo.acompanhamento) {
          itensPorTipo.acompanhamento = item.id_item;
        }
      });

      const response = await fetch('http://localhost:8000/combos/verificar-disponibilidade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          id_lanche: itensPorTipo.lanche,
          id_bebida: itensPorTipo.bebida,
          id_sobremesa: itensPorTipo.sobremesa,
          id_acompanhamento: itensPorTipo.acompanhamento
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao verificar disponibilidade');
      }

      const disponibilidade = await response.json();
      const itensIndisponiveis = disponibilidade.itens.filter(item => item.quantidade_estoque <= 0);

      if (itensIndisponiveis.length > 0) {
        marcarItensIndisponiveis(itensIndisponiveis);
        const nomesItens = itensIndisponiveis.map(item => item.item).join(', ');
        throw new Error(`Os seguintes itens não estão disponíveis: ${nomesItens}`);
      }

      return true;
    } catch (error) {
      console.error('Erro na verificação de disponibilidade:', error);
      throw error;
    }
  }

  function marcarItensIndisponiveis(itensIndisponiveis) {
    document.querySelectorAll('.item-sacola').forEach(item => {
      const idItem = parseInt(item.dataset.id);
      const itemCarrinho = carrinho.find(i => i.id_item === idItem);

      if (itemCarrinho && itensIndisponiveis.some(i => i.item === itemCarrinho.nome)) {
        item.style.opacity = '0.5';
        item.style.border = '1px solid red';
        const aviso = document.createElement('div');
        aviso.className = 'aviso-indisponivel';
        aviso.textContent = 'Indisponível';
        item.appendChild(aviso);
      }
    });
  }

  // === PAGAMENTO ===
  const botaoPagamento = document.querySelector(".recomecar-pedido");
  const telaPagamento = document.querySelector(".tela-pagamento");
  const telaConfirmacao = document.querySelector(".tela-confirmacao");
  const rodapeSacola = document.querySelector(".rodape");

  if (botaoPagamento && telaPagamento) {
    botaoPagamento.addEventListener("click", () => {
      telaPagamento.style.display = "block";
      document.querySelector(".banner-principal").style.display = "none";
      document.querySelector(".menu-lateral").style.display = "none";
      rodapeSacola.style.display = "none";
      todasSecoesProdutos.forEach((sec) => (sec.style.display = "none"));
    });
  }

  // Mostrar campo de troco se pagamento for em dinheiro
  const radiosPagamento = document.querySelectorAll('input[name="pagamento"]');
  radiosPagamento.forEach((input) => {
    input.addEventListener("change", () => {
      const campoTroco = document.getElementById("campo-troco");
      if (campoTroco) {
        campoTroco.style.display =
          input.value === "dinheiro" ? "block" : "none";
      }
    });
  });

  // Mostrar o qr code se pagamento for em pix
  radiosPagamento.forEach((input) => {
    input.addEventListener("change", () => {
      const campoPix = document.getElementById("campo-pix");
      if (campoPix) {
        campoPix.style.display = input.value === "pix" ? "block" : "none";
      }
    });
  });

  // Botão "Confirmar Pagamento"
  const botaoConfirmarPag = document.getElementById("botao-confirma-pag");
  const totalPagar = document.getElementById("total-pagar");

  if (botaoConfirmarPag) {
    botaoConfirmarPag.addEventListener("click", async () => {
      try {
        // Verifica disponibilidade antes de prosseguir
        await verificarDisponibilidadeItens();

        // Busca o ID do cliente
        let idCliente = null;
        const username = localStorage.getItem("username");
        if (username) {
          try {
            const resposta = await fetch(`http://localhost:8000/auth/email/${encodeURIComponent(username)}`);
            if (resposta.ok) {
              const cliente = await resposta.json();
              idCliente = cliente.Id_cliente;
            }
          } catch (erro) {
            console.error("Erro ao buscar cliente:", erro);
          }
        }

        // Monta o pedido
        const payload = {
          Data_pedido: new Date().toISOString().slice(0, 10),
          Hora_pedido: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
          Valor_total_pedido: valorTotal,
          Forma_pagamento: document.querySelector('input[name="pagamento"]:checked')?.value || "Indefinido",
          E_delivery: true,
          Observacao: "",
          Id_func: 1,
          Id_cliente: idCliente || 1,
          Id_pedido: Date.now() + Math.floor(Math.random() * 1000)
        };

        const response = await fetch("http://localhost:8000/integration/pedido/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Erro na requisição: ${response.statusText}`);
        }

        const data = await response.json();
        carrinho = [];
        valorTotal = 0;
        document.querySelector('.valor-total').textContent = `R$ 0.00`;
        atualizarSacolaExpandida();
        atualizarResumoPagamento();

        // Mostra a tela de confirmação
        telaPagamento.style.display = "none";
        if (telaConfirmacao) {
          telaConfirmacao.style.display = "block";
        }

      } catch (error) {
        alert(error.message);
        console.error("Erro ao finalizar pedido:", error);
      }
    });
  }

  // Função para recomeçar o pedido
  window.recomecarPedido = function () {
    if (telaConfirmacao) {
      telaConfirmacao.style.display = "none";
    }

    document.querySelector(".banner-principal").style.display = "block";
    document.querySelector(".menu-lateral").style.display = "block";
    rodapeSacola.style.display = "flex";

    todasSecoesProdutos.forEach((sec) => (sec.style.display = "none"));
    const secaoLancamentos = document.getElementById("lancamentos-secao");
    if (secaoLancamentos) {
      secaoLancamentos.style.display = "block";
    }

    document.querySelectorAll(".secao-menu").forEach((s) => s.classList.remove("ativo"));
    const abaLancamentos = document.querySelector('.secao-menu[data-secao="lancamentos"]');
    if (abaLancamentos) {
      abaLancamentos.classList.add("ativo");
    }
  };

  // Botão "Voltar" da tela de pagamento
  const botaoVoltar = document.getElementById("botao-voltar");
  if (botaoVoltar) {
    botaoVoltar.addEventListener("click", () => {
      telaPagamento.style.display = "none";
      document.querySelector(".banner-principal").style.display = "block";
      document.querySelector(".menu-lateral").style.display = "block";
      rodapeSacola.style.display = "flex";

      const secaoAtiva = document.querySelector(".secao-menu.ativo");
      const secaoId = secaoAtiva ? secaoAtiva.getAttribute("data-secao") : "lancamentos";
      const secaoAlvo = document.getElementById(`${secaoId}-secao`);
      if (secaoAlvo) {
        secaoAlvo.style.display = "block";
      }
    });
  }

  // === EXPANSÃO DA SACOLA ===
  const botaoSacola = document.getElementById("abrirSacola");
  const sacolaExpandida = document.getElementById("sacola-expandida");
  const botaoFecharSacola = document.getElementById("fecharSacola");

  if (botaoSacola && sacolaExpandida) {
    botaoSacola.addEventListener("click", () => {
      sacolaExpandida.style.display = "block";
      document.querySelector(".banner-principal").style.display = "none";
      document.querySelector(".menu-lateral").style.display = "none";
      document.querySelector(".rodape").style.display = "none";
      document.querySelectorAll(".lista-produtos").forEach((sec) => (sec.style.display = "none"));
    });
  }

  if (botaoFecharSacola) {
    botaoFecharSacola.addEventListener("click", () => {
      sacolaExpandida.style.display = "none";
      document.querySelector(".banner-principal").style.display = "block";
      document.querySelector(".menu-lateral").style.display = "block";
      document.querySelector(".rodape").style.display = "flex";

      const secaoAtiva = document.querySelector(".secao-menu.ativo");
      const secaoId = secaoAtiva ? secaoAtiva.getAttribute("data-secao") : "lancamentos";
      const secaoAlvo = document.getElementById(`${secaoId}-secao`);
      if (secaoAlvo) {
        secaoAlvo.style.display = "block";
      }
    });
  }

  // Adiciona evento de clique para todos os produtos
  document.querySelectorAll(".produto").forEach((produto) => {
    produto.addEventListener("click", async function () {
      const nome = this.querySelector("h3").textContent;
      const preco = parseFloat(
        this.querySelector(".preco").textContent.replace("R$", "").replace(",",".").trim()
      );
      const imagem = this.querySelector("img").src;
      const idItem = parseInt(this.dataset.id);

      const secaoPai = this.closest(".lista-produtos");
      const idSecao = secaoPai?.id;

      let categoria = "outros";
      if (idSecao) {
        if (idSecao.includes("lancamentos")) categoria = "lançamento";
        else if (idSecao.includes("acompanhamentos")) categoria = "acompanhamento";
        else if (idSecao.includes("sobremesas")) categoria = "sobremesa";
        else if (idSecao.includes("bebidas")) categoria = "bebida";
      }

      // Adiciona ao carrinho local
      carrinho.push({
        id_item: idItem,
        nome,
        preco,
        imagem,
        categoria,
        quantidade: 1
      });
      valorTotal += preco;

      document.querySelector(".valor-total").textContent = `R$ ${valorTotal.toFixed(2)}`;

      atualizarSacolaExpandida();
      atualizarResumoPagamento();

      // Sincroniza com o servidor
      await carrinhoService.adicionarItem({
        id_item: idItem,
        nome: nome,
        preco: preco,
        quantidade: 1,
        categoria: categoria
      });
    });
  });

  // Atualiza a sacola expandida
  function atualizarSacolaExpandida() {
    const sacolaContainer = document.getElementById("sacola-expandida");
    if (!sacolaContainer) return;

    // Limpa itens existentes
    while (sacolaContainer.querySelector(".item-sacola")) {
      sacolaContainer.querySelector(".item-sacola").remove();
    }

    // Adiciona novos itens
    carrinho.forEach((item) => {
      const itemHTML = `
        <div class="item-sacola" data-id="${item.id_item}">
          <img src="${item.imagem}" alt="${item.nome}" class="imagem-produto">
          <div class="info-produto">
            <h3>${item.nome}</h3>
            <span class="categoria">${item.categoria}</span>
            <button class="remover-item">Remover item</button>
          </div>
          <div class="acoes">
            <h3><span class="preco">R$ ${item.preco.toFixed(2)}</span></h3>
          </div>
        </div>
      `;
      sacolaContainer.insertAdjacentHTML("beforeend", itemHTML);
    });
  }

  // Atualiza o resumo do pagamento
  function atualizarResumoPagamento() {
    const resumoItens = document.getElementById("resumo-itens");
    if (!resumoItens) return;

    resumoItens.innerHTML = "";
    carrinho.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `1x ${item.nome} (${item.categoria}) - R$ ${item.preco.toFixed(2)}`;
      resumoItens.appendChild(li);
    });

    const totalPagar = document.getElementById("total-pagar");
    if (totalPagar) {
      totalPagar.textContent = `R$ ${valorTotal.toFixed(2)}`;
    }
  }

  // Adiciona funcionalidade para remover itens
  document.addEventListener("click", async function (e) {
    if (e.target.classList.contains("remover-item")) {
      const itemSacola = e.target.closest(".item-sacola");
      const idItem = parseInt(itemSacola.dataset.id);

      // Remove do carrinho local
      const index = carrinho.findIndex(item => item.id_item === idItem);
      if (index > -1) {
        valorTotal -= carrinho[index].preco;
        carrinho.splice(index, 1);

        document.querySelector(".valor-total").textContent = `R$ ${valorTotal.toFixed(2)}`;
        atualizarSacolaExpandida();
        atualizarResumoPagamento();
      }

      // Sincroniza com o servidor
      await carrinhoService.removerItem(idItem);
    }
  });

  // Função de busca por nome do produto e filtro por tags
  const secoes = document.querySelectorAll(".lista-produtos");

  secoes.forEach(secao => {
    const campoBusca = secao.querySelector(".campo-busca");
    const filtros = secao.querySelectorAll(".filtro-tag");
    const produtos = secao.querySelectorAll(".produto");

    let tagSelecionada = "";

    function filtrar() {
      const termo = campoBusca.value.toLowerCase();

      produtos.forEach(produto => {
        const titulo = produto.querySelector("h3").textContent.toLowerCase();
        const tags = Array.from(produto.querySelectorAll(".tag")).map(tag =>
          tag.dataset.tag?.toLowerCase()
        );

        const combinaBusca = titulo.includes(termo);
        const combinaTag = tagSelecionada === "" || tags.includes(tagSelecionada);

        produto.style.display = (combinaBusca && combinaTag) ? "block" : "none";
      });
    }

    campoBusca.addEventListener("input", filtrar);

    filtros.forEach(filtro => {
      filtro.addEventListener("click", () => {
        filtros.forEach(f => f.classList.remove("ativo"));
        if (filtro.dataset.tag === tagSelecionada) {
          tagSelecionada = "";
        } else {
          filtro.classList.add("ativo");
          tagSelecionada = filtro.dataset.tag;
        }
        filtrar();
      });
    });
  });

  // === RESPONSIVIDADE ===
  const botaoMenu = document.getElementById("botao-menu");
  const menulateral = document.querySelector(".menu-lateral");
  const opcoesMenu = document.querySelectorAll(".menu-lateral .secao-menu");

  if (botaoMenu && menulateral) {
    botaoMenu.addEventListener("click", () => {
      menulateral.classList.toggle("ativo");
    });
  }

  opcoesMenu.forEach(opcao => {
    opcao.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        menuLateral.classList.remove("ativo");
      }
    });
  });

  // Inicializa o carrinho ao carregar a página
  inicializarCarrinho();
});