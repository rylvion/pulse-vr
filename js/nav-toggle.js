(() => {
  const btn = document.querySelector(".nav-toggle-btn");
  const menu = document.getElementById("nav-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth > 760) return;
      menu.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
})();
