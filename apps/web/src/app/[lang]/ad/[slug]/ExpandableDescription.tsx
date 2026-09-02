'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  text: string;
  moreLabel: string;
  lessLabel: string;
  /** Lines shown while collapsed. Eight is about a hundred words on a phone. */
  lines?: number;
};

/**
 * Long description clamped to a few lines, with "View more" only when it
 * really overflows at the current width, expanding in place.
 */
export default function ExpandableDescription({ text, moreLabel, lessLabel, lines = 8 }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    // Only a collapsed paragraph can be measured; when open, keep the last answer.
    if (expanded) return;
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  return (
    <div>
      <p
        ref={ref}
        className="text-gray-600 leading-relaxed whitespace-pre-line"
        style={
          expanded
            ? undefined
            : { display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
        }
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 text-sm font-semibold text-[#DC143C] hover:underline"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
