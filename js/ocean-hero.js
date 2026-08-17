/**
 * REAL-LIFE CINEMATIC OCEAN HORIZON ENGINE (IMAX FIDELITY)
 * Portfolio / js/ocean-hero.js
 * 
 * 1. Photorealistic Natural Sun Caustics, Water Glitter & Surface Shimmer
 * 2. High-Fidelity Avian Seagull Flight Simulation
 */

(function initRealLifeOceanExperience() {

    // Force reliable background video continuous autoplay
    const bgVideo = document.getElementById('ocean-bg-video');
    if (bgVideo) {
        bgVideo.muted = true;
        const playPromise = bgVideo.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                document.addEventListener('touchstart', () => bgVideo.play(), { once: true });
                document.addEventListener('click', () => bgVideo.play(), { once: true });
            });
        }
    }

    /* ============================================================
       1. PHOTOREALISTIC WATER SPECULAR GLINT & CAUSTICS ENGINE
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

        window.addEventListener('mousemove', (e) => {
            const rect = waveCanvas.getBoundingClientRect();
            targetMouseX = e.clientX - rect.left;
            targetMouseY = e.clientY - rect.top;
        });

        // 110 Photorealistic Sunlight Shimmer Points on Water Swells
        const glints = [];
        const GLINT_COUNT = 110;
        for (let i = 0; i < GLINT_COUNT; i++) {
            glints.push({
                xRatio: Math.random(),
                yRatio: 0.12 + Math.random() * 0.85,
                baseSize: 0.8 + Math.random() * 2.8,
                phase: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.04,
                drift: (Math.random() - 0.5) * 0.15,
                starFlare: Math.random() > 0.65
            });
        }

        function drawRealWaterEffects() {
            ctx.clearRect(0, 0, width, height);
            time += 0.015;

            mouseX += (targetMouseX - mouseX) * 0.06;
            mouseY += (targetMouseY - mouseY) * 0.06;

            ctx.globalCompositeOperation = 'screen';

            // Draw Natural Water Surface Sunlight Sparkles
            glints.forEach(glint => {
                glint.phase += glint.speed;
                glint.xRatio += glint.drift / width;
                if (glint.xRatio > 1) glint.xRatio = 0;
                if (glint.xRatio < 0) glint.xRatio = 1;

                const gx = glint.xRatio * width;
                // Vertical wave swell motion
                const gy = height * glint.yRatio + Math.sin(gx * 0.005 + time * 1.8) * 6;

                // Mouse proximity shimmer
                const dx = gx - mouseX;
                const dy = gy - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                let extraIntensity = 0;
                if (dist < 160) {
                    extraIntensity = (1 - dist / 160) * 0.5;
                }

                const rawIntensity = (Math.sin(glint.phase) + 1) * 0.4 + extraIntensity;
                const alpha = Math.min(1, Math.max(0, rawIntensity));

                if (alpha > 0.08) {
                    ctx.save();
                    ctx.translate(gx, gy);

                    // Core soft sun glint
                    const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, glint.baseSize * 2.5);
                    radGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.95})`);
                    radGrad.addColorStop(0.3, `rgba(224, 242, 254, ${alpha * 0.6})`);
                    radGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

                    ctx.fillStyle = radGrad;
                    ctx.beginPath();
                    ctx.arc(0, 0, glint.baseSize * 2.5, 0, Math.PI * 2);
                    ctx.fill();

                    // Anamorphic horizontal sun flare cross for bright points
                    if (glint.starFlare && alpha > 0.5) {
                        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
                        ctx.lineWidth = 0.75;
                        ctx.beginPath();
                        ctx.moveTo(-glint.baseSize * 4, 0);
                        ctx.lineTo(glint.baseSize * 4, 0);
                        ctx.moveTo(0, -glint.baseSize * 2);
                        ctx.lineTo(0, glint.baseSize * 2);
                        ctx.stroke();
                    }

                    ctx.restore();
                }
            });

            ctx.globalCompositeOperation = 'source-over';
            requestAnimationFrame(drawRealWaterEffects);
        }
        drawRealWaterEffects();
    }


    /* ============================================================
       2. PHOTOREALISTIC AVIAN SEAGULL FLIGHT ENGINE
       ============================================================ */
    const birdsCanvas = document.getElementById('ocean-birds-canvas');
    if (birdsCanvas) {
        const bCtx = birdsCanvas.getContext('2d');
        let bWidth = 0, bHeight = 0;

        function resizeBirdsCanvas() {
            const rect = birdsCanvas.getBoundingClientRect();
            bWidth = birdsCanvas.width = rect.width || window.innerWidth;
            bHeight = birdsCanvas.height = rect.height || (window.innerHeight * 0.65);
        }
        resizeBirdsCanvas();
        window.addEventListener('resize', resizeBirdsCanvas);

        class RealCinematicSeagull {
            constructor(initX = null) {
                this.reset(true, initX);
            }

            reset(init = false, customX = null) {
                this.scale = 0.35 + Math.random() * 0.55; // Distance scaling
                this.wingspan = 18 * this.scale;
                this.speed = (1.2 + Math.random() * 0.9) * (this.scale * 1.15);
                
                this.x = customX !== null ? customX : (init ? Math.random() * bWidth : -60);
                this.y = (bHeight * 0.08) + Math.random() * (bHeight * 0.55);
                this.baseY = this.y;

                this.flapPhase = Math.random() * Math.PI * 2;
                this.flapSpeed = 0.09 + Math.random() * 0.04;
                this.glideTimer = 0;
                this.isGliding = false;
                this.glideDuration = 140 + Math.random() * 200;
                this.flapDuration = 70 + Math.random() * 90;
                
                this.yNoise = Math.random() * 100;
            }

            update() {
                this.x += this.speed;
                this.yNoise += 0.012;
                
                // Natural atmospheric wind drift
                this.y = this.baseY + Math.sin(this.yNoise) * (12 * this.scale);

                // Flap and Glide cycles
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

                if (this.x > bWidth + 80) {
                    this.reset(false, -50);
                }
            }

            draw() {
                bCtx.save();
                bCtx.translate(this.x, this.y);

                let wingDeflection = this.isGliding 
                    ? Math.sin(this.yNoise) * 1.0 
                    : Math.sin(this.flapPhase) * (this.wingspan * 0.65);

                const w = this.wingspan;
                const bodyL = 8 * this.scale;

                // Subtle atmospheric depth fade & ambient shadow
                bCtx.shadowColor = 'rgba(15, 23, 42, 0.35)';
                bCtx.shadowBlur = 5 * this.scale;
                bCtx.shadowOffsetY = 2.5 * this.scale;

                // Real avian gull wing anatomy
                bCtx.beginPath();
                // Left Wing
                bCtx.moveTo(0, 0);
                bCtx.bezierCurveTo(-w * 0.3, -wingDeflection * 0.9, -w * 0.7, wingDeflection * 0.2, -w, wingDeflection * 0.5);
                bCtx.bezierCurveTo(-w * 0.6, wingDeflection * 0.1, -w * 0.25, -wingDeflection * 0.2, 0, bodyL * 0.4);
                
                // Right Wing
                bCtx.moveTo(0, 0);
                bCtx.bezierCurveTo(w * 0.3, -wingDeflection * 0.9, w * 0.7, wingDeflection * 0.2, w, wingDeflection * 0.5);
                bCtx.bezierCurveTo(w * 0.6, wingDeflection * 0.1, w * 0.25, -wingDeflection * 0.2, 0, bodyL * 0.4);
                
                bCtx.fillStyle = 'rgba(255, 255, 255, 0.96)';
                bCtx.fill();

                // Slender Gull Body & Beak
                bCtx.beginPath();
                bCtx.ellipse(0, 0, 1.6 * this.scale, bodyL * 0.6, 0, 0, Math.PI * 2);
                bCtx.fillStyle = '#ffffff';
                bCtx.fill();

                // Soft dark wingtip feather tips
                bCtx.beginPath();
                bCtx.arc(-w, wingDeflection * 0.5, 1.0 * this.scale, 0, Math.PI * 2);
                bCtx.arc(w, wingDeflection * 0.5, 1.0 * this.scale, 0, Math.PI * 2);
                bCtx.fillStyle = 'rgba(30, 41, 59, 0.7)';
                bCtx.fill();

                bCtx.restore();
            }
        }

        const birds = [];
        const BIRD_COUNT = 5;
        for (let i = 0; i < BIRD_COUNT; i++) {
            const posX = (bWidth / BIRD_COUNT) * i + (Math.random() * 80 - 40);
            birds.push(new RealCinematicSeagull(posX));
        }

        function animateBirds() {
            bCtx.clearRect(0, 0, bWidth, bHeight);

            birds.forEach(bird => {
                bird.update();
                bird.draw();
            });

            requestAnimationFrame(animateBirds);
        }
        animateBirds();
    }

})();
