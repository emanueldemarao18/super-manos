# Super Manos

Browser games starring the crew: Emanuel, Leonardo, Walgídio, Dave, Diego, Naftali, Atircio, Daniel, Álvaro, Cleusio and Cristiano.

Plain JavaScript with `<canvas>`. No dependencies, no build step. In-game text is in Portuguese.

## Games

### Super Manos — Torneio de Rua (fighting game)
1v1 fighting game in the style of Street Fighter / Tekken. It lives in the repo root: open `index.html`.

- **Modes:** Arcade (beat 7 opponents in a row), Versus (two players on one keyboard or with gamepads), VS CPU (pick opponent and difficulty: FÁCIL, NORMAL, DIFÍCIL, MESTRE) and Training (endless health and meter).
- **Fighters:** all 11, each with a fighting style, body type, outfit, stats, three special moves and a super. Examples: Emanuel (street karate, energy wave), Atircio (wrestler, command grab), Cristiano (street football, kicks a ball), Álvaro (boxer, counter), Naftali (water, counter stance).
- **Stages:** Bairro ao Pôr do Sol, Praia da Caparica, Telhados de Lisboa (with the 25 de Abril bridge) and Estação de Metro.
- **Fighting system:** 4 attack buttons, standing/crouching/jumping normals, chains and special cancels, throws, high/low/overhead blocking, juggles, counter hits, hitstop, combo counter with damage scaling, super meter, best-of-3 rounds with a 99 s timer.

| Action | Player 1 | Player 2 |
|---|---|---|
| Move / jump / crouch | W A S D | Arrow keys |
| Light / heavy punch | F / G | K / L (or numpad 4 / 5) |
| Light / heavy kick | V / B | , / . (or numpad 1 / 2) |
| Pause | Enter / Esc | numpad Enter |
| Gamepad | X/Y punches, A/B kicks, RB super | same |

- **Block:** hold away from the opponent. Crouch to block lows; stand to block jump-ins.
- **Throw:** light punch + light kick when you're close.
- **Specials:** ↓↘→, →↓↘ or ↓↙← + punch/kick. Each fighter's list is on the select screen and in the pause menu.
- **Super** (full meter): ↓↘→↓↘→ + punch, or heavy punch + heavy kick together.
- In one-player modes, player 1 can also use player 2's keys. **M** mutes.

**Play it in the browser:** https://emanueldemarao18.github.io/super-manos/

**Online:** choose ONLINE → CRIAR SALA and send the link (or the 5-letter code) to a friend; opening the link joins the room. The connection is peer-to-peer over WebRTC (via PeerJS's public servers), with the room creator acting as host.

**Phones and tablets:** touch controls appear automatically. There's a joystick on the left, punch/kick buttons and SUPER on the right, and you play in landscape. Online works between phones and computers.

### Super Manos (platformer)
Mario-style platformer with 4 levels. Open `platformer/index.html`.

| Key | Action |
|---|---|
| ← → / A D | walk |
| Z / Space / K | jump (hold = higher jump) |
| X / Shift / J | run |
| Enter | confirm / pause |
| M | mute |

Perks: Naftali has a double jump, Dave glides, Walgídio attracts coins with a magnet and Atircio can take one extra hit.

## Running

Just open `index.html` in a browser. Or serve it locally:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Layout

```
index.html, src/       fighting game
platformer/            platformer
tools/                 dev tools (rig-preview.html shows every fighter in any pose)
scripts/smoke_test.sh  quick check (syntax + every script loaded)
AGENTS.md              rules for anyone (or anything) working on the repo
```

## Contributing

Read `AGENTS.md`. In short: small, well-described commits in English, run `scripts/smoke_test.sh` before every push, one agent per folder.
