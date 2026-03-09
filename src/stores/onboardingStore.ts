import { create } from 'zustand';

const STORAGE_KEY = 'ai-suites-pm-onboarding';

export interface OnboardingProfile {
  industry: string;
  role: string;
  goals: string[];
  keyMetrics: string[];
}

interface OnboardingState {
  completed: boolean;
  profile: OnboardingProfile | null;
  currentStep: number;

  setStep: (step: number) => void;
  updateProfile: (partial: Partial<OnboardingProfile>) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

function loadFromStorage(): { completed: boolean; profile: OnboardingProfile | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return { completed: !!data.completed, profile: data.profile || null };
    }
  } catch { /* ignore */ }
  return { completed: false, profile: null };
}

function saveToStorage(completed: boolean, profile: OnboardingProfile | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed, profile }));
  } catch { /* ignore */ }
}

const initial = loadFromStorage();

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  completed: initial.completed,
  profile: initial.profile,
  currentStep: 0,

  setStep: (step) => set({ currentStep: step }),

  updateProfile: (partial) => {
    const current = get().profile || { industry: '', role: '', goals: [], keyMetrics: [] };
    set({ profile: { ...current, ...partial } });
  },

  completeOnboarding: () => {
    const profile = get().profile;
    set({ completed: true, currentStep: 4 });
    saveToStorage(true, profile);
  },

  resetOnboarding: () => {
    set({ completed: false, currentStep: 0 });
    saveToStorage(false, get().profile);
  },
}));
