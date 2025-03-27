import * as graphology from "graphology";
import { fromRDF as jsonLdFromRdf } from "jsonld";
import type { JsonLdArray } from "jsonld/jsonld-spec";
import { Writer } from "n3";
import { CustomEdgeAttributes } from "./graphology";

export function graphIntoJsonLd(graph: graphology.DirectedGraph) {
    const writer = new Writer({ format: "N-Quads" });

    for (const edge of graph.edges()) {
        const quad = graph.getEdgeAttribute(edge, "quad") as CustomEdgeAttributes["quad"];

        writer.addQuad(quad);
    }

    return new Promise<JsonLdArray>((resolve, reject) => {
        writer.end((err, nQuads) => {
            if (err) {
                reject(err);

                return;
            }

            jsonLdFromRdf(nQuads, { format: "application/n-quads" }).then(resolve).catch(reject);
        });
    });
}
