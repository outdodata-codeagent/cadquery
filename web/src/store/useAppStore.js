import { create } from 'zustand';

export const useAppStore = create((set) => ({
  lessons: [],
  examples: [],
  currentModel: null,
  selectionResult: null,
  history: [],
  highlightOnly: false,
  setLessons: (lessons) => set({ lessons }),
  setExamples: (examples) => set({ examples }),
  setCurrentModel: (model) => set({ currentModel: model }),
  setSelectionResult: (result) =>
    set((state) => ({
      selectionResult: result,
      history: result
        ? [{ timestamp: Date.now(), result }, ...state.history].slice(0, 10)
        : state.history
    })),
  toggleHighlightOnly: () =>
    set((state) => ({ highlightOnly: !state.highlightOnly }))
}));
