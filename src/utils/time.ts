import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Register Day.js plugins once for the whole app.
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export type TimeDisplayFormat = 'twitter' | 'iso' | 'relative';

const UTC_TIMEZONE = 'UTC';

// fxtwitter returns dates like "Tue Jun 02 20:12:29 +0000 2009".
const TWITTER_DATE_FORMAT = 'ddd MMM DD HH:mm:ss ZZ YYYY';
// Day.js customParseFormat has no weekday token, so the leading weekday
// abbreviation is stripped before the explicit strict parse.
const TWITTER_DATE_FORMAT_WITHOUT_WEEKDAY = 'MMM DD HH:mm:ss ZZ YYYY';
const WEEKDAY_PREFIX = /^[A-Za-z]{3}\s+/;

// Used only when the runtime has no Intl.supportedValuesOf support.
const FALLBACK_TIMEZONES = [
    'UTC',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Taipei',
    'Asia/Seoul',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Moscow',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'Australia/Sydney',
    'Pacific/Auckland',
];

let cachedTimezones: string[] | null = null;

const timezoneProbe = new Date(Date.UTC(2020, 0, 1, 0, 0, 0));

/**
 * Whether the given string is a timezone name the current runtime understands.
 */
export function isValidTimezone(timezone: string): boolean {
    if (typeof timezone !== 'string' || timezone.trim() === '') {
        return false;
    }
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: timezone.trim() }).format(timezoneProbe);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * All IANA timezone names supported by the current runtime, with "UTC" first.
 * The list is computed once and cached.
 */
export function getSupportedTimezones(): string[] {
    if (cachedTimezones) {
        return cachedTimezones;
    }

    const zones = new Set<string>();
    const intlWithSupportedValues = Intl as typeof Intl & {
        supportedValuesOf?: (key: string) => string[];
    };

    if (typeof intlWithSupportedValues.supportedValuesOf === 'function') {
        try {
            intlWithSupportedValues.supportedValuesOf('timeZone').forEach((zone) => zones.add(zone));
        } catch (error) {
            // Fall through to the static fallback list below.
        }
    }

    if (zones.size === 0) {
        FALLBACK_TIMEZONES.forEach((zone) => zones.add(zone));
    }

    try {
        const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (resolved) {
            zones.add(resolved);
        }
    } catch (error) {
        // Ignore: the browser timezone is optional information only.
    }

    zones.add(UTC_TIMEZONE);

    const sorted = Array.from(zones)
        .filter((zone) => isValidTimezone(zone))
        .sort((left, right) => left.localeCompare(right));

    const withoutUtc = sorted.filter((zone) => zone !== UTC_TIMEZONE);
    cachedTimezones = [UTC_TIMEZONE, ...withoutUtc];
    return cachedTimezones;
}

/**
 * Returns the canonical spelling of a timezone (e.g. "asia/shanghai" -> "Asia/Shanghai").
 * Returns null when the timezone is not valid.
 */
export function normalizeTimezone(timezone: string): string | null {
    if (typeof timezone !== 'string') {
        return null;
    }

    const trimmed = timezone.trim();
    if (!isValidTimezone(trimmed)) {
        return null;
    }

    // Prefer the canonical spelling from the supported list.
    const lowered = trimmed.toLowerCase();
    const matched = getSupportedTimezones().find((zone) => zone.toLowerCase() === lowered);
    if (matched) {
        return matched;
    }

    try {
        const resolved = new Intl.DateTimeFormat('en-US', { timeZone: trimmed }).resolvedOptions().timeZone;
        if (resolved) {
            return resolved;
        }
    } catch (error) {
        return null;
    }

    return trimmed;
}

function normalizeEpoch(value: number): number | null {
    if (!Number.isFinite(value)) {
        return null;
    }
    // Values below 1e12 are treated as Unix seconds, larger ones as milliseconds.
    const milliseconds = Math.abs(value) < 1e12 ? value * 1000 : value;
    return Number.isFinite(milliseconds) ? milliseconds : null;
}

/**
 * Parses any timestamp fxtwitter may return into milliseconds since epoch.
 * Supports ISO 8601 strings, the Twitter date format and Unix seconds.
 * Returns null when the value cannot be parsed.
 */
function parseTimestamp(input: unknown): number | null {
    if (input === null || input === undefined) {
        return null;
    }

    if (typeof input === 'number') {
        return normalizeEpoch(input);
    }

    if (typeof input !== 'string') {
        return null;
    }

    const value = input.trim();
    if (value === '') {
        return null;
    }

    if (/^-?\d+$/.test(value)) {
        return normalizeEpoch(Number(value));
    }

    // Native Day.js parsing handles ISO 8601 and also accepts the Twitter
    // date format through the Date constructor fallback.
    const native = dayjs.utc(value);
    if (native.isValid()) {
        return native.valueOf();
    }

    // Explicit strict parse for runtimes whose Date parser rejects the Twitter format.
    const explicit = dayjs.utc(value.replace(WEEKDAY_PREFIX, ''), TWITTER_DATE_FORMAT_WITHOUT_WEEKDAY, true);
    if (explicit.isValid()) {
        return explicit.valueOf();
    }

    return null;
}

function pluralize(value: number, unit: string): string {
    return `${value} ${unit}${value === 1 ? '' : 's'}`;
}

/**
 * English relative time, e.g. "45 seconds ago", "24 minutes ago",
 * "17 years 5 months 18 days 15 hours 47 minutes ago" or "in 3 hours 5 minutes".
 * Below one minute the value is second-precise; above one minute every non-zero
 * unit from years down to minutes is kept.
 */
function formatRelative(targetMilliseconds: number, nowMilliseconds: number): string {
    const isFuture = targetMilliseconds > nowMilliseconds;
    const difference = Math.abs(nowMilliseconds - targetMilliseconds);

    if (difference < 60000) {
        const label = pluralize(Math.floor(difference / 1000), 'second');
        return isFuture ? `in ${label}` : `${label} ago`;
    }

    let anchor = dayjs.utc(Math.min(targetMilliseconds, nowMilliseconds));
    const end = dayjs.utc(Math.max(targetMilliseconds, nowMilliseconds));

    const years = end.diff(anchor, 'year');
    anchor = anchor.add(years, 'year');
    const months = end.diff(anchor, 'month');
    anchor = anchor.add(months, 'month');
    const days = end.diff(anchor, 'day');
    anchor = anchor.add(days, 'day');
    const hours = end.diff(anchor, 'hour');
    anchor = anchor.add(hours, 'hour');
    const minutes = end.diff(anchor, 'minute');

    const parts: string[] = [];
    if (years > 0) {
        parts.push(pluralize(years, 'year'));
    }
    if (months > 0) {
        parts.push(pluralize(months, 'month'));
    }
    if (days > 0) {
        parts.push(pluralize(days, 'day'));
    }
    if (hours > 0) {
        parts.push(pluralize(hours, 'hour'));
    }
    if (minutes > 0) {
        parts.push(pluralize(minutes, 'minute'));
    }

    const label = parts.length > 0 ? parts.join(' ') : pluralize(1, 'minute');
    return isFuture ? `in ${label}` : `${label} ago`;
}

/**
 * Formats a timestamp in the requested timezone.
 *
 * @param input Raw timestamp (ISO string, Twitter date string or Unix seconds).
 * @param timezone IANA timezone name, e.g. "Asia/Shanghai".
 * @param format Output style.
 * @param now Optional clock override, used by the relative format.
 * @returns The formatted string, or '' for empty/unparsable input.
 * @throws RangeError when the timezone is not valid.
 */
export function formatTimestamp(
    input: unknown,
    timezone: string,
    format: TimeDisplayFormat,
    now: number = Date.now()
): string {
    const milliseconds = parseTimestamp(input);
    if (milliseconds === null) {
        return '';
    }

    // Unknown values may come from an older persisted store; fall back to the default.
    const resolvedFormat: TimeDisplayFormat =
        format === 'iso' || format === 'relative' ? format : 'twitter';

    if (resolvedFormat === 'relative') {
        return formatRelative(milliseconds, now);
    }

    const trimmedTimezone = typeof timezone === 'string' && timezone.trim() !== ''
        ? timezone.trim()
        : UTC_TIMEZONE;

    if (!isValidTimezone(trimmedTimezone)) {
        throw new RangeError(`Invalid timezone: ${String(timezone)}`);
    }

    const zoned = dayjs(milliseconds).tz(trimmedTimezone).locale('en');

    if (resolvedFormat === 'iso') {
        return zoned.utcOffset() === 0
            ? zoned.format('YYYY-MM-DDTHH:mm:ss[Z]')
            : zoned.format('YYYY-MM-DDTHH:mm:ssZ');
    }

    return zoned.format(TWITTER_DATE_FORMAT);
}
