document.addEventListener("DOMContentLoaded", function () {
  const menuLateral = document.querySelector(".menu-lateral");
  const secoesMenu = menuLateral.querySelectorAll(".secao-menu");
  const username = localStorage.getItem('username');
  if (username) {
    const saudacao = document.getElementById('saudacao');
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
      } else if (secaoId === "sobremesa") {
        document.getElementById("sobremesa-secao").style.display = "block";
      } else if (secaoId === "bebida") {
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

});
