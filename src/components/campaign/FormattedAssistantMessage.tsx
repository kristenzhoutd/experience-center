/**
 * FormattedAssistantMessage component
 * Renders AI assistant responses with proper markdown formatting
 * Detects options (Option A, Option B, etc.) and renders them as clickable buttons
 */

import React, { useState, useMemo } from 'react';

export interface FormattedAssistantMessageProps {
  content: string;
  onOptionClick?: (optionText: string) => void;
}

interface DetectedOption {
  label: string;
  description: string;
  fullText: string;
}

const FormattedAssistantMessage = ({ content, onOptionClick }: FormattedAssistantMessageProps) => {
  // State for selected option (for "Next" button pattern)
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

  // Helper to clean option descriptions - remove markdown artifacts, emojis, etc.
  const cleanDescription = (text: string): string => {
    let cleaned = text
      // Remove markdown bold/italic markers
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      // Remove checkmark and other common emojis
      .replace(/[\u2705\u2714\u2716\u274C\u274E\u2611\u2612\u2610]/g, '')
      // Remove other emojis
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      // Remove leading colons or dashes
      .replace(/^[\s:.\-\u2022]+/, '')
      // Collapse multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned;
  };

  // Detect options in the message (patterns like "Option A", "Option B", etc.)
  const detectOptions = (text: string): DetectedOption[] => {
    const rawOptions: DetectedOption[] = [];

    // Pattern 1: "Option A" followed by bullet point description
    const optionPattern = /"?Option\s+([A-Z0-9])"?\s*[-:]?\s*\n?\s*[\u2022\-*]?\s*([^"\n]+?)(?:"|$|\n(?=OR|"Option|$))/gi;

    // Pattern 2: Simpler pattern - "Option A - description" or "Option A: description"
    const simplePattern = /Option\s+([A-Z0-9])\s*[-:]\s*([^\n]+)/gi;

    // Pattern 3: Quoted option with bullet
    const quotedPattern = /"Option\s+([A-Z0-9])\s*\n?\s*[\u2022\-*]\s*([^"]+)"/gi;

    let match;

    // Try quoted pattern first (most specific)
    while ((match = quotedPattern.exec(text)) !== null) {
      const originalLabel = match[1];
      const description = cleanDescription(match[2]);
      if (description.length > 5 && !rawOptions.some(o => o.description === description)) {
        rawOptions.push({
          label: originalLabel,
          description: description.length > 100 ? description.substring(0, 100) + '...' : description,
          fullText: `Option ${originalLabel}: ${description}`
        });
      }
    }

    // If no quoted options found, try simpler patterns
    if (rawOptions.length === 0) {
      while ((match = simplePattern.exec(text)) !== null) {
        const originalLabel = match[1];
        const description = cleanDescription(match[2]);
        if (description.length > 5 && !rawOptions.some(o => o.description === description)) {
          rawOptions.push({
            label: originalLabel,
            description: description.length > 100 ? description.substring(0, 100) + '...' : description,
            fullText: `Option ${originalLabel}: ${description}`
          });
        }
      }
    }

    // Also check for numbered options like "1.", "2.", "3." with specific keywords
    if (rawOptions.length === 0) {
      const numberedPattern = /(?:^|\n)\s*(\d+)\.\s*\*?\*?([^:\n*]+)\*?\*?\s*[-:]?\s*([^\n]+)?/gm;
      while ((match = numberedPattern.exec(text)) !== null) {
        const titleText = cleanDescription(match[2]);
        const descText = cleanDescription(match[3] || '');
        // Only include if it looks like a choice (has action words)
        if (/proceed|include|choose|select|use|focus|prioritize|go with|configure|restructure/i.test(titleText + ' ' + descText)) {
          const description = titleText + (descText ? ': ' + descText : '');
          if (description.length > 5 && !rawOptions.some(o => o.description === description)) {
            rawOptions.push({
              label: match[1],
              description: description.length > 100 ? description.substring(0, 100) + '...' : description,
              fullText: description
            });
          }
        }
      }
    }

    // Renumber options sequentially (Option 1, Option 2, Option 3...)
    return rawOptions.map((opt, idx) => ({
      ...opt,
      label: `Option ${idx + 1}`
    }));
  };

  // Memoize option detection to prevent expensive regex operations on every render
  const detectedOptions = useMemo(() => detectOptions(content), [content]);

  // Remove emojis from text
  const removeEmojis = (text: string): string => {
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '');
  };

  // Normalize content: insert line breaks before markdown patterns that appear inline
  const normalizeContent = (text: string): string => {
    let normalized = text;
    normalized = normalized.replace(/\s+--\s+/g, '\n---\n');
    normalized = normalized.replace(/\s+(###\s+)/g, '\n$1');
    normalized = normalized.replace(/\s+(##\s+)/g, '\n$1');
    normalized = normalized.replace(/\s+(#\s+)(?!#)/g, '\n$1');
    normalized = normalized.replace(/\s+(-\s+[A-Z])/g, '\n$1');
    normalized = normalized.replace(/\n{3,}/g, '\n\n');
    return normalized.trim();
  };

  // Memoize content cleaning
  const cleanContent = useMemo(() => normalizeContent(removeEmojis(content)), [content]);

  // Strip orphan markdown characters
  const stripOrphanMarkdown = (text: string): string => {
    let cleaned = text;
    cleaned = cleaned.replace(/\):\s*\*\*/g, '): ');
    cleaned = cleaned.replace(/:\s*\*\*\s+/g, ': ');
    cleaned = cleaned.replace(/\*\*\s*([^*]+):\s*/g, '$1: ');
    cleaned = cleaned.replace(/^\*\*\s*/gm, '');
    cleaned = cleaned.replace(/\s*\*\*$/gm, '');
    cleaned = cleaned.replace(/\*\*\s*$/g, '');
    cleaned = cleaned.replace(/^\s*\*\*/g, '');
    cleaned = cleaned.replace(/\)\*\*/g, ')');
    cleaned = cleaned.replace(/\*\*([^*\n]{1,50})(?!\*\*)/g, (match, p1) => {
      if (!p1.includes('**')) return p1;
      return match;
    });
    cleaned = cleaned.replace(/^\*\s+/gm, '\u2022 ');
    cleaned = cleaned.replace(/\s+\*$/gm, '');
    cleaned = cleaned.replace(/^_\s*/gm, '');
    cleaned = cleaned.replace(/\s*_$/gm, '');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    return cleaned.trim();
  };

  // Parse inline markdown (bold text)
  const parseInlineMarkdown = (text: string, keyPrefix: string): (string | React.ReactElement)[] => {
    const result: (string | React.ReactElement)[] = [];
    let remaining = stripOrphanMarkdown(text);
    let keyIdx = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          result.push(remaining.substring(0, boldMatch.index));
        }
        result.push(
          <strong key={`${keyPrefix}-bold-${keyIdx}`} className="font-semibold">
            {boldMatch[1]}
          </strong>
        );
        keyIdx++;
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
      } else {
        result.push(remaining);
        break;
      }
    }

    return result;
  };

  // Memoize element parsing
  const elements = useMemo(() => {
    const lines = cleanContent.split('\n');
    const parsedElements: React.ReactElement[] = [];
    let currentListItems: string[] = [];
    let elementIndex = 0;

    const flushList = () => {
      if (currentListItems.length > 0) {
        parsedElements.push(
          <ul key={`list-${elementIndex}`} className="my-2 pl-5 list-disc">
            {currentListItems.map((item, idx) => (
              <li
                key={idx}
                className="font-[Manrope] text-base font-normal leading-7 text-black mb-1"
              >
                {parseInlineMarkdown(item, `li-${elementIndex}-${idx}`)}
              </li>
            ))}
          </ul>
        );
        elementIndex++;
        currentListItems = [];
      }
    };

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Skip empty lines but flush any pending list
      if (!trimmedLine) {
        flushList();
        return;
      }

      // Handle headings ## or ###
      const headingMatch = trimmedLine.match(/^(#{1,3})\s*(.+)$/);
      if (headingMatch) {
        flushList();
        const level = headingMatch[1].length;
        const headingText = headingMatch[2].replace(/\*\*/g, '');
        const sizeClass = level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-base';
        parsedElements.push(
          <h3
            key={`heading-${elementIndex}`}
            className={`font-[Manrope] ${sizeClass} font-semibold leading-relaxed text-gray-800 mt-4 mb-2`}
          >
            {parseInlineMarkdown(headingText, `h-${elementIndex}`)}
          </h3>
        );
        elementIndex++;
        return;
      }

      // Handle list items (- or *)
      const listMatch = trimmedLine.match(/^[-*]\s+(.+)$/);
      if (listMatch) {
        currentListItems.push(listMatch[1]);
        return;
      }

      // Handle horizontal rule --
      if (trimmedLine === '--' || trimmedLine === '---') {
        flushList();
        parsedElements.push(
          <hr key={`hr-${elementIndex}`} className="border-none border-t border-gray-200 my-3" />
        );
        elementIndex++;
        return;
      }

      // Regular paragraph
      flushList();
      const isQuestion = trimmedLine.endsWith('?');
      parsedElements.push(
        <p
          key={`p-${elementIndex}`}
          className={`font-[Manrope] text-base leading-7 text-black mb-2 ${isQuestion ? 'font-medium' : 'font-normal'}`}
        >
          {parseInlineMarkdown(trimmedLine, `p-${elementIndex}`)}
        </p>
      );
      elementIndex++;
    });

    // Flush any remaining list items
    flushList();

    return parsedElements;
  }, [cleanContent]);

  return (
    <div className="flex flex-col gap-1">
      {elements}

      {/* Option Buttons - only rendered when multiple choices are detected (2+) */}
      {detectedOptions.length >= 2 && onOptionClick && (
        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-200">
          <span className="font-[Figtree] text-xs font-medium text-gray-400 uppercase tracking-wide">
            Select an option
          </span>
          <div className="flex flex-wrap gap-2">
            {detectedOptions.map((option, idx) => {
              const isSelected = selectedOptionIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedOptionIndex(idx)}
                  className={`flex flex-col items-start gap-1 p-3 px-4 border-2 rounded-xl cursor-pointer text-left transition-all duration-200 max-w-[280px] relative
                    ${isSelected
                      ? 'bg-blue-50 border-[#3B6FD4] shadow-md'
                      : 'bg-white border-gray-200 hover:border-[#3B6FD4] hover:bg-blue-50/50 hover:-translate-y-px hover:shadow-md'
                    }
                    active:translate-y-0`}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-[#3B6FD4] rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <span className={`font-[Figtree] text-sm font-semibold ${isSelected ? 'text-[#3B6FD4]' : 'text-gray-700'}`}>
                    {option.label}
                  </span>
                  <span className={`font-[Figtree] text-[13px] font-normal text-gray-700 leading-snug ${isSelected ? 'pr-6' : ''}`}>
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <div className="flex justify-end mt-1">
            <button
              onClick={() => {
                if (selectedOptionIndex !== null) {
                  onOptionClick(detectedOptions[selectedOptionIndex].fullText);
                  setSelectedOptionIndex(null); // Reset after submitting
                }
              }}
              disabled={selectedOptionIndex === null}
              className={`flex items-center gap-2 py-3 px-6 border-none rounded-lg font-[Figtree] text-sm font-semibold transition-all duration-200
                ${selectedOptionIndex !== null
                  ? 'bg-gradient-to-br from-[#3B6FD4] to-[#1957DB] text-white cursor-pointer hover:-translate-y-px hover:shadow-lg active:translate-y-0'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              Next
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormattedAssistantMessage;
