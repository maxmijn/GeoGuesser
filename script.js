// ==================== CONFIGURATION ====================
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWF4bWlqbiIsImEiOiJjbWoxa2pmYnUwanQyM2VzYjFjOHl6cW5xIn0.LS3snE9DmmIjNE46Nv-oMQ';

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

// Map instances
let quizMap = null;
let resultsMap = null;
let currentGuessMarker = null;
let guessCoordinates = null;

// ==================== DOM ELEMENTS ====================
const elements = {
  // Screens
  setupScreen: document.getElementById('setup-screen'),
  quizScreen: document.getElementById('quiz-screen'),
  resultsScreen: document.getElementById('results-screen'),
  finalScreen: document.getElementById('final-screen'),
  passOverlay: document.getElementById('pass-overlay'),
  revealOverlay: document.getElementById('reveal-overlay'),
  
  // Setup screen
  playersList: document.getElementById('players-list'),
  addPlayerBtn: document.getElementById('add-player-btn'),
  startGameBtn: document.getElementById('start-game-btn'),
  
  // Quiz screen
  photoCounter: document.getElementById('photo-counter'),
  progressBar: document.getElementById('progress-bar'),
  quizPhoto: document.getElementById('quiz-photo'),
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
  roundScoresList: document.getElementById('round-scores-list'),
  totalScoresList: document.getElementById('total-scores-list'),
  nextPhotoBtn: document.getElementById('next-photo-btn'),
  
  // Final screen
  podium: document.getElementById('podium'),
  finalScoresList: document.getElementById('final-scores-list'),
  playAgainBtn: document.getElementById('play-again-btn'),
  confettiContainer: document.getElementById('confetti'),
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', init);

function init() {
  setupEventListeners();
  addPlayer(); // Start with one player input
}

function setupEventListeners() {
  elements.addPlayerBtn.addEventListener('click', addPlayer);
  elements.startGameBtn.addEventListener('click', startGame);
  elements.confirmGuessBtn.addEventListener('click', confirmGuess);
  elements.readyBtn.addEventListener('click', playerReady);
  elements.showResultBtn.addEventListener('click', showResult);
  elements.nextPhotoBtn.addEventListener('click', nextPhoto);
  elements.playAgainBtn.addEventListener('click', playAgain);
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
  const response = await fetch('./data/quiz.json');
  if (!response.ok) {
    throw new Error('Failed to load quiz data');
  }
  return await response.json();
}

function showScreen(screenName) {
  // Hide all screens
  elements.setupScreen.classList.remove('active');
  elements.quizScreen.classList.remove('active');
  elements.resultsScreen.classList.remove('active');
  elements.finalScreen.classList.remove('active');
  
  // Show requested screen
  switch (screenName) {
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
function initQuizMap() {
  mapboxgl.accessToken = MAPBOX_TOKEN;
  
  if (quizMap) {
    quizMap.remove();
  }
  
  quizMap = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    zoom: 1.5,
    center: [0, 20],
    cooperativeGestures: true,
  });
  
  // Disable rotation for simpler UX
  quizMap.dragRotate.disable();
  quizMap.touchZoomRotate.disableRotation();
  
  // Click handler for placing guesses
  quizMap.on('click', handleMapClick);
  
  // Ensure map fills container after load
  quizMap.on('load', () => {
    quizMap.resize();
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

function initResultsMap(photo) {
  if (resultsMap) {
    resultsMap.remove();
  }
  
  resultsMap = new mapboxgl.Map({
    container: 'results-map',
    style: 'mapbox://styles/mapbox/streets-v12',
    zoom: 2,
    center: [photo.lng, photo.lat],
  });
  
  resultsMap.dragRotate.disable();
  resultsMap.touchZoomRotate.disableRotation();
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
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#82E0AA'];
  
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
    return `${(meters / 1000).toFixed(1)} km`;
  }
}

function getPlayerInitial(name) {
  return name.charAt(0).toUpperCase();
}

