import { GraphDiff } from '@/util/transformations/GraphTransformer';
import { create } from 'zustand';
import { Transformation } from './transformations';

export type PerformedTransformation = {
    id: Transformation['id'] | undefined;
    diff: GraphDiff;
};

export type TransformationsStack = {
    performed: PerformedTransformation[];

    push: (id: PerformedTransformation['id'], diff: GraphDiff) => void;
    pop: () => GraphDiff | undefined;
};

export const useTransformationsStackStore = create<TransformationsStack>()((set, get) => ({
    performed: [],

    push: (id, diff) => {
        if (diff.deleted.length === 0 && diff.inserted.length === 0) {
            return;
        }

        set((prev) => ({
            performed: [...prev.performed, { id, diff }],
        }));
    },
    pop: () => {
        const lastIndex = get().performed.length - 1;
        const top = get().performed.at(lastIndex);
        if (!top) {
            return undefined;
        }

        set((prev) => ({
            performed: prev.performed.filter((_, index) => index !== lastIndex),
        }));

        return top.diff;
    },
}));
