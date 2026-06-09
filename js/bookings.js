import { loadGamesDatabase } from "./games-db-loader.js";
import { attachImagePaths } from "./image-loader.js";

const state = {
  games: [],
  selectedGameId: null,
};

function nextStepUrl() {
  const gameId = Number(state.selectedGameId);
  const params = new URLSearchParams();
  if (Number.isFinite(gameId) && gameId >= 1) {
    params.set("game", String(gameId));
  }
  const query = params.toString();
  return query ? `./date-time/?${query}` : "./date-time/";
}

function buildBookingCard(game) {
  return `
    <label class="selectable-game" data-game-id="${game.id}">
      <input type="radio" name="selectedGame" value="${game.id}" ${game.id === state.selectedGameId ? "checked" : ""}>
      <span>${game.title}</span>
      <small>${Array.isArray(game.genre) && game.genre.length ? game.genre[0] : "VR"}</small>
    </label>
  `;
}

function renderGameList() {
  const form = document.getElementById("booking-game-form");
  if (!form) return;

  form.innerHTML = state.games.map(buildBookingCard).join("");
}

function getSelectedGame() {
  return (
    state.games.find((game) => game.id === state.selectedGameId) ||
    state.games[0] ||
    null
  );
}

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
