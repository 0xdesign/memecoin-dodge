# Scratchpad

## Background and Motivation

This project aims to create an entertaining and engaging web-based 3D game similar to Fortnite but with an educational twist about cryptocurrency markets. Players will navigate a 3D environment while dodging falling rockets that represent memecoins that are currently down in the market. The game will fetch real-time market data for the top 100 memecoins by market cap once during development, providing an interactive way for users to learn about cryptocurrency market trends while having fun.

The game will be mobile-first, ensuring that it's easy to control and experience on an iPhone, making it accessible to a wider audience.

---

## Key Challenges and Analysis

1. **Three.js Implementation**
   - Setting up a performant 3D environment that works well on both desktop and mobile devices
   - Implementing suitable camera controls and character movement
   - Creating visually appealing graphics while maintaining good performance

2. **Data Integration**
   - Fetching memecoin market data from the provided API once during development
   - Hardcoding the obtained data into the game
   - Structuring the data for efficient use in the game mechanics

3. **Mobile-First Experience**
   - Ensuring responsive design that works well on iPhone screens
   - Implementing touch controls that are intuitive and responsive
   - Optimizing performance for mobile devices with limited resources

4. **Game Mechanics**
   - Creating a balanced difficulty level that's challenging but not frustrating
   - Implementing collision detection between player and falling rockets
   - Designing an intuitive control scheme that works across devices

5. **Visual Design**
   - Creating recognizable memecoin representations as missiles
   - Implementing visual effects like trailing red streaks for falling coins
   - Designing a UI that presents market information clearly without cluttering the game experience

---

## Verifiable Success Criteria

1. The game successfully incorporates data for the top 100 memecoins by market cap from the specified API (fetched once during development)
2. The 3D environment renders correctly on both desktop and mobile devices
3. Player character can be controlled intuitively using keyboard (on desktop) and touch (on mobile)
4. Falling memecoin missiles accurately represent tokens that are down in the market with appropriate visual effects
5. Collision detection works properly - player can successfully dodge missiles
6. Game performs at a minimum of 30 FPS on mid-range mobile devices
7. The game clearly communicates which memecoins are represented by the missiles
8. The controls are intuitive enough that they don't require explicit instructions

---

## High-level Task Breakdown

### 1. Project Setup and Environment Configuration
- [ ] Initialize a new web project with appropriate build tools (Vite or Next.js)
- [ ] Set up Three.js and necessary dependencies
- [ ] Configure development environment with hot reloading
- [ ] Set up basic HTML/CSS structure with responsive design
- [ ] Success criteria: Working development environment with Three.js rendering a basic scene

### 2. API Data Fetching and Integration
- [ ] Install the specified API client: `npx -y @smithery/cli@latest install @pwh-pwh/coin-mcp-server --client cursor --key 83df37fc-1845-46f1-a8ed-38c94f9fe268`
- [ ] Fetch data for top 100 memecoins by market cap once
- [ ] Filter for coins that are down in the last 24 hours
- [ ] Store the data in a structured format in the codebase (hardcode)
- [ ] Success criteria: Static JSON data file with memecoin information incorporated into the project

### 3. Basic 3D Scene Creation
- [ ] Initialize Three.js scene, camera, and renderer
- [ ] Implement responsive canvas sizing
- [ ] Create basic environment (ground, skybox)
- [ ] Set up lighting
- [ ] Success criteria: Rendering a visually appealing 3D environment that resizes properly on different devices

### 4. Player Character Implementation
- [ ] Design and create a simple player character model or use an existing asset
- [ ] Implement character controller for keyboard input (desktop)
- [ ] Implement touch controls for mobile devices
- [ ] Add character animations (idle, running)
- [ ] Success criteria: Character can be controlled smoothly using both keyboard and touch controls

### 5. Memecoin Missile System
- [ ] Create missile models with customizable textures for different memecoins
- [ ] Implement system to spawn missiles based on the hardcoded market data
- [ ] Add visual effects (red trailing streaks)
- [ ] Implement physics for falling missiles
- [ ] Success criteria: Missiles visually represent memecoins and fall from the sky with appropriate effects

### 6. Collision Detection and Game Logic
- [ ] Implement collision detection between player and missiles
- [ ] Add scoring system
- [ ] Create game states (start, play, game over)
- [ ] Implement difficulty progression
- [ ] Success criteria: Player can dodge missiles and game responds appropriately to collisions

### 7. UI and Information Display
- [ ] Design and implement HUD showing relevant game information
- [ ] Create info panels showing memecoin market data
- [ ] Add start screen and game over screen
- [ ] Implement UI controls for mobile
- [ ] Success criteria: UI clearly presents game information and market data without hindering gameplay

### 8. Performance Optimization
- [ ] Implement level-of-detail system for complex models
- [ ] Optimize rendering pipeline
- [ ] Add performance monitoring
- [ ] Test and optimize for mobile devices
- [ ] Success criteria: Game runs at minimum 30 FPS on target devices

### 9. Testing and Refinement
- [ ] Conduct cross-browser testing
- [ ] Perform mobile device testing
- [ ] Gather user feedback on controls and difficulty
- [ ] Make adjustments based on testing and feedback
- [ ] Success criteria: Game plays smoothly across different browsers and devices with positive user feedback

### 10. Final Polishing and Deployment
- [ ] Add sound effects and background music
- [ ] Implement final visual polishing
- [ ] Optimize assets for production
- [ ] Deploy to hosting platform
- [ ] Success criteria: Game is publicly accessible with all features working as intended

---

## Project Status Board

### 🎯 To Do
- Final testing across devices
- Optimize performance for lower-end devices
- Deploy final product

### 🏃 In Progress
- Enhanced gameplay and physics mechanics

### ✅ Done
- Initialize project setup and environment configuration
  - Created project structure with Vite and Three.js
  - Implemented basic 3D scene with ground and lighting
  - Set up player character with basic movement controls
  - Added mobile touch controls
  - Implemented responsive canvas sizing
- Create API service and integrate memecoin data
  - Created mock data for memecoins with appropriate properties
  - Structured data for efficient use in game mechanics
- Implement memecoin missile system
  - Created missile models with customizable sizing based on coin data
  - Added visual effects (red trailing streaks)
  - Implemented physics for falling missiles
  - Added collision detection with player
  - Added impact effects when missiles hit the ground
- Enhance player character model and controls
  - Improved player character with separate body and head
  - Added rotation based on movement direction
  - Limited player to playable area
- Design and implement UI elements
  - Added score display
  - Added last hit information
  - Added game over screen with final score
  - Added restart button
- Add collision detection and game logic
  - Implemented missile-player collision detection
  - Added scoring system
  - Created game states (start, play, game over)
  - Implemented difficulty progression
- Further enhance player character model and animations
  - Improved player character appearance with limbs
  - Added rotation animations based on movement
- Optimize performance
  - Implemented level-of-detail system
  - Added fog for improved performance at distance
  - Capped delta time for consistent physics
  - Added labels that hide when off-screen
- Add sound effects
  - Added background music
  - Added missile impact sounds
  - Added player hit sounds
  - Added game over sound
- Create project documentation
  - Added comprehensive README.md with game details
  - Included development instructions
  - Added credits and license information
- Enhanced gameplay physics and mechanics
  - Added jump and gravity mechanics
  - Implemented dash ability with cooldown
  - Created dynamic camera follow with smooth transitions
  - Added health system
  - Implemented homing and cluster missiles
  - Created particle effects and explosion visuals
  - Enhanced UI with health bar and time display
  - Added loading screen with progress bar
  - Improved mobile controls with dedicated jump/dash buttons
- Created GitHub repository
  - Initialized Git repository
  - Created appropriate .gitignore file
  - Pushed project to GitHub at https://github.com/0xdesign/memecoin-dodge

### 🚧 Blocked

- None

### 📝 Notes

- Added jump and dash mechanics dramatically improve gameplay
- Health system creates better balance and progression
- Various missile types add strategic depth
- Enhanced visuals with particle effects make the game more engaging
- Improved UI elements enhance player feedback

### Executor's Feedback or Assistance Requests

I've made significant enhancements to the Memecoin Dodge game, focusing on physics and gameplay improvements:

1. **Enhanced Physics System:**
   - Added realistic jumping with gravity
   - Implemented dash ability with cooldown
   - Created smooth player movement with proper acceleration/deceleration
   - Added camera shake effects on impact

2. **Advanced Missile Mechanics:**
   - Created different missile types (regular, homing, cluster)
   - Implemented missile trails with particle effects
   - Added dynamic missile behaviors based on memecoin properties
   - Created explosion effects with physics-based particles

3. **Improved Player Experience:**
   - Added health system with visual health bar
   - Implemented game timer with countdown
   - Created score multiplier system during dash
   - Added intuitive mobile controls for jump and dash

4. **Visual and Audio Enhancements:**
   - Added particle effects for player movement and impacts
   - Implemented environmental details (clouds, terrain variations)
   - Added sound effects for all player actions
   - Created visual feedback for player status (low health, multipliers)

5. **UI Improvements:**
   - Added loading screen with progress bar
   - Implemented in-game alerts and notifications
   - Enhanced game over screen with detailed stats
   - Improved mobile UI layout for better touch interaction

The game now provides a much more engaging and dynamic experience with strategic elements that complement the educational aspect of learning about memecoins that are down in the market.

The current limitation is that we're using mock data instead of live API data due to API connectivity issues, but the game design allows for easy integration of real-time data once the API issues are resolved.

The game is now ready for testing and refinement before final deployment.

I've successfully created a GitHub repository for the project at https://github.com/0xdesign/memecoin-dodge. The repository contains all the necessary files with appropriate .gitignore settings to exclude node_modules, build files, and other unnecessary items. The repository is public and includes a descriptive README.md file that explains the game's concept, features, and development instructions.

## Lessons

### User Specified Lessons

* Include info useful for debugging in the program output.
* Read the file before you try to edit it.
* If there are vulnerabilities that appear in the terminal, run npm audit before proceeding
* Always ask before using the -force git command

### Cursor learned
