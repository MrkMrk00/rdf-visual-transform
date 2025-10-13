import { GraphRenderer } from '@/components/GraphRenderer';
import { SigmaContainer } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, memo, PropsWithChildren, Suspense, useRef } from 'react';
import { Menu } from './components/Menu';
import { Toaster } from './components/ui/sonner';
import { ZoomButtons } from './components/ZoomButtons';
import { StoreProvider } from './contexts/tripple-store';
import { useSigmaSettings } from './store/graphSettings';
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

const GraphMain = memo(function GraphMain({ children }: PropsWithChildren) {
    const sigmaSettings = useSigmaSettings();

    return (
        <SigmaContainer style={sigmaStyle} settings={sigmaSettings}>
            {children}
        </SigmaContainer>
    );
});

const AppLayout = memo(function AppLayout() {
    const devModeEnabled = useUiControlStore((store) => store.devMode);
    const menuRef = useRef<HTMLDivElement>(null);

    return (
        <>
            {/* this is awful, but the sigma-react library does not provide a way to declare the context
                without directly rendering the graph. -> You cannot render anything before rendering the graph itself.
                The alternative would be to have everything as `position: absolute` in the UI...
            */}
            <nav ref={menuRef} className="relative flex w-full px-2 bg-white justify-between"></nav>

            <div className="relative w-full h-full">
                <GraphMain>
                    <Menu target={menuRef} />
                    <GraphRenderer />

                    {devModeEnabled && (
                        <Suspense>
                            <DevMode />
                        </Suspense>
                    )}

                    <ZoomButtons className="absolute bottom-0 right-0 z-10 pr-4 pb-4" />
                </GraphMain>
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
