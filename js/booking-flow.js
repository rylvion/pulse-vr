// booking-flow.js
import { loadGameById } from "./games-db-loader.js";
import { attachImagePath, resolveAssetMetadata } from "./image-loader.js";
import { saveBooking } from "./account-store.js";

/**
 * Gets the URL search parameters.
 * @returns {URLSearchParams} The URL search parameters.
 */
function getParams() {
  return new URLSearchParams(window.location.search);
}

/**
 * Converts a value to an integer.
 * @param {*} value - The value to convert.
 * @param {*} fallback - The fallback value if conversion fails.
 * @returns {number} The converted integer or the fallback value.
 */
function toInt(value, fallback = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/**
 * Converts a date to a string in the format "YYYY-MM-DD".
 * @param {Date} date - The date to convert.
 * @returns {string} The date string.
 */
function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Generates a query string from an object of key-value pairs.
 * @param {Object} nextValues - The key-value pairs to include in the query string.
 * @returns {string} The query string.
 */
function queryString(nextValues = {}) {
  const params = getParams();

  Object.entries(nextValues).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

/**
 * Constructs a URL with the given path and query parameters.
 * @param {string} path - The URL path.
 * @param {Object} values - The query parameters.
 * @returns {string} The constructed URL.
 */
function withQuery(path, values = {}) {
  const query = queryString(values);
  return query ? `${path}?${query}` : path;
}

/**
 * Gets the booking query values from the URL search parameters.
 * @returns {Object} The booking query values.
 */
function getBookingQueryValues() {
  const params = getParams();
  return {
    game: params.get("game"),
    date: params.get("date"),
    time: params.get("time"),
    size: params.get("size"),
  };
}

/**
 * Initializes the booking stepper.
 */
function initStepper() {
  const current = document.body.dataset.bookingStep;
  if (!current) return;

  document.querySelectorAll("#booking-steps li").forEach((item) => {
    if (item.dataset.step === current) {
      item.setAttribute("aria-current", "step");
    } else {
      item.removeAttribute("aria-current");
    }
  });
}

/**
 * Hydrates the game preview section with data from the game ID in the URL search parameters.
 * Asynchronously fetches the game data and asset metadata, then updates the DOM elements with the game information.
 * @returns {Promise<void>} A promise that resolves when the game preview has been hydrated.
 */
async function hydrateGamePreview() {
  const gameId = toInt(getParams().get("game"), 1);
  const game = await loadGameById(gameId).then((value) =>
    value ? attachImagePath(value) : null,
  );

  if (!game) return;

  const title = document.getElementById("flow-game-title");
  const image = document.getElementById("flow-game-image");
  const details = document.getElementById("flow-game-details");

  if (title) title.textContent = game.title;
  if (image) {
    image.src = game.imagePath;
    image.alt = `${game.title} preview image`;
  }
  if (details) {
    details.textContent = `${game.duration} mins, ${game.difficulty} difficulty, ${game.minPlayers}-${game.maxPlayers} players`;
  }

  const asset = await resolveAssetMetadata(game);
  const sourceNode = document.getElementById("flow-game-source");
  const accessibilityNode = document.getElementById("flow-game-accessibility");

  if (sourceNode && asset) {
    sourceNode.textContent = `${asset.platform || "Unknown platform"} by ${asset.author?.name || "Unknown creator"}`;
  }

  if (accessibilityNode) {
    accessibilityNode.textContent =
      game.accessibilityNotes ||
      asset?.notes ||
      "Accessibility notes are not available for this game.";
  }
}

/**
 * Initializes the date and time step.
 * Sets up the date input with appropriate min and max values, and validates the input to enable or disable the next step link accordingly.
 * @returns {void}
 */
function initDateTimeStep() {
  const form = document.getElementById("date-time-form");
  if (!form) return;

  const dateInput = document.getElementById("booking-date");
  const timeSelect = document.getElementById("booking-time");
  const nextLink = document.getElementById("next-step-link");

  const today = new Date();
  const minDate = toDateInputValue(today);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 365);
  const maxDateValue = toDateInputValue(maxDate);

  if (dateInput && !dateInput.value) {
    dateInput.min = minDate;
    dateInput.max = maxDateValue;
    dateInput.value = minDate;
  }

  const validateDate = () => {
    if (!dateInput) return true;

    const value = dateInput.value;
    if (!value) {
      dateInput.setCustomValidity("Choose a booking date.");
      return false;
    }

    if (value < minDate) {
      dateInput.setCustomValidity("Bookings cannot be in the past.");
      return false;
    }

    if (value > maxDateValue) {
      dateInput.setCustomValidity("Bookings cannot be more than 1 year ahead.");
      return false;
    }

    dateInput.setCustomValidity("");
    return true;
  };

  const updateNextLink = () => {
    if (!nextLink || !dateInput || !timeSelect) return;

    const isValid = validateDate();
    nextLink.toggleAttribute("aria-disabled", !isValid);
    nextLink.dataset.disabled = String(!isValid);
    nextLink.href = isValid
      ? withQuery("../group-size/", {
          date: dateInput.value,
          time: timeSelect.value,
        })
      : "../group-size/";
  };

  dateInput?.addEventListener("change", updateNextLink);
  dateInput?.addEventListener("input", updateNextLink);
  timeSelect?.addEventListener("change", updateNextLink);
  nextLink?.addEventListener("click", (event) => {
    if (!validateDate()) {
      event.preventDefault();
      dateInput?.reportValidity();
      dateInput?.focus();
    }
  });
  updateNextLink();
}

/**
 * Initializes the group size step.
 * Sets up the input field for group size with appropriate min and max values, and validates the input to enable or disable the next step link accordingly.
 * @returns {void}
 */
function initGroupSizeStep() {
  const input = document.getElementById("group-size");
  const nextLink = document.getElementById("next-step-link");
  if (!input || !nextLink) return;

  const size = toInt(getParams().get("size"), 2);
  const minSize = 2;
  const maxSize = 8;
  input.min = String(minSize);
  input.max = String(maxSize);
  input.value = String(Math.max(minSize, Math.min(maxSize, size)));

  const validateSize = () => {
    const value = toInt(input.value, minSize);
    if (value < minSize) {
      input.setCustomValidity("Choose at least 2 players.");
      return false;
    }

    if (value > maxSize) {
      input.setCustomValidity("Choose no more than 8 players.");
      return false;
    }

    input.setCustomValidity("");
    return true;
  };

  const updateNextLink = () => {
    const isValid = validateSize();
    nextLink.toggleAttribute("aria-disabled", !isValid);
    nextLink.href = withQuery("../confirm/", {
      size: isValid ? input.value : String(minSize),
    });
  };

  input.addEventListener("input", updateNextLink);
  nextLink.addEventListener("click", (event) => {
    if (!validateSize()) {
      event.preventDefault();
      input.reportValidity();
      input.focus();
    }
  });
  updateNextLink();
}

/**
 * Initializes the confirmation step.
 * Retrieves the booking details from the URL search parameters and updates the DOM elements to display the selected date, time, and group size.
 * Also sets up the links for proceeding to payment or viewing the summary with the appropriate query parameters.
 * @returns {void}
 */
function initConfirmStep() {
  const queryValues = getBookingQueryValues();
  const dateValue = queryValues.date || "Not selected";
  const timeValue = queryValues.time || "Not selected";
  const sizeValue = queryValues.size || "Not selected";

  const dateNode = document.getElementById("confirm-date");
  const timeNode = document.getElementById("confirm-time");
  const sizeNode = document.getElementById("confirm-size");
  const payLink = document.getElementById("confirm-pay-link");
  const summaryLink = document.getElementById("summary-link");

  if (dateNode) dateNode.textContent = dateValue;
  if (timeNode) timeNode.textContent = timeValue;
  if (sizeNode) sizeNode.textContent = sizeValue;

  if (payLink) {
    payLink.href = withQuery("../success/", queryValues);
  }

  if (summaryLink) {
    summaryLink.href = withQuery("../summary/", queryValues);
  }
}

async function initSuccessStep() {
  const queryValues = getBookingQueryValues();
  const summaryLink = document.getElementById("summary-link");
  if (summaryLink) {
    summaryLink.href = withQuery("../summary/", queryValues);
  }

  const gameId = toInt(queryValues.game, 1);
  const game = await loadGameById(gameId);
  if (game && queryValues.date && queryValues.time && queryValues.size) {
    saveBooking({
      gameId: game.id,
      gameTitle: game.title,
      date: queryValues.date,
      time: queryValues.time,
      size: queryValues.size,
    });
  }
}

/**
 * Initializes the summary step.
 * Retrieves the booking details from the URL search parameters and fetches the game data based on the game ID.
 * Updates the DOM elements to display the game title, selected date, time, and group size in the summary section.
 * @returns {Promise<void>} A promise that resolves when the summary step has been initialized.
 */
async function initSummaryStep() {
  const gameNode = document.getElementById("summary-game");
  const dateNode = document.getElementById("summary-date");
  const timeNode = document.getElementById("summary-time");
  const sizeNode = document.getElementById("summary-size");
  const gameId = toInt(getParams().get("game"), 1);
  const game = await loadGameById(gameId);

  if (gameNode) gameNode.textContent = game?.title || String(gameId);
  if (dateNode)
    dateNode.textContent = getParams().get("date") || "Not selected";
  if (timeNode)
    timeNode.textContent = getParams().get("time") || "Not selected";
  if (sizeNode)
    sizeNode.textContent = getParams().get("size") || "Not selected";
}

async function initBookingFlow() {
  initStepper();
  await hydrateGamePreview();

  const step = document.body.dataset.bookingStep;
  if (step === "date") initDateTimeStep();
  if (step === "group") initGroupSizeStep();
  if (step === "confirm") initConfirmStep();
  if (step === "success") initSuccessStep();
  if (step === "summary") initSummaryStep();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBookingFlow);
} else {
  initBookingFlow();
}
