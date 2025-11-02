import { shortenIri } from '@/consts/rdf-prefixes';
import { useGraphSettings } from '@/store/graphSettings';
import { CustomEdgeAttributes } from '@/util/graph/graphology';
import { useMemo } from 'react';
import { Settings } from 'sigma/settings';
import { EdgeDisplayData } from 'sigma/types';

export function useShortenIriReducer(): Settings['edgeReducer'] {
    const hiddenPredicates = useGraphSettings((store) => store.hiddenPredicates);

    return useMemo(() => {
        if (hiddenPredicates.length === 0) {
            return null;
        }

        return (_, data) => {
            const attrs = data as EdgeDisplayData & CustomEdgeAttributes;

            const shortenedIri = shortenIri(attrs.label);
            if (shortenedIri !== attrs.label) {
                return {
                    ...attrs,
                    label: shortenedIri,
                };
            }

            return attrs;
        };
    }, [hiddenPredicates]);
}
