import { useHideEdgesReducer } from '@/hooks/useHideEdgesReducer';
import { useHideNodesReducer } from '@/hooks/useHideNodesReducer';
import type { OmitNever } from '@/util/types';
import { EdgeCurvedArrowProgram } from '@sigma/edge-curve';
import { NodeSquareProgram } from '@sigma/node-square';
import { useMemo } from 'react';
import { DEFAULT_NODE_PROGRAM_CLASSES, Settings as SigmaSettings } from 'sigma/settings';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createTransformationsStack, TransformationsStackSlice } from './transformationsStack.slice';

export type PositioningFunction = 'inverse-centroid-heuristic' | 'spring-electric';

export type GraphSettingsStore = {
    graph: { url: string } | { data: string; name: string } | null;
    graphUrlHistory: string[];
    sigmaSettings: Partial<SigmaSettings>;
    positioningFunction: PositioningFunction;
    hiddenPredicates: string[];
    autoZoomOnTransformation: boolean;

    loadGraphFromUrl: (url: string) => void;
    updateSigmaSettings: (updated: Partial<SigmaSettings>) => void;
    toggleSetting: <TKey extends keyof BoolSetting>(key: TKey, defaultVal?: boolean) => void;
    setPositioningFunction: (value: PositioningFunction) => void;
    setHiddenPredicates: (valueOrPatchFunc: string[] | ((prev: string[]) => string[])) => void;
    toggleAutoZoomOnTransformation: () => void;
};

type BoolSetting = OmitNever<{
    [TKey in keyof SigmaSettings]: SigmaSettings[TKey] extends boolean ? TKey : never;
}>;

const HISTORY_MAX_SIZE = 20;

function excludeKeysFromPersistence<TState extends object>(...filterKeys: (keyof TState)[]) {
    return (state: TState) =>
        Object.fromEntries(Object.entries(state).filter(([key]) => !filterKeys.includes(key as keyof TState)));
}

export const useGraphSettings = create<GraphSettingsStore & TransformationsStackSlice>()(
    persist(
        (set, ...rest) => ({
            ...createTransformationsStack(set, ...rest),

            graph: {
                url: 'https://data.cityofnewyork.us/api/views/5ery-qagt/rows.rdf',
            },
            graphUrlHistory: ['https://data.cityofnewyork.us/api/views/5ery-qagt/rows.rdf'],
            sigmaSettings: {},
            positioningFunction: 'inverse-centroid-heuristic',
            hiddenPredicates: [],
            autoZoomOnTransformation: true,

            loadGraphFromUrl: (url) => {
                set((prev) => {
                    return {
                        graph: { url },
                        graphUrlHistory: Array.from(new Set([url, ...prev.graphUrlHistory])).slice(0, HISTORY_MAX_SIZE),

                        // clear the stack of performed transformations
                        transformationsStack: [],
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
            setHiddenPredicates: (valueOrPatchFunc) => {
                if (typeof valueOrPatchFunc === 'function') {
                    set((prev) => {
                        return {
                            hiddenPredicates: valueOrPatchFunc(prev.hiddenPredicates),
                        };
                    });

                    return;
                }

                set({
                    hiddenPredicates: valueOrPatchFunc,
                });
            },
            toggleAutoZoomOnTransformation: () => {
                set((prev) => ({ autoZoomOnTransformation: !prev.autoZoomOnTransformation }));
            },
        }),
        {
            name: 'graph-settings',
            partialize: excludeKeysFromPersistence('transformationsStack'),
        },
    ),
);

export function useShouldZoomWhileTransforming() {
    const setAutoZoom = useGraphSettings((store) => store.toggleAutoZoomOnTransformation);
    const shouldZoom = useGraphSettings((store) => store.autoZoomOnTransformation);

    return useMemo(() => [shouldZoom, setAutoZoom] as const, [shouldZoom, setAutoZoom]);
}

export function useSigmaSettings(): Partial<SigmaSettings> {
    const sigmaSettings = useGraphSettings((store) => store.sigmaSettings);
    const edgeReducer = useHideEdgesReducer();
    const nodeReducer = useHideNodesReducer();

    return useMemo(() => {
        return {
            ...sigmaSettings,
            enableCameraPanning: true,
            enableCameraRotation: false,
            enableCameraZooming: true,

            allowInvalidContainer: true,
            nodeProgramClasses: {
                ...DEFAULT_NODE_PROGRAM_CLASSES,
                square: NodeSquareProgram,
            },
            edgeProgramClasses: {
                curved: EdgeCurvedArrowProgram,
            },
            edgeReducer,
            nodeReducer,
        };
    }, [sigmaSettings, edgeReducer, nodeReducer]);
}
