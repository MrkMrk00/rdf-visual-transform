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
import { useGraphIsLoading } from '@/contexts/tripple-store';
import { useGraphSettings, useShouldZoomWhileTransforming } from '@/store/graphSettings';
import { useUiControlStore } from '@/store/uiControl';
import { cn } from '@/util/ui/shadcn';
import {
    ArrowDownTrayIcon,
    ArrowPathRoundedSquareIcon,
    Cog8ToothIcon,
    CommandLineIcon,
    EllipsisHorizontalCircleIcon,
    EllipsisVerticalIcon,
    QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { CommandLineIcon as CommandLineDark } from '@heroicons/react/24/solid';
import { ComponentPropsWithoutRef, RefObject, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { UrlHistoryPopover } from './UrlHistoryPopover';

export function Menu({ target }: { target: RefObject<HTMLDivElement | null> }) {
    const [showGraphLoader, setShowGraphLoader] = useState(false);

    if (!target?.current) {
        return null;
    }

    return createPortal(
        <nav className="relative flex w-full px-2 bg-white justify-between">
            <button type="button" className="p-2 block md:hidden" onClick={() => setShowGraphLoader((prev) => !prev)}>
                <EllipsisHorizontalCircleIcon className="w-8 h-8" />
            </button>

            <GraphLoader
                className={cn(
                    `bg-white z-10
                     absolute top-12 left-[50%] translate-x-[-50%]
                     md:static md:top-[unset] md:left-[unset] md:translate-x-[unset] md:flex`,
                    {
                        hidden: !showGraphLoader,
                    },
                )}
            />
            <MenuNavigator />
        </nav>,
        target.current,
    );
}

type MenuProps = Omit<ComponentPropsWithoutRef<'nav'>, 'children'>;

function MenuItemWithUnderline(props: ComponentPropsWithoutRef<'button'>) {
    const { className, children, ...restProps } = props;

    return (
        <button className={cn('relative group px-2 py-2 focus:outline-none', className)} {...restProps}>
            {children}
            <span className="absolute bottom-0 translate-[-50%] w-[65%] bg-black h-0 group-hover:h-[2px] transition-[height]"></span>
        </button>
    );
}

function MenuNavigator(props: MenuProps) {
    const { className, ...restProps } = props;

    const devModeEnabled = useUiControlStore((store) => store.devMode);
    const toggleDevMode = useUiControlStore((store) => store.toggleDevMode);

    const positioningFunction = useGraphSettings((store) => store.positioningFunction);
    const setPositioningFunction = useGraphSettings((store) => store.setPositioningFunction);

    const sigmaSettings = useGraphSettings((store) => store.sigmaSettings);
    const toggleSigmaSetting = useGraphSettings((store) => store.toggleSetting);

    const [shouldZoom, toggleShouldZoom] = useShouldZoomWhileTransforming();
    const isLoading = useGraphIsLoading();

    const iconSize = 'h-8 w-8';

    return (
        <div className={cn('flex flex-row justify-end items-center shrink-0', className)} {...restProps}>
            {isLoading && (
                <span className="px-2 py-2">
                    <ArrowPathRoundedSquareIcon className={cn(iconSize, 'animate-spin')} />
                </span>
            )}

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <MenuItemWithUnderline className="hidden md:block" onClick={toggleDevMode}>
                            {devModeEnabled ? (
                                <CommandLineDark className={iconSize} />
                            ) : (
                                <CommandLineIcon className={iconSize} />
                            )}
                        </MenuItemWithUnderline>
                    </TooltipTrigger>
                    <TooltipContent>Dev mode</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <MenuItemWithUnderline>
                                <Cog8ToothIcon className={iconSize} />
                            </MenuItemWithUnderline>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipProvider>
                        <TooltipContent>Layout options</TooltipContent>
                    </TooltipProvider>
                </Tooltip>
                <DropdownMenuContent className="w-56">
                    <DropdownMenuCheckboxItem
                        checked={!!sigmaSettings.renderEdgeLabels}
                        onClick={() => toggleSigmaSetting('renderEdgeLabels')}
                    >
                        Show edge labels
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={shouldZoom} onClick={toggleShouldZoom}>
                        Zoom automatically after transformation
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />

                    <DropdownMenuLabel className="font-semibold">
                        Positioning function&nbsp;
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <QuestionMarkCircleIcon className="inline w-4 h-4" />
                            </TooltipTrigger>
                            <TooltipProvider>
                                <TooltipContent>
                                    Function to use for positioning newly added nodes in the graph.
                                </TooltipContent>
                            </TooltipProvider>
                        </Tooltip>
                    </DropdownMenuLabel>
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

type GraphLoaderProps = ComponentPropsWithoutRef<'div'>;

function GraphLoader(props: GraphLoaderProps) {
    const { className, ...restProps } = props;

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
        <div className={cn('flex items-center w-[90%] md:w-[unset]', className)} {...restProps}>
            <label className="w-full inline-flex items-center gap-2">
                <span className="hidden md:inline text-sm min-w-fit">Graph from URL:</span>
                <Input
                    onInput={(ev) => setGraphUrl(ev.currentTarget.value)}
                    value={graphUrl}
                    onKeyDown={(ev) => ev.key === 'Enter' && submitUrlForLoad()}
                    className={cn('w-full md:w-sm rounded-r-none border-r-0', {
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
