/**
 * LevelScene - Level Selection Scene
 *
 * Displays all chapters and levels with:
 * - Visual indication of locked/unlocked/completed status
 * - Star count requirements for chapters
 * - Best scores per level
 * - Smooth navigation between chapters
 */

import Phaser from 'phaser';
import { DEPTH } from '../config/gameConfig.js';

export default class LevelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelScene' });
    }

    /**
     * Initialize scene data
     */
    init() {
        this.currentChapter = 1;
        this.totalChapters = 8;
        this.levelsPerChapter = 5;

        // Chapter metadata
        this.chapters = [
            { id: 1, name: 'Training Grounds', starsRequired: 0 },
            { id: 2, name: 'Asteroid Belt Alpha', starsRequired: 20 },
            { id: 3, name: 'Mars Station Omega', starsRequired: 60 },
            { id: 4, name: 'Jupiter\'s Eye', starsRequired: 120 },
            { id: 5, name: 'Saturn\'s Rings', starsRequired: 200 },
            { id: 6, name: 'Neptune\'s Deep', starsRequired: 300 },
            { id: 7, name: 'Kuiper Station', starsRequired: 420 },
            { id: 8, name: 'The Dark Nebula', starsRequired: 560 }
        ];
    }

    /**
     * Create scene elements
     */
    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;

        // Fade in
        this.cameras.main.fadeIn(500);

        // Background
        this.createBackground(width, height);

        // Title
        this.add.text(centerX, 50, 'SELECT LEVEL', {
            fontFamily: 'Arial Black',
            fontSize: '42px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Chapter navigation
        this.createChapterNavigation(centerX, height);

        // Level grid container
        this.levelContainer = this.add.container(centerX, height / 2 + 30);
        this.levelContainer.setDepth(DEPTH.UI);

        // Display current chapter
        this.displayChapter(this.currentChapter);

        // Back button
        this.createBackButton();

        // Star count display
        this.createStarCounter(width);

        // Setup swipe navigation
        this.setupSwipeNavigation();
    }

    /**
     * Create scrolling background
     */
    createBackground(width, height) {
        this.add.image(width / 2, height / 2, 'bg-space-1')
            .setDisplaySize(width, height)
            .setDepth(DEPTH.BACKGROUND);

        // Animated stars
        this.stars = this.add.tileSprite(0, 0, width, height, 'parallax-stars-1')
            .setOrigin(0)
            .setDepth(DEPTH.BACKGROUND + 1);
    }

    /**
     * Create chapter navigation arrows and title
     */
    createChapterNavigation(centerX, height) {
        // Chapter title
        this.chapterTitle = this.add.text(centerX, 120, '', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#00ffff'
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Stars required text
        this.starsRequiredText = this.add.text(centerX, 155, '', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#888888'
        }).setOrigin(0.5).setDepth(DEPTH.UI);

        // Left arrow
        this.leftArrow = this.add.text(50, height / 2, '<', {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setDepth(DEPTH.UI)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.previousChapter())
            .on('pointerover', () => this.leftArrow.setColor('#00ffff'))
            .on('pointerout', () => this.leftArrow.setColor('#ffffff'));

        // Right arrow
        this.rightArrow = this.add.text(this.cameras.main.width - 50, height / 2, '>', {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setDepth(DEPTH.UI)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.nextChapter())
            .on('pointerover', () => this.rightArrow.setColor('#00ffff'))
            .on('pointerout', () => this.rightArrow.setColor('#ffffff'));

        // Chapter dots indicator
        this.chapterDots = [];
        const dotStartX = centerX - ((this.totalChapters - 1) * 15);

        for (let i = 0; i < this.totalChapters; i++) {
            const dot = this.add.circle(dotStartX + (i * 30), height - 80, 8, 0x333333)
                .setDepth(DEPTH.UI)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.goToChapter(i + 1));

            this.chapterDots.push(dot);
        }
    }

    /**
     * Display levels for a specific chapter
     */
    displayChapter(chapterNum) {
        const chapter = this.chapters[chapterNum - 1];
        const progress = this.registry.get('playerProgress');

        // Update chapter title
        this.chapterTitle.setText(`Chapter ${chapterNum}: ${chapter.name}`);

        // Update stars required
        if (chapter.starsRequired > 0) {
            const hasEnoughStars = progress.totalStars >= chapter.starsRequired;
            this.starsRequiredText.setText(
                hasEnoughStars
                    ? `Unlocked!`
                    : `Requires ${chapter.starsRequired} stars (You have: ${progress.totalStars})`
            );
            this.starsRequiredText.setColor(hasEnoughStars ? '#00ff00' : '#ff6666');
        } else {
            this.starsRequiredText.setText('');
        }

        // Update dots
        this.chapterDots.forEach((dot, index) => {
            dot.setFillStyle(index + 1 === chapterNum ? 0x00ffff : 0x333333);
        });

        // Update arrows visibility
        this.leftArrow.setVisible(chapterNum > 1);
        this.rightArrow.setVisible(chapterNum < this.totalChapters);

        // Clear existing level buttons
        this.levelContainer.removeAll(true);

        // Create level grid (5 levels in a row)
        const startX = -300;
        const spacing = 150;

        for (let i = 0; i < this.levelsPerChapter; i++) {
            const levelKey = `${chapterNum}-${i + 1}`;
            const x = startX + (i * spacing);
            const y = 0;

            this.createLevelButton(x, y, chapterNum, i + 1, levelKey, progress);
        }
    }

    /**
     * Create a single level button
     */
    createLevelButton(x, y, chapter, level, levelKey, progress) {
        const isUnlocked = progress.unlockedLevels.includes(levelKey);
        const chapterData = this.chapters[chapter - 1];
        const hasEnoughStars = progress.totalStars >= chapterData.starsRequired;
        const canAccess = isUnlocked && hasEnoughStars;

        // Container for level button
        const container = this.add.container(x, y);

        // Background based on state
        let bgTexture = 'level-locked';
        if (isUnlocked) {
            // Check if completed (has any score)
            bgTexture = 'level-unlocked'; // Could check for completion
        }

        const bg = this.add.image(0, 0, bgTexture)
            .setDisplaySize(120, 120);

        // Level number
        const levelText = this.add.text(0, -10, level.toString(), {
            fontFamily: 'Arial Black',
            fontSize: '36px',
            color: canAccess ? '#ffffff' : '#666666',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Lock icon for locked levels
        if (!canAccess) {
            const lockIcon = this.add.text(0, 25, '🔒', {
                fontSize: '24px'
            }).setOrigin(0.5);
            container.add(lockIcon);
        } else {
            // Star indicators for unlocked levels
            const starContainer = this.add.container(0, 35);
            for (let s = 0; s < 3; s++) {
                const star = this.add.text(-20 + (s * 20), 0, '★', {
                    fontSize: '18px',
                    color: '#ffff00' // Could be based on completion
                }).setOrigin(0.5);
                starContainer.add(star);
            }
            container.add(starContainer);
        }

        container.add([bg, levelText]);

        // Interactivity
        if (canAccess) {
            container.setSize(120, 120);
            container.setInteractive({ useHandCursor: true });

            container.on('pointerover', () => {
                this.tweens.add({
                    targets: container,
                    scale: 1.1,
                    duration: 100
                });
            });

            container.on('pointerout', () => {
                this.tweens.add({
                    targets: container,
                    scale: 1,
                    duration: 100
                });
            });

            container.on('pointerdown', () => {
                this.sound.play('sfx-button', { volume: 0.5 });
                this.selectLevel(chapter, level);
            });
        }

        // Entry animation
        container.setAlpha(0);
        container.y = y + 30;

        this.tweens.add({
            targets: container,
            alpha: 1,
            y: y,
            duration: 300,
            delay: level * 50,
            ease: 'Power2'
        });

        this.levelContainer.add(container);
    }

    /**
     * Create back button
     */
    createBackButton() {
        const backBtn = this.add.image(60, 50, 'btn-back')
            .setScale(0.5)
            .setDepth(DEPTH.UI)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.sound.play('sfx-button', { volume: 0.5 });
                this.goBack();
            })
            .on('pointerover', () => backBtn.setScale(0.55))
            .on('pointerout', () => backBtn.setScale(0.5));
    }

    /**
     * Create star counter in corner
     */
    createStarCounter(width) {
        const progress = this.registry.get('playerProgress');

        this.add.image(width - 100, 50, 'hud-star-counter')
            .setScale(0.6)
            .setDepth(DEPTH.UI);

        this.add.text(width - 60, 50, progress.totalStars.toString(), {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(DEPTH.UI);
    }

    /**
     * Setup swipe gesture navigation
     */
    setupSwipeNavigation() {
        let startX = 0;

        this.input.on('pointerdown', (pointer) => {
            startX = pointer.x;
        });

        this.input.on('pointerup', (pointer) => {
            const deltaX = pointer.x - startX;
            const threshold = 100;

            if (deltaX > threshold) {
                this.previousChapter();
            } else if (deltaX < -threshold) {
                this.nextChapter();
            }
        });

        // Keyboard navigation
        this.input.keyboard.on('keydown-LEFT', () => this.previousChapter());
        this.input.keyboard.on('keydown-RIGHT', () => this.nextChapter());
        this.input.keyboard.on('keydown-ESC', () => this.goBack());
    }

    /**
     * Navigate to previous chapter
     */
    previousChapter() {
        if (this.currentChapter > 1) {
            this.currentChapter--;
            this.displayChapter(this.currentChapter);
            this.sound.play('sfx-button', { volume: 0.3 });
        }
    }

    /**
     * Navigate to next chapter
     */
    nextChapter() {
        if (this.currentChapter < this.totalChapters) {
            this.currentChapter++;
            this.displayChapter(this.currentChapter);
            this.sound.play('sfx-button', { volume: 0.3 });
        }
    }

    /**
     * Jump to specific chapter
     */
    goToChapter(chapterNum) {
        if (chapterNum !== this.currentChapter) {
            this.currentChapter = chapterNum;
            this.displayChapter(this.currentChapter);
            this.sound.play('sfx-button', { volume: 0.3 });
        }
    }

    /**
     * Select and start a level
     */
    selectLevel(chapter, level) {
        this.registry.set('selectedLevel', { chapter, level });

        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene', {
                level: { chapter, level }
            });
        });
    }

    /**
     * Return to main menu
     */
    goBack() {
        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }

    /**
     * Update loop - animate background
     */
    update() {
        this.stars.tilePositionX += 0.2;
    }
}
