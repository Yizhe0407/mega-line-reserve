import { create } from 'zustand'
import type { Service } from '@/types/service';

interface Step1Data {
  pictureUrl?: string;
  name?: string;
  phone?: string;
  license?: string;
}

interface Step2Data {
  selectServe: number[];
  otherService: string;
  extra: boolean;
  isOtherServiceSelected: boolean;
}

interface Step3Data {
  date: string;
  time: string;
}

interface StepStore {
  currentStep: number;
  step1Data: Step1Data;
  step2Data: Step2Data;
  step3Data: Step3Data;
  userId: number | null;
  lineId: string;
  isLoading: boolean;
  services: Service[];
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep1Data: (data: Partial<Step1Data>) => void;
  setStep2Data: (data: Partial<Step2Data>) => void;
  setStep3Data: (data: Partial<Step3Data>) => void;
  setServices: (services: Service[]) => void;
  setUserId: (userId: number | null) => void;
  setLineId: (lineId: string) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useStepStore = create<StepStore>((set, get) => ({
  currentStep: 1,
  step1Data: {},
  step2Data: { selectServe: [], otherService: '', extra: false, isOtherServiceSelected: false },
  step3Data: { date: '', time: '' },
  userId: null,
  lineId: '',
  isLoading: false,
  services: [],


  setCurrentStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep } = get()
    if (currentStep < 4) set({ currentStep: currentStep + 1 })
  },

  prevStep: () => {
    const { currentStep } = get()
    if (currentStep > 1) set({ currentStep: currentStep - 1 })
  },

  setStep1Data: (data) =>
    set({ step1Data: { ...get().step1Data, ...data } }),

  setStep2Data: (data) =>
    set({ step2Data: { ...get().step2Data, ...data } }),

  setStep3Data: (data) =>
    set({ step3Data: { ...get().step3Data, ...data } }),

  setServices: (services) => set({ services }),

  setUserId: (userId) => set({ userId }),

  setLineId: (lineId) => set({ lineId }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  reset: () =>
    set({
      currentStep: 1,
      step2Data: { selectServe: [], otherService: '', extra: false, isOtherServiceSelected: false },
      step3Data: { date: '', time: '' }
    }),
}))
