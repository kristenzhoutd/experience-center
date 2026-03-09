import { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // milliseconds per character
  onComplete?: () => void;
  className?: string;
}

export default function TypewriterText({
  text,
  speed = 15,
  onComplete,
  className = '',
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setIsComplete(false);

    if (!text) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        // Add multiple characters at once for faster effect
        const charsToAdd = Math.min(3, text.length - currentIndex);
        setDisplayedText(text.slice(0, currentIndex + charsToAdd));
        currentIndex += charsToAdd;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 animate-pulse" />
      )}
    </span>
  );
}
