import type { Transformation } from '@/store/transformations';
import { QueryEngine } from '@comunica/query-sparql';
import type { Quad } from '@rdfjs/types';
import Graph from 'graphology';
import { circular } from 'graphology-layout';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { AbstractGraph } from 'graphology-types';
import { Store } from 'n3';
import { CustomEdgeAttributes, insertQuadIntoGraph } from '../graph/graphology';
import { renderTemplate } from './renderTemplate';

export const TransformerEvents = {
    change: 'change',
    error: 'error',

    kindPopState: 'popstate',
    kindLayout: 'layout',
    isPopStateEvent: (ev: Event): ev is CustomEvent<{ kind: 'popstate' }> => {
        return ev instanceof CustomEvent && typeof ev.detail === 'object' && ev.detail.kind === 'popstate';
    },
    isLayoutAdjustmentEvent: (ev: Event): ev is CustomEvent<{ kind: 'layout' }> => {
        return ev instanceof CustomEvent && typeof ev.detail === 'object' && ev.detail.kind === 'layout';
    },
} as const;

export type TransformerEvent = ValueOf<{
    [key in keyof typeof TransformerEvents]: key extends `kind${string}`
        ? never
        : (typeof TransformerEvents)[key] extends (...args: any) => any
          ? never
          : (typeof TransformerEvents)[key];
}>;

export type PositioningFunction = (newGraph: AbstractGraph) => void;

export type GraphDiff = {
    inserted: Quad[];
    deleted: Quad[];
};

function doDiffGraphs(original: Store, updated: Store): GraphDiff {
    return {
        inserted: updated.difference(original).toArray(),
        deleted: original.difference(updated).toArray(),
    };
}

// is needed? O(n^2) :/
function combineGraphDiffs(...diffs: GraphDiff[]): GraphDiff {
    return diffs.reduce(
        (diffA, diffB) => {
            return {
                deleted: diffA.deleted.filter((quadA) => diffB.inserted.some((quadB) => quadB.equals(quadA))),
                inserted: diffA.inserted.filter((quadA) => diffB.deleted.some((quadB) => quadB.equals(quadA))),
            };
        },
        { deleted: [], inserted: [] },
    );
}

export class GraphTransformer implements EventTarget {
    private readonly eventBus: EventTarget = new EventTarget();
    private readonly queryEngine: QueryEngine = new QueryEngine();

    private positioningFunction: PositioningFunction | null = null;

    constructor(
        public graph: AbstractGraph,
        public store: Store,
    ) {}

    static async createGraph(store: Store) {
        const graph = new Graph({ type: 'directed', multi: true });

        const me = new GraphTransformer(graph, store);
        me.setPositioningFunction((newGraph) => circular.assign(newGraph));

        await me.syncGraphWithStore();
        me.adjustLayout();

        return graph;
    }

    /**
     * Execute a SPARQL update query against the store
     * and sync the results to the graph.
     */
    async update(query: string): Promise<GraphDiff | undefined> {
        const originalStore = new Store(this.store);

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

            return undefined;
        }

        // this will run "async" tasks
        this.syncGraphWithStore();

        return doDiffGraphs(originalStore, this.store);
    }

    async renderAndRunTransformation(transformation: Transformation): Promise<GraphDiff | undefined> {
        if (transformation.patternName === 'custom') {
            let diff: GraphDiff = { deleted: [], inserted: [] };

            for (const [_, query] of Object.entries(transformation.queries)) {
                // if there is no event handler registered, this line will throw
                const result = await this.update(query);
                if (!result) {
                    return undefined;
                }

                diff = combineGraphDiffs(diff, result);
            }

            return diff;
        }

        // Shouldn't throw, but can...
        // The parameters are wrongly defined, if this does throw.
        const sparqlQuery = renderTemplate(transformation.patternName, transformation.parameters as any);

        return await this.update(sparqlQuery);
    }

    undoTransformation(diff: GraphDiff): Promise<void> {
        this.store.addQuads(diff.deleted);
        this.store.removeQuads(diff.inserted);

        return this.syncGraphWithStore({ kind: TransformerEvents.kindPopState });
    }

    syncGraphWithStore<T extends Record<string, unknown>>(eventDetail?: T): Promise<void> {
        // add newly INSERTed tripples into the graph
        for (const quad of this.store) {
            insertQuadIntoGraph(this.graph, quad);
        }

        // TODO: animate nodes into position?
        if (this.positioningFunction) {
            this.positioningFunction(this.graph);
        }

        // signal to render the graph in current state (with only the INSERTed tripples in the graph)
        this.eventBus.dispatchEvent(new CustomEvent(TransformerEvents.change, { detail: eventDetail }));

        // the graph is ready to be rendered
        //  -> schedule cleanup into macrotask queue (~ apply DELETE)
        // also: wrap in promise, so the whole syncing process can be awaited
        return new Promise<void>((resolve) =>
            setTimeout(() => {
                this.graph.forEachDirectedEdge((edge, attributes) => {
                    const attrs = attributes as CustomEdgeAttributes;

                    if (!this.store.has(attrs.quad)) {
                        this.graph.dropEdge(edge);
                    }
                });

                // remove nodes without (out- and in-)edges
                this.graph.forEachNode((node) => {
                    if (this.graph.degree(node) <= 0) {
                        this.graph.dropNode(node);
                    }
                });

                this.eventBus.dispatchEvent(new CustomEvent(TransformerEvents.change, { detail: eventDetail }));

                resolve();
            }),
        );
    }

    adjustLayout(iterations: number = 5) {
        const settings = forceAtlas2.inferSettings(this.graph);
        forceAtlas2.assign(this.graph, { ...settings, iterations });

        const eventDetail = {
            kind: TransformerEvents.kindLayout,
        };

        this.eventBus.dispatchEvent(new CustomEvent(TransformerEvents.change, { detail: eventDetail }));
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
