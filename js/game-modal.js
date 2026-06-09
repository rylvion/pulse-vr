let activeGame = null;

export function goToGameDetails(game) {
  const url = new URL("pulse-vr/game.html", window.location.origin);

  url.searchParams.set("id", game.id);
  url.searchParams.set("redir", window.location.pathname);

  window.location.href = url.toString();
}

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

function handleEscClose(e) {
  if (e.key === "Escape") {
    closeGameModal();
  }
}

export function closeGameModal() {
  const modal = document.getElementById("game-preview-modal");
  if (!modal) return;

  modal.style.display = "none";
  modal.innerHTML = "";

  activeGame = null;

  document.removeEventListener("keydown", handleEscClose);
}
