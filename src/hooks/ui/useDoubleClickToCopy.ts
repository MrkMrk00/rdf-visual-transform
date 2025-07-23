import { useEffect } from 'react';
import { Sigma } from 'sigma';
import { SigmaNodeEventPayload } from 'sigma/types';
import { toast } from 'sonner';

function doubleClickHandler(payload: SigmaNodeEventPayload) {
    payload.preventSigmaDefault();

    if (payload.node.startsWith('lit:')) {
        const parts = payload.node.split('-');

        navigator.clipboard.writeText(parts[parts.length - 1]).then(() => {
            toast('📋 Literal value written to clipboard.');
        });

        return;
    }

    navigator.clipboard.writeText(payload.node).then(() => {
        toast('📋 IRI written to clipboard.');
    });
}

export function useDoubleClickToCopy(sigma: Sigma) {
    useEffect(() => {
        sigma.on('doubleClickNode', doubleClickHandler);

        return () =>
            void sigma.removeListener('doubleClickNode', doubleClickHandler);
    }, [sigma]);
}
