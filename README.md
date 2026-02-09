# skills

Codex skills repo.

## Structure

Skills live under `skills/<skill-name>/` and each skill must include a `SKILL.md` at its root:

`skills/cloudbrowser/SKILL.md`

## Install (via npx)

This repo is compatible with the `skills` installer (same pattern as `remotion-dev/skills`):

```bash
npx skills add CloudBrowser-AI/skills --skill cloudbrowser
```

También funciona con URL completa:
```bash
npx skills add https://github.com/CloudBrowser-AI/skills --skill cloudbrowser
```

## Develop locally

This workspace keeps a junction so Codex can load the skill from `$CODEX_HOME/skills`:

- `$CODEX_HOME/skills/cloudbrowser` -> this repo's `skills/cloudbrowser`
