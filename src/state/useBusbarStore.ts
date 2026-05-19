import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {getProfile, getProfileIdForDimensions} from '../domain/calculations';
import type {BusbarInput, BusbarMaterial, BusbarProfile} from '../domain/types';
import {defaultBusbarInput} from './defaults';

type Theme = 'dark' | 'light';

type BusbarStore = {
  input: BusbarInput;
  theme: Theme;
  setInput: (patch: Partial<BusbarInput>) => void;
  setProject: (patch: Partial<BusbarInput['project']>) => void;
  selectProfile: (profile: BusbarProfile, barsPerPhase?: number) => void;
  selectMaterial: (material: BusbarMaterial) => void;
  loadProject: (input: BusbarInput) => void;
  reset: () => void;
  setTheme: (theme: Theme) => void;
};

export const useBusbarStore = create<BusbarStore>()(
  persist(
    (set) => ({
      input: defaultBusbarInput,
      theme: 'dark',
      setInput: (patch) =>
        set((state) => {
          const next = {...state.input, ...patch};
          if (patch.materialId && patch.materialId !== state.input.materialId) {
            const profile = getProfile('', patch.materialId);
            next.profileId = profile.profileId;
            next.width_mm = profile.dimensions.width_mm;
            next.thickness_mm = profile.dimensions.thickness_mm;
          }
          if (patch.width_mm || patch.thickness_mm) {
            next.profileId = getProfileIdForDimensions(next.materialId, next.width_mm, next.thickness_mm);
          }
          return {input: next};
        }),
      setProject: (patch) =>
        set((state) => ({
          input: {
            ...state.input,
            project: {...state.input.project, ...patch},
          },
        })),
      selectProfile: (profile, barsPerPhase) =>
        set((state) => ({
          input: {
            ...state.input,
            materialId: profile.materialId,
            profileId: profile.profileId,
            width_mm: profile.dimensions.width_mm,
            thickness_mm: profile.dimensions.thickness_mm,
            barsPerPhase: barsPerPhase ?? state.input.barsPerPhase,
          },
        })),
      selectMaterial: (material) =>
        set((state) => {
          const profile = getProfile('', material.id);
          return {
            input: {
              ...state.input,
              materialId: material.id,
              profileId: profile.profileId,
              width_mm: profile.dimensions.width_mm,
              thickness_mm: profile.dimensions.thickness_mm,
            },
          };
        }),
      loadProject: (input) => set({input}),
      reset: () => set({input: defaultBusbarInput}),
      setTheme: (theme) => set({theme}),
    }),
    {
      name: 'busbar-calculator-draft',
      partialize: (state) => ({input: state.input, theme: state.theme}),
    },
  ),
);
