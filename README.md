# nhl-goal-announce

This app generates the text of a goal announcement using the NHL API. I created it primarily for use with Home Assistant as part of a goal sequence to mimick TD Garden in Boston.

### Endpoints

**/announce**

This is the primary endpoint for fetching the goal announcement. Sample response:

```json
{
  "status": "GOAL",
  "data": "Boston goal, scored by number 11, Trent Frederic. Assisted by number 73 Charlie McAvoy. Time of the goal 18:44. Frederic's 6th goal of the season from McAvoy at 18:44."
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

### Configuration

Config is done via environment variables passed to the container.

| ENV             | Description                                                            | Default            |
| --------------- | ---------------------------------------------------------------------- | ------------------ |
| `TEAM_ABBREV`   | Team abbreviation (e.g. BOS, NYR, SEA)                                 | `BOS`              |
| `ANNOUNCE_NAME` | The name for use in the announcement (e.g. "Boston goal, score by...") | `Boston`           |
| `TZ_NAME`       | Timezone string (e.g. America/New_York)                                | `America/New_York` |
| `PORT`          | Port for the web app                                                   | `3000`             |
| `DEBUG`         | Enable debug logging                                                    | `false`            |
