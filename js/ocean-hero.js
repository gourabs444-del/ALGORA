/**
 * OCEAN HORIZON LANDING HERO ENGINE
 * Portfolio / js/ocean-hero.js
 * 
 * Features:
 *  1. Procedural 240 FPS Fluid Ocean Swell Waves & Sun Shimmer Caustics
 *  2. Autonomous Realistic White Seagulls Flight Physics with Dynamic Wing Flapping & Gliding
 *  3. Interactive Water Wake Ripples on Mouse Motion
 */

(function initOceanHorizonExperience() {

    /* ============================================================
       1. FLUID OCEAN WAVES & SUN CAUSTICS ENGINE
       ============================================================ */
    const waveCanvas = document.getElementById('ocean-wave-canvas');
    if (waveCanvas) {
        const ctx = waveCanvas.getContext('2d');
        let width = 0, height = 0;
        let time = 0;
        let mouseX = -1000, mouseY = -1000;
        let targetMouseX = -1000, targetMouseY = -1000;

        function resizeWaveCanvas() {
            const rect = waveCanvas.getBoundingClientRect();
            width = waveCanvas.width = rect.width || window.innerWidth;
            height = waveCanvas.height = rect.height || (window.innerHeight * 0.55);
        }
        resizeWaveCanvas();
        window.addEventListener('resize', resizeWaveCanvas);

        // Track cursor for water ripples
        window.addEventListener('mousemove', (e) => {
            const rect = waveCanvas.getBoundingClientRect();
            targetMouseX = e.clientX - rect.left;
            targetMouseY = e.clientY - rect.top;
        });

        // 85 Sun Caustic Glimmer Particles
        const caustics = [];
        const CAUSTIC_COUNT = 85;
        for (let i = 0; i < CAUSTIC_COUNT; i++) {
            caustics.push({
                xRatio: Math.random(),
                yRatio: 0.15 + Math.random() * 0.8,
                size: 1.5 + Math.random() * 4.5,
                phase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.03 + Math.random() * 0.05,
                driftSpeed: (Math.random() - 0.5) * 0.2
            });
        }

        function drawWaves() {
            ctx.clearRect(0, 0, width, height);
            time += 0.018;

            // Ease mouse position
            mouseX += (targetMouseX - mouseX) * 0.08;
            mouseY += (targetMouseY - mouseY) * 0.08;

            // Wave Layer Definitions (Front to Back for Realistic Depth)
            const layers = [
                {
                    amplitude: 7,
                    frequency: 0.005,
                    speed: 0.02,
                    yOffset: height * 0.25,
                    color: 'rgba(2, 132, 199, 0.18)',
                    highlight: 'rgba(224, 242, 254, 0.15)'
                },
                {
                    amplitude: 11,
                    frequency: 0.007,
                    speed: 0.03,
                    yOffset: height * 0.45,
                    color: 'rgba(14, 165, 233, 0.22)',
                    highlight: 'rgba(255, 255, 255, 0.25)'
                },
                {
                    amplitude: 14,
                    frequency: 0.006,
                    speed: 0.025,
                    yOffset: height * 0.68,
                    color: 'rgba(56, 189, 248, 0.28)',
                    highlight: 'rgba(255, 255, 255, 0.35)'
                },
                {
                    amplitude: 16,
                    frequency: 0.004,
                    speed: 0.035,
                    yOffset: height * 0.88,
                    color: 'rgba(6, 182, 212, 0.32)',
                    highlight: 'rgba(255, 255, 255, 0.45)'
                }
            ];

            layers.forEach((layer, layerIdx) => {
                ctx.beginPath();
                ctx.moveTo(0, height);

                for (let x = 0; x <= width; x += 6) {
                    // Multi-harmonic sine swells
                    let y = layer.yOffset + 
                            Math.sin(x * layer.frequency + time * (layer.speed * 60) + layerIdx) * layer.amplitude +
                            Math.cos(x * (layer.frequency * 1.8) - time * 0.8) * (layer.amplitude * 0.4);

                    // Interactive mouse disturbance
                    const dx = x - mouseX;
                    const dy = y - mouseY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 180) {
                        const mouseFactor = (1 - dist / 180) * 12;
                        y += Math.sin(dist * 0.1 - time * 4) * mouseFactor;
                    }

                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();

                // Gradient fill for oceanic depth
                const grad = ctx.createLinearGradient(0, layer.yOffset - layer.amplitude, 0, height);
                grad.addColorStop(0, layer.color);
                grad.addColorStop(1, 'rgba(2, 6, 23, 0.65)');
                ctx.fillStyle = grad;
                ctx.fill();

                // Crest water highlight
                ctx.strokeStyle = layer.highlight;
                ctx.lineWidth = 1.2;
                ctx.stroke();
            });

            // Draw Sun Caustic Specular Glitters
            caustics.forEach((caustic) => {
                caustic.phase += caustic.pulseSpeed;
                caustic.xRatio += (caustic.driftSpeed / width);
                if (caustic.xRatio > 1) caustic.xRatio = 0;
                if (caustic.xRatio < 0) caustic.xRatio = 1;

                const cx = caustic.xRatio * width;
                const waveY = height * caustic.yRatio + Math.sin(cx * 0.006 + time * 1.5) * 8;
                const alpha = Math.max(0, (Math.sin(caustic.phase) + 1) * 0.45);

                if (alpha > 0.05) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(cx, waveY, caustic.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.shadowColor = 'rgba(224, 242, 254, 0.9)';
                    ctx.shadowBlur = 8;
                    ctx.fill();
                    ctx.restore();
                }
            });

            requestAnimationFrame(drawWaves);
        }
        drawWaves();
    }


    /* ============================================================
       2. FLOCKING WHITE SEAGULLS FLIGHT ENGINE
       ============================================================ */
    const birdsCanvas = document.getElementById('ocean-birds-canvas');
    if (birdsCanvas) {
        const bCtx = birdsCanvas.getContext('2d');
        let bWidth = 0, bHeight = 0;

        function resizeBirdsCanvas() {
            const rect = birdsCanvas.getBoundingClientRect();
            bWidth = birdsCanvas.width = rect.width || window.innerWidth;
            bHeight = birdsCanvas.height = rect.height || (window.innerHeight * 0.7);
        }
        resizeBirdsCanvas();
        window.addEventListener('resize', resizeBirdsCanvas);

        class RealisticWhiteSeagull {
            constructor(initX = null) {
                this.reset(true, initX);
            }

            reset(init = false, customX = null) {
                this.scale = 0.45 + Math.random() * 0.65; // Varied depth scales (distant to foreground)
                this.wingspan = 16 * this.scale;
                this.speed = (1.4 + Math.random() * 1.2) * (this.scale * 1.1);
                
                this.x = customX !== null ? customX : (init ? Math.random() * bWidth : -60);
                this.y = (bHeight * 0.12) + Math.random() * (bHeight * 0.48);
                this.baseY = this.y;

                this.flapPhase = Math.random() * Math.PI * 2;
                this.flapSpeed = 0.12 + Math.random() * 0.06;
                this.glideTimer = 0;
                this.isGliding = false;
                this.glideDuration = 120 + Math.random() * 180;
                this.flapDuration = 80 + Math.random() * 100;
                
                this.angle = 0;
                this.yOffsetNoise = Math.random() * 100;
            }

            update() {
                this.x += this.speed;
                this.yOffsetNoise += 0.015;
                
                // Gentle thermal air lift sinusoidal motion
                this.y = this.baseY + Math.sin(this.yOffsetNoise) * (14 * this.scale);

                // Flapping vs Gliding State Machine
                this.glideTimer++;
                if (!this.isGliding && this.glideTimer > this.flapDuration) {
                    this.isGliding = true;
                    this.glideTimer = 0;
                } else if (this.isGliding && this.glideTimer > this.glideDuration) {
                    this.isGliding = false;
                    this.glideTimer = 0;
                }

                if (!this.isGliding) {
                    this.flapPhase += this.flapSpeed;
                }

                // Reset when flown across screen
                if (this.x > bWidth + 80) {
                    this.reset(false, -50);
                }
            }

            draw() {
                bCtx.save();
                bCtx.translate(this.x, this.y);

                // Wing flapping deflection: harmonic bend or flat glide
                let wingY = this.isGliding 
                    ? Math.sin(this.yOffsetNoise) * 1.5 
                    : Math.sin(this.flapPhase) * (this.wingspan * 0.7);

                const w = this.wingspan;
                const bodyLen = 7 * this.scale;

                // Subtle ambient drop shadow for 3D realism
                bCtx.shadowColor = 'rgba(0, 40, 80, 0.25)';
                bCtx.shadowBlur = 6 * this.scale;
                bCtx.shadowOffsetY = 3 * this.scale;

                // Draw Left Wing (Bezier curved organic avian wing)
                bCtx.beginPath();
                bCtx.moveTo(0, 0);
                bCtx.quadraticCurveTo(-w * 0.5, -wingY * 1.1, -w, wingY * 0.6);
                bCtx.quadraticCurveTo(-w * 0.45, -wingY * 0.3, 0, bodyLen * 0.3);
                bCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                bCtx.fill();

                // Draw Right Wing
                bCtx.beginPath();
                bCtx.moveTo(0, 0);
                bCtx.quadraticCurveTo(w * 0.5, -wingY * 1.1, w, wingY * 0.6);
                bCtx.quadraticCurveTo(w * 0.45, -wingY * 0.3, 0, bodyLen * 0.3);
                bCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                bCtx.fill();

                // Draw Sleek Seagull Torso / Head
                bCtx.beginPath();
                bCtx.ellipse(0, 0, 1.8 * this.scale, bodyLen * 0.6, 0, 0, Math.PI * 2);
                bCtx.fillStyle = '#ffffff';
                bCtx.fill();

                // Subtle wingtip dark feather accents (natural plumage detail)
                bCtx.beginPath();
                bCtx.arc(-w, wingY * 0.6, 1.2 * this.scale, 0, Math.PI * 2);
                bCtx.arc(w, wingY * 0.6, 1.2 * this.scale, 0, Math.PI * 2);
                bCtx.fillStyle = 'rgba(71, 85, 105, 0.6)';
                bCtx.fill();

                bCtx.restore();
            }
        }

        // Initialize 6 White Seagulls across the horizon
        const seagulls = [];
        const SEAGULL_COUNT = 6;
        for (let i = 0; i < SEAGULL_COUNT; i++) {
            const staggeredX = (bWidth / SEAGULL_COUNT) * i + (Math.random() * 100 - 50);
            seagulls.push(new RealisticWhiteSeagull(staggeredX));
        }

        function animateBirds() {
            bCtx.clearRect(0, 0, bWidth, bHeight);

            seagulls.forEach(bird => {
                bird.update();
                bird.draw();
            });

            requestAnimationFrame(animateBirds);
        }
        animateBirds();
    }

})();
