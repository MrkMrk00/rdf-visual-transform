import { inverseCentroidHeuristicLayout } from '@/util/graph/node-placement';
import type { Quad, Quad_Graph, Quad_Object, Quad_Predicate, Quad_Subject } from '@rdfjs/types';
import { type DirectedGraph } from 'graphology';
import { DataFactory, NamedNode, Store } from 'n3';

export const NODE_DEFAULT_SIZE = 15;

export function insertQuadIntoGraph(graph: DirectedGraph, quad: Quad) {
    const { subject, predicate, object } = quad;

    if (!graph.hasNode(subject.value)) {
        graph.addNode(subject.value, <CustomNodeAttributes>{
            label: subject.value,
            size: NODE_DEFAULT_SIZE,

            self: subject,
            quad: quad,
        });
    }

    const objectKey = getObjectKey(subject, predicate, object);
    if (!graph.hasNode(objectKey)) {
        if (object.termType === 'Literal') {
            graph.addNode(objectKey, <CustomNodeAttributes>{
                type: 'square',
                label: object.value,
                size: NODE_DEFAULT_SIZE,

                self: object,
            });
        } else {
            graph.addNode(object.value, <CustomNodeAttributes>{
                label: object.value,
                size: NODE_DEFAULT_SIZE,

                self: object,
            });
        }
    }

    const edgeKey = `${subject.value}-${predicate.value}-${objectKey}`;
    if (!graph.hasDirectedEdge(edgeKey)) {
        let displayType: undefined | string = undefined;
        if (graph.hasDirectedEdge(subject.value, objectKey) || graph.hasDirectedEdge(objectKey, subject.value)) {
            displayType = 'curved';
        }

        graph.addDirectedEdgeWithKey(edgeKey, subject.value, objectKey, <CustomEdgeAttributes>{
            label: predicate.value,

            self: predicate,
            quad: quad,
            type: displayType,
        });
    }
}

export const GRAPH_DELETED: Quad_Graph = new NamedNode('https://graph.example.com/graph-of-deleted-tripples');
export const ANONYMOUS_IRI = 'https://example.com/ANONYMOUS';

function backpatch(newQuad: Quad, store: Store): { replacement: Quad; deleted: Quad } | undefined {
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

export function syncGraphWithStore(
    graph: DirectedGraph,
    store: Store,
    positioningFunction = inverseCentroidHeuristicLayout,
) {
    const oldGraph = graph.copy();

    for (const quad of store) {
        const foundToBackpatch = backpatch(quad, store);

        if (foundToBackpatch) {
            insertQuadIntoGraph(graph, foundToBackpatch.replacement);
            store.delete(foundToBackpatch.deleted);
        } else {
            insertQuadIntoGraph(graph, quad);
        }
    }

    positioningFunction(oldGraph, graph);

    // delete old (TODO: delete nodes without edges)
    graph.forEachDirectedEdge((edge, attributes) => {
        const attrs = attributes as CustomEdgeAttributes;

        if (!store.has(attrs.quad)) {
            // add into the deleted named graph
            store.add(DataFactory.quad(attrs.quad.subject, attrs.quad.predicate, attrs.quad.subject, GRAPH_DELETED));

            graph.dropEdge(edge);
        }
    });

    console.log(store.getQuads(null, null, null, GRAPH_DELETED));
}

export interface CustomNodeAttributes {
    label: string;
    self: Quad_Subject | Quad_Object;
}

export interface CustomEdgeAttributes {
    label: string;
    self: Quad_Predicate;
    quad: Quad;
}

export function getObjectKey(subject: Quad_Subject, predicate: Quad_Predicate, object: Quad_Object) {
    if (object.termType === 'Literal') {
        return `lit:${subject.value}-${predicate.value}-${object.value}`;
    }

    return object.value;
}
