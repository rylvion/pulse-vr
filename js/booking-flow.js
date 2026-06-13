// booking-flow.js
const DRAFT_KEY = "bookingDraft";

import { loadGameById } from "./games-db-loader.js";
import { attachImagePath, resolveAssetMetadata } from "./image-loader.js";
import { saveBooking } from "./account-store.js";

/**
 * Retrieves the current booking draft from localStorage.
 * @returns {Object} The current booking draft or an empty object if no draft exists.
 */
function getDraft() {
  return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {};
}

/**
 * Updates the booking draft with the given values and saves it to localStorage.
 * @param {Object} update The values to update in the draft.
 * @returns {Object} The updated draft.
 */
function setDraft(update) {
  const current = getDraft();
  const next = { ...current, ...update };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  return next;
}

/**
 * Gets the URL search parameters. (e.g. ?game=1 or id=2&redir=%2Fpulse-vr%2F)
 * @returns {URLSearchParams} The URL search parameters.
 */
function getParams() {
  return new URLSearchParams(window.location.search);
}

/**
 * Converts a value to an integer.
 * @param {string|number} value The value to convert.
 * @param {number} fallback The fallback value if conversion fails.
 * @returns {number} The converted integer or the fallback value.
 */
function toInt(value, fallback = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/**
 * Converts a date to a string in the format "YYYY-MM-DD".
 * @param {Date} date The date to convert.
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
 * @param {Object} nextValues The key-value pairs to include in the query string.
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
 * Constructs a URL with the given path and query parameters. e.g. withQuery("../date-time/", { game: 1, redir: "/pulse-vr/" })
 * @param {string} path The URL path.
 * @param {Object} values The query parameters.
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
 * Initialises the booking stepper.
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
  const draft = getDraft();

  const gameId = toInt(draft.game || getParams().get("game"), 1);

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
    details.textContent =
      `${game.duration} mins, ` +
      `${game.difficulty} difficulty, ` +
      `${game.minPlayers}-${game.maxPlayers} players`;
  }

  const asset = await resolveAssetMetadata(game);

  const sourceNode = document.getElementById("flow-game-source");
  const accessibilityNode = document.getElementById("flow-game-accessibility");

  if (sourceNode) {
    sourceNode.textContent = asset
      ? `${asset.platform || "Unknown platform"} by ${asset.author?.name || "Unknown creator"}`
      : "Unknown source";
  }

  if (accessibilityNode) {
    accessibilityNode.textContent =
      game.accessibilityNotes ||
      asset?.notes ||
      "Accessibility notes are not available for this game.";
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Booking Step: Date & Time Selection Page
////////////////////////////////////////////////////////////////////////////////

/**
 * Initialises the date and time selection step.
 * Sets up the date input with appropriate min and max values, validates the selected date, and updates the next step link based on the validity of the input.
 * @returns {void}
 */
function initDateTimeStep() {
  const form = document.getElementById("date-time-form");
  if (!form) return;

  const dateInput = document.getElementById("booking-date");
  const timeSelect = document.getElementById("booking-time");
  const nextLink = document.getElementById("next-step-link");
  const errorNode = document.getElementById("booking-date-error");

  const today = new Date();
  const minDate = toDateInputValue(today);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 365);
  const maxDateValue = toDateInputValue(maxDate);

  if (dateInput) {
    dateInput.min = minDate;
    dateInput.max = maxDateValue;

    if (!dateInput.value) {
      dateInput.value = minDate;
    }
  }

  const showError = (message = "") => {
    if (errorNode) errorNode.textContent = message;
  };

  const validateDate = () => {
    if (!dateInput) return true;

    const value = dateInput.value;

    if (!value) {
      dateInput.setCustomValidity("Choose a booking date.");
      showError("Please choose a booking date.");
      return false;
    }

    if (value < minDate) {
      dateInput.setCustomValidity("Bookings cannot be in the past.");
      showError("Bookings cannot be in the past.");
      return false;
    }

    if (value > maxDateValue) {
      dateInput.setCustomValidity("Bookings cannot be more than 1 year ahead.");
      showError("Bookings cannot be more than 1 year ahead.");
      return false;
    }

    dateInput.setCustomValidity("");
    showError("");
    return true;
  };

  const updateNextLink = () => {
    if (!nextLink || !dateInput || !timeSelect) return;

    const isValid = validateDate();

    nextLink.toggleAttribute("aria-disabled", !isValid);
    nextLink.dataset.disabled = String(!isValid);

    setDraft({
      ...getDraft(),
      date: dateInput.value,
      time: timeSelect.value,
    });

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
      dateInput.focus();
    }
  });

  updateNextLink();
}

////////////////////////////////////////////////////////////////////////////////
// Booking Step: Group Size Selection Page
////////////////////////////////////////////////////////////////////////////////

/**
 * Initialises the group size step.
 * Sets up the input field for group size with appropriate min and max values, and validates the input to enable or disable the next step link accordingly.
 * @returns {void}
 */
function initGroupSizeStep() {
  const input = document.getElementById("group-size");
  const nextLink = document.getElementById("next-step-link");

  if (!input || !nextLink) return;

  const minSize = 2;
  const maxSize = 8;

  const draft = getDraft();

  const initialSize = toInt(draft.size || getParams().get("size"), minSize);

  input.min = String(minSize);
  input.max = String(maxSize);
  input.value = String(Math.max(minSize, Math.min(maxSize, initialSize)));

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

    setDraft({
      ...getDraft(),
      size: input.value,
    });

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

////////////////////////////////////////////////////////////////////////////////
// Booking Step: Confirmation Page
////////////////////////////////////////////////////////////////////////////////

/**
 * Initialises the confirmation step.
 * Retrieves the booking details from the URL search parameters and updates the DOM elements to display the selected date, time, and group size.
 * Also sets up the links for proceeding to payment or viewing the summary with the appropriate query parameters.
 */
function initConfirmStep() {
  const draft = getDraft();

  const dateValue = draft.date || getParams().get("date") || "Not selected";
  const timeValue = draft.time || getParams().get("time") || "Not selected";
  const sizeValue = draft.size || getParams().get("size") || "Not selected";

  const dateNode = document.getElementById("confirm-date");
  const timeNode = document.getElementById("confirm-time");
  const sizeNode = document.getElementById("confirm-size");

  const payLink = document.getElementById("confirm-pay-link");
  const summaryLink = document.getElementById("summary-link");

  if (dateNode) dateNode.textContent = dateValue;
  if (timeNode) timeNode.textContent = timeValue;
  if (sizeNode) sizeNode.textContent = sizeValue;

  const previewParams = {
    game: draft.game || getParams().get("game"),
    date: draft.date || getParams().get("date"),
    time: draft.time || getParams().get("time"),
    size: draft.size || getParams().get("size"),
  };

  if (payLink) {
    payLink.href = withQuery("../success/", previewParams);
  }

  if (summaryLink) {
    summaryLink.href = withQuery("../summary/", previewParams);
  }
}
/////////////////////////////////////////////////////////////////////////////////
// Booking Step: Success Page
////////////////////////////////////////////////////////////////////////////////

/**
 * Initialises the success step.
 * Retrieves the booking details from the URL search parameters, fetches the game data based on the game ID, and saves the booking information to the account store.
 * Also updates the summary link with the appropriate query parameters for viewing the booking summary.
 * @returns {Promise<void>} A promise that resolves when the success step has been initialised.
 */
async function initSuccessStep() {
  const draft = getDraft();
  const summaryLink = document.getElementById("summary-link");
  const gameId = toInt(draft.game, 1);
  const game = await loadGameById(gameId);

  let bookings = null;

  if (game && draft.date && draft.time && draft.size && !draft.saved) {
    booking = {
      id: crypto.randomUUID(),
      gameId: game.id,
      gameTitle: game.title,
      date: draft.date,
      time: draft.time,
      size: draft.size,
      savedAt: new Date().toISOString(),
    };

    saveBooking(booking);

    setDraft({ ...draft, saved: true, bookingId: booking.id });
  }

  if (summaryLink) {
    const id = booking?.id || draft.bookingId;
    summaryLink.href = id ? `../summary/?bookingId=${id}` : "../summary/";
  }
  localStorage.removeItem(DRAFT_KEY);
}

///////////////////////////////////////////////////////////////////////////////
// Booking Step: Summary Page
///////////////////////////////////////////////////////////////////////////////

/**
 * Initialises the summary step.
 * Retrieves the booking details from the URL search parameters and fetches the game data based on the game ID.
 * Updates the DOM elements to display the game title, selected date, time, and group size in the summary section.
 * @returns {Promise<void>} A promise that resolves when the summary step has been initialised.
 */
async function initSummaryStep() {
  const gameNode = document.getElementById("summary-game");
  const dateNode = document.getElementById("summary-date");
  const timeNode = document.getElementById("summary-time");
  const sizeNode = document.getElementById("summary-size");

  const params = getParams();
  const bookingId = params.get("bookingId");

  let gameId;
  let date;
  let time;
  let size;

  if (bookingId) {
    const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const booking = bookings.find((b) => b.id === bookingId);

    if (booking) {
      gameId = booking.gameId;
      date = booking.date;
      time = booking.time;
      size = booking.size;
    }
  }

  if (!gameId) {
    const draft = getDraft();

    gameId = draft.game || params.get("game");
    date = draft.date || params.get("date");
    time = draft.time || params.get("time");
    size = draft.size || params.get("size");
  }

  const game = await loadGameById(toInt(gameId, 1));

  if (gameNode) gameNode.textContent = game?.title || String(gameId);

  if (dateNode) dateNode.textContent = date || "Not selected";

  if (timeNode) timeNode.textContent = time || "Not selected";

  if (sizeNode) sizeNode.textContent = size || "Not selected";
}

///////////////////////////////////////////////////////////////////////////////
// Booking Flow Initialisation
///////////////////////////////////////////////////////////////////////////////
/**
 * Procedural Function: Initialises the booking flow by setting up the stepper, hydrating the game preview, and initialising thet.
 * The function is executed when the DOM content is fully loaded.
 * @returns {Promise<void>} A promise that resolves when the booking flow has been initialised.
 */
async function initBookingFlow() {
  initStepper();

  const step = document.body.dataset.bookingStep;

  const showGamePreview = ["date", "group", "confirm"].includes(step);

  if (showGamePreview) {
    await hydrateGamePreview();
  }
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
