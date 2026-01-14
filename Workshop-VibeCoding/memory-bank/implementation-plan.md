# Implementation Plan - Zen Port: Color Flow

---

## Build Philosophy

**MVP First**: Each phase should be playable before moving to the next.

**Iterate**: Build Phase 0, test it, refine it. Then Phase 1, etc.

**Cut Complexity**: If a feature adds confusion, remove it. The goal is mental relief, not complexity.

---

## Phase 0: Setup (Skeleton)
**Goal**: Basic HTML structure and CSS reset.

**Tasks**:
1. Create single HTML file with `<style>`, `<body>`, `<script>` sections
2. Set up dark theme CSS (background: #1a1a2e)
3. Create container divs for: Grid, Waiting Zone, Passenger Display, Stats
4. Add basic centering layout

**Deliverable**: Blank dark screen with empty containers positioned correctly.

---

## Phase 1: Grid System (The Foundation)
**Goal**: Render clickable grid of colored cars.

**Tasks**:
1. Define grid size constants (start with 4x4 for MVP)
2. Define color palette (4 colors: red, blue, green, yellow in pastel shades)
3. Create `initGrid()` function to populate grid with random cars
4. Implement `renderGrid()` to create div elements from 2D array
5. Add `handleGridClick()` basic event listener
6. Add CSS for car cells (rounded rectangles, pastel colors, hover effects)

**Deliverable**: Interactive 4x4 grid showing colored cars that respond to clicks.

---

## Phase 2: Blocking Logic (The Puzzle)
**Goal**: Implement the core "can this car move?" logic.

**Tasks**:
1. Create `canMoveCar(row, col)` function:
   - Loop from `row + 1` to bottom of grid
   - Return false if any cell contains a car
   - Return true if all cells are null
2. Modify `handleGridClick()`:
   - Check `canMoveCar()` before moving
   - If blocked: Shake animation + visual "blocked" indicator
   - If clear: Proceed to move
3. Add visual feedback for blocked vs. movable cars (opacity or border)
4. Test edge cases (bottom row always movable, top cars often blocked)

**Deliverable**: Grid where only unblocked cars can be clicked successfully, with clear visual feedback.

**Algorithm Detail**:
```javascript
function canMoveCar(row, col) {
  // Check all cells below this car
  for (let r = row + 1; r < GRID_ROWS; r++) {
    if (grid[r][col] !== null) {
      return false;  // Path blocked
    }
  }
  return true;  // Path clear
}
```

---

## Phase 3: Movement & Waiting Zone
**Goal**: Transfer cars from grid to waiting zone.

**Tasks**:
1. Implement `moveCarToWaitingZone(row, col)`:
   - Copy car object to waitingZone array
   - Set grid position to null
   - Trigger render
2. Create `renderWaitingZone()`:
   - Show 5 empty slots
   - Fill slots with waitingZone array contents
   - Add capacity indicator (e.g., "3/5")
3. Add CSS animations for car movement (fade out from grid, fade in to zone)
4. Handle case where waiting zone is full (prevent movement)

**Deliverable**: Clicking unblocked cars moves them to waiting zone with smooth animation.

---

## Phase 4: Passenger System
**Goal**: Add the matching objective.

**Tasks**:
1. Add `passengerColor` to game state
2. Create `renderPassengerQueue()`:
   - Show prominent display of target color
   - Add label: "Waiting for: [COLOR]"
3. Implement `checkMatch(carColor)`:
   - Compare car color with passenger color
4. Create `removeMatchingCars(color)`:
   - Filter waiting zone, removing matching cars
   - Trigger render
5. Generate new passenger color after match

**Deliverable**: Cars matching passenger color immediately clear from waiting zone.

---

## Phase 5: Win/Loss Conditions
**Goal**: Complete game loop with endings.

**Tasks**:
1. Implement `checkWinCondition()`:
   - Check if all grid cells are null
   - Set phase to 'win' if true
2. Implement `checkGameOverCondition()`:
   - Check if waitingZone.length >= 5
   - Set phase to 'gameover' if true
3. Create `renderPhase()`:
   - Show "Start Game" menu
   - Show "Flow Complete!" win screen
   - Show "Waiting Zone Full" game over screen
   - Add "Play Again" button
4. Run condition checks after every move

**Deliverable**: Complete game loop with start, play, win, and loss states.

---

## Phase 6: Polish & Juice
**Goal**: Elevate from functional to delightful.

**Tasks**:
1. **Visual Polish**:
   - Refine pastel color palette for maximum softness
   - Add subtle glows and shadows
   - Ensure high contrast for accessibility
2. **Transitions**:
   - Smooth CSS transitions for all state changes
   - Fade-in/out for screen transitions
   - Scale animations on click
3. **Feedback**:
   - Particle burst or glow on successful match
   - Shake animation on blocked click
   - Progress bar for waiting zone capacity
4. **UX Refinements**:
   - Add move counter
   - Add "How to Play" on start screen
   - Optimize spacing for readability

**Deliverable**: Polished, satisfying game experience matching "zen" aesthetic.

---

## Phase 7: Playtesting & Iteration
**Goal**: Balance and refine based on actual play.

**Tasks**:
1. Playtest multiple sessions
2. Adjust grid size if too easy/hard
3. Tune waiting zone capacity (5 slots might need adjustment)
4. Adjust color count for optimal difficulty
5. Refine timing of passenger color changes
6. Fix any discovered bugs or confusing moments

**Deliverable**: Final, balanced game ready for release.

---

## Open Questions

To be resolved before implementation:

1. **Grid Size**: Start with 4x4? Or different dimension?
2. **Number of Colors**: 4 colors to start, or more?
3. **Passenger Update**: Does passenger change only after match, or on timer too?
4. **Direction**: Cars exit from bottom? Confirmed.
5. **Restart**: Should there be an undo feature, or only full restart? (Recommend: full restart only for MVP)
