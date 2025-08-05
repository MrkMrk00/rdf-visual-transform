import * as templates from '@/sparql-templates';
import { Draft, produce } from 'immer';
import { type ULID, ulid } from 'ulid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TransformationMeta = { priority: number } & (
    | {
          patternName: keyof typeof templates;
          parameters: Record<string, string>;
      }
    | {
          patternName: 'custom';
      }
);

export type Transformation = {
    readonly id: ULID;
    name: string;
    meta: TransformationMeta;
    queries: Record<string, string>;
};

export type TransformationsStore = {
    transformations: Transformation[];

    saveCustomTransformation: (
        name: string,
        queries: Record<string, string>,
        priority?: number,
    ) => void;

    saveTransformation: (
        name: string,
        patternName: Exclude<Transformation['meta']['patternName'], 'custom'>,
        parameters: Record<string, string>,
        priority?: number,
    ) => void;

    deleteTransformation: (id: Transformation['id']) => void;
    patchTransformation: (
        id: ULID,
        patchFunction: (transformation: Draft<Transformation>) => void,
    ) => void;
};

export const useTransformationsStore = create<TransformationsStore>()(
    persist(
        (set) => ({
            transformations: [],

            deleteTransformation: (id) => {
                set((prev) => ({
                    transformations: prev.transformations.filter(
                        (it) => it.id !== id,
                    ),
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
                                meta: {
                                    patternName: 'custom',
                                    priority,
                                },
                            },
                        ],
                    };
                });
            },

            saveTransformation: (
                name,
                patternName,
                parameters,
                priority = 0,
            ) => {
                const queries = Object.fromEntries(
                    templates[patternName]().map((template) => {
                        return [
                            (template.header as any).name,
                            template.body(parameters as any),
                        ];
                    }),
                );

                set((previous) => {
                    return {
                        transformations: [
                            ...previous.transformations,
                            {
                                id: ulid(),
                                name,
                                queries,
                                meta: {
                                    patternName,
                                    parameters,
                                    priority,
                                },
                            },
                        ],
                    };
                });
            },

            patchTransformation: (id, patchFunc) => {
                set((previousState) => {
                    return {
                        transformations: produce(
                            previousState.transformations,
                            (draft) => {
                                const toTransform = draft.find(
                                    (it) => it.id === id,
                                );

                                if (!toTransform) {
                                    return;
                                }

                                patchFunc(toTransform);
                            },
                        ),
                    };
                });
            },
        }),
        { name: 'transformations' },
    ),
);
