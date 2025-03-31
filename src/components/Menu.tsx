import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarTrigger,
} from "@/components/ui/menubar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useGraphStore } from "@/stores/graphSettings";
import { ArrowDownTrayIcon, EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import { FocusEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { UrlHistoryPopover } from "./UrlHistoryPopover";

export function Menu() {
    const graph = useGraphStore((store) => store.graph);
    const sigmaSettings = useGraphStore((store) => store.sigmaSettings);
    const loadGraphFromUrl = useGraphStore((store) => store.loadGraphFromUrl);

    const [isUrlCorrect, setIsUrlCorrect] = useState(true);
    const urlRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!urlRef.current || !graph) {
            return;
        }

        if (!("url" in graph)) {
            urlRef.current.value = "";

            return;
        }

        urlRef.current.value = graph.url;
    }, [graph]);

    function validateUrl(url: string) {
        if (!url) {
            setIsUrlCorrect(false);

            return;
        }

        try {
            new URL(url);
        } catch (_e) {
            setIsUrlCorrect(false);

            return;
        }

        setIsUrlCorrect(true);
    }

    function submitUrl(ev: FocusEvent<HTMLInputElement> | KeyboardEvent<HTMLInputElement>) {
        if (!isUrlCorrect) {
            return;
        }

        loadGraphFromUrl(ev.currentTarget.value);
    }

    return (
        <nav className="p-2 flex flex-col gap-2">
            <Menubar>
                <MenubarMenu>
                    <MenubarTrigger>Settings</MenubarTrigger>
                    <MenubarContent>
                        <MenubarCheckboxItem
                            checked={!!sigmaSettings.renderEdgeLabels}
                            onClick={() => {
                                useGraphStore.setState({
                                    sigmaSettings: { renderEdgeLabels: !sigmaSettings.renderEdgeLabels },
                                });
                            }}
                        >
                            Show edge labels
                        </MenubarCheckboxItem>
                    </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                    <MenubarTrigger>Choose example data</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem
                            onSelect={async () => {
                                const { default: data } = await import("../../example-data/people-graph.ttl?raw");

                                useGraphStore.setState({ graph: { data, name: "University" } });
                            }}
                        >
                            University
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
            </Menubar>

            <div className="flex items-center">
                <label className="inline-flex items-center gap-2">
                    <span className="text-sm min-w-fit">Graph from URL:</span>
                    <Input
                        ref={urlRef}
                        onInput={(ev) => setTimeout(validateUrl, 0, ev.currentTarget.value)}
                        onBlur={submitUrl}
                        onKeyDown={(ev) => ev.key === "Enter" && submitUrl(ev)}
                        className={cn("w-sm rounded-r-none border-r-0", {
                            "underline decoration-wavy decoration-destructive": !isUrlCorrect,
                        })}
                        placeholder="Graph URL"
                    />
                </label>

                <UrlHistoryPopover
                    trigger={
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button className="rounded-none" variant="outline" size="icon">
                                        <EllipsisVerticalIcon />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Select from previous</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    }
                    onSelect={(url) => useGraphStore.setState({ graph: { url } })}
                />

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button className="rounded-l-none border-l-0" variant="outline" size="icon">
                                <ArrowDownTrayIcon />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Confirm</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </nav>
    );
}
