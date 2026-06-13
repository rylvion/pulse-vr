// account.js - Handles theme controls and order history on the account page
import {
  applyThemeMode,
  getStoredThemeMode,
  setStoredThemeMode,
} from "./theme-mode.js";
import { getSavedBookings } from "./account-store.js";

/**
 * Renders the saved bookings into the order history list.
 */
function renderOrderHistory() {
  const ordersList = document.getElementById("account-orders");
  if (!ordersList) return;

  const bookings = getSavedBookings();

  if (bookings.length === 0) {
    ordersList.innerHTML = `<li class="account-state">No bookings found, <a href="../bookings/">Create one now</a></li>`;
    return;
  }

  ordersList.innerHTML = bookings
    .map(
      (b) => `<li>
                <a href="${b.id ? `../bookings/summary/?bookingId=${encodeURIComponent(b.id)}` : "#"}">
                  <strong>${b.gameTitle || "Game"}</strong>
                  <span class="booking-id">${b.id || "N/A"}</span>
                  <span>${b.date || ""} at ${b.time || ""} (${b.size || ""} players)</span>
                </a>
              </li>`,
    )
    .join("");
}

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

function init() {
  initThemeControls();
  renderOrderHistory();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
