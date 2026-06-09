// ========================================================
// 1. ANIMAÇÃO DE PARTÍCULAS (Otimizada para Mobile)
// ========================================================
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

function initCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 300; 
        this.size = Math.random() * 1.5 + 0.5;
        this.speedY = Math.random() * 1.5 + 0.2; 
        this.opacity = Math.random() * 0.4 + 0.1;
    }
    update() {
        this.y -= this.speedY;
        if (this.y < -10) {
            this.y = height + 10;
            this.x = Math.random() * width;
        }
    }
    draw() {
        ctx.fillStyle = `rgba(0, 163, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createParticles() {
    particles = [];
    // Reduz drasticamente a quantidade de partículas no celular para evitar lag no iOS
    let numParticles = window.innerWidth < 600 ? 25 : 60;
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', () => {
    initCanvas();
    createParticles();
});

// Inicializa o background
initCanvas();
createParticles();
animateParticles();

// ========================================================
// 2. EFEITO 3D TILT (Bloqueado em Celulares para evitar lag)
// ========================================================
const tiltCards = document.querySelectorAll('[data-tilt]');

// Detecta se é um dispositivo de toque (Celulares/Tablets)
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// Só aplica o efeito de Tilt se o usuário estiver usando um mouse (Desktop)
if (!isTouchDevice) {
    tiltCards.forEach(card => {
        
        // Adiciona classes no CSS via JS apenas quando necessário
        card.style.transformStyle = 'preserve-3d';

        card.addEventListener('mousemove', e => {
            // Otimização para não repintar constantemente quando não houver hover
            card.style.willChange = 'transform'; 
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -8; 
            const rotateY = ((x - centerX) / centerX) * 8;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            
            // Adiciona efeito aos elementos internos
            const icon = card.querySelector('.service-icon');
            const title = card.querySelector('h3');
            const text = card.querySelector('p');
            
            if(icon) icon.style.transform = 'translateZ(20px)';
            if(title) title.style.transform = 'translateZ(15px)';
            if(text) text.style.transform = 'translateZ(10px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.willChange = 'auto'; // Limpa a memória de renderização
            
            const icon = card.querySelector('.service-icon');
            const title = card.querySelector('h3');
            const text = card.querySelector('p');
            
            if(icon) icon.style.transform = 'translateZ(0px)';
            if(title) title.style.transform = 'translateZ(0px)';
            if(text) text.style.transform = 'translateZ(0px)';
        });
    });
}
