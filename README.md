# G's Letters — first version

A phonics app for the tablet: Sound Garden, Letters (stroke animations, stylus writing, Sound Match), My Creatures, and a parent panel.

## Putting it on the tablet (GitHub Pages, free)

The app needs its own https address so the microphone, offline mode and "install" work.

1. Make a GitHub account if you don't have one, then create a new repository (e.g. `letters`). It can be public: the repository holds only the app's code. Your photos and recordings never leave the tablet.
2. Upload everything in this folder (keep the `js/` and `icons/` folders) to the repository.
   From Debian: `git init && git add . && git commit -m "first version" && git branch -M main && git remote add origin https://github.com/YOURNAME/letters.git && git push -u origin main`
3. In the repository: Settings → Pages → "Deploy from a branch" → `main` / root → Save. After a minute or two it's live at `https://YOURNAME.github.io/letters/`.
4. On the tablet, open that address in Chrome → ⋮ menu → "Add to Home screen" / "Install app". It then opens full screen and works offline.

Any other https host works too (for example a subfolder of your own website).

## First things to do

1. Hold the 🔒 in the corner for 2 seconds to open the parent panel.
2. Voice tab: record the six letter sounds first. Until then the tablet's robot voice stands in, and it can't say pure sounds well.
3. Settings tab: names, session length, and the egg rules.
4. Settings tab → "Make backup file" now and then; keep the file on your computer.

## Updating

When I send a new version, replace the files in the repository. The installed app picks up the update the next time it's opened while online (sometimes it takes two openings).
