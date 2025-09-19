import type { Transformation } from '@/stores/transformations';
import { QueryEngine } from '@comunica/query-sparql';
import type { AbstractGraph } from 'graphology-types';
import { Store } from 'n3';
import { syncGraphWithStore } from '../graph/graphology';
import { renderTemplate } from './renderTemplate';

export const TransformerEvents = {
    change: 'change',
    error: 'error',
} as const;

export type TransformerEvent = (typeof TransformerEvents)[keyof typeof TransformerEvents];

type PositioningFunction = NonNullable<Parameters<typeof syncGraphWithStore>[2]>;

export class GraphTransformer implements EventTarget {
    private readonly eventBus: EventTarget = new EventTarget();
    private readonly queryEngine: QueryEngine = new QueryEngine();

    private positioningFunction: PositioningFunction | null = null;

    constructor(
        public graph: AbstractGraph,
        public store: Store,
    ) {}

    /**
     * Execute a SPARQL update query against the store
     * and sync the results to the graph.
     */
    async update(query: string) {
        try {
            await this.queryEngine.queryVoid(query, {
                sources: [this.store],
            });
        } catch (err) {
            // Try and pass the error to an error event handler
            const event = new CustomEvent(TransformerEvents.error, {
                detail: err,
                cancelable: true,
            });
            this.eventBus.dispatchEvent(event);

            // if not handled -> throw the error instead
            if (!event.defaultPrevented) {
                throw err;
            }

            return false;
        }

        syncGraphWithStore(this.graph, this.store, this.positioningFunction ?? undefined);

        return this.eventBus.dispatchEvent(new Event(TransformerEvents.change));
    }

    async renderAndRunTransformation(transformation: Transformation) {
        if (transformation.patternName === 'custom') {
            const failed: string[] = [];
            for (const [templateName, query] of Object.entries(transformation.queries)) {
                // if there is no event handler registered, this line will throw
                const result = await this.update(query);

                if (!result) {
                    failed.push(templateName);
                }
            }

            return { failed: failed.length > 0 ? failed : undefined };
        }

        // Shouldn't throw, but can...
        // The parameters are wrongly defined, if this does throw.
        const sparqlQuery = renderTemplate(transformation.patternName, transformation.parameters as any);

        return { failed: (await this.update(sparqlQuery)) ? [transformation.name] : undefined };
    }

    setPositioningFunction(func: PositioningFunction) {
        this.positioningFunction = func;
    }

    removeEventListener(
        type: TransformerEvent,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean,
    ): void {
        this.eventBus.removeEventListener(type, callback, options);
    }

    addEventListener(
        type: TransformerEvent,
        callback: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean,
    ): void {
        this.eventBus.addEventListener(type, callback, options);
    }

    dispatchEvent(event: Event & { type: TransformerEvent }): boolean {
        throw new Error('Cannot dispatch event from outside!', { cause: event });
    }
}
