# @cloudbrowser/skills

Install CloudBrowser Codex skills.

## Quick install

Interactive:
```bash
npx @cloudbrowser/skills
```

Non-interactive (recommended):
```bash
npx @cloudbrowser/skills --global --skill cloudbrowser -y
```

## What this runs

This package is a thin wrapper around the `skills` CLI and defaults to installing from:

- `CloudBrowser-AI/skills`

You can also use the upstream CLI directly:
```bash
npx skills add CloudBrowser-AI/skills --skill cloudbrowser
```

## Repo layout

Skills live under `skills/<skill-name>/`:

- `skills/cloudbrowser/SKILL.md`

