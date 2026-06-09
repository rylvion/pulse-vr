import { loadGamesDatabase } from "./games-db-loader.js";
import { attachImagePaths } from "./image-loader.js";
import { openGameModal } from "./game-modal.js";

let homeGames = [];
let homeIndex = 0;

const PAGE_SIZE = 4;

/**
 * Builds a star rating string based on the given value.
 * @param {*} value The rating value.
 * @returns {string} The star rating string.
 */
function buildStarString(value) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  return "★".repeat(fullStars) + (halfStar ? "⯪" : "") + "☆".repeat(emptyStars);
}

/**
 * Builds a featured game card HTML element.
 * @param {*} game The game object.
 * @returns {string} The HTML string for the game card.
 */
function buildFeaturedCard(game) {
  return `
    <article class="game-card" data-game-id="${game.id}">
      <img
        src="${game.imagePath}"
        width="320"
        height="200"
        loading="lazy"
        decoding="async"
        alt="${game.title}"
      >
      <h3>${game.title}</h3>
      <p>${Array.isArray(game.genre) && game.genre.length ? game.genre[0] : "VR"}</p>
      <p aria-label="Rating ${game.rating} out of 5">
        ${buildStarString(game.rating)}
      </p>
    </article>
  `;
}

/**
 * Renders a batch of featured games in the carousel and sets up click handlers for each game card to open the game preview modal
 */
function renderHomeBatch() {
  const track = document.getElementById("game-cards");
  if (!track) return;

  const visibleGames = homeGames.slice(homeIndex, homeIndex + PAGE_SIZE);

  const html = visibleGames.map(buildFeaturedCard).join("");

  const leftBtn = track.querySelector(".arrow:first-of-type");
  const rightBtn = track.querySelector(".arrow:last-of-type");

  track.innerHTML = "";

  if (leftBtn) track.appendChild(leftBtn);

  track.insertAdjacentHTML("beforeend", html);

  if (rightBtn) track.appendChild(rightBtn);

  track.querySelectorAll(".game-card").forEach((card, i) => {
    card.addEventListener("click", () => {
      console.log(
        "MODAL ELEMENT:",
        document.getElementById("game-preview-modal"),
      );
      openGameModal(visibleGames[i]);
    });
  });
}

/**
 * Sets up event listeners for the carousel navigation buttons to update the displayed batch of featured games when clicked.
 */
function setupCarouselControls() {
  const track = document.getElementById("game-cards");
  if (!track) return;

  const buttons = track.querySelectorAll(".arrow");

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const direction = button.textContent.includes("<") ? -1 : 1;

      const maxIndex = Math.max(0, homeGames.length - PAGE_SIZE);

      homeIndex = Math.min(
        Math.max(homeIndex + direction * PAGE_SIZE, 0),
        maxIndex,
      );

      renderHomeBatch();
    });
  }
}
  
/**
 * Sets up click handlers for each game card to open the game preview modal.
 */
function setupCardClickHandler() {
  const track = document.getElementById("game-cards");
  if (!track) return;

  track.addEventListener("click", (e) => {
    const card = e.target.closest(".game-card");
    if (!card) return;
    console.log("CARD CLICKED");

    const gameId = Number(card.dataset.gameId);
    const game = homeGames.find((g) => g.id === gameId);

    if (game) {
      console.log(
        "MODAL ELEMENT:",
        document.getElementById("game-preview-modal"),
      );
      openGameModal(game);
    }
  });
}

/**
 * Initialises the home page by loading the games database, attaching image paths, rendering the initial batch of featured games, and setting up event listeners for carousel navigation and game card clicks to open the game preview modal.
 */
async function initHomePage() {
  const track = document.getElementById("game-cards");
  if (!track) return;

  const games = await loadGamesDatabase();
  homeGames = await attachImagePaths(games);

  renderHomeBatch();
  setupCarouselControls();
  setupCardClickHandler();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomePage);
} else {
  initHomePage();
}
