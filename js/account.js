// account.js - Handles theme controls on the account page
import {
  applyThemeMode,
  getStoredThemeMode,
  setStoredThemeMode,
} from "./theme-mode.js";

/**
 * Initialises the theme controls on the account page.
 * Sets up event listeners for theme selection and applies the active theme.
 */
function initThemeControls() {
  const form = document.getElementById("theme-form");
  const status = document.getElementById("theme-status");
  if (!form) return;

  const activeMode = getStoredThemeMode();
  const activeInput = form.querySelector(
    `input[name="theme-mode"][value="${activeMode}"]`,
  );
  if (activeInput instanceof HTMLInputElement) {
    activeInput.checked = true;
  }

  form.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.name !== "theme-mode")
      return;

    const mode = setStoredThemeMode(target.value);
    if (status) status.textContent = `Theme saved: ${mode}`;
  });

  applyThemeMode(activeMode);
  if (status) status.textContent = `Active theme: ${activeMode}`;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThemeControls);
} else {
  initThemeControls();
}
