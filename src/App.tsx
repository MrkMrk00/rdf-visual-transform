import { GraphRenderer } from "@/components/GraphRenderer";
import { SigmaContainer } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import { NodeSquareProgram } from "@sigma/node-square";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, memo, Suspense } from "react";
import { DEFAULT_NODE_PROGRAM_CLASSES } from "sigma/settings";
import { Menu } from "./components/Menu";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./components/ui/resizable";
import { Toaster } from "./components/ui/sonner";
import { StoreProvider } from "./contexts/tripple-store";
import { useGraphStore } from "./stores/graphSettings";
import { useUiControlStore } from "./stores/uiControl";

const SparqlConsole = lazy(() =>
    import("./components/SparqlConsole").then((module) => ({ default: module.SparqlConsole })),
);

const sigmaStyle = { height: "100%", width: "100%" };

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            throwOnError: false,
        },
    },
});

const GraphMain = memo(function GraphMain() {
    const sigmaSettings = useGraphStore((store) => store.sigmaSettings);

    return (
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
    );
});

export function App() {
    const showSparqlConsole = useUiControlStore((store) => store.showSparqlConsole);

    return (
        <QueryClientProvider client={queryClient}>
            <StoreProvider>
                <ResizablePanelGroup direction="vertical">
                    <Menu />

                    <ResizablePanel id="rpanel-main" order={0}>
                        <GraphMain />
                    </ResizablePanel>

                    {showSparqlConsole && (
                        <>
                            <ResizableHandle withHandle />

                            <ResizablePanel defaultSize={30} id="rpanel-bottom" order={1}>
                                <Suspense fallback={<div className="flex h-full w-full p-8">Loading...</div>}>
                                    <SparqlConsole />
                                </Suspense>
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>

                <Toaster />
            </StoreProvider>
        </QueryClientProvider>
    );
}
