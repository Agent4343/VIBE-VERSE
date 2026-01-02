/**
 * SpriteGenerator - Creates high-quality sprite textures for fighters
 * These generated textures can be replaced with real art assets later
 */

import Phaser from 'phaser';

export default class SpriteGenerator {
    constructor(scene) {
        this.scene = scene;
        this.textureCache = new Map();
    }

    /**
     * Generate a complete fighter sprite sheet texture
     */
    generateFighterSpriteSheet(fighterId, config) {
        const key = `fighter_${fighterId}`;

        if (this.textureCache.has(key)) {
            return key;
        }

        const frameWidth = 128;
        const frameHeight = 192;
        const frames = {
            idle: 4,
            walk: 6,
            jump: 3,
            punch: 4,
            kick: 5,
            uppercut: 4,
            sweep: 4,
            special: 6,
            hit: 3,
            block: 2,
            ko: 4,
            victory: 6
        };

        const totalFrames = Object.values(frames).reduce((a, b) => a + b, 0);
        const cols = 8;
        const rows = Math.ceil(totalFrames / cols);
        const width = cols * frameWidth;
        const height = rows * frameHeight;

        // Create render texture
        const rt = this.scene.make.renderTexture({ width, height }, false);

        let frameIndex = 0;
        let currentRow = 0;

        // Generate each animation's frames
        Object.entries(frames).forEach(([animName, frameCount]) => {
            for (let f = 0; f < frameCount; f++) {
                const col = frameIndex % cols;
                const row = Math.floor(frameIndex / cols);
                const x = col * frameWidth + frameWidth / 2;
                const y = row * frameHeight + frameHeight / 2;

                // Draw frame
                this.drawFighterFrame(rt, x, y, config, animName, f, frameCount);
                frameIndex++;
            }
        });

        // Save as texture
        rt.saveTexture(key);
        this.textureCache.set(key, { frames, frameWidth, frameHeight, cols });

        // Create animation definitions
        this.createAnimations(key, frames, frameWidth, frameHeight, cols);

        return key;
    }

    drawFighterFrame(rt, x, y, config, animName, frame, totalFrames) {
        const g = this.scene.make.graphics({ add: false });

        // Get colors
        const skin = config.skinTone || 0xd4a574;
        const skinDark = Phaser.Display.Color.ValueToColor(skin).darken(20).color;
        const skinLight = Phaser.Display.Color.ValueToColor(skin).lighten(15).color;
        const hairCol = config.hairColor || 0x222222;
        const topCol = config.outfitTop || config.color || 0xcc0000;
        const topDark = Phaser.Display.Color.ValueToColor(topCol).darken(25).color;
        const topLight = Phaser.Display.Color.ValueToColor(topCol).lighten(20).color;
        const bottomCol = config.outfitBottom || 0x222222;
        const gloveCol = config.gloveColor || config.accentColor || 0xff0000;
        const bootCol = config.bootColor || 0x111111;

        // Animation-specific transforms
        const animParams = this.getAnimationParams(animName, frame, totalFrames);

        // Apply animation transforms
        const bodyOffsetY = animParams.bodyY || 0;
        const bodyRotation = animParams.bodyRotation || 0;
        const armAngle = animParams.armAngle || 0;
        const legAngle = animParams.legAngle || 0;

        // Scale for sprite sheet (smaller than screen render)
        const scale = 0.85;

        // Center offset
        const cx = 0;
        const cy = 20 + bodyOffsetY;

        // === SHADOW ===
        g.fillStyle(0x000000, 0.4);
        g.fillEllipse(cx, cy + 85, 45 * scale, 12 * scale);

        // === BACK LEG ===
        this.drawLeg(g, cx + 10, cy + 10, bottomCol, skin, skinDark, bootCol, scale, legAngle * 0.5);

        // === TORSO ===
        // Body shadow
        g.fillStyle(topDark, 1);
        g.save();
        g.translateCanvas(cx, cy - 20);
        g.rotateCanvas(bodyRotation);

        // Main torso shape
        g.fillStyle(topCol, 1);
        g.beginPath();
        g.moveTo(-22 * scale, -45 * scale);
        g.lineTo(22 * scale, -45 * scale);
        g.lineTo(18 * scale, 15 * scale);
        g.lineTo(-18 * scale, 15 * scale);
        g.closePath();
        g.fill();

        // Chest highlight
        g.fillStyle(topLight, 0.4);
        g.fillEllipse(-8 * scale, -30 * scale, 12 * scale, 16 * scale);

        // Chest shadow
        g.fillStyle(topDark, 0.5);
        g.fillEllipse(10 * scale, -28 * scale, 14 * scale, 18 * scale);

        // Abs/core detail
        g.fillStyle(topDark, 0.25);
        g.fillRoundedRect(-7 * scale, -18 * scale, 14 * scale, 28 * scale, 4);

        // Belt
        g.fillStyle(0x1a1a1a, 1);
        g.fillRoundedRect(-18 * scale, 8 * scale, 36 * scale, 8 * scale, 2);
        g.fillStyle(config.accentColor || 0xccaa00, 1);
        g.fillRoundedRect(-5 * scale, 9 * scale, 10 * scale, 6 * scale, 2);

        g.restore();

        // === FRONT LEG ===
        this.drawLeg(g, cx - 12, cy + 10, bottomCol, skin, skinDark, bootCol, scale, -legAngle);

        // === ARMS ===
        this.drawArm(g, cx - 35, cy - 35, skin, skinDark, skinLight, gloveCol, scale, armAngle, true);
        this.drawArm(g, cx + 35, cy - 35, skin, skinDark, skinLight, gloveCol, scale, -armAngle * 0.5, false);

        // === NECK ===
        g.fillStyle(skin, 1);
        g.fillRoundedRect(cx - 7 * scale, cy - 55 * scale, 14 * scale, 14 * scale, 4);
        g.fillStyle(skinDark, 0.2);
        g.fillRoundedRect(cx + 2 * scale, cy - 53 * scale, 5 * scale, 10 * scale, 2);

        // === HEAD ===
        this.drawHead(g, cx, cy - 75, skin, skinDark, skinLight, hairCol, config, scale);

        // Draw to render texture
        rt.draw(g, x, y);
        g.destroy();
    }

    drawLeg(g, x, y, pantsCol, skinCol, skinDark, bootCol, scale, angle) {
        g.save();
        g.translateCanvas(x, y);
        g.rotateCanvas(angle * 0.1);

        // Thigh
        g.fillStyle(pantsCol, 1);
        g.fillRoundedRect(-8 * scale, 0, 16 * scale, 35 * scale, 6);

        // Knee highlight
        g.fillStyle(0xffffff, 0.1);
        g.fillEllipse(0, 30 * scale, 8 * scale, 6 * scale);

        // Calf
        g.fillStyle(skinCol, 1);
        g.fillRoundedRect(-7 * scale, 33 * scale, 14 * scale, 28 * scale, 5);

        // Calf shadow
        g.fillStyle(skinDark, 0.3);
        g.fillRoundedRect(-2 * scale, 36 * scale, 6 * scale, 20 * scale, 3);

        // Boot
        g.fillStyle(bootCol, 1);
        g.fillRoundedRect(-10 * scale, 58 * scale, 20 * scale, 16 * scale, 4);

        // Boot shine
        g.fillStyle(0xffffff, 0.15);
        g.fillRoundedRect(-8 * scale, 60 * scale, 6 * scale, 10 * scale, 2);

        g.restore();
    }

    drawArm(g, x, y, skinCol, skinDark, skinLight, gloveCol, scale, angle, isBack) {
        g.save();
        g.translateCanvas(x, y);
        g.rotateCanvas(angle);

        // Upper arm
        g.fillStyle(skinCol, 1);
        g.fillRoundedRect(-7 * scale, 0, 14 * scale, 30 * scale, 6);

        // Bicep
        if (!isBack) {
            g.fillStyle(skinLight, 0.3);
            g.fillEllipse(0, 12 * scale, 6 * scale, 10 * scale);
        }
        g.fillStyle(skinDark, 0.25);
        g.fillEllipse(isBack ? -3 * scale : 3 * scale, 15 * scale, 5 * scale, 12 * scale);

        // Forearm
        g.fillStyle(skinCol, 1);
        g.fillRoundedRect(-6 * scale, 28 * scale, 12 * scale, 26 * scale, 5);

        // Forearm definition
        g.fillStyle(skinDark, 0.2);
        g.fillEllipse(3 * scale, 38 * scale, 4 * scale, 10 * scale);

        // Glove/fist
        g.fillStyle(gloveCol, 1);
        g.fillCircle(0, 58 * scale, 12 * scale);
        g.fillRoundedRect(-8 * scale, 52 * scale, 16 * scale, 18 * scale, 6);

        // Glove shine
        g.fillStyle(0xffffff, 0.25);
        g.fillCircle(-3 * scale, 54 * scale, 5 * scale);

        g.restore();
    }

    drawHead(g, x, y, skinCol, skinDark, skinLight, hairCol, config, scale) {
        // Head shape
        g.fillStyle(skinCol, 1);
        g.fillEllipse(x, y, 24 * scale, 28 * scale);

        // Jaw shadow
        g.fillStyle(skinDark, 0.2);
        g.fillEllipse(x + 6 * scale, y + 8 * scale, 14 * scale, 12 * scale);

        // Cheek highlight
        g.fillStyle(skinLight, 0.25);
        g.fillCircle(x - 10 * scale, y - 4 * scale, 8 * scale);

        // Eyes
        g.fillStyle(0xffffff, 1);
        g.fillEllipse(x - 8 * scale, y - 4 * scale, 7 * scale, 5 * scale);
        g.fillEllipse(x + 8 * scale, y - 4 * scale, 7 * scale, 5 * scale);

        // Iris
        const eyeColor = config.eyeColor || 0x553322;
        g.fillStyle(eyeColor, 1);
        g.fillCircle(x - 7 * scale, y - 4 * scale, 3 * scale);
        g.fillCircle(x + 9 * scale, y - 4 * scale, 3 * scale);

        // Pupils
        g.fillStyle(0x000000, 1);
        g.fillCircle(x - 7 * scale, y - 4 * scale, 1.5 * scale);
        g.fillCircle(x + 9 * scale, y - 4 * scale, 1.5 * scale);

        // Eye shine
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(x - 8 * scale, y - 5 * scale, 1 * scale);
        g.fillCircle(x + 8 * scale, y - 5 * scale, 1 * scale);

        // Eyebrows
        g.fillStyle(hairCol, 1);
        g.fillRoundedRect(x - 14 * scale, y - 14 * scale, 10 * scale, 3 * scale, 1);
        g.fillRoundedRect(x + 4 * scale, y - 14 * scale, 10 * scale, 3 * scale, 1);

        // Nose
        g.fillStyle(skinDark, 0.4);
        g.beginPath();
        g.moveTo(x, y - 2 * scale);
        g.lineTo(x - 3 * scale, y + 8 * scale);
        g.lineTo(x, y + 10 * scale);
        g.lineTo(x + 3 * scale, y + 8 * scale);
        g.closePath();
        g.fill();

        // Mouth
        g.fillStyle(0x994455, 0.9);
        g.fillEllipse(x, y + 16 * scale, 8 * scale, 3 * scale);
        g.lineStyle(1, 0x773344, 0.7);
        g.lineBetween(x - 5 * scale, y + 15 * scale, x + 5 * scale, y + 15 * scale);

        // Ears
        g.fillStyle(skinCol, 1);
        g.fillEllipse(x - 22 * scale, y - 2 * scale, 4 * scale, 8 * scale);
        g.fillEllipse(x + 22 * scale, y - 2 * scale, 4 * scale, 8 * scale);

        // Hair
        this.drawHair(g, x, y - 18 * scale, hairCol, config, scale);
    }

    drawHair(g, x, y, hairCol, config, scale) {
        const style = config.hairStyle || 'short_spiky';
        const highlight = Phaser.Display.Color.ValueToColor(hairCol).lighten(30).color;

        g.fillStyle(hairCol, 1);

        switch (style) {
            case 'short_spiky':
                g.fillEllipse(x, y, 22 * scale, 16 * scale);
                // Spikes
                for (let i = -2; i <= 2; i++) {
                    g.fillTriangle(
                        x + i * 6 * scale, y - 8 * scale,
                        x + i * 6 * scale - 4 * scale, y + 4 * scale,
                        x + i * 6 * scale + 4 * scale, y + 4 * scale
                    );
                }
                g.fillStyle(highlight, 0.3);
                g.fillEllipse(x - 6 * scale, y - 4 * scale, 8 * scale, 6 * scale);
                break;

            case 'long_flowing':
                g.fillEllipse(x, y, 26 * scale, 18 * scale);
                g.fillRoundedRect(x - 26 * scale, y - 6 * scale, 14 * scale, 55 * scale, 6);
                g.fillRoundedRect(x + 12 * scale, y - 6 * scale, 14 * scale, 55 * scale, 6);
                g.fillRoundedRect(x - 16 * scale, y - 8 * scale, 32 * scale, 40 * scale, 10);
                g.fillStyle(highlight, 0.25);
                g.fillEllipse(x - 10 * scale, y - 6 * scale, 12 * scale, 10 * scale);
                break;

            case 'ponytail':
                g.fillEllipse(x, y, 22 * scale, 14 * scale);
                // Ponytail going back
                g.fillEllipse(x, y + 12 * scale, 8 * scale, 12 * scale);
                g.fillEllipse(x, y + 26 * scale, 7 * scale, 10 * scale);
                g.fillEllipse(x, y + 38 * scale, 6 * scale, 8 * scale);
                // Hair tie
                g.fillStyle(config.accentColor || 0xff0066, 1);
                g.fillEllipse(x, y + 6 * scale, 10 * scale, 4 * scale);
                break;

            case 'bald':
                g.fillStyle(0xffffff, 0.2);
                g.fillEllipse(x - 8 * scale, y + 2 * scale, 10 * scale, 8 * scale);
                break;

            default:
                g.fillEllipse(x, y, 22 * scale, 14 * scale);
                g.fillStyle(highlight, 0.2);
                g.fillEllipse(x - 6 * scale, y - 2 * scale, 8 * scale, 5 * scale);
        }
    }

    getAnimationParams(animName, frame, totalFrames) {
        const progress = frame / Math.max(1, totalFrames - 1);

        switch (animName) {
            case 'idle':
                return {
                    bodyY: Math.sin(progress * Math.PI * 2) * 3,
                    bodyRotation: 0,
                    armAngle: Math.sin(progress * Math.PI * 2) * 0.05,
                    legAngle: 0
                };

            case 'walk':
                return {
                    bodyY: Math.abs(Math.sin(progress * Math.PI * 2)) * 4,
                    bodyRotation: Math.sin(progress * Math.PI * 2) * 0.03,
                    armAngle: Math.sin(progress * Math.PI * 2) * 0.4,
                    legAngle: Math.sin(progress * Math.PI * 2) * 0.5
                };

            case 'jump':
                const jumpPhase = progress < 0.5 ? progress * 2 : 2 - progress * 2;
                return {
                    bodyY: -jumpPhase * 20,
                    bodyRotation: 0,
                    armAngle: 0.5 - jumpPhase * 0.3,
                    legAngle: jumpPhase * 0.3
                };

            case 'punch':
                return {
                    bodyY: 0,
                    bodyRotation: progress < 0.5 ? progress * 0.15 : (1 - progress) * 0.15,
                    armAngle: progress < 0.3 ? -0.5 : (progress < 0.6 ? 1.2 : 0.3),
                    legAngle: 0.1
                };

            case 'kick':
                return {
                    bodyY: -5,
                    bodyRotation: progress < 0.4 ? progress * 0.2 : (1 - progress) * 0.2,
                    armAngle: 0.3,
                    legAngle: progress < 0.4 ? progress * 2 : (1 - progress) * 1.2
                };

            case 'uppercut':
                return {
                    bodyY: progress < 0.5 ? -progress * 30 : -(1 - progress) * 30,
                    bodyRotation: -0.1,
                    armAngle: progress < 0.4 ? -0.8 + progress * 3 : 0.8 - (progress - 0.4) * 1.5,
                    legAngle: 0.2
                };

            case 'sweep':
                return {
                    bodyY: 25,
                    bodyRotation: progress * 0.3,
                    armAngle: 0.4,
                    legAngle: progress < 0.5 ? progress * 1.5 : (1 - progress) * 1.5
                };

            case 'special':
                return {
                    bodyY: Math.sin(progress * Math.PI * 2) * 5,
                    bodyRotation: progress < 0.3 ? -0.1 : (progress < 0.7 ? 0.2 : 0),
                    armAngle: progress < 0.5 ? progress * 2 : 1,
                    legAngle: Math.sin(progress * Math.PI) * 0.3
                };

            case 'hit':
                return {
                    bodyY: 0,
                    bodyRotation: -0.15 * (1 - progress),
                    armAngle: -0.3,
                    legAngle: -0.2
                };

            case 'block':
                return {
                    bodyY: 5,
                    bodyRotation: -0.05,
                    armAngle: -0.8,
                    legAngle: 0.15
                };

            case 'ko':
                const fallProgress = Math.min(1, progress * 1.5);
                return {
                    bodyY: fallProgress * 60,
                    bodyRotation: fallProgress * 1.5,
                    armAngle: -0.5,
                    legAngle: 0.3
                };

            case 'victory':
                return {
                    bodyY: Math.sin(progress * Math.PI * 4) * 10 - 10,
                    bodyRotation: 0,
                    armAngle: Math.sin(progress * Math.PI * 2) * 0.8 + 0.5,
                    legAngle: Math.sin(progress * Math.PI * 2) * 0.2
                };

            default:
                return { bodyY: 0, bodyRotation: 0, armAngle: 0, legAngle: 0 };
        }
    }

    createAnimations(textureKey, frames, frameWidth, frameHeight, cols) {
        let startFrame = 0;

        Object.entries(frames).forEach(([animName, frameCount]) => {
            const animKey = `${textureKey}_${animName}`;

            if (!this.scene.anims.exists(animKey)) {
                const frameNumbers = [];
                for (let i = 0; i < frameCount; i++) {
                    frameNumbers.push(startFrame + i);
                }

                this.scene.anims.create({
                    key: animKey,
                    frames: this.scene.anims.generateFrameNumbers(textureKey, { frames: frameNumbers }),
                    frameRate: animName === 'idle' ? 6 : (animName === 'special' ? 15 : 12),
                    repeat: ['idle', 'walk'].includes(animName) ? -1 : 0
                });
            }

            startFrame += frameCount;
        });
    }

    getFrameData(textureKey) {
        return this.textureCache.get(textureKey);
    }
}
