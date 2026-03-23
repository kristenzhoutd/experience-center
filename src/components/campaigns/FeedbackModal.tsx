import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMOJI_OPTIONS = [
  { emoji: '😣', label: 'Terrible' },
  { emoji: '😞', label: 'Bad' },
  { emoji: '🙂', label: 'Okay' },
  { emoji: '😀', label: 'Good' },
  { emoji: '😍', label: 'Great' },
];

const CATEGORY_OPTIONS = [
  'Recommendation Quality',
  'Data Accuracy',
  'Response Speed',
  'Ease of Use',
  'Campaign Insights',
];

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: selectedEmoji, categories: selectedCategories, comment: otherText }),
      });
    } catch (err) {
      console.error('[Feedback] Submit error:', err);
    }
    setIsSubmitting(false);
    setIsSubmitted(true);
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  const handleClose = () => {
    setSelectedEmoji(null);
    setSelectedCategories([]);
    setOtherText('');
    setIsSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2
            className="text-lg font-semibold text-[#4a7ec2]"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Feedback
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="px-6 pb-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-sm text-gray-600">Thank you for your feedback!</p>
          </div>
        ) : (
          <div className="px-6 pb-6">
            {/* Emoji Rating */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {EMOJI_OPTIONS.map((option, index) => (
                <button
                  key={option.label}
                  onClick={() => setSelectedEmoji(index)}
                  className={`w-12 h-12 flex items-center justify-center rounded-full text-2xl transition-all cursor-pointer border-2 ${
                    selectedEmoji === index
                      ? 'border-[#4a7ec2] bg-blue-50 scale-110'
                      : 'border-transparent bg-gray-100 hover:bg-gray-200 grayscale opacity-70 hover:opacity-100 hover:grayscale-0'
                  }`}
                  title={option.label}
                >
                  {option.emoji}
                </button>
              ))}
            </div>

            {/* Category Selection */}
            <p className="text-sm font-medium text-gray-800 mb-3">Tell us what can be Improved?</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORY_OPTIONS.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                    selectedCategories.includes(category)
                      ? 'bg-[#4a7ec2] text-white border-[#4a7ec2]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Text Area */}
            <textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Other suggestions..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent resize-none mb-5"
            />

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#6a9fd8] hover:bg-[#5a8fc8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer border-none"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
