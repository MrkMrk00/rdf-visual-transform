import { NotFoundGraphError, type DirectedGraph } from "graphology";
import { NeighborEntry } from "graphology-types";

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

function tryReplaceNeighbor(node: string, oldGraph: DirectedGraph, graph: DirectedGraph) {
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

    return undefined;
}

export function inverseCentroidHeuristicLayout(oldGraph: DirectedGraph, graph: DirectedGraph) {
    graph.forEachNode((node, attributes) => {
        if (typeof attributes.x !== "undefined" && typeof attributes.y !== "undefined") {
            return;
        }

        const neighborsPos = tryReplaceNeighbor(node, oldGraph, graph);
        if (neighborsPos) {
            const { x, y } = neighborsPos;
            graph.setNodeAttribute(node, "x", x);
            graph.setNodeAttribute(node, "y", y);

            return;
        }

        const { x, y } = approximateOptimalPosition(graph, node);
        graph.setNodeAttribute(node, "x", x);
        graph.setNodeAttribute(node, "y", y);
    });
}

export type SpringElectricalLayoutOptions = {
    iterations: number;
    /**
     * How many levels of neighbors to include
     * in the algorithm. default = `2`
     */
    relaxationRadius: number;

    c1: number;
    c2: number;
    c3: number;
    c4: number;
};

const defaultSpringLayoutSettings: SpringElectricalLayoutOptions = {
    iterations: 10,
    relaxationRadius: 2,
    c1: 100,
    c2: 10,
    c3: 0.5,
    c4: 0.01,
};

/**
 * 12.2 Spring Systems and Electrical Forces
 * @see https://cs.brown.edu/people/rtamassi/gdhandbook/chapters/force-directed.pdf
 */
export function springElectricalLayout(
    oldGraph: DirectedGraph,
    graph: DirectedGraph,
    optionsOverride: Partial<SpringElectricalLayoutOptions> = {},
) {
    const options = { ...defaultSpringLayoutSettings, ...optionsOverride };
    const nodes: string[] = [];

    // Collect all new nodes (and try to place them in their deleted neighbors positions first).
    graph.forEachNode((node, attributes) => {
        if (typeof attributes.x !== "undefined" && typeof attributes.y !== "undefined") {
            return;
        }

        const neighborsPos = tryReplaceNeighbor(node, oldGraph, graph);
        if (neighborsPos) {
            const { x, y } = neighborsPos;
            graph.setNodeAttribute(node, "x", x);
            graph.setNodeAttribute(node, "y", y);

            return;
        }

        const visited = new Set<string>();
        const toVisit = [node];

        let depth = options.relaxationRadius;
        while (depth-- > 0) {
            const lenBefore = toVisit.length;
            for (let i = 0; i < lenBefore; ++i) {
                const current = toVisit.pop();
                if (!current || visited.has(current)) {
                    continue;
                }

                visited.add(current);

                if (depth > 0) {
                    toVisit.unshift(...graph.neighbors(current));
                }
            }
        }

        nodes.push(...visited);
    });

    const forces = new Map<string, { fx: number; fy: number }>();

    for (let iteration = options.iterations; iteration > 0; --iteration) {
        // Zero initialize the forces.
        forces.clear();
        for (const node of nodes) {
            forces.set(node, { fx: 0, fy: 0 });
        }

        for (let ia = 0; ia < nodes.length; ++ia) {
            const a = nodes[ia]!;
            const aNeighbors = graph.neighbors(a);

            const af = forces.get(a)!;
            let { x: ax, y: ay } = graph.getNodeAttributes(a) as { x: number; y: number };
            ax ||= 0;
            ay ||= 0;

            for (let ib = ia + 1; ib < nodes.length; ++ib) {
                const b = nodes[ib]!;
                const bf = forces.get(b)!;

                let { x: bx, y: by } = graph.getNodeAttributes(b) as { x: number; y: number };
                bx ||= 0;
                by ||= 0;

                const d = Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
                const dirX = ax - bx >= 0 ? 1 : -1;
                const dirY = ay - by >= 0 ? 1 : -1;

                // 1) Spring attraction force      := c1 ∗ log(d/c2)
                // for neighboring edges.
                if (aNeighbors.includes(b)) {
                    const attractionForce = options.c1 * Math.log10(d / options.c2);

                    af.fx = dirX * attractionForce;
                    af.fy = dirY * attractionForce;
                    bf.fx = -dirX * attractionForce;
                    bf.fy = -dirY * attractionForce;

                    continue;
                }

                // 2) Electrical repulsion for non-adjacent vertices. := c3/(d^2)
                const repultion = options.c3 / (d * d);

                af.fx = -dirX * repultion;
                af.fy = -dirY * repultion;
                bf.fx = dirX * repultion;
                bf.fy = dirY * repultion;
            }
        }

        // 3) Move the vertex := c4 ∗ (force on vertex)
        for (const [node, { fx, fy }] of forces.entries()) {
            let { x, y } = graph.getNodeAttributes(node) as { x: number; y: number };

            x ||= 0;
            y ||= 0;

            graph.setNodeAttribute(node, "x", x + options.c4 * fx);
            graph.setNodeAttribute(node, "y", y + options.c4 * fy);
        }
    }
}
