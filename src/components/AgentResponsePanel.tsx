import ReactMarkdown from 'react-markdown';
import { useMemo } from 'react';

interface AgentResponsePanelProps {
  content: string;
  onCreateCampaign?: () => void;
}

// Split content into sections based on ## headers
function splitIntoSections(content: string): { title: string; content: string }[] {
  const lines = content.split('\n');
  const sections: { title: string; content: string }[] = [];
  let currentSection: { title: string; content: string } | null = null;
  let introContent: string[] = [];

  for (const line of lines) {
    // Check for h2 headers (##)
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }
      // Start new section
      currentSection = { title: h2Match[1], content: '' };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    } else {
      // Content before first h2 header
      introContent.push(line);
    }
  }

  // Add last section
  if (currentSection) {
    sections.push(currentSection);
  }

  // Add intro content as first section if it has meaningful content
  const introText = introContent.join('\n').trim();
  if (introText && introText.length > 10) {
    sections.unshift({ title: 'Overview', content: introText });
  }

  // If no sections found, create a single section with all content
  if (sections.length === 0) {
    sections.push({ title: 'Campaign Strategy', content: content });
  }

  return sections;
}

const markdownComponents = {
  // Headings (h3 and h4 since h2 is used for section titles)
  h1: ({ children }: any) => (
    <h1 className="text-xl font-medium text-gray-900 mb-4">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-lg font-medium text-gray-900 mt-4 mb-3">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">{children}</h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="text-sm font-medium text-gray-700 mt-3 mb-2">{children}</h4>
  ),
  // Paragraphs
  p: ({ children }: any) => (
    <p className="text-sm text-gray-600 leading-relaxed mb-3">{children}</p>
  ),
  // Lists
  ul: ({ children }: any) => (
    <ul className="list-disc list-outside ml-4 space-y-1.5 mb-4 text-gray-600">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-outside ml-4 space-y-1.5 mb-4 text-gray-600">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="text-sm text-gray-600 pl-1">{children}</li>
  ),
  // Strong/Bold
  strong: ({ children }: any) => (
    <strong className="font-medium text-gray-900">{children}</strong>
  ),
  // Emphasis/Italic
  em: ({ children }: any) => (
    <em className="italic text-gray-700">{children}</em>
  ),
  // Code blocks
  code: ({ className, children }: any) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className="block p-3 bg-gray-50 rounded-lg text-xs font-mono text-gray-700 overflow-x-auto">
        {children}
      </code>
    );
  },
  pre: ({ children }: any) => <pre className="mb-4">{children}</pre>,
  // Blockquotes
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-amber-400 pl-4 py-2 my-4 bg-amber-50/50 rounded-r-lg">
      {children}
    </blockquote>
  ),
  // Horizontal rule
  hr: () => <hr className="my-6 border-gray-200" />,
  // Links
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-blue-600 hover:underline inline-flex items-center gap-1"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  ),
};

export default function AgentResponsePanel({ content, onCreateCampaign }: AgentResponsePanelProps) {
  const sections = useMemo(() => splitIntoSections(content), [content]);

  return (
    <div className="h-full overflow-auto bg-[#fafbfc]">
      <div className="py-6 px-8 space-y-4">
        {/* Render each section as a card */}
        {sections.map((section, index) => (
          <section key={index} className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
              {section.title}
            </h2>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown components={markdownComponents}>
                {section.content}
              </ReactMarkdown>
            </div>
          </section>
        ))}

        {/* Action Footer */}
        {onCreateCampaign && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Would you like to proceed with this strategy?</p>
            <button
              onClick={onCreateCampaign}
              className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Create Campaign
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
