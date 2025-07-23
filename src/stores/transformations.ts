import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Transformation = {
    name: string;
    queries: Record<string, string>;
};

export type TransformationsStore = {
    transformations: Transformation[];

    saveTransformation: (
        name: Transformation['name'],
        queries: Transformation['queries'],
    ) => void;
};

export const useTransformationStore = create<TransformationsStore>()(
    persist(
        (set) => ({
            transformations: [],

            saveTransformation: (name, queries) =>
                set((previous) => ({
                    transformations: [
                        ...previous.transformations,
                        { name, queries },
                    ],
                })),
        }),
        { name: 'transformations' },
    ),
);
