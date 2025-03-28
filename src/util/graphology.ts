import type { Quad, Quad_Object, Quad_Predicate, Quad_Subject } from "@rdfjs/types";
import type { DirectedGraph } from "graphology";

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
    if (object.termType === "Literal") {
        graph.addNode(objectKey, <CustomNodeAttributes>{
            type: "square",
            label: object.value,
            size: NODE_DEFAULT_SIZE,

            self: object,
            quad: quad,
        });
    } else if (!graph.hasNode(object.value)) {
        graph.addNode(objectKey, <CustomNodeAttributes>{
            label: object.value,
            size: NODE_DEFAULT_SIZE,

            self: object,
            quad: quad,
        });
    }

    if (!graph.hasDirectedEdge(subject.value, objectKey)) {
        graph.addDirectedEdge(subject.value, objectKey, <CustomEdgeAttributes>{
            label: predicate.value,

            self: predicate,
            quad: quad,
        });
    }
}

export interface CustomNodeAttributes {
    label: string;
    self: Quad_Subject | Quad_Object;
    quad: Quad;
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
