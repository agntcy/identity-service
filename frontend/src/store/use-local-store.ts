import {create, StateCreator} from 'zustand';
import {createJSONStorage, persist, PersistOptions} from 'zustand/middleware';

type LocalStore = {
  onBoarded: boolean;
  setOnBoarded: (onBoarded: boolean) => void;
  cleanThemeStore: () => void;
};

type PersistStore = (config: StateCreator<LocalStore>, options: PersistOptions<LocalStore>) => StateCreator<LocalStore>;

export const useLocalStore = create<LocalStore>(
  (persist as PersistStore)(
    (set): LocalStore => ({
      onBoarded: false,
      setOnBoarded: (onBoarded: boolean) => set(() => ({onBoarded})),
      cleanThemeStore: () => set(() => ({onBoarded: false}))
    }),
    {
      name: 'identity-local-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
