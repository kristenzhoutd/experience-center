import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  options?: string[];
  multiSelect?: boolean;
  stepKey?: string;
}

export interface OutputSection {
  title: string;
  content: string;
}

interface MarketingLabState {
  industry: string;
  useCase: string;
  objective: string;
  audience: string;
  channels: string[];
  currentStep: number;
  chatMessages: ChatMessage[];
  outputs: OutputSection[];

  setIndustry: (industry: string) => void;
  setUseCase: (useCase: string) => void;
  setObjective: (objective: string) => void;
  setAudience: (audience: string) => void;
  setChannels: (channels: string[]) => void;
  advanceStep: () => void;
  addChatMessage: (message: ChatMessage) => void;
  setOutputs: (outputs: OutputSection[]) => void;
  resetSession: () => void;
}

export const useMarketingLabStore = create<MarketingLabState>((set) => ({
  industry: '',
  useCase: '',
  objective: '',
  audience: '',
  channels: [],
  currentStep: 0,
  chatMessages: [],
  outputs: [],

  setIndustry: (industry) => set({ industry }),
  setUseCase: (useCase) => set({ useCase }),
  setObjective: (objective) => set({ objective }),
  setAudience: (audience) => set({ audience }),
  setChannels: (channels) => set({ channels }),
  advanceStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  setOutputs: (outputs) => set({ outputs }),
  resetSession: () => set({
    industry: '',
    useCase: '',
    objective: '',
    audience: '',
    channels: [],
    currentStep: 0,
    chatMessages: [],
    outputs: [],
  }),
}));
