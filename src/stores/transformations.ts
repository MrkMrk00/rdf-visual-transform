import { Draft, produce } from 'immer';
import { toast } from 'sonner';
import { type ULID, ulid } from 'ulid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TransformationPattern =
    | 'propertyChainShortcut'
    | 'relationshipDereification'
    | 'relationshipReification'
    | 'linkCountingProperty'
    | 'custom';

export type Transformation<TPattern extends TransformationPattern = TransformationPattern> = {
    readonly id: ULID;
    name: string;
    patternName: TPattern;
    priority: number;

    parameters: TPattern extends 'custom' ? never : Record<string, string | number>;
    queries: TPattern extends 'custom' ? Record<string, string> : never;
};

export type TransformationsStore = {
    transformations: Transformation[];

    saveCustomTransformation: (name: string, queries: Record<string, string>, priority?: number) => void;

    saveTransformation: (
        name: string,
        patternName: Exclude<TransformationPattern, 'custom'>,
        parameters: Record<string, string>,
        priority?: number,
    ) => void;

    deleteTransformation: (id: Transformation['id']) => void;
    patchTransformation: (id: ULID, patchFunction: (transformation: Draft<Transformation>) => void) => void;

    exportToJsonFile: () => void;
};

export const LOCAL_STORAGE_NAME = 'transformations';

export const useTransformationsStore = create<TransformationsStore>()(
    persist(
        (set) => ({
            transformations: [],

            deleteTransformation: (id) => {
                set((prev) => ({
                    transformations: prev.transformations.filter((it) => it.id !== id),
                }));
            },

            saveCustomTransformation: (name, queries, priority = 0) => {
                set((previous) => {
                    return {
                        transformations: [
                            ...previous.transformations,
                            {
                                id: ulid(),
                                name,
                                queries,
                                patternName: 'custom',
                                parameters: undefined as never,
                                priority,
                            },
                        ],
                    };
                });
            },

            saveTransformation: (name, patternName, parameters, priority = 0) => {
                set((previous) => {
                    return {
                        transformations: [
                            ...previous.transformations,
                            {
                                id: ulid(),
                                name,
                                patternName,
                                parameters,
                                priority,
                                queries: undefined as never,
                            },
                        ],
                    };
                });
            },

            patchTransformation: (id, patchFunc) => {
                set((previousState) => {
                    return {
                        transformations: produce(previousState.transformations, (draft) => {
                            const toTransform = draft.find((it) => it.id === id);

                            if (!toTransform) {
                                return;
                            }

                            patchFunc(toTransform);
                        }),
                    };
                });
            },

            exportToJsonFile: () => {
                const storeValue = window.localStorage.getItem(LOCAL_STORAGE_NAME);

                if (!storeValue) {
                    toast.error('failed to export transformations - empty store');

                    return;
                }

                const blob = new Blob([storeValue], {
                    type: 'application/json',
                });
                const fileUrl = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = fileUrl;
                a.download = 'transformations.json';

                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            },
        }),
        { name: LOCAL_STORAGE_NAME },
    ),
);
