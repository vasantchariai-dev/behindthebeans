/**
 * Menu Scene
 * Title screen with game branding and instructions
 * Vertical/portrait format for mobile
 */

import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.cameras.main.setBackgroundColor('#2D3142');

    // Title text
    this.add.text(width / 2, 50, 'BEHIND THE BEANS', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, 85, 'A film set survival game', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    }).setOrigin(0.5);

    // Coffee cup graphic
    this.drawCoffeeCup(width / 2, 140);

    // Instructions box
    this.drawInstructions(width / 2, 300);

    // Tap to start text (pulsing)
    this.startText = this.add.text(width / 2, 520, '[ TAP TO START ]', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#EF8354',
    }).setOrigin(0.5);

    // Pulse animation
    this.tweens.add({
      targets: this.startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Credits
    this.add.text(width / 2, 580, 'A Halfway Up Productions game', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    }).setOrigin(0.5);

    this.add.text(width / 2, 600, 'halfwayup.co.uk', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#E8E8E8',
    }).setOrigin(0.5);

    // High score display if exists
    const highScore = localStorage.getItem('behindTheBeans_highScore') || 0;
    if (highScore > 0) {
      this.add.text(width - 10, 10, `HIGH SCORE: ${highScore}`, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#8B4513',
      }).setOrigin(1, 0);
    }

    // Input handlers
    this.input.on('pointerdown', this.startGame, this);
    this.input.keyboard.on('keydown-SPACE', this.startGame, this);
    this.input.keyboard.on('keydown-ENTER', this.startGame, this);

    // Add some floating coffee beans animation
    this.createFloatingBeans();
  }

  /**
   * Draw instructions panel - BIGGER and CLEARER
   */
  drawInstructions(x, y) {
    // Background box
    const g = this.add.graphics();
    g.fillStyle(0x1A1A1A, 0.8);
    g.fillRoundedRect(x - 165, y - 100, 330, 200, 10);
    g.lineStyle(3, 0x4ECDC4, 0.7);
    g.strokeRoundedRect(x - 165, y - 100, 330, 200, 10);

    // Title
    this.add.text(x, y - 80, 'HOW TO PLAY', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#EF8354',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Instructions - stacked vertically, bigger text
    const lineHeight = 28;
    const startY = y - 45;

    // Coffee task
    this.add.text(x, startY, '☕ COFFEES', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#8B4513',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(x, startY + 18, 'Tap van, pick the right drink, deliver!', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
    }).setOrigin(0.5);

    // Crew task
    this.add.text(x, startY + lineHeight * 1.5, '🚫 CREW', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#E63946',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(x, startY + lineHeight * 1.5 + 18, 'Tap to stop them BEFORE they hit the set!', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
    }).setOrigin(0.5);

    // Actor task
    this.add.text(x, startY + lineHeight * 3, '🚽 ACTORS', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#9C27B0',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(x, startY + lineHeight * 3 + 18, 'Draw a path to the loo - avoid the set!', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
    }).setOrigin(0.5);

    // Controls
    this.add.text(x, startY + lineHeight * 4.5, 'Move: WASD / Arrows / Tap', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    }).setOrigin(0.5);
  }

  /**
   * Draw a simple coffee cup graphic
   */
  drawCoffeeCup(x, y) {
    const g = this.add.graphics();
    const scale = 2.5;

    // Cup body
    g.fillStyle(0xFFFFFF);
    g.fillRect(x - 12 * scale, y - 15 * scale, 24 * scale, 28 * scale);

    // Coffee
    g.fillStyle(0x8B4513);
    g.fillRect(x - 9 * scale, y - 12 * scale, 18 * scale, 22 * scale);

    // Handle
    g.fillStyle(0xFFFFFF);
    g.fillRect(x + 12 * scale, y - 9 * scale, 6 * scale, 12 * scale);
    g.fillStyle(0x2D3142);
    g.fillRect(x + 15 * scale, y - 6 * scale, 3 * scale, 6 * scale);

    // Steam (animated separately)
    this.createSteam(x, y - 18 * scale);
  }

  /**
   * Create animated steam particles
   */
  createSteam(x, y) {
    for (let i = 0; i < 5; i++) {
      const steam = this.add.graphics();
      steam.fillStyle(0xE8E8E8, 0.5);
      steam.fillCircle(0, 0, 4 + Math.random() * 3);
      steam.x = x - 15 + i * 8;
      steam.y = y;

      this.tweens.add({
        targets: steam,
        y: y - 25,
        alpha: 0,
        duration: 1200 + i * 200,
        repeat: -1,
        delay: i * 250,
        onRepeat: () => {
          steam.y = y;
          steam.alpha = 0.5;
        },
      });
    }
  }

  /**
   * Create floating coffee beans in background
   */
  createFloatingBeans() {
    for (let i = 0; i < 6; i++) {
      const bean = this.add.graphics();
      bean.fillStyle(0x5C4033, 0.2);
      bean.fillEllipse(0, 0, 15, 10);

      bean.x = 40 + (i % 3) * 120;
      bean.y = 50 + Math.floor(i / 3) * 300 + Math.random() * 200;

      this.tweens.add({
        targets: bean,
        y: bean.y - 20 + Math.random() * 40,
        duration: 2500 + Math.random() * 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /**
   * Start the game
   */
  startGame() {
    // Play a simple click sound effect
    this.playClickSound();

    // Transition to play scene
    this.cameras.main.fadeOut(300, 45, 49, 66);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('PlayScene');
    });
  }

  /**
   * Play a simple click/start sound
   */
  playClickSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 440;
      oscillator.type = 'square';
      gainNode.gain.value = 0.1;

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not supported, continue silently
    }
  }
}
