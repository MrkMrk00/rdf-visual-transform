import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UiControlStore = {
    showSparqlConsole: boolean;
    showTransformationsPanel: boolean;
    showTransformationsStack: boolean;

    devMode: boolean;
    toggleDevMode: () => void;

    toggleSparqlConsole: () => void;
    toggleTransformationsPanel: () => void;
    toggleTransformationsStack: () => void;
};

export const useUiControlStore = create<UiControlStore>()(
    persist(
        (set) => ({
            showSparqlConsole: false,
            showTransformationsPanel: false,
            showTransformationsStack: false,
            devMode: false,

            toggleSparqlConsole: () =>
                set((state) => ({
                    showSparqlConsole: !state.showSparqlConsole,
                })),

            toggleTransformationsPanel: () =>
                set((state) => ({
                    showTransformationsPanel: !state.showTransformationsPanel,
                })),

            toggleTransformationsStack: () =>
                set((state) => ({
                    showTransformationsStack: !state.showTransformationsStack,
                })),

            toggleDevMode: () =>
                set((state) => ({
                    devMode: !state.devMode,
                })),
        }),
        {
            name: 'ui-control',
        },
    ),
);
