import { GraphRenderer } from '@/components/GraphRenderer';
import { SigmaContainer } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { EdgeCurvedArrowProgram } from '@sigma/edge-curve';
import { NodeSquareProgram } from '@sigma/node-square';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, memo, Suspense } from 'react';
import { DEFAULT_NODE_PROGRAM_CLASSES } from 'sigma/settings';
import { Menu } from './components/Menu';
import { Toaster } from './components/ui/sonner';
import { UserControls } from './components/UserControls';
import { StoreProvider } from './contexts/tripple-store';
import { useGraphSettings } from './store/graphSettings';
import { useUiControlStore } from './store/uiControl';

const DevMode = lazy(() =>
    import('./components/screens/DevMode').then((module) => ({
        default: module.DevMode,
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

const AppLayout = memo(function AppLayout() {
    const devModeEnabled = useUiControlStore((store) => store.devMode);

    return (
        <>
            <Menu />
            <div className="relative w-full h-full">
                {devModeEnabled && (
                    <Suspense>
                        <DevMode />
                    </Suspense>
                )}
                <div className="absolute inset-0">
                    <GraphMain />
                </div>

                <UserControls className="absolute bottom-0 right-0 z-10 pr-4 pb-4" />
            </div>
        </>
    );
});

export function App() {
    return (
        <>
            <QueryClientProvider client={queryClient}>
                <StoreProvider>
                    <AppLayout />
                </StoreProvider>
            </QueryClientProvider>
            <Toaster position="top-center" />
        </>
    );
}
