import { ImprovementSuggestion } from '../types';
import { INITIAL_IMPROVEMENTS } from './mockData';
import { API_CONFIG } from './apiConfig';

export const improvementService = {
  /**
   * Fetch AI bullet-point improvement suggestions
   */
  async getSuggestions(): Promise<ImprovementSuggestion[]> {
    if (API_CONFIG.isMockMode) {
      return [...INITIAL_IMPROVEMENTS];
    }
    return INITIAL_IMPROVEMENTS;
  },

  /**
   * Accept a suggestion
   */
  async acceptSuggestion(id: string): Promise<ImprovementSuggestion[]> {
    const list = [...INITIAL_IMPROVEMENTS];
    const item = list.find((i) => i.id === id);
    if (item) {
      item.status = 'accepted';
    }
    return list;
  },

  /**
   * Reject a suggestion
   */
  async rejectSuggestion(id: string): Promise<ImprovementSuggestion[]> {
    const list = [...INITIAL_IMPROVEMENTS];
    const item = list.find((i) => i.id === id);
    if (item) {
      item.status = 'rejected';
    }
    return list;
  },

  /**
   * Save custom edit to suggested content
   */
  async updateCustomSuggestion(id: string, newText: string): Promise<ImprovementSuggestion[]> {
    const list = [...INITIAL_IMPROVEMENTS];
    const item = list.find((i) => i.id === id);
    if (item) {
      item.customText = newText;
      item.isEdited = true;
    }
    return list;
  },
};
