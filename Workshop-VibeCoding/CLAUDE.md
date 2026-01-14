# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Zen Port: Color Flow** is a minimalist web-based puzzle game built as a single-file HTML/CSS/JS application. The game is a "Smart Parking" puzzle where players manage a docking area by matching colored cars with passenger needs.

### Core Game Mechanics

- **Grid Lot**: Cars of various colors parked in a grid
- **Color Matching**: Move cars from the grid to a "Waiting Zone" (5 slots) to match the current passenger's color requirement
- **Limited Space**: The Waiting Zone has only 5 slots. If it fills completely, the game ends
- **Success**: Clear the entire lot to win

## Development Commands

### Running the Game
Open `index.html` directly in a web browser - no build process or server required.

### Testing
Test on multiple browsers (Chrome, Firefox, Edge, Safari) and both desktop/mobile viewports.

## Code Architecture

The game is a **single-file web application** (index.html containing HTML/CSS/JS) organized into 6 major components:

### Component Overview

1. **Game State Manager**: Central state object containing:
   - `gridState`: 2D array representing the parking lot
   - `waitingZone`: Array of up to 5 cars currently docked
   - `currentPassenger`: Object with color requirement
   - `gameStatus`: 'playing' | 'won' | 'lost'
   - `score`: Number of cars successfully cleared

2. **Grid System**: Manages parking lot and car movement
   - Uses 2D array with coordinate system for blocking detection
   - Event delegation on grid container for performance
   - Renders cars as colored DOM elements

3. **Waiting Zone Manager**: Manages 5-slot docking area
   - Tracks slot availability
   - Handles car addition and removal
   - Compares colors with passenger requirement

4. **Passenger System**: Generates and displays color requirements
   - Validates that generated color exists in grid (keeps game winnable)
   - Displays current passenger visually
   - Generates new passenger after successful matches

5. **Game Loop Controller**: Orchestrates game flow
   - Processes car movements
   - Checks win condition (grid empty)
   - Checks lose condition (waiting zone full, no matches possible)

6. **UI/Feedback System**: Visual feedback to player
   - Highlights movable vs blocked cars
   - Animates movements and matches
   - Displays end screens

### Key Design Decisions

- **Single central state object**: Single source of truth prevents bugs
- **2D array for grid**: Simplifies blocking detection (check path from car to edge)
- **Event delegation**: Better performance than individual listeners
- **CSS over Canvas**: Better accessibility, easier responsive design

### Critical Logic: Blocking Detection

A car can only move if there's a clear path to the grid edge. The blocking algorithm checks from the car's position to the nearest edge, ensuring no other cars block the path.

## Development Approach

### Planning First
**Always enter PLAN MODE** before writing code.** When planning features, address:

1. **Blocked Cars**: How to track and handle cars that are blocked by other cars
2. **State Management**: How to handle "Passenger Queue" vs. "Waiting Zone"
3. **UI/UX**: Minimalist layout with soft pastel colors, smooth transitions, dark mode background

### MVP Mindset
- Build the smallest playable version before adding polish
- If a feature makes the game more confusing, remove it
- Prioritize the player's "feel" over complex backend features
- Keep UI text simple and code logic clean

### Aesthetic Principles
- Soft pastel colors
- Smooth transitions and animations
- Dark mode background
- Clean, uncluttered interface to reduce mental load

## Memory Bank

Detailed project documentation is stored in `memory-bank/`:
- `game-design-document.md`: Core feeling, fantasy, target players
- `tech-stack.md`: Rationale for vanilla JS/HTML/CSS single-file approach
- `architecture.md`: Detailed component breakdown and data flow
- `implementation-plan.md`: 5-phase development roadmap
- `progress.md`: Development status and checklist
