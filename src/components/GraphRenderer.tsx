import { useGraphologyGraph } from '@/contexts/tripple-store';
import { useDoubleClickToCopy } from '@/hooks/ui/useDoubleClickToCopy';
import { useTransformer } from '@/hooks/useTransformer';
import { useShouldZoomWhileTransforming } from '@/store/graphSettings';
import { useUiControlStore } from '@/store/uiControl';
import { useLoadGraph, useSigma } from '@react-sigma/core';
import { memo, useEffect } from 'react';
import { NodeContextMenu } from './NodeContextMenu';

export const GraphRenderer = memo(function GraphRenderer() {
    const loadGraph = useLoadGraph();
    const graph = useGraphologyGraph();
    const { onChange } = useTransformer();

    const sigma = useSigma();
    useDoubleClickToCopy(sigma);

    const [shouldZoom] = useShouldZoomWhileTransforming();
    const devModeActive = useUiControlStore((store) => store.devMode);

    // I hate this... Does not work with direct listeners with Sigma.on()
    // f*** you Sigma - capture phase
    // btw. this may not work on iOS Safari: https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event
    useEffect(() => {
        if (!shouldZoom || devModeActive) {
            return;
        }

        function listener(ev: MouseEvent) {
            const { left, top, right, bottom } = sigma.getContainer().getBoundingClientRect();
            const { clientX, clientY } = ev;

            if (clientX >= left && clientX <= right && clientY >= top && clientY <= bottom) {
                ev.stopPropagation();
                ev.preventDefault();
            }
        }

        const abortController = new AbortController();

        document.addEventListener('wheel', listener, {
            capture: true,
            passive: false,
            signal: abortController.signal,
        });

        return () => abortController.abort();
    }, [shouldZoom, sigma, devModeActive]);

    useEffect(() => {
        if (!graph) {
            return;
        }

        const abortContoller = new AbortController();
        onChange(() => loadGraph(graph), abortContoller.signal);

        return () => abortContoller.abort();
    }, [onChange, graph, loadGraph]);

    useEffect(() => {
        if (!graph) {
            return;
        }

        loadGraph(graph);
    }, [loadGraph, graph]);

    return (
        <>
            <NodeContextMenu sigma={sigma} />
        </>
    );
});
