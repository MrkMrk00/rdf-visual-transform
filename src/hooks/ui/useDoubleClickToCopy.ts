import { useEffect } from 'react';
import { Sigma } from 'sigma';
import { SigmaNodeEventPayload } from 'sigma/types';
import { toast } from 'sonner';

export function doCopy(value: string) {
    if (value.startsWith('lit:')) {
        const parts = value.split('-');

        navigator.clipboard.writeText(parts[parts.length - 1]).then(() => {
            toast('📋 Literal value written to clipboard.');
        });

        return;
    }

    navigator.clipboard.writeText(value).then(() => {
        toast('📋 IRI written to clipboard.');
    });
}

function doubleClickHandler(payload: SigmaNodeEventPayload) {
    payload.preventSigmaDefault();

    doCopy(payload.node);
}

export function useDoubleClickToCopy(sigma: Sigma) {
    useEffect(() => {
        sigma.on('doubleClickNode', doubleClickHandler);

        return () => void sigma.removeListener('doubleClickNode', doubleClickHandler);
    }, [sigma]);
}
