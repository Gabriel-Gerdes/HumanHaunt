# Human Haunt Apps Script Web App

This folder contains a Google Apps Script web app for the Human Haunt lockout sheet.

Current sheet layout:

- Column A: `Task`
- Column B: `Points`
- Columns C-G: `Team 1` through `Team 5`
- Header row: row `2`
- First task row: row `3`

## Set Up

1. Open the Google Sheet.
2. Go to `Extensions > Apps Script`.
3. Replace the default `Code.gs` contents with `apps-script/Code.gs`.
4. Add a new HTML file named `Index`.
5. Paste `apps-script/Index.html` into that `Index.html` file.
6. Click `Save`.

## Deploy

1. Click `Deploy > New deployment`.
2. Choose type `Web app`.
3. Set `Execute as` to `Me`.
4. Set `Who has access` to whichever option matches your game:
   - `Anyone` if players should not need to sign in.
   - `Anyone with Google account` if you want basic Google sign-in.
5. Click `Deploy`.
6. Authorize the script when prompted.
7. Share the web app URL with players.

## How Claims Work

The web app reads tasks from the sheet and shows a claim button for each open task. When a team claims a task, the script writes `TRUE` into that team's column for the task row. This works with normal cells and with Google Sheets checkbox columns.

The backend uses `LockService` before writing to the sheet, so if two teams click the same task at nearly the same time, only the first successful write wins.

Players choose their team using the large team buttons.

## Admin Controls

Choose `admin` from the team buttons to show host controls.

Admin can:

- Reset a task, which clears every team's claim cell for that task row.
- Add a new task with a point value.
- Edit an existing task's description and point value.
- Delete an existing task row.
- Rename a team, which updates the team's header cell in the sheet.

The admin option is only a UI role, not password-protected. Anyone with the web app URL can choose `admin` unless access is restricted through the Apps Script deployment settings.

## Updating the Layout

The script finds columns by reading the labels in the header row. If the sheet shifts left or right, the app should keep working as long as the headers still say:

- `Task`
- `Points`

Team columns are read from the non-empty headers immediately after `Points`, so renamed teams do not need to start with `Team`.

If the header row or first task row changes, update these constants at the top of `Code.gs`:

```js
const HEADER_ROW = 2;
const FIRST_TASK_ROW = 3;
```
