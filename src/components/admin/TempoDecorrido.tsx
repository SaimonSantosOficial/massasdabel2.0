import React, { useState, useEffect } from 'react';

interface TempoDecorridoProps {
  createdAt?: number;
  status: string;
}

export default function TempoDecorrido({ createdAt, status }: TempoDecorridoProps) {
  const [text, setText] = useState<string>('');

  useEffect(() => {
    if (!createdAt || status === 'entregue') {
      setText('');
      return;
    }

    const calculate = () => {
      const diffMs = Date.now() - createdAt;
      if (diffMs < 0) {
        setText('agora');
        return;
      }

      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        setText(`há ${diffDays}d`);
      } else if (diffHours > 0) {
        const mins = diffMins % 60;
        setText(`há ${diffHours}h${mins > 0 ? ` ${mins}m` : ''}`);
      } else if (diffMins > 0) {
        setText(`há ${diffMins} min`);
      } else {
        setText('há < 1 min');
      }
    };

    calculate();
    const interval = setInterval(calculate, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, [createdAt, status]);

  if (!createdAt || status === 'entregue') return null;

  return (
    <span className="text-amber-400 font-extrabold font-mono text-[11px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 ml-1.5 inline-block shrink-0 align-middle">
      {text}
    </span>
  );
}
