document.addEventListener("DOMContentLoaded", function () {
  const menuLateral = document.querySelector(".menu-lateral");
  const secoesMenu = menuLateral.querySelectorAll(".secao-menu");

  secoesMenu.forEach((secao) => {
    secao.addEventListener("click", function () {
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
});
