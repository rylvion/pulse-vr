import { loadGamesDatabase } from "./games-db-loader.js";
import { attachImagePaths } from "./image-loader.js";

const state = {
  games: [],
  selectedGameId: null,
};

/**
 * Generates the URL for the next step in the booking process based on the currently selected game
 * @returns {string} The URL for the next step in the booking process, including query parameters for the selected game if applicable.
 */
function nextStepUrl() {
  const gameId = Number(state.selectedGameId);
  const params = new URLSearchParams();
  if (Number.isFinite(gameId) && gameId >= 1) {
    params.set("game", String(gameId));
  }
  const query = params.toString();
  return query ? `./date-time/?${query}` : "./date-time/";
}

/**
 * Builds a booking card element for a given game
 * @param {*} game 
 * @returns {string} The HTML string for the booking card representing the game
 */
function buildBookingCard(game) {
  return `
    <label class="selectable-game" data-game-id="${game.id}">
      <input type="radio" name="selectedGame" value="${game.id}" ${game.id === state.selectedGameId ? "checked" : ""}>
      <span>${game.title}</span>
      <small>${Array.isArray(game.genre) && game.genre.length ? game.genre[0] : "VR"}</small>
    </label>
  `;
}

/**
 * Renders the list of games as selectable booking cards and sets up the preview for the selected game
 */
function renderGameList() {
  const form = document.getElementById("booking-game-form");
  if (!form) return;

  form.innerHTML = state.games.map(buildBookingCard).join("");
}

/**
 * Retrieves the currently selected game based on the selectedGameId in the state.
 * @return {Object|null} The selected game object or null if no game is selected.
 */
function getSelectedGame() {
  return (
    state.games.find((game) => game.id === state.selectedGameId) ||
    state.games[0] ||
    null
  );
}

/**
 * Renders the preview section for the currently selected game
 */
function renderPreview() {
  const selectedGame = getSelectedGame();
  const previewImage = document.querySelector("#selected-game-preview img");
  const title = document.getElementById("selected-game-title");
  const description = document.querySelector("#selected-game-preview p");
  const detailsList = document.querySelector("#selected-game-preview ul");
  const nextButton = document.querySelector("#selected-game-preview button");

  if (
    !selectedGame ||
    !previewImage ||
    !title ||
    !description ||
    !detailsList ||
    !nextButton
  )
    return;

  previewImage.src = selectedGame.imagePath;
  previewImage.alt = selectedGame.title;
  title.textContent = selectedGame.title;
  description.textContent = selectedGame.shortDesc;
  detailsList.innerHTML = `
    <li>Players: ${selectedGame.minPlayers}-${selectedGame.maxPlayers}</li>
    <li>Duration: ${selectedGame.duration} mins</li>
    <li>Difficulty: ${selectedGame.difficulty}</li>
  `;
  nextButton.textContent = "Next: Date & Time";
  nextButton.dataset.nextUrl = nextStepUrl();
}

/**
 * event handler for changes in the game selection form
 */
function wireSelection() {
  const form = document.getElementById("booking-game-form");
  if (!form) return;

  form.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.name !== "selectedGame")
      return;

    state.selectedGameId = Number(target.value);
    renderGameList();
    renderPreview();
  });

  const nextButton = document.querySelector("#selected-game-preview button");
  nextButton?.addEventListener("click", () => {
    const url = nextButton.dataset.nextUrl || nextStepUrl();
    window.location.href = url;
  });
}

/**
 * Initialises the bookings page by loading the games database, attaching image paths, rendering the game list and preview, and setting up event listeners for game selection
 */
async function initBookingsPage() {
  const selectionSection = document.getElementById("game-selection");
  if (!selectionSection) return;

  const games = await loadGamesDatabase();
  state.games = await attachImagePaths(games);
  state.selectedGameId = state.games[0]?.id ?? null;

  renderGameList();
  renderPreview();
  wireSelection();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBookingsPage);
} else {
  initBookingsPage();
}
