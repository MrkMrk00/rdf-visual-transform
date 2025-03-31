import { GraphRenderer } from "@/components/GraphRenderer";
import { Menu } from "@/components/Menu";
import { SigmaContainer } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import { NodeSquareProgram } from "@sigma/node-square";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DEFAULT_NODE_PROGRAM_CLASSES } from "sigma/settings";
import { useGraphStore } from "./stores/graphSettings";

const sigmaStyle = { height: "100%", width: "100%" };

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    },
});

export function App() {
    const sigmaSettings = useGraphStore((store) => store.sigmaSettings);

    return (
        <QueryClientProvider client={queryClient}>
            <Menu />

            <SigmaContainer
                style={sigmaStyle}
                settings={{
                    nodeProgramClasses: {
                        ...DEFAULT_NODE_PROGRAM_CLASSES,
                        square: NodeSquareProgram,
                        ...(sigmaSettings.nodeProgramClasses ?? {}),
                    },
                    ...sigmaSettings,
                    allowInvalidContainer: true,
                }}
            >
                <GraphRenderer />
            </SigmaContainer>
        </QueryClientProvider>
    );
}
