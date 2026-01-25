/**
 * Menu Scene
 * Title screen with game branding
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
    this.add.text(width / 2, 30, 'BEHIND THE BEANS', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Coffee cup emoji (using graphics)
    this.drawCoffeeCup(width / 2, 55);

    // Tap to start text (pulsing)
    this.startText = this.add.text(width / 2, 90, '[ TAP TO START ]', {
      fontSize: '8px',
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
    this.add.text(width / 2, 115, 'A Halfway Up Productions game', {
      fontSize: '5px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    }).setOrigin(0.5);

    this.add.text(width / 2, 125, 'halfwayup.co.uk', {
      fontSize: '5px',
      fontFamily: 'monospace',
      color: '#E8E8E8',
    }).setOrigin(0.5);

    // High score display if exists
    const highScore = localStorage.getItem('behindTheBeans_highScore') || 0;
    if (highScore > 0) {
      this.add.text(width / 2, 138, `HIGH SCORE: ${highScore}`, {
        fontSize: '5px',
        fontFamily: 'monospace',
        color: '#8B4513',
      }).setOrigin(0.5);
    }

    // Input handlers
    this.input.on('pointerdown', this.startGame, this);
    this.input.keyboard.on('keydown-SPACE', this.startGame, this);
    this.input.keyboard.on('keydown-ENTER', this.startGame, this);

    // Add some floating coffee beans animation
    this.createFloatingBeans();
  }

  /**
   * Draw a simple coffee cup graphic
   */
  drawCoffeeCup(x, y) {
    const g = this.add.graphics();

    // Cup body
    g.fillStyle(0xFFFFFF);
    g.fillRect(x - 8, y - 10, 16, 18);

    // Coffee
    g.fillStyle(0x8B4513);
    g.fillRect(x - 6, y - 8, 12, 14);

    // Handle
    g.fillStyle(0xFFFFFF);
    g.fillRect(x + 8, y - 6, 4, 8);
    g.fillStyle(0x2D3142);
    g.fillRect(x + 10, y - 4, 2, 4);

    // Steam (animated separately)
    this.createSteam(x, y - 14);
  }

  /**
   * Create animated steam particles
   */
  createSteam(x, y) {
    for (let i = 0; i < 3; i++) {
      const steam = this.add.graphics();
      steam.fillStyle(0xE8E8E8, 0.5);
      steam.fillCircle(0, 0, 2);
      steam.x = x - 4 + i * 4;
      steam.y = y;

      this.tweens.add({
        targets: steam,
        y: y - 10,
        alpha: 0,
        duration: 1000 + i * 200,
        repeat: -1,
        delay: i * 300,
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
    for (let i = 0; i < 5; i++) {
      const bean = this.add.graphics();
      bean.fillStyle(0x5C4033, 0.3);
      bean.fillEllipse(0, 0, 6, 4);

      bean.x = 20 + i * 50;
      bean.y = 30 + Math.random() * 80;

      this.tweens.add({
        targets: bean,
        y: bean.y - 10 + Math.random() * 20,
        duration: 2000 + Math.random() * 1000,
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
