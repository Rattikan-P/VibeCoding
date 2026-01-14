# Architecture - Zen Port: Color Flow

---

## Core Pattern

**State-Based Rendering** - The UI is a direct reflection of the game state.

---

## Complete State Structure

```javascript
const gameState = {
  phase: 'menu' | 'playing' | 'win' | 'gameover',

  grid: [
    [null, {color: 'red', id: 1}, {color: 'blue', id: 2}],
    [{color: 'green', id: 3}, null, {color: 'yellow', id: 4}],
    // ... more rows (4x4 for MVP)
  ],

  waitingZone: [
    {color: 'red', id: 1},
    {color: 'blue', id: 2},
    // ... up to 5 cars
  ],

  passengerColor: 'red',  // Current requirement

  stats: {
    moves: 0,
    matches: 0,
    carsRemaining: 8
  }
};
```

### Car Object Structure
```javascript
{
  color: string,    // 'red', 'blue', 'green', 'yellow'
  id: number        // Unique identifier
}
```

---

## Core Algorithms

### Blocking Detection Algorithm

**The Puzzle Core**: A car can move only if the vertical path below it is completely clear.

```javascript
function canMoveCar(row, col) {
  // Check all cells below this car
  for (let r = row + 1; r < GRID_ROWS; r++) {
    if (grid[r][col] !== null) {
      return false;  // Path blocked by another car
    }
  }
  return true;  // Path clear to exit
}
```

**Visual Example**:
```
Row 0: [Red]    [Blue]   ← Both can move (paths clear)
Row 1: [Empty]  [Empty]

Row 0: [Green]  [Yellow]  ← Yellow blocked by Green
Row 1: [Green]  [Empty]

Row 0: [Purple]           ← Blocked by two cars below
Row 1: [Red]
Row 2: [Blue]
Row 3: [Empty]            ← Exit direction (bottom)
```

### Matching Logic

```javascript
function checkMatch(carColor) {
  return carColor === passengerColor;
}

function removeMatchingCars(matchingColor) {
  // Remove all matching cars from waiting zone
  waitingZone = waitingZone.filter(car => car.color !== matchingColor);

  // Generate new passenger color
  generateNewPassengerColor();

  // Update stats
  stats.matches++;
}
```

---

## Function Architecture

### Game Logic Layer
**Pure functions** that manipulate state but never touch DOM.

```javascript
// Initialization
function initGame()
function initGrid()
function generateNewPassengerColor()

// Movement & Rules
function canMoveCar(row, col)
function moveCarToWaitingZone(row, col)
function checkMatch(carColor)
function removeMatchingCars(color)

// Game State
function checkWinCondition()
function checkGameOverCondition()
```

### Rendering Layer
**Functions that build UI from current state**.

```javascript
function render() {
  renderPhase();        // Menu, Playing, Win, Game Over
  renderGrid();         // Parking lot
  renderWaitingZone();  // 5 slots
  renderPassengerQueue(); // Current color requirement
  renderStats();        // Moves, matches
}
```

**Key Principle**: Never manually update DOM elements. Always re-render from current state.

### Input Layer
**Event handlers** that call game logic functions.

```javascript
function handleGridClick(row, col)
function handleStartClick()
function handleRestartClick()
```

---

## Event Flow (Detailed)

```
1. Player clicks car at [row][col]
   ↓
2. handleGridClick(row, col) invoked
   ↓
3. Check: Is game in 'playing' phase?
   ↓
4. Check: canMoveCar(row, col)?
   ↓
5a. If BLOCKED:
   - Trigger shake animation
   - Show visual "blocked" feedback
   - Do NOT change game state
   ↓
5b. If CLEAR:
   - Move car to waiting zone
   - Set grid[row][col] = null
   - Increment move counter
   ↓
6. Check: Does car color match passenger?
   ↓
7a. If MATCH:
   - Remove all matching cars from waiting zone
   - Generate new passenger color
   - Trigger "satisfaction" visual feedback
   ↓
7b. If NO MATCH:
   - Car stays in waiting zone
   - No special feedback
   ↓
8. Check Win Condition:
   - Is grid completely empty?
   - If yes: Set phase = 'win'
   ↓
9. Check Game Over Condition:
   - Is waitingZone.length >= 5?
   - If yes: Set phase = 'gameover'
   ↓
10. Trigger render()
   - Rebuild entire UI from new state
   - Apply CSS transitions for smooth updates
```

---

## Component Rendering Strategy

### Grid Rendering
```javascript
function renderGrid() {
  const container = document.getElementById('grid-container');
  container.innerHTML = '';

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';

      const car = grid[row][col];
      if (car) {
        cell.classList.add('car', car.color);

        // Visual indicator if blocked
        if (!canMoveCar(row, col)) {
          cell.classList.add('blocked');
        }

        cell.onclick = () => handleGridClick(row, col);
      }

      container.appendChild(cell);
    }
  }
}
```

### Waiting Zone Rendering
```javascript
function renderWaitingZone() {
  const container = document.getElementById('waiting-zone');
  container.innerHTML = '';

  // Show all 5 slots
  for (let i = 0; i < 5; i++) {
    const slot = document.createElement('div');
    slot.className = 'waiting-slot';

    if (waitingZone[i]) {
      const car = waitingZone[i];
      slot.classList.add('car', car.color);
    }

    container.appendChild(slot);
  }

  // Capacity indicator
  const indicator = document.createElement('div');
  indicator.className = 'capacity-indicator';
  indicator.textContent = `${waitingZone.length}/5`;
  container.appendChild(indicator);
}
```

### Passenger Queue Rendering
```javascript
function renderPassengerQueue() {
  const container = document.getElementById('passenger-queue');
  container.innerHTML = `
    <div class="passenger-label">Waiting for:</div>
    <div class="passenger-color ${passengerColor}"></div>
    <div class="passenger-name">${capitalize(passengerColor)}</div>
  `;
}
```

---

## Separation of Concerns

| Layer | Responsibility | Rule |
|-------|---------------|------|
| **Game Logic** | State management, rules, conditions | Never touches DOM |
| **Rendering** | DOM manipulation, visual feedback | Never modifies game state directly |
| **Input** | Event handling, user interaction | Only calls logic functions |

**Golden Rule**: Data flows one way: Input → Logic → State → Render → DOM

---

## Performance Considerations

### Why State-Based Rendering?
- **Simplicity**: No manual DOM synchronization
- **Correctness**: UI always matches state
- **Performance**: Modern browsers handle DOM updates efficiently for this scale

### Optimizations
- Use CSS transitions for smooth animations (no JS animation loops)
- Limit re-renders to state changes (not every frame)
- Keep grid size reasonable (4x4 or 5x5 maximum)

---

## Scalability Points

| Parameter | Current (MVP) | Can Adjust To |
|-----------|---------------|---------------|
| Grid Size | 4x4 (16 cars) | 5x5, 6x6, or configurable |
| Colors | 4 (red, blue, green, yellow) | 5-6 colors for more challenge |
| Waiting Zone | 5 slots | 4-6 slots to adjust difficulty |
| Passenger Update | After match | Timer-based for more tension |

All of these can be tuned via constants without architecture changes.

---

## CSS Architecture (Planned)

### Color Palette (Pastels)
```css
:root {
  --bg-color: #1a1a2e;
  --red: #ffb3ba;
  --blue: #bae1ff;
  --green: #baffc9;
  --yellow: #ffffba;
  --text-color: #e0e0e0;
}
```

### Layout Structure
```
body
  └─ .game-container
       ├─ .passenger-queue (top)
       ├─ .grid (center)
       └─ .waiting-zone (bottom)
       └─ .stats (overlay)
```

---

## File Structure (Single File)

```
index.html
├─ <style>
│   ├─ Reset & Base Styles
│   ├─ Layout & Positioning
│   ├─ Component Styles (Grid, Waiting Zone, etc.)
│   └─ Animations & Transitions
├─ <body>
│   └─ Container divs for each component
└─ <script>
    ├─ Constants & Config
    ├─ State Variables
    ├─ Game Logic Functions
    ├─ Rendering Functions
    └─ Event Handlers
```

This single-file architecture ensures maximum simplicity and zero build complexity.
