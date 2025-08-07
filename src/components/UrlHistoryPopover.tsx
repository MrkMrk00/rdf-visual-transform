import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGraphStore } from '@/stores/graphSettings';
import { PopoverClose } from '@radix-ui/react-popover';
import { type ReactNode } from 'react';

type UrlHistoryPopoverProps = {
    trigger: ReactNode;
    triggerAsChild?: boolean;
    onSelect: (url: string) => void;
};

function formatUrl(urlStr: string) {
    let url: URL;

    try {
        url = new URL(urlStr);
    } catch (_e) {
        return urlStr;
    }

    return `${url.hostname}${url.pathname}`;
}

export function UrlHistoryPopover({ trigger, triggerAsChild, onSelect }: UrlHistoryPopoverProps) {
    const urlHistory = useGraphStore((store) => store.graphUrlHistory);

    return (
        <Popover>
            <PopoverTrigger asChild={triggerAsChild}>{trigger}</PopoverTrigger>
            <PopoverContent asChild>
                <ul className="w-full">
                    {urlHistory.map((url, i) => (
                        <li key={`url-history-${i}`}>
                            <PopoverClose asChild>
                                <Button type="button" onClick={() => onSelect(url)} variant="ghost">
                                    <p className="truncate max-w-72">{formatUrl(url)}</p>
                                </Button>
                            </PopoverClose>
                        </li>
                    ))}
                </ul>
            </PopoverContent>
        </Popover>
    );
}
