// Representative English WhatsApp exports, written line-for-line in the shapes
// WhatsApp produces. Invisible characters are spelled out so they can't be
// lost by an editor:
//   LRM  U+200E  iOS puts it before WhatsApp-generated text and at line starts
//   NNBSP U+202F newer exports put it between the time and AM/PM
// These are synthetic (no real conversation data is committed); names, numbers
// and URLs are invented.

const LRM = '‎';
const NNBSP = ' ';

// Android · group · exported WITHOUT media · DD/MM/YYYY · 24-hour
export const ANDROID_GROUP_NO_MEDIA = [
  '03/02/2024, 09:12 - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. Tap to learn more.',
  '03/02/2024, 09:12 - Priya created group "Weekend Trip"',
  '03/02/2024, 09:13 - Priya added Rahul',
  '03/02/2024, 09:13 - Priya added Meera',
  '03/02/2024, 09:15 - Priya: Who is in for Goa? 🏖️🙌🏽',
  '03/02/2024, 09:16 - Rahul: Me!! 😂😂😂',
  '03/02/2024, 09:16 - Rahul: <Media omitted>',
  '03/02/2024, 09:17 - Meera: I left my charger at yours btw',
  '03/02/2024, 09:18 - Meera: This message was deleted',
  '03/02/2024, 09:20 - Priya: <Media omitted>',
  '03/02/2024, 09:21 - Rahul: location: https://maps.google.com/?q=15.2993,74.1240',
  '03/02/2024, 09:22 - Meera: Booking link https://example.com/stay?id=42.',
  '03/02/2024, 09:23 - Priya: Sounds good <This message was edited>',
  '03/02/2024, 21:05 - Meera left',
  '04/02/2024, 08:00 - Priya changed the subject from "Weekend Trip" to "Goa 🌴"',
  '04/02/2024, 08:01 - Rahul: 👨‍👩‍👧‍👦 🇮🇳 1️⃣',
].join('\n');

// Android · one-on-one · exported WITH media · MM/DD/YY · 12-hour with NNBSP
export const ANDROID_INDIVIDUAL_WITH_MEDIA = [
  `12/24/23, 9:41${NNBSP}PM - Sam: IMG-20231224-WA0007.jpg (file attached)`,
  'Christmas tree is up 🎄',
  `12/24/23, 9:42${NNBSP}PM - Alex: VID-20231224-WA0008.mp4 (file attached)`,
  `12/24/23, 9:43${NNBSP}PM - Alex: PTT-20231224-WA0009.opus (file attached)`,
  `12/24/23, 9:44${NNBSP}PM - Sam: STK-20231224-WA0010.webp (file attached)`,
  `12/24/23, 9:45${NNBSP}PM - Sam: AUD-20231224-WA0011.mp3 (file attached)`,
  `12/24/23, 9:46${NNBSP}PM - Alex: Flight tickets.pdf (file attached)`,
  `12/24/23, 9:47${NNBSP}PM - Alex: Jordan Lee.vcf (file attached)`,
  `12/25/23, 12:01${NNBSP}AM - Sam: Merry Christmas ❤️🎅🏾`,
  `12/25/23, 12:02${NNBSP}AM - Alex: Merry Christmas!! 🥹 🤶🏻`,
].join('\n');

// iOS · group · exported WITHOUT media · [DD/MM/YYYY, HH:MM:SS]
export const IOS_GROUP_NO_MEDIA = [
  `${LRM}[14/05/2024, 18:02:11] Book Club: ${LRM}Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.`,
  `${LRM}[14/05/2024, 18:02:11] Book Club: ${LRM}Nadia created group “Book Club”`,
  `${LRM}[14/05/2024, 18:02:40] Book Club: ${LRM}Nadia added Omar`,
  '[14/05/2024, 18:03:02] Nadia: Chapter 3 thoughts? 🤔',
  '[14/05/2024, 18:04:15] Omar: I added some notes to the doc',
  `${LRM}[14/05/2024, 18:05:00] Omar: ${LRM}image omitted`,
  `${LRM}[14/05/2024, 18:05:30] Nadia: ${LRM}GIF omitted`,
  `${LRM}[14/05/2024, 18:06:00] Omar: ${LRM}sticker omitted`,
  `${LRM}[14/05/2024, 18:06:30] Nadia: ${LRM}audio omitted`,
  `${LRM}[14/05/2024, 18:07:00] Omar: ${LRM}video omitted`,
  `${LRM}[14/05/2024, 18:07:30] Nadia: ${LRM}Reading list.pdf • ${LRM}3 pages ${LRM}document omitted`,
  `${LRM}[14/05/2024, 18:08:00] Omar: ${LRM}Contact card omitted`,
  `${LRM}[14/05/2024, 18:09:00] Nadia: ${LRM}You deleted this message.`,
  `${LRM}[14/05/2024, 18:10:00] Omar: ${LRM}Missed voice call`,
  `${LRM}[14/05/2024, 18:11:00] Book Club: ${LRM}Omar left`,
  '[15/05/2024, 07:30:00] Nadia: Morning 👋🏼☀️',
].join('\n');

// iOS · one-on-one · exported WITH media · [M/D/YY, h:mm:ss AM]
export const IOS_INDIVIDUAL_WITH_MEDIA = [
  `[3/9/24, 10:15:02${NNBSP}AM] Lena: ${LRM}<attached: 00000012-PHOTO-2024-03-09-10-15-02.jpg>`,
  `[3/9/24, 10:15:40${NNBSP}AM] Chris: ${LRM}<attached: 00000013-GIF-2024-03-09-10-15-40.mp4>`,
  `[3/9/24, 10:16:05${NNBSP}AM] Lena: ${LRM}<attached: 00000014-STICKER-2024-03-09-10-16-05.webp>`,
  `[3/9/24, 10:16:30${NNBSP}AM] Chris: ${LRM}<attached: 00000015-AUDIO-2024-03-09-10-16-30.opus>`,
  `[3/9/24, 10:17:00${NNBSP}AM] Lena: ${LRM}<attached: 00000016-VIDEO-2024-03-09-10-17-00.mp4>`,
  `[3/9/24, 10:17:30${NNBSP}AM] Chris: ${LRM}<attached: 00000017-Lease agreement.pdf>`,
  `[3/13/24, 8:00:00${NNBSP}PM] Lena: 🧑🏽‍🚀 launch day! 🚀🚀`,
  `[3/13/24, 8:01:00${NNBSP}PM] Chris: 🏃‍♀️💨 omw ❤️‍🔥`,
].join('\n');
