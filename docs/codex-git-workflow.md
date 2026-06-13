<!-- codex-project-git-workflow: initialized -->
<!-- initialized-at: 2026-06-13 00:00:00 +08:00 -->

# Codex Git Workflow

Initialization status: initialized
Project: GameLetter
Repository root: `D:\WebProjects\GameLetter`
Machine config: `.codex\project-git-workflow.json`
Skill: project-git-workflow

Treat this document and the machine config as the source of truth for this repository's Codex git workflow. Do not replace them with generic defaults unless the user explicitly asks to reinitialize or update the policy.

## Global Wrappers

Run these from the repository root:

```powershell
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Status.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Validate.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Commit.cmd -Message "commit message" -Paths path\to\file,other\file
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\CommitAndPush.cmd -Message "commit message" -Paths path\to\file,other\file
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Push.cmd
```

## Status

```powershell
git -c safe.directory=D:/WebProjects/GameLetter status --short --branch
```

## Validation

Run this before commit or push:

```powershell
cmd /c npm.cmd run smoke:local
```

`smoke:local` runs the production build first, which includes `validate:data` and RSS generation.

## Staging Policy

Selected files only.

Inspect status before staging. Preserve unrelated user changes unless the user explicitly asks to include them.

## Commit

Use the global wrapper's built-in git commit after staging explicit paths. Prefer concise conventional commit messages unless the user specifies another message.

## Push

```powershell
git -c safe.directory=D:/WebProjects/GameLetter push -u origin HEAD
```

## Docs And TODO

Follow `docs/refactor-plan.md` for round scope and required checks before committing.

## Safety And Branch Policy

No force push. No destructive reset or checkout unless explicitly requested. Preserve unrelated user changes.
