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

    const edgeKey = `${subject.value}-${predicate.value}-${objectKey}`;
    if (!graph.hasDirectedEdge(edgeKey)) {
        let displayType: undefined | string = undefined;
        if (graph.hasDirectedEdge(subject.value, objectKey) || graph.hasDirectedEdge(objectKey, subject.value)) {
            displayType = "curved";
        }

        graph.addDirectedEdgeWithKey(edgeKey, subject.value, objectKey, <CustomEdgeAttributes>{
            label: predicate.value,

            self: predicate,
            quad: quad,
            type: displayType,
        });
    }
}

function findBestPositionForNewNode(graph: DirectedGraph, node: string) {
    let neighborCount = 0;

    let xSum = 0;
    let ySum = 0;

    let xMax = 0;
    let yMax = 0;
    let xMin = Number.MAX_SAFE_INTEGER;
    let yMin = Number.MAX_SAFE_INTEGER;

    graph.forEachNeighbor(node, (_, neighborAttributes) => {
        if (!neighborAttributes.x || !neighborAttributes.y) {
            return;
        }

        const { x, y } = neighborAttributes;

        if (x > xMax) {
            xMax = x;
        }
        if (x < xMin) {
            xMin = x;
        }
        if (y > yMax) {
            yMax = y;
        }
        if (y < yMin) {
            yMin = y;
        }

        xSum += x;
        ySum += y;
        neighborCount++;
    });

    return {
        x: xMin + (xMax - xSum / neighborCount),
        y: yMin + (yMax - ySum / neighborCount),
    };
}

export function syncGraphWithStore(graph: DirectedGraph, store: Store) {
    // insert new
    for (const quad of store) {
        insertQuadIntoGraph(graph, quad);
    }

    graph.forEachNode((node, attributes) => {
        if (typeof attributes.x !== "undefined" && typeof attributes.y !== "undefined") {
            return;
        }

        const { x, y } = findBestPositionForNewNode(graph, node);
        console.log('Assiging new positions of node "' + node + '" to ', { x, y });
        graph.setNodeAttribute(node, "x", x);
        graph.setNodeAttribute(node, "y", y);
    });

    // delete old (TODO: delete nodes without edges)
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
