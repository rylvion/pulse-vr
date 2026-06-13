// account-store.js - Manages user bookings using localStorage

const BOOKING_STORAGE_KEY = "pulse-bookings";

/**
 * Reads a stored list from localStorage.
 * @param {string} key The storage key.
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
 * @param {string} key The storage key.
 * @param {Array} value The list to store.
 */
function writeStoredList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures (private mode / quota issues)
  }
}

/**
 * Normalises a game ID to a valid integer.
 * @param {string|number} value The value to normalise.
 * @returns {number|null} The normalised game ID or null if invalid.
 */
function normaliseGameId(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 1 ? Math.floor(numeric) : null;
}

/**
 * Retrieves the list of saved bookings.
 * @returns {Array} The list of saved bookings.
 */
export function getSavedBookings() {
  return readStoredList(BOOKING_STORAGE_KEY).filter(
    (entry) => normaliseGameId(entry?.gameId) !== null,
  );
}

/**
 * Saves a booking.
 * Prevents duplicates and keeps latest 10 bookings.
 *
 * @param {Object} booking The booking to save.
 * @returns {Object|null} The saved booking or null if invalid.
 */
export function saveBooking(booking) {
  const gameId = normaliseGameId(booking?.gameId);
  if (gameId === null) return null;

  const entry = {
    id: booking?.id || crypto.randomUUID(),
    gameId,
    gameTitle: String(booking?.gameTitle || ""),
    date: String(booking?.date || ""),
    time: String(booking?.time || ""),
    size: String(booking?.size || ""),
    savedAt: new Date().toISOString(),
  };

  const existing = getSavedBookings();

  const nextBookings = [
    entry,
    ...existing.filter((current) => current.id !== entry.id),
  ].slice(0, 3);

  writeStoredList(BOOKING_STORAGE_KEY, nextBookings);

  return entry;
}
