import { loadGamesDatabase } from "./games-db-loader.js";
import { loadAssetCatalog } from "./image-loader.js";
import { resolveAssetMetadata } from "./image-loader.js";

let gamesCache = [];

/**
 * Parses the query parameters from the current URL and returns them as an object.
 * @return {Object} An object containing the query parameters as key-value pairs.
 */
function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

/**
 * Finds a game in the provided list of games by its ID.
 * @param {Array} games The list of games to search through.
 * @param {string|number} id The ID of the game to find.
 * @return {Object|null} The game object if found, or null if not found.
 */
function findGameById(games, id) {
  return games.find((g) => String(g.id) === String(id));
}

/**
 * Sets up the back button to navigate to the previous page or a specified redirect URL.
 */
function setupBackButton() {
  const params = getQueryParams();
  const backBtn = document.getElementById("back-button");

  if (!backBtn) return;

  backBtn.addEventListener("click", () => {
    if (params.redir) {
      window.location.href = params.redir;
    } else {
      window.history.back();
    }
  });
}

/**
 * Creates a section element with a title and content.
 * @param {string} title The title of the section.
 * @param {string} content The content of the section.
 * @returns {string} The HTML for the section element.
 */
function section(title, content) {
  return `
    <div class="section-card">
      <h3>${title}</h3>
      ${content}
    </div>
  `;
}

/**
 * Renders the details of a game in the UI.
 * @param {Object} game The game object to render.
 * @returns {Promise<void>}
 */
async function renderGame(game) {
  const container = document.getElementById("game-detail");
  if (!container) return;

  const asset = await resolveAssetMetadata(game);

  container.innerHTML = `
    <h1>${game.title}</h1>

    <img
      src="${game.imagePath}"
      alt="${game.title}"
      class="detail-image"
    >

    <p>${game.longDesc || ""}</p>

    ${section(
      "Gameplay",
      `
      <p><strong>Modes:</strong> ${(game.modes || []).join(", ")}</p>
      <p><strong>Genres:</strong> ${(game.genre || []).join(", ")}</p>
      <p><strong>Controls:</strong> ${(game.controls || []).join(", ")}</p>
    `,
    )}

    ${section(
      "Game Info",
      `
      <p><strong>Players:</strong> ${game.minPlayers} - ${game.maxPlayers}</p>
      <p><strong>Duration:</strong> ${game.duration} mins</p>
      <p><strong>Difficulty:</strong> ${game.difficulty}</p>
      <p><strong>Age Rating:</strong> ${game.ageRating}</p>
      <p><strong>Rating:</strong> ${game.rating} ⭐ (${game.ratingCount} ratings)</p>
    `,
    )}

    ${section(
      "Experience",
      `
      <p><strong>Comfort:</strong> ${game.comfortLevel}</p>
      <p><strong>Intensity:</strong> ${game.intensity}</p>
      <p><strong>Motion:</strong> ${game.motionType}</p>
    `,
    )}

    ${section(
      "Rules",
      `
      <p><strong>Win Condition:</strong> ${game.winCondition}</p>
      <p><strong>Rounds:</strong> ${game.roundsPerGame}</p>
    `,
    )}

    ${section(
      "Content",
      `
      <p>Violence: ${game.contentDescriptors?.violence}</p>
      <p>Fear: ${game.contentDescriptors?.fear}</p>
      <p>Language: ${game.contentDescriptors?.language}</p>
      <p>Online: ${game.contentDescriptors?.onlineInteraction}</p>
    `,
    )}

    ${section(
      "Target Audience",
      `
      <p>${game.targetAudience?.minAge} - ${game.targetAudience?.maxAge} years</p>
    `,
    )}

    ${section(
      "Accessibility",
      `
      <p>${game.accessibilityNotes || "None"}</p>
    `,
    )}

    ${
      asset
        ? section(
            "Asset Info",
            `
      <p><strong>Source:</strong> <a href="${asset.sourceUrl}" target="_blank" rel="noopener noreferrer">${asset.sourceUrl}</a></p>
      <p><strong>Author:</strong> <a href="${asset.author?.url}" target="_blank" rel="noopener noreferrer">${asset.author?.name}</a></p>
      <p><strong>License:</strong> <a href="${asset.license?.url}" target="_blank" rel="noopener noreferrer">${asset.license?.name}</a></p>
      <p><strong>GET image here:</strong> <a href="${asset.directImageUrl}" target="_blank" rel="noopener noreferrer">Download High-Quality Image for ${game.title}</a></p>
    `,
          )
        : ""
    }
  `;
}

/**
 * Initialises the game detail page by loading the game data and rendering the details of the selected game.
 * @returns {Promise<void>}
 */
async function initGameDetail() {
  const params = getQueryParams();
  const gameId = params.id;

  if (!gameId) {
    document.getElementById("game-detail").innerHTML =
      "<p>No game selected.</p>";
    return;
  }

  const games = await loadGamesDatabase();
  gamesCache = games;

  const game = findGameById(games, gameId);

  if (!game) {
    document.getElementById("game-detail").innerHTML = "<p>Game not found.</p>";
    return;
  }

  setupBackButton();
  await renderGame(game);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGameDetail);
} else {
  initGameDetail();
}
