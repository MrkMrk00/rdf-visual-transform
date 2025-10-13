import { useGraphologyGraph } from '@/contexts/tripple-store';
import { useDoubleClickToCopy } from '@/hooks/ui/useDoubleClickToCopy';
import { useTransformer } from '@/hooks/useTransformer';
import { useGraphSettings } from '@/store/graphSettings';
import type { CustomEdgeAttributes, CustomNodeAttributes } from '@/util/graph/graphology';
import { useLoadGraph, useSigma } from '@react-sigma/core';
import { memo, useEffect } from 'react';
import type { EdgeDisplayData, NodeDisplayData } from 'sigma/types';
import { NodeContextMenu } from './NodeContextMenu';

export const GraphRenderer = memo(function GraphRenderer() {
    const loadGraph = useLoadGraph();
    const graph = useGraphologyGraph();
    const { onChange } = useTransformer();
    const hiddenPredicates = useGraphSettings((store) => store.hiddenPredicates);

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

    // Register edgeReducer for commonly ignored (rdf:type) predicates.
    useEffect(() => {
        if (!sigma || hiddenPredicates.length === 0) {
            sigma.setSetting('edgeReducer', null);

            return;
        }

        const ignored = new Set(hiddenPredicates);

        sigma.setSetting('edgeReducer', (_, data) => {
            const attrs = data as EdgeDisplayData & CustomEdgeAttributes;
            if (ignored.has(attrs.self.value)) {
                attrs.hidden = true;
            }

            return attrs;
        });

        return () => {
            sigma.setSetting('edgeReducer', null);
        };
    }, [sigma, hiddenPredicates]);

    useEffect(() => {
        if (graph.size === 0) {
            sigma.setSetting('nodeReducer', null);

            return;
        }

        const ignored = new Set(hiddenPredicates);

        sigma.setSetting('nodeReducer', (node, data) => {
            const attrs = data as NodeDisplayData & CustomNodeAttributes;
            if (!graph.hasNode(node)) {
                console.warn('node is not in graph, but is being rendered by Sigma.js (what)', { node });

                return attrs;
            }

            const degreeWithoutIgnoredEdges = graph.reduceEdges(
                node,
                (acc, _, edgeAttrs) => {
                    if (ignored.has((edgeAttrs as CustomEdgeAttributes).self.value)) {
                        return acc;
                    }

                    return acc + 1;
                },
                0,
            );

            if (degreeWithoutIgnoredEdges === 0) {
                attrs.hidden = true;
            }

            return attrs;
        });

        return () => {
            sigma.setSetting('nodeReducer', null);
        };
    }, [sigma, graph, hiddenPredicates]);

    return (
        <>
            <NodeContextMenu sigma={sigma} />
        </>
    );
});
