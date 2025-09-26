import { useTransformer } from '@/hooks/useTransformer';
import { cn } from '@/util/ui/shadcn';
import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';
import type { ComponentPropsWithoutRef } from 'react';

export type ZoomButtonsProps = ComponentPropsWithoutRef<'div'>;

export function ZoomButtons(props: ZoomButtonsProps) {
    const { className, ...restProps } = props;
    const { popTransformationsStack, runNextTransformation, canPopTransformation, canRunTransformation } =
        useTransformer();

    const buttonClass =
        'rounded-full shadow-md border bg-white hover:brightness-95 p-4 disabled:brightness-90 disabled:pointer-events-none';

    return (
        <div className={cn('flex flex-row items-center gap-2', className)} {...restProps}>
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
    );
}
