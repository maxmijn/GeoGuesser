// ==================== CONFIGURATION ====================
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWF4bWlqbiIsImEiOiJjbWoxa2pmYnUwanQyM2VzYjFjOHl6cW5xIn0.LS3snE9DmmIjNE46Nv-oMQ';

// ==================== THEME MANAGEMENT ====================
const THEME_KEY = 'geoguess-theme';
let snowInterval = null;

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'christmas') {
    document.body.classList.add('christmas');
    startSnowfall();
  }
  
  // Set up theme toggle button
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  const isChristmas = document.body.classList.toggle('christmas');
  localStorage.setItem(THEME_KEY, isChristmas ? 'christmas' : 'default');
  
  if (isChristmas) {
    startSnowfall();
    playThemeSound();
  } else {
    stopSnowfall();
  }
}

function startSnowfall() {
  const container = document.getElementById('snow-container');
  if (!container) return;
  
  // Clear existing snowflakes
  container.innerHTML = '';
  
  // Snowflake characters
  const snowflakes = ['❄', '❅', '❆', '✻', '✼', '❉', '✿', '•'];
  
  // Create initial batch of snowflakes
  for (let i = 0; i < 50; i++) {
    createSnowflake(container, snowflakes, true);
  }
  
  // Continuously add new snowflakes
  snowInterval = setInterval(() => {
    if (document.body.classList.contains('christmas')) {
      createSnowflake(container, snowflakes, false);
      // Limit snowflakes to prevent performance issues
      const flakes = container.querySelectorAll('.snowflake');
      if (flakes.length > 100) {
        flakes[0].remove();
      }
    }
  }, 200);
}

function createSnowflake(container, snowflakes, initialBatch) {
  const flake = document.createElement('div');
  flake.className = 'snowflake';
  flake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
  
  // Random horizontal position
  flake.style.left = `${Math.random() * 100}%`;
  
  // Random size
  const size = 0.5 + Math.random() * 1.5;
  flake.style.fontSize = `${size}rem`;
  
  // Random opacity
  flake.style.opacity = 0.3 + Math.random() * 0.7;
  
  // Random animation duration (slower = more realistic)
  const duration = 8 + Math.random() * 12;
  flake.style.animationDuration = `${duration}s`;
  
  // For initial batch, start at random vertical positions
  if (initialBatch) {
    const startY = Math.random() * 100;
    flake.style.top = `${startY}vh`;
    flake.style.animationDelay = `-${Math.random() * duration}s`;
  }
  
  container.appendChild(flake);
  
  // Remove snowflake after animation
  setTimeout(() => {
    if (flake.parentNode) {
      flake.remove();
    }
  }, duration * 1000 + 1000);
}

function stopSnowfall() {
  if (snowInterval) {
    clearInterval(snowInterval);
    snowInterval = null;
  }
  const container = document.getElementById('snow-container');
  if (container) {
    container.innerHTML = '';
  }
}

function playThemeSound() {
  // Optional: Add a subtle jingle sound when switching to Christmas theme
  // Uncomment below and add a sound file if desired
  /*
  const audio = new Audio('./sounds/jingle.mp3');
  audio.volume = 0.3;
  audio.play().catch(() => {});
  */
}

// Password hashes (SHA-256) - actual passwords are NOT stored in code!
// Each password loads a different quiz from ./data/{quizId}/quiz.json
const QUIZ_PASSWORDS = {
  'e5a32e4aa10c11407bb87b67b2bdcc4f563e30b8f44c68f1547428f007292732': 'bashchristmas',
  'b2e59516753c04c4d910791c73d581143765e4db182a5441d6af3f523f0f282a': 'kerst2025',
};

// Player colors palette
const PLAYER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#82E0AA', // Green
  '#F8B500', // Orange
  '#E056FD', // Pink
];

// ==================== GAME STATE ====================
let players = [];
let currentPlayerIndex = 0;
let currentPhotoIndex = 0;
let quizData = [];
let roundGuesses = []; // Stores guesses for current round
let currentQuizPath = ''; // Path to quiz data folder (set after password validation)

// Map instances
let quizMap = null;
let resultsMap = null;
let currentGuessMarker = null;
let guessCoordinates = null;

// ==================== DOM ELEMENTS ====================
const elements = {
  // Screens
  passwordScreen: document.getElementById('password-screen'),
  setupScreen: document.getElementById('setup-screen'),
  quizScreen: document.getElementById('quiz-screen'),
  resultsScreen: document.getElementById('results-screen'),
  finalScreen: document.getElementById('final-screen'),
  passOverlay: document.getElementById('pass-overlay'),
  revealOverlay: document.getElementById('reveal-overlay'),
  
  // Password screen
  passwordForm: document.getElementById('password-form'),
  passwordInput: document.getElementById('password-input'),
  passwordError: document.getElementById('password-error'),
  
  // Setup screen
  playersList: document.getElementById('players-list'),
  addPlayerBtn: document.getElementById('add-player-btn'),
  startGameBtn: document.getElementById('start-game-btn'),
  
  // Quiz screen
  photoCounter: document.getElementById('photo-counter'),
  progressBar: document.getElementById('progress-bar'),
  quizPhoto: document.getElementById('quiz-photo'),
  enlargeQuizPhotoBtn: document.getElementById('enlarge-quiz-photo-btn'),
  quizCaption: document.getElementById('quiz-caption'),
  playerTurnBanner: document.getElementById('player-turn-banner'),
  currentPlayerName: document.getElementById('current-player-name'),
  mapContainer: document.getElementById('map'),
  mapHint: document.querySelector('.map-hint'),
  confirmGuessBtn: document.getElementById('confirm-guess-btn'),
  
  // Pass overlay
  nextPlayerDisplay: document.getElementById('next-player-display'),
  readyBtn: document.getElementById('ready-btn'),
  
  // Reveal overlay
  showResultBtn: document.getElementById('show-result-btn'),
  
  // Results screen
  resultsPhotoNum: document.getElementById('results-photo-num'),
  resultsMapContainer: document.getElementById('results-map'),
  answerSection: document.getElementById('answer-section'),
  answerText: document.getElementById('answer-text'),
  viewPhotoBtn: document.getElementById('view-photo-btn'),
  photoModal: document.getElementById('photo-modal'),
  modalPhoto: document.getElementById('modal-photo'),
  closePhotoModal: document.getElementById('close-photo-modal'),
  roundScoresList: document.getElementById('round-scores-list'),
  totalScoresList: document.getElementById('total-scores-list'),
  nextPhotoBtn: document.getElementById('next-photo-btn'),
  
  // Final screen
  podium: document.getElementById('podium'),
  finalScoresList: document.getElementById('final-scores-list'),
  playAgainBtn: document.getElementById('play-again-btn'),
  confettiContainer: document.getElementById('confetti'),
};

// ==================== ACCESS CONTROL ====================
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handlePasswordSubmit(e) {
  e.preventDefault();
  
  const password = elements.passwordInput.value.trim();
  if (!password) {
    showPasswordError('Voer een wachtwoord in.');
    return;
  }
  
  const passwordHash = await hashString(password);
  const quizId = QUIZ_PASSWORDS[passwordHash];
  
  if (!quizId) {
    showPasswordError('Onjuist wachtwoord. Probeer opnieuw.');
    elements.passwordInput.value = '';
    elements.passwordInput.focus();
    return;
  }
  
  // Valid password - set quiz path and continue to setup
  currentQuizPath = `./data/${quizId}/quiz.json`;
  elements.passwordError.textContent = '';
  showScreen('setup');
  addPlayer(); // Add first player input
}

function showPasswordError(message) {
  elements.passwordError.textContent = message;
  elements.passwordError.classList.add('visible');
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', init);

function init() {
  setupEventListeners();
  initTheme();
  // Focus password input on load
  elements.passwordInput.focus();
}

function setupEventListeners() {
  // Password screen
  elements.passwordForm.addEventListener('submit', handlePasswordSubmit);
  
  // Setup screen
  elements.addPlayerBtn.addEventListener('click', addPlayer);
  elements.startGameBtn.addEventListener('click', startGame);
  
  // Quiz screen
  elements.confirmGuessBtn.addEventListener('click', confirmGuess);
  elements.readyBtn.addEventListener('click', playerReady);
  elements.showResultBtn.addEventListener('click', showResult);
  
  // Quiz screen - enlarge photo
  elements.enlargeQuizPhotoBtn.addEventListener('click', () => {
    elements.modalPhoto.src = elements.quizPhoto.src;
    openPhotoModal();
  });
  
  // Results screen
  elements.nextPhotoBtn.addEventListener('click', nextPhoto);
  elements.viewPhotoBtn.addEventListener('click', openPhotoModal);
  elements.closePhotoModal.addEventListener('click', closePhotoModal);
  elements.photoModal.addEventListener('click', (e) => {
    if (e.target === elements.photoModal) closePhotoModal();
  });
  
  // Final screen
  elements.playAgainBtn.addEventListener('click', playAgain);
  
  // Warn user before leaving page during active game
  window.addEventListener('beforeunload', handleBeforeUnload);
}

// Check if game is in progress (past setup screen)
function isGameInProgress() {
  return elements.quizScreen.classList.contains('active') ||
         elements.resultsScreen.classList.contains('active') ||
         elements.passOverlay.classList.contains('active') ||
         elements.revealOverlay.classList.contains('active');
}

// Handle page unload warning
function handleBeforeUnload(e) {
  if (isGameInProgress()) {
    // Standard way to show browser's native dialog
    e.preventDefault();
    // Some browsers require returnValue to be set
    e.returnValue = '';
    return '';
  }
}

// ==================== PLAYER MANAGEMENT ====================
function addPlayer() {
  if (players.length >= 8) return; // Max 8 players
  
  const playerIndex = players.length;
  const player = {
    id: Date.now(),
    name: '',
    color: PLAYER_COLORS[playerIndex],
    totalScore: 0,
  };
  players.push(player);
  
  renderPlayerEntry(player, playerIndex);
  updateStartButton();
  
  // Focus on the new input
  const inputs = elements.playersList.querySelectorAll('.player-name-input');
  if (inputs.length > 0) {
    inputs[inputs.length - 1].focus();
  }
}

function renderPlayerEntry(player, index) {
  const entry = document.createElement('div');
  entry.className = 'player-entry';
  entry.dataset.playerId = player.id;
  
  entry.innerHTML = `
    <div class="player-color-badge" style="background-color: ${player.color}">
      ${index + 1}
    </div>
    <input 
      type="text" 
      class="player-name-input" 
      placeholder="Speler ${index + 1} naam"
      maxlength="20"
      data-player-id="${player.id}"
    >
    <button class="remove-player-btn" data-player-id="${player.id}">×</button>
  `;
  
  elements.playersList.appendChild(entry);
  
  // Event listeners
  const input = entry.querySelector('.player-name-input');
  const removeBtn = entry.querySelector('.remove-player-btn');
  
  input.addEventListener('input', (e) => {
    const playerId = parseInt(e.target.dataset.playerId);
    const playerObj = players.find(p => p.id === playerId);
    if (playerObj) {
      playerObj.name = e.target.value.trim();
    }
    updateStartButton();
  });
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const allInputs = [...elements.playersList.querySelectorAll('.player-name-input')];
      const currentIndex = allInputs.indexOf(e.target);
      if (currentIndex < allInputs.length - 1) {
        allInputs[currentIndex + 1].focus();
      } else {
        addPlayer();
      }
    }
  });
  
  removeBtn.addEventListener('click', () => removePlayer(player.id));
}

function removePlayer(playerId) {
  if (players.length <= 1) return; // Keep at least one player
  
  players = players.filter(p => p.id !== playerId);
  
  // Remove from DOM
  const entry = elements.playersList.querySelector(`[data-player-id="${playerId}"]`);
  if (entry) {
    entry.remove();
  }
  
  // Update colors and numbers
  reindexPlayers();
  updateStartButton();
}

function reindexPlayers() {
  players.forEach((player, index) => {
    player.color = PLAYER_COLORS[index];
  });
  
  // Update DOM
  const entries = elements.playersList.querySelectorAll('.player-entry');
  entries.forEach((entry, index) => {
    const badge = entry.querySelector('.player-color-badge');
    const input = entry.querySelector('.player-name-input');
    badge.style.backgroundColor = PLAYER_COLORS[index];
    badge.textContent = index + 1;
    input.placeholder = `Speler ${index + 1} naam`;
  });
}

function updateStartButton() {
  const hasValidPlayers = players.some(p => p.name.trim().length > 0);
  elements.startGameBtn.disabled = !hasValidPlayers;
}

// ==================== GAME FLOW ====================
async function startGame() {
  // Filter out players without names and give default names
  players = players.filter(p => p.name.trim().length > 0);
  
  if (players.length === 0) return;
  
  // Reset scores
  players.forEach(p => p.totalScore = 0);
  
  // Load quiz data
  try {
    quizData = await loadQuizData();
    if (quizData.length === 0) {
      alert('Geen quiz data gevonden!');
      return;
    }
  } catch (error) {
    console.error('Failed to load quiz data:', error);
    alert('Kon quiz data niet laden. Zorg dat quiz.json in de data map staat.');
    return;
  }
  
  // Initialize game state
  currentPhotoIndex = 0;
  currentPlayerIndex = 0;
  
  // Initialize map
  initQuizMap();
  
  // Switch to quiz screen
  showScreen('quiz');
  showCurrentPhoto();
}

async function loadQuizData() {
  const response = await fetch(currentQuizPath);
  if (!response.ok) {
    throw new Error('Failed to load quiz data');
  }
  return await response.json();
}

function showScreen(screenName) {
  // Hide all screens
  elements.passwordScreen.classList.remove('active');
  elements.setupScreen.classList.remove('active');
  elements.quizScreen.classList.remove('active');
  elements.resultsScreen.classList.remove('active');
  elements.finalScreen.classList.remove('active');
  
  // Show requested screen
  switch (screenName) {
    case 'password':
      elements.passwordScreen.classList.add('active');
      break;
    case 'setup':
      elements.setupScreen.classList.add('active');
      break;
    case 'quiz':
      elements.quizScreen.classList.add('active');
      // Resize map after screen transition
      setTimeout(() => {
        if (quizMap) quizMap.resize();
      }, 100);
      break;
    case 'results':
      elements.resultsScreen.classList.add('active');
      break;
    case 'final':
      elements.finalScreen.classList.add('active');
      break;
  }
}

// ==================== QUIZ SCREEN ====================

// Helper function to hide all text labels on a map
function hideMapLabels(map) {
  try {
    const style = map.getStyle();
    if (!style || !style.layers) return;
    
    style.layers.forEach(layer => {
      // Hide all symbol layers (which contain text labels)
      if (layer.type === 'symbol') {
        try {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        } catch (e) {
          // Skip layers that can't be modified
        }
      }
    });
  } catch (e) {
    console.log('Could not hide labels:', e);
  }
}

// Get the appropriate map style based on current theme
function getMapStyle() {
  const isChristmas = document.body.classList.contains('christmas');
  // Use custom winter style for Christmas, streets for default
  return isChristmas 
    ? 'mapbox://styles/maxmijn/cmj4oe05b00bd01se3bmc7can'
    : 'mapbox://styles/mapbox/streets-v12';
}

function initQuizMap() {
  mapboxgl.accessToken = MAPBOX_TOKEN;
  
  if (quizMap) {
    quizMap.remove();
  }
  
  quizMap = new mapboxgl.Map({
    container: 'map',
    style: getMapStyle(),
    zoom: 1.5,
    center: [0, 20],
    cooperativeGestures: true,
  });
  
  // Disable rotation for simpler UX
  quizMap.dragRotate.disable();
  quizMap.touchZoomRotate.disableRotation();
  
  // Click handler for placing guesses
  quizMap.on('click', handleMapClick);
  
  // Ensure map fills container after load and hide labels
  quizMap.on('load', () => {
    quizMap.resize();
    hideMapLabels(quizMap);
  });
}

function handleMapClick(e) {
  guessCoordinates = [e.lngLat.lng, e.lngLat.lat];
  
  // Remove existing marker
  if (currentGuessMarker) {
    currentGuessMarker.remove();
  }
  
  // Create new marker with player's color
  const currentPlayer = players[currentPlayerIndex];
  const markerEl = createMarkerElement(currentPlayer.color);
  
  currentGuessMarker = new mapboxgl.Marker({ element: markerEl })
    .setLngLat(guessCoordinates)
    .addTo(quizMap);
  
  // Enable confirm button
  elements.confirmGuessBtn.disabled = false;
  elements.mapHint.classList.add('hidden');
}

function createMarkerElement(color, isAnswer = false) {
  const el = document.createElement('div');
  el.className = isAnswer ? 'custom-marker answer-marker' : 'custom-marker';
  el.style.backgroundColor = color;
  return el;
}

function showCurrentPhoto() {
  const photo = quizData[currentPhotoIndex];
  const currentPlayer = players[currentPlayerIndex];
  
  // Reset round guesses for new photo
  if (currentPlayerIndex === 0) {
    roundGuesses = [];
  }
  
  // Update photo display
  elements.quizPhoto.src = photo.image;
  elements.quizCaption.textContent = photo.text;
  
  // Update progress
  elements.photoCounter.textContent = `Foto ${currentPhotoIndex + 1} van ${quizData.length}`;
  elements.progressBar.style.width = `${((currentPhotoIndex) / quizData.length) * 100}%`;
  
  // Update player turn banner
  elements.currentPlayerName.textContent = currentPlayer.name;
  elements.playerTurnBanner.style.backgroundColor = currentPlayer.color;
  
  // Update confirm button color
  elements.confirmGuessBtn.style.backgroundColor = currentPlayer.color;
  
  // Reset map state
  resetMapForNewTurn();
}

function resetMapForNewTurn() {
  // Remove previous guess marker
  if (currentGuessMarker) {
    currentGuessMarker.remove();
    currentGuessMarker = null;
  }
  guessCoordinates = null;
  
  // Reset map view
  if (quizMap) {
    quizMap.flyTo({
      center: [0, 20],
      zoom: 1.5,
      duration: 500,
    });
  }
  
  // Disable confirm button
  elements.confirmGuessBtn.disabled = true;
  elements.mapHint.classList.remove('hidden');
}

function confirmGuess() {
  if (!guessCoordinates) return;
  
  const currentPhoto = quizData[currentPhotoIndex];
  const currentPlayer = players[currentPlayerIndex];
  
  // Calculate distance (points assigned after all players guess)
  const distance = haversineDistance(
    guessCoordinates[1], guessCoordinates[0],
    currentPhoto.lat, currentPhoto.lng
  );
  
  // Store guess (points will be calculated after all players guess)
  roundGuesses.push({
    playerId: currentPlayer.id,
    playerName: currentPlayer.name,
    playerColor: currentPlayer.color,
    coordinates: guessCoordinates,
    distance: distance,
    points: 0, // Will be set after all guesses
  });
  
  // Move to next player or show results
  currentPlayerIndex++;
  
  if (currentPlayerIndex < players.length) {
    // More players need to guess
    showPassOverlay();
  } else {
    // All players have guessed - show reveal overlay
    calculateRoundPoints();
    showRevealOverlay();
  }
}

function calculateRoundPoints() {
  // Find the closest guess(es)
  const minDistance = Math.min(...roundGuesses.map(g => g.distance));
  
  // Award 1 point to player(s) with the closest guess
  roundGuesses.forEach(guess => {
    if (guess.distance === minDistance) {
      guess.points = 1;
      // Update player's total score
      const player = players.find(p => p.id === guess.playerId);
      if (player) {
        player.totalScore += 1;
      }
    }
  });
}

function showPassOverlay() {
  const nextPlayer = players[currentPlayerIndex];
  elements.nextPlayerDisplay.textContent = nextPlayer.name;
  elements.nextPlayerDisplay.style.backgroundColor = nextPlayer.color;
  elements.passOverlay.classList.add('active');
}

function playerReady() {
  elements.passOverlay.classList.remove('active');
  showCurrentPhoto();
}

function showRevealOverlay() {
  elements.revealOverlay.classList.add('active');
}

function showResult() {
  elements.revealOverlay.classList.remove('active');
  showRoundResults();
}

// ==================== RESULTS SCREEN ====================
function showRoundResults() {
  showScreen('results');
  
  const currentPhoto = quizData[currentPhotoIndex];
  elements.resultsPhotoNum.textContent = `Foto ${currentPhotoIndex + 1} van ${quizData.length}`;
  
  // Display answer text if available
  if (currentPhoto.answer) {
    elements.answerText.textContent = currentPhoto.answer;
    elements.answerSection.style.display = 'flex';
  } else {
    elements.answerSection.style.display = 'none';
  }
  
  // Set modal photo source
  elements.modalPhoto.src = currentPhoto.image;
  
  // Initialize results map
  initResultsMap(currentPhoto);
  
  // Show all guesses on map
  setTimeout(() => {
    showAllGuessesOnMap(currentPhoto);
  }, 500);
  
  // Populate score lists
  renderRoundScores();
  renderTotalScores();
  
  // Update next button text
  if (currentPhotoIndex >= quizData.length - 1) {
    elements.nextPhotoBtn.textContent = 'Bekijk Eindstand';
  } else {
    elements.nextPhotoBtn.textContent = 'Volgende Foto';
  }
}

function openPhotoModal() {
  elements.photoModal.classList.add('active');
}

function closePhotoModal() {
  elements.photoModal.classList.remove('active');
}

function initResultsMap(photo) {
  if (resultsMap) {
    resultsMap.remove();
  }
  
  resultsMap = new mapboxgl.Map({
    container: 'results-map',
    style: getMapStyle(),
    zoom: 2,
    center: [photo.lng, photo.lat],
  });
  
  resultsMap.dragRotate.disable();
  resultsMap.touchZoomRotate.disableRotation();
  
  // Hide labels after map loads
  resultsMap.on('load', () => {
    hideMapLabels(resultsMap);
  });
}

function showAllGuessesOnMap(photo) {
  const bounds = new mapboxgl.LngLatBounds();
  const trueLocation = [photo.lng, photo.lat];
  
  // Add true location marker
  const answerEl = createMarkerElement('#2ECC71', true);
  new mapboxgl.Marker({ element: answerEl })
    .setLngLat(trueLocation)
    .addTo(resultsMap);
  bounds.extend(trueLocation);
  
  // Add player guess markers and lines
  roundGuesses.forEach((guess, index) => {
    // Add marker
    const markerEl = createMarkerElement(guess.playerColor);
    new mapboxgl.Marker({ element: markerEl })
      .setLngLat(guess.coordinates)
      .addTo(resultsMap);
    bounds.extend(guess.coordinates);
    
    // Add line from guess to true location
    setTimeout(() => {
      addLineBetweenPoints(guess.coordinates, trueLocation, guess.playerColor, index);
    }, 300 * index);
  });
  
  // Fit map to show all markers
  setTimeout(() => {
    resultsMap.fitBounds(bounds, {
      padding: 60,
      maxZoom: 10,
      duration: 1000,
    });
  }, 100);
}

function addLineBetweenPoints(from, to, color, index) {
  const sourceId = `line-${index}`;
  const layerId = `line-layer-${index}`;
  
  resultsMap.addSource(sourceId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [from, to],
      },
    },
  });
  
  resultsMap.addLayer({
    id: layerId,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': color,
      'line-width': 3,
      'line-opacity': 0.8,
      'line-dasharray': [2, 2],
    },
  });
}

function renderRoundScores() {
  // Sort by distance (closest first)
  const sortedGuesses = [...roundGuesses].sort((a, b) => a.distance - b.distance);
  
  elements.roundScoresList.innerHTML = sortedGuesses.map((guess, index) => `
    <div class="score-entry ${guess.points > 0 ? 'winner' : ''}" style="animation-delay: ${index * 0.1}s">
      <div class="player-color-badge" style="background-color: ${guess.playerColor}">
        ${getPlayerInitial(guess.playerName)}
      </div>
      <span class="player-name">${guess.playerName}</span>
      <span class="distance">${formatDistance(guess.distance)}</span>
      <span class="points">${guess.points > 0 ? '🏆 +1' : ''}</span>
    </div>
  `).join('');
}

function renderTotalScores() {
  // Sort players by total score
  const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);
  
  elements.totalScoresList.innerHTML = sortedPlayers.map((player, index) => `
    <div class="score-entry" style="animation-delay: ${index * 0.1}s">
      <div class="player-color-badge" style="background-color: ${player.color}">
        ${getPlayerInitial(player.name)}
      </div>
      <span class="player-name">${player.name}</span>
      <span class="points">${player.totalScore}</span>
    </div>
  `).join('');
}

function nextPhoto() {
  currentPhotoIndex++;
  currentPlayerIndex = 0;
  
  if (currentPhotoIndex >= quizData.length) {
    // Game over - show final results
    showFinalResults();
  } else {
    // Next photo
    showScreen('quiz');
    showCurrentPhoto();
  }
}

// ==================== FINAL SCREEN ====================
function showFinalResults() {
  showScreen('final');
  
  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);
  
  // Render podium
  renderPodium(sortedPlayers);
  
  // Render full leaderboard
  renderFinalLeaderboard(sortedPlayers);
  
  // Launch confetti!
  launchConfetti();
}

function renderPodium(sortedPlayers) {
  const podiumHTML = [];
  
  // Second place (left)
  if (sortedPlayers[1]) {
    podiumHTML.push(createPodiumPlace(sortedPlayers[1], 2, 'silver'));
  }
  
  // First place (center)
  if (sortedPlayers[0]) {
    podiumHTML.push(createPodiumPlace(sortedPlayers[0], 1, 'gold'));
  }
  
  // Third place (right)
  if (sortedPlayers[2]) {
    podiumHTML.push(createPodiumPlace(sortedPlayers[2], 3, 'bronze'));
  }
  
  elements.podium.innerHTML = podiumHTML.join('');
}

function createPodiumPlace(player, rank, medal) {
  return `
    <div class="podium-place">
      <div class="podium-avatar" style="background-color: ${player.color}">
        ${getPlayerInitial(player.name)}
      </div>
      <div class="podium-name">${player.name}</div>
      <div class="podium-score">${player.totalScore} pnt</div>
      <div class="podium-stand ${medal}">${rank}</div>
    </div>
  `;
}

function renderFinalLeaderboard(sortedPlayers) {
  elements.finalScoresList.innerHTML = sortedPlayers.map((player, index) => `
    <div class="final-score-entry" style="animation-delay: ${index * 0.1}s">
      <span class="rank">#${index + 1}</span>
      <div class="player-color-badge" style="background-color: ${player.color}">
        ${getPlayerInitial(player.name)}
      </div>
      <span class="player-name">${player.name}</span>
      <span class="total-points">${player.totalScore}</span>
    </div>
  `).join('');
}

function launchConfetti() {
  // Use Christmas colors if in Christmas theme
  const isChristmas = document.body.classList.contains('christmas');
  const colors = isChristmas 
    ? ['#c41e3a', '#2d5a27', '#ffd700', '#ffffff', '#ff6b6b', '#90EE90']  // Christmas: red, green, gold, white
    : ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#82E0AA']; // Default colors
  
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      elements.confettiContainer.appendChild(confetti);
      
      // Remove after animation
      setTimeout(() => confetti.remove(), 5000);
    }, i * 50);
  }
}

function playAgain() {
  // Reset game state
  players.forEach(p => p.totalScore = 0);
  currentPhotoIndex = 0;
  currentPlayerIndex = 0;
  roundGuesses = [];
  
  // Clear confetti
  elements.confettiContainer.innerHTML = '';
  
  // Go back to setup
  showScreen('setup');
  
  // Re-render player list with current players
  elements.playersList.innerHTML = '';
  players.forEach((player, index) => {
    renderPlayerEntry(player, index);
    // Set the name value
    const input = elements.playersList.querySelector(`[data-player-id="${player.id}"]`);
    if (input) {
      input.value = player.name;
    }
  });
  updateStartButton();
}

// ==================== UTILITY FUNCTIONS ====================
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const toRad = x => x * Math.PI / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Scoring: Closest guess gets 1 point (handled in calculateRoundPoints)

function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(0)} km`;
  }
}

function getPlayerInitial(name) {
  return name.charAt(0).toUpperCase();
}

