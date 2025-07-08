import type { Quad, Quad_Object, Quad_Predicate, Quad_Subject } from "@rdfjs/types";
import { NotFoundGraphError, type DirectedGraph } from "graphology";
import type { NeighborEntry } from "graphology-types";
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

function approximateOptimalPosition(graph: DirectedGraph, rootNode: string, depth: number = 2) {
    let neighborCount = 0;

    let xSum = 0;
    let ySum = 0;

    let xMax = 0;
    let yMax = 0;
    let xMin = Number.MAX_SAFE_INTEGER;
    let yMin = Number.MAX_SAFE_INTEGER;

    graph.forEachNeighbor(rootNode, (neighbor, neighborAttributes) => {
        if (!neighborAttributes.x || !neighborAttributes.y) {
            return;
        }

        const toVisit: string[] = [neighbor];
        const visited = new Set<string>();

        let currentDepth = depth;
        while (currentDepth-- > 0) {
            console.log("[approximateOptimalPosition] visiting", toVisit);

            const lenBefore = toVisit.length;
            for (let i = 0; i < lenBefore; ++i) {
                const current = toVisit.pop();
                if (!current || visited.has(current)) {
                    continue;
                }

                const { x, y } = graph.getNodeAttributes(current);
                if (!x || !y) {
                    continue;
                }

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

                if (currentDepth + 1 < depth) {
                    const centroidX = xMin + (xMax - xSum / neighborCount);
                    const centroidY = yMin + (yMax - ySum / neighborCount);

                    // Reduce the effect on the centroid position for nodes farther away from the root.
                    let significanceFactor: number;
                    if (depth > 2) {
                        // Nonlinear reduction in significance instead of linear for 2 levels.
                        significanceFactor = Math.pow(currentDepth / depth, 1.5);
                    } else {
                        significanceFactor = currentDepth / depth;
                    }

                    xSum += x - (x - centroidX) * significanceFactor;
                    ySum += y - (y - centroidY) * significanceFactor;
                } else {
                    xSum += x;
                    ySum += y;
                }

                neighborCount++;

                visited.add(current);
                if (currentDepth > 0) {
                    toVisit.unshift(...graph.neighbors(current));
                }
            }
        }
    });

    return {
        x: xMin + (xMax - xSum / neighborCount),
        y: yMin + (yMax - ySum / neighborCount),
    };
}

function findBestPositionForNewNode(oldGraph: DirectedGraph, graph: DirectedGraph, node: string) {
    let oldNeighbors: NeighborEntry[] = [];
    try {
        oldNeighbors = Array.from(oldGraph.neighborEntries(node));
    } catch (e) {
        if (!(e instanceof NotFoundGraphError)) {
            throw e;
        }
    }

    // Try to find the position from a deleted neighbor...
    const newNeighbors = new Set(graph.neighborEntries(node));
    for (const oldNeighbor of oldNeighbors) {
        // If the neighbor still exists...
        if (newNeighbors.has(oldNeighbor)) {
            continue;
        }

        // If there was a neighboring node, that was deleted by the transformation,
        // place the new node in there.
        return {
            x: graph.getNodeAttribute(oldNeighbor, "x"),
            y: graph.getNodeAttribute(oldNeighbor, "y"),
        };
    }

    return approximateOptimalPosition(graph, node);
}

export function syncGraphWithStore(graph: DirectedGraph, store: Store) {
    const oldGraph = graph.copy();

    // insert new
    for (const quad of store) {
        insertQuadIntoGraph(graph, quad);
    }

    graph.forEachNode((node, attributes) => {
        if (typeof attributes.x !== "undefined" && typeof attributes.y !== "undefined") {
            return;
        }

        const { x, y } = findBestPositionForNewNode(oldGraph, graph, node);
        console.log('Assigning new positions of node "' + node + '" to ', { x, y });
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
