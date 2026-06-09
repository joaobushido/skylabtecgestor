/* =============================================
   SKYLAB LANDING PAGE - JAVASCRIPT
   Particles, Scroll Reveal, Micro-interactions
   ============================================= */
(function () {
  'use strict';
  /* =============================================
     1. PARTICLES CANVAS (Lightweight)
     ============================================= */
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let mouseX = -1000;
    let mouseY = -1000;
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.8 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.4 + 0.1;
        this.opacityDirection = Math.random() > 0.5 ? 1 : -1;
        this.opacitySpeed = Math.random() * 0.003 + 0.001;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        // Subtle pulsing
        this.opacity += this.opacityDirection * this.opacitySpeed;
        if (this.opacity >= 0.5) this.opacityDirection = -1;
        if (this.opacity <= 0.05) this.opacityDirection = 1;
        // Mouse interaction - subtle attraction
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          this.x += dx * 0.002;
          this.y += dy * 0.002;
          this.opacity = Math.min(this.opacity + 0.01, 0.6);
        }
        // Wrap around screen edges
        if (this.x < -10) this.x = canvas.width + 10;
        if (this.x > canvas.width + 10) this.x = -10;
        if (this.y < -10) this.y = canvas.height + 10;
        if (this.y > canvas.height + 10) this.y = -10;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 163, 255, ${this.opacity})`;
        ctx.fill();
      }
    }
    function initParticles() {
      particles = [];
      // Adjust count based on screen size for performance
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 18000), 80);
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }
    function drawLines() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 163, 255, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      drawLines();
      animationId = requestAnimationFrame(animate);
    }
    // Throttled mouse tracking
    let mouseMoveTimeout;
    document.addEventListener('mousemove', (e) => {
      if (!mouseMoveTimeout) {
        mouseMoveTimeout = setTimeout(() => {
          mouseX = e.clientX;
          mouseY = e.clientY;
          mouseMoveTimeout = null;
        }, 16); // ~60fps
      }
    });
    // Handle resize with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
        initParticles();
      }, 250);
    });
    // Pause animation when page is not visible (performance)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        animate();
      }
    });
    // Initialize
    resizeCanvas();
    initParticles();
    animate();
  }
  /* =============================================
     2. ANNOUNCEMENT BANNER
     ============================================= */
  const banner = document.getElementById('announcement-banner');
  const closeBannerBtn = document.getElementById('close-banner');
  if (closeBannerBtn && banner) {
    // Check if banner was previously closed
    if (sessionStorage.getItem('skylab-banner-closed') === 'true') {
      banner.classList.add('hidden');
    }
    closeBannerBtn.addEventListener('click', () => {
      banner.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        banner.classList.add('hidden');
        banner.style.removeProperty('opacity');
        banner.style.removeProperty('transform');
      }, 300);
      sessionStorage.setItem('skylab-banner-closed', 'true');
    });
  }
  /* =============================================
     3. SCROLL REVEAL (Intersection Observer)
     ============================================= */
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });
    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback: show everything immediately
    revealElements.forEach(el => el.classList.add('visible'));
  }
  /* =============================================
     4. SERVICE CARD 3D TILT EFFECT
     ============================================= */
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4; // Max 4deg tilt
      const rotateY = ((x - centerX) / centerX) * 4;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
      card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease-out';
    });
  });
  /* =============================================
     5. TOUCH GLOW EFFECT ON CARDS (Mobile)
     ============================================= */
  serviceCards.forEach(card => {
    card.addEventListener('touchstart', () => {
      card.style.borderColor = 'rgba(0, 163, 255, 0.4)';
      card.style.boxShadow = '0 0 30px rgba(0, 163, 255, 0.15)';
    }, { passive: true });
    card.addEventListener('touchend', () => {
      setTimeout(() => {
        card.style.borderColor = '';
        card.style.boxShadow = '';
      }, 300);
    }, { passive: true });
  });
  /* =============================================
     6. SHOOTING STAR / LIGHT TRAIL EFFECT
     ============================================= */
  function createShootingStar() {
    const star = document.createElement('div');
    star.style.cssText = `
      position: fixed;
      top: ${Math.random() * 40}%;
      left: -5%;
      width: ${Math.random() * 80 + 60}px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(0, 163, 255, 0.5), rgba(0, 163, 255, 0.1), transparent);
      pointer-events: none;
      z-index: 0;
      opacity: 0;
      border-radius: 1px;
      filter: blur(0.5px);
    `;
    document.body.appendChild(star);
    const duration = Math.random() * 1500 + 1000;
    const angle = Math.random() * 15 - 7; // slight angle
    star.animate([
      {
        opacity: 0,
        transform: `translateX(0) translateY(0) rotate(${angle}deg)`
      },
      {
        opacity: 0.7,
        offset: 0.1
      },
      {
        opacity: 0.7,
        offset: 0.7
      },
      {
        opacity: 0,
        transform: `translateX(${window.innerWidth + 200}px) translateY(${Math.random() * 100}px) rotate(${angle}deg)`
      }
    ], {
      duration: duration,
      easing: 'linear',
      fill: 'forwards'
    }).onfinish = () => star.remove();
  }
  // Create shooting stars at random intervals
  function scheduleShootingStar() {
    const delay = Math.random() * 6000 + 4000; // Every 4-10 seconds
    setTimeout(() => {
      if (!document.hidden) {
        createShootingStar();
      }
      scheduleShootingStar();
    }, delay);
  }
  scheduleShootingStar();
  /* =============================================
     7. SMOOTH SCROLL FOR ANCHOR LINKS
     ============================================= */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  /* =============================================
     8. DYNAMIC YEAR IN COPYRIGHT (Future-proof)
     ============================================= */
  // The copyright already shows 2026, but this
  // keeps it correct if the page stays deployed.
  // Intentionally left as static per client request.
  /* =============================================
     9. PERFORMANCE: Reduce motion for users
        who prefer reduced motion
     ============================================= */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) {
    // Cancel particle animation
    if (canvas) {
      const ctx2 = canvas.getContext('2d');
      cancelAnimationFrame(window._animId);
      ctx2.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
    // Disable tilt on cards
    serviceCards.forEach(card => {
      card.replaceWith(card.cloneNode(true));
    });
    // Show all reveal elements
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    // Hide ambient glows
    document.querySelectorAll('.ambient-glow').forEach(el => {
      el.style.animation = 'none';
    });
  }
})();
