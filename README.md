# Stitch & Style 👗

A cozy dressmaker game for your phone. Run a little boutique: listen to each customer, design their dress, sew it, get paid, buy new fabrics, and earn enough stars to attract fancier clients (weddings, galas, even brides).

It's a web app with no App Store and no download. Once you add it to the iPhone Home Screen, it opens full-screen like a real app and works offline.

## How to play

1. **Listen.** Each customer tells you their event, their favorite color, something they *must* have and something they *hate*.
2. **Design.** Choose a style, length, sleeves, color, pattern and trim that suit the occasion.
3. **Sew.** Tap when the needle is in the green zone. The darker middle is a perfect stitch.
4. **Earn.** Better dresses mean more money and stars. Spend money in **Supplies** on new fabrics and trims; stars unlock new kinds of events.

Progress saves automatically on the device.

## Putting it on an iPhone

### 1. Host it (one-time, free with GitHub Pages)
1. On GitHub, open this repo, then **Settings → Pages**.
2. Under **Build and deployment**, set *Source* to **Deploy from a branch**.
3. Pick the branch with the game (e.g. `main`, or `claude/dressmaker-game-iphone-llo05e`) and the `/ (root)` folder, then **Save**.
4. After a minute the page shows your link, like `https://<your-username>.github.io/Game-Project/`.

> Free GitHub Pages needs the repository to be **public**.

### 2. Install on the iPhone
1. Open the link in **Safari** on the iPhone. It must be Safari, not Chrome.
2. Tap the **Share** button (the square with the arrow).
3. Scroll down and tap **Add to Home Screen**, then **Add**.
4. Launch **Stitch & Style** from the Home Screen. 🎉

## Files
- `index.html`: the entire game (HTML, CSS and JavaScript)
- `manifest.webmanifest`, `icon-*.png`: Home Screen app name and icon
- `sw.js`: offline support
