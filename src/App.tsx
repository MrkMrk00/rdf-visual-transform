import { GraphRenderer } from '@/components/GraphRenderer';
import { SigmaContainer } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { EdgeCurvedArrowProgram } from '@sigma/edge-curve';
import { NodeSquareProgram } from '@sigma/node-square';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, memo, Suspense } from 'react';
import { DEFAULT_NODE_PROGRAM_CLASSES } from 'sigma/settings';
import { Menu } from './components/Menu';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './components/ui/resizable';
import { Toaster } from './components/ui/sonner';
import { StoreProvider } from './contexts/tripple-store';
import { useIsMobile, WindowSizeProvider } from './contexts/window-size';
import { useGraphSettings } from './store/graphSettings';
import { useUiControlStore } from './store/uiControl';
import { TransformationsStack } from './components/panes/TransformationsStack';

const SparqlConsole = lazy(() =>
    import('./components/panes/SparqlConsole').then((module) => ({
        default: module.SparqlConsole,
    })),
);

const TransformationsPanel = lazy(() =>
    import('./components/transformations/TransformationsPanel').then((module) => ({
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
    const sigmaSettings = useGraphSettings((store) => store.sigmaSettings);

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
                    curved: EdgeCurvedArrowProgram,
                },
                ...sigmaSettings,
                allowInvalidContainer: true,
            }}
        >
            <GraphRenderer />
        </SigmaContainer>
    );
});

function MobileLayout() {
    const showSparqlConsole = useUiControlStore((store) => store.showSparqlConsole);
    const hideSparqlConsole = useUiControlStore((store) => store.toggleSparqlConsole);

    const showTransformations = useUiControlStore((store) => store.showTransformationsPanel);
    const hideTransformationsPanel = useUiControlStore((store) => store.toggleTransformationsPanel);

    return (
        <div className="relative flex flex-col w-full h-full">
            <Menu />
            <GraphMain />

            {showSparqlConsole && (
                <Suspense>
                    <div className="absolute inset-0 z-100">
                        <SparqlConsole close={hideSparqlConsole} />
                    </div>
                </Suspense>
            )}

            {showTransformations && (
                <Suspense>
                    <div className="absolute inset-0 z-110">
                        <TransformationsPanel close={hideTransformationsPanel} />
                    </div>
                </Suspense>
            )}
        </div>
    );
}

function DesktopLayout() {
    const showSparqlConsole = useUiControlStore((store) => store.showSparqlConsole);
    const hideSparqlConsole = useUiControlStore((store) => store.toggleSparqlConsole);

    const showTransformationsPanel = useUiControlStore((store) => store.showTransformationsPanel);
    const hideTransformationsPanel = useUiControlStore((store) => store.toggleTransformationsPanel);

    const showTransformationsStack = useUiControlStore((store) => store.showTransformationsStack);

    return (
        <>
            <Menu />
            <div className="relative w-full h-full">
                <ResizablePanelGroup className="absolute bottom-0 flex items-end" direction="vertical">
                    <ResizablePanel order={0} id="main-panel" className="w-full">
                        <ResizablePanelGroup direction="horizontal">
                            <ResizablePanel order={100} id="horiz-main-panel">
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
                                        <TransformationsPanel close={hideTransformationsPanel} />
                                    </ResizablePanel>
                                </Suspense>
                            )}

                            {showTransformationsStack && (
                                <Suspense>
                                    <ResizableHandle withHandle />
                                    <ResizablePanel
                                        order={101}
                                        className="z-1 w-full"
                                        defaultSize={30}
                                        id="horiz-transformations-panel"
                                    >
                                        <TransformationsStack />
                                    </ResizablePanel>
                                </Suspense>
                            )}
                        </ResizablePanelGroup>
                    </ResizablePanel>

                    {showSparqlConsole && (
                        <>
                            <ResizableHandle withHandle />

                            <ResizablePanel
                                className="z-1 w-full bg-white"
                                defaultSize={30}
                                id="rpanel-bottom"
                                order={1}
                            >
                                <Suspense fallback={<div className="flex h-full w-full p-8">Loading...</div>}>
                                    <SparqlConsole close={hideSparqlConsole} />
                                </Suspense>
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>
            </div>
        </>
    );
}

function Layout() {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <MobileLayout />;
    }

    return <DesktopLayout />;
}

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <StoreProvider>
                <WindowSizeProvider>
                    <Layout />
                </WindowSizeProvider>
                <Toaster />
            </StoreProvider>
        </QueryClientProvider>
    );
}
