import { create } from "zustand";

type UiControlStore = {
    showSparqlConsole: boolean;
    toggleSparqlConsole: () => void;
};

export const useUiControlStore = create<UiControlStore>()((set) => ({
    showSparqlConsole: false,

    toggleSparqlConsole: () => set((state) => ({ showSparqlConsole: !state.showSparqlConsole })),
}));
