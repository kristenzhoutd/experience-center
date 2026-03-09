/**
 * CampaignLandingPage -- Hero landing page for the campaign planner.
 * Converted from Emotion CSS to Tailwind. Uses react-router-dom for navigation
 * and useBlueprintStore (Zustand) for saved blueprints.
 *
 * Layout.tsx already provides the sidebar and top nav, so this component
 * renders only the main content area.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProgramStore } from '../../stores/programStore';
// ---- Quick Prompt Data ----

const QUICK_PROMPTS = [
  {
    title: 'Q1 Brand Awareness',
    description: 'Launch a brand awareness campaign targeting new audiences',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  {
    title: 'Product Launch Campaign',
    description: 'Create a full-funnel product launch campaign across channels',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
  {
    title: 'Retargeting Strategy',
    description: 'Build a retargeting campaign for website visitors and cart abandoners',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    title: 'Holiday Season Push',
    description: 'Plan a holiday campaign maximizing conversions on Meta and Google',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
  },
  {
    title: 'Lead Gen for B2B SaaS',
    description: 'Design a B2B SaaS lead gen campaign on LinkedIn and Google',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: 'App Install Campaign',
    description: 'Drive mobile app installs with creatives for TikTok and Meta',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
  },
];

// ---- QuickPromptCards (auto-scroll carousel) ----

function QuickPromptCards({ onSelect }: { onSelect: (prompt: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isPaused) return;

    let animationFrame: number;
    const scrollSpeed = 0.5;

    const step = () => {
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += scrollSpeed;
      }
      animationFrame = requestAnimationFrame(step);
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPaused]);

  return (
    <div
      className="w-full max-w-5xl mt-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
      }}
    >
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollBehavior: 'auto' }}
      >
        {[...QUICK_PROMPTS, ...QUICK_PROMPTS].map((prompt, index) => (
          <button
            key={`${prompt.title}-${index}`}
            onClick={() => onSelect(prompt.description)}
            className="flex-shrink-0 w-80 p-4 rounded-xl text-left text-sm text-gray-700 backdrop-blur-sm bg-white/10 border border-white/60 shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] hover:bg-white/40 hover:shadow-[0_4px_8px_rgba(0,0,0,0.03),0_12px_32px_rgba(0,0,0,0.06)] transition-all"
          >
            {prompt.description}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- CampaignLandingPage ----

export default function CampaignLandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [briefText, setBriefText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pre-populate from search params if present
  useEffect(() => {
    const briefParam = searchParams.get('brief');
    if (briefParam) {
      setBriefText(decodeURIComponent(briefParam));
    }
  }, [searchParams]);

  // Auto-resize textarea
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setBriefText(e.target.value);
      // Auto-resize
      const ta = e.target;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
    },
    []
  );

  // File attachment with PDF text extraction
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFile(file);

    // Auto-extract PDF text via IPC
    if (file.type === 'application/pdf' && window.aiSuites?.pdf) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
        });

        const result = await window.aiSuites.pdf.extract(base64, file.name);
        if (result.success && result.text) {
          console.log(`[PDF] Extracted ${result.text.length} characters from ${file.name}`);
          // Store the extracted text on the file object for later use
          (file as any).extractedText = result.text;
        } else {
          console.warn('[PDF] Failed to extract text:', result.error);
        }
      } catch (err) {
        console.error('[PDF] Extraction error:', err);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit brief
  const handleSubmit = useCallback(() => {
    const text = briefText.trim();
    if (!text && !attachedFile) return;

    // If a file is attached, store the extracted text (or raw base64) in sessionStorage
    if (attachedFile) {
      // Use extracted PDF text if available, otherwise read the file as base64
      const extractedText = (attachedFile as any).extractedText;

      if (extractedText) {
        // Store the extracted PDF text (not raw base64)
        sessionStorage.setItem(
          'pendingFileData',
          JSON.stringify({
            name: attachedFile.name,
            extractedText: extractedText, // Already extracted PDF text
            type: attachedFile.type,
          })
        );
        navigateToChat(text || `Extract a campaign brief from this PDF: ${attachedFile.name}`);
      } else {
        // Fallback: read file as base64 for non-PDF files
        const reader = new FileReader();
        reader.onload = () => {
          sessionStorage.setItem(
            'pendingFileData',
            JSON.stringify({
              name: attachedFile.name,
              base64: (reader.result as string).split(',')[1],
              type: attachedFile.type,
            })
          );
          navigateToChat(text || `Please analyze this file: ${attachedFile.name}`);
        };
        reader.readAsDataURL(attachedFile);
      }
    } else {
      navigateToChat(text);
    }
  }, [briefText, attachedFile]);

  const navigateToChat = (text: string) => {
    // Auto-create a program — name is updated once the AI generates a brief
    const program = useProgramStore.getState().createProgram('New Campaign');

    const params = new URLSearchParams();
    params.set('brief', text);
    if (attachedFile) {
      params.set('fileName', attachedFile.name);
    }
    navigate(`/campaign-chat?${params.toString()}`, { state: { programId: program.id } });
  };

  // Quick prompt selection
  const handleQuickPromptSelect = (promptText: string) => {
    setBriefText(promptText);
    // Focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col items-center justify-center h-full px-6">
        {/* Hero Section */}
        <h1 className="text-4xl font-light text-gray-800 mb-12">
          Make every ad dollar smarter
        </h1>

        {/* Brief Input Area */}
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={briefText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Plan a $250k Black Friday campaign for an apparel brand across Meta, Google, and Email to drive new customer acquisition."
              rows={2}
              className="w-full px-5 py-4 text-gray-700 placeholder-gray-400 resize-none focus:outline-none min-h-[80px] rounded-t-2xl"
            />

            {/* Attached file indicator */}
            {attachedFile && (
              <div className="mx-5 mb-3 flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 w-fit">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="text-blue-400 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Bottom bar with buttons */}
            <div className="flex items-center justify-between px-4 py-3">
              {/* Plus / attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                title="Attach file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Send button - black circle */}
              <button
                onClick={handleSubmit}
                disabled={!briefText.trim() && !attachedFile}
                className="w-9 h-9 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                title="Send"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M3 3l18 9-18 9 3-9-3-9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M6 12h9" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Prompt Cards */}
        <QuickPromptCards onSelect={handleQuickPromptSelect} />
      </div>
    </div>
  );
}
