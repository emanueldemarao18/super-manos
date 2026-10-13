# Super Manos

Browser games starring the crew: Emanuel, Leonardo, Walgídio, Dave, Diego, Naftali, Atircio, Daniel, Álvaro, Cleusio and Cristiano.

Plain JavaScript with `<canvas>`. No dependencies, no build step. In-game text is in Portuguese.

## Games

### Super Manos — Torneio de Rua (fighting game) · *in progress*
1v1 fighting game in the style of Street Fighter / Tekken. It lives in the repo root: open `index.html`.

- **Modes:** Arcade against the CPU, Versus with a friend (shared keyboard or gamepads), VS CPU with a chosen difficulty, and Training.
- **Fighters:** each one has their own fighting style, special moves and a super.

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
tools/                 dev tools (e.g. rig-preview.html for the fighters)
scripts/smoke_test.sh  quick check (syntax + every script loaded)
AGENTS.md              rules for anyone (or anything) working on the repo
```

## Contributing

Read `AGENTS.md`. In short: small, well-described commits in English, run `scripts/smoke_test.sh` before every push, one agent per folder.
