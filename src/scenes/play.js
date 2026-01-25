/**
 * Play Scene
 * Main gameplay - coffee runs, crew blocking, actor escorts
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

    // Level configuration
    this.levelConfig = this.getLevelConfig(this.level);

    // Active entities
    this.crewMembers = [];
    this.activeActor = null;
    this.escortPath = [];
  }

  /**
   * Get configuration for a given level
   */
  getLevelConfig(level) {
    const configs = {
      1: { orderInterval: 5000, crewEnabled: false, actorEnabled: false, speed: 0.8, crewSpeed: 20 },
      2: { orderInterval: 4500, crewEnabled: true, actorEnabled: false, speed: 0.9, crewSpeed: 25 },
      3: { orderInterval: 4000, crewEnabled: true, actorEnabled: true, speed: 1.0, crewSpeed: 30 },
      4: { orderInterval: 3500, crewEnabled: true, actorEnabled: true, speed: 1.1, crewSpeed: 35 },
      5: { orderInterval: 3000, crewEnabled: true, actorEnabled: true, speed: 1.2, crewSpeed: 40 },
    };
    // After level 5, endless mode with increasing difficulty
    if (level > 5) {
      return {
        orderInterval: Math.max(2000, 3000 - (level - 5) * 200),
        crewEnabled: true,
        actorEnabled: true,
        speed: 1.2 + (level - 5) * 0.1,
        crewSpeed: 40 + (level - 5) * 5,
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
    g.fillRect(0, 16, this.gameWidth, this.gameHeight - 16);

    // Add some floor texture
    g.fillStyle(0xE8E8E8, 0.3);
    for (let x = 0; x < this.gameWidth; x += 16) {
      for (let y = 16; y < this.gameHeight; y += 16) {
        if ((x + y) % 32 === 0) {
          g.fillRect(x, y, 8, 8);
        }
      }
    }
  }

  /**
   * Create hot set area (no crossing zone)
   */
  createHotSet() {
    // Hot set boundaries
    this.hotSetBounds = new Phaser.Geom.Rectangle(60, 45, 80, 45);

    // Draw hot set area
    const g = this.add.graphics();

    // Floor of hot set
    g.fillStyle(0xFFE4E1, 0.5);
    g.fillRect(this.hotSetBounds.x, this.hotSetBounds.y,
      this.hotSetBounds.width, this.hotSetBounds.height);

    // Hazard stripes around border
    g.lineStyle(2, 0xE63946);
    g.strokeRect(this.hotSetBounds.x, this.hotSetBounds.y,
      this.hotSetBounds.width, this.hotSetBounds.height);

    // "HOT SET" label
    this.add.text(this.hotSetBounds.centerX, this.hotSetBounds.centerY, 'HOT SET', {
      fontSize: '6px',
      fontFamily: 'monospace',
      color: '#E63946',
    }).setOrigin(0.5).setAlpha(0.7);

    // Camera
    this.add.image(this.hotSetBounds.x + 10, this.hotSetBounds.y + 10, 'camera')
      .setScale(0.8);
  }

  /**
   * Create key locations (coffee van, toilet, director, AD)
   */
  createLocations() {
    // Coffee van (bottom area)
    this.coffeeVan = this.add.image(this.gameWidth / 2, this.gameHeight - 20, 'coffee-van');
    this.coffeeVanZone = new Phaser.Geom.Rectangle(
      this.gameWidth / 2 - 20, this.gameHeight - 36, 40, 32
    );

    // Make coffee van interactive
    this.coffeeVan.setInteractive();
    this.coffeeVan.on('pointerdown', () => this.onCoffeeVanClick());

    // Toilet (right side)
    this.toilet = this.add.image(this.gameWidth - 20, 60, 'toilet');
    this.toiletZone = new Phaser.Geom.Rectangle(
      this.gameWidth - 28, 52, 16, 16
    );

    // Director (top left-ish)
    this.director = this.add.image(80, 28, 'director');
    this.directorZone = new Phaser.Geom.Rectangle(72, 20, 16, 16);

    // 1st AD (left side)
    this.firstAD = this.add.image(35, 35, 'first-ad');
    this.firstADZone = new Phaser.Geom.Rectangle(27, 27, 16, 16);

    // Speech bubbles (hidden initially)
    this.directorBubble = this.createSpeechBubble(80, 10);
    this.adBubble = this.createSpeechBubble(35, 17);
  }

  /**
   * Create a speech bubble container
   */
  createSpeechBubble(x, y) {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0xFFFFFF);
    bg.fillRoundedRect(-18, -10, 36, 16, 3);
    bg.fillTriangle(-2, 6, 2, 6, 0, 10);
    container.add(bg);

    // Text
    const text = this.add.text(0, -3, '', {
      fontSize: '5px',
      fontFamily: 'monospace',
      color: '#1A1A1A',
      align: 'center',
    }).setOrigin(0.5);
    container.add(text);

    // Icon placeholder
    const icon = this.add.image(0, -3, 'cup-flat-white').setScale(0.8);
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
    this.player = this.physics.add.image(this.gameWidth / 2, this.gameHeight - 50, 'player-idle');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    // Player speed (adjusted by level)
    this.playerSpeed = 60 * this.levelConfig.speed;

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
    const hudY = 2;

    // Score
    this.scoreText = this.add.text(4, hudY, 'SCORE: 0', {
      fontSize: '6px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
    });

    // Level/Day
    this.levelText = this.add.text(4, hudY + 8, 'DAY 1', {
      fontSize: '5px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    });

    // Coffee break meter (right side)
    this.add.image(this.gameWidth - 50, hudY + 6, 'coffee-icon').setScale(0.6);
    this.coffeeBreakBar = this.createMeterBar(this.gameWidth - 40, hudY + 2, 35, 8, 0x8B4513);

    // Stress meter (far right)
    this.stressFace = this.add.image(this.gameWidth - 8, hudY + 6, 'face-happy').setScale(0.8);

    // Caffeine/energy bar (below coffee break)
    this.add.text(this.gameWidth - 55, hudY + 11, 'ENERGY', {
      fontSize: '3px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
    });
    this.caffeineBar = this.createMeterBar(this.gameWidth - 40, hudY + 10, 35, 4, 0x4CAF50);
  }

  /**
   * Create a meter bar graphic
   */
  createMeterBar(x, y, width, height, colour) {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x333333);
    bg.fillRect(0, 0, width, height);
    container.add(bg);

    // Fill
    const fill = this.add.graphics();
    fill.fillStyle(colour);
    fill.fillRect(1, 1, width - 2, height - 2);
    container.add(fill);

    container.fill = fill;
    container.barWidth = width - 2;
    container.barHeight = height - 2;
    container.colour = colour;

    return container;
  }

  /**
   * Update a meter bar to show a percentage
   */
  updateMeterBar(bar, percent) {
    bar.fill.clear();
    bar.fill.fillStyle(bar.colour);
    bar.fill.fillRect(1, 1, bar.barWidth * (percent / 100), bar.barHeight);
  }

  /**
   * Set up input handlers
   */
  setupInput() {
    // Click/tap to move
    this.input.on('pointerdown', (pointer) => {
      // Check if clicking on interactive elements first
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

    // Crew spawning (if enabled)
    if (this.levelConfig.crewEnabled) {
      this.startCrewSpawning();
    }
  }

  /**
   * Schedule the next coffee order
   */
  scheduleNextOrder() {
    if (this.isGameOver) return;

    this.orderTimer = this.time.delayedCall(
      this.levelConfig.orderInterval + Math.random() * 1000,
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
    const character = isDirector ? this.director : this.firstAD;

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
    this.orderTimeout = this.time.delayedCall(8000, () => {
      if (this.hasOrder && this.currentOrder === orderType) {
        this.addStress(15);
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

    if (dist > 30) return; // Too far

    // If coffee break meter is full and not carrying coffee, take a break
    if (this.coffeeBreakMeter >= 100 && !this.isCarryingCoffee && !this.hasOrder) {
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
    const menuY = this.coffeeVan.y - 30;

    this.drinkMenu = this.add.container(menuX, menuY);
    this.drinkMenu.setDepth(20);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 0.9);
    bg.fillRoundedRect(-40, -12, 80, 24, 4);
    this.drinkMenu.add(bg);

    // Drink options
    const options = COFFEE_TYPES;
    const spacing = 18;
    const startX = -27;

    options.forEach((type, i) => {
      const cup = this.add.image(startX + i * spacing, 0, `cup-${type}`);
      cup.setInteractive();
      cup.setScale(1.5);

      cup.on('pointerover', () => cup.setScale(2));
      cup.on('pointerout', () => cup.setScale(1.5));
      cup.on('pointerdown', () => this.selectDrink(type));

      this.drinkMenu.add(cup);
    });

    // Close menu on click elsewhere after a delay
    this.time.delayedCall(100, () => {
      this.input.once('pointerdown', (pointer) => {
        // Check if clicking outside menu
        if (this.drinkMenu) {
          this.drinkMenu.destroy();
          this.drinkMenu = null;
        }
      });
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

    // Show drinking animation for 2 seconds
    this.time.delayedCall(2000, () => {
      this.isTakingBreak = false;
      this.caffeine = Math.min(100, this.caffeine + 50);
      this.stress = Math.max(0, this.stress - 10);
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

    this.caffeine -= 1;

    // Slow down when low on caffeine
    if (this.caffeine < 30) {
      this.playerSpeed = 40 * this.levelConfig.speed;
    } else {
      this.playerSpeed = 60 * this.levelConfig.speed;
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
    this.crewSpawnTimer = this.time.addEvent({
      delay: 3000 + Math.random() * 2000,
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
    if (this.crewMembers.length >= 3) return; // Max 3 at once

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
    const startX = fromLeft ? -10 : this.gameWidth + 10;
    const endX = fromLeft ? this.gameWidth + 10 : -10;

    // Y position within hot set area
    const y = this.hotSetBounds.y + 10 + Math.random() * (this.hotSetBounds.height - 20);

    const crew = this.physics.add.image(startX, y, type);
    crew.setDepth(5);
    crew.crewType = type;
    crew.isEasterEgg = isEasterEgg;
    crew.isGravedigger = isGravedigger;
    crew.stopped = false;

    // Make interactive
    crew.setInteractive();
    crew.on('pointerdown', () => this.onCrewClick(crew));

    // Move across screen
    const duration = 4000 / (this.levelConfig.crewSpeed / 20);
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
      this.addStress(10);
      this.showFloatingText(crew.x, crew.y - 10, 'Oi!', '#E63946');
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
      this.showFloatingText(crew.x, crew.y - 10, '+50 BONUS!', '#4ECDC4');
    } else {
      this.addScore(20);
      this.showFloatingText(crew.x, crew.y - 10, '+20', '#4ECDC4');
    }

    // Increase coffee break meter
    this.coffeeBreakMeter = Math.min(100, this.coffeeBreakMeter + 10);

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
      this.showFloatingText(crew.x - 20, crew.y - 10, '+30 NICE!', '#4ECDC4');
    } else {
      // Regular crew crossed - add stress
      this.addStress(15);
      this.showFloatingText(crew.x - 20, crew.y - 10, 'WALKED INTO SHOT!', '#E63946');
      this.playSound('fail');
    }

    // Remove crew member
    const idx = this.crewMembers.indexOf(crew);
    if (idx > -1) this.crewMembers.splice(idx, 1);
    crew.destroy();
  }

  /**
   * Add stress (0-100)
   */
  addStress(amount) {
    this.stress = Math.min(100, this.stress + amount);

    // Screen shake on high stress
    if (this.stress >= 75) {
      this.cameras.main.shake(200, 0.01);
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
      fontSize: '6px',
      fontFamily: 'monospace',
      color: colour,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 15,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy(),
    });
  }

  /**
   * Show tutorial for level 1
   */
  showTutorial() {
    const texts = [
      { delay: 500, text: 'Tap to move!', y: 80 },
      { delay: 2000, text: 'Fetch coffees from the craft van!', y: 80 },
      { delay: 4000, text: 'Earn breaks by completing tasks!', y: 80 },
    ];

    texts.forEach(({ delay, text, y }) => {
      this.time.delayedCall(delay, () => {
        if (this.isGameOver) return;
        const t = this.add.text(this.gameWidth / 2, y, text, {
          fontSize: '6px',
          fontFamily: 'monospace',
          color: '#4ECDC4',
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
          targets: t,
          alpha: 0,
          delay: 1500,
          duration: 500,
          onComplete: () => t.destroy(),
        });
      });
    });
  }

  /**
   * Actor escort mechanics (level 3+)
   */
  spawnActor() {
    if (this.activeActor || this.isGameOver) return;
    if (!this.levelConfig.actorEnabled) return;

    // Create actor near hot set
    const startX = 30;
    const startY = this.hotSetBounds.centerY;

    this.activeActor = this.physics.add.image(startX, startY, 'actor-desperate');
    this.activeActor.setDepth(6);

    // Show need loo icon
    this.actorBubble = this.createSpeechBubble(startX, startY - 15);
    this.actorBubble.text.setText('Need loo!');
    this.actorBubble.setVisible(true);

    // Make actor interactive for path drawing
    this.activeActor.setInteractive();
    this.isDrawingPath = false;
    this.escortPath = [];

    // Path drawing
    this.input.on('pointermove', this.onPathDraw, this);

    // Timeout for actor
    this.actorTimeout = this.time.delayedCall(10000, () => {
      if (this.activeActor) {
        this.addStress(25);
        this.showFloatingText(this.activeActor.x, this.activeActor.y - 10, 'ACTOR EMERGENCY!', '#E63946');
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

    if (pointer.isDown && distToActor < 20 && !this.isDrawingPath) {
      this.isDrawingPath = true;
      this.escortPath = [{ x: this.activeActor.x, y: this.activeActor.y }];
      this.pathGraphics = this.add.graphics();
      this.pathGraphics.setDepth(4);
    }

    if (this.isDrawingPath && pointer.isDown) {
      this.escortPath.push({ x: pointer.x, y: pointer.y });

      // Draw path
      this.pathGraphics.clear();
      this.pathGraphics.lineStyle(2, 0x4ECDC4, 0.5);
      this.pathGraphics.beginPath();
      this.pathGraphics.moveTo(this.escortPath[0].x, this.escortPath[0].y);
      this.escortPath.forEach(p => this.pathGraphics.lineTo(p.x, p.y));
      this.pathGraphics.strokePath();

      // Check if reached toilet
      const distToToilet = Phaser.Math.Distance.Between(
        pointer.x, pointer.y,
        this.toilet.x, this.toilet.y
      );

      if (distToToilet < 15) {
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
      this.addStress(20);
      this.showFloatingText(this.activeActor.x, this.activeActor.y - 10, 'WALKED THROUGH SHOT!', '#E63946');
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
      this.addStress(15);
      this.addScore(20);
      this.showFloatingText(this.toilet.x, this.toilet.y - 10, '+20 (BAD PATH)', '#FFA500');
    } else {
      this.addScore(75);
      this.coffeeBreakMeter = Math.min(100, this.coffeeBreakMeter + 20);
      this.reduceStress(5);
      this.showFloatingText(this.toilet.x, this.toilet.y - 10, '+75 PERFECT!', '#4ECDC4');
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
      this.time.delayedCall(8000 + Math.random() * 5000, () => this.spawnActor());
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
    this.levelConfig = this.getLevelConfig(this.level);

    // Show level complete message
    const levelText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, `DAY ${this.level}!`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    }).setOrigin(0.5).setDepth(100);

    // Show director phrase
    const phrase = DIRECTOR_PHRASES[Math.floor(Math.random() * DIRECTOR_PHRASES.length)];
    const phraseText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 15, phrase, {
      fontSize: '5px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
    }).setOrigin(0.5).setDepth(100);

    this.playSound('levelComplete');

    this.time.delayedCall(2000, () => {
      levelText.destroy();
      phraseText.destroy();

      // Update UI
      this.levelText.setText(`DAY ${this.level}`);

      // Update speed
      this.playerSpeed = 60 * this.levelConfig.speed;

      // Start crew/actor spawning if newly unlocked
      if (this.levelConfig.crewEnabled && !this.crewSpawnTimer) {
        this.startCrewSpawning();
      }
      if (this.levelConfig.actorEnabled && !this.activeActor) {
        this.time.delayedCall(3000, () => this.spawnActor());
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

    // Check for level completion (every 30 seconds of play = 1 level)
    if (!this.levelStartTime) this.levelStartTime = time;
    if (time - this.levelStartTime > 30000 && this.level < 10) {
      this.levelStartTime = time;
      this.levelComplete();
    }
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

      if (dist > 3) {
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
        this.player.x = this.hotSetBounds.x - 8;
      } else {
        this.player.x = this.hotSetBounds.right + 8;
      }
    }

    // Clamp to play area (below HUD)
    this.player.y = Phaser.Math.Clamp(this.player.y, 24, this.gameHeight - 8);
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
      this.showFloatingText(this.player.x, this.player.y - 10, '+50', '#4ECDC4');
      this.playSound('success');
    } else {
      // Wrong drink!
      this.addStress(20);
      this.showFloatingText(this.player.x, this.player.y - 10, 'WRONG DRINK!', '#E63946');
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
