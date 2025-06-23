// Configuração do canvas e animação de fundo
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
      this.vx = (Math.random() - 0.5) * 1;
      this.vy = (Math.random() - 0.5) * 1;
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
      ctx.fillStyle = "#7e57c2";
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

  // Lógica do formulário
  document.addEventListener('DOMContentLoaded', () => {
  localStorage.removeItem('token');        // JWT gravado no login
  localStorage.removeItem('username');     // caso grave o usuário
  localStorage.removeItem('funcionarioId');/* id do funcionário, se houver */

  const API_BASE = 'http://localhost:8000';
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginBtn = document.getElementById('loginBtn');
  const funcBtn = document.getElementById('funcBtn');
  const registerBtn = document.getElementById('registerBtn');
  const backToLogin = document.getElementById('backToLogin');
  const submitRegisterBtn = document.getElementById('submitRegisterBtn');
  const idGroup = document.getElementById('idGroup');
  const errorMsg = document.getElementById('error-msg');
  const messageRegister = document.getElementById('messageRegister');

  // Elementos do formulário de login
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const idInput = document.getElementById('id');

  let isFuncionarioMode = false;

  // Estado inicial
  funcBtn.textContent = 'Sou Funcionário';
  idGroup.style.display = 'none';
  errorMsg.textContent = '';

  // Toggle de modo: Funcionário <-> Voltar
  funcBtn.addEventListener('click', () => {
    isFuncionarioMode = !isFuncionarioMode;
    idGroup.style.display = isFuncionarioMode ? 'block' : 'none';
    funcBtn.textContent = isFuncionarioMode ? 'Voltar' : 'Sou Funcionário';
    errorMsg.textContent = '';
  });

  // Alternar entre login e cadastro
  registerBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  });

  backToLogin.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    messageRegister.textContent = '';
  });

  // Handler do botão Entrar (LOGIN) - Tratamento de erros refinado
  loginBtn.addEventListener('click', async () => {
    errorMsg.textContent = '';

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!password) {
      errorMsg.textContent = 'Informe a senha.';
      return;
    }

    let token;

    // 1) Login normal
    if (!isFuncionarioMode) {
      if (!username) {
        errorMsg.textContent = 'Informe o usuário.';
        return;
      }

      try {
        const resp = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        if (!resp.ok) {
          // Tratamento específico para erro 401
          if (resp.status === 401) {
            errorMsg.textContent = 'Usuário ou senha incorretos.';
          }
          // Tratamento para limite de tentativas
          else if (resp.status === 429) {
            errorMsg.textContent = 'Muitas tentativas. Tente mais tarde.';
          }
          // Outros erros
          else {
            const errorText = await resp.text();
            errorMsg.textContent = `Erro ${resp.status}: ${errorText}`;
          }
          return;
        }

        const data = await resp.json();
        token = data.access_token;
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);

        // Redirecionamento após login bem-sucedido
        window.location.href = './index.html';
      } catch (error) {
        console.error('Erro no login:', error);
        errorMsg.textContent = 'Erro de conexão ao fazer login.';
        return;
      }
    }
    // 2) Login de funcionário - Tratamento de erros refinado
    else {
      const idValue = idInput.value.trim();
      if (!idValue) {
        errorMsg.textContent = 'Informe o ID do funcionário.';
        return;
      }

      try {
        const resp = await fetch(`${API_BASE}/auth/${idValue}?password=${encodeURIComponent(password)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!resp.ok) {
          // Tratamento específico para erro 401
          if (resp.status === 401) {
            errorMsg.textContent = 'ID ou senha inválidos.';
          }
          // Tratamento para limite de tentativas
          else if (resp.status === 429) {
            errorMsg.textContent = 'Muitas tentativas. Tente mais tarde.';
          }
          // Outros erros
          else {
            const errorText = await resp.text();
            errorMsg.textContent = `Erro ${resp.status}: ${errorText}`;
          }
          return;
        }

        const data = await resp.json();
        token = data.access_token;
        localStorage.setItem('token', token);
        localStorage.setItem('funcionarioId', idValue);

        // Redirecionamento específico para funcionário
        window.location.href = './funcionario.html';
      } catch (error) {
        console.error('Erro no login de funcionário:', error);
        errorMsg.textContent = 'Erro de conexão no login.';
        return;
      }
    }
  });

  // Handler do botão Cadastrar (REGISTRO) - Correções aplicadas
  submitRegisterBtn.addEventListener('click', async () => {
  // Limpa mensagens anteriores
  messageRegister.textContent = '';
  messageRegister.style.color = '#ff4444'; // Vermelho para erros

  // Coletar dados do formulário
  const payload = {
    Id_cliente: 0,
    Primeiro_nome_client: document.getElementById('primeiroNome').value.trim(),
    Ultimo_nome_client: document.getElementById('ultimoNome').value.trim(),
    Data_nascimento_client: document.getElementById('dataNascimento').value,
    CPF_client: document.getElementById('cpf').value.replace(/\D/g, ''),
    Telefone_client: document.getElementById('telefone').value.replace(/\D/g, ''),
    E_mail_client: document.getElementById('email').value.trim().toLowerCase(),
    Genero_client: document.getElementById('genero').value,
    E_intolerante_lactose: document.getElementById('intoleranteLactose').checked,
    E_celiaco: document.getElementById('celiaco').checked,
    E_vegetariano: document.getElementById('vegetariano').checked,
    E_vegano: document.getElementById('vegano').checked,
    Senha_cliente: document.getElementById('senha').value
  };

  // Validação avançada com feedbacks específicos
  if (!payload.Primeiro_nome_client) {
    return showError('Por favor, informe seu primeiro nome');
  }
  if (!payload.Ultimo_nome_client) {
    return showError('Por favor, informe seu sobrenome');
  }
  if (!payload.Data_nascimento_client) {
    return showError('Por favor, informe sua data de nascimento');
  }
  if (!payload.CPF_client || payload.CPF_client.length !== 11) {
    return showError('CPF inválido (deve conter 11 dígitos)');
  }
  if (!payload.Telefone_client || payload.Telefone_client.length < 10) {
    return showError('Telefone inválido (DDD + número)');
  }
  if (!payload.E_mail_client || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.E_mail_client)) {
    return showError('Por favor, informe um e-mail válido');
  }
  if (!payload.Genero_client) {
    return showError('Por favor, selecione seu gênero');
  }
  if (!payload.Senha_cliente || payload.Senha_cliente.length < 8) {
    return showError('A senha deve ter no mínimo 8 caracteres');
  }

  // Feedback de processamento
  showProcessing('Processando seu cadastro...');

  try {
    const response = await fetch(`${API_BASE}/clientes/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      // Tratamento específico para erros conhecidos
      if (response.status === 409) {
        const conflictField = data.detail.includes('CPF') ? 'CPF' : 'e-mail';
        return showError(`Este ${conflictField} já está cadastrado`);
      }
      throw new Error(data.detail || 'Erro desconhecido');
    }

    // Verificação do token
    if (!data.access_token) {
      throw new Error('Não recebemos o token de acesso');
    }

    // Armazenamento seguro
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('username', payload.E_mail_client);

    // Feedback de sucesso
    showSuccess('Cadastro realizado com sucesso! Redirecionando...');

    // Redirecionamento com delay para visualização da mensagem
    setTimeout(() => {
      window.location.href = './index.html';
    }, 2000);

  } catch (error) {
    console.error('Erro no cadastro:', error);

    // Mensagens amigáveis para diferentes tipos de erro
    if (error.message.includes('NetworkError')) {
      showError('Sem conexão com o servidor. Verifique sua internet');
    } else {
      showError(`Ops! Algo deu errado: ${error.message}`);
    }
  }

  // Funções auxiliares para feedback visual
  function showError(msg) {
    messageRegister.textContent = msg;
    messageRegister.style.color = '#ff4444';
    submitRegisterBtn.disabled = false;
  }

  function showProcessing(msg) {
    messageRegister.textContent = msg;
    messageRegister.style.color = '#ffbb33'; // Amarelo
    submitRegisterBtn.disabled = true;
  }

  function showSuccess(msg) {
    messageRegister.textContent = msg;
    messageRegister.style.color = '#00C851'; // Verde
  }
});
});
