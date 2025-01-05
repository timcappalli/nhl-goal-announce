import * as utils from './utils.js';
import 'dotenv/config';

const TZ_NAME = process.env.TZ_NAME || 'America/New_York';

let dateIdMap = new Map();
let season;
let roster;

async function fetchTeamRoster(team, season) {
  try {
    const response = await fetch(`https://api-web.nhle.com/v1/roster/${team}/${season}`);

    if (!response.ok) {
      //clean up error handling
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonData = await response.json();

    roster = [...jsonData['forwards'], ...jsonData['defensemen'], ...jsonData['goalies']];

    return roster;

  } catch (error) {
    //clean up error handling
    console.error("fetchTeamRoster: Error fetching or processing data:", error);
  }
}

export async function fetchTodaysGameId(team) {

  let cDate = utils.getLocalDate(TZ_NAME)

  utils.debugLog(`Date: ${cDate}`);

  if (dateIdMap.has(cDate) && roster.length > 0) {
    utils.debugLog("Game ID is cached!");
    return { status: 1, data: dateIdMap.get(cDate) };

  } else {

    utils.debugLog("Game ID is not cached. Fetching...");
    try {
      const response = await fetch(`https://api-web.nhle.com/v1/club-schedule/${team}/week/now`);

      if (!response.ok) {
        utils.debugError(`fetchTodaysGameId: HTTP error! status: ${response.status}`);
        //throw new Error(`HTTP error! status: ${response.status}`);
        return ({ status: 0 })
      };
      const jsonData = await response.json();

      const games = jsonData.games;

      utils.debugLog(games);

      const game = games.find(game => game.gameDate === cDate);

      utils.debugLog(game);

      if (game) {
        dateIdMap.set(`${cDate}`, `${game.id}`)
        season = game.season;

        utils.debugLog("Clearing roster...");
        roster = [];
        utils.debugLog("Fetching roster...");
        roster = await fetchTeamRoster(team, season);

        return { status: 1, data: `${game.id}` };

      } else {
        utils.debugLog("No game found for today.")
        return { status: 0 };
      }
    } catch (error) {
      utils.debugError("fetchTodaysGameId: Error fetching or processing data:", error);
      return ({ status: 0 })
    }
  }
}

export function getSweaterNumber(playerId, roster) {
  //utils.debugLog(roster);
  const player = roster.find(player => player.id === playerId);

  return player ? player.sweaterNumber : null;
};

export async function getGoalAnnouncement(gameId, announceName, team) {

  try {
    const response = await fetch(`https://api-web.nhle.com/v1/gamecenter/${gameId}/landing`);

    if (!response.ok) {
      throw new Error(`getGoalAnnouncement: HTTP error! status: ${response.status}`);
    }

    const jsonData = await response.json();

    console.log(jsonData.gameState)

    if (jsonData.gameState !== 'LIVE' && jsonData.gameState !== 'CRIT') {
      return ({ status: "NOT_STARTED", data: "" });

    } else {

      const summary = jsonData.summary;

      let mostRecentGoal = summary.scoring.at(-1).goals.at(-1) || null;

      let mostRecentTeamGoal;

      if (mostRecentGoal.teamAbbrev.default === `${team}`) {
        console.log("here")
        mostRecentTeamGoal = mostRecentGoal;
      } else {
        mostRecentTeamGoal = null;
      }

      if (mostRecentTeamGoal) {
        let goalFirst = mostRecentTeamGoal.firstName.default;
        let goalLast = mostRecentTeamGoal.lastName.default;
        let goalSweater = getSweaterNumber(mostRecentTeamGoal.playerId, roster);
        let goalCountRaw = mostRecentTeamGoal.goalsToDate;
        let goalCount = `${goalCountRaw}${utils.getOrdinal(goalCountRaw)}`;
        let scoredBy = `${goalFirst} ${goalLast}`;

        let fullAnnounce;

        if (mostRecentTeamGoal.assists.length === 2) {
          let assist1 = `number ${mostRecentTeamGoal.assists[0].sweaterNumber} ${mostRecentTeamGoal.assists[0].firstName.default} ${mostRecentTeamGoal.assists[0].lastName.default}`;
          let assist2 = `number ${mostRecentTeamGoal.assists[1].sweaterNumber} ${mostRecentTeamGoal.assists[1].firstName.default} ${mostRecentTeamGoal.assists[1].lastName.default}`;
          fullAnnounce = `${announceName} goal, scored by number ${goalSweater}, ${scoredBy}. Assisted by ${assist1} and ${assist2}. Time of the goal ${mostRecentTeamGoal.timeInPeriod}... ${goalLast}'s ${goalCount} goal of the season from ${mostRecentGoal.assists[0].lastName.default} and ${mostRecentGoal.assists[1].lastName.default}, at ${mostRecentGoal.timeInPeriod}.`;

        } else if (mostRecentTeamGoal.assists.length === 1) {
          let assist1 = `number ${mostRecentTeamGoal.assists[0].sweaterNumber} ${mostRecentTeamGoal.assists[0].firstName.default} ${mostRecentTeamGoal.assists[0].lastName.default}`;
          fullAnnounce = `${announceName} goal, scored by number ${goalSweater}, ${scoredBy}. Assisted by ${assist1}. Time of the goal ${mostRecentTeamGoal.timeInPeriod}. ${goalLast}'s ${goalCount} goal of the season from ${mostRecentGoal.assists[0].lastName.default} at ${mostRecentGoal.timeInPeriod}.`;
        } else {
          fullAnnounce = `${announceName} goal, an unassisted goal, scored by number ${goalSweater}, ${scoredBy}. Time of the goal ${mostRecentTeamGoal.timeInPeriod}.`
        };

        utils.debugLog(fullAnnounce);

        return ({ status: "GOAL", data: fullAnnounce });

      } else {
        return ({ status: "NO_GOALS" })
      };
    }
  } catch (error) {
    utils.debugError("getGoalAnnouncement: Error fetching or processing data:", error);
    return ({ status: "ERROR", data: "" })
  }
};