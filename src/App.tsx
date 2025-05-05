import { GraphRenderer } from "@/components/GraphRenderer";
import { SigmaContainer } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import { NodeSquareProgram } from "@sigma/node-square";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useRef } from "react";
import { Sigma } from "sigma";
import { DEFAULT_NODE_PROGRAM_CLASSES } from "sigma/settings";
import { Menu } from "./components/Menu";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./components/ui/resizable";
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
        },
    },
});

export function App() {
    const sigmaSettings = useGraphStore((store) => store.sigmaSettings);
    const showSparqlConsole = useUiControlStore((store) => store.showSparqlConsole);

    const menuRef = useRef<HTMLDivElement>(null);
    const sigma = useRef<Sigma>(null);

    return (
        <QueryClientProvider client={queryClient}>
            <ResizablePanelGroup direction="vertical">
                <Menu />

                <ResizablePanel>
                    <SigmaContainer
                        ref={sigma}
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
                </ResizablePanel>

                {showSparqlConsole && (
                    <>
                        <ResizableHandle withHandle />

                        <ResizablePanel defaultSize={30}>
                            <Suspense fallback={<div className="flex h-full w-full p-8">Loading...</div>}>
                                <SparqlConsole />
                            </Suspense>
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </QueryClientProvider>
    );
}
