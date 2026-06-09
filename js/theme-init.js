(() => {
    try {
        document.documentElement.dataset.mode =
          localStorage.getItem("pulse-theme-mode") || "neon";
      } catch {
        document.documentElement.dataset.mode = "neon";
      }
})()