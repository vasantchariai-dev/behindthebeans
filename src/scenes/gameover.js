/**
 * Game Over Scene
 * Displays final score and options to replay
 * Vertical/portrait format for mobile
 */

import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalLevel = data.level || 1;
    this.reason = data.reason || 'missed';
  }

  create() {
    const { width, height } = this.cameras.main;

    // Fade in
    this.cameras.main.fadeIn(300);
    this.cameras.main.setBackgroundColor('#2D3142');

    // Game over title
    this.add.text(width / 2, 80, 'GAME OVER', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#E63946',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Reason text
    const reasons = {
      missed: 'The director lost their temper!\n(3 coffee orders missed)',
      caffeine: 'You collapsed from exhaustion!\n(Energy depleted)',
      stress: 'Too much stress on set!',
    };

    this.add.text(width / 2, 140, reasons[this.reason] || reasons.missed, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
      align: 'center',
    }).setOrigin(0.5);

    // Days survived
    const daysText = this.finalLevel === 1 ? '1 day' : `${this.finalLevel} days`;
    this.add.text(width / 2, 190, `You survived ${daysText} on set.`, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#E8E8E8',
    }).setOrigin(0.5);

    // Score display
    this.add.text(width / 2, 250, 'SCORE', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#8B4513',
    }).setOrigin(0.5);

    this.add.text(width / 2, 300, this.finalScore.toString().padStart(5, '0'), {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#EF8354',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // High score check
    const highScore = parseInt(localStorage.getItem('behindTheBeans_highScore') || '0');
    if (this.finalScore >= highScore && this.finalScore > 0) {
      this.add.text(width / 2, 355, 'NEW HIGH SCORE!', {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#4ECDC4',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Celebration effect
      this.createConfetti();
    }

    // Play again button
    this.playAgainBtn = this.add.text(width / 2, 420, '[ PLAY AGAIN ]', {
      fontSize: '22px',
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

    // Menu button
    this.menuBtn = this.add.text(width / 2, 470, '[ MAIN MENU ]', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#8B4513',
    }).setOrigin(0.5).setInteractive();

    this.menuBtn.on('pointerover', () => this.menuBtn.setColor('#EF8354'));
    this.menuBtn.on('pointerout', () => this.menuBtn.setColor('#8B4513'));
    this.menuBtn.on('pointerdown', () => this.goToMenu());

    // Credits
    this.add.text(width / 2, 550, 'Made by Halfway Up Productions', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#E8E8E8',
    }).setOrigin(0.5);

    const link = this.add.text(width / 2, 575, 'halfwayup.co.uk', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    }).setOrigin(0.5).setInteractive();

    link.on('pointerover', () => link.setColor('#EF8354'));
    link.on('pointerout', () => link.setColor('#4ECDC4'));
    link.on('pointerdown', () => {
      window.open('https://www.halfwayup.co.uk/', '_blank');
    });

    // Keyboard input
    this.input.keyboard.on('keydown-SPACE', () => this.restartGame());
    this.input.keyboard.on('keydown-ENTER', () => this.restartGame());
  }

  /**
   * Create confetti celebration effect
   */
  createConfetti() {
    const colours = [0xEF8354, 0x4ECDC4, 0xFFD700, 0xE63946, 0x8B4513];

    for (let i = 0; i < 50; i++) {
      const confetti = this.add.graphics();
      const colour = colours[Math.floor(Math.random() * colours.length)];
      confetti.fillStyle(colour);
      confetti.fillRect(0, 0, 4 + Math.random() * 4, 4 + Math.random() * 4);

      confetti.x = 30 + Math.random() * (this.cameras.main.width - 60);
      confetti.y = -20 - Math.random() * 40;

      this.tweens.add({
        targets: confetti,
        y: this.cameras.main.height + 40,
        x: confetti.x + (Math.random() - 0.5) * 60,
        rotation: Math.random() * Math.PI * 6,
        duration: 2500 + Math.random() * 1500,
        delay: Math.random() * 800,
        onComplete: () => confetti.destroy(),
      });
    }
  }

  /**
   * Go to main menu
   */
  goToMenu() {
    this.playClickSound();
    this.cameras.main.fadeOut(300, 45, 49, 66);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  /**
   * Restart the game directly
   */
  restartGame() {
    this.playClickSound();
    this.cameras.main.fadeOut(300, 45, 49, 66);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('PlayScene');
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
