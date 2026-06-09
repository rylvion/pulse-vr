// account-store.js - Manages user bookings and favorite games using localStorage
const BOOKING_STORAGE_KEY = "pulse-bookings";
const FAVORITE_STORAGE_KEY = "pulse-favorites";

/**
 * Reads a stored list from localStorage.
 * @param {string} key - The storage key.
 * @returns {Array} The stored list or an empty array.
 */
function readStoredList(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Writes a list to localStorage.
 * @param {string} key - The storage key.
 * @param {Array} value - The list to store.
 */
function writeStoredList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures in private or restricted browsing modes.
  }
}

/**
 * Normalizes a game ID to a valid integer.
 * @param {*} value - The value to normalize.
 * @returns {number|null} The normalized game ID or null if invalid.
 */
function normalizeGameId(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 1 ? Math.floor(numeric) : null;
}

/**
 * Retrieves the list of saved bookings.
 * @returns {Array} The list of saved bookings.
 */
export function getSavedBookings() {
  return readStoredList(BOOKING_STORAGE_KEY).filter(
    (entry) => normalizeGameId(entry?.gameId) !== null,
  );
}

/**
 * Saves a booking.
 * @param {Object} booking - The booking to save.
 * @returns {Object|null} The saved booking or null if invalid.
 */
export function saveBooking(booking) {
  const gameId = normalizeGameId(booking?.gameId);
  if (gameId === null) return null;

  const entry = {
    gameId,
    gameTitle: String(booking?.gameTitle || ""),
    date: String(booking?.date || ""),
    time: String(booking?.time || ""),
    size: String(booking?.size || ""),
    savedAt: new Date().toISOString(),
  };

  const nextBookings = [
    entry,
    ...getSavedBookings().filter((current) => {
      return !(
        current.gameId === entry.gameId &&
        current.date === entry.date &&
        current.time === entry.time &&
        current.size === entry.size
      );
    }),
  ].slice(0, 10);

  writeStoredList(BOOKING_STORAGE_KEY, nextBookings);
  return entry;
}

/**
 * Retrieves the list of favorite game IDs.
 * @returns {Array} The list of favorite game IDs.
 */
export function getFavoriteGameIds() {
  return readStoredList(FAVORITE_STORAGE_KEY)
    .map(normalizeGameId)
    .filter((value) => value !== null);
}

/**
 * Checks if a game is marked as a favorite.
 * @param {*} gameId - The ID of the game to check.
 * @returns {boolean} True if the game is a favorite, false otherwise.
 */
export function isFavoriteGame(gameId) {
  const normalizedGameId = normalizeGameId(gameId);
  if (normalizedGameId === null) return false;

  return getFavoriteGameIds().includes(normalizedGameId);
}

/**
 * Toggles the favorite status of a game.
 * @param {Object} game - The game to toggle.
 * @returns {boolean} True if the game is now a favorite, false otherwise.
 */
export function toggleFavoriteGame(game) {
  const gameId = normalizeGameId(game?.id ?? game?.gameId);
  if (gameId === null) return false;

  const favorites = new Set(getFavoriteGameIds());
  if (favorites.has(gameId)) favorites.delete(gameId);
  else favorites.add(gameId);

  writeStoredList(FAVORITE_STORAGE_KEY, [...favorites]);
  return favorites.has(gameId);
}
