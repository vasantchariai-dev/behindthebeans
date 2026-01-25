/**
 * Boot Scene
 * Generates pixel art sprites procedurally and handles asset loading
 *
 * Since we're creating a self-contained game, all sprites are generated
 * using canvas drawing rather than external image files.
 */

import Phaser from 'phaser';

// Colour palette from spec
const COLOURS = {
  background: 0x2D3142,
  floor: 0xFAF7F2,
  coffeeVan: 0xEF8354,
  teal: 0x4ECDC4,
  lightGrey: 0xE8E8E8,
  black: 0x1A1A1A,
  warningRed: 0xE63946,
  coffeeBrown: 0x8B4513,
  white: 0xFFFFFF,
  skin: 0xFFDBB4,
  darkBrown: 0x5C4033,
  green: 0x4CAF50,
  yellow: 0xFFD700,
  purple: 0x9C27B0,
  blue: 0x2196F3,
  orange: 0xFF9800,
  hotSetRed: 0xFF6B6B,
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Show loading progress
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 50, height / 2 - 5, 100, 10);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xEF8354, 1);
      progressBar.fillRect(width / 2 - 48, height / 2 - 3, 96 * value, 6);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
    });

    // Generate all sprites
    this.generateSprites();

    // Generate sound effects
    this.generateSounds();
  }

  create() {
    // Transition to menu
    this.scene.start('MenuScene');
  }

  /**
   * Generate all pixel art sprites programmatically
   */
  generateSprites() {
    // Player sprite (AD runner) - 16x16
    this.generatePlayerSprite();

    // Director and 1st AD - 16x16
    this.generateDirectorSprite();
    this.generateADSprite();

    // Crew members - 16x16
    this.generateCrewSprites();

    // Actor - 16x16
    this.generateActorSprite();

    // Coffee van - 32x32
    this.generateCoffeeVanSprite();

    // Toilet - 16x16
    this.generateToiletSprite();

    // Coffee cups - 8x8
    this.generateCoffeeCupSprites();

    // Camera on tripod - 16x16
    this.generateCameraSprite();

    // UI elements
    this.generateUISprites();

    // Hot set marker
    this.generateHotSetMarker();

    // Speech bubble
    this.generateSpeechBubble();

    // Easter egg characters
    this.generateEasterEggSprites();
  }

  /**
   * Generate player character sprite (AD runner)
   */
  generatePlayerSprite() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Frame 1 - Idle
    g.fillStyle(COLOURS.teal); // Body
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin); // Head
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.black); // Hair
    g.fillRect(5, 2, 6, 2);
    g.fillStyle(COLOURS.darkBrown); // Legs
    g.fillRect(5, 12, 2, 3);
    g.fillRect(9, 12, 2, 3);
    g.fillStyle(COLOURS.black); // Eyes
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);

    g.generateTexture('player-idle', 16, 16);
    g.clear();

    // Frame 2 - Running (legs apart)
    g.fillStyle(COLOURS.teal);
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin);
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.black);
    g.fillRect(5, 2, 6, 2);
    g.fillStyle(COLOURS.darkBrown);
    g.fillRect(3, 12, 2, 3); // Left leg extended
    g.fillRect(11, 12, 2, 3); // Right leg extended
    g.fillStyle(COLOURS.black);
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);

    g.generateTexture('player-run', 16, 16);
    g.clear();

    // Frame 3 - Carrying coffee
    g.fillStyle(COLOURS.teal);
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin);
    g.fillRect(5, 2, 6, 5);
    g.fillRect(12, 7, 3, 2); // Extended arm
    g.fillStyle(COLOURS.black);
    g.fillRect(5, 2, 6, 2);
    g.fillStyle(COLOURS.darkBrown);
    g.fillRect(5, 12, 2, 3);
    g.fillRect(9, 12, 2, 3);
    g.fillStyle(COLOURS.black);
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);
    g.fillStyle(COLOURS.white); // Coffee cup
    g.fillRect(13, 4, 3, 4);
    g.fillStyle(COLOURS.coffeeBrown);
    g.fillRect(14, 5, 1, 2);

    g.generateTexture('player-coffee', 16, 16);
    g.clear();

    // Frame 4 - Drinking
    g.fillStyle(COLOURS.teal);
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin);
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.black);
    g.fillRect(5, 2, 6, 2);
    g.fillStyle(COLOURS.darkBrown);
    g.fillRect(5, 12, 2, 3);
    g.fillRect(9, 12, 2, 3);
    g.fillStyle(COLOURS.white); // Cup at face
    g.fillRect(6, 3, 4, 5);
    g.fillStyle(COLOURS.coffeeBrown);
    g.fillRect(7, 4, 2, 3);

    g.generateTexture('player-drink', 16, 16);
    g.destroy();
  }

  /**
   * Generate director sprite
   */
  generateDirectorSprite() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Director - stern looking, dark clothes
    g.fillStyle(COLOURS.black); // Body (dark shirt)
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin); // Head
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.darkBrown); // Hair/beret
    g.fillRect(4, 1, 8, 3);
    g.fillStyle(COLOURS.black); // Legs
    g.fillRect(5, 12, 2, 3);
    g.fillRect(9, 12, 2, 3);
    g.fillStyle(COLOURS.black); // Eyes (intense)
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);
    g.fillStyle(COLOURS.warningRed); // Mouth (frowning)
    g.fillRect(7, 6, 2, 1);

    g.generateTexture('director', 16, 16);
    g.clear();

    // Director angry
    g.fillStyle(COLOURS.black);
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.warningRed); // Face turned red
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.darkBrown);
    g.fillRect(4, 1, 8, 3);
    g.fillStyle(COLOURS.black);
    g.fillRect(5, 12, 2, 3);
    g.fillRect(9, 12, 2, 3);
    g.fillStyle(COLOURS.black);
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);
    g.fillStyle(COLOURS.black); // Open mouth shouting
    g.fillRect(6, 5, 4, 2);

    g.generateTexture('director-angry', 16, 16);
    g.destroy();
  }

  /**
   * Generate 1st AD sprite
   */
  generateADSprite() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // 1st AD - headset, clipboard
    g.fillStyle(COLOURS.lightGrey); // Body (grey polo)
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin); // Head
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.black); // Hair
    g.fillRect(5, 2, 6, 2);
    g.fillStyle(COLOURS.black); // Headset
    g.fillRect(3, 3, 2, 3);
    g.fillRect(11, 3, 2, 3);
    g.fillRect(4, 2, 8, 1);
    g.fillStyle(COLOURS.darkBrown); // Legs
    g.fillRect(5, 12, 2, 3);
    g.fillRect(9, 12, 2, 3);
    g.fillStyle(COLOURS.black); // Eyes
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);
    g.fillStyle(COLOURS.white); // Clipboard
    g.fillRect(12, 7, 3, 4);
    g.fillStyle(COLOURS.black);
    g.fillRect(13, 8, 1, 2);

    g.generateTexture('first-ad', 16, 16);
    g.clear();

    // 1st AD shouting order
    g.fillStyle(COLOURS.lightGrey);
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin);
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.black);
    g.fillRect(5, 2, 6, 2);
    g.fillRect(3, 3, 2, 3);
    g.fillRect(11, 3, 2, 3);
    g.fillRect(4, 2, 8, 1);
    g.fillStyle(COLOURS.darkBrown);
    g.fillRect(5, 12, 2, 3);
    g.fillRect(9, 12, 2, 3);
    g.fillStyle(COLOURS.black);
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);
    g.fillStyle(COLOURS.warningRed); // Open mouth
    g.fillRect(7, 5, 2, 2);

    g.generateTexture('first-ad-shout', 16, 16);
    g.destroy();
  }

  /**
   * Generate crew member sprites
   */
  generateCrewSprites() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Rigger - high-vis yellow
    g.fillStyle(COLOURS.yellow);
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin);
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.black);
    g.fillRect(5, 1, 6, 2); // Hard hat
    g.fillRect(4, 2, 8, 1);
    g.fillStyle(COLOURS.darkBrown);
    g.fillRect(5, 12, 2, 3);
    g.fillRect(9, 12, 2, 3);
    g.fillStyle(COLOURS.black);
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);

    g.generateTexture('rigger', 16, 16);
    g.clear();

    // Spark (electrician) - blue overalls
    g.fillStyle(COLOURS.blue);
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin);
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.darkBrown);
    g.fillRect(5, 2, 6, 2);
    g.fillRect(5, 12, 2, 3);
    g.fillRect(9, 12, 2, 3);
    g.fillStyle(COLOURS.black);
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);
    g.fillStyle(COLOURS.yellow); // Tape measure
    g.fillRect(12, 8, 2, 3);

    g.generateTexture('spark', 16, 16);
    g.clear();

    // Runner - teal (like player but slightly different)
    g.fillStyle(COLOURS.green);
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin);
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.black);
    g.fillRect(5, 2, 6, 2);
    g.fillStyle(COLOURS.darkBrown);
    g.fillRect(5, 12, 2, 3);
    g.fillRect(9, 12, 2, 3);
    g.fillStyle(COLOURS.black);
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);
    g.fillStyle(COLOURS.white); // Walkie-talkie
    g.fillRect(1, 7, 2, 3);

    g.generateTexture('runner-crew', 16, 16);
    g.clear();

    // Stopped crew member (X over them)
    g.fillStyle(COLOURS.lightGrey);
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin);
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.black);
    g.fillRect(5, 2, 6, 2);
    g.fillStyle(COLOURS.darkBrown);
    g.fillRect(5, 12, 2, 3);
    g.fillRect(9, 12, 2, 3);
    g.fillStyle(COLOURS.warningRed); // Stop sign effect
    g.fillRect(0, 0, 3, 3);
    g.fillRect(13, 0, 3, 3);
    g.fillRect(0, 13, 3, 3);
    g.fillRect(13, 13, 3, 3);

    g.generateTexture('crew-stopped', 16, 16);
    g.destroy();
  }

  /**
   * Generate actor sprite
   */
  generateActorSprite() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Actor - fancy clothes, purple
    g.fillStyle(COLOURS.purple);
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin);
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.black); // Styled hair
    g.fillRect(4, 1, 8, 3);
    g.fillRect(3, 2, 1, 2);
    g.fillStyle(COLOURS.black);
    g.fillRect(5, 12, 2, 3);
    g.fillRect(9, 12, 2, 3);
    g.fillStyle(COLOURS.black);
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);

    g.generateTexture('actor', 16, 16);
    g.clear();

    // Actor desperate (need loo)
    g.fillStyle(COLOURS.purple);
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin);
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.black);
    g.fillRect(4, 1, 8, 3);
    g.fillRect(3, 2, 1, 2);
    g.fillStyle(COLOURS.black);
    g.fillRect(5, 12, 2, 2); // Crossed legs
    g.fillRect(9, 12, 2, 2);
    g.fillRect(6, 14, 4, 1);
    g.fillStyle(COLOURS.black); // Wide eyes
    g.fillRect(6, 4, 2, 1);
    g.fillRect(8, 4, 2, 1);
    g.fillStyle(COLOURS.yellow); // Sweat drops
    g.fillRect(3, 3, 1, 2);
    g.fillRect(12, 3, 1, 2);

    g.generateTexture('actor-desperate', 16, 16);
    g.destroy();
  }

  /**
   * Generate coffee van sprite
   */
  generateCoffeeVanSprite() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Coffee van / craft tent - 32x32
    g.fillStyle(COLOURS.coffeeVan);
    g.fillRect(2, 8, 28, 20); // Main body
    g.fillStyle(COLOURS.darkBrown);
    g.fillRect(2, 6, 28, 4); // Roof/awning
    g.fillStyle(COLOURS.white); // Service window
    g.fillRect(6, 12, 20, 10);
    g.fillStyle(COLOURS.coffeeBrown); // Coffee machine
    g.fillRect(8, 14, 6, 6);
    g.fillStyle(COLOURS.lightGrey);
    g.fillRect(16, 14, 8, 6); // Counter
    g.fillStyle(COLOURS.black); // Text area
    g.fillRect(10, 4, 12, 3);
    g.fillStyle(COLOURS.white); // "CRAFT" text dots
    g.fillRect(11, 5, 1, 1);
    g.fillRect(13, 5, 1, 1);
    g.fillRect(15, 5, 1, 1);
    g.fillRect(17, 5, 1, 1);
    g.fillRect(19, 5, 1, 1);

    g.generateTexture('coffee-van', 32, 32);
    g.destroy();
  }

  /**
   * Generate toilet sprite
   */
  generateToiletSprite() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Portaloo - 16x16
    g.fillStyle(COLOURS.blue);
    g.fillRect(2, 2, 12, 12); // Main body
    g.fillStyle(COLOURS.lightGrey);
    g.fillRect(4, 3, 8, 2); // Roof
    g.fillStyle(COLOURS.black); // Door
    g.fillRect(5, 5, 6, 8);
    g.fillStyle(COLOURS.white); // Door handle
    g.fillRect(9, 8, 1, 2);
    g.fillStyle(COLOURS.green); // "Vacant" light
    g.fillRect(7, 4, 2, 1);

    g.generateTexture('toilet', 16, 16);
    g.destroy();
  }

  /**
   * Generate coffee cup sprites
   */
  generateCoffeeCupSprites() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Flat white - white cup, light brown
    g.fillStyle(COLOURS.white);
    g.fillRect(1, 1, 6, 6);
    g.fillStyle(0xD4A574); // Light coffee colour
    g.fillRect(2, 2, 4, 4);
    g.fillStyle(COLOURS.white); // Foam art
    g.fillRect(3, 3, 2, 2);
    g.generateTexture('cup-flat-white', 8, 8);
    g.clear();

    // Oat latte - cup with leaf design
    g.fillStyle(COLOURS.white);
    g.fillRect(1, 1, 6, 6);
    g.fillStyle(0xC9A86C); // Oat milk colour
    g.fillRect(2, 2, 4, 4);
    g.fillStyle(COLOURS.green); // Oat indicator
    g.fillRect(3, 2, 2, 1);
    g.generateTexture('cup-oat-latte', 8, 8);
    g.clear();

    // Black coffee - dark
    g.fillStyle(COLOURS.white);
    g.fillRect(1, 1, 6, 6);
    g.fillStyle(COLOURS.coffeeBrown);
    g.fillRect(2, 2, 4, 4);
    g.fillStyle(COLOURS.black);
    g.fillRect(3, 3, 2, 2);
    g.generateTexture('cup-black', 8, 8);
    g.clear();

    // Tea - lighter colour
    g.fillStyle(COLOURS.white);
    g.fillRect(1, 1, 6, 6);
    g.fillStyle(0xCD853F); // Tea colour
    g.fillRect(2, 2, 4, 4);
    g.fillStyle(COLOURS.white); // Milk swirl
    g.fillRect(4, 3, 1, 2);
    g.generateTexture('cup-tea', 8, 8);
    g.destroy();
  }

  /**
   * Generate camera sprite
   */
  generateCameraSprite() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Camera on tripod
    g.fillStyle(COLOURS.black); // Camera body
    g.fillRect(4, 2, 8, 6);
    g.fillStyle(COLOURS.lightGrey); // Lens
    g.fillRect(2, 3, 3, 4);
    g.fillStyle(COLOURS.black); // Tripod
    g.fillRect(7, 8, 2, 2);
    g.fillRect(4, 10, 2, 5);
    g.fillRect(10, 10, 2, 5);
    g.fillRect(7, 10, 2, 5);
    g.fillStyle(COLOURS.warningRed); // Recording light
    g.fillRect(10, 3, 2, 2);

    g.generateTexture('camera', 16, 16);
    g.destroy();
  }

  /**
   * Generate UI sprites
   */
  generateUISprites() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Coffee cup icon for meter
    g.fillStyle(COLOURS.white);
    g.fillRect(2, 1, 8, 10);
    g.fillStyle(COLOURS.coffeeBrown);
    g.fillRect(3, 2, 6, 8);
    g.fillStyle(COLOURS.white); // Handle
    g.fillRect(10, 3, 2, 4);
    g.generateTexture('coffee-icon', 14, 12);
    g.clear();

    // Face icons for stress meter
    // Happy
    g.fillStyle(COLOURS.yellow);
    g.fillCircle(6, 6, 5);
    g.fillStyle(COLOURS.black);
    g.fillRect(4, 4, 1, 2);
    g.fillRect(7, 4, 1, 2);
    g.fillRect(4, 8, 4, 1);
    g.fillRect(3, 7, 1, 1);
    g.fillRect(8, 7, 1, 1);
    g.generateTexture('face-happy', 12, 12);
    g.clear();

    // Neutral
    g.fillStyle(COLOURS.yellow);
    g.fillCircle(6, 6, 5);
    g.fillStyle(COLOURS.black);
    g.fillRect(4, 4, 1, 2);
    g.fillRect(7, 4, 1, 2);
    g.fillRect(4, 8, 4, 1);
    g.generateTexture('face-neutral', 12, 12);
    g.clear();

    // Worried
    g.fillStyle(COLOURS.orange);
    g.fillCircle(6, 6, 5);
    g.fillStyle(COLOURS.black);
    g.fillRect(4, 4, 1, 2);
    g.fillRect(7, 4, 1, 2);
    g.fillRect(4, 8, 4, 1);
    g.fillRect(3, 9, 1, 1);
    g.fillRect(8, 9, 1, 1);
    g.generateTexture('face-worried', 12, 12);
    g.clear();

    // Angry
    g.fillStyle(COLOURS.warningRed);
    g.fillCircle(6, 6, 5);
    g.fillStyle(COLOURS.black);
    g.fillRect(3, 3, 2, 1); // Angry eyebrows
    g.fillRect(7, 3, 2, 1);
    g.fillRect(4, 4, 1, 2);
    g.fillRect(7, 4, 1, 2);
    g.fillRect(4, 9, 4, 1);
    g.fillRect(3, 8, 1, 1);
    g.fillRect(8, 8, 1, 1);
    g.generateTexture('face-angry', 12, 12);
    g.destroy();
  }

  /**
   * Generate hot set marker
   */
  generateHotSetMarker() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Hot set boundary stripe
    g.fillStyle(COLOURS.warningRed);
    g.fillRect(0, 0, 4, 4);
    g.fillRect(4, 4, 4, 4);
    g.fillStyle(COLOURS.white);
    g.fillRect(4, 0, 4, 4);
    g.fillRect(0, 4, 4, 4);

    g.generateTexture('hot-set-tile', 8, 8);
    g.destroy();
  }

  /**
   * Generate speech bubble
   */
  generateSpeechBubble() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Speech bubble background
    g.fillStyle(COLOURS.white);
    g.fillRoundedRect(0, 0, 32, 20, 4);
    // Tail
    g.fillTriangle(8, 20, 16, 20, 12, 26);

    g.generateTexture('speech-bubble', 32, 28);
    g.destroy();
  }

  /**
   * Generate Easter egg character sprites
   */
  generateEasterEggSprites() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // New Shoes character - distinctive red shoes
    g.fillStyle(COLOURS.lightGrey);
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin);
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.black);
    g.fillRect(5, 2, 6, 2);
    g.fillStyle(COLOURS.warningRed); // Red shoes!
    g.fillRect(4, 13, 3, 2);
    g.fillRect(9, 13, 3, 2);
    g.fillStyle(COLOURS.black);
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);
    g.fillStyle(COLOURS.warningRed); // Big smile
    g.fillRect(6, 6, 4, 1);

    g.generateTexture('new-shoes', 16, 16);
    g.clear();

    // Gravediggers character - dark clothes, shovel
    g.fillStyle(COLOURS.black);
    g.fillRect(4, 6, 8, 6);
    g.fillStyle(COLOURS.skin);
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(COLOURS.black);
    g.fillRect(5, 2, 6, 2);
    g.fillStyle(COLOURS.darkBrown);
    g.fillRect(5, 12, 2, 3);
    g.fillRect(9, 12, 2, 3);
    g.fillStyle(COLOURS.black);
    g.fillRect(6, 4, 1, 1);
    g.fillRect(9, 4, 1, 1);
    g.fillStyle(COLOURS.lightGrey); // Shovel
    g.fillRect(13, 2, 2, 12);
    g.fillRect(12, 12, 4, 2);

    g.generateTexture('gravedigger', 16, 16);
    g.destroy();
  }

  /**
   * Generate sound effects using Web Audio API
   */
  generateSounds() {
    // We'll create simple 8-bit style sounds using oscillators
    // These will be generated at runtime rather than loaded

    // Store sound configs for later use
    this.game.registry.set('soundConfigs', {
      coffeePour: { frequency: 200, duration: 0.5, type: 'noise' },
      footstep: { frequency: 100, duration: 0.1, type: 'square' },
      success: { frequency: 880, duration: 0.2, type: 'square' },
      fail: { frequency: 150, duration: 0.3, type: 'sawtooth' },
      shout: { frequency: 300, duration: 0.15, type: 'square' },
      levelComplete: { frequency: 523, duration: 0.5, type: 'square' },
    });
  }
}
