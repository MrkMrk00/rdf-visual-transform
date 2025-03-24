import * as rml from "@comake/rmlmapper-js";
import * as graphology from "graphology";
import { beforeEach, describe, it } from "vitest";
import { graphIntoJsonLd, insertQuadIntoGraph } from "../src/graph";
import { RdfStreamingReader } from "../src/RdfStreamingReader";

import graphData from "../example-data/people-graph.ttl?raw";
import peopleMapping from "../rml-templates/01-property-chain-shortcut.ttl?raw";

describe("Apply property chain shortcut pattern", () => {
    const reader = new RdfStreamingReader();
    let graph!: graphology.DirectedGraph;

    beforeEach(async () => {
        graph = new graphology.DirectedGraph();

        await reader.readFromString(graphData, "text/turtle", (quad) => {
            insertQuadIntoGraph(graph, quad);
        });
    });

    it("creates a shorcut", async () => {
        const input = JSON.stringify(graphIntoJsonLd(graph));
        const output = await rml.parseTurtle(peopleMapping, { input });

        console.log(output);
    });
});
