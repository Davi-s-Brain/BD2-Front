const canvas = document.getElementById("background");
const ctx = canvas.getContext("2d");

// Configura o tamanho do canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const numDots = 100;
const dots = [];

class Dot {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.radius = Math.random() * 2 + 1;
    this.vx = (Math.random() - 0.5) * 1; // Velocidade horizontal pequena
    this.vy = (Math.random() - 0.5) * 1; // Velocidade vertical pequena
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Faz os pontinhos reaparecerem do outro lado (wrap-around)
    if (this.x < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height;
    if (this.y > canvas.height) this.y = 0;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#406";
    ctx.fill();
  }
}

// Cria os pontinhos
for (let i = 0; i < numDots; i++) {
  dots.push(new Dot());
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dots.forEach((dot) => {
    dot.update();
    dot.draw();
  });
  requestAnimationFrame(animate);
}

animate();

// Ajusta o tamanho do canvas se a janela for redimensionada
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE      = 'http://localhost:8000';
  const funcBtn       = document.getElementById('funcBtn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const idInput       = document.getElementById('id');
  const errorMsg      = document.getElementById('error-msg');
  const registerBtn   = document.getElementById('registerBtn');
  const titulo        = document.getElementById("titulo-login");
  const camposCadastro = document.getElementById("campos-cadastro");
  const camposLogin    = document.getElementById("campos-login");
  const camposFuncionario = document.getElementById("campos-funcionario");
  const botaoLogin     = document.getElementById("loginBtn");


  let isFuncionarioMode = false;

  // Estado inicial
  // funcBtn.textContent = 'Funcionário';
  // idInput.style.display = 'none';
  // errorMsg.textContent = '';

  // Toggle de modo: Funcionário <-> Voltar
  funcBtn.addEventListener('click', function () {
    isFuncionarioMode = !isFuncionarioMode;

    if (isFuncionarioMode) {
      // Ativa modo funcionário
      camposLogin.style.display = "none";
      camposCadastro.style.display = "none";
      camposFuncionario.style.display = "block";
      registerBtn.style.display = "none";
      titulo.textContent = "Login do Funcionário";
      botaoLogin.textContent = "Entrar";
      funcBtn.textContent = "Voltar";
    } else {
      // Volta para modo login normal
      camposLogin.style.display = "block";
      camposCadastro.style.display = "none";
      camposFuncionario.style.display = "none";
      registerBtn.style.display = "block"; // ou 'block' se preferir
      titulo.textContent = "Login";
      botaoLogin.textContent = "Entrar";
      funcBtn.textContent = "Funcionário";
    }

    errorMsg.textContent = '';
});


  // Handler do botão Entrar
  botaoLogin.addEventListener('click', async () => {
    errorMsg.textContent = '';

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
      errorMsg.textContent = 'Informe usuário e senha.';
      return;
    }

    let token;
    // 1) Login normal
    try {
      const resp = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!resp.ok) {
        errorMsg.textContent = resp.status === 429
          ? 'Muitas tentativas. Tente mais tarde.'
          : 'Usuário ou senha inválidos.';
        return;
      }
      const data = await resp.json();
      token = data.access_token;
      localStorage.setItem('token', token);
    } catch {
      errorMsg.textContent = 'Erro de conexão no login.';
      return;
    }

    // 2) Se estiver em modo funcionário, faz a verificação extra
    if (isFuncionarioMode) {
      const idValue = idInput.value.trim();
      if (!idValue) {
        errorMsg.textContent = 'Informe o ID do funcionário.';
        return;
      }
      try {
        const respF = await fetch(`${API_BASE}/funcionarios/${idValue}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!respF.ok) {
          errorMsg.textContent = respF.status === 404
            ? 'Funcionário não encontrado.'
            : 'Erro ao buscar funcionário.';
          return;
        }
        // ambos deram certo: redireciona para página de funcionário
        window.location.href = './funcionario.html';
        return;
      } catch {
        errorMsg.textContent = 'Erro de conexão ao buscar funcionário.';
        return;
      }
    }

    // modo normal: redireciona para tela principal
    window.location.href = './index.html';
  });

  let modoCadastro = false; // flag para controlar o estado


registerBtn.addEventListener("click", function (e) {
  e.preventDefault(); // evita redirecionamento

  if (!modoCadastro) {
    // Ativa modo de cadastro
    modoCadastro = true;
    titulo.textContent = "Cadastro";
    camposCadastro.style.display = "block";
    this.textContent = "Voltar ao login";
    botaoLogin.textContent = "Cadastrar";
  } else {
    // Se já estiver no modo de cadastro, então envia o cadastro
    register(); // sua função de cadastro
    modoCadastro = false;
    titulo.textContent = "Login";
    camposCadastro.style.display = "none";
    registerBtn.textContent = "Cadastre-se";
    botaoLogin.textContent = "Entrar";
  }
});

});

async function register() {
  const username = document.querySelector('input[name="username"]').value.trim();
  const password = document.querySelector('input[name="password"]').value;
  const messageDiv = document.getElementById('messageRegister') || createMessageDiv('register');

  if (!username || !password) {
    messageDiv.textContent = "Por favor, preencha usuário e senha para cadastro.";
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    // Faz o parse antes de usar data
    const data = await response.json();

    if (response.ok) {
      // A API pode retornar .access_token ou .token
      const token = data.access_token || data.token;
      localStorage.setItem('username', username);
      localStorage.setItem('token', token);
      window.location.href = 'index.html';
    }
    else if (response.status === 400) {
      messageDiv.textContent = "Usuário já existe, tente outro.";
    }
    else if (response.status === 429) {
      messageDiv.textContent = "Muitas tentativas, espere um momento.";
    }
    else {
      messageDiv.textContent = "Erro ao cadastrar, tente novamente.";
    }
  }
  catch (error) {
    console.error('Erro no register():', error);
    messageDiv.textContent = "Erro na conexão, tente novamente.";
  }
}

// Função para criar a div de mensagem se não existir ainda
function createMessageDiv(type) {
  const container = document.querySelector('.login-container');
  const div = document.createElement('div');
  div.id = type === 'register' ? 'messageRegister' : 'messageLogin';
  div.style.color = 'red';
  div.style.marginTop = '10px';
  container.appendChild(div);
  return div;
}