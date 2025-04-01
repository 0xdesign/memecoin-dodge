import * as THREE from 'three';
import memecoinsData from './data/memecoins.json';

// Initialize the game class
class MemecoinDodgeGame {
  constructor() {
    // Game state
    this.isInitialized = false;
    this.score = 0;
    this.gameOver = false;
    this.lastMissileTime = 0;
    this.missileInterval = 2000; // milliseconds between missile spawns
    this.maxGameTime = 180; // 3 minutes game time
    this.gameTimer = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.coinsDodged = 0;
    this.coinsHit = 0;
    
    // Flow state metrics
    this.playerSkillRating = 50; // 0-100 scale
    this.flowZone = { min: 40, max: 60 }; // Initial challenge window
    this.lastPerformanceUpdate = 0;
    this.performanceUpdateInterval = 5000; // Update skill rating every 5 seconds
    this.consecutiveAvoids = 0; // Track streak of successful dodges
    this.nearMissCount = 0; // Track close calls (exciting moments)
    this.currentFlowState = "neutral"; // Can be "anxiety", "neutral", "flow", or "boredom"
    
    // Physics state
    this.gravity = 20;
    this.playerVelocity = new THREE.Vector3();
    this.playerOnGround = false;
    this.jumpHeight = 10;
    this.dashSpeed = 15;
    this.dashCooldown = 2000; // 2 seconds
    this.dashDuration = 0;
    this.lastDash = 0;
    
    // Game elements
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.missiles = [];
    this.memecoins = [...memecoinsData]; // Copy the memecoin data
    this.particles = [];
    this.effects = [];
    this.missileTextures = {}; // Initialize missileTextures object
    
    // Controls
    this.keys = {
      forward: false, 
      backward: false, 
      left: false, 
      right: false
    };
    this.touchControls = {
      active: false,
      startX: 0,
      startY: 0,
      moveX: 0,
      moveY: 0
    };
    
    // UI elements
    this.ui = {
      score: null,
      multiplier: null,
      time: null,
      healthFill: null,
      lastHit: null,
      gameOver: null,
      finalScore: null,
      coinsDodged: null,
      timeSurvived: null,
      restartButton: null,
      loadingBar: null,
      joystickKnob: null,
      alertMessage: null,
      instructions: null
    };
    
    // Sound effects
    this.sounds = {
      background: null,
      impact: null,
      playerHit: null,
      gameOver: null,
      jump: null,
      dash: null,
      alert: null
    };
    
    // Resources loading
    this.resourcesLoaded = 0;
    this.totalResources = 0;
    
    // Setup the game when DOM is loaded
    window.addEventListener('DOMContentLoaded', () => this.preload());
  }
  
  preload() {
    // Get UI elements
    this.ui.score = document.getElementById('score');
    this.ui.multiplier = document.getElementById('multiplier');
    this.ui.time = document.getElementById('time');
    this.ui.healthFill = document.getElementById('health-fill');
    this.ui.lastHit = document.getElementById('last-hit');
    this.ui.gameOver = document.getElementById('game-over');
    this.ui.finalScore = document.getElementById('final-score');
    this.ui.coinsDodged = document.getElementById('coins-dodged');
    this.ui.timeSurvived = document.getElementById('time-survived');
    this.ui.restartButton = document.getElementById('restart-button');
    this.ui.loadingBar = document.getElementById('loading-bar');
    this.ui.joystickKnob = document.querySelector('.joystick-knob');
    this.ui.alertMessage = document.getElementById('alert-message');
    
    // Add restart button event listener
    this.ui.restartButton.addEventListener('click', () => this.restartGame());
    
    // Add touch button event listeners
    document.getElementById('dash-button').addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.tryDash();
    });
    
    // Start loading resources
    this.loadResources();
  }
  
  loadResources() {
    // We're manually tracking loaded resources
    // Set a fixed number that accounts for all resources we'll mark as loaded
    this.totalResources = this.memecoins.length + 7; // Memecoins textures + 7 sound effects
    
    // Load sound effects
    this.loadSounds();
    
    // Create Three.js resources
    this.setupScene();
    
    // Preload coin textures
    this.preloadMissileTextures();
    
    // Show loading progress
    const checkLoading = setInterval(() => {
      const progress = Math.min(this.resourcesLoaded / this.totalResources, 1);
      if (this.ui.loadingBar) {
        this.ui.loadingBar.style.width = `${progress * 100}%`;
      }
      
      if (progress >= 1) {
        clearInterval(checkLoading);
        setTimeout(() => {
          this.init();
        }, 500);
      }
    }, 100);
  }
  
  resourceLoaded() {
    this.resourcesLoaded++;
    // Make sure we don't exceed total resources for progress calculation
    if (this.resourcesLoaded > this.totalResources) {
      this.resourcesLoaded = this.totalResources;
    }
    
    const progress = Math.min(this.resourcesLoaded / this.totalResources, 1);
    
    // Check if UI is ready before updating
    if (this.ui.loadingBar) {
      this.ui.loadingBar.style.width = `${progress * 100}%`;
    }
    
    // Debug loading progress
    console.log(`Resources loaded: ${this.resourcesLoaded}/${this.totalResources} (${Math.round(progress * 100)}%)`);
  }
  
  setupScene() {
    // Create the scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background
    
    // Add fog to create depth
    this.scene.fog = new THREE.Fog(0x87ceeb, 10, 100);
    
    // Create the camera
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);
    
    // Create the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(this.renderer.domElement);
    
    // Set up lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    this.scene.add(directionalLight);
    
    // Create environment with advanced materials
    this.createEnvironment();
  }
  
  createEnvironment() {
    // Create textured ground
    const groundSize = 100;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 32, 32);
    
    // Apply some vertex displacement for slight terrain variation
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      // Skip edges to keep them flat
      const x = vertices[i];
      const z = vertices[i + 2];
      if (Math.abs(x) < groundSize/2 - 5 && Math.abs(z) < groundSize/2 - 5) {
        vertices[i + 1] = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
      }
    }
    
    // Create ground material
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3c9c35, // Green grass color
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // Add some decorative elements (trees, rocks)
    this.addEnvironmentDecorations();
    
    // Create skybox
    this.createSkybox();
  }
  
  createSkybox() {
    const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyMaterials = [
      new THREE.MeshBasicMaterial({ color: 0x82b1ff, side: THREE.BackSide }), // right
      new THREE.MeshBasicMaterial({ color: 0x82b1ff, side: THREE.BackSide }), // left
      new THREE.MeshBasicMaterial({ color: 0x4fc3f7, side: THREE.BackSide }), // top
      new THREE.MeshBasicMaterial({ color: 0x4fc3f7, side: THREE.BackSide }), // bottom
      new THREE.MeshBasicMaterial({ color: 0x82b1ff, side: THREE.BackSide }), // front
      new THREE.MeshBasicMaterial({ color: 0x82b1ff, side: THREE.BackSide })  // back
    ];
    
    const skybox = new THREE.Mesh(skyGeometry, skyMaterials);
    this.scene.add(skybox);
    
    // Add some clouds
    for (let i = 0; i < 20; i++) {
      this.createCloud();
    }
  }
  
  createCloud() {
    const cloudGroup = new THREE.Group();
    
    // Create multiple spheres to form a cloud
    const numSpheres = 3 + Math.floor(Math.random() * 5);
    const cloudSize = 2 + Math.random() * 4;
    
    for (let i = 0; i < numSpheres; i++) {
      const sphereGeometry = new THREE.SphereGeometry(cloudSize * (0.5 + Math.random() * 0.5), 8, 8);
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      });
      
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      
      // Position spheres to form a cloud shape
      sphere.position.set(
        (Math.random() - 0.5) * cloudSize * 2,
        (Math.random() - 0.5) * cloudSize,
        (Math.random() - 0.5) * cloudSize * 2
      );
      
      cloudGroup.add(sphere);
    }
    
    // Position cloud in the sky
    cloudGroup.position.set(
      (Math.random() - 0.5) * 100,
      30 + Math.random() * 20,
      (Math.random() - 0.5) * 100
    );
    
    // Add cloud to scene
    this.scene.add(cloudGroup);
    
    // Set cloud movement properties
    cloudGroup.userData = {
      speed: 0.5 + Math.random() * 1.5,
      direction: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        0,
        (Math.random() - 0.5) * 0.5
      ).normalize(),
      update: (deltaTime) => {
        cloudGroup.position.x += cloudGroup.userData.direction.x * cloudGroup.userData.speed * deltaTime;
        cloudGroup.position.z += cloudGroup.userData.direction.z * cloudGroup.userData.speed * deltaTime;
        
        // If cloud moves too far, reset its position
        if (
          cloudGroup.position.x > 100 || 
          cloudGroup.position.x < -100 || 
          cloudGroup.position.z > 100 || 
          cloudGroup.position.z < -100
        ) {
          // Move to the opposite side
          cloudGroup.position.x = -cloudGroup.position.x * 0.9;
          cloudGroup.position.z = -cloudGroup.position.z * 0.9;
        }
      }
    };
    
    // Add to effects array to update
    this.effects.push(cloudGroup);
  }
  
  init() {
    // Log memecoin data
    console.log(`Loaded ${this.memecoins.length} memecoins for the game`);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Create player character
    this.createPlayer();
    
    // Hide loading screen
    document.getElementById('loading-screen').style.display = 'none';
    
    // Show alert message at start
    this.showAlertMessage("Get Ready!", "#4CAF50");
    
    // Start the game loop
    this.isInitialized = true;
    this.animate();
    
    // Play background music
    if (this.sounds.background) {
      this.sounds.background.loop = true;
      this.sounds.background.volume = 0.5;
      this.playSound(this.sounds.background);
    }
    
    // Hide instructions after 10 seconds
    setTimeout(() => {
      this.ui.instructions.style.opacity = '0';
    }, 10000);
    
    console.log("Game initialized successfully!");
  }
  
  // Helper method to safely play sounds
  playSound(sound) {
    if (!sound) return;
    
    try {
      if (sound.paused) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Audio playback error (expected):', e));
      }
    } catch (e) {
      console.log('Error playing sound (expected):', e);
    }
  }

  showAlertMessage(message, color = "#ffffff") {
    this.ui.alertMessage.textContent = message;
    this.ui.alertMessage.style.color = color;
    this.ui.alertMessage.style.opacity = "1";
    this.ui.alertMessage.style.transform = "translate(-50%, -50%) scale(1.2)";
    
    // Play alert sound
    this.playSound(this.sounds.alert);
    
    // Hide after 2 seconds
    setTimeout(() => {
      this.ui.alertMessage.style.opacity = "0";
      this.ui.alertMessage.style.transform = "translate(-50%, -50%) scale(1)";
    }, 2000);
  }
  
  loadSounds() {
    // Create empty dummy audio for when files don't exist
    const createDummyAudio = () => {
      const audio = new Audio();
      audio.volume = 0;
      // Manually trigger the canplaythrough event since we won't get it from nonexistent files
      setTimeout(() => this.resourceLoaded(), 100);
      return audio;
    };
    
    // Create audio elements with error handling
    try {
      this.sounds.background = createDummyAudio();
      this.sounds.impact = createDummyAudio();
      this.sounds.playerHit = createDummyAudio();
      this.sounds.gameOver = createDummyAudio();
      this.sounds.jump = createDummyAudio();
      this.sounds.dash = createDummyAudio();
      this.sounds.alert = createDummyAudio();
      
      // Set volumes
      this.sounds.impact.volume = 0.4;
      this.sounds.playerHit.volume = 0.6;
      this.sounds.gameOver.volume = 0.7;
      this.sounds.jump.volume = 0.4;
      this.sounds.dash.volume = 0.3;
      this.sounds.alert.volume = 0.5;
      
      console.log('Sound placeholders created (actual sound files not found)');
    } catch (error) {
      console.error('Error setting up sounds:', error);
      // Ensure loading continues even if sound setup fails
      for (let i = 0; i < 7; i++) {
        this.resourceLoaded();
      }
    }
  }
  
  addEnvironmentDecorations() {
    // Add some trees
    const treeCount = 40;
    const treeGeometry = new THREE.ConeGeometry(1, 4, 8);
    const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x225522 });
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x553311 });
    
    for (let i = 0; i < treeCount; i++) {
      // Random position outside the immediate play area
      const dist = 20 + Math.random() * 30;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      
      // Create tree
      const treeTop = new THREE.Mesh(treeGeometry, treeMaterial);
      treeTop.position.set(0, 2, 0);
      treeTop.castShadow = true;
      
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(0, 0, 0);
      trunk.castShadow = true;
      
      const tree = new THREE.Group();
      tree.add(treeTop);
      tree.add(trunk);
      tree.position.set(x, 0, z);
      this.scene.add(tree);
    }
    
    // Add some rocks
    const rockCount = 20;
    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
    
    for (let i = 0; i < rockCount; i++) {
      // Random position
      const x = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 80;
      const scale = 0.5 + Math.random() * 1.5;
      
      // Create rock (irregular tetrahedron)
      const rockGeometry = new THREE.DodecahedronGeometry(scale, 0);
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(x, scale/2 - 0.5, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }
  }
  
  preloadMissileTextures() {
    const textureLoader = new THREE.TextureLoader();
    
    // Create a default texture for missiles (red cylinder)
    const defaultTexture = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.missileTextures['default'] = defaultTexture;
    
    // Since we're using mock data, we'll just mark all textures as loaded
    // This prevents waiting for textures that might fail to load
    this.memecoins.forEach(coin => {
      // Create a basic material as fallback
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
      });
      
      this.missileTextures[coin.id] = material;
      
      // Attempt to load the texture, but don't wait for it
      textureLoader.load(
        coin.logo,
        (texture) => {
          // If texture loads successfully, update the material
          material.map = texture;
          material.needsUpdate = true;
          console.log(`Loaded texture for ${coin.name}`);
        },
        undefined,
        (error) => {
          console.warn(`Error loading texture for ${coin.name}, using fallback: ${error.message}`);
        }
      );
      
      // Mark as loaded immediately, don't wait for the actual load
      this.resourceLoaded();
    });
  }
  
  createPlayer() {
    // Create a simple character for the player
    const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2194ce });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.75;
    body.castShadow = true;
    
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.9;
    head.castShadow = true;
    
    // Add arms
    const armGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x2194ce });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.65, 0.5, 0);
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.65, 0.5, 0);
    rightArm.castShadow = true;
    
    // Add legs
    const legGeometry = new THREE.BoxGeometry(0.35, 0.8, 0.35);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, -0.9, 0);
    leftLeg.castShadow = true;
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, -0.9, 0);
    rightLeg.castShadow = true;
    
    // Create player character group
    this.player = new THREE.Group();
    this.player.add(body);
    this.player.add(head);
    this.player.add(leftArm);
    this.player.add(rightArm);
    this.player.add(leftLeg);
    this.player.add(rightLeg);
    this.player.position.set(0, 0, 0);
    this.scene.add(this.player);
    
    // Create a collision box for the player
    this.playerCollider = new THREE.Box3().setFromObject(this.player);
    
    // Create a camera rig that follows the player
    this.cameraRig = new THREE.Object3D();
    this.cameraRig.position.copy(this.player.position);
    this.cameraRig.add(this.camera);
    this.scene.add(this.cameraRig);
    
    // Position the camera relative to the rig
    this.camera.position.set(0, 4, 10);
    this.camera.lookAt(this.cameraRig.position);
  }
  
  setupEventListeners() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });
    
    window.addEventListener('keyup', (e) => {
      this.handleKeyUp(e);
    });
    
    // Touch controls for mobile
    const joystickArea = document.querySelector('.joystick-area');
    
    joystickArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.touchControls.active = true;
      this.touchControls.startX = touch.clientX;
      this.touchControls.startY = touch.clientY;
    });
    
    joystickArea.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.touchControls.active) {
        const touch = e.touches[0];
        this.touchControls.moveX = touch.clientX - this.touchControls.startX;
        this.touchControls.moveY = touch.clientY - this.touchControls.startY;
      }
    });
    
    joystickArea.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touchControls.active = false;
      this.touchControls.moveX = 0;
      this.touchControls.moveY = 0;
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  
  handleKeyDown(event) {
    switch(event.key) {
      case 'ArrowUp':
      case 'w':
        this.keys.forward = true;
        break;
      case 'ArrowDown':
      case 's':
        this.keys.backward = true;
        break;
      case 'ArrowLeft':
      case 'a':
        this.keys.left = true;
        break;
      case 'ArrowRight':
      case 'd':
        this.keys.right = true;
        break;
      case ' ':
        // Jump when spacebar is pressed and player is on ground
        if (this.playerOnGround) {
          this.playerVelocity.y = this.jumpHeight;
          this.playerOnGround = false;
          
          // Play jump sound
          this.playSound(this.sounds.jump);
        }
        break;
      case 'Shift':
        // Dash when shift is pressed
        this.tryDash();
        break;
    }
  }
  
  handleKeyUp(event) {
    switch(event.key) {
      case 'ArrowUp':
      case 'w':
        this.keys.forward = false;
        break;
      case 'ArrowDown':
      case 's':
        this.keys.backward = false;
        break;
      case 'ArrowLeft':
      case 'a':
        this.keys.left = false;
        break;
      case 'ArrowRight':
      case 'd':
        this.keys.right = false;
        break;
    }
  }
  
  createMissile() {
    // Select a random memecoin
    const coinIndex = Math.floor(Math.random() * this.memecoins.length);
    const coin = this.memecoins[coinIndex];
    
    // Determine missile type (regular, homing, or cluster)
    const missileType = this.determineMissileType(coin);
    
    // Create spawn position based on missile type
    let posX, posZ, posY;
    
    if (missileType === 'homing') {
      // Homing missiles spawn further away
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 20;
      posX = Math.cos(angle) * distance;
      posZ = Math.sin(angle) * distance;
      posY = 20 + Math.random() * 10;
    } else {
      // Regular missiles spawn above the playable area
      posX = (Math.random() - 0.5) * 80;
      posZ = (Math.random() - 0.5) * 80;
      posY = 50 + Math.random() * 10; // Vary height for more natural timing
    }
    
    // Create missile geometry scaled by the coin's size
    const geometry = new THREE.CylinderGeometry(0.5 * coin.size, 0.1 * coin.size, 2 * coin.size, 16);
    
    // Use the preloaded texture or default if not loaded
    let material = this.missileTextures[coin.id] || this.missileTextures['default'];
    
    // Modify material based on missile type
    if (missileType === 'homing') {
      // Homing missiles have a pulsing effect
      material = material.clone();
      material.emissive = new THREE.Color(0xff0000);
      material.emissiveIntensity = 0.8;
    } else if (missileType === 'cluster') {
      // Cluster missiles have a different color
      material = material.clone();
      material.emissive = new THREE.Color(0xffaa00);
      material.emissiveIntensity = 0.6;
    }
    
    // Create the missile mesh
    const missile = new THREE.Mesh(geometry, material);
    missile.position.set(posX, posY, posZ);
    missile.rotation.x = Math.PI / 2; // Point downward
    missile.castShadow = true;
    
    // Create trail effect
    const trailGeometry = new THREE.ConeGeometry(0.3 * coin.size, 4 * coin.size, 16);
    const trailMaterial = new THREE.MeshBasicMaterial({ 
      color: missileType === 'homing' ? 0xff2222 : (missileType === 'cluster' ? 0xffaa22 : 0xff0000),
      transparent: true,
      opacity: 0.6
    });
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.position.y = 2 * coin.size; // Position behind the missile
    trail.rotation.x = Math.PI; // Point upward
    
    // Add particle emitter for the trail
    const particles = new THREE.Group();
    missile.add(particles);
    missile.userData.particles = particles;
    missile.userData.particleTimer = 0;
    
    // Create text label with coin name
    const textDiv = document.createElement('div');
    textDiv.className = 'missile-label';
    textDiv.style.position = 'absolute';
    textDiv.style.color = missileType === 'homing' ? 'red' : (missileType === 'cluster' ? 'orange' : 'white');
    textDiv.style.fontSize = '12px';
    textDiv.style.fontWeight = 'bold';
    textDiv.style.textShadow = '1px 1px 1px black';
    textDiv.style.userSelect = 'none';
    textDiv.style.pointerEvents = 'none';
    textDiv.textContent = `${coin.symbol}: ${coin.percentChange24h.toFixed(2)}% ${missileType === 'homing' ? '(HOMING)' : (missileType === 'cluster' ? '(CLUSTER)' : '')}`;
    document.body.appendChild(textDiv);
    
    missile.add(trail);
    this.scene.add(missile);
    
    // Calculate initial velocity based on missile type
    const velocity = {
      x: 0, 
      y: -coin.fallSpeed * (missileType === 'homing' ? 0.8 : 1), 
      z: 0
    };
    
    // Add some horizontal movement for more dynamic missiles
    if (missileType !== 'homing') {
      velocity.x = (Math.random() - 0.5) * 2;
      velocity.z = (Math.random() - 0.5) * 2;
    }
    
    // Store missile data
    this.missiles.push({
      mesh: missile,
      coin: coin,
      collider: new THREE.Box3().setFromObject(missile),
      velocity: velocity,
      label: textDiv,
      type: missileType,
      age: 0,
      rotationSpeed: (Math.random() - 0.5) * 2, // Random rotation
      nextTrailTime: 0
    });
    
    // Add memecoin name to missile mesh as user data
    missile.userData = { 
      name: coin.name, 
      symbol: coin.symbol, 
      percent: coin.percentChange24h,
      type: missileType
    };
  }
  
  determineMissileType(coin) {
    // Determine missile type based on coin properties
    const rand = Math.random();
    
    // Very negative coins have a higher chance to be special
    const negativeFactor = Math.abs(coin.percentChange24h) / 50; // Normalize to roughly 0-1 range
    
    if (coin.percentChange24h < -30 && rand < 0.8) {
      // Highly negative coins are more likely to be homing
      return 'homing';
    } else if (coin.percentChange24h < -20 && rand < 0.4) {
      // Moderately negative coins have a chance to be cluster bombs
      return 'cluster';
    } else if (rand < 0.05 + (negativeFactor * 0.1)) {
      // Small chance for any missile to be homing
      return 'homing';
    } else if (rand < 0.15 + (negativeFactor * 0.15)) {
      // Slightly higher chance for cluster
      return 'cluster';
    }
    
    return 'regular';
  }
  
  updateMissiles(deltaTime) {
    // Create new missiles at intervals
    const now = Date.now();
    if (now - this.lastMissileTime > this.missileInterval) {
      this.createMissile();
      this.lastMissileTime = now;
      
      // Dynamic difficulty adjustment based on player skill and flow zone
      this.adjustDifficulty();
    }
    
    // Update existing missiles
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const missile = this.missiles[i];
      missile.age += deltaTime;
      
      // Update missile position based on velocity
      missile.mesh.position.x += missile.velocity.x * deltaTime;
      missile.mesh.position.y += missile.velocity.y * deltaTime;
      missile.mesh.position.z += missile.velocity.z * deltaTime;
      
      // Calculate distance to player for near miss detection
      const distanceToPlayer = missile.mesh.position.distanceTo(this.player.position);
      
      // Apply custom behavior based on missile type
      if (missile.type === 'homing') {
        this.updateHomingMissile(missile, deltaTime);
      } else {
        // Add some wind effect to regular missiles
        missile.velocity.x += (Math.random() - 0.5) * 0.1;
        missile.velocity.z += (Math.random() - 0.5) * 0.1;
        
        // Limit horizontal velocity
        const maxHorizontalSpeed = 3;
        const horizSpeed = Math.sqrt(missile.velocity.x * missile.velocity.x + missile.velocity.z * missile.velocity.z);
        if (horizSpeed > maxHorizontalSpeed) {
          const scale = maxHorizontalSpeed / horizSpeed;
          missile.velocity.x *= scale;
          missile.velocity.z *= scale;
        }
      }
      
      // Create trail particles
      if (missile.age > missile.nextTrailTime) {
        this.createMissileTrailParticle(missile);
        missile.nextTrailTime = missile.age + 0.05; // Create particles every 50ms
      }
      
      // Apply rotation
      missile.mesh.rotation.z += missile.rotationSpeed * deltaTime;
      
      // Update missile collider
      missile.collider.setFromObject(missile.mesh);
      
      // Update label position
      if (missile.label) {
        const screenPosition = this.worldToScreen(missile.mesh.position);
        missile.label.style.left = `${screenPosition.x}px`;
        missile.label.style.top = `${screenPosition.y - 20}px`; // Offset to position above missile
        
        // Hide label if missile is behind camera
        const isBehindCamera = this.camera.position.z < missile.mesh.position.z;
        missile.label.style.display = isBehindCamera ? 'none' : 'block';
      }
      
      // Check if missile hit the ground
      if (missile.mesh.position.y < 0) {
        // Create impact effect
        this.createImpactEffect(missile.mesh.position, missile.coin.size, missile.type);
        
        // Play impact sound
        if (this.sounds.impact) {
          const impactSound = this.sounds.impact.cloneNode();
          impactSound.volume = Math.min(0.4, missile.coin.size / 5);
          this.playSound(impactSound);
        }
        
        // For cluster missiles, create smaller fragments
        if (missile.type === 'cluster') {
          this.createClusterFragments(missile);
        }
        
        // Increment dodge counter and update player skill for successful dodge
        this.coinsDodged++;
        this.consecutiveAvoids++;
        
        // Check for streak and provide feedback
        this.handleDodgeStreak();
        
        // Remove missile
        this.scene.remove(missile.mesh);
        if (missile.label) {
          document.body.removeChild(missile.label);
        }
        this.missiles.splice(i, 1);
        continue;
      }
      
      // Detect near misses (exciting moments that increase engagement)
      if (distanceToPlayer < 3 && distanceToPlayer > 1) {
        if (!missile.hasTriggeredNearMiss && missile.mesh.position.y > 0) {
          this.handleNearMiss();
          missile.hasTriggeredNearMiss = true;
        }
      }
      
      // Check if missile is out of bounds
      const bounds = 100;
      if (
        missile.mesh.position.x < -bounds || 
        missile.mesh.position.x > bounds || 
        missile.mesh.position.z < -bounds || 
        missile.mesh.position.z > bounds || 
        missile.mesh.position.y > 100
      ) {
        // Remove missile without effect
        this.scene.remove(missile.mesh);
        if (missile.label) {
          document.body.removeChild(missile.label);
        }
        this.missiles.splice(i, 1);
        continue;
      }
      
      // Check collision with player
      if (missile.collider.intersectsBox(this.playerCollider)) {
        console.log(`Player hit by ${missile.coin.name} (-${Math.abs(missile.coin.percentChange24h)}%)`);
        this.handlePlayerHit(missile);
        
        // Reset consecutive avoids streak on hit
        this.consecutiveAvoids = 0;
        
        // Remove missile
        this.scene.remove(missile.mesh);
        if (missile.label) {
          document.body.removeChild(missile.label);
        }
        this.missiles.splice(i, 1);
      }
    }
  }
  
  updateHomingMissile(missile, deltaTime) {
    // Calculate direction to player
    const toPlayer = new THREE.Vector3();
    toPlayer.subVectors(this.player.position, missile.mesh.position);
    toPlayer.normalize();
    
    // Calculate homing strength based on missile age
    const homingStrength = Math.min(missile.age * 0.5, 3); // Gradually increases up to a max
    
    // Update velocity with homing behavior
    missile.velocity.x += toPlayer.x * homingStrength * deltaTime;
    missile.velocity.z += toPlayer.z * homingStrength * deltaTime;
    
    // Add small vertical acceleration for more dynamic movement
    missile.velocity.y += (toPlayer.y - 1) * homingStrength * deltaTime; // -1 to keep downward bias
    
    // Limit maximum speed
    const maxSpeed = missile.coin.fallSpeed * 1.5;
    const speed = Math.sqrt(
      missile.velocity.x * missile.velocity.x + 
      missile.velocity.y * missile.velocity.y + 
      missile.velocity.z * missile.velocity.z
    );
    
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      missile.velocity.x *= scale;
      missile.velocity.y *= scale;
      missile.velocity.z *= scale;
    }
    
    // Make missile point in direction of travel
    if (speed > 0.1) {
      const direction = new THREE.Vector3(
        missile.velocity.x, 
        missile.velocity.y, 
        missile.velocity.z
      ).normalize();
      
      // Create a rotation that points the missile in its direction of movement
      missile.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    }
    
    // Pulse the emission for visual effect
    const emissiveFactor = 0.5 + 0.5 * Math.sin(missile.age * 10);
    if (missile.mesh.material.emissiveIntensity !== undefined) {
      missile.mesh.material.emissiveIntensity = 0.5 + 0.5 * emissiveFactor;
    }
  }
  
  createMissileTrailParticle(missile) {
    const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: missile.type === 'homing' ? 0xff2222 : (missile.type === 'cluster' ? 0xffaa22 : 0xff0000),
      transparent: true,
      opacity: 0.8
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // Position at the missile with slight variation
    particle.position.copy(missile.mesh.position);
    particle.position.y += 1; // Position at the back of the missile
    
    // Add some randomness
    particle.position.x += (Math.random() - 0.5) * 0.5;
    particle.position.y += (Math.random() - 0.5) * 0.5;
    particle.position.z += (Math.random() - 0.5) * 0.5;
    
    // Add to scene
    this.scene.add(particle);
    
    // Set up particle decay
    const lifespan = 0.5 + Math.random() * 0.5; // 0.5 to 1 second
    
    // Store fade information
    particle.userData = {
      initialOpacity: 0.8,
      lifespan: lifespan,
      age: 0,
      initialScale: particle.scale.x,
      update: (deltaTime) => {
        particle.userData.age += deltaTime;
        const lifeFactor = 1 - (particle.userData.age / particle.userData.lifespan);
        
        // Fade out opacity
        particle.material.opacity = particle.userData.initialOpacity * lifeFactor;
        
        // Grow slightly
        const scaleFactor = particle.userData.initialScale * (1 + (1 - lifeFactor) * 2);
        particle.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Slow rise
        particle.position.y += 0.5 * deltaTime;
        
        // When particle dies, remove it
        if (particle.userData.age >= particle.userData.lifespan) {
          this.scene.remove(particle);
          return true; // Signal for removal
        }
        return false;
      }
    };
    
    // Add to active particles list
    this.particles.push(particle);
  }
  
  createClusterFragments(missile) {
    const fragmentCount = 5 + Math.floor(Math.random() * 5); // 5-9 fragments
    const fragmentSize = missile.coin.size * 0.4; // Smaller than original
    
    for (let i = 0; i < fragmentCount; i++) {
      // Create fragment geometry
      const geometry = new THREE.SphereGeometry(fragmentSize, 8, 8);
      const material = missile.mesh.material.clone();
      material.emissiveIntensity = 0.3;
      
      const fragment = new THREE.Mesh(geometry, material);
      
      // Position at impact location
      fragment.position.copy(missile.mesh.position);
      fragment.position.y = 0.2; // Slightly above ground
      
      // Add random horizontal velocity
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      const vx = Math.cos(angle) * speed;
      const vz = Math.sin(angle) * speed;
      
      // Calculate vertical velocity for arc trajectory
      const vy = 2 + Math.random() * 3;
      
      this.scene.add(fragment);
      
      // Create fragment trail
      const trail = new THREE.Group();
      fragment.add(trail);
      
      // Add to missiles array
      this.missiles.push({
        mesh: fragment,
        coin: missile.coin,
        collider: new THREE.Box3().setFromObject(fragment),
        velocity: { x: vx, y: vy, z: vz },
        label: null, // No label for fragments
        type: 'fragment',
        age: 0,
        rotationSpeed: (Math.random() - 0.5) * 5,
        nextTrailTime: 0.05
      });
    }
  }
  
  createImpactEffect(position, size, missileType) {
    // Create impact crater
    const craterGeometry = new THREE.CircleGeometry(size / 2, 16);
    const craterMaterial = new THREE.MeshBasicMaterial({ 
      color: missileType === 'homing' ? 0x772222 : (missileType === 'cluster' ? 0x775522 : 0x333333), 
      side: THREE.DoubleSide 
    });
    const crater = new THREE.Mesh(craterGeometry, craterMaterial);
    crater.position.set(position.x, -0.49, position.z);
    crater.rotation.x = -Math.PI / 2;
    this.scene.add(crater);
    
    // Create fade out for crater
    crater.userData = {
      initialOpacity: 1,
      age: 0,
      lifespan: 5, // 5 seconds
      update: (deltaTime) => {
        crater.userData.age += deltaTime;
        if (crater.userData.age > 1) { // Start fading after 1 second
          const fadeProgress = (crater.userData.age - 1) / (crater.userData.lifespan - 1);
          crater.material.opacity = 1 - fadeProgress;
        }
        
        if (crater.userData.age >= crater.userData.lifespan) {
          this.scene.remove(crater);
          return true; // Signal for removal
        }
        return false;
      }
    };
    
    // Add to active effects
    this.effects.push(crater);
    
    // Create explosion effect based on missile type
    const particleCount = missileType === 'homing' ? 40 : (missileType === 'cluster' ? 30 : 20);
    const explosionColor = missileType === 'homing' ? 0xff2222 : (missileType === 'cluster' ? 0xffaa22 : 0xff0000);
    
    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 4, 4);
      const particleMaterial = new THREE.MeshBasicMaterial({ 
        color: explosionColor,
        transparent: true,
        opacity: 0.8
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      // Set random position around impact
      const angle = Math.random() * Math.PI * 2;
      const horizontalDistance = Math.random() * size;
      particle.position.set(
        position.x + Math.cos(angle) * horizontalDistance,
        0.1 + Math.random() * 0.5,  // Start just above ground
        position.z + Math.sin(angle) * horizontalDistance
      );
      
      // Set random velocity
      const speed = 1 + Math.random() * 5;
      particle.userData = {
        velocity: {
          x: Math.cos(angle) * speed * 0.5,
          y: 1 + Math.random() * 3,  // Upward
          z: Math.sin(angle) * speed * 0.5
        },
        age: 0,
        lifespan: 0.5 + Math.random() * 0.5,
        initialOpacity: 0.8,
        initialScale: particle.scale.x,
        update: (deltaTime) => {
          // Update position
          particle.position.x += particle.userData.velocity.x * deltaTime;
          particle.position.y += particle.userData.velocity.y * deltaTime;
          particle.position.z += particle.userData.velocity.z * deltaTime;
          
          // Apply gravity
          particle.userData.velocity.y -= 9.8 * deltaTime;
          
          // Age the particle
          particle.userData.age += deltaTime;
          const lifeFactor = 1 - (particle.userData.age / particle.userData.lifespan);
          
          // Fade out
          particle.material.opacity = particle.userData.initialOpacity * lifeFactor;
          
          // Grow slightly
          const scaleFactor = particle.userData.initialScale * (1 + (1 - lifeFactor));
          particle.scale.set(scaleFactor, scaleFactor, scaleFactor);
          
          // When particle dies or hits ground, remove it
          if (particle.userData.age >= particle.userData.lifespan || particle.position.y < 0) {
            this.scene.remove(particle);
            return true; // Signal for removal
          }
          return false;
        }
      };
      
      this.scene.add(particle);
      this.particles.push(particle);
    }
  }
  
  worldToScreen(position) {
    // Convert 3D position to screen coordinates
    const vector = position.clone();
    vector.project(this.camera);
    
    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vector.y * 0.5 + 0.5) * window.innerHeight
    };
  }
  
  handlePlayerHit(missile) {
    // Reduce health based on missile damage
    const damage = Math.floor(Math.abs(missile.coin.percentChange24h));
    this.health = Math.max(0, this.health - damage);
    
    // Update health bar
    this.ui.healthFill.style.width = `${(this.health / this.maxHealth) * 100}%`;
    
    // Change health bar color based on health level
    if (this.health < 25) {
      this.ui.healthFill.style.backgroundColor = "#f44336"; // Red
    } else if (this.health < 50) {
      this.ui.healthFill.style.backgroundColor = "#ff9800"; // Orange
    } else {
      this.ui.healthFill.style.backgroundColor = "#4CAF50"; // Green
    }
    
    // Check for game over
    if (this.health <= 0) {
      this.endGame();
      return;
    }
    
    // Update hit count
    this.coinsHit++;
    
    // Update score display
    this.ui.score.innerText = `Score: ${Math.floor(this.score)}`;
    
    // Show hit information
    this.ui.lastHit.innerText = `Hit by ${missile.coin.name} (${missile.coin.percentChange24h.toFixed(2)}%) -${damage} HP`;
    this.ui.lastHit.style.opacity = '1';
    
    // Play hit sound
    this.playSound(this.sounds.playerHit);
    
    // Hide hit information after 3 seconds
    setTimeout(() => {
      this.ui.lastHit.style.opacity = '0';
    }, 3000);
    
    // Create a hit effect (red flash)
    const body = this.player.children[0];
    body.material.color.set(0xff0000);
    setTimeout(() => {
      body.material.color.set(0x2194ce);
    }, 200);
    
    // Camera shake effect
    this.cameraShake();
  }
  
  cameraShake() {
    // Store original camera position
    const originalPosition = this.camera.position.clone();
    
    // Shake parameters
    const shakeIntensity = 0.3;
    const shakeDuration = 0.5; // seconds
    const shakeStartTime = Date.now() / 1000;
    
    // Apply shake function
    const applyShake = () => {
      const elapsed = Date.now() / 1000 - shakeStartTime;
      
      if (elapsed < shakeDuration) {
        // Calculate shake factor (decreases over time)
        const shakeFactor = (1 - elapsed / shakeDuration) * shakeIntensity;
        
        // Apply random offset to camera position
        this.camera.position.set(
          originalPosition.x + (Math.random() - 0.5) * 2 * shakeFactor,
          originalPosition.y + (Math.random() - 0.5) * 2 * shakeFactor,
          originalPosition.z + (Math.random() - 0.5) * 0.5 * shakeFactor
        );
        
        // Continue shake on next frame
        requestAnimationFrame(applyShake);
      } else {
        // Reset to original position when done
        this.camera.position.copy(originalPosition);
      }
    };
    
    // Start shaking
    applyShake();
  }
  
  updateScore(deltaTime) {
    // Base score increment
    let scoreIncrement = 1 * deltaTime;
    
    // Apply multiplier during dash
    const multiplier = this.dashDuration > 0 ? 2 : 1;
    scoreIncrement *= multiplier;
    
    // Update score
    this.score += scoreIncrement;
    this.ui.score.innerText = `Score: ${Math.floor(this.score)}`;
    
    // Show multiplier during dash
    if (this.dashDuration > 0) {
      this.ui.multiplier.style.opacity = '1';
    } else {
      this.ui.multiplier.style.opacity = '0';
    }
    
    // Update time display
    const timeRemaining = Math.max(0, this.maxGameTime - this.gameTimer);
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = Math.floor(timeRemaining % 60);
    this.ui.time.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    // Show warning when time is running out
    if (timeRemaining <= 30 && timeRemaining > 0 && Math.floor(timeRemaining) % 5 === 0) {
      if (Math.floor(this.gameTimer * 10) % 10 === 0) { // Only trigger once per second
        this.ui.time.style.color = timeRemaining <= 10 ? "#f44336" : "#ff9800";
        setTimeout(() => {
          this.ui.time.style.color = "#ffffff";
        }, 500);
      }
    }
  }
  
  endGame() {
    this.gameOver = true;
    this.ui.gameOver.style.display = 'flex';
    
    // Update final stats
    this.ui.finalScore.innerText = `Final Score: ${Math.floor(this.score)}`;
    this.ui.coinsDodged.innerText = `Memecoins Dodged: ${this.coinsDodged}`;
    
    // Calculate time survived
    const minutes = Math.floor(this.gameTimer / 60);
    const seconds = Math.floor(this.gameTimer % 60);
    this.ui.timeSurvived.innerText = `Time Survived: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    // Play game over sound
    this.playSound(this.sounds.gameOver);
    
    // Stop background music
    if (this.sounds.background) {
      this.sounds.background.pause();
      this.sounds.background.currentTime = 0;
    }
    
    // Clean up missiles
    this.missiles.forEach(missile => {
      this.scene.remove(missile.mesh);
      if (missile.label) {
        document.body.removeChild(missile.label);
      }
    });
    this.missiles = [];
  }
  
  restartGame() {
    // Reset game state
    this.score = 0;
    this.gameOver = false;
    this.lastMissileTime = 0;
    this.missileInterval = 2000;
    this.gameTimer = 0;
    this.health = this.maxHealth;
    this.coinsDodged = 0;
    this.coinsHit = 0;
    
    // Reset flow state metrics
    this.playerSkillRating = 50;
    this.flowZone = { min: 40, max: 60 };
    this.consecutiveAvoids = 0;
    this.nearMissCount = 0;
    this.currentFlowState = "neutral";
    
    // Reset UI
    this.ui.score.innerText = 'Score: 0';
    this.ui.lastHit.style.opacity = '0';
    this.ui.gameOver.style.display = 'none';
    this.ui.healthFill.style.width = '100%';
    this.ui.healthFill.style.backgroundColor = '#4CAF50';
    this.ui.time.innerText = '3:00';
    this.ui.time.style.color = '#ffffff';
    
    // Reset physics state
    this.playerVelocity = new THREE.Vector3();
    this.playerOnGround = false;
    this.dashDuration = 0;
    this.lastDash = 0;
    
    // Reset player position
    this.player.position.set(0, 0, 0);
    this.playerCollider.setFromObject(this.player);
    this.cameraRig.position.copy(this.player.position);
    
    // Show get ready message
    this.showAlertMessage("Get Ready!", "#4CAF50");
    
    // Restart background music
    this.playSound(this.sounds.background);
    
    // Restart game loop
    this.animate();
  }
  
  animate() {
    if (!this.isInitialized || this.gameOver) return;
    
    requestAnimationFrame(() => this.animate());
    
    // Calculate delta time for smooth animations
    const now = Date.now();
    const deltaTime = Math.min((now - (this.lastTime || now)) / 1000, 0.1); // Cap delta time
    this.lastTime = now;
    
    // Update player
    this.updatePlayer(deltaTime);
    
    // Update missiles
    this.updateMissiles(deltaTime);
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  updateParticles(deltaTime) {
    // Update and remove expired particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      if (particle.userData.update(deltaTime)) {
        this.particles.splice(i, 1);
      }
    }
    
    // Update and remove expired effects
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      if (effect.userData.update(deltaTime)) {
        this.effects.splice(i, 1);
      }
    }
  }
  
  tryDash() {
    const now = Date.now();
    if (now - this.lastDash > this.dashCooldown && this.dashDuration <= 0) {
      this.dashDuration = 0.2; // 0.2 seconds dash
      this.lastDash = now;
      
      // Play dash sound
      this.playSound(this.sounds.dash);
      
      // Create dash effect
      this.createDashEffect();
    }
  }
  
  createDashEffect() {
    // Create particle trail effect for dash
    const particleCount = 15;
    const particles = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x2194ce,
        transparent: true,
        opacity: 0.7
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      // Position slightly behind player
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 1,
        0.5 + (Math.random() * 1.5),
        0.2 + (Math.random() * 0.5)
      );
      particle.position.copy(this.player.position).add(offset);
      
      particles.add(particle);
    }
    
    this.scene.add(particles);
    
    // Remove after 0.5 seconds
    setTimeout(() => {
      this.scene.remove(particles);
    }, 500);
  }
  
  updatePlayer(deltaTime) {
    // Apply gravity
    if (!this.playerOnGround) {
      this.playerVelocity.y -= this.gravity * deltaTime;
    }
    
    // Check if player is on ground
    if (this.player.position.y <= 0) {
      this.playerOnGround = true;
      this.player.position.y = 0;
      this.playerVelocity.y = 0;
    }
    
    // Handle dash cooldown UI
    const dashCooldownRemaining = (this.lastDash + this.dashCooldown - Date.now()) / 1000;
    if (dashCooldownRemaining > 0) {
      // Update dash button UI to show cooldown
      const dashButton = document.getElementById('dash-button');
      dashButton.textContent = `DASH\n${dashCooldownRemaining.toFixed(1)}s`;
      dashButton.style.opacity = '0.5';
    } else {
      // Reset dash button UI
      const dashButton = document.getElementById('dash-button');
      dashButton.textContent = 'DASH';
      dashButton.style.opacity = '1';
    }
    
    // Handle dash
    let dashFactor = 1;
    if (this.dashDuration > 0) {
      dashFactor = this.dashSpeed / 5; // Dash multiplier
      this.dashDuration -= deltaTime;
      
      // Create motion blur effect during dash
      if (Math.random() > 0.5) {
        this.createDashEffect();
      }
    }
    
    // Base movement speed
    const speed = 5.0 * dashFactor;
    
    // Create movement vector
    const moveVector = new THREE.Vector3(0, 0, 0);
    
    // Apply keyboard controls to movement vector
    if (this.keys.forward) moveVector.z -= speed;
    if (this.keys.backward) moveVector.z += speed;
    if (this.keys.left) moveVector.x -= speed;
    if (this.keys.right) moveVector.x += speed;
    
    // Normalize movement vector for consistent speed in diagonals
    if (moveVector.length() > 0) {
      moveVector.normalize().multiplyScalar(speed);
    }
    
    // Apply movement based on facing direction
    this.player.position.x += moveVector.x * deltaTime;
    this.player.position.z += moveVector.z * deltaTime;
    
    // Apply y velocity (jumping/falling)
    this.player.position.y += this.playerVelocity.y * deltaTime;
    
    // Apply touch controls
    if (this.touchControls.active) {
      const touchSensitivity = 0.05 * dashFactor;
      this.player.position.x += this.touchControls.moveX * touchSensitivity * deltaTime;
      // Fix inverted controls: change from -= to += to make joystick up move player forward
      this.player.position.z += this.touchControls.moveY * touchSensitivity * deltaTime;
    }
    
    // Update player rotation based on movement
    if (moveVector.length() > 0) {
      // Calculate target rotation based on movement direction
      const targetRotation = Math.atan2(moveVector.x, moveVector.z);
      
      // Smoothly interpolate current rotation to target rotation
      let currentRotation = this.player.rotation.y;
      let newRotation = currentRotation;
      
      // Find the shortest path to the target rotation
      const diff = targetRotation - currentRotation;
      const rotDiff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
      
      // Apply smooth rotation
      newRotation += rotDiff * 10 * deltaTime;
      this.player.rotation.y = newRotation;
      
      // Animate legs while moving
      const legSpeed = 10 * dashFactor;
      const legAmplitude = 0.3;
      
      // Animate left and right legs in opposite phases
      this.player.children[4].rotation.x = Math.sin(this.gameTimer * legSpeed) * legAmplitude;
      this.player.children[5].rotation.x = Math.sin(this.gameTimer * legSpeed + Math.PI) * legAmplitude;
      
      // Animate arms
      this.player.children[2].rotation.x = Math.sin(this.gameTimer * legSpeed + Math.PI) * legAmplitude * 0.5;
      this.player.children[3].rotation.x = Math.sin(this.gameTimer * legSpeed) * legAmplitude * 0.5;
    } else {
      // Reset leg animations when not moving
      this.player.children[4].rotation.x = 0;
      this.player.children[5].rotation.x = 0;
      this.player.children[2].rotation.x = 0;
      this.player.children[3].rotation.x = 0;
    }
    
    // Limit player to playable area
    this.player.position.x = Math.max(Math.min(this.player.position.x, 40), -40);
    this.player.position.z = Math.max(Math.min(this.player.position.z, 40), -40);
    
    // Update player collider
    this.playerCollider.setFromObject(this.player);
    
    // Update camera rig to follow player with smooth damping
    const cameraTargetPos = new THREE.Vector3(
      this.player.position.x,
      this.player.position.y + 2, // Keep camera slightly above player
      this.player.position.z
    );
    
    this.cameraRig.position.lerp(cameraTargetPos, 5 * deltaTime);
    
    // Update score and UI
    this.updateScore(deltaTime);
    
    // Game timer update with flow state pause/resume
    if (!this.gameOver) {
      this.gameTimer += deltaTime;
      
      // End game when time runs out
      if (this.gameTimer >= this.maxGameTime) {
        this.endGame();
      }
    }
  }
  
  // New methods for flow state management
  
  adjustDifficulty() {
    // Calculate current game difficulty (0-100 scale)
    const baseDifficulty = 100 - ((this.missileInterval - 300) / 1700) * 100;
    
    // Adjust difficulty based on flow zone
    if (this.currentFlowState === "boredom") {
      // Player finding it too easy - increase challenge
      this.missileInterval = Math.max(this.missileInterval - 100, 300);
      
      // Maybe spawn an additional missile or homing missile
      if (Math.random() < 0.3) {
        setTimeout(() => this.createMissile(), 500);
      }
    } 
    else if (this.currentFlowState === "anxiety") {
      // Player struggling - ease back slightly
      this.missileInterval = Math.min(this.missileInterval + 50, 2000);
    }
    else if (this.currentFlowState === "flow") {
      // Player in flow state - maintain with slight random variations
      this.missileInterval += (Math.random() - 0.5) * 100;
      this.missileInterval = Math.max(Math.min(this.missileInterval, 1500), 500);
    }
    
    // Periodically update player skill rating and flow state
    const now = Date.now();
    if (now - this.lastPerformanceUpdate > this.performanceUpdateInterval) {
      this.updatePlayerSkillRating();
      this.updateFlowState(baseDifficulty);
      this.lastPerformanceUpdate = now;
    }
  }
  
  updatePlayerSkillRating() {
    // Calculate performance metrics
    const dodgeRate = this.coinsDodged / Math.max(this.coinsDodged + this.coinsHit, 1);
    const healthFactor = this.health / this.maxHealth;
    const nearMissFactor = Math.min(this.nearMissCount / 5, 1); // Cap at 5 near misses
    
    // Calculate new skill rating (0-100)
    let skillChange = 0;
    
    // Reward consistent dodging
    skillChange += dodgeRate * 5;
    
    // Reward maintaining health
    skillChange += healthFactor * 3;
    
    // Reward playing on the edge (near misses)
    skillChange += nearMissFactor * 2;
    
    // Penalize for taking hits
    const recentHits = this.coinsHit > 0 ? 1 : 0;
    skillChange -= recentHits * 5;
    
    // Apply changes gradually
    this.playerSkillRating = Math.max(Math.min(
      this.playerSkillRating + skillChange,
      100
    ), 0);
    
    // Adapt flow zone based on player skill
    this.flowZone.min = Math.max(this.playerSkillRating - 15, 10);
    this.flowZone.max = Math.min(this.playerSkillRating + 15, 90);
    
    // Reset near miss counter for next evaluation period
    this.nearMissCount = 0;
  }
  
  updateFlowState(currentDifficulty) {
    // Determine flow state based on challenge-skill balance
    if (currentDifficulty < this.flowZone.min) {
      this.currentFlowState = "boredom";
      console.log("Player state: BOREDOM - increasing challenge");
    } 
    else if (currentDifficulty > this.flowZone.max) {
      this.currentFlowState = "anxiety";
      console.log("Player state: ANXIETY - decreasing challenge");
    }
    else {
      this.currentFlowState = "flow";
      console.log("Player state: FLOW - maintaining challenge");
      
      // If player has been in flow state for a while, slowly expand their skill
      this.flowZone.max = Math.min(this.flowZone.max + 1, 95);
    }
    
    // Visually indicate flow state (subtle visual cue)
    if (this.currentFlowState === "flow") {
      // Add subtle glow effect to player when in flow state
      this.player.children[0].material.emissive = new THREE.Color(0x0066ff);
      this.player.children[0].material.emissiveIntensity = 0.3;
    } else {
      // Reset glow
      this.player.children[0].material.emissive = new THREE.Color(0x000000);
      this.player.children[0].material.emissiveIntensity = 0;
    }
  }
  
  handleDodgeStreak() {
    // Provide rewarding feedback for successful dodging streaks
    if (this.consecutiveAvoids === 5) {
      this.showAlertMessage("Great dodging!", "#4CAF50");
      this.score += 50; // Bonus points
    } 
    else if (this.consecutiveAvoids === 10) {
      this.showAlertMessage("Impressive streak!", "#2196F3");
      this.score += 100; // Bigger bonus
    }
    else if (this.consecutiveAvoids === 15) {
      this.showAlertMessage("UNSTOPPABLE!", "#9C27B0");
      this.score += 200; // Huge bonus
      
      // Make player temporarily invulnerable as reward
      const body = this.player.children[0];
      body.material.transparent = true;
      body.material.opacity = 0.7;
      
      setTimeout(() => {
        body.material.transparent = false;
        body.material.opacity = 1;
      }, 3000);
    }
    else if (this.consecutiveAvoids >= 20 && this.consecutiveAvoids % 10 === 0) {
      // For very long streaks, give escalating rewards
      this.showAlertMessage("LEGENDARY DODGER!", "#FF9800");
      this.score += 300;
      
      // Spawn a bonus health pickup
      if (this.health < this.maxHealth) {
        this.createHealthPickup();
      }
    }
  }
  
  handleNearMiss() {
    // Track near misses for flow state calculation
    this.nearMissCount++;
    
    // Apply subtle time slowdown effect for dramatic moments
    const slowdownFactor = 0.7;
    const originalTimeScale = 1;
    const slowdownDuration = 500; // ms
    
    // Apply time dilation effect (slow down missiles)
    this.missiles.forEach(missile => {
      missile.velocity.x *= slowdownFactor;
      missile.velocity.y *= slowdownFactor;
      missile.velocity.z *= slowdownFactor;
    });
    
    // Reset time scale after duration
    setTimeout(() => {
      this.missiles.forEach(missile => {
        missile.velocity.x /= slowdownFactor;
        missile.velocity.y /= slowdownFactor;
        missile.velocity.z /= slowdownFactor;
      });
    }, slowdownDuration);
    
    // Add subtle visual feedback
    const vignette = document.createElement('div');
    vignette.style.position = 'fixed';
    vignette.style.top = '0';
    vignette.style.left = '0';
    vignette.style.width = '100%';
    vignette.style.height = '100%';
    vignette.style.boxShadow = 'inset 0 0 100px rgba(255,0,0,0.3)';
    vignette.style.pointerEvents = 'none';
    vignette.style.zIndex = '1000';
    vignette.style.opacity = '0';
    vignette.style.transition = 'opacity 0.2s ease-in-out';
    document.body.appendChild(vignette);
    
    // Fade in then out
    setTimeout(() => { vignette.style.opacity = '1'; }, 0);
    setTimeout(() => { 
      vignette.style.opacity = '0'; 
      setTimeout(() => {
        document.body.removeChild(vignette);
      }, 200);
    }, 300);
    
    // Small score bonus for risky play
    this.score += 5;
  }
  
  createHealthPickup() {
    // Create health pickup as a reward for skilled play
    const pickupGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const pickupMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4CAF50,
      emissive: 0x4CAF50,
      emissiveIntensity: 0.5
    });
    
    const pickup = new THREE.Mesh(pickupGeometry, pickupMaterial);
    
    // Position it randomly but not too far from player
    const angle = Math.random() * Math.PI * 2;
    const distance = 5 + Math.random() * 10;
    pickup.position.set(
      this.player.position.x + Math.cos(angle) * distance,
      1,
      this.player.position.z + Math.sin(angle) * distance
    );
    
    this.scene.add(pickup);
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(1, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    pickup.add(glow);
    
    // Animation
    pickup.userData = {
      type: 'healthPickup',
      collider: new THREE.Box3().setFromObject(pickup),
      update: (deltaTime) => {
        // Hovering animation
        pickup.position.y = 1 + Math.sin(Date.now() / 500) * 0.2;
        pickup.rotation.y += deltaTime * 2;
        glow.scale.setScalar(1 + Math.sin(Date.now() / 300) * 0.1);
        
        // Update collider
        pickup.userData.collider.setFromObject(pickup);
        
        // Check collision with player
        if (pickup.userData.collider.intersectsBox(this.playerCollider)) {
          // Heal player
          this.health = Math.min(this.health + 20, this.maxHealth);
          
          // Update health bar
          this.ui.healthFill.style.width = `${(this.health / this.maxHealth) * 100}%`;
          
          // Feedback
          this.showAlertMessage("Health +20!", "#4CAF50");
          
          // Remove pickup
          this.scene.remove(pickup);
          return true; // Signal for removal
        }
        
        // Remove after 15 seconds
        if (pickup.userData.age > 15) {
          this.scene.remove(pickup);
          return true;
        }
        
        // Age the pickup
        pickup.userData.age = (pickup.userData.age || 0) + deltaTime;
        
        return false;
      }
    };
    
    // Add to effects array to update
    this.effects.push(pickup);
  }
}

// Create game instance
const game = new MemecoinDodgeGame(); 