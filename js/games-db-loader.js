import { assetIdFromGameLike, normaliseGameId } from "./asset-utils.js";
import { attachImagePath } from "./image-loader.js";

const GAMES_DB_URL = new URL("/pulse-vr/assets/data/games.json", window.location.origin);
const GAMES_DB_FALLBACK_URL = new URL("/pulse-vr/assets/data/games.json",window.location.origin,);

let gamesStatePromise;


/**
 * Builds the games state from the provided payload.
 * @param {Object} payload The payload containing the games data.
 * @returns {Promise<Object>} A promise that resolves to the games state object.
 */
async function buildGamesState(payload) {
  const source = Array.isArray(payload?.games) ? payload.games : [];
  const games = new Array(source.length);
  const byId = new Map();

  for (let i = 0; i < source.length; i++) {
    const rawGame = source[i];
    const rawId = rawGame?.id;

    const normalisedId =
      typeof rawId === "number" && Number.isFinite(rawId) && rawId >= 1
        ? rawId
        : normaliseGameId(rawId);

    const baseGame = {
      ...rawGame,
      assetId:
        typeof rawGame?.assetId === "string"
          ? rawGame.assetId
          : assetIdFromGameLike(rawGame),
    };

    const normalisedGame = await attachImagePath(baseGame);

    games[i] = normalisedGame;

    if (normalisedId !== null) {
      byId.set(normalisedId, normalisedGame);
    }
  }

  return {
    games: Object.freeze(games),
    byId,
  };
}

/**
 * Loads the games state, which includes a list of game objects and a map of games by ID.
 * @param {Object} options Options for loading the games state.
 * @param {boolean} options.forceReload If true, forces the games state to be reloaded from the server, bypassing any cached state.
 * @returns {Promise<Object>} A promise that resolves to the games state object containing the list and map of games.
 */
async function loadGamesState({ forceReload = false } = {}) {
  if (!gamesStatePromise || forceReload) {
    gamesStatePromise = (async () => {
      let response = await fetch(GAMES_DB_URL, { cache: "force-cache" });

      if (!response.ok) {
        response = await fetch(GAMES_DB_FALLBACK_URL, { cache: "force-cache" });
      }

      if (!response.ok) {
        throw new Error(`Failed to load games database: ${response.status}`);
      }

      const payload = await response.json();
      return await buildGamesState(payload);
    })().catch((error) => {
      gamesStatePromise = null;
      throw error;
    });
  }

  return gamesStatePromise;
}

/**
 * Loads the games database.
 * @param {Object} options Options for loading the games database.
 * @param {boolean} options.forceReload If true, forces the games database to be reloaded from the server, bypassing any cached state.
 * @returns {Promise<Array>} A promise that resolves to the list of game objects.
 */
export async function loadGamesDatabase({ forceReload = false } = {}) {
  const state = await loadGamesState({ forceReload });
  return state.games;
}

/**
 * Loads a map of games by ID.
 * @param {Object} options Options for loading the games map.
 * @param {boolean} options.forceReload If true, forces the games map to be reloaded from the server, bypassing any cached state.
 * @returns {Promise<Map>} A promise that resolves to a map of game objects indexed by their IDs.
 */
export async function loadGamesById({ forceReload = false } = {}) {
  const state = await loadGamesState({ forceReload });
  return state.byId;
}

/**
 * Loads a game by its ID.
 * @param {string|number} id The ID of the game to load.
 * @param {Object} options Options for loading the game.
 * @param {boolean} options.forceReload If true, forces the game to be reloaded from the server, bypassing any cached state.
 * @returns {Promise<Object|null>} A promise that resolves to the game object or null if not found.
 */
export async function loadGameById(id, { forceReload = false } = {}) {
  const normalisedId =
    typeof id === "number" && Number.isFinite(id) && id >= 1
      ? id
      : normaliseGameId(id);

  if (normalisedId === null) return null;

  const byId = await loadGamesById({ forceReload });
  return byId.get(normalisedId) || null;
}
