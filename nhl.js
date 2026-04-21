import * as utils from './utils.js';
import 'dotenv/config';

const TZ_NAME = process.env.TZ_NAME || 'America/New_York';

const dateIdMap = new Map();
let roster = [];

async function fetchTeamRoster(team, season) {
  const response = await fetch(`https://api-web.nhle.com/v1/roster/${team}/${season}`);
  if (!response.ok) {
    throw new Error(`fetchTeamRoster: HTTP error! status: ${response.status}`);
  }
  const jsonData = await response.json();
  return [...jsonData.forwards, ...jsonData.defensemen, ...jsonData.goalies];
}

export async function fetchTodaysGameId(team) {
  const cDate = utils.getLocalDate(TZ_NAME);
  utils.debugLog(`Date: ${cDate}`);

  if (dateIdMap.has(cDate) && roster.length > 0) {
    utils.debugLog("Game ID is cached!");
    return { status: 1, data: dateIdMap.get(cDate) };
  }

  utils.debugLog("Game ID is not cached. Fetching...");
  try {
    const response = await fetch(`https://api-web.nhle.com/v1/club-schedule/${team}/week/now`);
    if (!response.ok) {
      utils.debugError(`fetchTodaysGameId: HTTP error! status: ${response.status}`);
      return { status: 0 };
    }
    const { games } = await response.json();
    utils.debugLog(`Schedule Response: ${JSON.stringify(games, null, 2)}`);

    const game = games.find(g => g.gameDate === cDate);
    utils.debugLog(game);

    if (!game) {
      utils.debugLog("No game found for today.");
      return { status: 0 };
    }

    const gameId = String(game.id);
    dateIdMap.set(cDate, gameId);

    try {
      roster = await fetchTeamRoster(team, game.season);
    } catch (error) {
      utils.debugError("fetchTeamRoster: Error fetching or processing data:", error);
      roster = [];
    }

    return { status: 1, data: gameId };
  } catch (error) {
    utils.debugError("fetchTodaysGameId: Error fetching or processing data:", error);
    return { status: 0 };
  }
}

export function getSweaterNumber(playerId, roster) {
  const player = roster.find(player => player.id === playerId);
  return player ? player.sweaterNumber : null;
}

function mapAssist(assist) {
  return {
    name: `${assist.firstName.default} ${assist.lastName.default}`,
    firstName: assist.firstName.default,
    lastName: assist.lastName.default,
    number: String(assist.sweaterNumber)
  };
}

export async function getGoalAnnouncement(gameId, announceName, team) {
  try {
    const response = await fetch(`https://api-web.nhle.com/v1/gamecenter/${gameId}/landing`);
    if (!response.ok) {
      throw new Error(`getGoalAnnouncement: HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();

    utils.debugLog(`Game State: ${jsonData.gameState}`);

    if (!['LIVE', 'CRIT', 'FINAL'].includes(jsonData.gameState)) {
      return { status: "NOT_STARTED", data: "" };
    }

    const mostRecentGoal = jsonData.summary.scoring.at(-1).goals.at(-1) || null;
    if (mostRecentGoal === null) {
      return { status: "NO_GOALS", data: "" };
    }

    if (mostRecentGoal.teamAbbrev.default !== team) {
      return { status: "OPPOSING_GOAL", data: "" };
    }

    utils.debugLog(`mostRecentGoal: ${JSON.stringify(mostRecentGoal, null, 2)}`);

    const postseason = jsonData.gameType === 3;
    const playerGoalSnip = postseason ? "goal of the playoffs" : "goal of the season";

    const goalFirst = mostRecentGoal.firstName.default;
    const goalLast = mostRecentGoal.lastName.default;
    const goalSweater = getSweaterNumber(mostRecentGoal.playerId, roster);
    const goalCountRaw = mostRecentGoal.goalsToDate;
    const goalCount = `${goalCountRaw}${utils.getOrdinal(goalCountRaw)}`;
    const scoredBy = `${goalFirst} ${goalLast}`;
    const ppg = mostRecentGoal.strength === "pp";
    const shg = mostRecentGoal.strength === "sh";
    const pTime = utils.timeToSpeech(mostRecentGoal.timeInPeriod);

    const announcePrefix = ppg
      ? `${announceName}, power play goal`
      : shg
        ? `${announceName} goal, short handed`
        : `${announceName} goal`;
    const shortPrefix = ppg ? 'PPG: ' : shg ? 'SHG: ' : '';

    let fullAnnounce;
    let shortText;
    const numAssists = mostRecentGoal.assists.length;

    if (numAssists === 2) {
      const [a0, a1] = mostRecentGoal.assists;
      const assist1 = `number ${a0.sweaterNumber} ${a0.firstName.default} ${a0.lastName.default}`;
      const assist2 = `number ${a1.sweaterNumber} ${a1.firstName.default} ${a1.lastName.default}`;
      fullAnnounce = `${announcePrefix}, scored by number ${goalSweater}, ${scoredBy}. Assisted by ${assist1} and ${assist2}. Time of the goal ${pTime}... That's ${goalLast}'s ${goalCount} ${playerGoalSnip} from ${a0.lastName.default} and ${a1.lastName.default}, at ${pTime}.`;
      shortText = `${shortPrefix}${goalLast} (${goalCount}), ${a0.lastName.default} & ${a1.lastName.default} (A) @ ${mostRecentGoal.timeInPeriod}`;
    } else if (numAssists === 1) {
      const [a0] = mostRecentGoal.assists;
      const assist1 = `number ${a0.sweaterNumber} ${a0.firstName.default} ${a0.lastName.default}`;
      fullAnnounce = `${announcePrefix}, scored by number ${goalSweater}, ${scoredBy}. Assisted by ${assist1}. Time of the goal ${pTime}. ${goalLast}'s ${goalCount} ${playerGoalSnip} from ${a0.lastName.default} at ${pTime}.`;
      shortText = `${shortPrefix}${goalLast} (${goalCount}), ${a0.lastName.default} (A) @ ${mostRecentGoal.timeInPeriod}`;
    } else {
      const unassistedPrefix = ppg
        ? `${announceName}, power play goal, an unassisted goal`
        : shg
          ? `${announceName} goal, an unassisted short handed goal`
          : `${announceName} goal, an unassisted goal`;
      fullAnnounce = `${unassistedPrefix}, scored by number ${goalSweater}, ${scoredBy}. Time of the goal ${pTime}. That's ${goalLast}'s ${goalCount} ${playerGoalSnip} at ${pTime}.`;
      shortText = `${shortPrefix}${goalLast} (${goalCount}) @ ${mostRecentGoal.timeInPeriod}`;
    }

    const data = {
      announcement: fullAnnounce,
      shortText,
      name: scoredBy,
      firstName: goalFirst,
      lastName: goalLast,
      number: String(goalSweater),
      timeOfGoal: mostRecentGoal.timeInPeriod,
      goalNumber: goalCount,
      assists: mostRecentGoal.assists.map(mapAssist)
    };

    utils.debugLog(data);
    return { status: "GOAL", data };
  } catch (error) {
    utils.debugError("getGoalAnnouncement: Error fetching or processing data:", error);
    return { status: "ERROR", data: {} };
  }
}
