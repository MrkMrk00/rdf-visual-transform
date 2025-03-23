import * as graphology from "graphology";
import { beforeEach, describe, it } from "vitest";
import graphData from "../example-data/people-graph.ttl?raw";
import { insertQuadIntoGraph } from "../src/graph";
import { RdfStreamingReader } from "../src/RdfStreamingReader";

describe("Apply property chain shortcut pattern", () => {
    const reader = new RdfStreamingReader();
    let graph!: graphology.DirectedGraph;

    beforeEach(() => {
        graph = new graphology.DirectedGraph();

        reader.readFromString(graphData, "text/turtle", (quad) => {
            insertQuadIntoGraph(graph, quad);
        });
    });

    it("creates a shorcut", () => {});
});
