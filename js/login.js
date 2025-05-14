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
