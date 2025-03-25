import * as graphology from "graphology";
import { assert, beforeEach, describe, it } from "vitest";
import { graphIntoJsonLd, insertQuadIntoGraph } from "../src/graph";
import { RdfStreamingReader } from "../src/RdfStreamingReader";

import { Quad } from "@rdfjs/types";
import graphData from "../example-data/people-graph.ttl?raw";
import peopleMapping from "../rml-templates/01-property-chain-shortcut.ttl?raw";

async function transform(inputTriples: object[], rmlMapping: string) {
    let response!: Response;

    try {
        response = await fetch("http://localhost:3000/transform", {
            method: "POST",
            body: JSON.stringify({
                graph: JSON.stringify(inputTriples),
                mapping: rmlMapping,
            }),
        }).then((r) => (r.ok ? r : Promise.reject(r)));
    } catch (e) {
        return { error: await (e as Response).text() };
    }

    const reader = new RdfStreamingReader();
    const newTriples: Quad[] = [];

    await reader.readFromString(await response.text(), "application/n-triples", (quad) => {
        newTriples.push(quad);
    });

    return newTriples;
}

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
        const input = graphIntoJsonLd(graph);
        const newTriples = await transform(input, peopleMapping);

        assert(!("error" in newTriples), (newTriples as { error: string }).error);

        console.log(newTriples);
    });
});

