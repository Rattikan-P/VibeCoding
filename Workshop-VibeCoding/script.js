// Game Configuration
const ALL_COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];
const COLOR_CLASS_PREFIX = 'color-';
const PASSENGER_CLASS_PREFIX = 'passenger-color-';

// Game State
let gameState = {
level: 1,
grid: [],
initialGrid: null,
gridSize: { rows: 6, cols: 6 },
colors: [],
waitingZoneSize: 5,
waitingZone: [],
passenger: '',
nextPassenger: '',
// Passenger queue: exact count of passengers matching cars on grid
passengerQueue: [],
status: 'playing',
match: 0,
moves: 0,
isProcessingMatch: false,
// Track which slots are currently matching (prevents DOM recreation)
matchingSlots: [],
// Track the highest level the player has ever cleared (0 = none, 1 = Level 1, etc.)
maxLevelCleared: 0
};

// Load/Save Progress
function loadProgress() {
const savedMaxCleared = localStorage.getItem('zenPortMaxLevelCleared');
if (savedMaxCleared) {
const parsed = parseInt(savedMaxCleared);
if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
gameState.maxLevelCleared = parsed;
}
}
}

function saveProgress() {
localStorage.setItem('zenPortMaxLevelCleared', gameState.maxLevelCleared.toString());
}

// Level Configuration
function getLevelConfig(level) {
if (level >= 1 && level <= 3) {
return {
gridSize: { rows: 4, cols: 4 },
colors: ALL_COLORS.slice(0, 3),
fillPercent: 0.75,
waitingZoneSize: 5
};
} else if (level >= 4 && level <= 6) {
return {
gridSize: { rows: 5, cols: 5 },
colors: ALL_COLORS.slice(0, 4),
fillPercent: 0.80,
waitingZoneSize: 5
};
} else if (level >= 7 && level <= 9) {
const fillPercent = Math.min(0.82 + ((level - 7) * 0.02), 0.90);
return {
gridSize: { rows: 6, cols: 6 },
colors: ALL_COLORS.slice(0, 4),
fillPercent: fillPercent,
waitingZoneSize: 5
};
} else {
return {
gridSize: { rows: 7, cols: 7 },
colors: ALL_COLORS.slice(0, 5),
fillPercent: 0.90,
waitingZoneSize: 5
};
}
}

// Toggle Theme
function toggleMode() {
const body = document.body;
body.classList.toggle('light-theme');
const isLight = body.classList.contains('light-theme');
sessionStorage.setItem('zenPortTheme', isLight ? 'light' : 'dark');
}

// Load theme from session storage
function loadTheme() {
const savedTheme = sessionStorage.getItem('zenPortTheme');
if (savedTheme === 'light') {
document.body.classList.add('light-theme');
}
}

// Count Remaining Cars on Grid
function countRemainingCars() {
let count = 0;
for (let row = 0; row < gameState.gridSize.rows; row++) {
for (let col = 0; col < gameState.gridSize.cols; col++) {
if (gameState.grid[row][col] !== null) {
count++;
}
}
}
return count;
}

// Create Passenger Queue - exact count of passengers matching cars on grid
function createPassengerQueue() {
const colorCounts = {};

// Count cars by color in grid
for (let row = 0; row < gameState.gridSize.rows; row++) {
for (let col = 0; col < gameState.gridSize.cols; col++) {
const color = gameState.grid[row][col];
if (color) {
colorCounts[color] = (colorCounts[color] || 0) + 1;
}
}
}

// Create queue with exact passenger counts
const queue = [];
for (const color in colorCounts) {
for (let i = 0; i < colorCounts[color]; i++) {
queue.push(color);
}
}

// Shuffle queue for randomness
for (let i = queue.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[queue[i], queue[j]] = [queue[j], queue[i]];
}

return queue;
}

// Initialize Game
function initGame() {
const config = getLevelConfig(gameState.level);

// Update max level reached
if (gameState.level > gameState.maxLevelReached) {
gameState.maxLevelReached = gameState.level;
saveProgress();
}

gameState.grid = [];
gameState.gridSize = config.gridSize;
gameState.colors = config.colors;
gameState.waitingZoneSize = config.waitingZoneSize;
gameState.waitingZone = Array(config.waitingZoneSize).fill(null);
gameState.passenger = '';
gameState.nextPassenger = '';
gameState.passengerQueue = [];
gameState.matchingSlots = [];
gameState.status = 'playing';
gameState.moves = 0;
gameState.match = 0; // Reset match to 0

// Create grid
for (let row = 0; row < config.gridSize.rows; row++) {
gameState.grid[row] = [];
for (let col = 0; col < config.gridSize.cols; col++) {
if (Math.random() < config.fillPercent) {
gameState.grid[row][col] = config.colors[Math.floor(Math.random() * config.colors.length)];
} else {
gameState.grid[row][col] = null;
}
}
}

ensureSolvability();
gameState.initialGrid = gameState.grid.map(row => [...row]);

// Create passenger queue with exact car counts
gameState.passengerQueue = createPassengerQueue();
generatePassenger();

// Reset preview passenger opacity for new level
const nextPassengerIcon = document.getElementById('nextPassengerIcon');
if (nextPassengerIcon) {
nextPassengerIcon.style.opacity = '1';
}

// CRITICAL: Check if initial passenger matches any cars in waiting zone
// This ensures matching works from the start
setTimeout(() => {
checkForMatch();
}, 300); // Let everything render first

// Show Boss Level popup alert when entering Level 10
if (gameState.level === 10) {
console.log('Level 10 detected! Triggering boss popup...');
triggerBossPopup();
}

render();
}

// Ensure Solvability
function ensureSolvability() {
const config = getLevelConfig(gameState.level);
const colorCounts = {};
config.colors.forEach(color => colorCounts[color] = 0);

for (let row = 0; row < gameState.gridSize.rows; row++) {
for (let col = 0; col < gameState.gridSize.cols; col++) {
const color = gameState.grid[row][col];
if (color) {
colorCounts[color]++;
}
}
}

config.colors.forEach(color => {
if (colorCounts[color] === 0) {
for (let row = 0; row < gameState.gridSize.rows; row++) {
for (let col = 0; col < gameState.gridSize.cols; col++) {
if (gameState.grid[row][col] === null) {
gameState.grid[row][col] = color;
return;
}
}
}
}
});
}

// Get Available Colors
function getAvailableColors() {
const availableColors = new Set();

for (let row = 0; row < gameState.gridSize.rows; row++) {
for (let col = 0; col < gameState.gridSize.cols; col++) {
if (gameState.grid[row][col]) {
availableColors.add(gameState.grid[row][col]);
}
}
}

for (let i = 0; i < gameState.waitingZone.length; i++) {
if (gameState.waitingZone[i]) {
availableColors.add(gameState.waitingZone[i]);
}
}

return Array.from(availableColors);
}

// Generate Passenger - pull from queue (exact car-passenger count)
function generatePassenger() {
// Pull current passenger from queue
if (!gameState.passenger && gameState.passengerQueue.length > 0) {
gameState.passenger = gameState.passengerQueue.shift();
}

// Peek at next passenger without removing from queue
if (gameState.passengerQueue.length > 0) {
gameState.nextPassenger = gameState.passengerQueue[0];
} else {
gameState.nextPassenger = '';
}

// Render the new passenger state
render();
}

// Check if Car is Blocked (bottom-up)
function isCarBlocked(row, col) {
for (let r = row + 1; r < gameState.gridSize.rows; r++) {
if (gameState.grid[r][col] !== null) {
return true;
}
}
return false;
}

// Move Car to Waiting Zone
function moveCarToWaitingZone(row, col) {
// GLOBAL INPUT LOCK: Prevent clicks during match animation
if (gameState.isProcessingMatch) {
return false;
}

if (isCarBlocked(row, col)) {
return false;
}

const emptySlotIndex = gameState.waitingZone.findIndex(slot => slot === null);
if (emptySlotIndex === -1) {
return false;
}

const carColor = gameState.grid[row][col];
gameState.grid[row][col] = null;
gameState.waitingZone[emptySlotIndex] = carColor;
gameState.moves++;

render();
checkGameEnd();

// DELAY: Minimal delay for instant slot entry feel
setTimeout(() => {
checkForMatch();
}, 50); // Instant slot entry - 50ms for smooth transition

return true;
}

// Check for Match (with perfectly synchronized exit)
function checkForMatch() {
if (gameState.isProcessingMatch) {
return;
}

const matchIndex = gameState.waitingZone.findIndex(car => car === gameState.passenger);

if (matchIndex !== -1) {
gameState.isProcessingMatch = true;

// CRITICAL FIX: Track this slot as matching to prevent DOM recreation
gameState.matchingSlots.push(matchIndex);

// Immediately clear the slot to prevent double-trigger/blinking
// The DOM element will still exist and animate, but the data is cleared
const matchedColor = gameState.waitingZone[matchIndex];
gameState.waitingZone[matchIndex] = null;
gameState.match++;

const slotElement = document.querySelectorAll('.slot')[matchIndex];
const carElement = slotElement?.querySelector('.slot-car');
const currentPassengerSlot = document.getElementById('currentPassengerSlot');

if (carElement && currentPassengerSlot) {
// PHASE 1: Highlight car with gold pulse (passenger glow stays active)
carElement.classList.add('match-ready');

// PHASE 2: Wait 0.35s - both car and passenger (with glow) stay fully visible
// SNAPPY DELAY: Faster gameplay feel
setTimeout(() => {
// PHASE 3: Start simultaneous fade-out - car and passenger depart together
slotElement.classList.add('matching');
currentPassengerSlot.classList.add('departing');

// PHASE 4: Wait for fade-out animation (0.65s) to complete
setTimeout(() => {
// Remove this slot from matching tracking
gameState.matchingSlots = gameState.matchingSlots.filter(idx => idx !== matchIndex);

// Auto-forward: Compact the waiting zone by shifting all cars to the front
compactWaitingZone();

// Transition: Pull next passenger from queue
gameState.passenger = '';
generatePassenger();

// Remove animation classes after fade-out completes
slotElement.classList.remove('matching');
currentPassengerSlot.classList.remove('departing');

// Trigger walking animation for new current passenger
triggerPassengerSlideIn();

// Small delay before render to allow walking animation to start
setTimeout(() => {
render();
checkGameEnd();
}, 100);

// CRITICAL: Check if new passenger matches any car in waiting lane
// This ensures automatic clearing continues with new passenger
setTimeout(() => {
gameState.isProcessingMatch = false; // Unlock input AFTER passenger arrives
checkForMatch();
}, 300); // 100ms render delay + 200ms to let passenger fully arrive
}, 650); // Fade-out animation duration (0.65s)
}, 350); // SNAPPY: Visibility delay reduced to 0.35s for faster gameplay
} else {
gameState.isProcessingMatch = false;
gameState.matchingSlots = gameState.matchingSlots.filter(idx => idx !== matchIndex);
}
}
}

// Compact Waiting Zone - Shift all cars to fill gaps
function compactWaitingZone() {
// Filter out null values and pad with null at the end
const cars = gameState.waitingZone.filter(car => car !== null);
gameState.waitingZone = [...cars, ...Array(gameState.waitingZoneSize - cars.length).fill(null)];
}

// Check Win/Lose
function checkWinCondition() {
// Grid must be empty
for (let row = 0; row < gameState.gridSize.rows; row++) {
for (let col = 0; col < gameState.gridSize.cols; col++) {
if (gameState.grid[row][col] !== null) {
return false;
}
}
}

// Waiting zone must be empty
for (let i = 0; i < gameState.waitingZone.length; i++) {
if (gameState.waitingZone[i] !== null) {
return false;
}
}

// Passenger queue must be empty (all passengers served)
if (gameState.passengerQueue.length > 0 || gameState.passenger) {
return false;
}

return true;
}

function checkLoseCondition() {
const isFull = gameState.waitingZone.every(slot => slot !== null);

if (isFull) {
const hasMatch = gameState.waitingZone.some(car => car === gameState.passenger);
return !hasMatch;
}

return false;
}

function checkGameEnd() {
if (checkWinCondition()) {
gameState.status = 'won';
showLevelCompleteScreen();
} else if (checkLoseCondition()) {
gameState.status = 'lost';
showGameOverScreen();
}
}

// Show Screens
function showLevelCompleteScreen() {
// Update maxLevelCleared if this is a new highest level
if (gameState.level > gameState.maxLevelCleared && gameState.level < 10) {
gameState.maxLevelCleared = gameState.level;
saveProgress();
}

if (gameState.level === 10) {
// Show Victory Screen
document.getElementById('victoryScreen').classList.remove('hidden');
triggerConfetti();
} else {
// Show Level Complete Screen (levels 1-9)
const levelCompleteScreen = document.getElementById('levelCompleteScreen');
const levelCompleteNumber = document.getElementById('levelCompleteNumber');
const levelCompleteStats = document.getElementById('levelCompleteStats');
const levelCompleteButtons = document.getElementById('levelCompleteButtons');

// Update level number
levelCompleteNumber.textContent = gameState.level;

// Update stats
levelCompleteStats.textContent = `Match: ${gameState.match} | Moves: ${gameState.moves}`;

// Build buttons HTML with new layout
let buttonsHTML = '';

// Primary: Next Level button (only if level < 10)
if (gameState.level < 10) {
buttonsHTML += `<button class="level-complete-btn primary" onclick="nextLevel()">Next Level →</button>`;
}

// Secondary row: Previous and Retry
buttonsHTML += `<div class="secondary-buttons-row">`;

// Previous Level button (only if level > 1)
if (gameState.level > 1) {
buttonsHTML += `<button class="level-complete-btn secondary" onclick="previousLevel()">← Prev</button>`;
}

// Retry Level button
buttonsHTML += `<button class="level-complete-btn secondary" onclick="restartLevel()">↻ Retry</button>`;

buttonsHTML += `</div>`;

// Set buttons HTML
levelCompleteButtons.innerHTML = buttonsHTML;

// Show screen
levelCompleteScreen.classList.remove('hidden');
}
}

function showGameOverScreen() {
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverScore = document.getElementById('gameOverScore');
const gameOverMatch = document.getElementById('gameOverMatch');

// Update game over screen content
gameOverScore.textContent = `The parking lane is full!`;
gameOverMatch.textContent = gameState.match.toString();

// Show game over screen
gameOverScreen.classList.remove('hidden');
}

function playAgain() {
// Reset to Level 1
gameState.level = 1;
gameState.maxLevelCleared = 0;
saveProgress();

document.getElementById('victoryScreen').classList.add('hidden');
initGame();
}

function triggerConfetti() {
const colors = ['#ea4335', '#4285f4', '#34a853', '#fbbc05', '#673ab7'];

for (let i = 0; i < 100; i++) {
setTimeout(() => {
const confetti = document.createElement('div');
confetti.className = 'confetti';
confetti.style.left = Math.random() * 100 + 'vw';
confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

document.body.appendChild(confetti);

setTimeout(() => {
confetti.remove();
}, 4000);
}, i * 20);
}
}

// Navigation
function nextLevel() {
// Only allow if current level is cleared (level <= maxLevelCleared)
if (gameState.level < 10 && gameState.level <= gameState.maxLevelCleared) {
document.getElementById('levelCompleteScreen').classList.add('hidden');
gameState.level++;
initGame();
}
}

function previousLevel() {
// Allow going back if Level > 1
if (gameState.level > 1) {
document.getElementById('levelCompleteScreen').classList.add('hidden');
gameState.level--;
initGame();
}
}

function restartLevel() {
// Hide all end screens (Game Over, Victory, Level Complete)
document.getElementById('gameOverScreen').classList.add('hidden');
document.getElementById('victoryScreen').classList.add('hidden');
document.getElementById('levelCompleteScreen').classList.add('hidden');

// Reset all game states
gameState.grid = gameState.initialGrid.map(row => [...row]);
gameState.waitingZone = Array(gameState.waitingZoneSize).fill(null);
gameState.passenger = '';
gameState.nextPassenger = '';
gameState.passengerQueue = createPassengerQueue();
gameState.matchingSlots = [];
gameState.isProcessingMatch = false; // CRITICAL: Reset match processing flag
gameState.status = 'playing';
gameState.moves = 0;
gameState.match = 0; // Reset match to 0

generatePassenger();
render();

// CRITICAL: Check if passenger matches after restart
setTimeout(() => {
checkForMatch();
}, 300);
}

// Render Functions
function render() {
renderGrid();
renderWaitingZone();
renderPassenger();
renderStats();
renderLevelDisplay();
}

function renderGrid() {
const gridElement = document.getElementById('grid');
gridElement.innerHTML = '';

// Use grid-size CSS variable for dynamic grid layout
gridElement.style.setProperty('--grid-size', gameState.gridSize.rows);

for (let row = 0; row < gameState.gridSize.rows; row++) {
for (let col = 0; col < gameState.gridSize.cols; col++) {
const cell = document.createElement('div');
cell.className = 'cell';

const carColor = gameState.grid[row][col];

if (carColor) {
cell.classList.add('has-car');

if (isCarBlocked(row, col)) {
cell.classList.add('blocked');
}

const car = document.createElement('div');
car.className = `car ${COLOR_CLASS_PREFIX}${carColor}`;

// Add wheels
const wheelFrontLeft = document.createElement('div');
wheelFrontLeft.className = 'wheel front-left';
car.appendChild(wheelFrontLeft);

const wheelFrontRight = document.createElement('div');
wheelFrontRight.className = 'wheel front-right';
car.appendChild(wheelFrontRight);

const wheelRearLeft = document.createElement('div');
wheelRearLeft.className = 'wheel rear-left';
car.appendChild(wheelRearLeft);

const wheelRearRight = document.createElement('div');
wheelRearRight.className = 'wheel rear-right';
car.appendChild(wheelRearRight);

// Add headlights
const headlightLeft = document.createElement('div');
headlightLeft.className = 'headlight left';
car.appendChild(headlightLeft);

const headlightRight = document.createElement('div');
headlightRight.className = 'headlight right';
car.appendChild(headlightRight);

cell.appendChild(car);

cell.addEventListener('click', () => {
if (gameState.status === 'playing') {
moveCarToWaitingZone(row, col);
}
});
}

gridElement.appendChild(cell);
}
}
}

function renderWaitingZone() {
const waitingZoneElement = document.getElementById('waitingZone');
const counterElement = document.getElementById('waitingCounter');
waitingZoneElement.innerHTML = '';

const carCount = gameState.waitingZone.filter(car => car !== null).length;
counterElement.textContent = `${carCount}/5`;

for (let i = 0; i < gameState.waitingZoneSize; i++) {
// CRITICAL FIX: Skip rendering if this slot is currently matching
// This prevents DOM recreation during animation, which causes flickering
if (gameState.matchingSlots.includes(i)) {
// Create a placeholder slot that won't be rendered
const placeholder = document.createElement('div');
placeholder.className = 'slot-placeholder';
placeholder.style.display = 'none';
waitingZoneElement.appendChild(placeholder);
continue;
}

const slot = document.createElement('div');
slot.className = 'slot';

const carColor = gameState.waitingZone[i];
if (carColor) {
slot.classList.add('occupied');

// Create car/block icon instead of human icon
const car = document.createElement('div');
car.className = `slot-car ${COLOR_CLASS_PREFIX}${carColor}`;

// Add wheels
const wheelFrontLeft = document.createElement('div');
wheelFrontLeft.className = 'wheel front-left';
car.appendChild(wheelFrontLeft);

const wheelFrontRight = document.createElement('div');
wheelFrontRight.className = 'wheel front-right';
car.appendChild(wheelFrontRight);

const wheelRearLeft = document.createElement('div');
wheelRearLeft.className = 'wheel rear-left';
car.appendChild(wheelRearLeft);

const wheelRearRight = document.createElement('div');
wheelRearRight.className = 'wheel rear-right';
car.appendChild(wheelRearRight);

// Add headlights
const headlightLeft = document.createElement('div');
headlightLeft.className = 'headlight left';
car.appendChild(headlightLeft);

const headlightRight = document.createElement('div');
headlightRight.className = 'headlight right';
car.appendChild(headlightRight);

slot.appendChild(car);
}

waitingZoneElement.appendChild(slot);
}
}

function renderPassenger() {
const passengerIcon = document.getElementById('passengerIcon');
const nextPassengerIcon = document.getElementById('nextPassengerIcon');
const currentPassengerSlot = document.getElementById('currentPassengerSlot');

// Clear previous color classes and animations from current passenger icon and slot
passengerIcon.className = 'passenger-person-icon';
currentPassengerSlot.className = 'passenger-slot primary-slot';

// Apply color class to current passenger icon (for colored shirt) and slot (for glow)
if (gameState.passenger) {
const colorClass = `${PASSENGER_CLASS_PREFIX}${gameState.passenger}`;
passengerIcon.classList.add(colorClass);
currentPassengerSlot.classList.add(colorClass);
}

// Clear and apply color to next passenger icon
nextPassengerIcon.className = 'next-passenger-icon';
const totalRemainingCars = countRemainingCars() + gameState.waitingZone.filter(car => car !== null).length;

if (gameState.nextPassenger && totalRemainingCars > 0) {
const colorClass = `${PASSENGER_CLASS_PREFIX}${gameState.nextPassenger}`;
nextPassengerIcon.classList.add(colorClass);
nextPassengerIcon.style.opacity = '1'; // Show preview when cars exist
} else {
// Hide preview when no cars remaining
nextPassengerIcon.style.opacity = '0';
}
}

// Function to trigger slide animation when passenger transitions
function triggerPassengerSlideIn() {
const passengerIcon = document.getElementById('passengerIcon');
const currentPassengerSlot = document.getElementById('currentPassengerSlot');

// Remove and re-add animation class to trigger it
passengerIcon.classList.remove('passenger-slide-in');
currentPassengerSlot.classList.remove('passenger-slide-in');

// Force reflow
void passengerIcon.offsetWidth;

// Add slide animation
passengerIcon.classList.add('passenger-slide-in');
currentPassengerSlot.classList.add('passenger-slide-in');
}

function renderStats() {
document.getElementById('match').textContent = gameState.match;
document.getElementById('remaining').textContent = countRemainingCars();
document.getElementById('moves').textContent = gameState.moves;
}

function renderLevelDisplay() {
const navLevelDisplay = document.getElementById('navLevelDisplay');
navLevelDisplay.textContent = `LVL ${gameState.level}`;

// Update navigation button states
updateNavigationButtons();
}

// Update navigation button states based on maxLevelCleared logic
function updateNavigationButtons() {
const prevBtn = document.getElementById('navPrevBtn');
const nextBtn = document.getElementById('navNextBtn');

// PREV Button: Only enabled if Level > 1
prevBtn.disabled = gameState.level <= 1;

// NEXT Button Logic (Max Level Cleared):
// - If on Level 10: Show MAX and disable permanently
// - Otherwise: Check if current level <= maxLevelCleared
if (gameState.level >= 10) {
// Level 10: Show MAX and disable permanently
nextBtn.textContent = 'MAX';
nextBtn.disabled = true;
} else {
// Levels 1-9: Show NEXT
nextBtn.textContent = 'NEXT →';

// Disabled if currentLevel > maxLevelCleared (haven't beaten current level yet)
// Enabled if currentLevel <= maxLevelCleared (have beaten this level before)
nextBtn.disabled = gameState.level > gameState.maxLevelCleared;
}
}

// Show BOSS Alert Overlay
function showBossAlert() {
const overlay = document.getElementById('bossAlertOverlay');
overlay.style.display = 'flex';

setTimeout(() => {
overlay.classList.add('fade-out');
setTimeout(() => {
overlay.style.display = 'none';
overlay.classList.remove('fade-out');
}, 500);
}, 2000);
}

// Trigger Boss Level Popup Alert
function triggerBossPopup() {
const popup = document.getElementById('bossLevelPopup');

if (!popup) {
console.error('Boss popup element not found!');
return;
}

console.log('Showing Boss Level popup!');

// Reset and show the popup with animation
popup.classList.remove('hidden');
popup.classList.remove('show');

// Force reflow to restart animation
void popup.offsetWidth;

// Add show class to trigger animation
popup.classList.add('show');

// Hide after 2.5 seconds
setTimeout(() => {
console.log('Hiding Boss Level popup');
popup.classList.remove('show');
popup.classList.add('hidden');
}, 2500);
}

// Start
loadProgress();
loadTheme();

function showWelcomeScreen() {
document.getElementById('welcomeScreen').classList.remove('hidden');
}

function startGame() {
document.getElementById('welcomeScreen').classList.add('hidden');
initGame();
}

showWelcomeScreen();
