/**
 * Play Scene
 * Main gameplay - coffee runs, crew blocking, actor escorts
 * Difficulty builds gradually over days
 */

import Phaser from 'phaser';

// Game constants
const COFFEE_TYPES = ['flat-white', 'oat-latte', 'black', 'tea'];
const COFFEE_NAMES = {
  'flat-white': 'Flat white!',
  'oat-latte': 'Oat latte!',
  'black': 'Black coffee!',
  'tea': 'Tea!',
};
const CREW_TYPES = ['rigger', 'spark', 'runner-crew'];

// Sprite scale factor (sprites are 16x16, we want them ~40x40)
const SPRITE_SCALE = 2.5;
const VAN_SCALE = 3;

// Director phrases
const DIRECTOR_PHRASES = [
  "That's a wrap on the martini!",
  'Check the gate!',
  'Back to ones!',
  'Flying in!',
  'Hot set! Nobody move!',
  'Quiet on set!',
  'Roll camera!',
  'And... action!',
];

export class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });
  }

  init() {
    // Game state
    this.score = 0;
    this.level = 1;
    this.stress = 0; // 0-100
    this.coffeeBreakMeter = 0; // 0-100
    this.caffeine = 100; // 0-100 (energy level)
    this.tasksCompleted = 0; // Track tasks for level progression

    // Gameplay flags
    this.hasOrder = false;
    this.currentOrder = null;
    this.isCarryingCoffee = false;
    this.carriedCoffeeType = null;
    this.isTakingBreak = false;
    this.isGameOver = false;

    // Spawn timers
    this.orderTimer = null;
    this.crewSpawnTimer = null;
    this.actorSpawnTimer = null;
    this.caffeineDecayTimer = null;

    // Level configuration - starts very easy
    this.levelConfig = this.getLevelConfig(this.level);

    // Active entities
    this.crewMembers = [];
    this.activeActor = null;
    this.escortPath = [];
  }

  /**
   * Get configuration for a given level
   * Difficulty ramps up gradually over days
   */
  getLevelConfig(level) {
    const configs = {
      // Day 1: Tutorial - just coffee runs, very relaxed
      1: {
        orderInterval: 8000,      // 8 seconds between orders
        orderTimeout: 15000,      // 15 seconds to deliver
        crewEnabled: false,
        actorEnabled: false,
        speed: 0.8,
        crewSpeed: 15,
        maxCrew: 0,
        caffeineDecay: 0.3,       // Very slow energy drain
        tasksToAdvance: 3,        // Only 3 deliveries to pass day 1
      },
      // Day 2: Slightly faster, still just coffee
      2: {
        orderInterval: 7000,
        orderTimeout: 12000,
        crewEnabled: false,
        actorEnabled: false,
        speed: 0.9,
        crewSpeed: 18,
        maxCrew: 0,
        caffeineDecay: 0.4,
        tasksToAdvance: 4,
      },
      // Day 3: Introduce crew blocking (one at a time)
      3: {
        orderInterval: 6000,
        orderTimeout: 11000,
        crewEnabled: true,
        actorEnabled: false,
        speed: 0.95,
        crewSpeed: 20,
        maxCrew: 1,
        crewInterval: 8000,       // Slow crew spawns
        caffeineDecay: 0.5,
        tasksToAdvance: 5,
      },
      // Day 4: More crew, faster pace
      4: {
        orderInterval: 5500,
        orderTimeout: 10000,
        crewEnabled: true,
        actorEnabled: false,
        speed: 1.0,
        crewSpeed: 25,
        maxCrew: 2,
        crewInterval: 6000,
        caffeineDecay: 0.6,
        tasksToAdvance: 6,
      },
      // Day 5: Introduce actor escorts
      5: {
        orderInterval: 5000,
        orderTimeout: 10000,
        crewEnabled: true,
        actorEnabled: true,
        speed: 1.0,
        crewSpeed: 28,
        maxCrew: 2,
        crewInterval: 5000,
        actorInterval: 15000,
        caffeineDecay: 0.7,
        tasksToAdvance: 7,
      },
      // Day 6+: Full chaos, endless mode
      6: {
        orderInterval: 4500,
        orderTimeout: 9000,
        crewEnabled: true,
        actorEnabled: true,
        speed: 1.1,
        crewSpeed: 32,
        maxCrew: 3,
        crewInterval: 4000,
        actorInterval: 12000,
        caffeineDecay: 0.8,
        tasksToAdvance: 8,
      },
    };

    // After day 6, endless mode with increasing difficulty
    if (level > 6) {
      const base = configs[6];
      return {
        ...base,
        orderInterval: Math.max(3000, base.orderInterval - (level - 6) * 200),
        orderTimeout: Math.max(7000, base.orderTimeout - (level - 6) * 200),
        speed: Math.min(1.5, base.speed + (level - 6) * 0.05),
        crewSpeed: base.crewSpeed + (level - 6) * 3,
        crewInterval: Math.max(2500, base.crewInterval - (level - 6) * 200),
        actorInterval: Math.max(8000, base.actorInterval - (level - 6) * 500),
        caffeineDecay: Math.min(1.2, base.caffeineDecay + (level - 6) * 0.1),
        tasksToAdvance: base.tasksToAdvance + (level - 6),
      };
    }
    return configs[level];
  }

  create() {
    const { width, height } = this.cameras.main;
    this.gameWidth = width;
    this.gameHeight = height;

    // Create game world
    this.createBackground();
    this.createHotSet();
    this.createLocations();
    this.createPlayer();
    this.createHUD();

    // Set up input
    this.setupInput();

    // Start game loop
    this.startGameLoop();

    // Fade in
    this.cameras.main.fadeIn(300);

    // Tutorial text for level 1
    if (this.level === 1) {
      this.showTutorial();
    }
  }

  /**
   * Create background floor
   */
  createBackground() {
    // Floor
    const g = this.add.graphics();
    g.fillStyle(0xFAF7F2);
    g.fillRect(0, 40, this.gameWidth, this.gameHeight - 40);

    // Add some floor texture
    g.fillStyle(0xE8E8E8, 0.3);
    for (let x = 0; x < this.gameWidth; x += 40) {
      for (let y = 40; y < this.gameHeight; y += 40) {
        if ((x + y) % 80 === 0) {
          g.fillRect(x, y, 20, 20);
        }
      }
    }
  }

  /**
   * Create hot set area (no crossing zone)
   */
  createHotSet() {
    // Hot set boundaries - centered, larger for new resolution
    this.hotSetBounds = new Phaser.Geom.Rectangle(150, 110, 200, 120);

    // Draw hot set area
    const g = this.add.graphics();

    // Floor of hot set
    g.fillStyle(0xFFE4E1, 0.5);
    g.fillRect(this.hotSetBounds.x, this.hotSetBounds.y,
      this.hotSetBounds.width, this.hotSetBounds.height);

    // Hazard stripes around border
    g.lineStyle(3, 0xE63946);
    g.strokeRect(this.hotSetBounds.x, this.hotSetBounds.y,
      this.hotSetBounds.width, this.hotSetBounds.height);

    // "HOT SET" label
    this.add.text(this.hotSetBounds.centerX, this.hotSetBounds.centerY, 'HOT SET', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#E63946',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.7);

    // Camera
    this.add.image(this.hotSetBounds.x + 25, this.hotSetBounds.y + 25, 'camera')
      .setScale(SPRITE_SCALE);
  }

  /**
   * Create key locations (coffee van, toilet, director, AD)
   */
  createLocations() {
    // Coffee van (bottom area)
    this.coffeeVan = this.add.image(this.gameWidth / 2, this.gameHeight - 50, 'coffee-van')
      .setScale(VAN_SCALE);
    this.coffeeVanZone = new Phaser.Geom.Rectangle(
      this.gameWidth / 2 - 50, this.gameHeight - 90, 100, 80
    );

    // Make coffee van interactive
    this.coffeeVan.setInteractive();
    this.coffeeVan.on('pointerdown', () => this.onCoffeeVanClick());

    // Toilet (right side)
    this.toilet = this.add.image(this.gameWidth - 50, 150, 'toilet')
      .setScale(SPRITE_SCALE);
    this.toiletZone = new Phaser.Geom.Rectangle(
      this.gameWidth - 70, 130, 40, 40
    );

    // Director (top area)
    this.director = this.add.image(200, 70, 'director')
      .setScale(SPRITE_SCALE);
    this.directorZone = new Phaser.Geom.Rectangle(180, 50, 40, 40);

    // 1st AD (left side)
    this.firstAD = this.add.image(80, 90, 'first-ad')
      .setScale(SPRITE_SCALE);
    this.firstADZone = new Phaser.Geom.Rectangle(60, 70, 40, 40);

    // Speech bubbles (hidden initially)
    this.directorBubble = this.createSpeechBubble(200, 35);
    this.adBubble = this.createSpeechBubble(80, 55);
  }

  /**
   * Create a speech bubble container
   */
  createSpeechBubble(x, y) {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0xFFFFFF);
    bg.fillRoundedRect(-50, -20, 100, 32, 6);
    bg.fillTriangle(-5, 12, 5, 12, 0, 20);
    container.add(bg);

    // Text
    const text = this.add.text(0, -6, '', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#1A1A1A',
      align: 'center',
    }).setOrigin(0.5);
    container.add(text);

    // Icon placeholder
    const icon = this.add.image(0, -6, 'cup-flat-white').setScale(2);
    icon.setVisible(false);
    container.add(icon);

    container.setVisible(false);
    container.text = text;
    container.icon = icon;

    return container;
  }

  /**
   * Create player character
   */
  createPlayer() {
    // Starting position (near coffee van)
    this.player = this.physics.add.image(this.gameWidth / 2, this.gameHeight - 130, 'player-idle')
      .setScale(SPRITE_SCALE);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    // Player speed (adjusted by level)
    this.playerSpeed = 150 * this.levelConfig.speed;

    // Movement target
    this.moveTarget = null;

    // Animation state
    this.playerAnimState = 'idle';
    this.animTimer = 0;
  }

  /**
   * Create HUD elements
   */
  createHUD() {
    const hudY = 8;

    // Score
    this.scoreText = this.add.text(10, hudY, 'SCORE: 0', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
    });

    // Level/Day
    this.levelText = this.add.text(10, hudY + 18, 'DAY 1', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    });

    // Tasks progress
    this.tasksText = this.add.text(10, hudY + 32, '', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#E8E8E8',
    });
    this.updateTasksText();

    // Coffee break meter (right side)
    this.add.text(this.gameWidth - 180, hudY, 'BREAK', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#8B4513',
    });
    this.coffeeBreakBar = this.createMeterBar(this.gameWidth - 140, hudY - 2, 80, 14, 0x8B4513);

    // Stress meter (far right)
    this.add.text(this.gameWidth - 55, hudY, 'STRESS', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#E8E8E8',
    });
    this.stressFace = this.add.image(this.gameWidth - 25, hudY + 8, 'face-happy').setScale(1.5);

    // Energy bar
    this.add.text(this.gameWidth - 180, hudY + 18, 'ENERGY', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#4CAF50',
    });
    this.caffeineBar = this.createMeterBar(this.gameWidth - 140, hudY + 16, 80, 14, 0x4CAF50);
  }

  /**
   * Update tasks progress text
   */
  updateTasksText() {
    const remaining = this.levelConfig.tasksToAdvance - this.tasksCompleted;
    if (remaining > 0) {
      this.tasksText.setText(`${remaining} task${remaining > 1 ? 's' : ''} to next day`);
    } else {
      this.tasksText.setText('Day complete!');
    }
  }

  /**
   * Create a meter bar graphic
   */
  createMeterBar(x, y, width, height, colour) {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x333333);
    bg.fillRoundedRect(0, 0, width, height, 3);
    container.add(bg);

    // Fill
    const fill = this.add.graphics();
    fill.fillStyle(colour);
    fill.fillRoundedRect(2, 2, width - 4, height - 4, 2);
    container.add(fill);

    container.fill = fill;
    container.barWidth = width - 4;
    container.barHeight = height - 4;
    container.colour = colour;

    return container;
  }

  /**
   * Update a meter bar to show a percentage
   */
  updateMeterBar(bar, percent) {
    bar.fill.clear();
    bar.fill.fillStyle(bar.colour);
    const fillWidth = bar.barWidth * (percent / 100);
    if (fillWidth > 0) {
      bar.fill.fillRoundedRect(2, 2, fillWidth, bar.barHeight, 2);
    }
  }

  /**
   * Set up input handlers
   */
  setupInput() {
    // Click/tap to move
    this.input.on('pointerdown', (pointer) => {
      if (this.isTakingBreak || this.isGameOver) return;

      // Set move target
      this.moveTarget = new Phaser.Math.Vector2(pointer.x, pointer.y);
    });

    // Keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
  }

  /**
   * Start the game loop timers
   */
  startGameLoop() {
    // Start spawning orders
    this.scheduleNextOrder();

    // Start caffeine decay
    this.caffeineDecayTimer = this.time.addEvent({
      delay: 1000,
      callback: this.decayCaffeine,
      callbackScope: this,
      loop: true,
    });

    // Crew spawning (if enabled for this level)
    if (this.levelConfig.crewEnabled) {
      this.startCrewSpawning();
    }

    // Actor spawning (if enabled)
    if (this.levelConfig.actorEnabled) {
      this.time.delayedCall(this.levelConfig.actorInterval, () => this.spawnActor());
    }
  }

  /**
   * Schedule the next coffee order
   */
  scheduleNextOrder() {
    if (this.isGameOver) return;

    this.orderTimer = this.time.delayedCall(
      this.levelConfig.orderInterval + Math.random() * 2000,
      this.spawnOrder,
      [],
      this
    );
  }

  /**
   * Spawn a new coffee order
   */
  spawnOrder() {
    if (this.isGameOver || this.hasOrder) return;

    // Random order type
    const orderType = COFFEE_TYPES[Math.floor(Math.random() * COFFEE_TYPES.length)];
    this.currentOrder = orderType;
    this.hasOrder = true;

    // Show on AD or Director (random)
    const isDirector = Math.random() > 0.5;
    const bubble = isDirector ? this.directorBubble : this.adBubble;

    // Update character sprite to shouting
    if (isDirector) {
      this.director.setTexture('director-angry');
    } else {
      this.firstAD.setTexture('first-ad-shout');
    }

    // Show bubble with order
    bubble.text.setText(COFFEE_NAMES[orderType]);
    bubble.icon.setTexture(`cup-${orderType}`);
    bubble.icon.setVisible(true);
    bubble.setVisible(true);

    // Store which person ordered
    this.orderSource = isDirector ? 'director' : 'ad';

    // Play shout sound
    this.playSound('shout');

    // Order timeout - increases stress if not fulfilled
    this.orderTimeout = this.time.delayedCall(this.levelConfig.orderTimeout, () => {
      if (this.hasOrder && this.currentOrder === orderType) {
        this.addStress(12);
        this.showFloatingText(this.player.x, this.player.y - 20, 'TOO SLOW!', '#E63946');
        this.hasOrder = false;
        this.currentOrder = null;
        bubble.setVisible(false);
        // Reset character
        if (isDirector) {
          this.director.setTexture('director');
        } else {
          this.firstAD.setTexture('first-ad');
        }
        // Schedule next order
        this.scheduleNextOrder();
      }
    });
  }

  /**
   * Handle clicking on the coffee van
   */
  onCoffeeVanClick() {
    if (this.isGameOver || this.isTakingBreak) return;

    // Check if player is close enough
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.coffeeVan.x, this.coffeeVan.y
    );

    if (dist > 80) return; // Too far

    // If coffee break meter is full and not carrying coffee, take a break
    if (this.coffeeBreakMeter >= 100 && !this.isCarryingCoffee) {
      this.takeCoffeeBreak();
      return;
    }

    // If there's an order and not carrying coffee, show drink selection
    if (this.hasOrder && !this.isCarryingCoffee) {
      this.showDrinkMenu();
    }
  }

  /**
   * Show drink selection menu
   */
  showDrinkMenu() {
    // Create menu container
    const menuX = this.coffeeVan.x;
    const menuY = this.coffeeVan.y - 70;

    this.drinkMenu = this.add.container(menuX, menuY);
    this.drinkMenu.setDepth(20);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 0.95);
    bg.fillRoundedRect(-100, -30, 200, 60, 8);
    bg.lineStyle(2, 0x4ECDC4);
    bg.strokeRoundedRect(-100, -30, 200, 60, 8);
    this.drinkMenu.add(bg);

    // Title
    const title = this.add.text(0, -20, 'SELECT DRINK', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    }).setOrigin(0.5);
    this.drinkMenu.add(title);

    // Drink options
    const options = COFFEE_TYPES;
    const spacing = 45;
    const startX = -67;

    options.forEach((type, i) => {
      const cup = this.add.image(startX + i * spacing, 8, `cup-${type}`);
      cup.setInteractive();
      cup.setScale(3);

      cup.on('pointerover', () => cup.setScale(4));
      cup.on('pointerout', () => cup.setScale(3));
      cup.on('pointerdown', () => this.selectDrink(type));

      this.drinkMenu.add(cup);
    });

    // Close menu on click elsewhere after a delay
    this.time.delayedCall(100, () => {
      const handler = () => {
        if (this.drinkMenu) {
          this.drinkMenu.destroy();
          this.drinkMenu = null;
        }
        this.input.off('pointerdown', handler);
      };
      this.input.on('pointerdown', handler);
    });
  }

  /**
   * Select a drink from the menu
   */
  selectDrink(type) {
    if (this.drinkMenu) {
      this.drinkMenu.destroy();
      this.drinkMenu = null;
    }

    // Pick up the coffee
    this.isCarryingCoffee = true;
    this.carriedCoffeeType = type;
    this.player.setTexture('player-coffee');

    this.playSound('coffeePour');
  }

  /**
   * Take a coffee break (restore energy)
   */
  takeCoffeeBreak() {
    this.isTakingBreak = true;
    this.coffeeBreakMeter = 0;
    this.player.setTexture('player-drink');

    this.showFloatingText(this.player.x, this.player.y - 30, 'COFFEE BREAK!', '#4ECDC4');

    // Show drinking animation for 2 seconds
    this.time.delayedCall(2000, () => {
      this.isTakingBreak = false;
      this.caffeine = Math.min(100, this.caffeine + 40);
      this.stress = Math.max(0, this.stress - 15);
      this.addScore(100);
      this.player.setTexture('player-idle');
      this.playSound('success');
    });
  }

  /**
   * Decay caffeine over time
   */
  decayCaffeine() {
    if (this.isGameOver || this.isTakingBreak) return;

    this.caffeine -= this.levelConfig.caffeineDecay;

    // Slow down when low on caffeine
    if (this.caffeine < 30) {
      this.playerSpeed = 100 * this.levelConfig.speed;
    } else {
      this.playerSpeed = 150 * this.levelConfig.speed;
    }

    // Warning at low caffeine
    if (this.caffeine < 20 && this.caffeine > 19) {
      this.showFloatingText(this.player.x, this.player.y - 30, 'NEED COFFEE!', '#FF9800');
    }

    // Game over if caffeine hits 0
    if (this.caffeine <= 0) {
      this.gameOver('caffeine');
    }
  }

  /**
   * Start spawning crew members
   */
  startCrewSpawning() {
    const interval = this.levelConfig.crewInterval || 5000;
    this.crewSpawnTimer = this.time.addEvent({
      delay: interval,
      callback: this.spawnCrew,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * Spawn a crew member walking across the set
   */
  spawnCrew() {
    if (this.isGameOver) return;
    if (this.crewMembers.length >= this.levelConfig.maxCrew) return;

    // Random crew type
    const types = CREW_TYPES;
    let type = types[Math.floor(Math.random() * types.length)];
    let isEasterEgg = false;
    let isGravedigger = false;

    // Easter egg chance (5%)
    if (Math.random() < 0.05) {
      if (Math.random() > 0.5) {
        type = 'new-shoes';
        isEasterEgg = true;
      } else {
        type = 'gravedigger';
        isGravedigger = true;
      }
    }

    // Spawn from left or right edge
    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? -20 : this.gameWidth + 20;
    const endX = fromLeft ? this.gameWidth + 20 : -20;

    // Y position within hot set area
    const y = this.hotSetBounds.y + 20 + Math.random() * (this.hotSetBounds.height - 40);

    const crew = this.physics.add.image(startX, y, type).setScale(SPRITE_SCALE);
    crew.setDepth(5);
    crew.crewType = type;
    crew.isEasterEgg = isEasterEgg;
    crew.isGravedigger = isGravedigger;
    crew.stopped = false;

    // Flip sprite based on direction
    crew.setFlipX(!fromLeft);

    // Make interactive
    crew.setInteractive();
    crew.on('pointerdown', () => this.onCrewClick(crew));

    // Move across screen
    const duration = 5000 / (this.levelConfig.crewSpeed / 20);
    this.tweens.add({
      targets: crew,
      x: endX,
      duration: duration,
      onComplete: () => this.onCrewCrossed(crew),
    });

    this.crewMembers.push(crew);
  }

  /**
   * Handle clicking on a crew member
   */
  onCrewClick(crew) {
    if (crew.stopped || this.isGameOver) return;

    // Gravedigger should NOT be stopped
    if (crew.isGravedigger) {
      // Oops! They look offended
      this.addStress(8);
      this.showFloatingText(crew.x, crew.y - 25, "I'm in the scene!", '#E63946');
      this.playSound('fail');
      return;
    }

    // Stop the crew member
    crew.stopped = true;
    this.tweens.killTweensOf(crew);

    // Visual feedback
    crew.setAlpha(0.5);

    // Add score
    if (crew.isEasterEgg) {
      this.addScore(50);
      this.showFloatingText(crew.x, crew.y - 25, '+50 BONUS!', '#4ECDC4');
    } else {
      this.addScore(25);
      this.showFloatingText(crew.x, crew.y - 25, '+25', '#4ECDC4');
    }

    // Increase coffee break meter
    this.coffeeBreakMeter = Math.min(100, this.coffeeBreakMeter + 10);

    // Count as task
    this.completeTask();

    this.playSound('success');

    // Remove after delay
    this.time.delayedCall(500, () => {
      const idx = this.crewMembers.indexOf(crew);
      if (idx > -1) this.crewMembers.splice(idx, 1);
      crew.destroy();
    });
  }

  /**
   * Handle crew member crossing the set
   */
  onCrewCrossed(crew) {
    if (crew.stopped) return;

    // Gravedigger is meant to be there - bonus!
    if (crew.isGravedigger) {
      this.addScore(30);
      this.showFloatingText(crew.x - 30, crew.y - 25, '+30 NICE!', '#4ECDC4');
    } else {
      // Regular crew crossed - add stress
      this.addStress(12);
      this.showFloatingText(crew.x - 30, crew.y - 25, 'IN THE SHOT!', '#E63946');
      this.playSound('fail');
    }

    // Remove crew member
    const idx = this.crewMembers.indexOf(crew);
    if (idx > -1) this.crewMembers.splice(idx, 1);
    crew.destroy();
  }

  /**
   * Complete a task (for level progression)
   */
  completeTask() {
    this.tasksCompleted++;
    this.updateTasksText();

    // Check for level up
    if (this.tasksCompleted >= this.levelConfig.tasksToAdvance) {
      this.levelComplete();
    }
  }

  /**
   * Add stress (0-100)
   */
  addStress(amount) {
    this.stress = Math.min(100, this.stress + amount);

    // Screen shake on high stress
    if (this.stress >= 70) {
      this.cameras.main.shake(200, 0.005);
    }

    // Update stress face
    this.updateStressFace();

    // Game over if stress hits 100
    if (this.stress >= 100) {
      this.gameOver('stress');
    }
  }

  /**
   * Reduce stress
   */
  reduceStress(amount) {
    this.stress = Math.max(0, this.stress - amount);
    this.updateStressFace();
  }

  /**
   * Update stress face icon
   */
  updateStressFace() {
    if (this.stress < 25) {
      this.stressFace.setTexture('face-happy');
    } else if (this.stress < 50) {
      this.stressFace.setTexture('face-neutral');
    } else if (this.stress < 75) {
      this.stressFace.setTexture('face-worried');
    } else {
      this.stressFace.setTexture('face-angry');
    }
  }

  /**
   * Add score
   */
  addScore(amount) {
    this.score += amount;
    this.scoreText.setText(`SCORE: ${this.score}`);
  }

  /**
   * Show floating text
   */
  showFloatingText(x, y, message, colour) {
    const text = this.add.text(x, y, message, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: colour,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 1200,
      onComplete: () => text.destroy(),
    });
  }

  /**
   * Show tutorial for level 1
   */
  showTutorial() {
    const texts = [
      { delay: 500, text: 'Use WASD or click to move!', y: 200 },
      { delay: 3000, text: 'Fetch coffees when the AD or Director shouts!', y: 200 },
      { delay: 6000, text: 'Complete tasks to earn coffee breaks!', y: 200 },
    ];

    texts.forEach(({ delay, text, y }) => {
      this.time.delayedCall(delay, () => {
        if (this.isGameOver) return;
        const t = this.add.text(this.gameWidth / 2, y, text, {
          fontSize: '14px',
          fontFamily: 'monospace',
          color: '#4ECDC4',
          backgroundColor: '#2D314288',
          padding: { x: 10, y: 5 },
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
          targets: t,
          alpha: 0,
          delay: 2500,
          duration: 500,
          onComplete: () => t.destroy(),
        });
      });
    });
  }

  /**
   * Actor escort mechanics (level 5+)
   */
  spawnActor() {
    if (this.activeActor || this.isGameOver) return;
    if (!this.levelConfig.actorEnabled) return;

    // Create actor near hot set
    const startX = 70;
    const startY = this.hotSetBounds.centerY;

    this.activeActor = this.physics.add.image(startX, startY, 'actor-desperate')
      .setScale(SPRITE_SCALE);
    this.activeActor.setDepth(6);

    // Show need loo icon
    this.actorBubble = this.createSpeechBubble(startX, startY - 35);
    this.actorBubble.text.setText('Need loo!');
    this.actorBubble.icon.setVisible(false);
    this.actorBubble.setVisible(true);

    // Make actor interactive for path drawing
    this.activeActor.setInteractive();
    this.isDrawingPath = false;
    this.escortPath = [];

    // Path drawing
    this.input.on('pointermove', this.onPathDraw, this);

    // Timeout for actor
    this.actorTimeout = this.time.delayedCall(12000, () => {
      if (this.activeActor) {
        this.addStress(20);
        this.showFloatingText(this.activeActor.x, this.activeActor.y - 25, 'ACTOR EMERGENCY!', '#E63946');
        this.clearActor();
      }
    });
  }

  /**
   * Handle path drawing for actor escort
   */
  onPathDraw(pointer) {
    if (!this.activeActor || this.isGameOver) return;

    // Start drawing if clicking near actor
    const distToActor = Phaser.Math.Distance.Between(
      pointer.x, pointer.y,
      this.activeActor.x, this.activeActor.y
    );

    if (pointer.isDown && distToActor < 40 && !this.isDrawingPath) {
      this.isDrawingPath = true;
      this.escortPath = [{ x: this.activeActor.x, y: this.activeActor.y }];
      this.pathGraphics = this.add.graphics();
      this.pathGraphics.setDepth(4);
    }

    if (this.isDrawingPath && pointer.isDown) {
      this.escortPath.push({ x: pointer.x, y: pointer.y });

      // Draw path
      this.pathGraphics.clear();
      this.pathGraphics.lineStyle(4, 0x4ECDC4, 0.6);
      this.pathGraphics.beginPath();
      this.pathGraphics.moveTo(this.escortPath[0].x, this.escortPath[0].y);
      this.escortPath.forEach(p => this.pathGraphics.lineTo(p.x, p.y));
      this.pathGraphics.strokePath();

      // Check if reached toilet
      const distToToilet = Phaser.Math.Distance.Between(
        pointer.x, pointer.y,
        this.toilet.x, this.toilet.y
      );

      if (distToToilet < 30) {
        this.completeActorEscort();
      }
    }

    if (!pointer.isDown && this.isDrawingPath) {
      // Released without reaching toilet - fail if path went through hot set
      this.checkPathValidity();
    }
  }

  /**
   * Check if escort path went through hot set
   */
  checkPathValidity() {
    if (!this.escortPath.length) return;

    let wentThroughHotSet = false;

    for (const point of this.escortPath) {
      if (this.hotSetBounds.contains(point.x, point.y)) {
        wentThroughHotSet = true;
        break;
      }
    }

    if (wentThroughHotSet) {
      this.addStress(15);
      this.showFloatingText(this.activeActor.x, this.activeActor.y - 25, 'THROUGH THE SHOT!', '#E63946');
      this.playSound('fail');
    }

    this.clearActor();
  }

  /**
   * Successfully escort actor to toilet
   */
  completeActorEscort() {
    // Check if path went through hot set
    let wentThroughHotSet = false;
    for (const point of this.escortPath) {
      if (this.hotSetBounds.contains(point.x, point.y)) {
        wentThroughHotSet = true;
        break;
      }
    }

    if (wentThroughHotSet) {
      this.addStress(10);
      this.addScore(25);
      this.showFloatingText(this.toilet.x, this.toilet.y - 25, '+25 (BAD PATH)', '#FF9800');
    } else {
      this.addScore(75);
      this.coffeeBreakMeter = Math.min(100, this.coffeeBreakMeter + 20);
      this.reduceStress(5);
      this.showFloatingText(this.toilet.x, this.toilet.y - 25, '+75 PERFECT!', '#4ECDC4');
      this.completeTask();
    }

    this.playSound('success');
    this.clearActor();
  }

  /**
   * Clear active actor
   */
  clearActor() {
    if (this.activeActor) {
      this.activeActor.destroy();
      this.activeActor = null;
    }
    if (this.actorBubble) {
      this.actorBubble.destroy();
      this.actorBubble = null;
    }
    if (this.pathGraphics) {
      this.pathGraphics.destroy();
      this.pathGraphics = null;
    }
    if (this.actorTimeout) {
      this.actorTimeout.destroy();
      this.actorTimeout = null;
    }
    this.isDrawingPath = false;
    this.escortPath = [];
    this.input.off('pointermove', this.onPathDraw, this);

    // Schedule next actor spawn
    if (this.levelConfig.actorEnabled && !this.isGameOver) {
      const interval = this.levelConfig.actorInterval || 12000;
      this.time.delayedCall(interval, () => this.spawnActor());
    }
  }

  /**
   * Game over handler
   */
  gameOver(reason) {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Stop all timers
    if (this.orderTimer) this.orderTimer.destroy();
    if (this.crewSpawnTimer) this.crewSpawnTimer.destroy();
    if (this.caffeineDecayTimer) this.caffeineDecayTimer.destroy();

    // Save high score
    const highScore = localStorage.getItem('behindTheBeans_highScore') || 0;
    if (this.score > highScore) {
      localStorage.setItem('behindTheBeans_highScore', this.score);
    }

    // Transition to game over scene
    this.time.delayedCall(1000, () => {
      this.cameras.main.fadeOut(500, 45, 49, 66);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameOverScene', {
          score: this.score,
          level: this.level,
          reason: reason,
        });
      });
    });
  }

  /**
   * Level complete
   */
  levelComplete() {
    this.level++;
    this.tasksCompleted = 0;
    this.levelConfig = this.getLevelConfig(this.level);

    // Show level complete message
    const levelText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 20, `DAY ${this.level}!`, {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    // Show what's new this level
    let newFeature = '';
    if (this.level === 3) {
      newFeature = 'Watch out for crew crossing the set!';
    } else if (this.level === 5) {
      newFeature = 'Actors need escorting to the loo!';
    } else if (this.level > 6) {
      newFeature = 'The chaos intensifies...';
    }

    let phraseText = null;
    if (newFeature) {
      phraseText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 15, newFeature, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#FAF7F2',
      }).setOrigin(0.5).setDepth(100);
    }

    // Show director phrase
    const phrase = DIRECTOR_PHRASES[Math.floor(Math.random() * DIRECTOR_PHRASES.length)];
    const directorText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 35, `"${phrase}"`, {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#8B4513',
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(100);

    this.playSound('levelComplete');

    // Bonus for completing day
    this.addScore(this.level * 50);
    this.reduceStress(10);

    this.time.delayedCall(2500, () => {
      levelText.destroy();
      if (phraseText) phraseText.destroy();
      directorText.destroy();

      // Update UI
      this.levelText.setText(`DAY ${this.level}`);
      this.updateTasksText();

      // Update speed
      this.playerSpeed = 150 * this.levelConfig.speed;

      // Start crew/actor spawning if newly unlocked
      if (this.levelConfig.crewEnabled && !this.crewSpawnTimer) {
        this.startCrewSpawning();
      }
      if (this.levelConfig.actorEnabled && !this.activeActor) {
        this.time.delayedCall(5000, () => this.spawnActor());
      }
    });
  }

  /**
   * Play a sound effect
   */
  playSound(type) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const sounds = {
        success: { freq: 880, dur: 0.15, type: 'square' },
        fail: { freq: 150, dur: 0.3, type: 'sawtooth' },
        shout: { freq: 300, dur: 0.1, type: 'square' },
        coffeePour: { freq: 200, dur: 0.3, type: 'sine' },
        levelComplete: { freq: 523, dur: 0.4, type: 'square' },
      };

      const sound = sounds[type] || sounds.success;
      oscillator.frequency.value = sound.freq;
      oscillator.type = sound.type;
      gainNode.gain.value = 0.1;

      oscillator.start();

      // For level complete, play a little melody
      if (type === 'levelComplete') {
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
      }

      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + sound.dur);
      oscillator.stop(audioContext.currentTime + sound.dur);
    } catch (e) {
      // Audio not supported
    }
  }

  /**
   * Main update loop
   */
  update(time, delta) {
    if (this.isGameOver || this.isTakingBreak) return;

    // Handle player movement
    this.updatePlayerMovement(delta);

    // Update player animation
    this.updatePlayerAnimation(time);

    // Check delivery zones
    this.checkDeliveryZones();

    // Update HUD
    this.updateMeterBar(this.coffeeBreakBar, this.coffeeBreakMeter);
    this.updateMeterBar(this.caffeineBar, this.caffeine);
  }

  /**
   * Update player movement
   */
  updatePlayerMovement(delta) {
    // Keyboard movement
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 1;

    if (vx !== 0 || vy !== 0) {
      // Normalise for diagonal movement
      const len = Math.sqrt(vx * vx + vy * vy);
      vx /= len;
      vy /= len;

      this.player.setVelocity(vx * this.playerSpeed, vy * this.playerSpeed);
      this.moveTarget = null;
    } else if (this.moveTarget) {
      // Move towards click target
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.moveTarget.x, this.moveTarget.y
      );

      if (dist > 8) {
        const angle = Phaser.Math.Angle.Between(
          this.player.x, this.player.y,
          this.moveTarget.x, this.moveTarget.y
        );

        this.player.setVelocity(
          Math.cos(angle) * this.playerSpeed,
          Math.sin(angle) * this.playerSpeed
        );
      } else {
        this.player.setVelocity(0, 0);
        this.moveTarget = null;
      }
    } else {
      this.player.setVelocity(0, 0);
    }

    // Keep player in bounds (not in hot set unless escorting)
    if (this.hotSetBounds.contains(this.player.x, this.player.y)) {
      // Push player out of hot set
      const centerX = this.hotSetBounds.centerX;
      const centerY = this.hotSetBounds.centerY;

      if (this.player.x < centerX) {
        this.player.x = this.hotSetBounds.x - 20;
      } else {
        this.player.x = this.hotSetBounds.right + 20;
      }
    }

    // Clamp to play area (below HUD)
    this.player.y = Phaser.Math.Clamp(this.player.y, 60, this.gameHeight - 20);
  }

  /**
   * Update player animation
   */
  updatePlayerAnimation(time) {
    if (this.isCarryingCoffee) {
      this.player.setTexture('player-coffee');
    } else if (Math.abs(this.player.body.velocity.x) > 1 || Math.abs(this.player.body.velocity.y) > 1) {
      // Running animation (toggle frames)
      if (time - this.animTimer > 150) {
        this.animTimer = time;
        this.playerAnimState = this.playerAnimState === 'idle' ? 'run' : 'idle';
        this.player.setTexture(this.playerAnimState === 'run' ? 'player-run' : 'player-idle');
      }
    } else {
      this.player.setTexture('player-idle');
    }

    // Flip sprite based on direction
    if (this.player.body.velocity.x < -1) {
      this.player.setFlipX(true);
    } else if (this.player.body.velocity.x > 1) {
      this.player.setFlipX(false);
    }
  }

  /**
   * Check if player is in delivery zones
   */
  checkDeliveryZones() {
    if (!this.isCarryingCoffee) return;

    // Check if near director or AD
    const targetZone = this.orderSource === 'director' ? this.directorZone : this.firstADZone;

    if (Phaser.Geom.Rectangle.Contains(targetZone, this.player.x, this.player.y)) {
      this.deliverCoffee();
    }
  }

  /**
   * Deliver coffee to the person who ordered
   */
  deliverCoffee() {
    const correctOrder = this.carriedCoffeeType === this.currentOrder;

    if (correctOrder) {
      // Success!
      this.addScore(50);
      this.coffeeBreakMeter = Math.min(100, this.coffeeBreakMeter + 15);
      this.reduceStress(5);
      this.showFloatingText(this.player.x, this.player.y - 25, '+50', '#4ECDC4');
      this.playSound('success');
      this.completeTask();
    } else {
      // Wrong drink!
      this.addStress(15);
      this.showFloatingText(this.player.x, this.player.y - 25, 'WRONG DRINK!', '#E63946');
      this.playSound('fail');
    }

    // Clear order state
    this.isCarryingCoffee = false;
    this.carriedCoffeeType = null;
    this.hasOrder = false;
    this.currentOrder = null;
    this.player.setTexture('player-idle');

    // Hide bubbles
    this.directorBubble.setVisible(false);
    this.adBubble.setVisible(false);

    // Reset character sprites
    this.director.setTexture('director');
    this.firstAD.setTexture('first-ad');

    // Cancel timeout
    if (this.orderTimeout) {
      this.orderTimeout.destroy();
      this.orderTimeout = null;
    }

    // Schedule next order
    this.scheduleNextOrder();
  }
}
