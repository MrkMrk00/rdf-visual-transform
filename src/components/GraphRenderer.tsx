import { useTripleStore } from "@/stores/graphSettings";
import { insertQuadIntoGraph } from "@/util/graphology";
import { useLoadGraph } from "@react-sigma/core";
import { DirectedGraph } from "graphology";
import { random as randomLayout } from "graphology-layout";
import forceAtlas2Layout from "graphology-layout-forceatlas2";
import { useEffect } from "react";

export function GraphRenderer() {
    const loadGraph = useLoadGraph();
    const { data: store } = useTripleStore();

    useEffect(() => {
        if (!store) {
            return;
        }

        const graph = new DirectedGraph();
        for (const quad of store.toArray()) {
            insertQuadIntoGraph(graph, quad);
        }

        randomLayout.assign(graph);

        const settings = forceAtlas2Layout.inferSettings(graph);
        forceAtlas2Layout.assign(graph, { ...settings, iterations: 5 });

        loadGraph(graph);
    }, [loadGraph, store]);

    return null;
}
