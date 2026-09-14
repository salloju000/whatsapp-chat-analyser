import { useCallback, useEffect, useRef, useState } from 'react';

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

const looksLikeZip = async (file) => {
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  return ZIP_MAGIC.every((byte, i) => head[i] === byte);
};

const ERROR_COPY = {
  zip: {
    title: 'That’s the zipped export',
    detail:
      'WhatsApp wraps exports in a .zip. Unzip it and upload the _chat.txt file inside.',
  },
  empty: {
    title: 'That file is empty',
    detail: 'Nothing to analyze — try exporting the chat again.',
  },
  'unrecognized-format': {
    title: 'We couldn’t recognize this export',
    detail:
      'This doesn’t look like a WhatsApp chat export. Make sure you exported the chat itself, not a backup or a screenshot.',
  },
  'no-messages': {
    title: 'No messages found',
    detail: 'The file was readable but contained no messages we could parse.',
  },
  exception: {
    title: 'Something went wrong',
    detail: 'The file could not be processed.',
  },
};

const buildError = (reason, samples, message) => ({
  ...(ERROR_COPY[reason] ?? ERROR_COPY.exception),
  reason,
  samples: samples ?? [],
  technical: message,
});

export const useChatAnalysis = () => {
  const [status, setStatus] = useState('idle'); // idle | working | done | error
  const [progress, setProgress] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);

  const terminate = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  useEffect(() => terminate, [terminate]);

  const reset = useCallback(() => {
    terminate();
    setStatus('idle');
    setProgress(0);
    setAnalytics(null);
    setMeta(null);
    setError(null);
  }, [terminate]);

  const analyze = useCallback(
    async (file) => {
      terminate();
      setError(null);
      setProgress(0);
      setStatus('working');

      if (file.size === 0) {
        setError(buildError('empty'));
        setStatus('error');
        return;
      }

      if (await looksLikeZip(file)) {
        setError(buildError('zip'));
        setStatus('error');
        return;
      }

      const worker = new Worker(new URL('../workers/analyzer.worker.js', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;

      worker.onmessage = (event) => {
        const data = event.data;

        if (data.type === 'progress') {
          setProgress(data.totalBytes ? data.bytesRead / data.totalBytes : 0);
          return;
        }

        if (data.type === 'done') {
          setAnalytics(data.analytics);
          setMeta(data.meta);
          setStatus('done');
          terminate();
          return;
        }

        setError(buildError(data.reason, data.samples, data.message));
        setStatus('error');
        terminate();
      };

      worker.onerror = (event) => {
        setError(buildError('exception', [], event.message));
        setStatus('error');
        terminate();
      };

      worker.postMessage({ file });
    },
    [terminate]
  );

  return { status, progress, analytics, meta, error, analyze, reset };
};
