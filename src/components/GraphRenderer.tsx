import { useGraphologyGraph } from "@/contexts/tripple-store";
import { useTransformer } from "@/hooks/useTransformer";
import { useLoadGraph } from "@react-sigma/core";
import { useEffect } from "react";

export function GraphRenderer() {
    const loadGraph = useLoadGraph();
    const graph = useGraphologyGraph();
    const { eventBus } = useTransformer();

    useEffect(() => {
        if (!graph) {
            return;
        }

        function loader() {
            loadGraph(graph);
        }

        eventBus.addEventListener("change", loader);

        return () => eventBus.removeEventListener("change", loader);
    }, [eventBus, graph, loadGraph]);

    useEffect(() => {
        if (!graph) {
            return;
        }

        loadGraph(graph);
    }, [loadGraph, graph]);

    return null;
}
