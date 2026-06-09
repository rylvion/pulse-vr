import { openGameModal } from "./game-modal.js";

function ensureModalExists() {
  if (document.getElementById("game-preview-modal")) return;

  const modal = document.createElement("div");
  modal.id = "game-preview-modal";
  modal.className = "modal";

  document.body.appendChild(modal);
}

function initPricingPage() {
  ensureModalExists();

  console.log("Pricing page loaded ✔");

  setupPriceCardEffects();
}

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
