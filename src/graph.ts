import type { Quad, Quad_Object, Quad_Predicate, Quad_Subject } from "@rdfjs/types";
import * as graphology from "graphology";
import * as layouts from "graphology-layout";
import { RdfStreamingReader } from "./RdfStreamingReader";

export function getObjectKey(subject: Quad_Subject, predicate: Quad_Predicate, object: Quad_Object) {
    if (object.termType === "Literal") {
        return `lit:${subject.value}-${predicate.value}-${object.value}`;
    }

    return object.value;
}

export async function downloadAndParseGraph(url: string | URL) {
    const graph = new graphology.DirectedGraph();

    const rdfReader = new RdfStreamingReader();
    await rdfReader.readFromUrl(url, ({ subject, predicate, object }) => {
        if (!graph.hasNode(subject.value)) {
            graph.addNode(subject.value, { label: subject.value });
        }

        const objectKey = getObjectKey(subject, predicate, object);
        if (object.termType === "Literal") {
            graph.addNode(objectKey, { label: object.value, type: "square" });
        } else if (!graph.hasNode(object.value)) {
            graph.addNode(objectKey, { label: object.value });
        }

        if (!graph.hasEdge(subject.value, objectKey)) {
            graph.addEdge(subject.value, objectKey, { label: predicate.value });
        }
    });

    return graph;
}

export type Layout = "force" | "circular" | "circlepack" | "random" | "forceAtlas2";
type LayoutInstance = {
    assign(graph: graphology.DirectedGraph | graphology.UndirectedGraph): void;
};

export async function instantiateGraphologyLayout(layout: Layout): Promise<LayoutInstance> {
    switch (layout) {
        case "force":
            const { default: forceLayout } = await import("graphology-layout-force");

            return {
                assign: (graph) => {
                    layouts.random.assign(graph, { scale: 2, dimensions: ["200", "200"] });

                    forceLayout.assign(graph, { maxIterations: 2 });
                },
            };
        case "forceAtlas2":
            const { default: forceAtlas2Layout } = await import("graphology-layout-forceatlas2");
            const randomLayout = await instantiateGraphologyLayout("random");

            return {
                assign: (graph) => {
                    randomLayout.assign(graph);
                    const settings = forceAtlas2Layout.inferSettings(graph);

                    forceAtlas2Layout.assign(graph, {
                        iterations: 2,
                        settings: {
                            ...settings,
                        },
                    });
                },
            };
        case "random":
            return layouts.random;
        case "circular":
            return layouts.circular;
        case "circlepack":
            return layouts.circlepack;
    }
}

export function insertQuadIntoGraph(graph: graphology.DirectedGraph, { subject, predicate, object }: Quad) {
    if (!graph.hasNode(subject.value)) {
        graph.addNode(subject.value, { label: subject.value, size: 15 });
    }

    const objectKey = getObjectKey(subject, predicate, object);
    if (object.termType === "Literal") {
        graph.addNode(objectKey, { label: object.value, type: "square", size: 15 });
    } else if (!graph.hasNode(object.value)) {
        graph.addNode(objectKey, { label: object.value, size: 15 });
    }

    if (!graph.hasEdge(subject.value, objectKey)) {
        graph.addEdge(subject.value, objectKey, { label: predicate.value });
    }
}
