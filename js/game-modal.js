let activeGame = null; // Holds the currently active game for the modal


/**
 * Navigates to the game details page for the specified game, passing the game ID and current page as query parameters.
 * @param {Object} game The game object for which to show details. 
 */
export function goToGameDetails(game) {
  const url = new URL("pulse-vr/game.html", window.location.origin);

  url.searchParams.set("id", game.id);
  url.searchParams.set("redir", window.location.pathname);

  window.location.href = url.toString();
}

/**
 * Opens a modal dialog to preview the details of the specified game, including its image, title, description, and metadata.
 * @param {Object} game The game object containing the details to display in the modal.
 */
export function openGameModal(game) {
  activeGame = game;

  const modal = document.getElementById("game-preview-modal");
  if (!modal) return;

  const genreList = Array.isArray(game.genre)
    ? game.genre.join(", ")
    : "Unknown";

  const difficulty = game.difficulty || "Unknown";

  modal.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop"></div>

    <div class="modal-content" role="dialog" aria-modal="true">

      <button id="modal-close" aria-label="Close modal">✕</button>

      <img
        src="${game.imagePath}"
        alt="${game.title}"
        class="modal-image"
        loading="lazy"
      >

      <h2>${game.title}</h2>

      <p>${game.shortDesc || ""}</p>

      <div class="modal-meta">
        <p><strong>Genres:</strong> ${genreList}</p>
        <p><strong>Difficulty:</strong> ${difficulty}</p>
        <p><strong>Players:</strong> ${game.minPlayers} - ${game.maxPlayers}</p>
        <p><strong>Duration:</strong> ${game.duration} min</p>
        <p><strong>Rating:</strong> ${game.rating} ⭐ (${game.ratingCount})</p>
        <p><strong>Accessibility:</strong> ${game.accessibilityNotes || "None"}</p>
      </div>

      <button id="see-details-btn" class="primary-btn">
        See All Details
      </button>

    </div>
  `;

  modal.style.display = "flex";

  const closeBtn = modal.querySelector("#modal-close");
  const backdrop = modal.querySelector("#modal-backdrop");
  const detailsBtn = modal.querySelector("#see-details-btn");

  closeBtn?.addEventListener("click", closeGameModal);
  backdrop?.addEventListener("click", closeGameModal);

  detailsBtn?.addEventListener("click", () => {
    goToGameDetails(game);
  });

  document.addEventListener("keydown", handleEscClose);
}

/**
 * Handles the ESC key press event to close the game modal.
 * @param {KeyboardEvent} e - The keyboard event object.
 */
function handleEscClose(e) {
  if (e.key === "Escape") {
    closeGameModal();
  }
}

/**
 * Closes the game preview modal by hiding it and clearing its content, and removes the event listener for the ESC key.
 */
export function closeGameModal() {
  const modal = document.getElementById("game-preview-modal");
  if (!modal) return;

  modal.style.display = "none";
  modal.innerHTML = "";

  activeGame = null;

  document.removeEventListener("keydown", handleEscClose);
}
