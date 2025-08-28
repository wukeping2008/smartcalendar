import { create } from 'zustand';
import { PanelType } from '../../types/floating-panel';

export type VoiceCommandIntent = 
  | 'open_panel'
  | 'close_panel'
  | 'find_contact'
  | 'create_event'
  | 'unknown';

export interface VoiceCommand {
  intent: VoiceCommandIntent;
  panelType?: PanelType;
  entities?: Record<string, string | number>;
  timestamp: number; // To differentiate between commands
}

interface VoiceCommandStoreState {
  command: VoiceCommand | null;
  setCommand: (command: Omit<VoiceCommand, 'timestamp'>) => void;
  clearCommand: () => void;
}

export const useVoiceCommandStore = create<VoiceCommandStoreState>((set) => ({
  command: null,
  setCommand: (newCommand) => set({ command: { ...newCommand, timestamp: Date.now() } }),
  clearCommand: () => set({ command: null }),
}));
