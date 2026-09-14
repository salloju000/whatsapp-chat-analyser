// Classifies what a message body contains, using only what the text export
// actually says. Every media item records the evidence it came from so
// "confirmed by WhatsApp's own label" stays separate from "inferred from a
// file extension".
//
// What the export can contain (English):
//   Android, without media:  "<Media omitted>" for EVERY media type.
//   Android, with media:     "IMG-20240312-WA0001.jpg (file attached)"
//                            WhatsApp file prefixes: IMG image, VID video,
//                            AUD audio, PTT voice note, STK sticker.
//                            Documents keep their original name.
//   iOS, without media:      "‎image omitted", "‎video omitted", "‎GIF omitted",
//                            "‎sticker omitted", "‎audio omitted",
//                            "‎Contact card omitted",
//                            "‎Name.pdf • ‎3 pages ‎document omitted"
//   iOS, with media:         "<attached: 00000012-PHOTO-2024-03-12-14-32-05.jpg>"
//                            with PHOTO / VIDEO / GIF / STICKER / AUDIO tokens.
//
// Not derivable from any of these: whether an image is a meme, a screenshot
// or a photo; whether an Android video was sent as a GIF (both are VID-*.mp4);
// whether an iOS "audio omitted" was a voice note; and anything at all about
// Android "<Media omitted>".

export const MEDIA_TYPES = ['image', 'video', 'gif', 'sticker', 'audio', 'voice', 'document', 'contact', 'unknown'];

export const MEDIA_LABELS = {
  image: { one: 'image', many: 'images' },
  video: { one: 'video', many: 'videos' },
  gif: { one: 'GIF', many: 'GIFs' },
  sticker: { one: 'sticker', many: 'stickers' },
  audio: { one: 'audio clip', many: 'audio clips' },
  voice: { one: 'voice note', many: 'voice notes' },
  document: { one: 'document', many: 'documents' },
  contact: { one: 'contact', many: 'contacts' },
  unknown: { one: 'of unknown type', many: 'of unknown type' },
};

// confidence: 'confirmed' = WhatsApp's own label or file-naming convention
//             'inferred'  = file extension only
//             'unknown'   = media is present but its type is not recorded
const item = (type, evidence, confidence) => ({ type, evidence, confidence });

const IOS_PLACEHOLDERS = [
  [/^image omitted$/i, 'image'],
  [/^video omitted$/i, 'video'],
  [/^gif omitted$/i, 'gif'],
  [/^sticker omitted$/i, 'sticker'],
  [/^audio omitted$/i, 'audio'],
  [/^contact card omitted$/i, 'contact'],
  [/^document omitted$/i, 'document'],
];

const ANDROID_PREFIXES = [
  [/^IMG-\d{8}-WA\d+/i, 'image'],
  [/^VID-\d{8}-WA\d+/i, 'video'],
  [/^AUD-\d{8}-WA\d+/i, 'audio'],
  [/^PTT-\d{8}-WA\d+/i, 'voice'],
  [/^STK-\d{8}-WA\d+/i, 'sticker'],
];

const IOS_TOKENS = [
  [/-PHOTO-/i, 'image'],
  [/-VIDEO-/i, 'video'],
  [/-GIF-/i, 'gif'],
  [/-STICKER-/i, 'sticker'],
  [/-AUDIO-/i, 'audio'],
];

const EXTENSION_TYPES = [
  [/\.(jpe?g|png|webp|heic|heif|bmp|tiff?)$/i, 'image'],
  [/\.gif$/i, 'gif'],
  [/\.(mp4|mov|3gp|mkv|webm|avi|m4v)$/i, 'video'],
  [/\.(opus|ogg|oga|m4a|mp3|aac|wav|amr|flac)$/i, 'audio'],
  [/\.vcf$/i, 'contact'],
];

const byExtension = (filename) => {
  for (const [re, type] of EXTENSION_TYPES) {
    if (re.test(filename)) return item(type, 'extension', 'inferred');
  }
  // Anything else WhatsApp attached is sent through the document picker.
  return item('document', 'extension', 'inferred');
};

const ANDROID_ATTACHED = /^(.+\.[A-Za-z0-9]{1,8}) \(file attached\)$/;
const IOS_ATTACHED = /^<attached:\s*(.+?)>$/i;

// A single line is media only if the whole line is WhatsApp's marker, so a
// person writing "the image omitted from the report" stays text.
const classifyMediaLine = (line, marked) => {
  if (/^<media omitted>$/i.test(line)) return item('unknown', 'android-placeholder', 'unknown');

  for (const [re, type] of IOS_PLACEHOLDERS) {
    if (re.test(line)) return item(type, 'ios-placeholder', 'confirmed');
  }

  // iOS prefixes the document name and page count: "Report.pdf • 3 pages document omitted".
  if (marked && / document omitted$/i.test(line)) return item('document', 'ios-placeholder', 'confirmed');

  const android = ANDROID_ATTACHED.exec(line);
  if (android) {
    const filename = android[1];
    for (const [re, type] of ANDROID_PREFIXES) {
      if (re.test(filename)) return item(type, 'android-filename', 'confirmed');
    }
    return byExtension(filename);
  }

  const ios = IOS_ATTACHED.exec(line);
  if (ios) {
    const filename = ios[1];
    for (const [re, type] of IOS_TOKENS) {
      if (re.test(filename)) return item(type, 'ios-filename', 'confirmed');
    }
    return byExtension(filename);
  }

  // Other WhatsApp-generated "... omitted" placeholders (e.g. view-once media)
  // are media, but their wording is not a reliable type signal.
  if (/^<[^<>]{1,80} omitted>$/i.test(line) || (marked && /^[^<>]{1,80} omitted$/i.test(line))) {
    return item('unknown', 'placeholder', 'unknown');
  }

  return null;
};

const DELETED = /^(this message was deleted|you deleted this message)\.?$/i;
const EDITED_SUFFIX = /\s*<this message was edited>$/i;
const LOCATION_LINE = /^location:\s*(https?:\/\/\S+)$/i;
const URL_PATTERN = /\bhttps?:\/\/[^\s<>"]+|\bwww\.[^\s<>"]+/gi;

const trimUrl = (url) => {
  let cleaned = url.replace(/[.,!?;:'"]+$/, '');
  // Drop a trailing ")" only when it closes a parenthesis outside the URL.
  while (cleaned.endsWith(')') && (cleaned.match(/\(/g)?.length ?? 0) < (cleaned.match(/\)/g)?.length ?? 0)) {
    cleaned = cleaned.slice(0, -1).replace(/[.,!?;:'"]+$/, '');
  }
  return cleaned;
};

export const extractUrls = (text) => (text.match(URL_PATTERN) ?? []).map(trimUrl);

// firstLineMarked: whether iOS's U+200E preceded the body. Continuation lines
// have already had their marks removed, so only the first line carries it.
export const classifyContent = (body, { firstLineMarked = false } = {}) => {
  let working = body.trim();

  const isEdited = EDITED_SUFFIX.test(working);
  if (isEdited) working = working.replace(EDITED_SUFFIX, '').trim();

  if (DELETED.test(working)) {
    return { text: '', media: [], isMedia: false, isDeleted: true, isLocation: false, isEdited, urls: [] };
  }

  const media = [];
  let isLocation = false;
  const textLines = [];

  working.split('\n').forEach((rawLine, index) => {
    const line = rawLine.trim();
    const found = classifyMediaLine(line, index === 0 && firstLineMarked);
    if (found) {
      media.push(found);
      return;
    }
    if (LOCATION_LINE.test(line)) {
      isLocation = true;
      return;
    }
    textLines.push(rawLine);
  });

  // Captions survive as text; WhatsApp's markers and the location URL do not.
  const text = textLines.join('\n').trim();

  return {
    text,
    media,
    isMedia: media.length > 0,
    isDeleted: false,
    isLocation,
    isEdited,
    urls: extractUrls(text),
  };
};
