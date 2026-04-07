import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    opacity: number;
    pulsePhase: number;
    pulseSpeed: number;
}

const NODE_COUNT = 80;
const MAX_DIST = 180;
const PRIMARY_COLOR = '0, 255, 245';    // Electric Cyan #00FFF5
const SECONDARY_COLOR = '0, 124, 240'; // Cool Blue #007CF0

export const NeuralBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        let particles: Particle[] = [];

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        const init = () => {
            particles = Array.from({ length: NODE_COUNT }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2.5 + 1,
                opacity: Math.random() * 0.6 + 0.4,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.02 + 0.01,
            }));
        };

        const draw = (time: number) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update & draw connections
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Move
                p.x += p.vx;
                p.y += p.vy;
                p.pulsePhase += p.pulseSpeed;

                // Bounce
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                // Draw connections
                for (let j = i + 1; j < particles.length; j++) {
                    const q = particles[j];
                    const dx = p.x - q.x;
                    const dy = p.y - q.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < MAX_DIST) {
                        const alpha = (1 - dist / MAX_DIST) * 0.35;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${PRIMARY_COLOR}, ${alpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.stroke();
                    }
                }
            }

            // Draw nodes on top
            for (const p of particles) {
                const pulse = Math.sin(p.pulsePhase) * 0.3 + 0.7;
                const r = p.radius * pulse;
                const alpha = p.opacity * pulse;

                // Glow
                const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);
                grd.addColorStop(0, `rgba(${PRIMARY_COLOR}, ${alpha * 0.6})`);
                grd.addColorStop(1, `rgba(${PRIMARY_COLOR}, 0)`);
                ctx.beginPath();
                ctx.fillStyle = grd;
                ctx.arc(p.x, p.y, r * 6, 0, Math.PI * 2);
                ctx.fill();

                // Core dot
                ctx.beginPath();
                ctx.fillStyle = `rgba(${PRIMARY_COLOR}, ${alpha})`;
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                ctx.fill();
            }

            animId = requestAnimationFrame(draw);
        };

        resize();
        init();
        animId = requestAnimationFrame(draw);

        const observer = new ResizeObserver(() => {
            resize();
            init();
        });
        observer.observe(canvas);

        return () => {
            cancelAnimationFrame(animId);
            observer.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
};
