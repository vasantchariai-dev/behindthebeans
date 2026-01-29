/**
 * Play Scene
 * Main gameplay - coffee runs, crew blocking, actor escorts
 * Vertical/portrait format for mobile
 * Difficulty builds gradually over days
 */

import Phaser from 'phaser';

// Game constants
const COFFEE_TYPES = ['flat-white', 'oat-latte', 'black', 'tea'];
const COFFEE_NAMES = {
  'flat-white': 'Flat White',
  'oat-latte': 'Oat Latte',
  'black': 'Black Coffee',
  'tea': 'Tea',
};
const CREW_TYPES = ['rigger', 'spark', 'runner-crew'];
const ACTOR_NAMES = ['ALEX', 'SAM', 'JAMIE', 'RILEY', 'TAYLOR', 'MORGAN', 'CASEY', 'DREW'];

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
    this.caffeine = 100; // 0-100 (energy level)
    this.coffeeBreakMeter = 0; // 0-100
    this.tasksCompleted = 0; // Track tasks for level progression
    this.missedCoffees = 0; // Track missed coffee orders (3 = game over)

    // Gameplay flags
    this.hasOrder = false;
    this.currentOrder = null;
    this.isCarryingCoffee = false;
    this.carriedCoffeeType = null;
    this.isTakingBreak = false;
    this.isGameOver = false;
    this.shownCrewTutorial = false; // Track if we've shown crew tutorial
    this.actorTutorialCount = 0; // Track how many times actor tutorial shown

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
   * ALL 3 TASKS available from day 1, MORE HECTIC pacing
   */
  getLevelConfig(level) {
    const configs = {
      // Day 1: Quick intro but still manageable
      1: {
        orderInterval: 6000,      // 6 seconds between orders
        orderTimeout: 12000,      // 12 seconds to deliver
        crewEnabled: true,        // All tasks from start
        actorEnabled: true,
        speed: 1.0,
        crewSpeed: 12,
        maxCrew: 1,
        crewInterval: 8000,       // Crew every 8 seconds
        actorInterval: 15000,     // Actor every 15 seconds
        caffeineDecay: 0.4,
        tasksToAdvance: 4,
      },
      // Day 2: Busier
      2: {
        orderInterval: 5500,
        orderTimeout: 11000,
        crewEnabled: true,
        actorEnabled: true,
        speed: 1.05,
        crewSpeed: 14,
        maxCrew: 2,
        crewInterval: 7000,
        actorInterval: 13000,
        caffeineDecay: 0.5,
        tasksToAdvance: 5,
      },
      // Day 3: Getting hectic
      3: {
        orderInterval: 5000,
        orderTimeout: 10000,
        crewEnabled: true,
        actorEnabled: true,
        speed: 1.1,
        crewSpeed: 16,
        maxCrew: 2,
        crewInterval: 6000,
        actorInterval: 11000,
        caffeineDecay: 0.55,
        tasksToAdvance: 6,
      },
      // Day 4: Hectic
      4: {
        orderInterval: 4500,
        orderTimeout: 9000,
        crewEnabled: true,
        actorEnabled: true,
        speed: 1.15,
        crewSpeed: 18,
        maxCrew: 2,
        crewInterval: 5000,
        actorInterval: 10000,
        caffeineDecay: 0.6,
        tasksToAdvance: 6,
      },
      // Day 5: Very hectic
      5: {
        orderInterval: 4000,
        orderTimeout: 8500,
        crewEnabled: true,
        actorEnabled: true,
        speed: 1.2,
        crewSpeed: 20,
        maxCrew: 3,
        crewInterval: 4500,
        actorInterval: 9000,
        caffeineDecay: 0.7,
        tasksToAdvance: 7,
      },
      // Day 6+: Full chaos
      6: {
        orderInterval: 3500,
        orderTimeout: 8000,
        crewEnabled: true,
        actorEnabled: true,
        speed: 1.25,
        crewSpeed: 22,
        maxCrew: 3,
        crewInterval: 4000,
        actorInterval: 8000,
        caffeineDecay: 0.8,
        tasksToAdvance: 8,
      },
    };

    // After day 6, endless mode with increasing difficulty
    if (level > 6) {
      const base = configs[6];
      return {
        ...base,
        orderInterval: Math.max(2500, base.orderInterval - (level - 6) * 100),
        orderTimeout: Math.max(6000, base.orderTimeout - (level - 6) * 100),
        speed: Math.min(1.5, base.speed + (level - 6) * 0.05),
        crewSpeed: Math.min(30, base.crewSpeed + (level - 6) * 2),
        crewInterval: Math.max(3000, base.crewInterval - (level - 6) * 100),
        actorInterval: Math.max(6000, base.actorInterval - (level - 6) * 200),
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
    // Floor (starts below HUD area)
    const g = this.add.graphics();
    g.fillStyle(0xFAF7F2);
    g.fillRect(0, 68, this.gameWidth, this.gameHeight - 68);

    // Add some floor texture
    g.fillStyle(0xE8E8E8, 0.3);
    for (let x = 0; x < this.gameWidth; x += 40) {
      for (let y = 68; y < this.gameHeight; y += 40) {
        if ((x + y) % 80 === 0) {
          g.fillRect(x, y, 20, 20);
        }
      }
    }
  }

  /**
   * Create hot set area (no crossing zone) - CENTERED with more props
   */
  createHotSet() {
    // Hot set boundaries - centered in the middle of the screen
    const setWidth = 200;
    const setHeight = 140;
    this.hotSetBounds = new Phaser.Geom.Rectangle(
      (this.gameWidth - setWidth) / 2,
      200,
      setWidth,
      setHeight
    );

    // Draw hot set area
    const g = this.add.graphics();

    // Floor of hot set (wooden stage look)
    g.fillStyle(0xDEB887, 0.7);
    g.fillRect(this.hotSetBounds.x, this.hotSetBounds.y,
      this.hotSetBounds.width, this.hotSetBounds.height);

    // Stage floor boards
    g.lineStyle(1, 0xCD853F, 0.5);
    for (let x = this.hotSetBounds.x; x < this.hotSetBounds.right; x += 20) {
      g.moveTo(x, this.hotSetBounds.y);
      g.lineTo(x, this.hotSetBounds.bottom);
    }
    g.strokePath();

    // Hazard stripes around border
    g.lineStyle(4, 0xE63946);
    g.strokeRect(this.hotSetBounds.x, this.hotSetBounds.y,
      this.hotSetBounds.width, this.hotSetBounds.height);

    // "LIVE SET" label with background for visibility
    const labelBg = this.add.graphics();
    labelBg.fillStyle(0x000000, 0.5);
    labelBg.fillRoundedRect(this.hotSetBounds.centerX - 40, this.hotSetBounds.y + 5, 80, 20, 4);

    this.add.text(this.hotSetBounds.centerX, this.hotSetBounds.y + 15, 'LIVE SET', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#E63946',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Camera on tripod (main)
    this.add.image(this.hotSetBounds.x + 40, this.hotSetBounds.y + 50, 'camera');

    // Add more film equipment inside the set
    this.addFilmProps();
  }

  /**
   * Add film props/equipment inside the hot set for visual interest
   * Randomly selects 4-5 props from available options
   */
  addFilmProps() {
    // Clear existing props if any
    if (this.propsGraphics) {
      this.propsGraphics.destroy();
    }

    this.propsGraphics = this.add.graphics();
    const g = this.propsGraphics;
    const setX = this.hotSetBounds.x;
    const setY = this.hotSetBounds.y;

    // All available props as draw functions
    const allProps = [
      // Light stand (left side)
      () => {
        g.fillStyle(0x333333);
        g.fillRect(setX + 10, setY + 80, 6, 50);
        g.fillStyle(0xFFFFCC);
        g.fillRect(setX + 2, setY + 65, 22, 18);
        g.fillStyle(0xFFFF99);
        g.fillRect(setX + 5, setY + 68, 16, 12);
      },
      // Boom mic (top right)
      () => {
        g.fillStyle(0x555555);
        g.fillRect(setX + 150, setY + 30, 40, 4);
        g.fillStyle(0x888888);
        g.fillRect(setX + 180, setY + 26, 16, 12);
      },
      // C-stand with flag (bottom right)
      () => {
        g.fillStyle(0x444444);
        g.fillRect(setX + 160, setY + 90, 4, 40);
        g.fillStyle(0x222222);
        g.fillRect(setX + 155, setY + 85, 30, 20);
      },
      // Apple box (center)
      () => {
        g.fillStyle(0x8B4513);
        g.fillRect(setX + 85, setY + 100, 30, 18);
        g.fillStyle(0xA0522D);
        g.fillRect(setX + 87, setY + 102, 26, 3);
      },
      // Slate/clapperboard (on ground)
      () => {
        g.fillStyle(0x1A1A1A);
        g.fillRect(setX + 120, setY + 110, 25, 20);
        g.fillStyle(0xFFFFFF);
        g.fillRect(setX + 122, setY + 118, 21, 10);
        g.fillStyle(0x1A1A1A);
        for (let i = 0; i < 4; i++) {
          g.fillRect(setX + 122 + i * 6, setY + 112, 3, 6);
        }
      },
      // Monitor on stand (right edge)
      () => {
        g.fillStyle(0x333333);
        g.fillRect(setX + 175, setY + 55, 4, 35);
        g.fillStyle(0x222222);
        g.fillRect(setX + 165, setY + 45, 24, 16);
        g.fillStyle(0x4444FF);
        g.fillRect(setX + 167, setY + 47, 20, 12);
      },
      // Dolly track (bottom)
      () => {
        g.fillStyle(0x666666);
        g.fillRect(setX + 40, setY + 125, 80, 6);
        g.fillStyle(0x888888);
        g.fillRect(setX + 45, setY + 127, 8, 2);
        g.fillRect(setX + 105, setY + 127, 8, 2);
      },
      // Sandbag (left)
      () => {
        g.fillStyle(0x5C4033);
        g.fillRect(setX + 15, setY + 115, 20, 12);
        g.fillStyle(0x4A3728);
        g.fillRect(setX + 17, setY + 117, 16, 3);
      },
      // Diffusion frame (top left)
      () => {
        g.fillStyle(0x444444);
        g.fillRect(setX + 50, setY + 25, 3, 40);
        g.fillStyle(0xFFFFFF, 0.4);
        g.fillRect(setX + 53, setY + 28, 35, 34);
        g.lineStyle(1, 0x444444);
        g.strokeRect(setX + 53, setY + 28, 35, 34);
      },
      // Director's chair (right)
      () => {
        g.fillStyle(0x8B0000);
        g.fillRect(setX + 170, setY + 110, 25, 4);
        g.fillStyle(0x333333);
        g.fillRect(setX + 172, setY + 114, 3, 16);
        g.fillRect(setX + 190, setY + 114, 3, 16);
      },
    ];

    // Shuffle and pick 4-5 props
    const shuffled = allProps.sort(() => Math.random() - 0.5);
    const numProps = 4 + Math.floor(Math.random() * 2); // 4 or 5
    for (let i = 0; i < numProps; i++) {
      shuffled[i]();
    }
  }

  /**
   * Create key locations (coffee van, toilet, director, AD)
   * Adjusted for vertical layout
   */
  createLocations() {
    // Coffee van (bottom area)
    this.coffeeVan = this.add.image(this.gameWidth / 2, this.gameHeight - 50, 'coffee-van');
    this.coffeeVanZone = new Phaser.Geom.Rectangle(
      this.gameWidth / 2 - 60, this.gameHeight - 90, 120, 80
    );

    // Make coffee van interactive
    this.coffeeVan.setInteractive();
    this.coffeeVan.on('pointerdown', () => this.onCoffeeVanClick());

    // Toilet (right side, middle)
    this.toilet = this.add.image(this.gameWidth - 35, 280, 'toilet');
    this.toiletZone = new Phaser.Geom.Rectangle(
      this.gameWidth - 55, 255, 45, 55
    );

    // "WC" label for clarity
    this.add.text(this.gameWidth - 35, 320, 'WC', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#666666',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Director (bottom left, near coffee van for easy delivery)
    this.director = this.add.image(60, this.gameHeight - 120, 'director');
    this.directorZone = new Phaser.Geom.Rectangle(44, this.gameHeight - 136, 32, 32);

    // 1st AD (top right)
    this.firstAD = this.add.image(this.gameWidth - 60, 130, 'first-ad');
    this.firstADZone = new Phaser.Geom.Rectangle(this.gameWidth - 76, 114, 32, 32);

    // Speech bubbles (hidden initially)
    // Director bubble clearly above character head, AD bubble to the left
    this.directorBubble = this.createSpeechBubble(60, this.gameHeight - 175, 'down');
    this.adBubble = this.createSpeechBubble(this.gameWidth - 130, 100, 'right');

    // Bin for discarding wrong coffee orders (bottom right, near coffee van)
    this.bin = this.add.image(this.gameWidth - 40, this.gameHeight - 60, 'bin');
    this.bin.setInteractive();
    this.bin.on('pointerdown', () => this.onBinClick());

    // Bin label
    this.add.text(this.gameWidth - 40, this.gameHeight - 35, 'BIN', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#666666',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  /**
   * Create a speech bubble container
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} pointerDir - Direction of pointer: 'down', 'right', or 'none'
   */
  createSpeechBubble(x, y, pointerDir = 'down') {
    const container = this.add.container(x, y);

    // Background - taller to fit text and icon
    const bg = this.add.graphics();
    bg.fillStyle(0xFFFFFF);
    bg.fillRoundedRect(-60, -28, 120, 56, 8);

    // Triangle pointer
    if (pointerDir === 'right') {
      // Points to the right (for AD) - pointer on right side pointing right
      bg.fillTriangle(60, -5, 60, 5, 75, 0);
    } else if (pointerDir === 'down') {
      // Points down (for Director) - pointer on bottom pointing down
      bg.fillTriangle(-5, 28, 5, 28, 0, 43);
    }
    container.add(bg);

    // Text - BIGGER and BOLDER
    const text = this.add.text(0, -12, '', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#1A1A1A',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);
    container.add(text);

    // Icon placeholder - below text
    const icon = this.add.image(0, 10, 'cup-flat-white');
    icon.setScale(0.5);
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
    this.player = this.physics.add.image(this.gameWidth / 2, this.gameHeight - 150, 'player-idle');
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
   * Create HUD elements - adjusted for vertical layout
   */
  createHUD() {
    const hudY = 8;

    // Dark background for entire HUD area
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x2D3142);
    hudBg.fillRect(0, 0, this.gameWidth, 68);

    // Score (top left)
    this.scoreText = this.add.text(10, hudY, 'SCORE: 0', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
    });

    // Level/Day (below score)
    this.levelText = this.add.text(10, hudY + 18, 'DAY 1', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
    });

    // Tasks progress
    this.tasksText = this.add.text(10, hudY + 32, '', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#AAAAAA',
    });
    this.updateTasksText();

    // Energy bar (top right)
    this.add.text(this.gameWidth - 95, hudY, 'ENERGY', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#4CAF50',
    });
    this.caffeineBar = this.createMeterBar(this.gameWidth - 95, hudY + 14, 85, 12, 0x4CAF50);

    // Coffee break meter (below energy)
    this.add.text(this.gameWidth - 95, hudY + 30, 'BREAK', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#8B4513',
    });
    this.coffeeBreakBar = this.createMeterBar(this.gameWidth - 95, hudY + 44, 85, 12, 0x8B4513);

    // Missed coffees indicator (coffee cups that turn red)
    this.missedIndicators = [];
    for (let i = 0; i < 3; i++) {
      const cup = this.add.graphics();
      cup.fillStyle(0x4CAF50);
      cup.fillRect(this.gameWidth / 2 - 30 + i * 22, hudY + 2, 16, 20);
      cup.fillStyle(0x8B4513);
      cup.fillRect(this.gameWidth / 2 - 28 + i * 22, hudY + 5, 12, 14);
      this.missedIndicators.push(cup);
    }
  }

  /**
   * Update missed coffee indicators
   */
  updateMissedIndicators() {
    for (let i = 0; i < 3; i++) {
      this.missedIndicators[i].clear();
      if (i < this.missedCoffees) {
        // Red - missed
        this.missedIndicators[i].fillStyle(0xE63946);
        this.missedIndicators[i].fillRect(this.gameWidth / 2 - 30 + i * 22, 10, 16, 20);
        this.missedIndicators[i].lineStyle(2, 0xAA0000);
        this.missedIndicators[i].strokeRect(this.gameWidth / 2 - 30 + i * 22, 10, 16, 20);
      } else {
        // Green - ok
        this.missedIndicators[i].fillStyle(0x4CAF50);
        this.missedIndicators[i].fillRect(this.gameWidth / 2 - 30 + i * 22, 10, 16, 20);
        this.missedIndicators[i].fillStyle(0x8B4513);
        this.missedIndicators[i].fillRect(this.gameWidth / 2 - 28 + i * 22, 13, 12, 14);
      }
    }
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
    // Click/tap to move - but not when interacting with UI
    this.input.on('pointerdown', (pointer) => {
      if (this.isTakingBreak || this.isGameOver) return;
      if (this.blockPlayerMovement) return;

      // Don't move if pointer is on an interactive game object
      const hitObjects = this.input.hitTestPointer(pointer);
      if (hitObjects.length > 0) {
        // Check if any hit object is interactive (crew, coffee van, bin, etc.)
        const hasInteractive = hitObjects.some(obj => obj.input && obj.input.enabled);
        if (hasInteractive) return;
      }

      // Don't move if drawing actor path
      if (this.isDrawingPath) return;

      // Don't move if drink menu is open
      if (this.drinkMenu) return;

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

    // Show bubble with order - text AND icon (icon below text)
    bubble.text.setText(COFFEE_NAMES[orderType]);
    bubble.text.setPosition(0, -12);  // Move text up
    bubble.icon.setTexture(`cup-${orderType}`);
    bubble.icon.setScale(0.5);
    bubble.icon.setPosition(0, 10);  // Position icon below text
    bubble.icon.setVisible(true);
    bubble.setVisible(true);

    // Store which person ordered
    this.orderSource = isDirector ? 'director' : 'ad';

    // Play shout sound
    this.playSound('shout');

    // Order timeout - MISSED COFFEE (counts towards game over)
    this.orderTimeout = this.time.delayedCall(this.levelConfig.orderTimeout, () => {
      if (this.hasOrder && this.currentOrder === orderType) {
        this.missedCoffees++;
        this.updateMissedIndicators();
        this.showFloatingText(this.player.x, this.player.y - 20, 'MISSED ORDER!', '#E63946');
        this.hasOrder = false;
        this.currentOrder = null;
        bubble.setVisible(false);
        // Reset character
        if (isDirector) {
          this.director.setTexture('director');
        } else {
          this.firstAD.setTexture('first-ad');
        }

        // Check for game over (3 missed coffees)
        if (this.missedCoffees >= 3) {
          this.gameOver('missed');
        } else {
          // Schedule next order
          this.scheduleNextOrder();
        }
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

    if (dist > 100) return; // Too far

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
   * Handle clicking on the bin to discard coffee
   */
  onBinClick() {
    if (this.isGameOver || this.isTakingBreak) return;

    // Check if carrying coffee
    if (!this.isCarryingCoffee) return;

    // Check if player is close enough
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.bin.x, this.bin.y
    );

    if (dist > 80) return; // Too far

    // Discard the coffee
    this.isCarryingCoffee = false;
    this.carriedCoffeeType = null;
    this.player.setTexture('player-idle');

    this.showFloatingText(this.bin.x, this.bin.y - 30, 'BINNED!', '#666666');
    this.playSound('fail');
  }

  /**
   * Show drink selection menu - larger cups with text labels
   */
  showDrinkMenu() {
    // Create menu container
    const menuX = this.gameWidth / 2;
    const menuY = this.gameHeight - 200;

    this.drinkMenu = this.add.container(menuX, menuY);
    this.drinkMenu.setDepth(20);

    // Background - taller to fit labels
    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 0.95);
    bg.fillRoundedRect(-170, -55, 340, 130, 10);
    bg.lineStyle(3, 0x4ECDC4);
    bg.strokeRoundedRect(-170, -55, 340, 130, 10);
    this.drinkMenu.add(bg);

    // Title
    const title = this.add.text(0, -42, 'CHOOSE THE DRINK', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#4ECDC4',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.drinkMenu.add(title);

    // Short labels for drinks (consistent single-line format)
    const drinkLabels = {
      'flat-white': 'FLAT WHITE',
      'oat-latte': 'OAT LATTE',
      'black': 'BLACK',
      'tea': 'TEA',
    };

    // Drink options - larger spacing for bigger cups
    const options = COFFEE_TYPES;
    const spacing = 80;
    const startX = -120;

    options.forEach((type, i) => {
      const cupX = startX + i * spacing;

      const cup = this.add.image(cupX, 5, `cup-${type}`);
      // Add to container FIRST, then set interactive for proper coordinate handling
      this.drinkMenu.add(cup);

      // Set interactive with explicit larger hit area (40x50 pixels)
      cup.setInteractive(
        new Phaser.Geom.Rectangle(-20, -25, 40, 50),
        Phaser.Geom.Rectangle.Contains,
        { useHandCursor: true }
      );

      cup.on('pointerover', () => cup.setScale(1.15));
      cup.on('pointerout', () => cup.setScale(1));
      cup.on('pointerdown', () => this.selectDrink(type));

      // Label under cup (smaller font for longer names)
      const label = this.add.text(cupX, 48, drinkLabels[type], {
        fontSize: '9px',
        fontFamily: 'monospace',
        color: '#FFFFFF',
        align: 'center',
      }).setOrigin(0.5);
      this.drinkMenu.add(label);
    });

    // Close menu on click outside after a delay
    this.time.delayedCall(100, () => {
      this.drinkMenuCloseHandler = (pointer) => {
        if (!this.drinkMenu) {
          this.input.off('pointerdown', this.drinkMenuCloseHandler);
          this.drinkMenuCloseHandler = null;
          return;
        }

        // Check if click is inside menu area - if so, let cup handlers deal with it
        const menuX = this.drinkMenu.x;
        const menuY = this.drinkMenu.y;
        const inMenu = pointer.x >= menuX - 170 && pointer.x <= menuX + 170 &&
                       pointer.y >= menuY - 55 && pointer.y <= menuY + 75;

        if (!inMenu) {
          // Clicked outside menu - close it
          this.drinkMenu.destroy();
          this.drinkMenu = null;
          this.input.off('pointerdown', this.drinkMenuCloseHandler);
          this.drinkMenuCloseHandler = null;
        }
      };
      this.input.on('pointerdown', this.drinkMenuCloseHandler);
    });
  }

  /**
   * Select a drink from the menu
   */
  selectDrink(type) {
    // Clean up menu and close handler
    if (this.drinkMenuCloseHandler) {
      this.input.off('pointerdown', this.drinkMenuCloseHandler);
      this.drinkMenuCloseHandler = null;
    }
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
   * Spawn a crew member walking from TOP to BOTTOM toward the set
   */
  spawnCrew() {
    if (this.isGameOver) return;
    if (this.crewMembers.length >= this.levelConfig.maxCrew) return;

    // Show tutorial on first crew spawn
    if (!this.shownCrewTutorial) {
      this.showCrewTutorial();
      this.shownCrewTutorial = true;
    }

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

    // Spawn from TOP of screen, walking DOWN toward the live set
    const startY = 50; // Just below HUD
    const x = this.hotSetBounds.x + 20 + Math.random() * (this.hotSetBounds.width - 40);

    const crew = this.physics.add.image(x, startY, type);
    crew.setDepth(5);
    crew.crewType = type;
    crew.isEasterEgg = isEasterEgg;
    crew.isGravedigger = isGravedigger;
    crew.stopped = false;
    crew.enteredSet = false;

    // Make interactive
    crew.setInteractive();
    crew.on('pointerdown', () => this.onCrewClick(crew));

    // Target is the top edge of the live set, then through to bottom
    const setTopY = this.hotSetBounds.y;
    const endY = this.hotSetBounds.bottom + 50;

    // Movement timing - more time to catch them
    const durationToSet = (Math.abs(setTopY - startY) / this.levelConfig.crewSpeed) * 150;
    const durationAcross = (Math.abs(endY - setTopY) / this.levelConfig.crewSpeed) * 100;

    // First tween - walk to set edge
    const toSetTween = this.tweens.add({
      targets: crew,
      y: setTopY,
      duration: durationToSet,
      onComplete: () => {
        if (crew.stopped) return;
        // Mark as entered set - show "IN THE SHOT!" immediately
        crew.enteredSet = true;
        if (!crew.isGravedigger) {
          this.showFloatingText(crew.x, crew.y - 25, 'IN THE SHOT!', '#E63946');
          this.playSound('fail');
        }
        // Continue through set (can still tap them for reduced points)
        this.tweens.add({
          targets: crew,
          y: endY,
          duration: durationAcross,
          onComplete: () => this.onCrewCrossed(crew),
        });
      },
    });

    crew.toSetTween = toSetTween;
    this.crewMembers.push(crew);
  }

  /**
   * Show crew tutorial message
   */
  showCrewTutorial() {
    const tutorialBg = this.add.graphics();
    tutorialBg.fillStyle(0x000000, 0.85);
    tutorialBg.fillRoundedRect(this.gameWidth / 2 - 150, 380, 300, 75, 10);
    tutorialBg.setDepth(50);

    const tutorialText = this.add.text(this.gameWidth / 2, 398, 'CREW INCOMING!', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#E63946',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51);

    const tutorialText2 = this.add.text(this.gameWidth / 2, 428, 'TAP them BEFORE the live set!', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#FAF7F2',
      align: 'center',
    }).setOrigin(0.5).setDepth(51);

    // Flash the tutorial
    this.tweens.add({
      targets: [tutorialBg, tutorialText, tutorialText2],
      alpha: 0,
      delay: 3000,
      duration: 500,
      onComplete: () => {
        tutorialBg.destroy();
        tutorialText.destroy();
        tutorialText2.destroy();
      },
    });
  }

  /**
   * Handle clicking on a crew member
   */
  onCrewClick(crew) {
    if (crew.stopped || this.isGameOver) return;

    // Gravedigger should NOT be stopped
    if (crew.isGravedigger) {
      // Oops! They look offended
      this.showFloatingText(crew.x, crew.y - 25, "I'm in the scene!", '#E63946');
      this.playSound('fail');
      return;
    }

    // Stop the crew member
    crew.stopped = true;
    this.tweens.killTweensOf(crew);

    // Visual feedback
    crew.setAlpha(0.5);

    // Score depends on whether they entered the set
    if (crew.enteredSet) {
      // Less points - they already got onto the set
      if (crew.isEasterEgg) {
        this.addScore(25);
        this.showFloatingText(crew.x, crew.y - 25, '+25 (late!)', '#FF9800');
      } else {
        this.addScore(10);
        this.showFloatingText(crew.x, crew.y - 25, '+10 (late!)', '#FF9800');
      }
    } else {
      // Full points - stopped before set
      if (crew.isEasterEgg) {
        this.addScore(50);
        this.showFloatingText(crew.x, crew.y - 25, '+50 BONUS!', '#4ECDC4');
      } else {
        this.addScore(25);
        this.showFloatingText(crew.x, crew.y - 25, '+25', '#4ECDC4');
      }
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
   * Handle crew member crossing the set completely
   */
  onCrewCrossed(crew) {
    if (crew.stopped) return;

    // Gravedigger is meant to be there - bonus!
    if (crew.isGravedigger) {
      this.addScore(30);
      this.showFloatingText(crew.x - 30, crew.y - 25, '+30 NICE!', '#4ECDC4');
    }
    // Note: "IN THE SHOT!" message already shown when they entered

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
      { delay: 500, text: 'Tap to move!', y: 500 },
      { delay: 2500, text: 'Tap van, pick the drink!', y: 500 },
      { delay: 5000, text: 'Deliver to whoever ordered!', y: 500 },
    ];

    texts.forEach(({ delay, text, y }) => {
      this.time.delayedCall(delay, () => {
        if (this.isGameOver) return;
        const t = this.add.text(this.gameWidth / 2, y, text, {
          fontSize: '14px',
          fontFamily: 'monospace',
          color: '#4ECDC4',
          backgroundColor: '#2D3142CC',
          padding: { x: 12, y: 6 },
          align: 'center',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
          targets: t,
          alpha: 0,
          delay: 2000,
          duration: 500,
          onComplete: () => t.destroy(),
        });
      });
    });
  }

  /**
   * Actor escort mechanics
   */
  spawnActor() {
    if (this.activeActor || this.isGameOver) return;
    if (!this.levelConfig.actorEnabled) return;

    // Random spawn location - different places around the set
    const spawnLocations = [
      { x: 30, y: this.hotSetBounds.centerY },           // Left side
      { x: this.gameWidth - 30, y: this.hotSetBounds.y - 30 },  // Top right
      { x: 30, y: this.hotSetBounds.bottom + 40 },       // Bottom left
      { x: this.gameWidth / 2, y: this.hotSetBounds.bottom + 60 }, // Bottom center
    ];
    const spawn = spawnLocations[Math.floor(Math.random() * spawnLocations.length)];

    // Give actor a random name
    const actorName = ACTOR_NAMES[Math.floor(Math.random() * ACTOR_NAMES.length)];

    this.activeActor = this.physics.add.image(spawn.x, spawn.y, 'actor-desperate');
    this.activeActor.setDepth(6);
    this.activeActor.actorName = actorName;

    // Create name label above actor (more visible than speech bubble)
    this.actorNameLabel = this.add.text(spawn.x, spawn.y - 28, actorName, {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#9C27B0',
      fontStyle: 'bold',
      backgroundColor: '#FFFFFFDD',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(7);

    // Toilet icon indicator (pulsing)
    this.actorIndicator = this.add.text(spawn.x, spawn.y - 45, '🚽', {
      fontSize: '16px',
    }).setOrigin(0.5).setDepth(7);

    this.tweens.add({
      targets: this.actorIndicator,
      y: spawn.y - 50,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    // Show tutorial for actor
    this.showActorTutorial();

    // Make actor interactive for path drawing
    this.activeActor.setInteractive();
    this.isDrawingPath = false;
    this.escortPath = [];

    // Path drawing
    this.input.on('pointermove', this.onPathDraw, this);

    // Timeout for actor
    this.actorTimeout = this.time.delayedCall(12000, () => {
      if (this.activeActor) {
        this.showFloatingText(this.activeActor.x, this.activeActor.y - 25, `${actorName} EMERGENCY!`, '#E63946');
        this.clearActor();
      }
    });
  }

  /**
   * Show actor tutorial
   */
  showActorTutorial() {
    // Only show tutorial for first two actor spawns
    if (this.actorTutorialCount >= 2) return;
    this.actorTutorialCount++;

    const t = this.add.text(this.gameWidth / 2, 500, 'DRAG from actor to 🚽\nAvoid the live set!', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#9C27B0',
      backgroundColor: '#2D3142DD',
      padding: { x: 12, y: 6 },
      align: 'center',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: t,
      alpha: 0,
      delay: 3000,
      duration: 500,
      onComplete: () => t.destroy(),
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

      // Draw path as footsteps
      this.pathGraphics.clear();
      this.drawFootsteps();

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
      // Released without reaching toilet - check path validity
      this.checkPathValidity();
    }
  }

  /**
   * Draw footsteps along the escort path
   */
  drawFootsteps() {
    if (this.escortPath.length < 2) return;

    const stepSpacing = 18; // Distance between footsteps
    let distanceAccum = 0;
    let stepCount = 0;

    for (let i = 1; i < this.escortPath.length; i++) {
      const prev = this.escortPath[i - 1];
      const curr = this.escortPath[i];
      const segmentDist = Phaser.Math.Distance.Between(prev.x, prev.y, curr.x, curr.y);

      if (segmentDist < 0.1) continue; // Skip if points are too close

      distanceAccum += segmentDist;

      // Draw a footstep every stepSpacing pixels
      while (distanceAccum >= stepSpacing) {
        distanceAccum -= stepSpacing;

        // Calculate position along the path
        const ratio = Math.max(0, Math.min(1, 1 - (distanceAccum / segmentDist)));
        const x = prev.x + (curr.x - prev.x) * ratio;
        const y = prev.y + (curr.y - prev.y) * ratio;

        // Calculate angle for footstep offset
        const angle = Phaser.Math.Angle.Between(prev.x, prev.y, curr.x, curr.y);

        // Alternate left/right foot offset perpendicular to path
        const isLeft = stepCount % 2 === 0;
        const perpAngle = angle + Math.PI / 2;
        const offsetX = Math.cos(perpAngle) * (isLeft ? 5 : -5);
        const offsetY = Math.sin(perpAngle) * (isLeft ? 5 : -5);

        // Draw footprint as small filled circle
        this.pathGraphics.fillStyle(0x4ECDC4, 0.8);
        this.pathGraphics.fillCircle(x + offsetX, y + offsetY, 4);

        // Add a smaller toe circle
        const toeX = x + offsetX + Math.cos(angle) * 4;
        const toeY = y + offsetY + Math.sin(angle) * 4;
        this.pathGraphics.fillCircle(toeX, toeY, 2);

        stepCount++;
      }
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
      this.showFloatingText(this.activeActor.x, this.activeActor.y - 25, 'PATH THROUGH SET!', '#E63946');
      this.playSound('fail');
    }

    this.clearActor();
  }

  /**
   * Successfully escort actor to toilet
   */
  completeActorEscort() {
    // Require a minimum path length (must actually draw, not just click)
    if (this.escortPath.length < 10) {
      this.showFloatingText(this.activeActor.x, this.activeActor.y - 25, 'DRAG the path!', '#FF9800');
      // Clear the attempt but keep the actor
      if (this.pathGraphics) {
        this.pathGraphics.clear();
      }
      this.isDrawingPath = false;
      this.escortPath = [];
      return;
    }

    // Check if path went through hot set
    let wentThroughHotSet = false;
    for (const point of this.escortPath) {
      if (this.hotSetBounds.contains(point.x, point.y)) {
        wentThroughHotSet = true;
        break;
      }
    }

    if (wentThroughHotSet) {
      // Reduced points for bad path
      this.addScore(25);
      this.showFloatingText(this.toilet.x, this.toilet.y - 25, '+25 (bad path)', '#FF9800');
    } else {
      // Full points for avoiding the set
      this.addScore(75);
      this.coffeeBreakMeter = Math.min(100, this.coffeeBreakMeter + 20);
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
    if (this.actorNameLabel) {
      this.actorNameLabel.destroy();
      this.actorNameLabel = null;
    }
    if (this.actorIndicator) {
      this.actorIndicator.destroy();
      this.actorIndicator = null;
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
    const levelText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 40, `DAY ${this.level}!`, {
      fontSize: '32px',
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
      phraseText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, newFeature, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#FAF7F2',
      }).setOrigin(0.5).setDepth(100);
    }

    // Show director phrase
    const phrase = DIRECTOR_PHRASES[Math.floor(Math.random() * DIRECTOR_PHRASES.length)];
    const directorText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 30, `"${phrase}"`, {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#8B4513',
      fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(100);

    this.playSound('levelComplete');

    // Bonus for completing day
    this.addScore(this.level * 50);

    this.time.delayedCall(2500, () => {
      levelText.destroy();
      if (phraseText) phraseText.destroy();
      directorText.destroy();

      // Update UI
      this.levelText.setText(`DAY ${this.level}`);
      this.updateTasksText();

      // Refresh set props for new day
      this.addFilmProps();

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

    // Keep player out of hot set - smooth collision
    const padding = 16; // Player half-width
    const bounds = this.hotSetBounds;

    // Check if player would enter the set and block movement
    const wouldEnterX = this.player.x > bounds.x - padding && this.player.x < bounds.right + padding;
    const wouldEnterY = this.player.y > bounds.y - padding && this.player.y < bounds.bottom + padding;

    if (wouldEnterX && wouldEnterY) {
      // Determine which edge is closest and push player to that edge
      const distToTop = Math.abs(this.player.y - (bounds.y - padding));
      const distToBottom = Math.abs(this.player.y - (bounds.bottom + padding));
      const distToLeft = Math.abs(this.player.x - (bounds.x - padding));
      const distToRight = Math.abs(this.player.x - (bounds.right + padding));

      const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);

      if (minDist === distToTop) {
        this.player.y = bounds.y - padding;
        if (this.player.body.velocity.y > 0) this.player.body.velocity.y = 0;
      } else if (minDist === distToBottom) {
        this.player.y = bounds.bottom + padding;
        if (this.player.body.velocity.y < 0) this.player.body.velocity.y = 0;
      } else if (minDist === distToLeft) {
        this.player.x = bounds.x - padding;
        if (this.player.body.velocity.x > 0) this.player.body.velocity.x = 0;
      } else {
        this.player.x = bounds.right + padding;
        if (this.player.body.velocity.x < 0) this.player.body.velocity.x = 0;
      }
    }

    // Clamp to play area (below HUD)
    this.player.y = Phaser.Math.Clamp(this.player.y, 86, this.gameHeight - 30);
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

      // Refill one missed coffee indicator if any were lost
      if (this.missedCoffees > 0) {
        this.missedCoffees--;
        this.updateMissedIndicators();
        this.showFloatingText(this.player.x, this.player.y - 25, '+50 +☕', '#4ECDC4');
      } else {
        this.showFloatingText(this.player.x, this.player.y - 25, '+50', '#4ECDC4');
      }

      this.playSound('success');
      this.completeTask();
    } else {
      // Wrong drink! Counts as missed
      this.missedCoffees++;
      this.updateMissedIndicators();
      this.showFloatingText(this.player.x, this.player.y - 25, 'WRONG DRINK!', '#E63946');
      this.playSound('fail');

      // Check for game over
      if (this.missedCoffees >= 3) {
        this.gameOver('missed');
        return;
      }
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
