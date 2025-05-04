import { useEventListener } from "@/hooks/useEventListener";
import { useTripleStore } from "@/stores/graphSettings";
import { insertQuadIntoGraph } from "@/util/graphology";
import { useLoadGraph } from "@react-sigma/core";
import { DirectedGraph } from "graphology";
import { random as randomLayout } from "graphology-layout";
import forceAtlas2Layout from "graphology-layout-forceatlas2";
import { Store } from "n3";
import { useEffect, useMemo } from "react";

function intoGraph(store: Store) {
    const graph = new DirectedGraph();
    for (const quad of store.toArray()) {
        insertQuadIntoGraph(graph, quad);
    }

    randomLayout.assign(graph);

    const settings = forceAtlas2Layout.inferSettings(graph);
    forceAtlas2Layout.assign(graph, { ...settings, iterations: 5 });

    return graph;
}

export function GraphRenderer() {
    const loadGraph = useLoadGraph();
    const { data: store } = useTripleStore();

    const graph = useMemo(() => {
        if (!store) {
            return null;
        }

        return intoGraph(store);
    }, [store]);

    useEventListener(document.body, "rdf.rerender", () => {
        if (!store) {
            return;
        }

        const graph = intoGraph(store);
        loadGraph(graph);
    });

    useEffect(() => {
        if (!graph) {
            return;
        }

        loadGraph(graph);
    }, [loadGraph, graph]);

    return null;
}
