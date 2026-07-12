const SPREADSHEET_ID = '1T5XdNS7dzdwlhgWCDVIYjtVs06I7Pav1nqypUIWF3nY';
const SHEET_NAME = 'Sheet1';
const HEADER_ROW = 2;
const FIRST_TASK_ROW = 3;
const HEADER_SCAN_COLUMN_COUNT = 26;

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Human Haunt Lockout')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getGameState() {
  const sheet = getSheet_();
  const layout = getLayout_(sheet);
  const tasks = getTasks_(sheet, layout);
 
  return {
    teams: layout.teams,
    tasks,
    scores: getScores_(tasks, layout.teams),
    updatedAt: new Date().toISOString(),
  };
}

function claimTask(rowNumber, teamName) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const sheet = getSheet_();
    const layout = getLayout_(sheet);
    const teams = layout.teams;

    if (!teams.includes(teamName)) {
      throw new Error('Unknown team.');
    }

    const row = Number(rowNumber);
    if (!Number.isInteger(row) || row < FIRST_TASK_ROW) {
      throw new Error('Invalid task row.');
    }

    const taskName = String(sheet.getRange(row, layout.taskColumn).getValue()).trim();
    if (!taskName) {
      throw new Error('Task not found.');
    }

    const teamRange = sheet.getRange(row, layout.firstTeamColumn, 1, teams.length);
    const currentValues = teamRange.getValues()[0];
    const existingWinnerIndex = currentValues.findIndex(isClaimValue_);

    if (existingWinnerIndex !== -1) {
      return {
        ok: false,
        message: `${taskName} is already claimed by ${teams[existingWinnerIndex]}.`,
        state: getGameState(),
      };
    }

    const winnerColumnOffset = teams.indexOf(teamName);
    sheet.getRange(row, layout.firstTeamColumn + winnerColumnOffset).setValue(true);

    return {
      ok: true,
      message: `${teamName} claimed "${taskName}".`,
      state: getGameState(),
    };
  } finally {
    lock.releaseLock();
  }
}

function resetTask(rowNumber) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const row = Number(rowNumber);
    if (!Number.isInteger(row) || row < FIRST_TASK_ROW) {
      throw new Error('Invalid task row.');
    }

    const sheet = getSheet_();
    const layout = getLayout_(sheet);
    const taskName = String(sheet.getRange(row, layout.taskColumn).getValue()).trim();
    if (!taskName) {
      throw new Error('Task not found.');
    }

    sheet.getRange(row, layout.firstTeamColumn, 1, layout.teams.length).clearContent();

    return {
      ok: true,
      message: `"${taskName}" was reset.`,
      state: getGameState(),
    };
  } finally {
    lock.releaseLock();
  }
}

function addTask(taskName, points) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const name = String(taskName).trim();
    const pointValue = Number(points);

    if (!name) {
      throw new Error('Task name is required.');
    }

    if (!Number.isFinite(pointValue) || pointValue < 0) {
      throw new Error('Points must be zero or greater.');
    }

    const sheet = getSheet_();
    const layout = getLayout_(sheet);
    const lastRow = Math.max(sheet.getLastRow(), FIRST_TASK_ROW - 1);
    const newRow = lastRow + 1;

    if (newRow > sheet.getMaxRows()) {
      sheet.insertRowsAfter(sheet.getMaxRows(), 1);
    }

    sheet.getRange(newRow, layout.taskColumn).setValue(name);
    sheet.getRange(newRow, layout.pointsColumn).setValue(pointValue);
    sheet.getRange(newRow, layout.firstTeamColumn, 1, layout.teams.length).clearContent();

    copyTeamValidation_(sheet, layout, newRow);

    return {
      ok: true,
      message: `"${name}" was added for ${pointValue} points.`,
      state: getGameState(),
    };
  } finally {
    lock.releaseLock();
  }
}

function updateTask(rowNumber, taskName, points) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const row = Number(rowNumber);
    const name = String(taskName).trim();
    const pointValue = Number(points);

    if (!Number.isInteger(row) || row < FIRST_TASK_ROW) {
      throw new Error('Invalid task row.');
    }

    if (!name) {
      throw new Error('Task name is required.');
    }

    if (!Number.isFinite(pointValue) || pointValue < 0) {
      throw new Error('Points must be zero or greater.');
    }

    const sheet = getSheet_();
    const layout = getLayout_(sheet);
    const existingTaskName = String(sheet.getRange(row, layout.taskColumn).getValue()).trim();

    if (!existingTaskName) {
      throw new Error('Task not found.');
    }

    sheet.getRange(row, layout.taskColumn).setValue(name);
    sheet.getRange(row, layout.pointsColumn).setValue(pointValue);

    return {
      ok: true,
      message: `"${name}" was updated.`,
      state: getGameState(),
    };
  } finally {
    lock.releaseLock();
  }
}

function deleteTask(rowNumber) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const row = Number(rowNumber);

    if (!Number.isInteger(row) || row < FIRST_TASK_ROW) {
      throw new Error('Invalid task row.');
    }

    const sheet = getSheet_();
    const layout = getLayout_(sheet);
    const taskName = String(sheet.getRange(row, layout.taskColumn).getValue()).trim();

    if (!taskName) {
      throw new Error('Task not found.');
    }

    sheet.deleteRow(row);

    return {
      ok: true,
      message: `"${taskName}" was deleted.`,
      state: getGameState(),
    };
  } finally {
    lock.releaseLock();
  }
}

function renameTeam(oldTeamName, newTeamName) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const oldName = String(oldTeamName).trim();
    const newName = String(newTeamName).trim();

    if (!oldName) {
      throw new Error('Choose a team to rename.');
    }

    if (!newName) {
      throw new Error('New team name is required.');
    }

    const sheet = getSheet_();
    const layout = getLayout_(sheet);
    const existingTeamIndex = layout.teams.indexOf(oldName);

    if (existingTeamIndex === -1) {
      throw new Error('Team not found.');
    }

    if (layout.teams.some(team => team.toLowerCase() === newName.toLowerCase() && team !== oldName)) {
      throw new Error('Another team already has that name.');
    }

    sheet.getRange(HEADER_ROW, layout.firstTeamColumn + existingTeamIndex).setValue(newName);

    return {
      ok: true,
      message: `${oldName} was renamed to ${newName}.`,
      state: getGameState(),
    };
  } finally {
    lock.releaseLock();
  }
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error(`Sheet "${SHEET_NAME}" was not found.`);
  }

  return sheet;
}

function getLayout_(sheet) {
  const headers = sheet
    .getRange(HEADER_ROW, 1, 1, HEADER_SCAN_COLUMN_COUNT)
    .getValues()[0]
    .map(value => String(value).trim());

  const taskColumn = headers.findIndex(header => header.toLowerCase() === 'task') + 1;
  const pointsColumn = headers.findIndex(header => header.toLowerCase() === 'points') + 1;
  const teamColumns = getTeamColumns_(headers, pointsColumn);

  if (!taskColumn) {
    throw new Error('No "Task" column found in the header row.');
  }

  if (!pointsColumn) {
    throw new Error('No "Points" column found in the header row.');
  }

  if (teamColumns.length === 0) {
    throw new Error('No teams found in the header row.');
  }

  return {
    taskColumn,
    pointsColumn,
    firstTeamColumn: teamColumns[0].column,
    teams: teamColumns.map(item => item.header),
  };
}

function getTeamColumns_(headers, pointsColumn) {
  const teamColumns = [];

  for (let index = pointsColumn; index < headers.length; index += 1) {
    const header = headers[index];

    if (!header) {
      break;
    }

    teamColumns.push({
      header,
      column: index + 1,
    });
  }

  return teamColumns;
}

function getTasks_(sheet, layout) {
  const lastRow = sheet.getLastRow();

  if (lastRow < FIRST_TASK_ROW) {
    return [];
  }

  const rowCount = lastRow - FIRST_TASK_ROW + 1;
  const values = sheet
    .getRange(FIRST_TASK_ROW, layout.taskColumn, rowCount, layout.teams.length + 2)
    .getValues();

  return values
    .map((row, index) => {
      const taskName = String(row[0]).trim();
      const points = Number(row[1]) || 0;
      const claims = row.slice(2);
      const claimedTeamIndex = claims.findIndex(isClaimValue_);

      return {
        rowNumber: FIRST_TASK_ROW + index,
        taskName,
        points,
        claimedBy: claimedTeamIndex === -1 ? null : layout.teams[claimedTeamIndex],
      };
    })
    .filter(task => task.taskName);
}

function getScores_(tasks, teams) {
  return teams.map(team => ({
    team,
    score: tasks
      .filter(task => task.claimedBy === team)
      .reduce((total, task) => total + task.points, 0),
  }));
}

function copyTeamValidation_(sheet, layout, targetRow) {
  const sourceRow = targetRow > FIRST_TASK_ROW ? targetRow - 1 : FIRST_TASK_ROW;
  const sourceRange = sheet.getRange(sourceRow, layout.firstTeamColumn, 1, layout.teams.length);
  const targetRange = sheet.getRange(targetRow, layout.firstTeamColumn, 1, layout.teams.length);

  targetRange.setDataValidations(sourceRange.getDataValidations());
}

function isClaimValue_(value) {
  if (value === true) {
    return true;
  }

  if (value === false || value === null || value === undefined) {
    return false;
  }

  const text = String(value).trim().toLowerCase();
  return text !== '' && text !== 'false' && text !== 'no' && text !== '0';
}
