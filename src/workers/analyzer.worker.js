import { createAccumulator } from '../utils/analytics';
import { detectFormat, inferDateOrder } from '../utils/parser/detectFormat';
import { createParser } from '../utils/parser';
import { sanitizeLine } from '../utils/parser/sanitize';

const PROGRESS_INTERVAL_BYTES = 1 << 19; // ~512KB
const SNIFF_BYTES = 1 << 18; // read this much before deciding the format

const post = (message) => self.postMessage(message);

// Reads the file as a stream of lines, never holding more than one chunk plus
// a partial trailing line in memory.
async function* readLines(file) {
  const reader = file.stream().pipeThrough(new TextDecoderStream('utf-8')).getReader();
  let remainder = '';
  let bytesRead = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    bytesRead += value.length;
    const lines = (remainder + value).split('\n');
    remainder = lines.pop() ?? '';

    for (const line of lines) yield { line, bytesRead };
  }

  if (remainder) yield { line: remainder, bytesRead };
}

const analyze = async (file) => {
  // First pass over the head of the file: work out the format and date order.
  // Both need to be known before a single message can be built correctly.
  const sniffSlice = file.slice(0, Math.min(SNIFF_BYTES, file.size));
  const sniffText = await sniffSlice.text();
  const sniffLines = sniffText.split('\n');

  const format = detectFormat(sniffLines);
  if (!format) {
    post({
      type: 'error',
      reason: 'unrecognized-format',
      samples: sniffLines.map(sanitizeLine).filter((l) => l.trim()).slice(0, 5),
    });
    return;
  }

  const { order, confident } = inferDateOrder(sniffLines, format);

  const accumulator = createAccumulator();
  const parser = createParser({ format, dateOrder: order, onMessage: accumulator.add });

  let nextProgressAt = PROGRESS_INTERVAL_BYTES;

  for await (const { line, bytesRead } of readLines(file)) {
    parser.push(line);

    if (bytesRead >= nextProgressAt) {
      nextProgressAt = bytesRead + PROGRESS_INTERVAL_BYTES;
      post({ type: 'progress', bytesRead, totalBytes: file.size });
    }
  }

  const parsed = parser.finish();

  const analytics = accumulator.finish();

  post({ type: 'progress', bytesRead: file.size, totalBytes: file.size });

  if (!analytics) {
    post({
      type: 'error',
      reason: 'no-messages',
      samples: parsed.unparsedSamples,
    });
    return;
  }

  post({
    type: 'done',
    analytics,
    meta: {
      format: parsed.format,
      dateOrder: parsed.dateOrder,
      dateOrderConfident: confident,
      systemMessageCount: parsed.systemMessages.length,
      unparsedLines: parsed.stats.unparsedLines,
      totalLines: parsed.stats.totalLines,
    },
  });
};

self.onmessage = async (event) => {
  const { file } = event.data;
  try {
    await analyze(file);
  } catch (error) {
    post({ type: 'error', reason: 'exception', message: error?.message ?? String(error) });
  }
};
