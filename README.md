# nhl-goal-announce

This app generates the text of a goal announcement using the NHL API. I created it primarily for use with Home Assistant as part of a goal sequence to mimick TD Garden in Boston.

### Endpoints

**/announce**

This is the primary endpoint for fetching the goal announcement. It only returns the status and the goal announcement text. Sample response:

```json
{
  "status": "GOAL",
  "data": "Boston goal, scored by number 11, Trent Frederic. Assisted by number 73 Charlie McAvoy. Time of the goal 18:44. Frederic's 6th goal of the season from McAvoy at 18:44."
}
```

If the previous goal wasn't from the configured team, or its a scoreless game, the status will be `NO_GOAL`.

**/goal**

This is the is a more detail endpoint which returns the announcement as well as the raw goal data. Sample response:

```json
{
  "status": "GOAL",
  "data": {
    "announcement": "Boston goal, scored by number 11, Trent Frederic. Assisted by number 73 Charlie McAvoy. Time of the goal 18:44. Frederic's 6th goal of the season from McAvoy at 18:44.",
    "shortText": "Frederic (6th), McAvoy (A) @ 18:11",
    "name": "Trent Frederic",
    "firstName": "Trent",
    "lastName": "Frederic",
    "number": "11",
    "timeOfGoal": "18:44",
    "goalNumber": "6th",
    "assists": [
      {
        "name": "Charlie McAvoy",
        "firstName": "Charlie",
        "lastName": "McAvoy",
        "number": "73"
      }
    ]
  }
}
```

If the previous goal wasn't from the configured team, or its a scoreless game, the status will be `NO_GOAL`.

**/getGameId**

Fetches the current day's game identifier. Sample response:

```text
2024020623
```

**/config**

Returns the app's current configuration. Sample response:

```json
{
  "teamAbbrev": "BOS",
  "announceName": "Boston",
  "timezone": "America/Los_Angeles",
  "version": "2025.01.04"
}
```

#### Demo Endpoints

These endpoints always return the same response for testing.

**/demo/announce**

```json
{
  "status": "GOAL",
  "data": "Boston goal, scored by number 28, Elias Lindholm. Assisted by number 18 Pavel Zacha and number 88 David Pastrnak. Time of the goal 15 seconds. Lindholm's 2nd goal of the season from Zach and Pastranak at 15 seconds."
}
```

**/demo/goal**

```json
{
  "status": "GOAL",
  "data": {
    "announcement": "Boston goal, scored by number 28, Elias Lindholm. Assisted by number 18 Pavel Zacha and number 88 David Pastrnak. Time of the goal 15 seconds. Lindholm's 2nd goal of the season from Zach and Pastranak at 15 seconds.",
    "shortText": "Lindholm (2nd), Zacha (A) Pastrnak (A) @ 15s",
    "name": "Elias Lindholm",
    "firstName": "Elias",
    "lastName": "Lindholm",
    "number": "28",
    "timeOfGoal": "00:15",
    "goalNumber": "2nd",
    "assists": [
      {
        "name": "Pavel Zacha",
        "firstName": "Pavel",
        "lastName": "Zacha",
        "number": "18"
      },
      {
        "name": "David Pastrnak",
        "firstName": "David",
        "lastName": "Pastrnak",
        "number": "88"
      }
    ]
  }
}
```

### Configuration

Config is done via environment variables passed to the container.

| ENV             | Description                                                             | Default            |
| --------------- | ----------------------------------------------------------------------- | ------------------ |
| `TEAM_ABBREV`   | Team abbreviation (e.g. BOS, NYR, SEA)                                  | `BOS`              |
| `ANNOUNCE_NAME` | The name for use in the announcement (e.g. "Boston goal, scored by...") | `Boston`           |
| `TZ_NAME`       | Timezone string (e.g. America/New_York)                                 | `America/New_York` |
| `PORT`          | Port for the web app                                                    | `3000`             |
| `DEBUG`         | Enable debug logging                                                    | `false`            |
