# Forest Validation and Auto-Fix Script

## Overview

The `validateAndFixForest.ts` script validates and repairs user forests based on **completed tasks** and the current 20x20 block layout logic:

- Each user has their own unique forest with trees in a grid layout
- Blocks are 20x20 units, arranged in square grids (2x2, 3x3, 4x4, etc.)
- Each block can hold max 8 trees
- Grid expands when needed (2x2 → 3x3 → 4x4, etc.)
- For each user, the script enforces: **one tree per completed task**, with trees placed according to the current `getForestService` / `plantTree` logic

## Usage

### Dry Run (Recommended First)

Run without making any changes to see what would be fixed:

```bash
npm run validate-forest:dry-run
```

Or directly:

```bash
tsx src/scripts/validateAndFixForest.ts --dry-run
```

### Apply Fixes

After reviewing the dry run output, apply the fixes:

```bash
npm run validate-forest
```

Or directly:

```bash
tsx src/scripts/validateAndFixForest.ts
```

## Running in Background

### Linux/macOS

Run in background with nohup:

```bash
nohup npm run validate-forest > forest-validation.log 2>&1 &
```

Or using screen/tmux:

```bash
screen -S forest-validation
npm run validate-forest
# Press Ctrl+A then D to detach
```

### Windows (PowerShell)

Run in background job:

```powershell
Start-Job -ScriptBlock { cd backend; npm run validate-forest } | Out-Null
```

Or using WSL:

```bash
nohup npm run validate-forest > forest-validation.log 2>&1 &
```

## What It Does

For each user:

1. **Counts existing trees** in `forest_trees`.
2. **Counts completed tasks** in `user_tasks` (rows with `completed_at IS NOT NULL` and a non-null `task_id`).
3. If both counts are zero → **skips** the user (nothing to do).
4. If the number of trees equals the number of completed tasks and all `task_id`s match exactly → forest is considered **consistent**, so the user is **skipped** to preserve existing growth.
5. Otherwise (inconsistent forest):
   - In **dry-run** mode, it reports how many trees would be deleted and recreated.
   - In **live** mode, it:
     - Deletes all `forest_trees` rows for that user.
     - Calls `plantTree(userId, taskId)` once per completed task to rebuild the forest using the latest placement logic.
6. **Reports statistics**: for each user and in a final summary (deleted, created, fixed, errors).

## Output

The script prints:

- Progress for each user processed
- Number of trees deleted
- Number of trees created (one per completed task)
- Any errors encountered (including dry-run “skipped” messages)
- Final summary statistics

## Safety

- The script uses database transactions where possible
- Dry run mode allows you to preview changes before applying
- Trees are only deleted if they cannot be moved to valid positions
- The script is designed to run without disrupting active services

## Notes

- The script processes users sequentially to avoid database contention
- Large forests may take some time to process
- It's safe to run while the application is running (read operations are non-blocking)
- Write operations use standard SQL DELETE/INSERT which are atomic

## Automation (Cron)

You can run this script automatically with a nightly cron job, for example at 02:00 server time.

Use the helper script `backend/scripts/run-validate-forest.sh` from a system scheduler. Example `crontab -e` entry on Linux:

```cron
# Run forest validation every day at 02:00 (server local time)
0 2 * * * /absolute/path/to/your/repo/backend/scripts/run-validate-forest.sh
```

Notes:

- Make sure `/absolute/path/to/your/repo/backend` points to the backend root on that server.
- The script writes logs to `backend/logs/validate-forest.log`.
- If you are running the backend in Docker, adapt the command, for example:

  ```cron
  0 2 * * * docker exec <backend-container-name> sh -c "cd /app/backend && npm run validate-forest" >> /var/log/validate-forest.log 2>&1
  ```

