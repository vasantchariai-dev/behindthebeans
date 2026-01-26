/**
 * Behind the Beans
 * A retro 2D arcade game by Halfway Up Productions
 *
 * Entry point - sets up Phaser 3 game configuration
 */

import Phaser from 'phaser';
import { BootScene } from './scenes/boot.js';
import { MenuScene } from './scenes/menu.js';
import { PlayScene } from './scenes/play.js';
import { GameOverScene } from './scenes/gameover.js';

// Game configuration
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',

  // Native resolution - vertical/portrait format for mobile
  width: 360,
  height: 640,

  // Scale settings for responsive display
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  // Pixel art rendering - no smoothing
  pixelArt: true,

  // Simple physics for movement
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },

  // Background colour
  backgroundColor: '#2D3142',

  // Game scenes
  scene: [BootScene, MenuScene, PlayScene, GameOverScene],
};

// Remove loading screen once Phaser takes over
const removeLoading = () => {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'none';
  }
};

// Create the game instance
const game = new Phaser.Game(config);

// Remove loading screen after a short delay (allows Phaser to initialise)
setTimeout(removeLoading, 100);

// Expose game instance for debugging (remove in production if desired)
window.game = game;
