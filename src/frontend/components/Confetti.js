import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
export default function Confetti({ active, duration = 2000, targetRef }) {
    const canvasRef = useRef(null);
    const [isActive, setIsActive] = useState(active);
    const [particles, setParticles] = useState([]);
    const animationRef = useRef();
    // Colors for the confetti particles
    const colors = [
        '#f94144', '#f3722c', '#f8961e', '#f9c74f',
        '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1',
        '#0C29AB', '#4361ee', '#3a86ff', '#fc2f68', '#ff006e',
    ];
    // Generate random particles when confetti is activated
    useEffect(() => {
        if (active && !isActive) {
            setIsActive(true);
            // Create particles
            const canvas = canvasRef.current;
            if (!canvas)
                return;
            const width = canvas.width;
            const height = canvas.height;
            const newParticles = [];
            // Calculate target element position for confetti if provided
            let targetX = width / 2;
            let targetY = height / 3;
            let targetWidth = width / 2;
            let targetHeight = 200;
            if (targetRef?.current) {
                const rect = targetRef.current.getBoundingClientRect();
                targetX = rect.left + rect.width / 2;
                targetY = rect.top + rect.height / 2;
                targetWidth = rect.width * 1.5; // Make confetti area slightly larger than the target
                targetHeight = rect.height * 1.5;
            }
            // Create 150 particles
            for (let i = 0; i < 150; i++) {
                // Generate confetti around the target element or in default position
                const randomX = targetX - targetWidth / 2 + Math.random() * targetWidth;
                const randomY = targetY - targetHeight / 2 - Math.random() * 50; // Start slightly above the target
                newParticles.push({
                    x: randomX,
                    y: randomY,
                    size: 5 + Math.random() * 10,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    velocity: {
                        x: -2 + Math.random() * 4,
                        y: 2 + Math.random() * 6
                    },
                    rotation: Math.random() * 360,
                    rotationSpeed: -4 + Math.random() * 8
                });
            }
            setParticles(newParticles);
            // Set a timer to stop the confetti after the duration
            const timer = setTimeout(() => {
                setIsActive(false);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [active, isActive, duration, colors]);
    // Animation loop to update and draw particles
    useEffect(() => {
        if (!isActive || !canvasRef.current)
            return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const width = canvas.width;
        const height = canvas.height;
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            const updatedParticles = [...particles];
            let allGone = true;
            // Update and draw each particle
            updatedParticles.forEach((p, index) => {
                // Update position
                p.x += p.velocity.x;
                p.y += p.velocity.y;
                p.velocity.y += 0.1; // Gravity
                p.rotation += p.rotationSpeed;
                // Check if at least one particle is still visible
                if (p.y < height + 50) {
                    allGone = false;
                }
                // Draw particle
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });
            setParticles(updatedParticles);
            // If all particles have fallen out of view, stop the animation
            if (allGone) {
                setIsActive(false);
                return;
            }
            animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isActive, particles]);
    // Set canvas dimensions to match its container
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const updateSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);
    if (!isActive)
        return null;
    return (_jsx("canvas", { ref: canvasRef, className: "fixed top-0 left-0 w-full h-full pointer-events-none z-50" }));
}
