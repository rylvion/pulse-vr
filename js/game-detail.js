import { loadGamesDatabase } from "./games-db-loader.js";
import { loadAssetCatalog } from "./image-loader.js";
import { resolveAssetMetadata } from "./image-loader.js";

let gamesCache = [];

function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

function findGameById(games, id) {
  return games.find((g) => String(g.id) === String(id));
}

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

function section(title, content) {
  return `
    <div class="section-card">
      <h3>${title}</h3>
      ${content}
    </div>
  `;
}

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
    `,
          )
        : ""
    }
  `;
}

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
