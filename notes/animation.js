document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('futuristicCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const particleCount = 100; // Number of particles
    const particleSize = 2;    // Size of each particle
    const particleSpeed = 0.5; // Speed of particles

    // Function to resize canvas to full window size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // Particle constructor
    function Particle(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * particleSize + 1; // Random size variation
        this.speedX = (Math.random() * 1 - 0.5) * particleSpeed; // Random horizontal speed
        this.speedY = (Math.random() * 1 - 0.5) * particleSpeed; // Random vertical speed
        this.color = `rgba(0, 255, 255, ${Math.random()})`; // Cyan-like color with random opacity
    }

    // Draw particle
    Particle.prototype.draw = function () {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    };

    // Update particle position
    Particle.prototype.update = function () {
        this.x += this.speedX;
        this.y += this.speedY;

        // Loop particles when they go off-screen
        if (this.x < 0 || this.x > canvas.width) {
            this.speedX *= -1; // Bounce off horizontal edges
        }
        if (this.y < 0 || this.y > canvas.height) {
            this.speedY *= -1; // Bounce off vertical edges
        }
    };

    // Initialize particles
    function initParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            particles.push(new Particle(x, y));
        }
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }

        requestAnimationFrame(animate); // Loop the animation
    }

    // --- Event Listeners ---
    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles(); // Re-initialize particles on resize for better distribution
    });

    // Initial setup
    resizeCanvas();
    initParticles();
    animate();
});