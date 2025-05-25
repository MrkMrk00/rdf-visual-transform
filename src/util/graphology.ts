import type { Quad, Quad_Object, Quad_Predicate, Quad_Subject } from "@rdfjs/types";
import type { DirectedGraph } from "graphology";
import { Store } from "n3";

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
        console.log(objectKey);

        if (object.termType === "Literal") {
            graph.addNode(objectKey, <CustomNodeAttributes>{
                type: "square",
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

    if (!graph.hasDirectedEdge(subject.value, objectKey)) {
        graph.addDirectedEdge(subject.value, objectKey, <CustomEdgeAttributes>{
            label: predicate.value,

            self: predicate,
            quad: quad,
        });
    }
}

export function syncGraphWithStore(graph: DirectedGraph, store: Store) {
    // insert new
    for (const quad of store) {
        insertQuadIntoGraph(graph, quad);
    }

    // delete old
    graph.forEachDirectedEdge((edge, attributes) => {
        const attrs = attributes as CustomEdgeAttributes;

        if (!store.has(attrs.quad)) {
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
    if (object.termType === "Literal") {
        return `lit:${subject.value}-${predicate.value}-${object.value}`;
    }

    return object.value;
}
