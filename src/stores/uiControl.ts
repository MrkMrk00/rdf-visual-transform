import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiControlStore = {
    showSparqlConsole: boolean;
    toggleSparqlConsole: () => void;
};

export const useUiControlStore = create<UiControlStore>()(
    persist(
        (set) => ({
            showSparqlConsole: false,

            toggleSparqlConsole: () => set((state) => ({ showSparqlConsole: !state.showSparqlConsole })),
        }),
        {
            name: "ui-control",
        },
    ),
);
