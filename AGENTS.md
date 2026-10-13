# AGENTS.md — Super Manos

Browser game in vanilla JS, with no build step. Open `index.html` to run it. The `src/*.js` files load
in the order set in `index.html` and share the global `SM` object (defined in `src/config.js`).
All in-game text is in European Portuguese.

## Current state (read first)
Two games are being built in this folder at the same time. They share `SM.*` names, so they collide:
- **Platformer** (Mario-style, 4 levels): `game.js`, `levels.js`, `render.js`, `main.js`, `index.html`.
- **Fighting game** (in progress): `moves.js`, `rig.js`, and a `sim.js` it refers to that doesn't exist yet.
  It has rewritten `config.js`, `characters.js`, `audio.js` and `input.js`.

As a result, the platformer doesn't run on `main` right now. Fix this **before** adding features: move
one game to its own folder (e.g. `fight/`) or its own repo, and give each game its own `config`,
`characters`, `audio` and `input` files.

## Priorities
1. A game that runs from `index.html` beats everything else. Never leave `main` unplayable.
2. Check that it actually works (smoke test plus a real run), then polish.
3. Clean up only what you're touching. If something takes more than 30 min, say so and propose a cut.

## One agent per folder
- **Never run two agents in the same working tree.** That's what caused the current mess.
  For parallel work, use `git worktree add ../super-manos-<topic> -b <name>/<topic>`.
- Before editing a file, check whether it changed on disk since you last read it. If it did, someone else
  is working on it: stop and report instead of overwriting.
- Edit only the area you own. A change needed in someone else's area is a proposal, not an edit.

| Area | Files |
|---|---|
| Platformer | `src/game.js`, `src/levels.js`, `src/render.js`, `src/main.js` |
| Fighting game | `src/moves.js`, `src/rig.js`, `src/sim.js` (and its own folder once split) |
| Shared — small separate commits, announce them | `src/config.js`, `src/characters.js`, `src/audio.js`, `src/input.js`, `index.html`, `AGENTS.md` |

Shared files are APIs. Changing a name or signature in one (e.g. `SM.Input.held('left')` →
bitmask `SM.BTN`) breaks every caller. Keep the old API working, or update all callers in the same commit.

## Git
- Small commits straight to `main` only if `scripts/smoke_test.sh` passes; otherwise use a branch `<name>/<topic>`.
- Before each push: `git pull --rebase`, `scripts/smoke_test.sh`, then push.
- Never `push --force`, `reset --hard`, `checkout .` or `clean` without asking: another agent's work may be in the tree.
- Merge conflicts: never take one side blindly. Ask the file's owner.
- Commit message: `<area>: <what> — <why>`, one line.

## Testing
- `scripts/smoke_test.sh`: syntax-checks every `src/*.js` and checks that `index.html` loads every
  script in `src/`. Run it before every push.
- After gameplay changes, also play it in the browser (or run a headless bot) and report what you
  tested live and what you didn't. Never claim a level can be finished without running it.

## Token economy
- Search (grep/glob) before reading. Read only the range you need, and don't re-read what you just wrote.
- Pipe long output through `tail`/`head`/`grep`.
- Keep replies short: the result and the next step.
- No subagents unless asked.
- If the same attempt fails twice, stop and report.

## Safety
- Ask before anything destructive or outward-facing (deleting others' files, force pushes, making the repo public).
- No secrets in code or commits.
- Stop only processes you started.
