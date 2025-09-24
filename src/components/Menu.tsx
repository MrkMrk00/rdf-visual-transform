import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger,
} from '@/components/ui/menubar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGraphIsLoading } from '@/contexts/tripple-store';
import { useGraphSettings } from '@/store/graphSettings';
import { useUiControlStore } from '@/store/uiControl';
import { cn } from '@/util/ui/shadcn';
import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    Cog8ToothIcon,
    CommandLineIcon,
    EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { CommandLineIcon as CommandLineDark } from '@heroicons/react/24/solid';
import { useEffect, useMemo, useState } from 'react';
import { UrlHistoryPopover } from './UrlHistoryPopover';

export function Menu() {
    const loadGraphFromUrl = useGraphSettings((store) => store.loadGraphFromUrl);
    const toggleSigmaSetting = useGraphSettings((store) => store.toggleSetting);
    const toggleSparqlConsole = useUiControlStore((store) => store.toggleSparqlConsole);
    const toggleTransformationsPanel = useUiControlStore((store) => store.toggleTransformationsPanel);
    const toggleTransformationsStack = useUiControlStore((store) => store.toggleTransformationsStack);

    const devModeEnabled = useUiControlStore((store) => store.devMode);
    const toggleDevMode = useUiControlStore((store) => store.toggleDevMode);

    const isLoading = useGraphIsLoading();

    const graph = useGraphSettings((store) => store.graph);
    const sigmaSettings = useGraphSettings((store) => store.sigmaSettings);

    const positioningFunction = useGraphSettings((store) => store.positioningFunction);
    const setPositioningFunction = useGraphSettings((store) => store.setPositioningFunction);

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
        <nav className="p-2 flex flex-col gap-2">
            <Menubar className="flex w-full justify-between items-center">
                <div className="flex flex-row">
                    <MenubarMenu>
                        <MenubarTrigger>Example data</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem
                                onSelect={() => loadGraphFromUrl(window.location.pathname + '/people-graph.ttl')}
                            >
                                University
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                        <MenubarTrigger>Transform...</MenubarTrigger>
                        <MenubarContent>
                            <MenubarItem onClick={toggleSparqlConsole}>SPARQL console</MenubarItem>
                            <MenubarItem onClick={toggleTransformationsPanel}>Show Transformations panel</MenubarItem>
                            <MenubarItem onClick={toggleTransformationsStack}>Show Transformations stack</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                </div>
                <div className="flex items-center gap-2">
                    {isLoading && (
                        <MenubarMenu>
                            <ArrowPathIcon className="h-6 w-6 animate-spin" />
                        </MenubarMenu>
                    )}

                    <MenubarMenu>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger onClick={toggleDevMode}>
                                    {devModeEnabled ? (
                                        <CommandLineDark className="h-6 w-6" />
                                    ) : (
                                        <CommandLineIcon className="h-6 w-6" />
                                    )}
                                </TooltipTrigger>
                                <TooltipContent>Dev mode</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </MenubarMenu>

                    <MenubarMenu>
                        <MenubarTrigger className="h-full inline-flex items-center">
                            <Cog8ToothIcon className="h-6 w-6" />
                        </MenubarTrigger>
                        <MenubarContent className="mr-4">
                            <MenubarCheckboxItem
                                checked={!!sigmaSettings.renderEdgeLabels}
                                onClick={() => toggleSigmaSetting('renderEdgeLabels')}
                            >
                                Show edge labels
                            </MenubarCheckboxItem>

                            <MenubarSub>
                                <MenubarSubTrigger>Positioning function</MenubarSubTrigger>
                                <MenubarSubContent>
                                    <MenubarCheckboxItem
                                        checked={positioningFunction === 'inverse-centroid-heuristic'}
                                        onClick={() => setPositioningFunction('inverse-centroid-heuristic')}
                                    >
                                        Inverse centroid heuristic
                                    </MenubarCheckboxItem>
                                    <MenubarCheckboxItem
                                        checked={positioningFunction === 'spring-electric'}
                                        onClick={() => setPositioningFunction('spring-electric')}
                                    >
                                        Spring-electric
                                    </MenubarCheckboxItem>
                                </MenubarSubContent>
                            </MenubarSub>
                        </MenubarContent>
                    </MenubarMenu>
                </div>
            </Menubar>

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
        </nav>
    );
}
