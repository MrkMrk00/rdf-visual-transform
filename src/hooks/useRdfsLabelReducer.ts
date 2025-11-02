import { shortenIri } from '@/consts/rdf-prefixes';
import { useGraphologyGraph } from '@/contexts/tripple-store';
import { useGraphSettings } from '@/store/graphSettings';
import { CustomEdgeAttributes, CustomNodeAttributes } from '@/util/graph/graphology';
import { useMemo } from 'react';
import { Settings } from 'sigma/settings';
import { NodeDisplayData } from 'sigma/types';

const RDFS_LABEL = 'http://www.w3.org/2000/01/rdf-schema#label';

export function useRdfsLabelReducer(): Settings['nodeReducer'] {
    const hiddenPredicates = useGraphSettings((store) => store.hiddenPredicates);
    const graph = useGraphologyGraph();

    return useMemo(() => {
        if (!hiddenPredicates.includes(RDFS_LABEL)) {
            return null;
        }

        return (node, data) => {
            const attrs = data as NodeDisplayData & CustomNodeAttributes;
            if (!graph.hasNode(node)) {
                console.warn('node is not in graph, but is being rendered by Sigma.js (what)', { node });

                return attrs;
            }

            for (const { attributes } of graph.outEdgeEntries(node)) {
                const edgeAttributes = attributes as CustomEdgeAttributes;

                let shortenedIri: string | undefined;
                if (edgeAttributes.self.value === RDFS_LABEL) {
                    return {
                        ...attrs,
                        label: edgeAttributes.quad.object.value,
                    };
                } else if ((shortenedIri = shortenIri(attrs.label))) {
                    return {
                        ...attrs,
                        label: shortenedIri,
                    };
                }
            }

            return attrs;
        };
    }, [graph, hiddenPredicates]);
}
