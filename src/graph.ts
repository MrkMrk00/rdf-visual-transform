import type { Quad, Quad_Object, Quad_Predicate, Quad_Subject } from "@rdfjs/types";
import * as graphology from "graphology";
import * as layouts from "graphology-layout";
import { RdfStreamingReader } from "./RdfStreamingReader";
import { RDF } from "./special-properties";

export function getObjectKey(subject: Quad_Subject, predicate: Quad_Predicate, object: Quad_Object) {
    if (object.termType === "Literal") {
        return `lit:${subject.value}-${predicate.value}-${object.value}`;
    }

    return object.value;
}

export async function downloadAndParseGraph(url: string | URL) {
    const graph = new graphology.DirectedGraph();

    const rdfReader = new RdfStreamingReader();
    await rdfReader.readFromUrl(url, (quad) => {
        insertQuadIntoGraph(graph, quad);
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

const NODE_DEFAULT_SIZE = 15;

export function insertQuadIntoGraph(graph: graphology.DirectedGraph, quad: Quad) {
    const { subject, predicate, object } = quad;

    if (!graph.hasNode(subject.value)) {
        graph.addNode(subject.value, <CustomNodeAttributes>{
            label: subject.value,
            size: NODE_DEFAULT_SIZE,

            self: subject,
            quad: quad,

            properties: {},
        });
    }

    // If the predicate is a "special property" (like rdf:type or rdfs:label),
    // do not add it to the graph, but instead add it to the node's properties
    // if (isSpecialProperty(predicate)) {
    //     graph.updateNodeAttributes(subject.value, (attributes) => {
    //         return updateNodeAttributes(attributes, predicate, object);
    //     });
    //
    //     return;
    // }

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

    if (!graph.hasEdge(subject.value, objectKey)) {
        graph.addEdge(subject.value, objectKey, <CustomEdgeAttributes>{
            label: predicate.value,

            self: predicate,
            quad: quad,
        });
    }
}

interface CustomNodeAttributes {
    label: string;
    self: Quad_Subject | Quad_Object;
    quad: Quad;
}

interface CustomEdgeAttributes {
    label: string;
    self: Quad_Predicate;
    quad: Quad;
}

export function graphIntoNTriples(graph: graphology.DirectedGraph) {
    let triples = "";

    for (const edge of graph.edges()) {
        const { quad } = graph.getEdgeAttributes(edge) as CustomEdgeAttributes;

        triples += `<${quad.subject.value}> <${quad.predicate.value}> <${quad.object.value}> .\n`;
    }

    return triples;
}

export function graphIntoJsonLd(graph: graphology.DirectedGraph) {
    const objects: Array<Record<string, any>> = [];

    for (const node of graph.nodes()) {
        const { self } = graph.getNodeAttributes(node) as CustomNodeAttributes;

        if (self.termType === "Literal") {
            continue;
        }

        const edges = graph.outboundEdges(node).map((edgeId) => graph.getEdgeAttribute(edgeId, "quad") as Quad);

        const nodeItem: Record<string, any> = {
            "@id": self.value,
        };

        const type = edges.find(({ predicate }) => predicate.value === `${RDF}type`);

        if (type) {
            nodeItem["@type"] = type.object.value;
        }

        for (const edge of edges) {
            nodeItem[edge.predicate.value] = edge.object.value;
        }

        objects.push(nodeItem);
    }

    return objects;
}
