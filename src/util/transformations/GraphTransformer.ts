import type { Transformation } from '@/stores/transformations';
import { QueryEngine } from '@comunica/query-sparql';
import type { AbstractGraph } from 'graphology-types';
import { DataFactory, Store } from 'n3';
import { backpatch, GRAPH_DELETED } from '../graph/backpatching';
import { CustomEdgeAttributes, insertQuadIntoGraph } from '../graph/graphology';
import { renderTemplate } from './renderTemplate';

const { defaultGraph } = DataFactory;

export const TransformerEvents = {
    change: 'change',
    error: 'error',
} as const;

export type TransformerEvent = (typeof TransformerEvents)[keyof typeof TransformerEvents];
export type PositioningFunction = (oldGraph: AbstractGraph, newGraph: AbstractGraph) => void;

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

        // this will run "async" tasks
        this.syncGraphWithStore();

        return true;
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

    syncGraphWithStore() {
        const oldGraph = this.graph.copy();

        for (const quad of this.store.readQuads(null, null, null, defaultGraph())) {
            const foundToBackpatch = backpatch(quad, this.store);

            if (foundToBackpatch.length > 0) {
                for (const { replacement, deleted } of foundToBackpatch) {
                    // move the quad from the deleted graph into the default one
                    this.store.delete(deleted);
                    this.store.add(replacement);

                    // remove the quad with the anonymous placeholder from store
                    this.store.delete(quad);

                    insertQuadIntoGraph(this.graph, replacement);
                }
            } else {
                insertQuadIntoGraph(this.graph, quad);
            }
        }

        // TODO: animate nodes into position?
        if (this.positioningFunction) {
            this.positioningFunction(oldGraph, this.graph);
        }

        // signal to render the graph in current state
        this.eventBus.dispatchEvent(new Event(TransformerEvents.change));

        // the graph is ready to be rendered
        //  -> schedule cleanup into macrotask queue
        setTimeout(() => {
            this.graph.forEachDirectedEdge((edge, attributes) => {
                const attrs = attributes as CustomEdgeAttributes;

                if (!this.store.has(attrs.quad)) {
                    // add into the deleted named graph
                    this.store.add(
                        DataFactory.quad(attrs.quad.subject, attrs.quad.predicate, attrs.quad.object, GRAPH_DELETED),
                    );

                    this.graph.dropEdge(edge);
                }
            });

            this.graph.forEachNode((node) => {
                if (this.graph.degree(node) <= 0) {
                    this.graph.dropNode(node);
                }
            });

            this.eventBus.dispatchEvent(new Event(TransformerEvents.change));
        });
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
