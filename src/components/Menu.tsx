import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGraphSettings } from '@/store/graphSettings';
import { useUiControlStore } from '@/store/uiControl';
import { cn } from '@/util/ui/shadcn';
import { ArrowDownTrayIcon, Cog8ToothIcon, CommandLineIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { CommandLineIcon as CommandLineDark } from '@heroicons/react/24/solid';
import { ComponentPropsWithoutRef, useEffect, useMemo, useState } from 'react';
import { UrlHistoryPopover } from './UrlHistoryPopover';

export function Menu() {
    return (
        <nav className="flex flex-col-reverse justify-end md:flex-row md:justify-between md:items-center w-full px-2 bg-white inset-shadow-md">
            <GraphLoader />
            <MenuNavigator />
        </nav>
    );
}

type MenuProps = Omit<ComponentPropsWithoutRef<'nav'>, 'children'>;

function MenuNavigator(props: MenuProps) {
    const { className, ...restProps } = props;

    const devModeEnabled = useUiControlStore((store) => store.devMode);
    const toggleDevMode = useUiControlStore((store) => store.toggleDevMode);

    const positioningFunction = useGraphSettings((store) => store.positioningFunction);
    const setPositioningFunction = useGraphSettings((store) => store.setPositioningFunction);

    const sigmaSettings = useGraphSettings((store) => store.sigmaSettings);
    const toggleSigmaSetting = useGraphSettings((store) => store.toggleSetting);

    return (
        <div className={cn('flex flex-row justify-end items-center shrink-0', className)} {...restProps}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger className="relative group px-2 py-2 hidden md:block" onClick={toggleDevMode}>
                        {devModeEnabled ? (
                            <CommandLineDark className="h-8 w-8" />
                        ) : (
                            <CommandLineIcon className="h-8 w-8" />
                        )}
                        <span className="absolute bottom-0 translate-[-50%] w-[65%] bg-black h-0 group-hover:h-[2px] transition-[height]"></span>
                    </TooltipTrigger>
                    <TooltipContent>Dev mode</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
                <DropdownMenuTrigger className="relative group px-2 py-2">
                    <Cog8ToothIcon className="h-8 w-8" />
                    <span className="absolute bottom-0 translate-[-50%] w-[65%] bg-black h-0 group-hover:h-[2px] transition-[height]"></span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    <DropdownMenuCheckboxItem
                        checked={!!sigmaSettings.renderEdgeLabels}
                        onClick={() => toggleSigmaSetting('renderEdgeLabels')}
                    >
                        Show edge labels
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />

                    <DropdownMenuLabel className="font-semibold">Positioning function</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                        value={positioningFunction}
                        onValueChange={setPositioningFunction as (value: string) => void}
                    >
                        <DropdownMenuRadioItem value="inverse-centroid-heuristic">
                            Inverse centroid heuristic
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="spring-electric">Spring-electric</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

function GraphLoader() {
    const graph = useGraphSettings((store) => store.graph);
    const loadGraphFromUrl = useGraphSettings((store) => store.loadGraphFromUrl);

    useEffect(() => {
        if (!graph) {
            return;
        }

        if (!('url' in graph)) {
            setGraphUrl('');

            return;
        }

        setGraphUrl(graph.url);
    }, [graph]);

    const [graphUrl, setGraphUrl] = useState<string>(!!graph && 'url' in graph ? graph.url : '');
    const isUrlCorrect = useMemo(() => {
        if (!graphUrl) {
            return false;
        }

        try {
            new URL(graphUrl);
        } catch (_e) {
            return false;
        }

        return true;
    }, [graphUrl]);

    function submitUrlForLoad() {
        if (!isUrlCorrect) {
            return;
        }

        loadGraphFromUrl(graphUrl);
    }

    return (
        <div className="flex items-center">
            <label className="inline-flex items-center gap-2">
                <span className="text-sm min-w-fit">Graph from URL:</span>
                <Input
                    onInput={(ev) => setGraphUrl(ev.currentTarget.value)}
                    value={graphUrl}
                    onKeyDown={(ev) => ev.key === 'Enter' && submitUrlForLoad()}
                    className={cn('w-sm rounded-r-none border-r-0', {
                        'underline decoration-wavy decoration-destructive': !isUrlCorrect,
                    })}
                    placeholder="Graph URL"
                />
            </label>

            <TooltipProvider>
                <Tooltip>
                    <UrlHistoryPopover
                        triggerAsChild
                        trigger={
                            <TooltipTrigger asChild>
                                <Button className="rounded-none" variant="outline" size="icon">
                                    <EllipsisVerticalIcon />
                                </Button>
                            </TooltipTrigger>
                        }
                        onSelect={setGraphUrl}
                    />
                    <TooltipContent>Select from previous</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            className="rounded-l-none border-l-0"
                            variant="outline"
                            size="icon"
                            onClick={() => submitUrlForLoad()}
                        >
                            <ArrowDownTrayIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Confirm</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
