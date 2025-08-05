import {
    type Transformation,
    useTransformationStore,
} from '@/stores/transformations';
import { useUiControlStore } from '@/stores/uiControl';
import { truncateText } from '@/util/ui/truncateText';
import { CodeBracketIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PlayIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Fragment, useMemo } from 'react';
import { Button } from '../ui/button';

type PartitionedTransformations = Partial<
    Record<Transformation['meta']['patternName'], Transformation[]>
>;

function partitionTransformations(transformations: Transformation[]) {
    const groups: PartitionedTransformations = {};
    for (const t of transformations) {
        if (!(t.meta.patternName in groups)) {
            groups[t.meta.patternName] = [];
        }

        groups[t.meta.patternName]!.push(t);
    }

    return groups;
}

export function TransformationsPanel() {
    const transformations = useTransformationStore(
        (store) => store.transformations,
    );
    const close = useUiControlStore(
        (store) => store.toggleTransformationsPanel,
    );

    const transformationsByPattern = useMemo(
        () => partitionTransformations(transformations),
        [transformations],
    );

    return (
        <div className="relative w-full h-full bg-white flex flex-col gap-2">
            {/* TODO: style -> not to cover up the UI under */}
            <div className="absolute right-0 top-0 px-2">
                <Button variant="ghost" onClick={close} type="button">
                    <XMarkIcon />
                </Button>
            </div>

            {Object.entries(transformationsByPattern).map(
                ([patternName, transformations], index) => (
                    <Fragment key={`transformation-group-${index}`}>
                        <h2 className="font-bold text-center py-2">
                            {patternName}
                        </h2>

                        <ul className="flex flex-col gap-2 px-2">
                            {transformations.map((transformantion, index) => (
                                <li
                                    className="flex rounded-md border border-input p-2 shadow-xs items-center justify-between shrink-0"
                                    key={`transformation-row-${index}`}
                                >
                                    <div className="flex items-center w-full gap-1">
                                        <Button variant="ghost">
                                            <PlayIcon />
                                        </Button>
                                        <span className="max-w-1/3 text-left text-sm">
                                            {truncateText(
                                                transformantion.name,
                                                20,
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex gap-1 items-center h-full">
                                        <Button variant="ghost">
                                            <CodeBracketIcon className="size-5" />
                                        </Button>
                                        <Button variant="ghost">
                                            <TrashIcon className="size-5" />
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <hr />
                    </Fragment>
                ),
            )}
        </div>
    );
}
