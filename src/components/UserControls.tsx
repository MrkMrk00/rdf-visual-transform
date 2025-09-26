import { useTransformer } from '@/hooks/useTransformer';
import { cn } from '@/util/ui/shadcn';
import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';
import type { ComponentPropsWithoutRef } from 'react';
import { Button } from './ui/button';

export type UserControlsProps = ComponentPropsWithoutRef<'div'>;

export function UserControls(props: UserControlsProps) {
    const { className, ...restProps } = props;
    const { popTransformationsStack, runNextTransformation, canPopTransformation, canRunTransformation, adjustLayout } =
        useTransformer();

    const buttonClass =
        'rounded-full shadow-md border bg-white hover:brightness-95 p-4 disabled:brightness-90 disabled:pointer-events-none';

    return (
        <div className={cn('flex flex-col gap-2', className)} {...restProps}>
            <div className="flex justify-end w-full">
                <Button type="button" variant="outline" onClick={() => adjustLayout()}>
                    Adjust layout
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <button
                    disabled={!canPopTransformation()}
                    className={buttonClass}
                    type="button"
                    onClick={popTransformationsStack}
                >
                    <MagnifyingGlassMinusIcon className="h-8 w-8" />
                </button>

                <button
                    disabled={!canRunTransformation()}
                    className={buttonClass}
                    type="button"
                    onClick={runNextTransformation}
                >
                    <MagnifyingGlassPlusIcon className="h-8 w-8" />
                </button>
            </div>
        </div>
    );
}
