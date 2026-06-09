import { assetIdFromGameLike, normalizeGameId } from "./asset-utils.js";
import { attachImagePath } from "./image-loader.js";

const GAMES_DB_URL = new URL("/assets/data/games.json", import.meta.url);
const GAMES_DB_FALLBACK_URL = new URL(
  "/assets/data/games.json",
  import.meta.url,
);

let gamesStatePromise;

async function buildGamesState(payload) {
  const source = Array.isArray(payload?.games) ? payload.games : [];
  const games = new Array(source.length);
  const byId = new Map();

  for (let i = 0; i < source.length; i++) {
    const rawGame = source[i];
    const rawId = rawGame?.id;

    const normalizedId =
      typeof rawId === "number" && Number.isFinite(rawId) && rawId >= 1
        ? rawId
        : normalizeGameId(rawId);

    const baseGame = {
      ...rawGame,
      assetId:
        typeof rawGame?.assetId === "string"
          ? rawGame.assetId
          : assetIdFromGameLike(rawGame),
    };

    const normalizedGame = await attachImagePath(baseGame);

    games[i] = normalizedGame;

    if (normalizedId !== null) {
      byId.set(normalizedId, normalizedGame);
    }
  }

  return {
    games: Object.freeze(games),
    byId,
  };
}

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

export async function loadGamesDatabase({ forceReload = false } = {}) {
  const state = await loadGamesState({ forceReload });
  return state.games;
}

export async function loadGamesById({ forceReload = false } = {}) {
  const state = await loadGamesState({ forceReload });
  return state.byId;
}

export async function loadGameById(id, { forceReload = false } = {}) {
  const normalizedId =
    typeof id === "number" && Number.isFinite(id) && id >= 1
      ? id
      : normalizeGameId(id);

  if (normalizedId === null) return null;

  const byId = await loadGamesById({ forceReload });
  return byId.get(normalizedId) || null;
}
