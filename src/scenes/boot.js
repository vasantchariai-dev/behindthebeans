/**
 * Boot Scene
 * Generates pixel art sprites - modern retro style (32-bit aesthetic)
 * Larger, more detailed sprites with better proportions
 */

import Phaser from 'phaser';

// Colour palette - expanded for more detail
const C = {
  // Base colours
  background: 0x2D3142,
  floor: 0xFAF7F2,
  floorDark: 0xE8E0D5,

  // Character colours
  skin: 0xFFDBB4,
  skinDark: 0xE5C29F,
  skinLight: 0xFFE8CC,

  // Hair
  hairBlack: 0x1A1A1A,
  hairBrown: 0x5C4033,
  hairLight: 0x8B7355,

  // Clothing
  teal: 0x4ECDC4,
  tealDark: 0x3BA99E,
  tealLight: 0x7EDDD6,

  grey: 0xE8E8E8,
  greyDark: 0xCCCCCC,
  greyLight: 0xF5F5F5,

  black: 0x1A1A1A,
  blackLight: 0x333333,

  yellow: 0xFFD700,
  yellowDark: 0xCCAA00,
  yellowLight: 0xFFE44D,

  blue: 0x2196F3,
  blueDark: 0x1976D2,
  blueLight: 0x64B5F6,

  green: 0x4CAF50,
  greenDark: 0x388E3C,
  greenLight: 0x81C784,

  purple: 0x9C27B0,
  purpleDark: 0x7B1FA2,
  purpleLight: 0xBA68C8,

  // UI colours
  red: 0xE63946,
  redDark: 0xC62828,
  redLight: 0xFF6B6B,

  orange: 0xEF8354,
  orangeDark: 0xD56A3E,
  orangeLight: 0xFFAB91,

  coffee: 0x8B4513,
  coffeeDark: 0x5D2E0C,
  coffeeLight: 0xA0522D,

  white: 0xFFFFFF,
  cream: 0xFFF8E7,
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 100, height / 2 - 10, 200, 20);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xEF8354, 1);
      progressBar.fillRect(width / 2 - 96, height / 2 - 6, 192 * value, 12);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
    });

    this.generateSprites();
  }

  create() {
    this.scene.start('MenuScene');
  }

  generateSprites() {
    this.generatePlayerSprites();
    this.generateDirectorSprites();
    this.generateADSprites();
    this.generateCrewSprites();
    this.generateActorSprites();
    this.generateCoffeeVan();
    this.generateToilet();
    this.generateCoffeeCups();
    this.generateCamera();
    this.generateUISprites();
    this.generateEasterEggSprites();
  }

  /**
   * Draw a character body (reusable base)
   */
  drawCharacterBase(g, bodyColour, bodyDark, bodyLight, legColour) {
    // Legs
    g.fillStyle(legColour);
    g.fillRect(10, 22, 5, 9);
    g.fillRect(17, 22, 5, 9);

    // Feet
    g.fillStyle(C.black);
    g.fillRect(9, 29, 6, 3);
    g.fillRect(17, 29, 6, 3);

    // Body
    g.fillStyle(bodyColour);
    g.fillRect(8, 12, 16, 12);

    // Body shading
    g.fillStyle(bodyDark);
    g.fillRect(8, 12, 2, 12);
    g.fillRect(8, 22, 16, 2);

    g.fillStyle(bodyLight);
    g.fillRect(22, 12, 2, 10);
  }

  /**
   * Draw a head with hair
   */
  drawHead(g, hairColour, hairDark) {
    // Head
    g.fillStyle(C.skin);
    g.fillRect(9, 3, 14, 12);

    // Face shading
    g.fillStyle(C.skinDark);
    g.fillRect(9, 3, 2, 12);
    g.fillRect(9, 13, 14, 2);

    g.fillStyle(C.skinLight);
    g.fillRect(21, 3, 2, 10);

    // Hair
    g.fillStyle(hairColour);
    g.fillRect(8, 1, 16, 5);
    g.fillRect(8, 1, 3, 8);

    g.fillStyle(hairDark);
    g.fillRect(8, 1, 16, 2);

    // Eyes
    g.fillStyle(C.black);
    g.fillRect(12, 7, 2, 3);
    g.fillRect(18, 7, 2, 3);

    // Eye highlights
    g.fillStyle(C.white);
    g.fillRect(12, 7, 1, 1);
    g.fillRect(18, 7, 1, 1);
  }

  /**
   * Player character sprites (AD runner)
   */
  generatePlayerSprites() {
    let g = this.make.graphics({ x: 0, y: 0, add: false });

    // Idle
    this.drawCharacterBase(g, C.teal, C.tealDark, C.tealLight, C.hairBrown);
    this.drawHead(g, C.hairBlack, C.blackLight);
    // Friendly smile
    g.fillStyle(C.skinDark);
    g.fillRect(14, 11, 4, 1);
    g.generateTexture('player-idle', 32, 32);
    g.clear();

    // Running
    this.drawHead(g, C.hairBlack, C.blackLight);
    // Body
    g.fillStyle(C.teal);
    g.fillRect(8, 12, 16, 12);
    g.fillStyle(C.tealDark);
    g.fillRect(8, 12, 2, 12);
    // Running legs - spread apart
    g.fillStyle(C.hairBrown);
    g.fillRect(6, 22, 5, 9);
    g.fillRect(21, 22, 5, 9);
    g.fillStyle(C.black);
    g.fillRect(5, 29, 6, 3);
    g.fillRect(21, 29, 6, 3);
    g.fillStyle(C.skinDark);
    g.fillRect(14, 11, 4, 1);
    g.generateTexture('player-run', 32, 32);
    g.clear();

    // Carrying coffee
    this.drawCharacterBase(g, C.teal, C.tealDark, C.tealLight, C.hairBrown);
    this.drawHead(g, C.hairBlack, C.blackLight);
    // Extended arm with cup
    g.fillStyle(C.skin);
    g.fillRect(24, 14, 6, 4);
    g.fillStyle(C.white);
    g.fillRect(26, 10, 5, 7);
    g.fillStyle(C.coffee);
    g.fillRect(27, 11, 3, 5);
    // Concentrated expression
    g.fillStyle(C.skinDark);
    g.fillRect(14, 11, 4, 1);
    g.generateTexture('player-coffee', 32, 32);
    g.clear();

    // Drinking
    this.drawCharacterBase(g, C.teal, C.tealDark, C.tealLight, C.hairBrown);
    // Head tilted back slightly
    g.fillStyle(C.skin);
    g.fillRect(9, 2, 14, 12);
    g.fillStyle(C.skinDark);
    g.fillRect(9, 2, 2, 12);
    g.fillStyle(C.hairBlack);
    g.fillRect(8, 0, 16, 5);
    g.fillRect(8, 0, 3, 7);
    // Cup at mouth
    g.fillStyle(C.white);
    g.fillRect(12, 5, 8, 9);
    g.fillStyle(C.coffee);
    g.fillRect(13, 6, 6, 7);
    g.generateTexture('player-drink', 32, 32);
    g.destroy();
  }

  /**
   * Director sprites
   */
  generateDirectorSprites() {
    let g = this.make.graphics({ x: 0, y: 0, add: false });

    // Normal
    this.drawCharacterBase(g, C.black, C.blackLight, C.blackLight, C.black);
    this.drawHead(g, C.hairBrown, C.coffeeDark);
    // Beret
    g.fillStyle(C.black);
    g.fillRect(7, 0, 18, 4);
    g.fillRect(6, 2, 3, 3);
    // Stern expression
    g.fillStyle(C.skinDark);
    g.fillRect(14, 11, 4, 1);
    // Eyebrows (furrowed)
    g.fillStyle(C.hairBrown);
    g.fillRect(11, 5, 3, 1);
    g.fillRect(18, 5, 3, 1);
    g.generateTexture('director', 32, 32);
    g.clear();

    // Angry
    // Red face
    g.fillStyle(C.redLight);
    g.fillRect(9, 3, 14, 12);
    g.fillStyle(C.red);
    g.fillRect(9, 3, 2, 12);
    g.fillRect(9, 13, 14, 2);
    // Hair
    g.fillStyle(C.hairBrown);
    g.fillRect(8, 1, 16, 5);
    g.fillRect(8, 1, 3, 8);
    // Beret
    g.fillStyle(C.black);
    g.fillRect(7, 0, 18, 4);
    g.fillRect(6, 2, 3, 3);
    // Angry eyes
    g.fillStyle(C.black);
    g.fillRect(12, 7, 2, 3);
    g.fillRect(18, 7, 2, 3);
    // Angry eyebrows
    g.fillStyle(C.hairBrown);
    g.fillRect(10, 5, 4, 2);
    g.fillRect(18, 5, 4, 2);
    // Shouting mouth
    g.fillStyle(C.black);
    g.fillRect(13, 10, 6, 4);
    g.fillStyle(C.red);
    g.fillRect(14, 11, 4, 2);
    // Body
    this.drawCharacterBase(g, C.black, C.blackLight, C.blackLight, C.black);
    g.generateTexture('director-angry', 32, 32);
    g.destroy();
  }

  /**
   * 1st AD sprites
   */
  generateADSprites() {
    let g = this.make.graphics({ x: 0, y: 0, add: false });

    // Normal
    this.drawCharacterBase(g, C.grey, C.greyDark, C.greyLight, C.hairBrown);
    this.drawHead(g, C.hairBlack, C.blackLight);
    // Headset
    g.fillStyle(C.black);
    g.fillRect(6, 5, 3, 6);
    g.fillRect(23, 5, 3, 6);
    g.fillRect(8, 2, 16, 2);
    // Microphone
    g.fillStyle(C.greyDark);
    g.fillRect(5, 9, 3, 4);
    // Clipboard
    g.fillStyle(C.orangeLight);
    g.fillRect(24, 14, 6, 8);
    g.fillStyle(C.white);
    g.fillRect(25, 15, 4, 6);
    g.fillStyle(C.black);
    g.fillRect(26, 16, 2, 1);
    g.fillRect(26, 18, 2, 1);
    g.generateTexture('first-ad', 32, 32);
    g.clear();

    // Shouting
    this.drawCharacterBase(g, C.grey, C.greyDark, C.greyLight, C.hairBrown);
    // Head
    g.fillStyle(C.skin);
    g.fillRect(9, 3, 14, 12);
    g.fillStyle(C.skinDark);
    g.fillRect(9, 3, 2, 12);
    g.fillStyle(C.hairBlack);
    g.fillRect(8, 1, 16, 5);
    g.fillRect(8, 1, 3, 8);
    // Headset
    g.fillStyle(C.black);
    g.fillRect(6, 5, 3, 6);
    g.fillRect(23, 5, 3, 6);
    g.fillRect(8, 2, 16, 2);
    g.fillStyle(C.greyDark);
    g.fillRect(5, 9, 3, 4);
    // Eyes
    g.fillStyle(C.black);
    g.fillRect(12, 7, 2, 3);
    g.fillRect(18, 7, 2, 3);
    // Shouting mouth
    g.fillStyle(C.red);
    g.fillRect(13, 10, 6, 4);
    g.generateTexture('first-ad-shout', 32, 32);
    g.destroy();
  }

  /**
   * Crew member sprites
   */
  generateCrewSprites() {
    let g = this.make.graphics({ x: 0, y: 0, add: false });

    // Rigger (high-vis)
    this.drawCharacterBase(g, C.yellow, C.yellowDark, C.yellowLight, C.hairBrown);
    // Hi-vis stripes
    g.fillStyle(C.greyLight);
    g.fillRect(8, 16, 16, 2);
    g.fillRect(8, 20, 16, 2);
    this.drawHead(g, C.hairBrown, C.coffeeDark);
    // Hard hat
    g.fillStyle(C.yellow);
    g.fillRect(7, 0, 18, 5);
    g.fillStyle(C.yellowDark);
    g.fillRect(7, 4, 18, 2);
    g.generateTexture('rigger', 32, 32);
    g.clear();

    // Spark (electrician)
    this.drawCharacterBase(g, C.blue, C.blueDark, C.blueLight, C.blueDark);
    this.drawHead(g, C.hairBrown, C.coffeeDark);
    // Tool belt
    g.fillStyle(C.coffee);
    g.fillRect(7, 21, 18, 3);
    g.fillStyle(C.yellow);
    g.fillRect(9, 21, 3, 3);
    g.fillRect(20, 21, 3, 3);
    g.generateTexture('spark', 32, 32);
    g.clear();

    // Runner (green shirt)
    this.drawCharacterBase(g, C.green, C.greenDark, C.greenLight, C.hairBrown);
    this.drawHead(g, C.hairBlack, C.blackLight);
    // Walkie-talkie
    g.fillStyle(C.black);
    g.fillRect(2, 14, 4, 8);
    g.fillStyle(C.greyDark);
    g.fillRect(3, 15, 2, 4);
    g.generateTexture('runner-crew', 32, 32);
    g.destroy();
  }

  /**
   * Actor sprites
   */
  generateActorSprites() {
    let g = this.make.graphics({ x: 0, y: 0, add: false });

    // Normal
    this.drawCharacterBase(g, C.purple, C.purpleDark, C.purpleLight, C.black);
    this.drawHead(g, C.hairBrown, C.coffeeDark);
    // Fancy scarf
    g.fillStyle(C.red);
    g.fillRect(10, 12, 12, 3);
    g.fillRect(8, 14, 4, 6);
    g.generateTexture('actor', 32, 32);
    g.clear();

    // Desperate (needs loo)
    // Crossed legs
    g.fillStyle(C.black);
    g.fillRect(11, 22, 5, 7);
    g.fillRect(16, 22, 5, 7);
    g.fillRect(13, 27, 6, 5);
    g.fillStyle(C.black);
    g.fillRect(10, 29, 6, 3);
    g.fillRect(16, 29, 6, 3);
    // Body
    g.fillStyle(C.purple);
    g.fillRect(8, 12, 16, 12);
    g.fillStyle(C.purpleDark);
    g.fillRect(8, 12, 2, 12);
    // Scarf
    g.fillStyle(C.red);
    g.fillRect(10, 12, 12, 3);
    // Worried face
    g.fillStyle(C.skinLight);
    g.fillRect(9, 3, 14, 12);
    g.fillStyle(C.skin);
    g.fillRect(9, 3, 2, 12);
    g.fillStyle(C.hairBrown);
    g.fillRect(8, 1, 16, 5);
    g.fillRect(8, 1, 3, 8);
    // Wide worried eyes
    g.fillStyle(C.white);
    g.fillRect(11, 6, 4, 4);
    g.fillRect(17, 6, 4, 4);
    g.fillStyle(C.black);
    g.fillRect(12, 7, 2, 3);
    g.fillRect(18, 7, 2, 3);
    // Worried mouth
    g.fillStyle(C.skinDark);
    g.fillRect(14, 11, 4, 2);
    // Sweat drops
    g.fillStyle(C.blueLight);
    g.fillRect(6, 5, 2, 4);
    g.fillRect(24, 5, 2, 4);
    g.generateTexture('actor-desperate', 32, 32);
    g.destroy();
  }

  /**
   * Coffee van (larger, more detailed)
   */
  generateCoffeeVan() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Van body
    g.fillStyle(C.orange);
    g.fillRect(4, 16, 88, 44);

    // Van shading
    g.fillStyle(C.orangeDark);
    g.fillRect(4, 16, 4, 44);
    g.fillRect(4, 56, 88, 4);

    g.fillStyle(C.orangeLight);
    g.fillRect(88, 16, 4, 40);

    // Awning
    g.fillStyle(C.coffee);
    g.fillRect(0, 10, 96, 10);
    g.fillStyle(C.coffeeDark);
    g.fillRect(0, 10, 96, 3);
    // Awning stripes
    g.fillStyle(C.orangeLight);
    for (let i = 0; i < 12; i++) {
      g.fillRect(4 + i * 8, 12, 4, 6);
    }

    // Service window
    g.fillStyle(C.cream);
    g.fillRect(12, 22, 72, 30);
    g.fillStyle(C.white);
    g.fillRect(14, 24, 68, 26);

    // Counter
    g.fillStyle(C.greyDark);
    g.fillRect(14, 44, 68, 8);
    g.fillStyle(C.grey);
    g.fillRect(14, 44, 68, 4);

    // Coffee machine
    g.fillStyle(C.black);
    g.fillRect(20, 26, 20, 16);
    g.fillStyle(C.greyDark);
    g.fillRect(22, 28, 16, 12);
    // Buttons
    g.fillStyle(C.red);
    g.fillRect(24, 30, 3, 3);
    g.fillStyle(C.green);
    g.fillRect(29, 30, 3, 3);

    // Cups on counter
    g.fillStyle(C.white);
    g.fillRect(50, 38, 6, 8);
    g.fillRect(60, 38, 6, 8);
    g.fillRect(70, 38, 6, 8);

    // Sign
    g.fillStyle(C.coffee);
    g.fillRect(24, 2, 48, 8);
    g.fillStyle(C.white);
    // "CRAFT" text approximation
    g.fillRect(28, 4, 4, 4);
    g.fillRect(34, 4, 4, 4);
    g.fillRect(40, 4, 4, 4);
    g.fillRect(46, 4, 4, 4);
    g.fillRect(52, 4, 4, 4);
    g.fillRect(58, 4, 4, 4);

    // Wheels
    g.fillStyle(C.black);
    g.fillCircle(20, 62, 8);
    g.fillCircle(76, 62, 8);
    g.fillStyle(C.greyDark);
    g.fillCircle(20, 62, 4);
    g.fillCircle(76, 62, 4);

    g.generateTexture('coffee-van', 96, 70);
    g.destroy();
  }

  /**
   * Toilet (portaloo)
   */
  generateToilet() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Main body
    g.fillStyle(C.blue);
    g.fillRect(4, 4, 32, 44);

    // Shading
    g.fillStyle(C.blueDark);
    g.fillRect(4, 4, 4, 44);
    g.fillRect(4, 44, 32, 4);

    g.fillStyle(C.blueLight);
    g.fillRect(32, 4, 4, 40);

    // Roof
    g.fillStyle(C.greyDark);
    g.fillRect(2, 0, 36, 6);
    g.fillStyle(C.grey);
    g.fillRect(2, 0, 36, 3);

    // Door
    g.fillStyle(C.blueDark);
    g.fillRect(10, 10, 20, 34);

    // Door frame
    g.fillStyle(C.black);
    g.fillRect(8, 8, 24, 2);
    g.fillRect(8, 8, 2, 38);
    g.fillRect(30, 8, 2, 38);

    // Handle
    g.fillStyle(C.greyLight);
    g.fillRect(26, 24, 3, 6);

    // "VACANT" sign
    g.fillStyle(C.green);
    g.fillRect(14, 12, 12, 6);
    g.fillStyle(C.white);
    g.fillRect(15, 13, 10, 4);

    // Vent
    g.fillStyle(C.black);
    g.fillRect(16, 38, 8, 4);

    g.generateTexture('toilet', 40, 52);
    g.destroy();
  }

  /**
   * Coffee cups - large, clear, and distinctive
   * Each drink has unique visual characteristics
   */
  generateCoffeeCups() {
    const cupWidth = 36;
    const cupHeight = 44;

    // === FLAT WHITE ===
    // White cup with creamy latte art heart
    let g = this.make.graphics({ x: 0, y: 0, add: false });

    // Cup body (white)
    g.fillStyle(C.white);
    g.fillRect(4, 8, 28, 32);
    g.fillStyle(C.greyLight);
    g.fillRect(4, 8, 4, 32); // Left shadow
    g.fillRect(4, 36, 28, 4); // Bottom shadow

    // Cup rim
    g.fillStyle(C.greyDark);
    g.fillRect(2, 6, 32, 4);
    g.fillStyle(C.white);
    g.fillRect(4, 6, 28, 2);

    // Handle
    g.fillStyle(C.white);
    g.fillRect(32, 14, 4, 16);
    g.fillRect(30, 12, 6, 4);
    g.fillRect(30, 28, 6, 4);
    g.fillStyle(C.greyLight);
    g.fillRect(32, 18, 2, 8);

    // Coffee surface (light brown/creamy)
    g.fillStyle(0xD4A574);
    g.fillRect(6, 10, 24, 24);

    // Latte art heart
    g.fillStyle(C.white);
    g.fillRect(12, 14, 4, 4);
    g.fillRect(20, 14, 4, 4);
    g.fillRect(10, 16, 8, 4);
    g.fillRect(18, 16, 8, 4);
    g.fillRect(12, 20, 12, 4);
    g.fillRect(14, 24, 8, 4);
    g.fillRect(16, 28, 4, 4);

    g.generateTexture('cup-flat-white', cupWidth, cupHeight);
    g.clear();

    // === OAT LATTE ===
    // Cup with green leaf/oat symbol
    // Cup body
    g.fillStyle(C.white);
    g.fillRect(4, 8, 28, 32);
    g.fillStyle(C.greyLight);
    g.fillRect(4, 8, 4, 32);
    g.fillRect(4, 36, 28, 4);

    // Cup rim
    g.fillStyle(C.greyDark);
    g.fillRect(2, 6, 32, 4);
    g.fillStyle(C.white);
    g.fillRect(4, 6, 28, 2);

    // Handle
    g.fillStyle(C.white);
    g.fillRect(32, 14, 4, 16);
    g.fillRect(30, 12, 6, 4);
    g.fillRect(30, 28, 6, 4);
    g.fillStyle(C.greyLight);
    g.fillRect(32, 18, 2, 8);

    // Coffee surface (oat milk colour - lighter)
    g.fillStyle(0xC9A86C);
    g.fillRect(6, 10, 24, 24);

    // Green leaf/plant symbol for oat
    g.fillStyle(C.green);
    g.fillRect(16, 12, 4, 16);  // Stem
    g.fillRect(12, 14, 4, 4);   // Left leaf
    g.fillRect(20, 14, 4, 4);   // Right leaf
    g.fillRect(10, 18, 4, 4);   // Left leaf 2
    g.fillRect(22, 18, 4, 4);   // Right leaf 2
    g.fillStyle(C.greenDark);
    g.fillRect(16, 12, 4, 2);   // Stem top

    g.generateTexture('cup-oat-latte', cupWidth, cupHeight);
    g.clear();

    // === BLACK COFFEE ===
    // Dark cup contents, no art
    // Cup body
    g.fillStyle(C.white);
    g.fillRect(4, 8, 28, 32);
    g.fillStyle(C.greyLight);
    g.fillRect(4, 8, 4, 32);
    g.fillRect(4, 36, 28, 4);

    // Cup rim
    g.fillStyle(C.greyDark);
    g.fillRect(2, 6, 32, 4);
    g.fillStyle(C.white);
    g.fillRect(4, 6, 28, 2);

    // Handle
    g.fillStyle(C.white);
    g.fillRect(32, 14, 4, 16);
    g.fillRect(30, 12, 6, 4);
    g.fillRect(30, 28, 6, 4);
    g.fillStyle(C.greyLight);
    g.fillRect(32, 18, 2, 8);

    // Coffee surface (dark black)
    g.fillStyle(C.coffeeDark);
    g.fillRect(6, 10, 24, 24);
    g.fillStyle(C.black);
    g.fillRect(8, 12, 20, 20);

    // Steam wisps
    g.fillStyle(C.greyLight);
    g.fillRect(10, 2, 2, 6);
    g.fillRect(18, 0, 2, 8);
    g.fillRect(26, 2, 2, 6);

    g.generateTexture('cup-black', cupWidth, cupHeight);
    g.clear();

    // === TEA ===
    // Amber liquid with tea bag
    // Cup body
    g.fillStyle(C.white);
    g.fillRect(4, 8, 28, 32);
    g.fillStyle(C.greyLight);
    g.fillRect(4, 8, 4, 32);
    g.fillRect(4, 36, 28, 4);

    // Cup rim
    g.fillStyle(C.greyDark);
    g.fillRect(2, 6, 32, 4);
    g.fillStyle(C.white);
    g.fillRect(4, 6, 28, 2);

    // Handle
    g.fillStyle(C.white);
    g.fillRect(32, 14, 4, 16);
    g.fillRect(30, 12, 6, 4);
    g.fillRect(30, 28, 6, 4);
    g.fillStyle(C.greyLight);
    g.fillRect(32, 18, 2, 8);

    // Tea surface (amber)
    g.fillStyle(0xCD853F);
    g.fillRect(6, 10, 24, 24);
    g.fillStyle(0xDEB887);
    g.fillRect(8, 12, 20, 8); // Lighter top

    // Tea bag string
    g.fillStyle(C.white);
    g.fillRect(26, 8, 2, 12);

    // Tea bag tag (red)
    g.fillStyle(C.red);
    g.fillRect(24, 0, 8, 10);
    g.fillStyle(C.redLight);
    g.fillRect(26, 2, 4, 6);

    g.generateTexture('cup-tea', cupWidth, cupHeight);
    g.destroy();
  }

  /**
   * Camera on tripod
   */
  generateCamera() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Tripod legs
    g.fillStyle(C.black);
    g.fillRect(6, 24, 4, 20);
    g.fillRect(30, 24, 4, 20);
    g.fillRect(18, 24, 4, 22);

    // Tripod head
    g.fillStyle(C.greyDark);
    g.fillRect(12, 20, 16, 6);

    // Camera body
    g.fillStyle(C.black);
    g.fillRect(8, 6, 24, 16);

    g.fillStyle(C.blackLight);
    g.fillRect(10, 8, 20, 12);

    // Lens
    g.fillStyle(C.greyDark);
    g.fillRect(2, 8, 8, 12);
    g.fillStyle(C.blueLight);
    g.fillRect(3, 10, 4, 8);
    g.fillStyle(C.black);
    g.fillCircle(5, 14, 3);

    // Viewfinder
    g.fillStyle(C.black);
    g.fillRect(28, 8, 8, 6);

    // Recording light
    g.fillStyle(C.red);
    g.fillCircle(29, 18, 3);

    // LCD screen
    g.fillStyle(C.blueLight);
    g.fillRect(14, 10, 12, 8);

    g.generateTexture('camera', 40, 46);
    g.destroy();
  }

  /**
   * UI sprites
   */
  generateUISprites() {
    let g = this.make.graphics({ x: 0, y: 0, add: false });

    // Coffee icon
    g.fillStyle(C.white);
    g.fillRect(2, 2, 14, 18);
    g.fillStyle(C.coffee);
    g.fillRect(4, 4, 10, 14);
    g.fillStyle(C.white);
    g.fillRect(16, 6, 4, 8);
    g.fillStyle(C.background);
    g.fillRect(18, 8, 2, 4);
    // Steam
    g.fillStyle(C.greyLight);
    g.fillRect(6, 0, 2, 3);
    g.fillRect(10, 0, 2, 3);
    g.generateTexture('coffee-icon', 22, 22);
    g.clear();

    // Face - happy
    g.fillStyle(C.yellow);
    g.fillCircle(12, 12, 11);
    g.fillStyle(C.yellowDark);
    g.fillCircle(12, 12, 11);
    g.fillStyle(C.yellow);
    g.fillCircle(12, 11, 10);
    g.fillStyle(C.black);
    g.fillRect(7, 8, 3, 4);
    g.fillRect(14, 8, 3, 4);
    g.fillStyle(C.white);
    g.fillRect(7, 8, 1, 1);
    g.fillRect(14, 8, 1, 1);
    // Smile
    g.fillStyle(C.black);
    g.fillRect(7, 15, 10, 2);
    g.fillRect(6, 14, 2, 2);
    g.fillRect(16, 14, 2, 2);
    g.generateTexture('face-happy', 24, 24);
    g.clear();

    // Face - neutral
    g.fillStyle(C.yellowDark);
    g.fillCircle(12, 12, 11);
    g.fillStyle(C.yellow);
    g.fillCircle(12, 11, 10);
    g.fillStyle(C.black);
    g.fillRect(7, 8, 3, 4);
    g.fillRect(14, 8, 3, 4);
    g.fillStyle(C.white);
    g.fillRect(7, 8, 1, 1);
    g.fillRect(14, 8, 1, 1);
    g.fillStyle(C.black);
    g.fillRect(8, 15, 8, 2);
    g.generateTexture('face-neutral', 24, 24);
    g.clear();

    // Face - worried
    g.fillStyle(C.orangeDark);
    g.fillCircle(12, 12, 11);
    g.fillStyle(C.orange);
    g.fillCircle(12, 11, 10);
    g.fillStyle(C.black);
    g.fillRect(7, 8, 3, 4);
    g.fillRect(14, 8, 3, 4);
    g.fillStyle(C.white);
    g.fillRect(7, 8, 1, 1);
    g.fillRect(14, 8, 1, 1);
    // Worried eyebrows
    g.fillStyle(C.orangeDark);
    g.fillRect(6, 6, 4, 2);
    g.fillRect(14, 6, 4, 2);
    // Worried mouth
    g.fillStyle(C.black);
    g.fillRect(8, 16, 8, 2);
    g.fillRect(7, 15, 2, 2);
    g.fillRect(15, 15, 2, 2);
    g.generateTexture('face-worried', 24, 24);
    g.clear();

    // Face - angry
    g.fillStyle(C.redDark);
    g.fillCircle(12, 12, 11);
    g.fillStyle(C.red);
    g.fillCircle(12, 11, 10);
    g.fillStyle(C.black);
    g.fillRect(7, 9, 3, 4);
    g.fillRect(14, 9, 3, 4);
    g.fillStyle(C.white);
    g.fillRect(7, 9, 1, 1);
    g.fillRect(14, 9, 1, 1);
    // Angry eyebrows
    g.fillStyle(C.black);
    g.fillRect(5, 6, 5, 2);
    g.fillRect(6, 7, 4, 2);
    g.fillRect(14, 6, 5, 2);
    g.fillRect(14, 7, 4, 2);
    // Angry mouth
    g.fillStyle(C.black);
    g.fillRect(7, 16, 10, 3);
    g.fillStyle(C.red);
    g.fillRect(8, 17, 8, 1);
    g.generateTexture('face-angry', 24, 24);
    g.destroy();
  }

  /**
   * Easter egg character sprites
   */
  generateEasterEggSprites() {
    let g = this.make.graphics({ x: 0, y: 0, add: false });

    // New Shoes character - distinctive RED shoes
    this.drawCharacterBase(g, C.grey, C.greyDark, C.greyLight, C.hairBrown);
    this.drawHead(g, C.hairBrown, C.coffeeDark);
    // Big smile
    g.fillStyle(C.skinDark);
    g.fillRect(13, 10, 6, 2);
    g.fillRect(12, 11, 2, 1);
    g.fillRect(18, 11, 2, 1);
    // RED SHOES (the distinctive feature!)
    g.fillStyle(C.red);
    g.fillRect(8, 29, 7, 3);
    g.fillRect(17, 29, 7, 3);
    g.fillStyle(C.redLight);
    g.fillRect(9, 29, 2, 2);
    g.fillRect(18, 29, 2, 2);
    g.generateTexture('new-shoes', 32, 32);
    g.clear();

    // Gravedigger character - dark, with shovel
    this.drawCharacterBase(g, C.black, C.blackLight, C.blackLight, C.black);
    this.drawHead(g, C.hairBlack, C.blackLight);
    // Flat cap
    g.fillStyle(C.blackLight);
    g.fillRect(7, 0, 18, 4);
    g.fillRect(5, 3, 6, 2);
    // Solemn expression
    g.fillStyle(C.skinDark);
    g.fillRect(14, 11, 4, 1);
    // Shovel
    g.fillStyle(C.coffee);
    g.fillRect(28, 4, 3, 26);
    g.fillStyle(C.greyDark);
    g.fillRect(26, 26, 7, 6);
    g.fillStyle(C.grey);
    g.fillRect(27, 27, 5, 4);
    g.generateTexture('gravedigger', 34, 32);
    g.destroy();
  }
}
