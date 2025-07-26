import * as templates from '@/sparql-templates';
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
};

export const useTransformationStore = create<TransformationsStore>()(
    persist(
        (set) => ({
            transformations: [],

            saveCustomTransformation: (name, queries, priority = 0) => {
                set((previous) => {
                    return {
                        transformations: [
                            ...previous.transformations,
                            {
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
        }),
        { name: 'transformations' },
    ),
);
