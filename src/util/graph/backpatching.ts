import type { Quad } from '@rdfjs/types';
import { DataFactory, NamedNode, type Quad_Graph, type Store } from 'n3';

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

function reviveQuad(deletedQuad: Quad) {
    return DataFactory.quad(deletedQuad.subject, deletedQuad.predicate, deletedQuad.object, DataFactory.defaultGraph());
}

function multiBackpatch(newQuad: Quad, store: Store) {
    let foundDeleted: Quad[];

    if (
        newQuad.subject.value === ANONYMOUS_NARY_IRI &&
        (foundDeleted = store.getQuads(null, newQuad.predicate, newQuad.object, GRAPH_DELETED)).length > 0
    ) {
        return foundDeleted.map((deletedQuad) => {
            return {
                replacement: reviveQuad(deletedQuad),
                deleted: deletedQuad,
            };
        });
    } else if (
        newQuad.predicate.value === ANONYMOUS_NARY_IRI &&
        (foundDeleted = store.getQuads(newQuad.subject, null, newQuad.object, GRAPH_DELETED)).length > 0
    ) {
        return foundDeleted.map((deletedQuad) => {
            return {
                replacement: reviveQuad(deletedQuad),
                deleted: deletedQuad,
            };
        });
    } else if (
        newQuad.object.value === ANONYMOUS_NARY_IRI &&
        (foundDeleted = store.getQuads(newQuad.subject, newQuad.predicate, null, GRAPH_DELETED)).length > 0
    ) {
        return foundDeleted.map((deletedQuad) => {
            return {
                replacement: reviveQuad(deletedQuad),
                deleted: deletedQuad,
            };
        });
    }

    return [];
}

type BackpatchResult = { replacement: Quad; deleted: Quad };

export function backpatch(newQuad: Quad, store: Store): BackpatchResult[] {
    if (
        newQuad.subject.value === ANONYMOUS_NARY_IRI ||
        newQuad.predicate.value === ANONYMOUS_NARY_IRI ||
        newQuad.object.value === ANONYMOUS_NARY_IRI
    ) {
        return multiBackpatch(newQuad, store);
    }

    let foundDeleted: Quad[];

    if (
        newQuad.subject.value === ANONYMOUS_IRI &&
        (foundDeleted = store.getQuads(null, newQuad.predicate, newQuad.object, GRAPH_DELETED)).length > 0
    ) {
        return [
            {
                replacement: reviveQuad(foundDeleted[0]),
                deleted: foundDeleted[0],
            },
        ];
    } else if (
        newQuad.predicate.value === ANONYMOUS_IRI &&
        (foundDeleted = store.getQuads(newQuad.subject, null, newQuad.object, GRAPH_DELETED)).length > 0
    ) {
        return [
            {
                replacement: reviveQuad(foundDeleted[0]),
                deleted: foundDeleted[0],
            },
        ];
    } else if (
        newQuad.object.value === ANONYMOUS_IRI &&
        (foundDeleted = store.getQuads(newQuad.subject, newQuad.predicate, null, GRAPH_DELETED)).length > 0
    ) {
        return [
            {
                replacement: reviveQuad(foundDeleted[0]),
                deleted: foundDeleted[0],
            },
        ];
    }

    return [];
}
