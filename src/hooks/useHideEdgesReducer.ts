import { useGraphSettings } from '@/store/graphSettings';
import type { CustomEdgeAttributes } from '@/util/graph/graphology';
import { useMemo } from 'react';
import type { Settings } from 'sigma/settings';
import type { EdgeDisplayData } from 'sigma/types';

export function useHideEdgesReducer(): Settings['edgeReducer'] {
    const hiddenPredicates = useGraphSettings((store) => store.hiddenPredicates);

    return useMemo(() => {
        if (hiddenPredicates.length === 0) {
            return null;
        }

        const ignored = new Set(hiddenPredicates);

        return (_, data) => {
            let attrs = data as EdgeDisplayData & CustomEdgeAttributes;
            if (ignored.has(attrs.self.value)) {
                attrs = { ...attrs, hidden: true };
            }

            return attrs;
        };
    }, [hiddenPredicates]);
}
