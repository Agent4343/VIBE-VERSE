/**
 * ParallaxBackground - Multi-layered scrolling background system
 * Creates depth and atmosphere for the fighting arena
 */

import Phaser from 'phaser';
import { DEPTH } from '../config/fightConfig.js';

export default class ParallaxBackground {
    constructor(scene) {
        this.scene = scene;
        this.layers = [];
        this.width = scene.cameras.main.width;
        this.height = scene.cameras.main.height;
    }

    /**
     * Create a complete arena background
     */
    createArena(arenaType = 'neon_city') {
        switch (arenaType) {
            case 'neon_city':
                this.createNeonCityArena();
                break;
            case 'dojo':
                this.createDojoArena();
                break;
            case 'rooftop':
                this.createRooftopArena();
                break;
            case 'underground':
                this.createUndergroundArena();
                break;
            default:
                this.createNeonCityArena();
        }
    }

    createNeonCityArena() {
        // Layer 1: Deep space / sky gradient
        this.createSkyLayer();

        // Layer 2: Distant stars
        this.createStarsLayer();

        // Layer 3: Nebula clouds
        this.createNebulaLayer();

        // Layer 4: Far city silhouette
        this.createFarCityLayer();

        // Layer 5: Mid city buildings
        this.createMidCityLayer();

        // Layer 6: Near buildings with neon
        this.createNearCityLayer();

        // Layer 7: Arena floor
        this.createArenaFloor();

        // Layer 8: Arena decorations
        this.createArenaDecorations();

        // Layer 9: Atmospheric particles
        this.createAtmosphericParticles();

        // Layer 10: Lighting effects
        this.createLightingEffects();
    }

    createSkyLayer() {
        const sky = this.scene.add.graphics();
        sky.setDepth(DEPTH.BACKGROUND);

        // Deep gradient from dark purple to black
        const gradient = sky.createGeometryMask();
        sky.fillGradientStyle(0x1a0a3e, 0x1a0a3e, 0x050510, 0x050510, 1);
        sky.fillRect(0, 0, this.width, this.height);

        // Add some color variation
        const overlay = this.scene.add.graphics();
        overlay.setDepth(DEPTH.BACKGROUND + 0.1);
        overlay.fillGradientStyle(0x0a0020, 0x200040, 0x0a0020, 0x100030, 0.3, 0.3, 0.3, 0.3);
        overlay.fillRect(0, 0, this.width, this.height * 0.6);

        this.layers.push({ obj: sky, speed: 0, type: 'static' });
    }

    createStarsLayer() {
        const starsContainer = this.scene.add.container(0, 0);
        starsContainer.setDepth(DEPTH.BACKGROUND + 0.2);

        // Multiple star sizes and brightnesses
        for (let i = 0; i < 120; i++) {
            const x = Phaser.Math.Between(0, this.width);
            const y = Phaser.Math.Between(0, this.height * 0.65);
            const size = Phaser.Math.FloatBetween(0.5, 2.5);
            const alpha = Phaser.Math.FloatBetween(0.2, 0.9);
            const color = Phaser.Math.RND.pick([0xffffff, 0x88ccff, 0xffcc88, 0xff88cc]);

            const star = this.scene.add.circle(x, y, size, color, alpha);
            starsContainer.add(star);

            // Twinkle effect
            if (Math.random() > 0.6) {
                this.scene.tweens.add({
                    targets: star,
                    alpha: Phaser.Math.FloatBetween(0.1, 0.4),
                    duration: Phaser.Math.Between(1500, 4000),
                    yoyo: true,
                    repeat: -1,
                    delay: Phaser.Math.Between(0, 3000)
                });
            }
        }

        this.layers.push({ obj: starsContainer, speed: 0.02, type: 'parallax' });
    }

    createNebulaLayer() {
        const nebulas = this.scene.add.container(0, 0);
        nebulas.setDepth(DEPTH.BACKGROUND + 0.3);

        const nebulaColors = [0xff0066, 0x00ffff, 0x9900ff, 0xff6600, 0x6600ff];

        for (let i = 0; i < 6; i++) {
            const x = Phaser.Math.Between(50, this.width - 50);
            const y = Phaser.Math.Between(30, this.height * 0.45);
            const color = Phaser.Math.RND.pick(nebulaColors);
            const size = Phaser.Math.Between(80, 180);

            // Multiple overlapping circles for nebula effect
            for (let j = 0; j < 3; j++) {
                const nebula = this.scene.add.circle(
                    x + Phaser.Math.Between(-20, 20),
                    y + Phaser.Math.Between(-20, 20),
                    size - j * 20,
                    color,
                    0.05 + j * 0.02
                );
                nebulas.add(nebula);

                // Slow drift animation
                this.scene.tweens.add({
                    targets: nebula,
                    x: nebula.x + Phaser.Math.Between(-25, 25),
                    y: nebula.y + Phaser.Math.Between(-15, 15),
                    alpha: { from: nebula.alpha, to: nebula.alpha + 0.03 },
                    scale: { from: 1, to: 1.15 },
                    duration: Phaser.Math.Between(6000, 12000),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.inOut'
                });
            }
        }

        this.layers.push({ obj: nebulas, speed: 0.03, type: 'parallax' });
    }

    createFarCityLayer() {
        const farCity = this.scene.add.graphics();
        farCity.setDepth(DEPTH.BACKGROUND + 0.5);

        // Very distant, dark city silhouette
        const baseY = this.height * 0.55;

        for (let x = 0; x < this.width; x += Phaser.Math.Between(40, 80)) {
            const buildingHeight = Phaser.Math.Between(30, 80);
            const buildingWidth = Phaser.Math.Between(30, 60);

            farCity.fillStyle(0x0a0a15, 0.8);
            farCity.fillRect(x, baseY - buildingHeight, buildingWidth, buildingHeight + 100);

            // Tiny window lights
            if (Math.random() > 0.4) {
                const windowColor = Phaser.Math.RND.pick([0xffff00, 0x00ffff, 0xff00ff]);
                for (let w = 0; w < 2; w++) {
                    farCity.fillStyle(windowColor, 0.3);
                    farCity.fillRect(
                        x + 8 + w * 15,
                        baseY - buildingHeight + 10 + Math.random() * (buildingHeight - 20),
                        3, 3
                    );
                }
            }
        }

        this.layers.push({ obj: farCity, speed: 0.05, type: 'parallax' });
    }

    createMidCityLayer() {
        const midCity = this.scene.add.graphics();
        midCity.setDepth(DEPTH.BACKGROUND + 0.7);

        const baseY = this.height * 0.58;

        for (let x = -20; x < this.width + 20; x += Phaser.Math.Between(50, 90)) {
            const buildingHeight = Phaser.Math.Between(60, 140);
            const buildingWidth = Phaser.Math.Between(40, 70);

            // Building body
            midCity.fillStyle(0x12121f, 0.9);
            midCity.fillRect(x, baseY - buildingHeight, buildingWidth, buildingHeight + 100);

            // Building edge highlight
            midCity.fillStyle(0x2a2a40, 0.5);
            midCity.fillRect(x, baseY - buildingHeight, 3, buildingHeight);

            // Windows
            const windowColor = Phaser.Math.RND.pick([0xffff00, 0x00ffff, 0xff00ff, 0xff6600]);
            for (let row = 0; row < Math.floor(buildingHeight / 15); row++) {
                for (let col = 0; col < Math.floor(buildingWidth / 12); col++) {
                    if (Math.random() > 0.35) {
                        midCity.fillStyle(windowColor, 0.4 + Math.random() * 0.3);
                        midCity.fillRect(x + 6 + col * 12, baseY - buildingHeight + 8 + row * 15, 5, 6);
                    }
                }
            }

            // Occasional rooftop antenna
            if (Math.random() > 0.7) {
                midCity.fillStyle(0x333344, 1);
                midCity.fillRect(x + buildingWidth / 2 - 1, baseY - buildingHeight - 20, 2, 20);
                midCity.fillStyle(0xff0000, 0.8);
                midCity.fillCircle(x + buildingWidth / 2, baseY - buildingHeight - 20, 2);
            }
        }

        this.layers.push({ obj: midCity, speed: 0.08, type: 'parallax' });
    }

    createNearCityLayer() {
        const nearCity = this.scene.add.container(0, 0);
        nearCity.setDepth(DEPTH.BACKGROUND + 0.9);

        const baseY = this.height * 0.62;

        // Create detailed buildings with neon signs
        const buildingConfigs = [
            { x: -30, w: 100, h: 180, neon: true, neonColor: 0xff0066, neonText: 'FIGHT' },
            { x: 120, w: 80, h: 140, neon: false },
            { x: 220, w: 90, h: 160, neon: true, neonColor: 0x00ffff, neonText: 'CLUB' },
            { x: this.width - 200, w: 85, h: 150, neon: true, neonColor: 0xff6600, neonText: 'BAR' },
            { x: this.width - 90, w: 110, h: 190, neon: false }
        ];

        buildingConfigs.forEach(config => {
            // Main building
            const building = this.scene.add.graphics();
            building.fillStyle(0x1a1a28, 1);
            building.fillRect(config.x, baseY - config.h, config.w, config.h + 100);

            // Windows
            const windowColor = Phaser.Math.RND.pick([0xffff00, 0x00ffff, 0xff00ff]);
            for (let row = 0; row < Math.floor(config.h / 18); row++) {
                for (let col = 0; col < Math.floor(config.w / 14); col++) {
                    if (Math.random() > 0.3) {
                        building.fillStyle(windowColor, 0.5 + Math.random() * 0.4);
                        building.fillRect(config.x + 8 + col * 14, baseY - config.h + 10 + row * 18, 7, 9);
                    }
                }
            }

            nearCity.add(building);

            // Neon sign
            if (config.neon) {
                const neonSign = this.scene.add.text(
                    config.x + config.w / 2,
                    baseY - config.h + 30,
                    config.neonText,
                    {
                        fontFamily: 'Arial Black',
                        fontSize: '18px',
                        color: Phaser.Display.Color.IntegerToColor(config.neonColor).rgba
                    }
                ).setOrigin(0.5);
                nearCity.add(neonSign);

                // Neon glow
                const glow = this.scene.add.circle(
                    config.x + config.w / 2,
                    baseY - config.h + 30,
                    30,
                    config.neonColor,
                    0.2
                );
                nearCity.add(glow);

                // Flicker effect
                this.scene.tweens.add({
                    targets: [neonSign, glow],
                    alpha: { from: 1, to: 0.7 },
                    duration: Phaser.Math.Between(100, 300),
                    yoyo: true,
                    repeat: -1,
                    repeatDelay: Phaser.Math.Between(2000, 5000)
                });
            }
        });

        this.layers.push({ obj: nearCity, speed: 0.1, type: 'parallax' });
    }

    createArenaFloor() {
        const floorY = this.height * 0.72;
        const floor = this.scene.add.container(0, 0);
        floor.setDepth(DEPTH.ARENA);

        // Main floor surface
        const floorSurface = this.scene.add.graphics();
        floorSurface.fillGradientStyle(0x222244, 0x222244, 0x1a1a33, 0x1a1a33, 1);
        floorSurface.fillRect(0, floorY, this.width, this.height - floorY);
        floor.add(floorSurface);

        // Neon grid
        const gridColor = 0x6644aa;
        const gridLines = this.scene.add.graphics();

        // Vertical lines with perspective
        for (let i = 0; i < this.width; i += 50) {
            gridLines.lineStyle(1, gridColor, 0.3);
            gridLines.lineBetween(i, floorY, i, this.height);
        }

        // Horizontal lines
        for (let j = floorY; j < this.height; j += 25) {
            const progress = (j - floorY) / (this.height - floorY);
            gridLines.lineStyle(1, gridColor, 0.15 + progress * 0.2);
            gridLines.lineBetween(0, j, this.width, j);
        }
        floor.add(gridLines);

        // Floor edge glow
        const edgeGlow = this.scene.add.rectangle(this.width / 2, floorY + 2, this.width, 6, 0x00ffff, 0.7);
        floor.add(edgeGlow);

        this.scene.tweens.add({
            targets: edgeGlow,
            alpha: { from: 0.7, to: 0.3 },
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        // Side glows
        const leftGlow = this.scene.add.rectangle(4, (floorY + this.height) / 2, 8, this.height - floorY, 0x00ffff, 0.5);
        const rightGlow = this.scene.add.rectangle(this.width - 4, (floorY + this.height) / 2, 8, this.height - floorY, 0xff00ff, 0.5);
        floor.add(leftGlow);
        floor.add(rightGlow);

        this.scene.tweens.add({
            targets: [leftGlow, rightGlow],
            alpha: { from: 0.5, to: 0.2 },
            duration: 2000,
            yoyo: true,
            repeat: -1
        });

        this.layers.push({ obj: floor, speed: 0, type: 'static' });
    }

    createArenaDecorations() {
        const decorations = this.scene.add.container(0, 0);
        decorations.setDepth(DEPTH.ARENA + 0.5);

        const floorY = this.height * 0.72;

        // Left pillar
        this.createPillar(decorations, 35, floorY, 0x8866cc);

        // Right pillar
        this.createPillar(decorations, this.width - 35, floorY, 0x8866cc);

        // Arena name sign
        const nameGlow = this.scene.add.rectangle(this.width / 2, 55, 280, 40, 0x000000, 0.5);
        decorations.add(nameGlow);

        const arenaName = this.scene.add.text(this.width / 2, 55, 'NEON COLOSSEUM', {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0.25);
        decorations.add(arenaName);

        this.scene.tweens.add({
            targets: arenaName,
            alpha: { from: 0.2, to: 0.35 },
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Crowd silhouettes in background
        this.createCrowdSilhouettes(decorations, floorY);

        this.layers.push({ obj: decorations, speed: 0, type: 'static' });
    }

    createPillar(container, x, floorY, color) {
        const pillarGraphics = this.scene.add.graphics();

        // Main pillar body
        pillarGraphics.fillStyle(color, 0.8);
        pillarGraphics.fillRect(x - 18, floorY - 220, 36, 220);

        // Pillar highlight
        pillarGraphics.fillStyle(0xffffff, 0.25);
        pillarGraphics.fillRect(x - 6, floorY - 220, 12, 220);

        // Pillar glow orb
        const glow = this.scene.add.circle(x, floorY - 110, 25, color, 0.4);
        container.add(glow);

        this.scene.tweens.add({
            targets: glow,
            alpha: { from: 0.4, to: 0.15 },
            scale: { from: 1, to: 1.3 },
            duration: 1800,
            yoyo: true,
            repeat: -1
        });

        // Electric arcs from pillar (occasional)
        this.scene.time.addEvent({
            delay: 4000,
            callback: () => {
                const arc = this.scene.add.graphics();
                arc.setDepth(DEPTH.ARENA + 1);
                arc.lineStyle(2, 0x00ffff, 0.9);

                let arcX = x;
                let arcY = floorY - 180;
                arc.moveTo(arcX, arcY);

                for (let i = 0; i < 5; i++) {
                    arcX += (x < this.width / 2 ? 1 : -1) * Phaser.Math.Between(8, 20);
                    arcY += Phaser.Math.Between(15, 30);
                    arc.lineTo(arcX, arcY);
                }
                arc.stroke();

                this.scene.tweens.add({
                    targets: arc,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => arc.destroy()
                });
            },
            loop: true
        });

        container.add(pillarGraphics);
    }

    createCrowdSilhouettes(container, floorY) {
        const crowdY = floorY - 200;
        const crowd = this.scene.add.graphics();

        // Draw crowd as simple heads
        for (let x = 60; x < this.width - 60; x += 15) {
            if (Math.random() > 0.3) {
                const headY = crowdY + Phaser.Math.Between(-10, 10);
                crowd.fillStyle(0x111118, 0.6);
                crowd.fillCircle(x, headY, 6);
                // Occasional arm raised
                if (Math.random() > 0.8) {
                    crowd.fillRect(x - 1, headY - 15, 2, 12);
                }
            }
        }

        container.add(crowd);

        // Animated cheering hands
        this.scene.time.addEvent({
            delay: 2000,
            callback: () => {
                const handX = Phaser.Math.Between(80, this.width - 80);
                const hand = this.scene.add.graphics();
                hand.setDepth(DEPTH.BACKGROUND + 0.95);
                hand.fillStyle(0x222233, 0.7);
                hand.fillRect(handX, crowdY - 5, 3, 15);

                this.scene.tweens.add({
                    targets: hand,
                    y: -15,
                    duration: 300,
                    yoyo: true,
                    repeat: 2,
                    onComplete: () => hand.destroy()
                });
            },
            loop: true
        });
    }

    createAtmosphericParticles() {
        const particles = this.scene.add.container(0, 0);
        particles.setDepth(DEPTH.ARENA + 2);

        const floorY = this.height * 0.72;

        // Floating dust/energy motes
        for (let i = 0; i < 40; i++) {
            const x = Phaser.Math.Between(50, this.width - 50);
            const y = Phaser.Math.Between(100, floorY - 30);
            const size = Phaser.Math.FloatBetween(1, 3);
            const color = Phaser.Math.RND.pick([0xffffff, 0x00ffff, 0xff00ff, 0xffff00]);
            const alpha = Phaser.Math.FloatBetween(0.2, 0.5);

            const particle = this.scene.add.circle(x, y, size, color, alpha);
            particles.add(particle);

            // Float upward and reset
            this.scene.tweens.add({
                targets: particle,
                y: particle.y - Phaser.Math.Between(80, 180),
                x: particle.x + Phaser.Math.Between(-40, 40),
                alpha: 0,
                duration: Phaser.Math.Between(5000, 10000),
                repeat: -1,
                delay: Phaser.Math.Between(0, 4000),
                onRepeat: () => {
                    particle.x = Phaser.Math.Between(50, this.width - 50);
                    particle.y = Phaser.Math.Between(floorY - 50, floorY);
                    particle.alpha = Phaser.Math.FloatBetween(0.2, 0.5);
                }
            });
        }

        this.layers.push({ obj: particles, speed: 0, type: 'animated' });
    }

    createLightingEffects() {
        const lighting = this.scene.add.container(0, 0);
        lighting.setDepth(DEPTH.ARENA + 3);

        // Spotlight beams from above
        for (let i = 0; i < 3; i++) {
            const beamX = this.width * (0.25 + i * 0.25);
            const beam = this.scene.add.graphics();

            beam.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, 0.03, 0.03, 0, 0);
            beam.fillTriangle(
                beamX - 40, 0,
                beamX + 40, 0,
                beamX, this.height * 0.7
            );
            lighting.add(beam);

            this.scene.tweens.add({
                targets: beam,
                alpha: { from: 1, to: 0.5 },
                duration: Phaser.Math.Between(3000, 6000),
                yoyo: true,
                repeat: -1,
                delay: i * 600
            });
        }

        // Scanlines overlay for retro feel
        const scanlines = this.scene.add.graphics();
        scanlines.setAlpha(0.03);
        for (let y = 0; y < this.height; y += 3) {
            scanlines.lineStyle(1, 0x000000, 1);
            scanlines.lineBetween(0, y, this.width, y);
        }
        lighting.add(scanlines);

        this.layers.push({ obj: lighting, speed: 0, type: 'static' });
    }

    /**
     * Update parallax based on camera or fighter position
     */
    update(cameraX = 0) {
        this.layers.forEach(layer => {
            if (layer.type === 'parallax') {
                layer.obj.x = -cameraX * layer.speed;
            }
        });
    }

    /**
     * Create alternative arena styles
     */
    createDojoArena() {
        // Traditional Japanese dojo style
        // Implementation for different arena types...
    }

    createRooftopArena() {
        // City rooftop at night
        // Implementation for different arena types...
    }

    createUndergroundArena() {
        // Underground fight club
        // Implementation for different arena types...
    }

    destroy() {
        this.layers.forEach(layer => {
            if (layer.obj && layer.obj.destroy) {
                layer.obj.destroy();
            }
        });
        this.layers = [];
    }
}
