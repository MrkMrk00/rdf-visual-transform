import * as trippleStore from '@/contexts/tripple-store';
import { useGraphSettings } from '@/store/graphSettings';
import { Transformation } from '@/store/transformations';
import { inverseCentroidHeuristicLayout, springElectricalLayout } from '@/util/graph/node-placement';
import { GraphTransformer, TransformerEvents } from '@/util/transformations/GraphTransformer';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

const eventBus = new EventTarget();

export function useTransformer() {
    const graph = trippleStore.useGraphologyGraph();
    const store = trippleStore.useTripleStore();

    const stackPop = useGraphSettings((store) => store.popTransformation);
    const stackPush = useGraphSettings((store) => store.pushTransformation);

    const transformer = useMemo(() => {
        const transformer = new GraphTransformer(graph, store);
        transformer.addEventListener(TransformerEvents.error, ((ev: CustomEvent<Error | any>) => {
            toast.error(String(ev.detail));
        }) as EventListener);

        // Forward to the global one -> do not lose the listeners on useMemo run.
        transformer.addEventListener(TransformerEvents.change, (ev) => {
            eventBus.dispatchEvent(new Event(ev.type));
        });

        return transformer;
    }, [graph, store]);

    const positioningFunction = useGraphSettings((store) => store.positioningFunction);

    useEffect(() => {
        if (!transformer) {
            return;
        }

        switch (positioningFunction) {
            case 'inverse-centroid-heuristic':
                transformer.setPositioningFunction(inverseCentroidHeuristicLayout);
                break;

            case 'spring-electric':
                transformer.setPositioningFunction(springElectricalLayout);
                break;
        }
    }, [transformer, positioningFunction]);

    return useMemo(() => {
        return {
            update: async (query: string) => {
                const result = await transformer.update(query);
                if (result) {
                    stackPush(undefined, result);
                }
            },
            renderAndRun: async (transformation: Transformation) => {
                const result = await transformer.renderAndRunTransformation(transformation);
                if (result) {
                    stackPush(transformation.id, result);
                }
            },
            popTransformationsStack: () => {
                const diff = stackPop();
                if (!diff) {
                    toast.warning('No transformation left to undo.');

                    return;
                }

                transformer.undoTransformation(diff);
            },
            onChange: (callback: (ev: Event) => void, signal?: AbortSignal) => {
                eventBus.addEventListener(TransformerEvents.change, callback, { signal });
            },
        };
    }, [transformer, stackPush, stackPop]);
}
