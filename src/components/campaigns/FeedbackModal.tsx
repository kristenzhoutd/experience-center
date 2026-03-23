import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquare, Check } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RATING_OPTIONS = [
  { value: 1, label: 'Poor', emoji: '😔' },
  { value: 2, label: 'Fair', emoji: '🙁' },
  { value: 3, label: 'Good', emoji: '🙂' },
  { value: 4, label: 'Great', emoji: '😊' },
  { value: 5, label: 'Excellent', emoji: '🤩' },
];

const CATEGORY_OPTIONS = [
  'Recommendation Quality',
  'Data Accuracy',
  'Response Speed',
  'Ease of Use',
  'Campaign Insights',
];

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
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
        body: JSON.stringify({ rating: selectedRating, categories: selectedCategories, comment: otherText }),
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
    setSelectedRating(null);
    setSelectedCategories([]);
    setOtherText('');
    setIsSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Share feedback
              </h2>
              <p className="text-[11px] text-gray-400">Help us improve the experience</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="px-6 pb-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3 mt-2">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm text-gray-600">Thank you for your feedback!</p>
          </div>
        ) : (
          <div className="px-6 pb-6">
            {/* Rating */}
            <div className="mb-5">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">How was your experience?</p>
              <div className="flex items-center gap-1">
                {RATING_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedRating(option.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg cursor-pointer transition-all ${
                      selectedRating === option.value
                        ? 'scale-110'
                        : 'opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                    }`}
                  >
                    <span className={`text-2xl transition-transform ${selectedRating === option.value ? 'scale-110' : ''}`}>{option.emoji}</span>
                    <span className={`text-[10px] font-medium ${selectedRating === option.value ? 'text-gray-900' : 'text-gray-400'}`}>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">What can be improved?</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                      selectedCategories.includes(category)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Area */}
            <div className="mb-5">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Additional comments</p>
              <textarea
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Any other suggestions..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedRating === null}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  selectedRating !== null && !isSubmitting
                    ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit feedback'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
