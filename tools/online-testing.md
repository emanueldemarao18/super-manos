# Online and mobile checks

The root fighting game uses PeerJS 1.5.4, vendored with its MIT license in
`assets/vendor/`. Public PeerJS signaling and its default STUN/TURN configuration
are still required. There is no account, paid service or private key in the game.

Friend rooms use five-character codes. Both players must load the same version.
Random matchmaking claims one versioned waiting-room peer; the first waiting
player offers their game room to the next player. Once paired, the waiting peer
is released so another pair can match. A lone player waits until somebody else
chooses random matchmaking. Cancellation releases both signaling peers.

Open `tools/online-test.html?auto=1` through an HTTP server to see two clients.
Run the browser checks using an installed Playwright CLI/WebKit session:

```sh
playwright-cli -s=manos-visual run-code "$(cat tools/online-browser-check.js)"
playwright-cli -s=manos-visual run-code "$(cat tools/mobile-browser-check.js)"
```

Both scripts target `http://127.0.0.1:8765`. The online check uses real public
signaling and WebRTC, selects fighters, enters combat, sends remote movement and
an attack, compares damage and winner snapshots, then checks disconnect,
consecutive random pairs, immediate cancellation/retry and a nonexistent room.
The KO fixture reduces health and sets one prior win to keep the check short.
The mobile check uses WebKit touch emulation, real touchscreen taps plus
simultaneous synthetic pointer contacts, landscape gameplay and portrait room
entry. Combat sheets are loaded on demand, not all eleven at startup.

```sh
bash scripts/smoke_test.sh
node tools/gameplay-test.cjs
node tools/art-test.cjs --all
node tools/net-test.cjs
```

These checks do not establish connectivity between separate Internet networks,
TURN availability on restrictive networks, or physical iOS/Android performance.
For a friend outside the local network, publish the same version to the existing
HTTPS site first. A localhost link only works on its own device; a LAN address
works on the same Wi-Fi while the local server is running. Mobile combat is
intended for landscape orientation; room entry also works in portrait.
