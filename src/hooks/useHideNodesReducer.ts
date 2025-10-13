import { useGraphologyGraph } from '@/contexts/tripple-store';
import { useGraphSettings } from '@/store/graphSettings';
import type { CustomEdgeAttributes, CustomNodeAttributes } from '@/util/graph/graphology';
import { useMemo } from 'react';
import type { Settings } from 'sigma/settings';
import type { NodeDisplayData } from 'sigma/types';

export function useHideNodesReducer(): Settings['nodeReducer'] {
    const graph = useGraphologyGraph();
    const hiddenPredicates = useGraphSettings((store) => store.hiddenPredicates);

    return useMemo(() => {
        if (!graph) {
            return null;
        }

        return (node, data) => {
            const attrs = data as NodeDisplayData & CustomNodeAttributes;
            if (!graph.hasNode(node)) {
                console.warn('node is not in graph, but is being rendered by Sigma.js (what)', { node });

                return attrs;
            }

            let degree: number = -1;
            if (hiddenPredicates.length > 0) {
                const ignored = new Set(hiddenPredicates);

                degree = graph.reduceEdges(
                    node,
                    (acc, _, edgeAttrs) => {
                        if (ignored.has((edgeAttrs as CustomEdgeAttributes).self.value)) {
                            return acc;
                        }

                        return acc + 1;
                    },
                    0,
                );
            } else {
                degree = graph.degree(node);
            }

            if (degree === 0) {
                return { ...attrs, hidden: true };
            }

            return attrs;
        };
    }, [graph, hiddenPredicates]);
}
