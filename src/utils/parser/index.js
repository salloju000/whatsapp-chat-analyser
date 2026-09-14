import { buildTimestamp } from './buildTimestamp';
import { classifyRemainder } from './classifyLine';
import { classifyContent } from './content';
import { detectFormat, inferDateOrder } from './detectFormat';
import { normalizeLine, splitLines, stripMarks } from './sanitize';

export const EMPTY_RESULT = {
  messages: [],
  systemMessages: [],
  format: null,
  dateOrder: 'DMY',
  dateOrderConfident: false,
  stats: { totalLines: 0, parsedLines: 0, unparsedLines: 0 },
  unparsedSamples: [],
};

const MAX_UNPARSED_SAMPLES = 5;

// Incremental so the worker can feed it chunks without ever holding the whole
// file. Call push() per line, then finish() once. With onMessage, completed
// messages are handed off instead of collected, so memory stays flat.
export const createParser = ({ format, dateOrder, onMessage }) => {
  const messages = [];
  const systemMessages = [];
  const unparsedSamples = [];
  let current = null;
  let totalLines = 0;
  let unparsedLines = 0;
  let messageCount = 0;

  const flush = () => {
    if (!current) return;
    const { bodyMarked, ...message } = current;
    const parsed = { ...message, ...classifyContent(message.message, { firstLineMarked: bodyMarked }) };
    messageCount++;
    if (onMessage) onMessage(parsed);
    else messages.push(parsed);
    current = null;
  };

  const push = (rawLine) => {
    totalLines++;
    const { text: line, markedAt } = stripMarks(normalizeLine(rawLine));
    const match = format.header.exec(line);

    if (!match) {
      // Only a line that follows a real message can be a continuation.
      if (current && line.length > 0) {
        current.message += `\n${line}`;
      } else if (line.trim().length > 0) {
        unparsedLines++;
        if (unparsedSamples.length < MAX_UNPARSED_SAMPLES) unparsedSamples.push(line);
      }
      return;
    }

    flush();

    const remainder = match[8] ?? '';
    const remainderStart = line.length - remainder.length;
    const timestamp = buildTimestamp(match, dateOrder);
    const result = classifyRemainder(remainder, (offset) => markedAt.has(remainderStart + offset));

    if (result.type === 'system') {
      const { type, ...event } = result;
      systemMessages.push({ timestamp, ...event });
      return;
    }

    current = {
      sender: result.sender,
      message: result.body.trim(),
      timestamp,
      bodyMarked: result.bodyMarked,
    };
  };

  const finish = () => {
    flush();
    return {
      messages,
      systemMessages,
      format: format.id,
      dateOrder,
      stats: {
        totalLines,
        parsedLines: messageCount + systemMessages.length,
        unparsedLines,
      },
      unparsedSamples,
    };
  };

  return { push, finish };
};

// Convenience wrapper for tests and the non-worker fallback path.
export const parseWhatsAppChat = (text) => {
  if (!text || !text.trim()) return { ...EMPTY_RESULT };

  const lines = splitLines(text);
  const format = detectFormat(lines);
  if (!format) {
    return {
      ...EMPTY_RESULT,
      stats: { totalLines: lines.length, parsedLines: 0, unparsedLines: lines.length },
      unparsedSamples: lines.filter((l) => l.trim()).slice(0, MAX_UNPARSED_SAMPLES),
    };
  }

  const { order, confident } = inferDateOrder(lines, format);
  const parser = createParser({ format, dateOrder: order });
  for (const line of lines) parser.push(line);

  return { ...parser.finish(), dateOrderConfident: confident };
};
