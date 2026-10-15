# Installable game and offline checks

The root fighting game is an installable PWA. The platformer remains separate.
Open the public HTTPS site and choose **APP / OFFLINE** on the title or main menu.
Chrome can offer its install prompt when eligible; Safari users receive instructions
for Share > Add to Home Screen. The manifest uses relative paths so installation
also works under the GitHub Pages `/super-manos/` path.

Saving for offline play is a separate explicit action. It downloads approximately
22 MB across 25 art files, with progress, resumable caching and a completion message.
All twelve combat sheets, portraits and the photographic stage are included.
The core scripts, icons and fonts are cached separately. Solo, training and local
versus play work offline after saving; friend rooms and random matchmaking need
Internet access. Browser storage may be cleared by the user or operating system.

## Release updates

- Increment `VERSION` in `sw.js` whenever a cached core file changes. Keep the
  service-worker URL stable and the complete `CORE` list aligned with `index.html`.
- Cached art is preserved between core releases. Increment the `ART` cache suffix
  when replacing existing art; add new character files to `IDS`/`PACK` as needed.
- A new worker waits while the current game runs. Updates are offered only in the
  title/main menu. Applying one requires closing other fighting-game windows, then
  explicitly choosing **ATUALIZAR AGORA**. The current menu is blocked until reload.
- Cleanup touches only caches belonging to this game's scope. Tool/platformer
  navigations are not served the fighting-game shell.
- Do not delete or rename the worker to deploy an update. Existing installed
  workers would remain active; publish a new version at the same URL instead.

On a phone, use the public HTTPS site. A local HTTP LAN address does not provide
the secure context required for service workers. `localhost` is suitable for tests.

## Automated checks

Start the dedicated fixture from the repository root:

```sh
node tools/pwa-test-server.cjs
```

It serves the actual files at `http://127.0.0.1:8767/super-manos/` and switches
worker versions in memory. It never changes the repository's release files.
With an installed WebKit Playwright CLI session:

```sh
playwright-cli -s=manos-visual run-code --filename=tools/pwa-browser-check.js
bash scripts/smoke_test.sh
node --check sw.js
node tools/gameplay-test.cjs
node tools/art-test.cjs --all
node tools/net-test.cjs
```

The browser check saves the pack, disables networking, reloads the entire game,
checks local fonts, loads Rodrigo and Leonardo, and lands a touch attack. It then
tests a worker update waiting during combat, refusal while another game window
is open, a user-approved menu update, retained art and untouched unrelated caches.
All browser checks start muted. Physical iPhone/Android installation and browser
storage eviction still require manual validation.

## Bundled fonts

The existing Bangers and Russo One fonts are now local so offline typography does
not depend on Google Fonts. Their SIL Open Font Licenses are in `assets/fonts/`.
Source versions: Google Fonts Bangers v25 and Russo One v18; license texts come
from the corresponding `google/fonts` families. The game icon's editable source
is `assets/icons/icon.svg`, with 180/192/512 px PNG exports.
