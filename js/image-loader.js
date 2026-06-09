import { assetIdFromGameLike, withAssetPrefix } from "./asset-utils.js";

const ASSETS_DB_URL = new URL("pulse-vr/assets/data/assets.json", import.meta.url);
const ASSETS_DB_FALLBACK_URL = new URL(
  "pulse-vr/assets/data/assets.json",
  import.meta.url,
);

const IMAGES_BASE_URL = new URL("pulse-vr/assets/images/", import.meta.url);
const DEFAULT_IMAGE_FILE = "https://placehold.co/320x200";

let imageStatePromise;

function createImageState(index, catalog) {
  return { index, catalog };
}

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

export async function resolveImageFileName(game) {
  const imageObj = game?.image;

  if (imageObj && typeof imageObj === "object") {
    return imageObj.AVIF || imageObj.WEBP || imageObj.JPG || DEFAULT_IMAGE_FILE;
  }

  return DEFAULT_IMAGE_FILE;
}

export async function resolveImagePath(game) {
  const fileName = await resolveImageFileName(game);

  if (!fileName) return DEFAULT_IMAGE_FILE;
  if (fileName.startsWith("http")) return fileName;

  return new URL(fileName, IMAGES_BASE_URL).toString();
}

export async function attachImagePath(game, { forceReload = false } = {}) {
  const imagePath = await resolveImagePath(game, { forceReload });

  return {
    ...game,
    imagePath,
  };
}

export async function attachImagePaths(games, { forceReload = false } = {}) {
  const results = [];

  for (const game of games) {
    results.push(await attachImagePath(game, { forceReload }));
  }

  return results;
}

export async function loadAssetCatalog({ forceReload = false } = {}) {
  const state = await loadImageState({ forceReload });
  return state.catalog;
}

export async function resolveAssetMetadata(game, { forceReload = false } = {}) {
  const state = await loadImageState({ forceReload });

  const assetId =
    typeof game?.assetId === "string"
      ? game.assetId
      : assetIdFromGameLike(game);

  if (!assetId) return null;

  return state.catalog.get(assetId) || null;
}
