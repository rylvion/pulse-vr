const THEME_STORAGE_KEY = "pulse-theme-mode";
const SUPPORTED_MODES = new Set(["neon", "dark", "light", "high-contrast"]);

/**
 * Normalises the theme mode value.
 * @param {string} value The theme mode value to normalise.
 * @returns {string} The normalised theme mode.
 */
function normaliseThemeMode(value) {
  const mode = String(value || "")
    .trim()
    .toLowerCase();
  return SUPPORTED_MODES.has(mode) ? mode : "neon";
}

/**
 * Retrieves the stored theme mode from localStorage.
 * @returns {string} The normalized theme mode, or "neon" if not found or invalid.
 */
export function getStoredThemeMode() {
  try {
    return normaliseThemeMode(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "neon";
  }
}

/**
 * Applies the specified theme mode to the document.
 * @param {string} mode The theme mode to apply.
 * @returns {string} The normalised theme mode.
 */
export function applyThemeMode(mode) {
  const normalised = normaliseThemeMode(mode);
  document.documentElement.dataset.mode = normalised;
  return normalised;
}

/**
 * Sets the theme mode and stores it in localStorage.
 * @param {string} mode The theme mode to set.
 * @returns {string} The normalised theme mode.
 */
export function setStoredThemeMode(mode) {
  const normalised = applyThemeMode(mode);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, normalised);
  } catch {
    // ignore localStorage failures (private mode or denied storage).
  }

  return normalised;
}

if (!document.documentElement.dataset.mode) {
  applyThemeMode(getStoredThemeMode());
}
