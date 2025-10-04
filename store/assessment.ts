'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AssessmentSpec, AnswerMap, AssessmentResults } from '@/types/assessment';
import { computeDimensionScores, computeOverallScore, calculateProgress, validateAnswers } from '@/lib/scoring';
import { classify } from '@/lib/maturity';
import { save, load, StorageKeys } from '@/lib/persistence';
import { SurveySession, SessionStorage, completeSurvey } from '@/lib/survey-api';

interface AssessmentState {
  // Core state
  spec: AssessmentSpec | null;
  answers: AnswerMap;
  currentQuestionIndex: number;
  isCompleted: boolean;
  
  // Survey session state
  surveySession: SurveySession | null;
  isSavingResults: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSpec: (spec: AssessmentSpec) => void;
  setAnswer: (questionId: string, answer: AnswerMap[string]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (questionId: string) => void;
  reset: () => void;
  resetAnswers: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Survey session management
  setSurveySession: (session: SurveySession | null) => void;
  saveResults: () => Promise<boolean>;
  clearSession: () => void;
  
  // Computed state getters
  getProgress: () => number;
  getValidationErrors: () => string[];
  getCurrentQuestion: () => AssessmentSpec['questions'][0] | null;
  getResults: () => AssessmentResults | null;
}

export const useAssessmentStore = create<AssessmentState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    spec: null,
    answers: {},
    currentQuestionIndex: 0,
    isCompleted: false,
    surveySession: null,
    isSavingResults: false,
    isLoading: false,
    error: null,

    // Actions
    setSpec: (spec) => {
      set({ spec, currentQuestionIndex: 0, isCompleted: false, error: null });
    },

    setAnswer: (questionId, answer) => {
      const { answers, spec } = get();
      const newAnswers = { ...answers, [questionId]: answer };
      
      set({ 
        answers: newAnswers,
        error: null 
      });

      // Auto-save answers to localStorage
      save(StorageKeys.ASSESSMENT_ANSWERS, newAnswers);

      // Check if assessment is completed
      if (spec) {
        const validationErrors = validateAnswers(spec, newAnswers);
        const isCompleted = validationErrors.length === 0;
        if (isCompleted !== get().isCompleted) {
          set({ isCompleted });
        }
      }
    },

    setCurrentQuestionIndex: (index) => {
      const { spec } = get();
      if (spec && index >= 0 && index < spec.questions.length) {
        set({ currentQuestionIndex: index });
      }
    },

    nextQuestion: () => {
      const { currentQuestionIndex, spec } = get();
      if (spec && currentQuestionIndex < spec.questions.length - 1) {
        set({ currentQuestionIndex: currentQuestionIndex + 1 });
      }
    },

    previousQuestion: () => {
      const { currentQuestionIndex } = get();
      if (currentQuestionIndex > 0) {
        set({ currentQuestionIndex: currentQuestionIndex - 1 });
      }
    },

    goToQuestion: (questionId) => {
      const { spec } = get();
      if (spec) {
        const index = spec.questions.findIndex(q => q.id === questionId);
        if (index !== -1) {
          set({ currentQuestionIndex: index });
        }
      }
    },

    reset: () => {
      set({
        spec: null,
        answers: {},
        currentQuestionIndex: 0,
        isCompleted: false,
        isLoading: false,
        error: null,
      });
      // Clear saved answers
      save(StorageKeys.ASSESSMENT_ANSWERS, {});
    },

    resetAnswers: () => {
      set({
        answers: {},
        currentQuestionIndex: 0,
        isCompleted: false,
        error: null,
      });
      // Clear saved answers
      save(StorageKeys.ASSESSMENT_ANSWERS, {});
    },

    setLoading: (loading) => set({ isLoading: loading }),
    
    setError: (error) => set({ error }),

    // Survey session management
    setSurveySession: (session) => {
      set({ surveySession: session });
      if (session) {
        SessionStorage.save(session);
      } else {
        SessionStorage.clear();
      }
    },

    saveResults: async () => {
      const { surveySession, answers, getResults } = get();
      
      if (!surveySession || !surveySession.surveyId) {
        set({ error: 'No active survey session' });
        return false;
      }

      const results = getResults();
      if (!results) {
        set({ error: 'No results to save' });
        return false;
      }

      set({ isSavingResults: true, error: null });
      
      try {
        const success = await completeSurvey(
          surveySession.surveyId,
          answers,
          results,
          surveySession.retrievalToken
        );

        if (success) {
          set({ isSavingResults: false });
          return true;
        } else {
          set({ error: 'Failed to save survey results', isSavingResults: false });
          return false;
        }
      } catch (error) {
        console.error('Error saving results:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to save results',
          isSavingResults: false 
        });
        return false;
      }
    },

    clearSession: () => {
      SessionStorage.clear();
      set({ surveySession: null });
    },

    // Computed getters
    getProgress: () => {
      const { spec, answers } = get();
      return spec ? calculateProgress(spec, answers) : 0;
    },

    getValidationErrors: () => {
      const { spec, answers } = get();
      return spec ? validateAnswers(spec, answers) : [];
    },

    getCurrentQuestion: () => {
      const { spec, currentQuestionIndex } = get();
      return spec?.questions[currentQuestionIndex] || null;
    },

    getResults: () => {
      const { spec, answers } = get();
      if (!spec) return null;

      const dimensionScores = computeDimensionScores(spec, answers);
      const overall = computeOverallScore(dimensionScores);
      const classification = classify(overall);

      return {
        dimensions: dimensionScores,
        overall,
        classification,
      };
    },
  }))
);

// Simplified hooks that avoid expensive computations
export function useAssessmentResults(): AssessmentResults | null {
  return useAssessmentStore((state) => state.getResults());
}

// Initialize store with saved data on client-side
if (typeof window !== 'undefined') {
  // Restore saved answers
  const savedAnswers = load<AnswerMap>(StorageKeys.ASSESSMENT_ANSWERS);
  if (savedAnswers) {
    useAssessmentStore.getState().answers = savedAnswers;
  }

  // Restore survey session
  const savedSession = SessionStorage.load();
  if (savedSession) {
    useAssessmentStore.getState().surveySession = savedSession;
  }

  // Subscribe to answers changes to auto-save
  useAssessmentStore.subscribe(
    (state) => state.answers,
    (answers) => {
      save(StorageKeys.ASSESSMENT_ANSWERS, answers);
    }
  );
}
