import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { doCopy } from '@/hooks/ui/useDoubleClickToCopy';
import { CursorArrowRaysIcon } from '@heroicons/react/20/solid';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sigma } from 'sigma';
import { SigmaNodeEventPayload } from 'sigma/types';

export function NodeContextMenu({ sigma }: { sigma: Sigma }) {
    const openerRef = useRef<HTMLSpanElement>(null);
    const [nodeId, setNodeId] = useState<string | null>(null);

    useEffect(() => {
        function contextMenuHandler(ev: SigmaNodeEventPayload) {
            ev.event.original.preventDefault();

            const simulatedEvent = new MouseEvent('contextmenu', {
                bubbles: true,
                clientX: (ev.event.original as MouseEvent).clientX ?? ev.event.x,
                clientY: (ev.event.original as MouseEvent).clientY ?? ev.event.y,
            });

            setNodeId(ev.node);
            openerRef.current?.dispatchEvent(simulatedEvent);
        }

        sigma.on('rightClickNode', contextMenuHandler);

        return () => void sigma.removeListener('rightClickNode', contextMenuHandler);
    }, [sigma]);

    return (
        <>
            {createPortal(
                <ContextMenu>
                    <ContextMenuTrigger asChild>
                        <span ref={openerRef} style={{ display: 'none' }} />
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-52">
                        <ContextMenuItem
                            inset
                            onClick={() => {
                                if (nodeId) {
                                    doCopy(nodeId);
                                }
                            }}
                        >
                            {nodeId?.startsWith('lit:') ? 'Copy value' : 'Copy IRI'}
                            <ContextMenuShortcut className="inline-flex">
                                2&times;&nbsp;
                                <CursorArrowRaysIcon />
                            </ContextMenuShortcut>
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>,
                document.body,
            )}
        </>
    );
}
