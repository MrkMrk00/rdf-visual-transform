import { GraphRenderer } from '@/components/GraphRenderer';
import { SigmaContainer } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import CurvedEdgeProgram from '@sigma/edge-curve';
import { NodeSquareProgram } from '@sigma/node-square';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, memo, Suspense } from 'react';
import { DEFAULT_NODE_PROGRAM_CLASSES } from 'sigma/settings';
import { Menu } from './components/Menu';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from './components/ui/resizable';
import { Toaster } from './components/ui/sonner';
import { StoreProvider } from './contexts/tripple-store';
import { useGraphStore } from './stores/graphSettings';
import { useUiControlStore } from './stores/uiControl';

const SparqlConsole = lazy(() =>
    import('./components/SparqlConsole').then((module) => ({
        default: module.SparqlConsole,
    })),
);

const TransformationsPanel = lazy(() =>
    import('./components/TransformationsPanel').then((module) => ({
        default: module.TransformationsPanel,
    })),
);

const sigmaStyle = { height: '100%', width: '100%' };

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
                edgeProgramClasses: {
                    curved: CurvedEdgeProgram,
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
    const showSparqlConsole = useUiControlStore(
        (store) => store.showSparqlConsole,
    );

    const showTransformationsPanel = useUiControlStore(
        (store) => store.showTransformationsPanel,
    );

    return (
        <QueryClientProvider client={queryClient}>
            <StoreProvider>
                <Menu />
                <div className="relative w-full h-full">
                    <ResizablePanelGroup
                        className="absolute bottom-0 flex items-end"
                        direction="vertical"
                    >
                        <ResizablePanel order={0} id="main-panel" className="w-full">
                            <ResizablePanelGroup direction="horizontal">
                                <ResizablePanel
                                    order={100}
                                    id="horiz-main-panel"
                                >
                                    <div className="absolute inset-0">
                                        <GraphMain />
                                    </div>
                                </ResizablePanel>

                                {showTransformationsPanel && (
                                    <Suspense>
                                        <ResizableHandle withHandle />
                                        <ResizablePanel
                                            order={101}
                                            className="z-1 w-full"
                                            defaultSize={30}
                                            id="horiz-transformations-panel"
                                        >
                                            <TransformationsPanel />
                                        </ResizablePanel>
                                    </Suspense>
                                )}
                            </ResizablePanelGroup>
                        </ResizablePanel>

                        {showSparqlConsole && (
                            <>
                                <ResizableHandle withHandle />

                                <ResizablePanel
                                    className="z-1 w-full"
                                    defaultSize={30}
                                    id="rpanel-bottom"
                                    order={1}
                                >
                                    <Suspense
                                        fallback={
                                            <div className="flex h-full w-full p-8">
                                                Loading...
                                            </div>
                                        }
                                    >
                                        <SparqlConsole />
                                    </Suspense>
                                </ResizablePanel>
                            </>
                        )}
                    </ResizablePanelGroup>
                </div>

                <Toaster />
            </StoreProvider>
        </QueryClientProvider>
    );
}
