import { useGraphologyGraph } from '@/contexts/tripple-store';
import { useDoubleClickToCopy } from '@/hooks/ui/useDoubleClickToCopy';
import { useTransformer } from '@/hooks/useTransformer';
import { useLoadGraph, useSigma } from '@react-sigma/core';
import { useEffect } from 'react';
import { NodeContextMenu } from './NodeContextMenu';

export function GraphRenderer() {
    const loadGraph = useLoadGraph();
    const graph = useGraphologyGraph();
    const { onChange } = useTransformer();

    const sigma = useSigma();
    useDoubleClickToCopy(sigma);

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
}
