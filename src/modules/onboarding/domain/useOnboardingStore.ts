"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnboardingStepId =
  | "welcome"
  | "dashboard"
  | "alert"
  | "sites"
  | "reports"
  | "incidents"
  | "team"
  | "configurator"
  | "landing"
  | "done";

type OnboardingStore = {
  completed: boolean;
  currentStep: OnboardingStepId;
  visitedSteps: OnboardingStepId[];
  _hydrated: boolean;
  setStep: (step: OnboardingStepId) => void;
  markVisited: (step: OnboardingStepId) => void;
  finish: () => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      completed: false,
      currentStep: "welcome",
      visitedSteps: [],
      _hydrated: false,

      setStep: (step) => set({ currentStep: step }),

      markVisited: (step) =>
        set((state) => ({
          visitedSteps: state.visitedSteps.includes(step)
            ? state.visitedSteps
            : [...state.visitedSteps, step],
        })),

      finish: () => set({ completed: true, currentStep: "done" }),

      reset: () =>
        set({ completed: false, currentStep: "welcome", visitedSteps: [] }),
    }),
    {
      name: "fortis-onboarding",
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true;
      },
    }
  )
);
