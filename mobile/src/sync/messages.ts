import type { ClaimEvent, Device } from '../domain/types';

export type SyncMessage =
  | {
      type: 'hello';
      device: Device;
    }
  | {
      type: 'request_events';
      deviceId: string;
    }
  | {
      type: 'claim_events';
      events: ClaimEvent[];
    };

export type PeerSyncOptions = {
  device: Device;
  getEvents: () => Promise<ClaimEvent[]>;
  importEvents: (events: ClaimEvent[]) => Promise<number>;
  onImportedEvents: () => void;
  onStatus: (status: string) => void;
};

/**
 * Runtime validation for inbound SyncMessage payloads (feedback #60).
 *
 * SyncMessage variants are compile-time only, so malformed or hostile
 * payloads from untrusted peers could previously flow unchecked into
 * importEvents. Callers MUST route inbound wire data through
 * parseSyncMessage() (or the individual guards below) before dispatching
 * events to importEvents.
 */

/** Upper bound on events accepted in a single 'claim_events' message. */
export const MAX_EVENTS_PER_MESSAGE = 10000;

/**
 * Plausible epoch-millisecond window for timestamps:
 * 2000-01-01T00:00:00Z .. 2100-01-01T00:00:00Z. Values outside this
 * range are treated as corrupt rather than trusted.
 */
export const MIN_EVENT_EPOCH_MS = 946684800000;
export const MAX_EVENT_EPOCH_MS = 4102444800000;

/**
 * Strict ISO-8601 date-time: YYYY-MM-DDTHH:MM:SS with optional fractional
 * seconds and either 'Z' or an explicit +/-HH:MM offset. Stricter than
 * Date.parse, which also accepts loose input such as 'March 5, 2024'.
 */
const ISO_8601_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

export type ParseFailureReason =
  | 'not_an_object'
  | 'unknown_or_missing_type'
  | 'invalid_hello_device'
  | 'invalid_request_events_device_id'
  | 'too_many_events'
  | 'invalid_claim_event';

export type ParseResult =
  | { ok: true; message: SyncMessage }
  | { ok: false; reason: ParseFailureReason; detail: string };

export type HelloMessage = Extract<SyncMessage, { type: 'hello' }>;
export type RequestEventsMessage = Extract<SyncMessage, { type: 'request_events' }>;
export type ClaimEventsMessage = Extract<SyncMessage, { type: 'claim_events' }>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validates a strict ISO-8601 timestamp string, checking calendar
 * correctness component-wise instead of trusting Date.parse.
 */
export function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const match = ISO_8601_PATTERN.exec(value);
  if (match === null) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  const seconds = Number(match[6]);
  if (month < 1 || month > 12 || hours > 23 || minutes > 59 || seconds > 59) {
    return false;
  }
  // Reject impossible dates such as '2024-02-30'.
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) {
    return false;
  }
  return true;
}

/**
 * Guard for a single ClaimEvent arriving over the wire. Mirrors the
 * required fields of ClaimEvent in '../domain/types'; unknown extra
 * properties are tolerated for forward compatibility.
 */
export function isClaimEvent(value: unknown): value is ClaimEvent {
  if (!isPlainObject(value)) {
    return false;
  }
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.deviceId)) {
    return false;
  }
  if (!isValidIsoTimestamp(value.timestamp)) {
    return false;
  }
  const epochMs = Date.parse(value.timestamp);
  if (
    !Number.isFinite(epochMs) ||
    epochMs < MIN_EVENT_EPOCH_MS ||
    epochMs > MAX_EVENT_EPOCH_MS
  ) {
    return false;
  }
  return true;
}

export function isHelloMessage(value: unknown): value is HelloMessage {
  return isPlainObject(value) && value.type === 'hello' && isPlainObject(value.device);
}

export function isRequestEventsMessage(value: unknown): value is RequestEventsMessage {
  return (
    isPlainObject(value) && value.type === 'request_events' && isNonEmptyString(value.deviceId)
  );
}

export function isClaimEventsMessage(value: unknown): value is ClaimEventsMessage {
  if (!isPlainObject(value) || value.type !== 'claim_events' || !Array.isArray(value.events)) {
    return false;
  }
  const events = value.events as unknown[];
  if (events.length > MAX_EVENTS_PER_MESSAGE) {
    return false;
  }
  return events.every(isClaimEvent);
}

/**
 * Parses and validates an untrusted inbound payload against every
 * SyncMessage variant. Returns a discriminated result so callers can
 * drop malformed traffic without crashing the sync loop.
 *
 * Example:
 *   const result = parseSyncMessage(raw);
 *   if (!result.ok) {
 *     onStatus('Rejected peer message: ' + result.reason);
 *     return;
 *   }
 *   if (result.message.type === 'claim_events') {
 *     await importEvents(result.message.events); // safe: validated above
 *   }
 */
export function parseSyncMessage(input: unknown): ParseResult {
  if (!isPlainObject(input)) {
    return { ok: false, reason: 'not_an_object', detail: 'payload is not a JSON object' };
  }
  const type = input.type;
  if (typeof type !== 'string') {
    return { ok: false, reason: 'unknown_or_missing_type', detail: 'missing string "type"' };
  }
  switch (type) {
    case 'hello':
      if (isHelloMessage(input)) {
        return { ok: true, message: input as HelloMessage };
      }
      return {
        ok: false,
        reason: 'invalid_hello_device',
        detail: 'hello.device missing or invalid',
      };
    case 'request_events':
      if (isRequestEventsMessage(input)) {
        return { ok: true, message: input as RequestEventsMessage };
      }
      return {
        ok: false,
        reason: 'invalid_request_events_device_id',
        detail: 'deviceId must be a non-empty string',
      };
    case 'claim_events': {
      if (!Array.isArray(input.events)) {
        return { ok: false, reason: 'invalid_claim_event', detail: 'events must be an array' };
      }
      const events = input.events as unknown[];
      if (events.length > MAX_EVENTS_PER_MESSAGE) {
        return {
          ok: false,
          reason: 'too_many_events',
          detail: events.length + ' events exceeds limit of ' + MAX_EVENTS_PER_MESSAGE,
        };
      }
      const badIndex = events.findIndex((event) => !isClaimEvent(event));
      if (badIndex >= 0) {
        return {
          ok: false,
          reason: 'invalid_claim_event',
          detail: 'events[' + badIndex + '] failed ClaimEvent validation',
        };
      }
      return { ok: true, message: input as ClaimEventsMessage };
    }
    default:
      return {
        ok: false,
        reason: 'unknown_or_missing_type',
        detail: 'unsupported message type "' + type + '"',
      };
  }
}
