import { describe, expect, it } from 'vitest';
import { classifyContent, extractUrls } from '../utils/parser/content';

const typesOf = (body, options) => classifyContent(body, options).media.map((m) => m.type);

describe('Android media', () => {
  it('"<Media omitted>" is media of unknown type — Android does not record the type', () => {
    const result = classifyContent('<Media omitted>');
    expect(result.media).toEqual([{ type: 'unknown', evidence: 'android-placeholder', confidence: 'unknown' }]);
    expect(result.text).toBe('');
  });

  it.each([
    ['IMG-20240312-WA0001.jpg (file attached)', 'image'],
    ['VID-20240312-WA0002.mp4 (file attached)', 'video'],
    ['AUD-20240312-WA0003.mp3 (file attached)', 'audio'],
    ['PTT-20240312-WA0004.opus (file attached)', 'voice'],
    ['STK-20240312-WA0005.webp (file attached)', 'sticker'],
  ])('WhatsApp file prefix %s → %s (confirmed)', (body, type) => {
    const [media] = classifyContent(body).media;
    expect(media).toEqual({ type, evidence: 'android-filename', confidence: 'confirmed' });
  });

  it.each([
    ['Flight tickets.pdf (file attached)', 'document'],
    ['budget 2024.xlsx (file attached)', 'document'],
    ['Jordan Lee.vcf (file attached)', 'contact'],
    ['holiday.png (file attached)', 'image'],
    ['funny.gif (file attached)', 'gif'],
    ['clip.mov (file attached)', 'video'],
  ])('original filename %s → %s (inferred from extension)', (body, type) => {
    const [media] = classifyContent(body).media;
    expect(media.type).toBe(type);
    expect(media.confidence).toBe('inferred');
  });

  it('never calls an Android VID- file a GIF — both are sent as VID-*.mp4', () => {
    expect(typesOf('VID-20240312-WA0002.mp4 (file attached)')).toEqual(['video']);
  });

  it('keeps a caption on the following line as text', () => {
    const result = classifyContent('IMG-20240312-WA0001.jpg (file attached)\nChristmas tree is up 🎄');
    expect(typesOf('IMG-20240312-WA0001.jpg (file attached)\nx')).toEqual(['image']);
    expect(result.text).toBe('Christmas tree is up 🎄');
  });
});

describe('iOS media', () => {
  it.each([
    ['image omitted', 'image'],
    ['video omitted', 'video'],
    ['GIF omitted', 'gif'],
    ['sticker omitted', 'sticker'],
    ['audio omitted', 'audio'],
    ['Contact card omitted', 'contact'],
    ['document omitted', 'document'],
  ])('placeholder "%s" → %s (confirmed)', (body, type) => {
    const [media] = classifyContent(body, { firstLineMarked: true }).media;
    expect(media).toEqual({ type, evidence: 'ios-placeholder', confidence: 'confirmed' });
  });

  it('never calls iOS "audio omitted" a voice note — the export does not say', () => {
    expect(typesOf('audio omitted')).toEqual(['audio']);
  });

  it('recognizes a named document with page count', () => {
    expect(typesOf('Reading list.pdf • 3 pages document omitted', { firstLineMarked: true })).toEqual(['document']);
  });

  it.each([
    ['<attached: 00000012-PHOTO-2024-03-09-10-15-02.jpg>', 'image'],
    ['<attached: 00000013-GIF-2024-03-09-10-15-40.mp4>', 'gif'],
    ['<attached: 00000014-STICKER-2024-03-09-10-16-05.webp>', 'sticker'],
    ['<attached: 00000015-AUDIO-2024-03-09-10-16-30.opus>', 'audio'],
    ['<attached: 00000016-VIDEO-2024-03-09-10-17-00.mp4>', 'video'],
  ])('attachment %s → %s (confirmed)', (body, type) => {
    const [media] = classifyContent(body).media;
    expect(media).toEqual({ type, evidence: 'ios-filename', confidence: 'confirmed' });
  });

  it('infers a document from an attached file with no WhatsApp token', () => {
    const [media] = classifyContent('<attached: 00000017-Lease agreement.pdf>').media;
    expect(media).toEqual({ type: 'document', evidence: 'extension', confidence: 'inferred' });
  });
});

describe('uncertain media', () => {
  it('marks other WhatsApp "omitted" placeholders as unknown instead of guessing', () => {
    expect(typesOf('<View once voice message omitted>')).toEqual(['unknown']);
    expect(typesOf('view once photo omitted', { firstLineMarked: true })).toEqual(['unknown']);
  });

  it('has no "meme" category — an image is only ever an image', () => {
    const types = ['image omitted', '<Media omitted>', 'IMG-20240312-WA0001.jpg (file attached)'].flatMap((b) => typesOf(b));
    expect(types).not.toContain('meme');
  });
});

describe('text that only looks like media', () => {
  it.each([
    'the image omitted from the report was fine',
    'I sent IMG-20240312-WA0001.jpg earlier',
    'check budget.xlsx please',
    'she sent the wrong document omitted', // no iOS mark, so not WhatsApp-generated
    '<not a placeholder>',
  ])('"%s" stays text', (body) => {
    const result = classifyContent(body);
    expect(result.isMedia).toBe(false);
    expect(result.text).toBe(body);
  });
});

describe('deleted and edited messages', () => {
  it.each(['This message was deleted', 'You deleted this message', 'You deleted this message.'])('"%s" is deleted', (body) => {
    const result = classifyContent(body);
    expect(result.isDeleted).toBe(true);
    expect(result.text).toBe('');
    expect(result.isMedia).toBe(false);
  });

  it('does not treat a sentence mentioning deletion as deleted', () => {
    expect(classifyContent('I think this message was deleted by her').isDeleted).toBe(false);
  });

  it('strips the edited marker from the text and flags the message', () => {
    const result = classifyContent('Sounds good <This message was edited>');
    expect(result.isEdited).toBe(true);
    expect(result.text).toBe('Sounds good');
  });
});

describe('locations and links', () => {
  it('detects a shared location and does not count its map URL as a link', () => {
    const result = classifyContent('location: https://maps.google.com/?q=15.2993,74.1240');
    expect(result.isLocation).toBe(true);
    expect(result.urls).toEqual([]);
    expect(result.text).toBe('');
  });

  it('strips trailing sentence punctuation from links', () => {
    expect(extractUrls('see https://example.com/stay?id=42. and (https://a.co/x)')).toEqual([
      'https://example.com/stay?id=42',
      'https://a.co/x',
    ]);
  });

  it('keeps parentheses that belong to the URL', () => {
    expect(extractUrls('https://en.wikipedia.org/wiki/Goa_(state)')).toEqual(['https://en.wikipedia.org/wiki/Goa_(state)']);
  });

  it('detects links without a scheme that start with www.', () => {
    expect(extractUrls('go to www.example.org now')).toEqual(['www.example.org']);
  });

  it('does not count links inside a media caption twice or drop them', () => {
    const result = classifyContent('IMG-20240312-WA0001.jpg (file attached)\nfrom https://example.com');
    expect(result.urls).toEqual(['https://example.com']);
  });
});
