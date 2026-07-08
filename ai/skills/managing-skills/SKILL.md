---
name: managing-skills
description: How to add and organize skills in this repo. Skills live in ai/skills/<name>/SKILL.md and are surfaced to Claude Code via the .claude/skills symlink. Load when creating, renaming, or restructuring a skill.
---

# Managing skills

Skills for this repo live under `ai/skills/` (version-controlled), and are exposed to
Claude Code through a symlink: `.claude/skills -> ../ai/skills`.

## Layout

Each skill is a **directory** containing a `SKILL.md`:

```
ai/skills/
  <skill-name>/
    SKILL.md          # required — the skill itself
    ...               # optional supporting files (scripts, references, assets)
```

Claude Code only discovers skills as directories with a `SKILL.md` inside. A loose
markdown file at the top of `ai/skills/` is **not** picked up.

## SKILL.md frontmatter

Every `SKILL.md` starts with YAML frontmatter:

```yaml
---
name: <kebab-case-name> # must match the directory name
description: <one line> # what it does + when to load it
---
```

- `name` — kebab-case, and must equal the containing directory name.
- `description` — the only thing Claude sees when deciding whether to load the skill,
  so state both **what** it covers and **when to load it** (the trigger). Keep it to one line.

## Adding a skill

1. Create `ai/skills/<name>/SKILL.md` with the frontmatter above.
2. Make sure `name:` matches the directory name.
3. Write the body: concise, imperative guidance the way you'd brief a teammate.

No symlink work is needed per-skill — `.claude/skills` already points at `ai/skills`,
so a new directory shows up automatically.

## The symlink

`.claude/skills` is a relative symlink to `../ai/skills`. If it's ever missing
(fresh clone, deleted), recreate it from the repo root:

```sh
ln -s ../ai/skills .claude/skills
```

Keep it relative so it survives the repo being moved or cloned to a different path.
