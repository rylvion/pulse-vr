import { loadGamesDatabase } from "./games-db-loader.js";
import { attachImagePaths } from "./image-loader.js";

const PAGE_SIZE = 6;

const state = {
  games: [],
  selectedGameId: null,
  pageIndex: 0,
};

/**
 * Generates the URL for the next step in the booking process based on the currently selected game
 * @return {string} The URL for the next step, including query parameters if a game is selected
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
 * @param {Object} game - The game object containing details to display
 * @returns {string} The HTML string for the booking card
 */
function buildBookingCard(game) {
	return `
		<label class="selectable-game" data-game-id="${game.id}">
		<input type="radio" name="selectedGame" value="${game.id}" ${
			game.id === state.selectedGameId ? "checked" : ""
		}>
		<span>${game.title}</span>
		<small>${
			Array.isArray(game.genre) && game.genre.length ? game.genre[0] : "VR"
		}</small>
		</label>
	`;
}

/**
 * Renders paginated list of games
 */
function renderGameList() {
	const form = document.getElementById("booking-game-form");
	if (!form) return;

	const start = state.pageIndex * PAGE_SIZE;
	const visibleGames = state.games.slice(start, start + PAGE_SIZE);

	form.innerHTML = visibleGames.map(buildBookingCard).join("");

	setupPaginationControls();
}

/**
 * Retrieves selected game
 * @return {Object|null} The selected game object or null if not found
 */
function getSelectedGame() {
	return (
	state.games.find((game) => game.id === state.selectedGameId) ||
	state.games[0] ||
	null
	);
}

/**
 * Renders preview section
 * @param {Object|null} game - The game object to display in the preview
 */
function renderPreview() {
	const selectedGame = getSelectedGame();

	const previewImage = document.querySelector("#selected-game-preview img");
	const title = document.getElementById("selected-game-title");
	const description = document.querySelector("#selected-game-preview p");
	const detailsList = document.querySelector("#selected-game-preview ul");
	const nextButton = document.getElementById("next-step-btn");

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
 * Attaches event listeners for game selection and next button
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
 * Pagination controls (next/prev)
 */
function setupPaginationControls() {
	const prevBtn = document.getElementById("prev-page");
	const nextBtn = document.getElementById("next-page");

	const maxPage = Math.max(0, Math.ceil(state.games.length / PAGE_SIZE) - 1);

	if (prevBtn) {
		prevBtn.onclick = () => {
		state.pageIndex = Math.max(state.pageIndex - 1, 0);
		renderGameList();
		};
	}

	if (nextBtn) {
		nextBtn.onclick = () => {
		state.pageIndex = Math.min(state.pageIndex + 1, maxPage);
		renderGameList();
		};
	}
}

/**
 * Initialises the bookings page by loading game data, attaching images, and rendering the UI
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
