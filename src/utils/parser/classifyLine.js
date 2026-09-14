// Decides whether the text after a timestamp is a person's message or an
// event WhatsApp wrote itself. English exports only — WhatsApp localizes all
// of these strings.
//
// Evidence, strongest first:
//  1. No "Name: " prefix at all. Android writes group events this way
//     ("Alice added Bob"), so a line without a sender is a system event.
//  2. The would-be sender is really an event phrase containing a colon
//     ("Alice changed the subject to: Trip").
//  3. The body is a notice no person would type verbatim (the encryption notice).
//  4. The body starts with iOS's U+200E mark AND reads like an event. iOS gives
//     group events a sender (the group name), so the mark is what separates
//     "Trip: ‎Alice added Bob" from a person typing "I added sugar".
//
// Pattern-only matching without that evidence previously swallowed real
// messages like "Alice: I added sugar" as system events.

const SENDER_SPLIT = /^([^:\n]{1,120}?):\s([\s\S]*)$/;

const EVENT_PHRASE_IN_SENDER =
  / (changed the |changed this |changed their |changed his |changed her |created group|created this group|pinned a message)/;

const UNAMBIGUOUS_NOTICES = [
  /^messages and calls are end-to-end encrypted/i,
  /^messages to this (group|chat) are now secured with end-to-end encryption/i,
  /^your security code with .{1,120} changed/i,
  /^.{1,120}['’]s security code changed/i,
  /^.{1,120} changed their phone number to a new number/i,
];

const MARKED_EVENTS = [
  /^.{1,120} (added|removed) .+/i,
  /^.{1,120} (left|joined)\.?$/i,
  /^you (were added|were removed|joined|left|created|added|removed)\b/i,
  /^.{1,120} (created|changed|deleted) (the |this )?(group|subject|icon|description|settings)/i,
  /^.{1,120} changed (the|this|their) /i,
  /^.{1,120} (is now an admin|is no longer an admin|joined using this group's invite link)/i,
  /^you('re| are) now an admin/i,
  /disappearing messages/i,
  /^.{1,120} pinned a message/i,
  /^this chat is with a business account/i,
];

// iOS writes calls as a message from the caller. They are events, not text.
const CALL_EVENT = /^missed (voice|video) call$/i;

const firstNonSpace = (text) => {
  const i = text.search(/\S/);
  return i === -1 ? 0 : i;
};

// isMarkedAt(offset) reports whether a U+200E sat just before remainder[offset].
export const classifyRemainder = (remainder, isMarkedAt = () => false) => {
  const split = SENDER_SPLIT.exec(remainder);

  if (!split) {
    return { type: 'system', kind: 'event', text: remainder.trim() };
  }

  const sender = split[1].trim();
  const rawBody = split[2];
  const body = rawBody.trim();
  const bodyOffset = remainder.length - rawBody.length;
  // The mark can sit either side of the space after "Name:".
  const bodyMarked = isMarkedAt(bodyOffset - 1) || isMarkedAt(bodyOffset + firstNonSpace(rawBody));

  if (EVENT_PHRASE_IN_SENDER.test(sender)) {
    return { type: 'system', kind: 'event', text: remainder.trim() };
  }

  if (UNAMBIGUOUS_NOTICES.some((re) => re.test(body))) {
    return { type: 'system', kind: 'event', text: body };
  }

  if (bodyMarked && MARKED_EVENTS.some((re) => re.test(body))) {
    return { type: 'system', kind: 'event', text: body };
  }

  if (CALL_EVENT.test(body)) {
    return { type: 'system', kind: 'call', sender, text: body };
  }

  return { type: 'message', sender, body: rawBody, bodyMarked };
};
