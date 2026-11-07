# Stitch & Style: A Century of Fashion 🧵

A dressmaking and tailoring sim you play sideways on your phone, like a PC game. Run the Hart family's tailoring shop through **140 years of fashion**, from Victorian bustle gowns in 1885 to red-carpet gowns and streetwear in 2025. Each generation of the family takes over the shop in a new era.

It's a web app, so there's no App Store. Add it to the iPhone Home Screen and it runs full-screen and works offline.

## The game

- **Story mode, 6 eras:** 1885 Victorian → 1925 Roaring Twenties → 1955 Fifties → 1975 Seventies → 1995 Nineties → 2025 Today. Each era has its own shop decor, music, customers, hairstyles and clothing.
- **The shop:** an illustrated shop with a window to the street, fabric bolts on the shelves, a mannequin showing your latest piece, and family portraits that build up over the generations. Customers walk in and tell you their order.
- **All kinds of clothing:** 30 patterns, including bustle gowns, frock coats, flapper dresses, three-piece suits, swing dresses, biker jackets, bell-bottoms, disco suits, slip dresses, flannels, hoodies, blazers, trench coats and more.
- **The workroom:** pattern book → pull a fabric bolt → dye it → **cut** (trace the chalk line with your finger) → **sew** (tap when the needle is in the green) → add trims → **press** (hold to heat the iron and let go at the right heat for the fabric: silk is low, linen is high).
- **The fitting:** the customer tries on your work, reacts, rates it and pays.
- **Supplier catalogue:** 16 fabrics, 26 dyes, 10 trims, patterns, and tool upgrades (shears → rotary cutter, hand needle → overlocker, stove flat-iron → steam station).
- **Famous patrons:** earn enough stars and a celebrity of the era commissions a piece. Impress them and the shop passes to the next generation.
- **Audio:** different music for each era (music-box waltz, ragtime, doo-wop, disco, 90s rock, lo-fi) plus sound effects. All of it is generated in the browser, with no audio files.

## Putting it on an iPhone

### 1. Host it (one-time, free with GitHub Pages)
1. On GitHub, open this repo, then **Settings → Pages**.
2. Under **Build and deployment**, set *Source* to **Deploy from a branch**.
3. Pick the branch with the game and the `/ (root)` folder, then **Save**.
4. After a minute the page shows your link, like `https://<your-username>.github.io/Game-Project/`.

> Free GitHub Pages needs the repository to be **public**.

### 2. Install on the iPhone
1. Open the link in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Open **Stitch & Style** from the Home Screen and **turn the phone sideways** (rotation lock must be off).
4. For sound, flip the **silent switch** off and turn the volume up.

If you update the game later, close and reopen the app (sometimes twice) to get the new version.

## Files
- `index.html`, `style.css`: page shell and styling. The game uses a fixed 800×450 stage that scales to fit any screen.
- `js/data.js`: eras, story text, garments, fabrics, dyes, trims and tools
- `js/art.js`: all the artwork, drawn as SVG in code (characters, clothing, fabrics, shops, tools)
- `js/audio.js`: music for each era and sound effects (Web Audio)
- `js/game.js`: screens, dialogue, mini-games and save system
- `sw.js`, `manifest.webmanifest`, `icon-*.png`: offline support and the Home Screen app
