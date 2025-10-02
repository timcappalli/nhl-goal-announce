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


app.get('/', (req, res) => {
  res.status(204).end();
});

app.get('/demo/announce', (req, res) => {
  res.send({ status: "GOAL", data: "Boston goal, scored by number 28, Elias Lindholm. Assisted by number 63 Brad Marchand and number 73 Charlie McAvoy. Time of the goal 01:07... Lindholm's 5th goal of the season from Marchand and McAvoy, at 01:07." })
});

app.get('/demo/goal', (req, res) => {
  res.send({
  status: "GOAL",
  data: {
    announcement: "Boston goal, scored by number 11, Trent Frederic. Assisted by number 73 Charlie McAvoy. Time of the goal 18:44. Frederic's 6th goal of the season from McAvoy at 18:44.",
    shortText: "Frederic (6th), McAvoy (A) @ 18:11",
    name: "Trent Frederic",
    firstName: "Trent",
    lastName: "Frederic",
    number: "11",
    timeOfGoal: "18:44",
    goalNumber: "6th",
    assists: [
      {
        name: "Charlie McAvoy",
        firstName: "Charlie",
        lastName: "McAvoy",
        number: "73"
      }
    ]
  }
})
});


app.get('/announce', async (req, res) => {
  try {
    let gameIdResponse = await nhl.fetchTodaysGameId(TEAM_ABBREV);

    if (gameIdResponse.status === 1) {
      let data = await nhl.getGoalAnnouncement(gameIdResponse.data, ANNOUNCE_NAME, TEAM_ABBREV);

      if (data) {
        if (data.status === "GOAL") {
          res.send(
            {
              status: data.status,
              data: data.data.announcement
            }
          );
        } else {
          res.send(data)
        }
      } else {
        res.status(500).end();
      }

    } else {
      res.status(204).end()
    }
  }
  catch (e) {
    console.error(e);
    res.status(500).end();
  }
});

app.get('/goal', async (req, res) => {
  try {
    let gameIdResponse = await nhl.fetchTodaysGameId(TEAM_ABBREV);

    if (gameIdResponse.status === 1) {
      let data = await nhl.getGoalAnnouncement(gameIdResponse.data, ANNOUNCE_NAME, TEAM_ABBREV);

      if (data) {
        res.send(data);
      } else {
        res.status(500).end();
      }

    } else {
      res.status(204).end()
    }
  }
  catch (e) {
    console.error(e);
    res.status(500).end();
  }
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