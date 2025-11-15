import { useHideEdgesReducer } from '@/hooks/useHideEdgesReducer';
import { useHideNodesReducer } from '@/hooks/useHideNodesReducer';
import { useRdfsLabelReducer } from '@/hooks/useRdfsLabelReducer';
import { useShortenIriReducer } from '@/hooks/useShortenIriReducer';
import type { OmitNever } from '@/util/types';
import { createEdgeCurveProgram } from '@sigma/edge-curve';
import { NodeSquareProgram } from '@sigma/node-square';
import { useMemo } from 'react';
import { DEFAULT_NODE_PROGRAM_CLASSES, Settings, Settings as SigmaSettings } from 'sigma/settings';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createTransformationsStack, TransformationsStackSlice } from './transformationsStack.slice';
import { createEdgeArrowProgram } from 'sigma/rendering';

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
    toggleAutoZoomOnTransformation: VoidFunction;
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
            useRdfsLabelAsNodeLabel: false,

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

export const CAMERA_MIN_RATIO = 0.1;
export const CAMERA_MAX_RATIO = 1;

export function useSigmaSettings(): Partial<SigmaSettings> {
    const sigmaSettings = useGraphSettings((store) => store.sigmaSettings);
    const hideEdgesReducer = useHideEdgesReducer();
    const hideNodesReducer = useHideNodesReducer();
    const rdfsLabelReducer = useRdfsLabelReducer();
    const shortenIriReducer = useShortenIriReducer();

    const [shouldZoom] = useShouldZoomWhileTransforming();

    return useMemo(() => {
        let nodeReducer: Settings['nodeReducer'] = null;
        if (hideNodesReducer || rdfsLabelReducer) {
            nodeReducer = (node, data) => {
                if (hideNodesReducer) {
                    data = hideNodesReducer(node, data);
                }

                if (rdfsLabelReducer) {
                    data = rdfsLabelReducer(node, data);
                }

                return data;
            };
        }

        let edgeReducer: Settings['edgeReducer'] = null;
        if (hideEdgesReducer || shortenIriReducer) {
            edgeReducer = (edge, data) => {
                if (hideEdgesReducer) {
                    data = hideEdgesReducer(edge, data);
                }

                if (shortenIriReducer) {
                    data = shortenIriReducer(edge, data);
                }

                return data;
            };
        }

        const GRAY = '#404040';
        const ARROW_SIZE_RATIO = 7;

        return {
            ...sigmaSettings,
            enableCameraPanning: true,
            enableCameraRotation: false,
            enableCameraZooming: true,
            defaultEdgeColor: GRAY,
            edgeLabelColor: { color: GRAY },
            doubleClickTimeout: shouldZoom ? 0 : 200,
            maxCameraRatio: CAMERA_MAX_RATIO,
            minCameraRatio: CAMERA_MIN_RATIO,

            allowInvalidContainer: true,
            nodeProgramClasses: {
                ...DEFAULT_NODE_PROGRAM_CLASSES,
                square: NodeSquareProgram,
            },
            edgeProgramClasses: {
                arrow: createEdgeArrowProgram({
                    lengthToThicknessRatio: ARROW_SIZE_RATIO,
                    widenessToThicknessRatio: ARROW_SIZE_RATIO,
                }),
                curved: createEdgeCurveProgram({
                    arrowHead: {
                        extremity: 'target',
                        lengthToThicknessRatio: ARROW_SIZE_RATIO,
                        widenessToThicknessRatio: ARROW_SIZE_RATIO,
                    },
                }),
            },
            edgeReducer,
            nodeReducer,
        } satisfies Partial<SigmaSettings>;
    }, [hideNodesReducer, rdfsLabelReducer, hideEdgesReducer, shortenIriReducer, sigmaSettings, shouldZoom]);
}
