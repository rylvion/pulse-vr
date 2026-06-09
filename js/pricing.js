import { openGameModal } from "./game-modal.js";

/**
 * Initialises the pricing page by ensuring the game preview modal exists and setting up hover effects for price cards.
 */
function ensureModalExists() {
  if (document.getElementById("game-preview-modal")) return;

  const modal = document.createElement("div");
  modal.id = "game-preview-modal";
  modal.className = "modal";

  document.body.appendChild(modal);
}

function initPricingPage() {
  ensureModalExists();
  setupPriceCardEffects();
}

/**
 * Sets up hover effects for the price cards.
 */
function setupPriceCardEffects() {
  const cards = document.querySelectorAll(".price-card");

  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-6px)";
      card.style.transition = "0.2s ease";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0px)";
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPricingPage);
} else {
  initPricingPage();
}
