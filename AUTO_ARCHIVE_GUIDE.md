# Auto-Archive Feature 📦

## Overview
The system automatically archives evaluations when a new month begins, without any manual intervention required.

## How It Works

### Automatic Detection
- Every time someone visits the website, a background check runs (after 2 seconds delay)
- The system compares the current month with the latest evaluation date
- If evaluations are from a previous month, they are automatically archived

### Archive Process
1. **Check**: Detects if we're in a new month
2. **Verify**: Ensures we haven't already archived for this month
3. **Archive**: Moves all evaluations to the archive table
4. **Clean**: Removes evaluations from the active table
5. **Done**: Fresh start for the new month!

### Safety Features
- ✅ **No Duplicates**: Prevents archiving the same data multiple times
- ✅ **Fail-Safe**: If archive fails, data remains in main table
- ✅ **Non-Blocking**: Runs in background, doesn't slow down the website
- ✅ **Once Per Session**: Only checks once per user session to avoid redundancy

## What Gets Archived?
- **Archived**: All evaluations from previous months
- **Preserved**: 
  - Classrooms (needed for monthly winners)
  - Users
  - Checklist items
  - Monthly winners data

## Timeline Example

```
Month 1 (January):
- Evaluations are created and stored
- Leaderboard shows current standings

Month 2 (February 1st):
- First visitor triggers auto-check
- January evaluations automatically archived
- Fresh leaderboard for February
- January data preserved in archive

Month 3 (March 1st):
- Process repeats automatically
```

## Viewing Archived Data
Admins can view archived evaluations through:
- Admin Dashboard > Data Management > View Archive
- Export Data function includes archived evaluations

## Technical Details

### Files Involved
- `app/actions/auto-archive-actions.ts` - Archive logic
- `components/auto-archive-checker.tsx` - Trigger component
- `app/layout.tsx` - Integration point

### Database Tables
- `evaluations` - Active evaluations (current month)
- `archive_evaluations` - All archived evaluations

## Troubleshooting

### Archive Not Running?
- Check browser console for `[AutoArchive]` logs
- Ensure evaluations exist from previous month
- Verify database permissions

### Want to Test?
Create evaluations with a past date, then refresh the page after waiting 2 seconds.

## Benefits
✨ **Zero Maintenance**: No manual archiving needed  
🚀 **Always Fresh**: Automatic monthly resets  
📊 **Complete History**: All data preserved in archive  
⚡ **Fast**: Non-blocking background operation
