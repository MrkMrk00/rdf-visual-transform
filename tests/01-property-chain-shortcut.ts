import * as graphology from "graphology";
import { assert, beforeEach, describe, it } from "vitest";
import { graphIntoJsonLd, insertQuadIntoGraph } from "../src/graph";
import { RdfStreamingReader } from "../src/RdfStreamingReader";

import type { Quad } from "@rdfjs/types";
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
        const input = graphIntoJsonLd(graph);
        const transformationResult = await transform(input, peopleMapping);

        assert(!("error" in transformationResult), (transformationResult as { error: string }).error);
        const triples = quadsIntoStrings(transformationResult);

        console.log(triples);

        assert(triples.includes("Charlie-studiesUnderProfessor-David"));

        assert(!triples.includes("Charlie-studiesUnderProfessor-Bob"));
        assert(!triples.includes("Charlie-studiesUnderProfessor-Alice"));
        assert(!triples.includes("Charlie-studiesUnderProfessor-Charlie"));

        assert(triples.includes("Alice-studiesUnderProfessor-Bob"));

        assert(!triples.includes("Alice-studiesUnderProfessor-Alice"));
        assert(!triples.includes("Alice-studiesUnderProfessor-Charlie"));
        assert(!triples.includes("Alice-studiesUnderProfessor-David"));

        assert(!triples.includes("Bob-studiesUnderProfessor-Bob"));
        assert(!triples.includes("Bob-studiesUnderProfessor-Alice"));
        assert(!triples.includes("Bob-studiesUnderProfessor-Charlie"));
        assert(!triples.includes("Bob-studiesUnderProfessor-David"));

        assert(!triples.includes("David-studiesUnderProfessor-Bob"));
        assert(!triples.includes("David-studiesUnderProfessor-Alice"));
        assert(!triples.includes("David-studiesUnderProfessor-Charlie"));
        assert(!triples.includes("David-studiesUnderProfessor-David"));

    });
});

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

function quadsIntoStrings(quads: Quad[]) {
    const universityBaseIri = "http://example.org/university#";

    return quads.map((quad) => {
        return [
            quad.subject.value.replace(universityBaseIri, ""),
            quad.predicate.value.replace(universityBaseIri, ""),
            quad.object.value.replace(universityBaseIri, ""),
        ].join("-");
    });
}
