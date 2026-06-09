// asset-utils.js - Utility functions for handling game asset IDs and file names.
const A_CODE = 65;
const ZERO_CODE = 48;
const NINE_CODE = 57;

/**
 * Checks if the given code represents a digit between '0' and '9' (inclusive) in UTF-16.
 * @param {number} code - The UTF-16 code unit to check.
 * @returns {boolean} - true if the code is a digit, false otherwise.
 */
function isDigitCode(code) {
  return code >= ZERO_CODE && code <= NINE_CODE;
}

/**
 * Checks if the given string represents a valid asset ID. (e.g. "A013")
 * @param {string} value - the string to check.
 * @returns {boolean} - true if the string is a valid asset ID, false otherwise.
 */
function isAssetIdString(value) {
  // Accepts strings like "A013"
  return (
    typeof value === "string" &&
    value.length === 4 &&
    value.charCodeAt(0) === A_CODE &&
    isDigitCode(value.charCodeAt(1)) &&
    isDigitCode(value.charCodeAt(2)) &&
    isDigitCode(value.charCodeAt(3))
  );
}

/**
 * Checks if the given string starts with a valid asset file prefix. (e.g. "A013-")
 * @param {string} value - the string to check.
 * @returns {boolean} - true if the string starts with a valid asset file prefix, false otherwise.
 */
function isAssetFilePrefix(value) {
  return (
    typeof value === "string" &&
    value.length >= 5 &&
    (value.charCodeAt(0) === A_CODE || value.charCodeAt(0) === 97) &&
    isDigitCode(value.charCodeAt(1)) &&
    isDigitCode(value.charCodeAt(2)) &&
    isDigitCode(value.charCodeAt(3)) &&
    value.charCodeAt(4) === 45
  );
}

/**
 * Normalizes a game ID to a valid numeric ID. Accepts numbers or strings that can be converted to numbers.
 * @param {number|string|null|undefined} value - the value to normalize.
 * @returns {number|null} - the normalized game ID as a number, or null if the input is invalid.
 */
export function normalizeGameId(value) {
  if (typeof value === "number") {
    if (Number.isFinite(value) && value >= 1) return value;
    return null;
  }

  if (value === null || value === undefined) return null;

  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 1) return null;

  return numeric;
}

/**
 * Converts a numeric game ID to an asset ID string. For example, 13 becomes "A013".
 * @param {number} id - the numeric game ID to convert.
 * @returns {string} - the corresponding asset ID string.
 */
export function toAssetIdFromNumericId(id) {
  return `A${String(id).padStart(3, "0")}`;
}

/**
 * Normalizes a value to a valid asset ID string. Accepts strings that are already valid asset IDs or can be converted to uppercase valid asset IDs.
 * @param {string} value - the value to normalize.
 * @returns {string|null} - the normalized asset ID string, or null if the input is invalid.
 */
export function normalizeAssetId(value) {
  if (isAssetIdString(value)) return value;
  if (typeof value !== "string") return null;

  const upper = value.toUpperCase();
  return isAssetIdString(upper) ? upper : null;
}

/**
 * Extracts an asset ID from a game-like object.
 * @param {Object} gameLike - the game-like object to extract the asset ID from.
 * @returns {string|null} - the extracted asset ID string, or null if not found.
 */
export function assetIdFromGameLike(gameLike) {
  const direct = normalizeAssetId(gameLike?.assetId);
  if (direct) return direct;

  const gameId = normalizeGameId(gameLike?.id);
  if (gameId === null) return null;

  return toAssetIdFromNumericId(gameId);
}

/**
 * Extracts a file name from a file path.
 * @param {string} value - the file path to extract the name from.
 * @returns {string|null} - the extracted file name, or null if not found.
 */
export function fileNameFromPath(value) {
  if (typeof value !== "string") return null;

  const slashIndex = value.lastIndexOf("/");
  const file = (slashIndex === -1 ? value : value.slice(slashIndex + 1)).trim();
  return file || null; //
}

/**
 * Combines an asset ID and a file name into a single string with the format "ASSETID-FILENAME". If the file name already starts with the asset ID prefix, it is returned as is.
 * @param {string} assetId - the asset ID to use as a prefix.
 * @param {string} fileName - the file name to combine with the asset ID.
 * @returns {string|null} - the combined string, or null if the input is invalid.
 */
export function withAssetPrefix(assetId, fileName) {
  if (!assetId || typeof fileName !== "string") return null;

  const clean = fileName.trim();
  if (!clean) return null;

  if (isAssetFilePrefix(clean)) return clean;

  return `${assetId}-${clean}`;
}
