import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGraphUrlHistory } from "@/stores/graphSettings";
import { PopoverClose } from "@radix-ui/react-popover";
import { type ReactNode } from "react";

type UrlHistoryPopoverProps = {
    trigger: ReactNode;
    onSelect: (url: string) => void;
};

function formatUrl(urlStr: string) {
    const url = new URL(urlStr);

    return `${url.hostname}${url.pathname}`;
}

export function UrlHistoryPopover({ trigger, onSelect }: UrlHistoryPopoverProps) {
    const urlHistory = useGraphUrlHistory();

    return (
        <Popover>
            <PopoverTrigger>{trigger}</PopoverTrigger>
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
