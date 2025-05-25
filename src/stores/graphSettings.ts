import type { OmitNever } from "@/util/types";
import type { Settings as SigmaSettings } from "sigma/settings";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type GraphSettingsStore = {
    graph: { url: string } | { data: string; name: string } | null;
    graphUrlHistory: string[];
    sigmaSettings: Partial<SigmaSettings>;

    loadGraphFromUrl: (url: string) => void;
    updateSigmaSettings: (updated: Partial<SigmaSettings>) => void;
    toggleSetting: <TKey extends keyof BoolSetting>(key: TKey, defaultVal?: boolean) => void;
};

type BoolSetting = OmitNever<{
    [TKey in keyof SigmaSettings]: SigmaSettings[TKey] extends boolean ? TKey : never;
}>;

const HISTORY_MAX_SIZE = 20;

export const useGraphStore = create<GraphSettingsStore>()(
    persist(
        (set) => ({
            graph: { url: "https://data.cityofnewyork.us/api/views/5ery-qagt/rows.rdf" },
            graphUrlHistory: ["https://data.cityofnewyork.us/api/views/5ery-qagt/rows.rdf"],
            sigmaSettings: {},

            loadGraphFromUrl: (url) => {
                set((prev) => {
                    return {
                        graph: { url },
                        graphUrlHistory: Array.from(new Set([url, ...prev.graphUrlHistory])).slice(0, HISTORY_MAX_SIZE),
                    };
                });
            },

            updateSigmaSettings: (updated: Partial<SigmaSettings>) => {
                set((prev) => ({
                    ...prev,
                    ...updated,
                }));
            },
            toggleSetting: (setting, defaultVal = true) => {
                set((prev) => ({
                    sigmaSettings: {
                        ...prev.sigmaSettings,
                        [setting]: !(prev.sigmaSettings[setting] ?? !defaultVal),
                    },
                }));
            },
        }),
        {
            name: "graph-settings",
        },
    ),
);
