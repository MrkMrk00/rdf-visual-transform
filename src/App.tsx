import { Menu } from "@/components/Menu";
import { useTripleStore } from "@/stores/graphSettings";
import { insertQuadIntoGraph } from "@/util/graphology";
import { SigmaContainer, useLoadGraph } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import { NodeSquareProgram } from "@sigma/node-square";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DirectedGraph } from "graphology";
import { random as randomLayout } from "graphology-layout";
import forceAtlas2Layout from "graphology-layout-forceatlas2";
import { useEffect } from "react";
import { DEFAULT_NODE_PROGRAM_CLASSES } from "sigma/settings";

const sigmaStyle = { height: "100%", width: "100%" };

function GraphRenderer() {
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

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    },
});

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Menu />

            <SigmaContainer
                style={sigmaStyle}
                settings={{
                    allowInvalidContainer: true,
                    nodeProgramClasses: {
                        ...DEFAULT_NODE_PROGRAM_CLASSES,
                        square: NodeSquareProgram,
                    },
                }}
            >
                <GraphRenderer />
            </SigmaContainer>
        </QueryClientProvider>
    );
}
