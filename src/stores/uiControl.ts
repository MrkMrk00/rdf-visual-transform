import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UiControlStore = {
    showSparqlConsole: boolean;
    showTransformationsPanel: boolean;

    toggleSparqlConsole: () => void;
    toggleTransformationsPanel: () => void;
};

export const useUiControlStore = create<UiControlStore>()(
    persist(
        (set) => ({
            showSparqlConsole: false,
            showTransformationsPanel: false,

            toggleSparqlConsole: () =>
                set((state) => ({
                    showSparqlConsole: !state.showSparqlConsole,
                })),

            toggleTransformationsPanel: () =>
                set((state) => ({
                    showTransformationsPanel: !state.showTransformationsPanel,
                })),
        }),
        {
            name: 'ui-control',
        },
    ),
);
