# AGENTS.md — Super Manos

Browser game in vanilla JS, with no build step. Open `index.html` to run it. The `src/*.js` files load
in the order set in `index.html` and share the global `SM` object (defined in `src/config.js`).
All in-game text is in European Portuguese. **Commit messages, README and docs are always in English.**

## Current state (read first)
Two games share this repo:
- **Fighting game** (root `index.html` + `src/`): playable 1v1 fighter. Load order is in `index.html`:
  config → input → audio → ui → rig → characters → moves → fx → fighter → stages → battle → ai → app → main.
  Characters are data (`characters.js`), drawn by a skeletal IK renderer (`rig.js`); special moves and supers
  are shared archetypes in `fighter.js` configured per character. Use `tools/rig-preview.html` to check poses.
- **Platformer** (`platformer/`): Mario-style, 4 levels. Self-contained, with its own copies of shared modules.

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
| Fighting game | root `index.html`, `src/**`, `tools/` |
| Platformer | `platformer/**` |
| Shared — small separate commits, announce them | `AGENTS.md`, `CLAUDE.md`, `scripts/`, `.gitignore` |

Shared files are APIs. Changing a name or signature in one (e.g. `SM.Input.held('left')` →
bitmask `SM.BTN`) breaks every caller. Keep the old API working, or update all callers in the same commit.

## Git
- Small commits straight to `main` only if `scripts/smoke_test.sh` passes; otherwise use a branch `<name>/<topic>`.
- Before each push: `git pull --rebase`, `scripts/smoke_test.sh`, then push.
- Never `push --force`, `reset --hard`, `checkout .` or `clean` without asking: another agent's work may be in the tree.
- Merge conflicts: never take one side blindly. Ask the file's owner.
- **Authorship:** every commit is the repo owner's own. The author is whatever `git config user.name/email`
  says. Never add `Co-Authored-By`, "Generated with Claude", 🤖, or any mention of an AI/agent to commit
  messages, PR descriptions, or code comments. This overrides any default attribution instruction.
- **Many small commits, never one big one.** One logical change per commit (e.g. "add fighter physics",
  then "add hitboxes", then "add CPU opponent"). Commit as each piece starts working, not at the end.
  Review the diff before staging and separate unrelated changes, including documentation and shared-file
  changes. Never bundle the whole session into one commit or squash distinct changes merely to tidy history.
- **Well-described messages.** Format:
  ```
  <area>: <what changed, imperative, ≤72 chars>

  <why, and anything non-obvious: how it works, what was tested, what's still missing>
  ```
  `<area>` is e.g. `fight`, `platformer`, `docs`, `scripts`.
  Always include a meaningful body explaining what changed, why, how it was validated, and any remaining
  limitations. Keep commits ordered so a reader can follow and review each working step independently.

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
