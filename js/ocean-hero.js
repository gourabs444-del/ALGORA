/**
 * REAL-LIFE CINEMATIC OCEAN HORIZON & FLUID WAVE ENGINE
 * Portfolio / js/ocean-hero.js
 * 
 * Features:
 *  1. Real-Time SVG Ocean Water Surface Turbulence & Wave Displacement (60 FPS Fluid Motion)
 *  2. Multi-Layered Moving Water Wave Swells, Wake Foam & Shimmering Sun Caustics
 *  3. Flocking White Seagulls Flight Physics with Natural Wing Articulation
 */

(function initRealLifeOceanExperience() {

    // Ensure live-action background video autoplays and resumes seamlessly
    const bgVideo = document.getElementById('ocean-bg-video');
    if (bgVideo) {
        bgVideo.muted = true;
        const playPromise = bgVideo.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                const tryPlay = () => { bgVideo.play(); };
                document.addEventListener('touchstart', tryPlay, { once: true });
                document.addEventListener('click', tryPlay, { once: true });
                window.addEventListener('scroll', tryPlay, { once: true });
            });
        }
    }
    let turbTime = 0;
    
    function animateWaterTurbulence() {
        turbTime += 0.006;
        if (turbulenceNode) {
            // Dynamic oscillating harmonic frequencies that create undulating fluid water ripples
            const freqX = 0.012 + Math.sin(turbTime * 1.8) * 0.004;
            const freqY = 0.032 + Math.cos(turbTime * 2.2) * 0.008;
            turbulenceNode.setAttribute('baseFrequency', `${freqX.toFixed(4)} ${freqY.toFixed(4)}`);
        }
        requestAnimationFrame(animateWaterTurbulence);
    }
    animateWaterTurbulence();


    /* ============================================================
       2. MULTI-LAYERED OCEAN WAVE SWELLS & SUN CAUSTICS CANVAS
       ============================================================ */
    const waveCanvas = document.getElementById('ocean-wave-canvas');
    if (waveCanvas) {
        const ctx = waveCanvas.getContext('2d');
        let width = 0, height = 0;
        let waveTime = 0;
        let mouseX = -1000, mouseY = -1000;
        let targetMouseX = -1000, targetMouseY = -1000;

        function resizeWaveCanvas() {
            const rect = waveCanvas.getBoundingClientRect();
            width = waveCanvas.width = rect.width || window.innerWidth;
            height = waveCanvas.height = rect.height || (window.innerHeight * 0.52);
        }
        resizeWaveCanvas();
        window.addEventListener('resize', resizeWaveCanvas);

        window.addEventListener('mousemove', (e) => {
            const rect = waveCanvas.getBoundingClientRect();
            targetMouseX = e.clientX - rect.left;
            targetMouseY = e.clientY - rect.top;
        });

        // 95 Sun Caustic Specular Glints on Wave Crests
        const glints = [];
        const GLINT_COUNT = 95;
        for (let i = 0; i < GLINT_COUNT; i++) {
            glints.push({
                xRatio: Math.random(),
                yRatio: 0.15 + Math.random() * 0.82,
                baseSize: 1.0 + Math.random() * 3.2,
                phase: Math.random() * Math.PI * 2,
                speed: 0.025 + Math.random() * 0.045,
                drift: (Math.random() - 0.5) * 0.2,
                starFlare: Math.random() > 0.6
            });
        }

        function drawWaveCanvas() {
            ctx.clearRect(0, 0, width, height);
            waveTime += 0.016;

            mouseX += (targetMouseX - mouseX) * 0.08;
            mouseY += (targetMouseY - mouseY) * 0.08;

            // 3 Moving Translucent Wave Swell Highlights (Adds dynamic physical wave roll across water)
            const waveLayers = [
                {
                    yRatio: 0.35,
                    amplitude: 8,
                    frequency: 0.005,
                    speed: 1.2,
                    color: 'rgba(56, 189, 248, 0.14)',
                    crestColor: 'rgba(255, 255, 255, 0.28)'
                },
                {
                    yRatio: 0.62,
                    amplitude: 12,
                    frequency: 0.004,
                    speed: 1.6,
                    color: 'rgba(14, 165, 233, 0.18)',
                    crestColor: 'rgba(255, 255, 255, 0.35)'
                },
                {
                    yRatio: 0.86,
                    amplitude: 15,
                    frequency: 0.0035,
                    speed: 2.0,
                    color: 'rgba(2, 132, 199, 0.22)',
                    crestColor: 'rgba(255, 255, 255, 0.45)'
                }
            ];

            waveLayers.forEach((wl, idx) => {
                ctx.beginPath();
                const baseY = height * wl.yRatio;

                for (let x = 0; x <= width; x += 8) {
                    let y = baseY + 
                            Math.sin(x * wl.frequency + waveTime * wl.speed + idx) * wl.amplitude +
                            Math.cos(x * (wl.frequency * 1.6) - waveTime * (wl.speed * 0.8)) * (wl.amplitude * 0.4);

                    // Interactive mouse water swell
                    const dx = x - mouseX;
                    const dy = y - mouseY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 180) {
                        y += Math.sin(dist * 0.08 - waveTime * 4) * ((1 - dist / 180) * 10);
                    }

                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();

                ctx.fillStyle = wl.color;
                ctx.fill();

                // Foaming water crest highlight
                ctx.strokeStyle = wl.crestColor;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            });

            // Draw Sun Caustic Specular Glitters
            ctx.globalCompositeOperation = 'screen';
            glints.forEach(glint => {
                glint.phase += glint.speed;
                glint.xRatio += glint.drift / width;
                if (glint.xRatio > 1) glint.xRatio = 0;
                if (glint.xRatio < 0) glint.xRatio = 1;

                const gx = glint.xRatio * width;
                const gy = height * glint.yRatio + Math.sin(gx * 0.005 + waveTime * 2.0) * 7;

                const rawIntensity = (Math.sin(glint.phase) + 1) * 0.45;
                const alpha = Math.min(1, Math.max(0, rawIntensity));

                if (alpha > 0.08) {
                    ctx.save();
                    ctx.translate(gx, gy);

                    const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, glint.baseSize * 3);
                    radGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.95})`);
                    radGrad.addColorStop(0.3, `rgba(224, 242, 254, ${alpha * 0.6})`);
                    radGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

                    ctx.fillStyle = radGrad;
                    ctx.beginPath();
                    ctx.arc(0, 0, glint.baseSize * 3, 0, Math.PI * 2);
                    ctx.fill();

                    if (glint.starFlare && alpha > 0.45) {
                        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(-glint.baseSize * 4.5, 0);
                        ctx.lineTo(glint.baseSize * 4.5, 0);
                        ctx.moveTo(0, -glint.baseSize * 2.5);
                        ctx.lineTo(0, glint.baseSize * 2.5);
                        ctx.stroke();
                    }

                    ctx.restore();
                }
            });
            ctx.globalCompositeOperation = 'source-over';

            requestAnimationFrame(drawWaveCanvas);
        }
        drawWaveCanvas();
    }


    /* ============================================================
       3. FLOCKING WHITE SEAGULLS FLIGHT SIMULATION
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
                this.scale = 0.40 + Math.random() * 0.60;
                this.wingspan = 19 * this.scale;
                this.speed = (1.3 + Math.random() * 1.0) * (this.scale * 1.15);
                
                this.x = customX !== null ? customX : (init ? Math.random() * bWidth : -60);
                this.y = (bHeight * 0.08) + Math.random() * (bHeight * 0.50);
                this.baseY = this.y;

                this.flapPhase = Math.random() * Math.PI * 2;
                this.flapSpeed = 0.10 + Math.random() * 0.04;
                this.glideTimer = 0;
                this.isGliding = false;
                this.glideDuration = 130 + Math.random() * 180;
                this.flapDuration = 70 + Math.random() * 90;
                
                this.yNoise = Math.random() * 100;
            }

            update() {
                this.x += this.speed;
                this.yNoise += 0.014;
                this.y = this.baseY + Math.sin(this.yNoise) * (14 * this.scale);

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
                    ? Math.sin(this.yNoise) * 1.2 
                    : Math.sin(this.flapPhase) * (this.wingspan * 0.70);

                const w = this.wingspan;
                const bodyL = 8 * this.scale;

                bCtx.shadowColor = 'rgba(15, 23, 42, 0.35)';
                bCtx.shadowBlur = 5 * this.scale;
                bCtx.shadowOffsetY = 2.5 * this.scale;

                // Left Wing
                bCtx.beginPath();
                bCtx.moveTo(0, 0);
                bCtx.bezierCurveTo(-w * 0.3, -wingDeflection * 0.9, -w * 0.7, wingDeflection * 0.2, -w, wingDeflection * 0.5);
                bCtx.bezierCurveTo(-w * 0.6, wingDeflection * 0.1, -w * 0.25, -wingDeflection * 0.2, 0, bodyL * 0.4);
                
                // Right Wing
                bCtx.moveTo(0, 0);
                bCtx.bezierCurveTo(w * 0.3, -wingDeflection * 0.9, w * 0.7, wingDeflection * 0.2, w, wingDeflection * 0.5);
                bCtx.bezierCurveTo(w * 0.6, wingDeflection * 0.1, w * 0.25, -wingDeflection * 0.2, 0, bodyL * 0.4);
                
                bCtx.fillStyle = 'rgba(255, 255, 255, 0.96)';
                bCtx.fill();

                // Torso
                bCtx.beginPath();
                bCtx.ellipse(0, 0, 1.7 * this.scale, bodyL * 0.6, 0, 0, Math.PI * 2);
                bCtx.fillStyle = '#ffffff';
                bCtx.fill();

                // Dark Wingtips
                bCtx.beginPath();
                bCtx.arc(-w, wingDeflection * 0.5, 1.1 * this.scale, 0, Math.PI * 2);
                bCtx.arc(w, wingDeflection * 0.5, 1.1 * this.scale, 0, Math.PI * 2);
                bCtx.fillStyle = 'rgba(30, 41, 59, 0.75)';
                bCtx.fill();

                bCtx.restore();
            }
        }

        const birds = [];
        const BIRD_COUNT = 6;
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
