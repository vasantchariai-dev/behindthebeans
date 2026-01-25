/**
 * Game Over Scene
 * Displays final score and options to replay
 */

import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalLevel = data.level || 1;
    this.reason = data.reason || 'stress';
  }

  create() {
    const { width, height } = this.cameras.main;

    // Fade in
    this.cameras.main.fadeIn(300);
    this.cameras.main.setBackgroundColor('#2D3142');

    // Game over title
    this.add.text(width / 2, 20, 'GAME OVER', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#E63946',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Reason text
    const reasons = {
      stress: 'The director had a meltdown.',
      caffeine: 'You collapsed from exhaustion.',
    };

    this.add.text(width / 2, 38, reasons[this.reason] || reasons.stress, {
      fontSize: '6px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
    }).setOrigin(0.5);

    // Days survived
    const daysText = this.finalLevel === 1 ? '1 day' : `${this.finalLevel} days`;
    this.add.text(width / 2, 50, `You survived ${daysText} on set.`, {
      fontSize: '5px',
      fontFamily: 'monospace',
      color: '#E8E8E8',
    }).setOrigin(0.5);

    // Score display
    this.add.text(width / 2, 68, 'SCORE', {
      fontSize: '6px',
      fontFamily: 'monospace',
      color: '#8B4513',
    }).setOrigin(0.5);

    this.add.text(width / 2, 80, this.finalScore.toString().padStart(5, '0'), {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#EF8354',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // High score check
    const highScore = parseInt(localStorage.getItem('behindTheBeans_highScore') || '0');
    if (this.finalScore >= highScore && this.finalScore > 0) {
      this.add.text(width / 2, 93, 'NEW HIGH SCORE!', {
        fontSize: '6px',
        fontFamily: 'monospace',
        color: '#4ECDC4',
      }).setOrigin(0.5);

      // Celebration effect
      this.createConfetti();
    }

    // Play again button
    this.playAgainBtn = this.add.text(width / 2, 110, '[ PLAY AGAIN ]', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    }).setOrigin(0.5).setInteractive();

    // Pulse animation
    this.tweens.add({
      targets: this.playAgainBtn,
      alpha: 0.5,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.playAgainBtn.on('pointerover', () => {
      this.playAgainBtn.setColor('#EF8354');
    });

    this.playAgainBtn.on('pointerout', () => {
      this.playAgainBtn.setColor('#4ECDC4');
    });

    this.playAgainBtn.on('pointerdown', () => {
      this.restartGame();
    });

    // Credits
    this.add.text(width / 2, 130, 'Made by Halfway Up Productions', {
      fontSize: '4px',
      fontFamily: 'monospace',
      color: '#E8E8E8',
    }).setOrigin(0.5);

    this.add.text(width / 2, 138, 'halfwayup.co.uk', {
      fontSize: '4px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
      window.open('https://www.halfwayup.co.uk/', '_blank');
    });

    // Keyboard input
    this.input.keyboard.on('keydown-SPACE', () => this.restartGame());
    this.input.keyboard.on('keydown-ENTER', () => this.restartGame());

    // Also allow tap anywhere after a delay
    this.time.delayedCall(500, () => {
      this.input.on('pointerdown', (pointer) => {
        // Only if not clicking the link
        if (pointer.y < 125) {
          this.restartGame();
        }
      });
    });
  }

  /**
   * Create confetti celebration effect
   */
  createConfetti() {
    const colours = [0xEF8354, 0x4ECDC4, 0xFFD700, 0xE63946, 0x8B4513];

    for (let i = 0; i < 30; i++) {
      const confetti = this.add.graphics();
      const colour = colours[Math.floor(Math.random() * colours.length)];
      confetti.fillStyle(colour);
      confetti.fillRect(0, 0, 2 + Math.random() * 2, 2 + Math.random() * 2);

      confetti.x = 20 + Math.random() * (this.cameras.main.width - 40);
      confetti.y = -10 - Math.random() * 20;

      this.tweens.add({
        targets: confetti,
        y: this.cameras.main.height + 20,
        x: confetti.x + (Math.random() - 0.5) * 40,
        rotation: Math.random() * Math.PI * 4,
        duration: 2000 + Math.random() * 1000,
        delay: Math.random() * 500,
        onComplete: () => confetti.destroy(),
      });
    }
  }

  /**
   * Restart the game
   */
  restartGame() {
    // Play click sound
    this.playClickSound();

    this.cameras.main.fadeOut(300, 45, 49, 66);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  /**
   * Play a simple click sound
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
      // Audio not supported
    }
  }
}
