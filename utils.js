import 'dotenv/config';
const DEBUG = process.env.DEBUG || false;

export function getOrdinal(n) {
  let ord = 'th';

  if (n % 10 == 1 && n % 100 != 11) {
    ord = 'st';
  }
  else if (n % 10 == 2 && n % 100 != 12) {
    ord = 'nd';
  }
  else if (n % 10 == 3 && n % 100 != 13) {
    ord = 'rd';
  }

  return ord;
};

export function debugLog(message) {
  if (DEBUG) {
    console.log(message);
  }
}

export function debugError(message) {
  if (DEBUG) {
    console.error(message);
  }
}

export const jsDateToISOLocalStr = (d) => {
  // https://stackoverflow.com/a/76203735/1831147
  let retVal = null;
  const parsedInput = (typeof d === "string" || d instanceof String) && d.length < 11 ? `${d} ` : d;

  const utcDate = d ? new Date(parsedInput) : new Date();
  if (String(utcDate).toLowerCase() !== "invalid date") {

    const localTimestamp = utcDate.getTime() - utcDate.getTimezoneOffset() * 60 * 1000;
    const localDate = new Date(localTimestamp);

    retVal = localDate.toISOString().slice(0, -1);
  }
  return retVal;
};

export function checkTimeZoneString(tzString) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tzString });
    return true;
  } catch (e) {
    return false;
  }
};

export function getLocalDate(tzString) {
  const now = new Date();
  const options = { timeZone: tzString, hour12: false };
  const formatter = new Intl.DateTimeFormat('en-US', {
    ...options,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(now);
  const dateTime = parts.reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  const isoString = `${dateTime.year}-${dateTime.month}-${dateTime.day}`;
  return isoString
};