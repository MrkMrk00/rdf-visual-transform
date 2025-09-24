import type { OmitNever } from '@/util/types';
import type { Settings as SigmaSettings } from 'sigma/settings';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PositioningFunction = 'inverse-centroid-heuristic' | 'spring-electric';

export type GraphSettingsStore = {
    graph: { url: string } | { data: string; name: string } | null;
    graphUrlHistory: string[];
    sigmaSettings: Partial<SigmaSettings>;
    positioningFunction: PositioningFunction;

    loadGraphFromUrl: (url: string) => void;
    updateSigmaSettings: (updated: Partial<SigmaSettings>) => void;
    toggleSetting: <TKey extends keyof BoolSetting>(key: TKey, defaultVal?: boolean) => void;
    setPositioningFunction: (value: PositioningFunction) => void;
};

type BoolSetting = OmitNever<{
    [TKey in keyof SigmaSettings]: SigmaSettings[TKey] extends boolean ? TKey : never;
}>;

const HISTORY_MAX_SIZE = 20;

export const useGraphSettings = create<GraphSettingsStore>()(
    persist(
        (set) => ({
            graph: {
                url: 'https://data.cityofnewyork.us/api/views/5ery-qagt/rows.rdf',
            },
            graphUrlHistory: ['https://data.cityofnewyork.us/api/views/5ery-qagt/rows.rdf'],
            sigmaSettings: {},
            positioningFunction: 'inverse-centroid-heuristic',

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
            setPositioningFunction: (positioningFunction) => set({ positioningFunction }),
        }),
        {
            name: 'graph-settings',
        },
    ),
);
