import { assetIdFromGameLike, withAssetPrefix } from "./asset-utils.js";

const ASSETS_DB_URL = new URL("/pulse-vr/assets/data/assets.json", window.location.origin);
const ASSETS_DB_FALLBACK_URL = new URL("/pulse-vr/assets/data/assets.json", window.location.origin);

const IMAGES_BASE_URL = new URL("/pulse-vr/assets/images/", window.location.origin);
const DEFAULT_IMAGE_FILE = "https://placehold.co/320x200";

let imageStatePromise;

function createImageState(index, catalog) {
  return { index, catalog };
}

/**
 * Loads the image state, which includes an index of asset IDs to image file names and a catalog of asset metadata.  
 * @param {Object} options Options for loading the image state.
 * @param {boolean} options.forceReload If true, forces the image state to be reloaded from the server, bypassing any cached state.
 * @returns {Promise<Object>} A promise that resolves to the image state object containing the index and catalog.
 */
async function loadImageState({ forceReload = false } = {}) {
  if (!imageStatePromise || forceReload) {
    imageStatePromise = (async () => {
      const index = new Map();
      const catalog = new Map();

      try {
        let response = await fetch(ASSETS_DB_URL, { cache: "force-cache" });

        if (!response.ok) {
          response = await fetch(ASSETS_DB_FALLBACK_URL, {
            cache: "force-cache",
          });
        }

        if (!response.ok) {
          return createImageState(index, catalog);
        }

        const payload = await response.json();
        const assets = Array.isArray(payload) ? payload : payload?.assets || [];

        for (const asset of assets) {
          const assetId =
            typeof asset?.assetId === "string"
              ? asset.assetId
              : assetIdFromGameLike(asset);

          const imageObj = asset?.image;

          const file =
            imageObj?.AVIF || imageObj?.WEBP || imageObj?.JPG || null;

          if (assetId && file) {
            index.set(assetId, file);
          }

          if (assetId) {
            catalog.set(assetId, {
              ...asset,
              assetId,
            });
          }
        }
      } catch {
        return createImageState(index, catalog);
      }

      return createImageState(index, catalog);
    })().catch((err) => {
      imageStatePromise = null;
      throw err;
    });
  }

  return imageStatePromise;
}

/**
 * Resolves the file name of the image associated with a game.
 * @param {Object} game The game object for which to resolve the image file name.
 * @returns {Promise<string>} A promise that resolves to the image file name.
 */
export async function resolveImageFileName(game) {
  const imageObj = game?.image;

  if (imageObj && typeof imageObj === "object") {
    return imageObj.AVIF || imageObj.WEBP || imageObj.JPG || DEFAULT_IMAGE_FILE;
  }

  return DEFAULT_IMAGE_FILE;
}

/**
 * Resolves the path of the image associated with a game.
 * @param {Object} game The game object for which to resolve the image path.
 * @returns {Promise<string>} A promise that resolves to the image path.
 */
export async function resolveImagePath(game) {
  const fileName = await resolveImageFileName(game);

  if (!fileName) return DEFAULT_IMAGE_FILE;
  if (fileName.startsWith("http")) return fileName;

  return new URL(fileName, IMAGES_BASE_URL).toString();
}

/**
 * Attaches an image path to a game object.
 * @param {Object} game The game object to which to attach the image path.
 * @param {Object} options Options for attaching the image path.
 * @param {boolean} options.forceReload If true, forces the image state to be reloaded from the server, bypassing any cached state.
 * @returns {Promise<Object>} A promise that resolves to the game object with the image path attached.
 */
export async function attachImagePath(game, { forceReload = false } = {}) {
  const imagePath = await resolveImagePath(game, { forceReload });

  return {
    ...game,
    imagePath,
  };
}

/**
 * Attaches image paths to a list of game objects.
 * @param {Array} games The list of game objects to which to attach image paths.
 * @param {Object} options Options for attaching the image paths.
 * @param {boolean} options.forceReload If true, forces the image state to be reloaded from the server, bypassing any cached state.
 * @returns {Promise<Array>} A promise that resolves to the list of game objects with the image paths attached.
 */
export async function attachImagePaths(games, { forceReload = false } = {}) {
  const results = [];

  for (const game of games) {
    results.push(await attachImagePath(game, { forceReload }));
  }

  return results;
}

/**
 * Loads the asset catalog.
 * @param {Object} options Options for loading the asset catalog.
 * @param {boolean} options.forceReload If true, forces the asset state to be reloaded from the server, bypassing any cached state.
 * @returns {Promise<Map>} A promise that resolves to the asset catalog.
 */
export async function loadAssetCatalog({ forceReload = false } = {}) {
  const state = await loadImageState({ forceReload });
  return state.catalog;
}

/**
 * Resolves the metadata for a game's asset.
 * @param {Object} game The game object for which to resolve asset metadata.
 * @param {Object} options Options for resolving asset metadata.
 * @param {boolean} options.forceReload If true, forces the asset state to be reloaded from the server, bypassing any cached state.
 * @returns {Promise<Object|null>} A promise that resolves to the asset metadata or null if not found.
 */
export async function resolveAssetMetadata(game, { forceReload = false } = {}) {
  const state = await loadImageState({ forceReload });

  const assetId =
    typeof game?.assetId === "string"
      ? game.assetId
      : assetIdFromGameLike(game);

  if (!assetId) return null;

  return state.catalog.get(assetId) || null;
}
