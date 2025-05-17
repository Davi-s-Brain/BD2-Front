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
document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("loginBtn");
  const errorMsg = document.getElementById("error-msg");

  loginButton.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    errorMsg.textContent = ""; // Limpa erro anterior

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      if (response.status === 200) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem("username", username);
        window.location.href = "index.html"; // Redireciona ao sucesso
      } else if (response.status === 429) {
        errorMsg.textContent = "Muitas tentativas. Tente novamente mais tarde.";
      } else {
        errorMsg.textContent = "Não foi possível autenticar. Verifique suas credenciais.";
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      errorMsg.textContent = "Erro de conexão. Tente novamente mais tarde.";
    }
  });
});
async function register() {
  const username = document.querySelector('input[name="username"]').value;
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

    if (response.status === 200) {
    localStorage.setItem('username', username);
    localStorage.setItem('token', data.token)
    window.location.href = "index.html";
    } else if (response.status === 400) {
      messageDiv.textContent = "Usuário já existe, tente outro.";
    } else if (response.status === 429) {
      messageDiv.textContent = "Muitas tentativas, espere um momento.";
    } else {
      messageDiv.textContent = "Erro ao cadastrar, tente novamente.";
    }
  } catch (error) {
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

// Adiciona listener no botão
document.getElementById('registerBtn').addEventListener('click', register);
