import { FOAF_NAME, FOAF_PERSON, RDF_TYPE, RDFS_LABEL } from '@/consts/common-iris';
import { shortenIri } from '@/consts/rdf-prefixes';
import { useGraphologyGraph } from '@/contexts/tripple-store';
import { useGraphSettings } from '@/store/graphSettings';
import { CustomEdgeAttributes, CustomNodeAttributes } from '@/util/graph/graphology';
import { EdgeEntry } from 'graphology-types';
import { useMemo } from 'react';
import { Settings } from 'sigma/settings';
import { NodeDisplayData } from 'sigma/types';

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

            const outgoingEntries = Array.from(graph.outEdgeEntries(node));
            const outEdges = new Map<string, EdgeEntry<CustomEdgeAttributes>>(
                outgoingEntries.map((entry) => {
                    return [
                        (entry.attributes as CustomEdgeAttributes).self.value,
                        entry as EdgeEntry<CustomEdgeAttributes>,
                    ];
                }),
            );

            // first try foaf:name (with [] rdf:type foaf:Person)
            if (hiddenPredicates.includes(FOAF_NAME)) {
                const typeEdge = outEdges.get(RDF_TYPE);

                if (typeEdge && typeEdge.attributes.quad.object.value === FOAF_PERSON) {
                    const nameEdge = outEdges.get(FOAF_NAME);

                    if (nameEdge) {
                        return {
                            ...attrs,
                            label: nameEdge.attributes.quad.object.value,
                        };
                    }
                }
            }

            // rdfs:label
            if (hiddenPredicates.includes(RDFS_LABEL)) {
                const labelEdge = outEdges.get(RDFS_LABEL);
                if (labelEdge) {
                    return {
                        ...attrs,
                        label: labelEdge.attributes.quad.object.value,
                    };
                }
            }

            // finally try to shorten the url with a prefix
            let shortenedIri: string | undefined;
            if ((shortenedIri = shortenIri(attrs.label))) {
                return {
                    ...attrs,
                    label: shortenedIri,
                };
            }

            return attrs;
        };
    }, [graph, hiddenPredicates]);
}
