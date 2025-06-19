document.addEventListener("DOMContentLoaded", function () {
  const menuLateral = document.querySelector(".menu-lateral");
  const secoesMenu = menuLateral.querySelectorAll(".secao-menu");
  const username = localStorage.getItem("username");
  if (username) {
    const saudacao = document.getElementById("saudacao");
    if (saudacao) {
      saudacao.textContent = `Oi, ${username}!`;
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

  function atualizarPontos(novosPontos) {
    const elementoPontos = document.getElementById("pontos");
    if (elementoPontos) {
      elementoPontos.textContent = novosPontos;
    }
  }

  // === NOVAS FUNÇÕES DE PAGAMENTO ===

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

  // Função ao confirmar pagamento → mostra tela de confirmação
  window.finalizarPagamento = function () {
    telaPagamento.style.display = "none";
    if (telaConfirmacao) {
      telaConfirmacao.style.display = "block";
    }
  };

  // ADIÇÃO: escutar o clique no botão "Confirmar Pagamento"
  const botaoConfirmarPag = document.getElementById("botao-confirma-pag");
  if (botaoConfirmarPag) {
    botaoConfirmarPag.addEventListener("click", () => {
      finalizarPagamento(); // chama a função já existente
    });
  }

  // Função para recomeçar o pedido
  window.recomecarPedido = function () {
    if (telaConfirmacao) {
      telaConfirmacao.style.display = "none";
    }

    // Restaurar a interface inicial
    document.querySelector(".banner-principal").style.display = "block";
    document.querySelector(".menu-lateral").style.display = "block";
    rodapeSacola.style.display = "flex";

    todasSecoesProdutos.forEach((sec) => (sec.style.display = "none"));
    const secaoLancamentos = document.getElementById("lancamentos-secao");
    if (secaoLancamentos) {
      secaoLancamentos.style.display = "block";
    }

    // Marcar "lancamentos" como ativo
    document
      .querySelectorAll(".secao-menu")
      .forEach((s) => s.classList.remove("ativo"));
    const abaLancamentos = document.querySelector(
      '.secao-menu[data-secao="lancamentos"]'
    );
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

      // Reexibe a seção ativa (ou "lancamentos" por padrão)
      const secaoAtiva = document.querySelector(".secao-menu.ativo");
      const secaoId = secaoAtiva
        ? secaoAtiva.getAttribute("data-secao")
        : "lancamentos";
      const secaoAlvo = document.getElementById(`${secaoId}-secao`);
      if (secaoAlvo) {
        secaoAlvo.style.display = "block";
      }
    });
  }

  // === EXPANSÃO DA SACOLA ===
  const botaoSacola = document.getElementById("abrirSacola"); // botão "Continuar para pagamento"
  console.log("botaoSacola:", botaoSacola);

  const sacolaExpandida = document.getElementById("sacola-expandida");
  const botaoFecharSacola = document.getElementById("fecharSacola");

  if (botaoSacola && sacolaExpandida) {
    botaoSacola.addEventListener("click", () => {
      sacolaExpandida.style.display = "block";
      document.querySelector(".banner-principal").style.display = "none";
      document.querySelector(".menu-lateral").style.display = "none";
      document.querySelector(".rodape").style.display = "none";
      document
        .querySelectorAll(".lista-produtos")
        .forEach((sec) => (sec.style.display = "none"));
    });
  }

  if (botaoFecharSacola) {
    botaoFecharSacola.addEventListener("click", () => {
      sacolaExpandida.style.display = "none";
      document.querySelector(".banner-principal").style.display = "block";
      document.querySelector(".menu-lateral").style.display = "block";
      document.querySelector(".rodape").style.display = "flex";

      const secaoAtiva = document.querySelector(".secao-menu.ativo");
      const secaoId = secaoAtiva
        ? secaoAtiva.getAttribute("data-secao")
        : "lancamentos";
      const secaoAlvo = document.getElementById(`${secaoId}-secao`);
      if (secaoAlvo) {
        secaoAlvo.style.display = "block";
      }
    });
  }

  // Inicializa o carrinho
  let carrinho = [];
  let valorTotal = 0;

  // Adiciona evento de clique para todos os produtos
  document.querySelectorAll(".produto").forEach((produto) => {
    produto.addEventListener("click", function () {
      const nome = this.querySelector("h3").textContent;
      const preco = parseFloat(
        this.querySelector(".preco").textContent.replace("R$", "").replace(",",".").trim()
      );
      const imagem = this.querySelector("img").src; // Captura a URL da imagem

      adicionarAoCarrinho(nome, preco, imagem);
    });
  });

  // Modifique a função adicionarAoCarrinho para incluir a imagem
  function adicionarAoCarrinho(nome, preco, imagem) {
    carrinho.push({ nome, preco, imagem });
    valorTotal += preco;

    document.querySelector(
      ".valor-total"
    ).textContent = `R$ ${valorTotal.toFixed(2)}`;

    atualizarSacolaExpandida();
    atualizarResumoPagamento();
  }

  // Atualize a função atualizarSacolaExpandida para mostrar as imagens
  function atualizarSacolaExpandida() {
    const sacolaContainer = document.getElementById("sacola-expandida");
    if (!sacolaContainer) return;

    // Limpa itens existentes
    while (sacolaContainer.querySelector(".item-sacola")) {
      sacolaContainer.querySelector(".item-sacola").remove();
    }

    // Adiciona novos itens com imagens
    carrinho.forEach((item) => {
      const itemHTML = `
        <div class="item-sacola">
          <img src="${item.imagem}" alt="${item.nome}" class="imagem-produto">
          <div class="info-produto">
            <h3>${item.nome}</h3>
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

  function atualizarResumoPagamento() {
    const resumoItens = document.getElementById("resumo-itens");
    if (!resumoItens) return;

    resumoItens.innerHTML = "";
    carrinho.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `1x ${item.nome} - R$ ${item.preco.toFixed(2)}`;
      resumoItens.appendChild(li);
    });

    const totalPagar = document.getElementById("total-pagar");
    if (totalPagar) {
      totalPagar.textContent = `R$ ${valorTotal.toFixed(2)}`;
    }
  }

  // Adiciona funcionalidade para remover itens
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("remover-item")) {
      const itemSacola = e.target.closest(".item-sacola");
      const nome = itemSacola.querySelector("h3").textContent;
      const index = carrinho.findIndex((item) => item.nome === nome);

      if (index > -1) {
        valorTotal -= carrinho[index].preco;
        carrinho.splice(index, 1);

        document.querySelector(
          ".valor-total"
        ).textContent = `R$ ${valorTotal.toFixed(2)}`;
        atualizarSacolaExpandida();
        atualizarResumoPagamento();
      }
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
        // Alternar classe ativa
        filtros.forEach(f => f.classList.remove("ativo"));
        if (filtro.dataset.tag === tagSelecionada) {
          tagSelecionada = ""; // desfaz filtro
        } else {
          filtro.classList.add("ativo");
          tagSelecionada = filtro.dataset.tag;
        }
        filtrar();
      });
    });
  });

  // === RESPONSIVIDADE: BOTÃO QUE ABRE MENU LATERAL ===
  const botaoMenu = document.getElementById("botao-menu");
  const menulateral = document.querySelector(".menu-lateral");
  const opcoesMenu = document.querySelectorAll(".menu-lateral .secao-menu");

  if (botaoMenu && menulateral) {
    botaoMenu.addEventListener("click", () => {
      menulateral.classList.toggle("ativo");
    });
  }

  // Fecha o menu lateral ao clicar em uma opção (somente em telas pequenas)
  opcoesMenu.forEach(opcao => {
    opcao.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        menuLateral.classList.remove("ativo");
      }
    });
  });

});
