import { DataFactory, NamedNode, type Quad_Graph, type Store } from 'n3';
import type { Quad } from '@rdfjs/types';

export const GRAPH_DELETED: Quad_Graph = new NamedNode('https://graph.example.com/graph-of-deleted-tripples');

/**
 * Placeholder for a single node to be backpatched.
 */
export const ANONYMOUS_IRI = 'https://example.com/ANONYMOUS';

/**
 * Used as a placeholder for `multiple` (n) nodes to be backpatched.
 *  -> The tripple, which contains this placeholder should be replicated into the graph
 *     n times.
 */
export const ANONYMOUS_NARY_IRI = 'https://example.com/ANONYMOUS_N';

export function backpatch(newQuad: Quad, store: Store): { replacement: Quad; deleted: Quad } | undefined {
    let foundDeleted: Quad[];

    if (
        newQuad.subject.value === ANONYMOUS_IRI &&
        (foundDeleted = store.getQuads(null, newQuad.predicate, newQuad.object, GRAPH_DELETED)).length > 0
    ) {
        return {
            replacement: DataFactory.quad(
                foundDeleted[0].subject,
                foundDeleted[0].predicate,
                foundDeleted[0].object,
                newQuad.graph,
            ),
            deleted: foundDeleted[0],
        };
    } else if (
        newQuad.predicate.value === ANONYMOUS_IRI &&
        (foundDeleted = store.getQuads(newQuad.subject, null, newQuad.object, GRAPH_DELETED)).length > 0
    ) {
        return {
            replacement: DataFactory.quad(
                foundDeleted[0].subject,
                foundDeleted[0].predicate,
                foundDeleted[0].object,
                newQuad.graph,
            ),
            deleted: foundDeleted[0],
        };
    } else if (
        newQuad.object.value === ANONYMOUS_IRI &&
        (foundDeleted = store.getQuads(newQuad.subject, newQuad.predicate, null, GRAPH_DELETED)).length > 0
    ) {
        return {
            replacement: DataFactory.quad(
                foundDeleted[0].subject,
                foundDeleted[0].predicate,
                foundDeleted[0].object,
                newQuad.graph,
            ),
            deleted: foundDeleted[0],
        };
    }

    return undefined;
}
