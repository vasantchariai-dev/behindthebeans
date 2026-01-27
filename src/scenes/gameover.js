/**
 * Game Over Scene
 * Displays final score with name entry and options to replay
 * Vertical/portrait format for mobile
 */

import Phaser from 'phaser';

// Maximum leaderboard entries
const MAX_LEADERBOARD = 10;
const STORAGE_KEY = 'behindTheBeans_leaderboard';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalLevel = data.level || 1;
    this.reason = data.reason || 'missed';
    this.playerName = 'AAA';
    this.nameIndex = 0; // Which character we're editing (0, 1, 2)
    this.nameChars = ['A', 'A', 'A'];
    this.hasEnteredName = false;
  }

  create() {
    const { width, height } = this.cameras.main;
    this.gameWidth = width;
    this.gameHeight = height;

    // Fade in
    this.cameras.main.fadeIn(300);
    this.cameras.main.setBackgroundColor('#2D3142');

    // Check if this score qualifies for leaderboard
    this.isHighScore = this.checkIfHighScore();

    // Game over title
    this.add.text(width / 2, 60, 'GAME OVER', {
      fontSize: '32px',
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

    this.add.text(width / 2, 110, reasons[this.reason] || reasons.missed, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
      align: 'center',
    }).setOrigin(0.5);

    // Days survived
    const daysText = this.finalLevel === 1 ? '1 day' : `${this.finalLevel} days`;
    this.add.text(width / 2, 150, `You survived ${daysText} on set.`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#E8E8E8',
    }).setOrigin(0.5);

    // Score display
    this.add.text(width / 2, 190, 'SCORE', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#8B4513',
    }).setOrigin(0.5);

    this.add.text(width / 2, 230, this.finalScore.toString().padStart(5, '0'), {
      fontSize: '40px',
      fontFamily: 'monospace',
      color: '#EF8354',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Show name entry if high score, otherwise show buttons directly
    if (this.isHighScore && this.finalScore > 0) {
      this.showNameEntry();
    } else {
      this.showButtons();
    }

    // Credits at bottom
    this.add.text(width / 2, 580, 'Made by Halfway Up Productions', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#E8E8E8',
    }).setOrigin(0.5);

    const link = this.add.text(width / 2, 600, 'halfwayup.co.uk', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    }).setOrigin(0.5).setInteractive();

    link.on('pointerover', () => link.setColor('#EF8354'));
    link.on('pointerout', () => link.setColor('#4ECDC4'));
    link.on('pointerdown', () => {
      window.open('https://www.halfwayup.co.uk/', '_blank');
    });
  }

  /**
   * Check if current score qualifies for leaderboard
   */
  checkIfHighScore() {
    const leaderboard = this.getLeaderboard();
    if (leaderboard.length < MAX_LEADERBOARD) return true;
    return this.finalScore > leaderboard[leaderboard.length - 1].score;
  }

  /**
   * Get leaderboard from localStorage
   */
  getLeaderboard() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Save score to leaderboard
   */
  saveToLeaderboard(name) {
    const leaderboard = this.getLeaderboard();
    leaderboard.push({
      name: name,
      score: this.finalScore,
      level: this.finalLevel,
      date: new Date().toISOString().split('T')[0],
    });

    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);

    // Keep only top entries
    const trimmed = leaderboard.slice(0, MAX_LEADERBOARD);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      // Also update single high score for backwards compatibility
      if (this.finalScore > parseInt(localStorage.getItem('behindTheBeans_highScore') || '0')) {
        localStorage.setItem('behindTheBeans_highScore', this.finalScore.toString());
      }
    } catch (e) {
      // localStorage not available
    }
  }

  /**
   * Show name entry UI
   */
  showNameEntry() {
    const width = this.gameWidth;

    // High score message
    this.add.text(width / 2, 275, 'NEW HIGH SCORE!', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 300, 'Enter your name:', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
    }).setOrigin(0.5);

    // Name entry characters
    this.nameContainer = this.add.container(width / 2, 350);

    // Create character slots
    this.charTexts = [];
    this.upArrows = [];
    this.downArrows = [];

    for (let i = 0; i < 3; i++) {
      const xOffset = (i - 1) * 50;

      // Up arrow
      const upArrow = this.add.text(xOffset, -35, '▲', {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#4ECDC4',
      }).setOrigin(0.5).setInteractive();

      upArrow.on('pointerdown', () => this.changeChar(i, 1));
      upArrow.on('pointerover', () => upArrow.setColor('#EF8354'));
      upArrow.on('pointerout', () => upArrow.setColor('#4ECDC4'));
      this.upArrows.push(upArrow);
      this.nameContainer.add(upArrow);

      // Character display
      const charBg = this.add.graphics();
      charBg.fillStyle(0x1A1A1A);
      charBg.fillRoundedRect(xOffset - 18, -18, 36, 36, 5);
      this.nameContainer.add(charBg);

      const charText = this.add.text(xOffset, 0, this.nameChars[i], {
        fontSize: '28px',
        fontFamily: 'monospace',
        color: '#EF8354',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.charTexts.push(charText);
      this.nameContainer.add(charText);

      // Down arrow
      const downArrow = this.add.text(xOffset, 35, '▼', {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#4ECDC4',
      }).setOrigin(0.5).setInteractive();

      downArrow.on('pointerdown', () => this.changeChar(i, -1));
      downArrow.on('pointerover', () => downArrow.setColor('#EF8354'));
      downArrow.on('pointerout', () => downArrow.setColor('#4ECDC4'));
      this.downArrows.push(downArrow);
      this.nameContainer.add(downArrow);
    }

    // Submit button
    this.submitBtn = this.add.text(width / 2, 420, '[ SUBMIT SCORE ]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    }).setOrigin(0.5).setInteractive();

    this.tweens.add({
      targets: this.submitBtn,
      alpha: 0.5,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.submitBtn.on('pointerover', () => this.submitBtn.setColor('#EF8354'));
    this.submitBtn.on('pointerout', () => this.submitBtn.setColor('#4ECDC4'));
    this.submitBtn.on('pointerdown', () => this.submitScore());

    // Keyboard input for name entry
    this.input.keyboard.on('keydown-UP', () => this.changeChar(this.nameIndex, 1));
    this.input.keyboard.on('keydown-DOWN', () => this.changeChar(this.nameIndex, -1));
    this.input.keyboard.on('keydown-LEFT', () => this.moveNameIndex(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.moveNameIndex(1));
    this.input.keyboard.on('keydown-ENTER', () => this.submitScore());

    // Celebration confetti
    this.createConfetti();
  }

  /**
   * Change a character in the name
   */
  changeChar(index, direction) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
    let currentIndex = chars.indexOf(this.nameChars[index]);
    currentIndex = (currentIndex + direction + chars.length) % chars.length;
    this.nameChars[index] = chars[currentIndex];
    this.charTexts[index].setText(this.nameChars[index]);
    this.playClickSound();
  }

  /**
   * Move the active name index
   */
  moveNameIndex(direction) {
    this.nameIndex = (this.nameIndex + direction + 3) % 3;
  }

  /**
   * Submit the score with entered name
   */
  submitScore() {
    if (this.hasEnteredName) return;
    this.hasEnteredName = true;

    const name = this.nameChars.join('');
    this.saveToLeaderboard(name);

    // Hide name entry
    this.nameContainer.destroy();
    this.submitBtn.destroy();

    // Show buttons
    this.showButtons();
    this.showLeaderboard();
  }

  /**
   * Show play again and menu buttons
   */
  showButtons() {
    const width = this.gameWidth;
    const startY = this.isHighScore ? 470 : 350;

    // Play again button
    this.playAgainBtn = this.add.text(width / 2, startY, '[ PLAY AGAIN ]', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    }).setOrigin(0.5).setInteractive();

    this.tweens.add({
      targets: this.playAgainBtn,
      alpha: 0.5,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.playAgainBtn.on('pointerover', () => this.playAgainBtn.setColor('#EF8354'));
    this.playAgainBtn.on('pointerout', () => this.playAgainBtn.setColor('#4ECDC4'));
    this.playAgainBtn.on('pointerdown', () => this.restartGame());

    // High scores button
    this.highScoresBtn = this.add.text(width / 2, startY + 40, '[ HIGH SCORES ]', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#8B4513',
    }).setOrigin(0.5).setInteractive();

    this.highScoresBtn.on('pointerover', () => this.highScoresBtn.setColor('#EF8354'));
    this.highScoresBtn.on('pointerout', () => this.highScoresBtn.setColor('#8B4513'));
    this.highScoresBtn.on('pointerdown', () => this.showLeaderboard());

    // Menu button
    this.menuBtn = this.add.text(width / 2, startY + 75, '[ MAIN MENU ]', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#666666',
    }).setOrigin(0.5).setInteractive();

    this.menuBtn.on('pointerover', () => this.menuBtn.setColor('#EF8354'));
    this.menuBtn.on('pointerout', () => this.menuBtn.setColor('#666666'));
    this.menuBtn.on('pointerdown', () => this.goToMenu());

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-SPACE', () => this.restartGame());
  }

  /**
   * Show leaderboard overlay
   */
  showLeaderboard() {
    if (this.leaderboardContainer) {
      this.leaderboardContainer.destroy();
      this.leaderboardContainer = null;
      return;
    }

    const width = this.gameWidth;
    const height = this.gameHeight;

    this.leaderboardContainer = this.add.container(width / 2, height / 2);
    this.leaderboardContainer.setDepth(100);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1A1A1A, 0.95);
    bg.fillRoundedRect(-150, -220, 300, 440, 15);
    bg.lineStyle(3, 0x4ECDC4);
    bg.strokeRoundedRect(-150, -220, 300, 440, 15);
    this.leaderboardContainer.add(bg);

    // Title
    const title = this.add.text(0, -190, 'HIGH SCORES', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#EF8354',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.leaderboardContainer.add(title);

    // Header
    const header = this.add.text(0, -155, 'RANK  NAME   SCORE  DAY', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    }).setOrigin(0.5);
    this.leaderboardContainer.add(header);

    // Leaderboard entries
    const leaderboard = this.getLeaderboard();
    const startY = -125;
    const lineHeight = 32;

    if (leaderboard.length === 0) {
      const noScores = this.add.text(0, 0, 'No scores yet!\n\nBe the first to\nmake the board!', {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#FAF7F2',
        align: 'center',
      }).setOrigin(0.5);
      this.leaderboardContainer.add(noScores);
    } else {
      leaderboard.forEach((entry, index) => {
        const y = startY + index * lineHeight;
        const rank = (index + 1).toString().padStart(2, ' ');
        const name = entry.name.padEnd(6, ' ');
        const score = entry.score.toString().padStart(5, ' ');
        const level = entry.level.toString().padStart(2, ' ');

        const isCurrentScore = entry.score === this.finalScore && this.hasEnteredName;
        const colour = isCurrentScore ? '#4ECDC4' : '#FAF7F2';

        const text = this.add.text(0, y, `${rank}.  ${name} ${score}   ${level}`, {
          fontSize: '13px',
          fontFamily: 'monospace',
          color: colour,
        }).setOrigin(0.5);
        this.leaderboardContainer.add(text);

        // Highlight current entry
        if (isCurrentScore) {
          const highlight = this.add.graphics();
          highlight.fillStyle(0x4ECDC4, 0.1);
          highlight.fillRoundedRect(-130, y - 12, 260, 26, 5);
          this.leaderboardContainer.add(highlight);
          this.leaderboardContainer.sendToBack(highlight);
          this.leaderboardContainer.sendToBack(bg);
        }
      });
    }

    // Close button
    const closeBtn = this.add.text(0, 185, '[ CLOSE ]', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    }).setOrigin(0.5).setInteractive();

    closeBtn.on('pointerover', () => closeBtn.setColor('#EF8354'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#4ECDC4'));
    closeBtn.on('pointerdown', () => {
      this.leaderboardContainer.destroy();
      this.leaderboardContainer = null;
    });
    this.leaderboardContainer.add(closeBtn);
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
