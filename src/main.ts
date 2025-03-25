import { insertQuadIntoGraph } from "@/util/graphology";
import { instantiateGraphologyLayout, type Layout } from "@/util/graphology-layouts";
import { RdfReader } from "@/util/rdf-reader";
import { NodeSquareProgram } from "@sigma/node-square";
import { getNodesInViewport } from "@sigma/utils";
import * as graphology from "graphology";
import { Sigma } from "sigma";
import { DEFAULT_NODE_PROGRAM_CLASSES } from "sigma/settings";
import exampleData from "../example-data/people-graph.ttl?raw";

(async () => {
    // @ts-ignore
    const urlForm: HTMLFormElement = document.forms.graphUrl;
    const container = document.querySelector("main")!;

    let sigma: Sigma | null = null;

    urlForm.addEventListener("submit", async (ev) => {
        ev.preventDefault();

        sigma?.kill();
        sigma = null;

        const options = Object.fromEntries(new FormData(ev.currentTarget as HTMLFormElement)) as Record<string, string>;

        // const graph = await downloadAndParseGraph(options.url);

        const graph = new graphology.DirectedGraph();
        const rdfReader = new RdfReader();

        await rdfReader.readFromString(exampleData, "text/turtle", (quad) => {
            insertQuadIntoGraph(graph, quad);
        });

        const layout = await instantiateGraphologyLayout(options.layout as Layout);
        layout.assign(graph);

        sigma = new Sigma(graph, container, {
            nodeProgramClasses: {
                ...DEFAULT_NODE_PROGRAM_CLASSES,
                square: NodeSquareProgram,
            },
            renderEdgeLabels: true,
        });
    });

    const submitButton = urlForm.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.click();

    document.getElementById("nodes-in-viewport")!.addEventListener("click", () => {
        if (!sigma) {
            console.error("Sigma handle is not available. Maybe the graph is currently re-rendering.");

            return;
        }

        console.log(getNodesInViewport(sigma));
    });
})();
