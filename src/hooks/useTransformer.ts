import { useGraphologyGraph, useTripleStore } from '@/contexts/tripple-store';
import { useGraphStore } from '@/stores/graphSettings';
import { Transformation } from '@/stores/transformations';
import { syncGraphWithStore } from '@/util/graph/graphology';
import { inverseCentroidHeuristicLayout, springElectricalLayout } from '@/util/graph/node-placement';
import { QueryEngine } from '@comunica/query-sparql';
import { useMemo } from 'react';
import { toast } from 'sonner';

const sparqlQueryEngine = new QueryEngine();

const eventBus = new EventTarget();

export function useTransformer() {
    const graph = useGraphologyGraph();
    const store = useTripleStore();

    const positioningFunction = useGraphStore((store) => store.positioningFunction);

    return useMemo(() => {
        async function update(query: string) {
            try {
                await sparqlQueryEngine.queryVoid(query, {
                    sources: [store],
                });
            } catch (err) {
                const event = new CustomEvent('error', {
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
                positioningFunction === 'spring-electric' ? springElectricalLayout : inverseCentroidHeuristicLayout,
            );

            eventBus.dispatchEvent(new Event('change'));
        }

        async function renderAndRun(transformation: Transformation) {
            if (transformation.patternName === 'custom') {
                for (const [templateName, query] of Object.entries(transformation.queries)) {
                    try {
                        await update(query);
                    } catch (e) {
                        toast.error(`❌ Failed to execute transformation "${transformation.name}:${templateName}".`);

                        break;
                    }
                }

                return;
            }

            const templates = await import('@/sparql-templates/index.ts');
            const renderers = templates[transformation.patternName]();
            for (const { header, body } of renderers) {
                if (!('name' in header) || !(`_${header.name}` in transformation.parameters)) {
                    continue;
                }

                let renderedTemplate: string;
                try {
                    renderedTemplate = body(transformation.parameters as any);
                } catch (e) {
                    toast.error(`❌ Failed to render SPARQL template "${transformation.name}:${header.name}". (${e})`);

                    break;
                }

                try {
                    await update(renderedTemplate);
                } catch (e) {
                    toast.error(`❌ Failed to execute transformation "${transformation.name}:${header.name}".`);

                    break;
                }
            }
        }

        return {
            update,
            renderAndRun,
            onError: (callback: (ev: CustomEvent<unknown>) => void, signal?: AbortSignal) => {
                eventBus.addEventListener('error', callback as EventListener, {
                    signal,
                });
            },
            onChange: (callback: (ev: Event) => void, signal?: AbortSignal) => {
                eventBus.addEventListener('change', callback, { signal });
            },
        };
    }, [store, graph, positioningFunction]);
}
