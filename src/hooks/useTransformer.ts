import * as trippleStore from '@/contexts/tripple-store';
import { useGraphStore } from '@/stores/graphSettings';
import { inverseCentroidHeuristicLayout, springElectricalLayout } from '@/util/graph/node-placement';
import { GraphTransformer, TransformerEvents } from '@/util/transformations/GraphTransformer';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

const eventBus = new EventTarget();

export function useTransformer() {
    const graph = trippleStore.useGraphologyGraph();
    const store = trippleStore.useTripleStore();

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

    const positioningFunction = useGraphStore((store) => store.positioningFunction);

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
            update: transformer.update.bind(transformer),
            renderAndRun: transformer.renderAndRunTransformation.bind(transformer),
            onChange: (callback: (ev: Event) => void, signal?: AbortSignal) => {
                eventBus.addEventListener(TransformerEvents.change, callback, { signal });
            },
        };
    }, [transformer]);
}
