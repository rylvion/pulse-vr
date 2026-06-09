import { openGameModal } from "./game-modal.js";
import { loadGamesDatabase } from "./games-db-loader.js";
import { attachImagePaths } from "./image-loader.js";

const state = {
  games: [],
  currentPage: 1,
  pageSize: 8,
  searchTerm: "",
  sortMode: "popular",
  selectedGenres: new Set(),
  selectedDifficulties: new Set(),
};

/**
 * Converts a numeric rating into a string of star characters.
 * @param {number|string} value - The numeric rating to convert (0-5).
 * @returns {string} A string of 5 characters, where filled stars (★) represent the rating and empty stars (☆) fill the rest.
 */
function buildStarString(value) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  return "★".repeat(fullStars) + (halfStar ? "⯪" : "") + "☆".repeat(emptyStars);
}

/**
 * Builds the HTML for a featured game card.
 * @param {Object} game - The game object for which to build the card.
 * @return {string} The HTML string for the featured game card.
 */
function matchesSearch(game) {
  if (!state.searchTerm) return true;

  const haystack = [
    game.title,
    game.shortDesc,
    game.longDesc,
    ...(game.genre || []),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(state.searchTerm);
}

/**
 * Checks if a game matches the selected genres.
 * @param {Object} game - The game object to check.
 * @returns {boolean} True if the game matches the selected genres, false otherwise.
 */
function matchesGenres(game) {
  if (!state.selectedGenres.size) return true;
  return (game.genre || []).some((genre) =>
    state.selectedGenres.has(String(genre).toLowerCase()),
  );
}

/**
 * Checks if a game matches the selected difficulty.
 * @param {Object} game - The game object to check.
 * @returns {boolean} True if the game matches the selected difficulty, false otherwise.
 */
function matchesDifficulty(game) {
  if (!state.selectedDifficulties.size) return true;
  return state.selectedDifficulties.has(
    String(game.difficulty || "").toLowerCase(),
  );
}

/**
 * Sorts an array of games based on the current sort mode.
 * @param {Array} games - The array of game objects to sort.
 * @returns {Array} The sorted array of game objects.
 */
function sortGames(games) {
  const sorted = [...games];

  if (state.sortMode === "rating") {
    sorted.sort(
      (left, right) =>
        (right.rating || 0) - (left.rating || 0) ||
        (right.ratingCount || 0) - (left.ratingCount || 0),
    );
  } else if (state.sortMode === "duration") {
    sorted.sort(
      (left, right) =>
        (left.duration || 0) - (right.duration || 0) ||
        (right.rating || 0) - (left.rating || 0),
    );
  } else {
    sorted.sort(
      (left, right) =>
        (right.ratingCount || 0) - (left.ratingCount || 0) ||
        (right.rating || 0) - (left.rating || 0),
    );
  }

  return sorted;
}

/**
 * Filters the games based on the current search term, selected genres, and selected difficulties, then sorts the filtered games according to the current sort mode.
 * @returns {Array} The filtered and sorted array of game objects.
 */
function getFilteredGames() {
  const filtered = state.games.filter(
    (game) =>
      matchesSearch(game) && matchesGenres(game) && matchesDifficulty(game),
  );
  return sortGames(filtered);
}

/**
 * Renders game cards for the specified array of games.
 * @param {Array} games - The array of game objects to render.
 */
function renderCards(games) {
  const grid = document.getElementById("library-grid");
  if (!grid) return;

  const start = (state.currentPage - 1) * state.pageSize;
  const pageGames = games.slice(start, start + state.pageSize);

  grid.innerHTML = pageGames
    .map((game) => {
      const genreText =
        Array.isArray(game.genre) && game.genre.length
          ? game.genre.slice(0, 2).join(" · ")
          : "VR";
      return `
      <article class="game-card" data-game-id="${game.id}" data-difficulty="${String(game.difficulty || "").toLowerCase()}">
        <img src="${game.imagePath}" width="280" height="180" loading="lazy" decoding="async" alt="${game.title}">
        <h3>${game.title}</h3>
        <p>${genreText}</p>
        <p aria-label="Rating ${game.rating} out of 5">${buildStarString(game.rating)}</p>
      </article>
    `;
    })
    .join("");
}

function wireCardClicks(games) {
  const grid = document.getElementById("library-grid");
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".game-card");
    if (!card) return;

    const gameId = Number(card.dataset.gameId);
    const game = games.find((g) => g.id === gameId);

    if (game) openGameModal(game);
  });
}

/**
 * Renders the pagination controls based on the total number of games after filtering. It calculates the total number of pages, generates page buttons, and enables/disables navigation buttons as needed.
 * @param {number} totalGames - The total number of games after applying filters, used to determine the number of pages and the state of pagination controls.

 */
function renderPagination(totalGames) {
  const pagination = document.getElementById("library-pagination");
  if (!pagination) return;

  const totalPages = Math.max(1, Math.ceil(totalGames / state.pageSize));
  state.currentPage = Math.min(state.currentPage, totalPages);

  const pageButtons = Array.from({ length: totalPages }, (_, index) => {
    const pageNumber = index + 1;
    const isCurrent = pageNumber === state.currentPage;
    return `<button type="button" data-page="${pageNumber}" aria-current="${isCurrent ? "page" : "false"}">${pageNumber}</button>`;
  }).join("");

  pagination.innerHTML = `
    <button type="button" data-nav="prev" aria-label="Previous page">&lt;</button>
    ${pageButtons}
    <button type="button" data-nav="next" aria-label="Next page">&gt;</button>
  `;

  pagination
    .querySelector('[data-nav="prev"]')
    ?.toggleAttribute("disabled", state.currentPage === 1);
  pagination
    .querySelector('[data-nav="next"]')
    ?.toggleAttribute("disabled", state.currentPage === totalPages);
}

/**
 * Synchronizes the state of pagination buttons by enabling or disabling them based on the current page. It iterates through all page buttons and updates their disabled state to reflect whether they correspond to the current page.
 */
function syncPageButtons() {
  const pagination = document.getElementById("library-pagination");
  if (!pagination) return;

  pagination.querySelectorAll("button[data-page]").forEach((button) => {
    button.toggleAttribute(
      "disabled",
      Number(button.dataset.page) === state.currentPage,
    );
  });
}

/**
 * Updates the game library display by filtering and sorting the games based on the current state, rendering the appropriate game cards for the current page, and updating the pagination controls to reflect the total number of filtered games. It ensures that the current page is valid after filtering and that all UI elements are synchronized with the current state.
 *
 */
function updateLibrary() {
  const filteredGames = getFilteredGames();
  const totalPages = Math.max(
    1,
    Math.ceil(filteredGames.length / state.pageSize),
  );

  if (state.currentPage > totalPages) {
    state.currentPage = totalPages;
  }

  renderCards(filteredGames);
  wireCardClicks(filteredGames);
  renderPagination(filteredGames.length);
  syncPageButtons();
}

/**
 * Wires up event listeners for the search input, sort select, filter checkboxes, and pagination controls. It updates the state and refreshes the library display whenever the user interacts with any of these controls, ensuring that the displayed games always reflect the current search term, selected genres, selected difficulties, and sort mode.
 */
function wireControls() {
  const searchInput = document.getElementById("library-search");
  const sortSelect = document.getElementById("library-sort");
  const resetButton = document.querySelector("#library-filters button");
  const filtersForm = document.getElementById("library-filters");
  const pagination = document.getElementById("library-pagination");

  searchInput?.addEventListener("input", () => {
    state.searchTerm = searchInput.value.trim().toLowerCase();
    state.currentPage = 1;
    updateLibrary();
  });

  sortSelect?.addEventListener("change", () => {
    state.sortMode = sortSelect.value;
    state.currentPage = 1;
    updateLibrary();
  });

  resetButton?.addEventListener("click", () => {
    filtersForm?.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = false;
    });

    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "popular";

    state.searchTerm = "";
    state.sortMode = "popular";
    state.selectedGenres.clear();
    state.selectedDifficulties.clear();
    state.currentPage = 1;
    updateLibrary();
  });

  filtersForm?.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener("change", () => {
      const value = String(input.value || "").toLowerCase();

      if (input.name === "genre") {
        if (input.checked) state.selectedGenres.add(value);
        else state.selectedGenres.delete(value);
      }

      if (input.name === "difficulty") {
        if (input.checked) state.selectedDifficulties.add(value);
        else state.selectedDifficulties.delete(value);
      }

      state.currentPage = 1;
      updateLibrary();
    });
  });

  pagination?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.page) {
      state.currentPage = Number(target.dataset.page);
      updateLibrary();
      return;
    }

    if (target.dataset.nav === "prev" && state.currentPage > 1) {
      state.currentPage -= 1;
      updateLibrary();
      return;
    }

    if (target.dataset.nav === "next") {
      const totalPages = Math.max(
        1,
        Math.ceil(getFilteredGames().length / state.pageSize),
      );
      if (state.currentPage < totalPages) {
        state.currentPage += 1;
        updateLibrary();
      }
    }
  });
}

/**
 * Procedural function to initialize the game library page by loading the games database, attaching image paths to the game objects, wiring up event listeners for user interactions, and rendering the initial library display. It ensures that all necessary data is loaded and that the UI is responsive to user input from the moment the page is ready.
 */
async function initGameLibrary() {
  const grid = document.getElementById("library-grid");
  if (!grid) return;

  const games = await loadGamesDatabase();
  state.games = await attachImagePaths(games);

  wireControls();
  updateLibrary();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGameLibrary);
} else {
  initGameLibrary();
}
