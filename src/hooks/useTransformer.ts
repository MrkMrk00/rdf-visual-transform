import { useGraphologyGraph, useTripleStore } from "@/contexts/tripple-store";
import { syncGraphWithStore } from "@/util/graphology";
import { QueryEngine } from "@comunica/query-sparql";
import { useMemo } from "react";
import { toast } from "sonner";

const sparqlQueryEngine = new QueryEngine();

const eventBus = new EventTarget();

export function useTransformer() {
    const graph = useGraphologyGraph();
    const store = useTripleStore();

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

                syncGraphWithStore(graph, store);
                eventBus.dispatchEvent(new Event("change"));
            },
            eventBus,
        };
    }, [store, graph]);
}
