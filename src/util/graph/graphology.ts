import { inverseCentroidHeuristicLayout } from '@/util/graph/node-placement';
import type { Quad, Quad_Object, Quad_Predicate, Quad_Subject } from '@rdfjs/types';
import { type DirectedGraph } from 'graphology';
import { DataFactory, Store } from 'n3';
import { backpatch, GRAPH_DELETED } from './backpatching';

export const NODE_DEFAULT_SIZE = 15;

const GREEN = '#00ff00';
const YELLOW = '#f8f800';

export function insertQuadIntoGraph(graph: DirectedGraph, quad: Quad) {
    const { subject, predicate, object } = quad;

    if (!graph.hasNode(subject.value)) {
        graph.addNode(subject.value, <CustomNodeAttributes>{
            label: subject.value,
            size: NODE_DEFAULT_SIZE,
            color: GREEN,

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
                color: YELLOW,

                self: object,
            });
        } else {
            graph.addNode(object.value, <CustomNodeAttributes>{
                label: object.value,
                size: NODE_DEFAULT_SIZE,
                color: GREEN,

                self: object,
            });
        }
    }

    const edgeKey = `${subject.value}-${predicate.value}-${objectKey}`;
    if (!graph.hasDirectedEdge(edgeKey)) {
        let displayType: string = 'arrow';
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

export function syncGraphWithStore(
    graph: DirectedGraph,
    store: Store,
    positioningFunction = inverseCentroidHeuristicLayout,
) {
    const oldGraph = graph.copy();

    for (const quad of store.readQuads(null, null, null, DataFactory.defaultGraph())) {
        const foundToBackpatch = backpatch(quad, store);

        if (foundToBackpatch.length > 0) {
            for (const { replacement, deleted } of foundToBackpatch) {
                // move the quad from the deleted graph into the default one
                store.delete(deleted);
                store.add(replacement);

                // remove the quad with the anonymous placeholder from store
                store.delete(quad);

                insertQuadIntoGraph(graph, replacement);
            }
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
            store.add(DataFactory.quad(attrs.quad.subject, attrs.quad.predicate, attrs.quad.object, GRAPH_DELETED));

            graph.dropEdge(edge);
        }
    });
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
