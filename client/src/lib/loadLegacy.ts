// loadLegacy.ts
// Dynamically loads legacy JS files from the project root /js folder in order.
// This keeps the legacy scripts out of the Vite bundle and allows them to
// attach globals (window.renderShop, window.claimDaily, etc.) that the
// migrated React pages still call.

const legacyFiles = [
  "/js/data.js",
  "/js/familiar.js",
  "/js/game.js",
  "/js/ui.js",
  "/js/training.js",
  "/js/battle.js",
  "/js/achievements.js",
  "/js/crafting.js",
  "/js/lucky.js",
  "/js/sound.js",
  "/js/main.js",
];

export async function loadLegacyScripts(): Promise<void> {
  const head = document.head || document.getElementsByTagName("head")[0];

  for (const src of legacyFiles) {
    // Skip if already present
    if (document.querySelector(`script[src="${src}"]`)) continue;

    // Create script tag and wait for it to load
    await new Promise<void>((res) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = false; // preserve order
      s.onload = () => {
        // small delay to allow immediate inline execution to finish
        setTimeout(res, 0);
      };
      s.onerror = () => {
        // Log and continue
        // console is useful for debugging when legacy scripts are missing
        console.warn("Failed to load legacy script", src);
        res();
      };
      head.appendChild(s);
    });
  }

  // Give the legacy init a tick and attempt to sync UI
  await new Promise((r) => setTimeout(r, 10));

  const w = window as unknown as { updateUI?: () => void };
  if (typeof w.updateUI === "function") w.updateUI();
}

export default loadLegacyScripts;
