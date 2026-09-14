import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
  // Non-finite values reach here whenever an upstream stat divides by zero;
  // rendering "∞" or "NaN" is worse than rendering nothing meaningful.
  const target = Number.isFinite(end) ? end : 0;
  const [count, setCount] = useState(target);
  const frameRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setCount(target);
      return undefined;
    }

    let startTime;
    const animate = (now) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 4;
      setCount(Math.floor(target * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return (
    <>
      {/* The animated value churns ~60x/sec, so it is hidden from assistive
          tech and the settled value is exposed once instead. */}
      <span aria-hidden="true">
        {count.toLocaleString()}
        {suffix}
      </span>
      <span className="sr-only">
        {target.toLocaleString()}
        {suffix}
      </span>
    </>
  );
};

AnimatedCounter.propTypes = {
  end: PropTypes.number,
  duration: PropTypes.number,
  suffix: PropTypes.string,
};

export default AnimatedCounter;
