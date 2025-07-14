import { useGraphologyGraph, useTripleStore } from "@/contexts/tripple-store";
import { useGraphStore } from "@/stores/graphSettings";
import { syncGraphWithStore } from "@/util/graphology";
import { inverseCentroidHeuristicLayout, springElectricalLayout } from "@/util/node-placement";
import { QueryEngine } from "@comunica/query-sparql";
import { useMemo } from "react";
import { toast } from "sonner";

const sparqlQueryEngine = new QueryEngine();

const eventBus = new EventTarget();

export function useTransformer() {
    const graph = useGraphologyGraph();
    const store = useTripleStore();

    const positioningFunction = useGraphStore((store) => store.positioningFunction);

    return useMemo(() => {
        return {
            update: async (query: string) => {
                try {
                    await sparqlQueryEngine.queryVoid(query, {
                        sources: [store],
                    });
                } catch (err) {
                    const event = new CustomEvent("error", {
                        detail: err,
                        cancelable: true,
                    });
                    eventBus.dispatchEvent(event);

                    if (!event.defaultPrevented) {
                        toast(String(err));
                    }

                    return;
                }

                syncGraphWithStore(
                    graph,
                    store,
                    positioningFunction === "spring-electric" ? springElectricalLayout : inverseCentroidHeuristicLayout,
                );

                eventBus.dispatchEvent(new Event("change"));
            },
            onError: (callback: (ev: CustomEvent<unknown>) => void, signal?: AbortSignal) => {
                eventBus.addEventListener("error", callback as EventListener, { signal });
            },
            onChange: (callback: (ev: Event) => void, signal?: AbortSignal) => {
                eventBus.addEventListener("change", callback, { signal });
            },
        };
    }, [store, graph, positioningFunction]);
}
