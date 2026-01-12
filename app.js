import express from 'express';
import morgan from 'morgan';
import 'dotenv/config';
import * as utils from './utils.js';

import * as nhl from './nhl.js';
import pkgJson from './package.json' with { type: 'json' };

const TEAM_ABBREV = process.env.TEAM_ABBREV || 'BOS';
const ANNOUNCE_NAME = process.env.ANNOUNCE_NAME || 'Boston';
const TZ_NAME = process.env.TZ_NAME || 'America/New_York';
const PORT = process.env.PORT || 3000;
const DEBUG = process.env.DEBUG || false;

if (!utils.checkTimeZoneString(TZ_NAME)) {
  console.error(`Invalid timezone string: ${TZ_NAME}. (See: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)`);
  process.exit(1);
};

const app = express();
if (DEBUG) { app.use(morgan('combined')); }

// Middleware to fetch game data
const fetchGameData = async (req, res, next) => {
  try {
    const gameIdResponse = await nhl.fetchTodaysGameId(TEAM_ABBREV);
    if (gameIdResponse.status !== 1) {
      return res.status(204).end();
    }

    const goalData = await nhl.getGoalAnnouncement(gameIdResponse.data, ANNOUNCE_NAME, TEAM_ABBREV);
    if (!goalData) {
      return res.status(500).end();
    }
    req.goalData = goalData;
    next();
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
};

app.get('/', (req, res) => {
  res.status(204).end();
});

app.get('/demo/announce', (req, res) => {
  res.send({ status: "GOAL", data: "Boston goal, scored by number 28, Elias Lindholm. Assisted by number 18 Pavel Zacha and number 88 David Pastrnak. Time of the goal 15 seconds. Lindholm's 2nd goal of the season from Zach and Pastranak at 15 seconds." })
});

app.get('/demo/goal', (req, res) => {
  res.send({
    status: "GOAL",
    data: {
      announcement: "Boston goal, scored by number 28, Elias Lindholm. Assisted by number 18 Pavel Zacha and number 88 David Pastrnak. Time of the goal 15 seconds. Lindholm's 2nd goal of the season from Zach and Pastranak at 15 seconds.",
      shortText: "Lindholm (2nd), Zacha (A) Pastrnak (A) @ 15s",
      name: "Elias Lindholm",
      firstName: "Elias",
      lastName: "Lindholm",
      number: "28",
      timeOfGoal: "00:15",
      goalNumber: "2nd",
      assists: [
        {
          name: "Pavel Zacha",
          firstName: "Pavel",
          lastName: "Zacha",
          number: "18"
        },
        {
          name: "David Pastrnak",
          firstName: "David",
          lastName: "Pastrnak",
          number: "88"
        }
      ]
    }
  })
});


app.get('/announce', fetchGameData, (req, res) => {
  const { goalData } = req;
  if (goalData.status === "GOAL") {
    res.send({
      status: goalData.status,
      data: goalData.data.announcement
    });
  } else {
    res.send(goalData);
  }
});

app.get('/goal', fetchGameData, (req, res) => {
  const { goalData } = req;
  res.send(goalData);
});

app.get('/getGameId', async (req, res) => {
  let data = await nhl.fetchTodaysGameId(TEAM_ABBREV);

  if (data.status === 1) {
    res.send(data.data)
  } else {
    res.status(204).end();
  };
});

app.get('/config', (req, res) => {

  res.send({ "teamAbbrev": TEAM_ABBREV, "announceName": ANNOUNCE_NAME, "timezone": TZ_NAME, "version": pkgJson.version })

});

app.listen(PORT, () => {
  console.log(`v${pkgJson.version}. Configured for ${TEAM_ABBREV}. Listening on port ${PORT}. Debug mode: ${DEBUG}.`);
});