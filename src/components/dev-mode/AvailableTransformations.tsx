import { useTransformer } from '@/hooks/useTransformer';
import { Transformation, TransformationPattern, useTransformationsStore } from '@/store/transformations';
import { cn } from '@/util/ui/shadcn';
import { truncateText } from '@/util/ui/truncateText';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { CodeBracketIcon, PlayIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useMemo, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardTitle } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { type DeleteTransformationHandle, DeleteTransformationModal } from './DeleteTransformationModal';
import { type EditTransformationHandle, EditTransformationModal } from './EditTransformationModal';

type PartitionedTransformations = Partial<Record<TransformationPattern, Transformation[]>>;

function partitionTransformations(transformations: Transformation[]) {
    const groups: PartitionedTransformations = {};
    for (const t of transformations) {
        if (!(t.patternName in groups)) {
            groups[t.patternName] = [];
        }

        groups[t.patternName]!.push(t);
    }

    return groups;
}

type TransformationRowProps = {
    transformation: Transformation;
    isLoading: boolean;

    onRun: (id: Transformation['id']) => void;
    onEdit: (id: Transformation['id']) => void;
    onDelete: (id: Transformation['id']) => void;
};

function TransformationRow(props: TransformationRowProps) {
    const { isLoading, transformation, onDelete, onEdit, onRun } = props;

    return (
        <li className="flex rounded-md border border-input p-2 shadow-xs items-center justify-between shrink-0">
            <div className="flex items-center w-full gap-1">
                <Button disabled={isLoading} variant="ghost" onClick={onRun.bind(null, transformation.id)}>
                    <PlayIcon />
                </Button>

                <span className="max-w-1/3 text-left text-sm">{truncateText(transformation.name, 20)}</span>
            </div>

            <div className="flex gap-1 items-center h-full">
                <Button variant="ghost" onClick={onEdit.bind(null, transformation.id)}>
                    <CodeBracketIcon className="size-5" />
                </Button>
                <Button variant="ghost" onClick={onDelete.bind(null, transformation.id)}>
                    <TrashIcon className="size-5" />
                </Button>
            </div>
        </li>
    );
}

export function AvailableTransformations() {
    const transformationsRaw = useTransformationsStore((store) => store.transformations);
    const [isLoading, setIsLoading] = useState(false);
    const { renderAndRun } = useTransformer();

    const transformationsByPattern = useMemo(() => partitionTransformations(transformationsRaw), [transformationsRaw]);
    const download = useTransformationsStore((store) => store.exportToJsonFile);

    const editModalRef = useRef<EditTransformationHandle>(null);
    const deleteModalRef = useRef<DeleteTransformationHandle>(null);

    function onRun(id: Transformation['id']) {
        // already transforming
        if (isLoading) {
            return;
        }

        const transformation = transformationsRaw.find((t) => t.id === id);
        if (!transformation) {
            return;
        }

        setIsLoading(true);
        renderAndRun(transformation).finally(() => setIsLoading(false));
    }

    return (
        <>
            <Card>
                <CardTitle className="px-4 w-full flex justify-between items-center">
                    <h3>Available transformations</h3>
                    {transformationsRaw.length > 0 && (
                        <Tooltip>
                            <TooltipTrigger>
                                <Button size="sm" type="button" variant="success" onClick={download}>
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipProvider>
                                <TooltipContent>Export as JSON</TooltipContent>
                            </TooltipProvider>
                        </Tooltip>
                    )}
                </CardTitle>
                <CardContent className="flex flex-col gap-2 overflow-auto">
                    {Object.entries(transformationsByPattern).map(([pattern, Transformations], index) => (
                        <section key={pattern} className={cn({ 'border-t': index !== 0 })}>
                            <span>{pattern}</span>
                            <ul>
                                {Transformations.map((transformation, index) => (
                                    <TransformationRow
                                        key={`transformation-${pattern}-${index}`}
                                        transformation={transformation}
                                        onRun={onRun}
                                        onDelete={(id) => deleteModalRef.current?.open(id)}
                                        onEdit={(id) => editModalRef.current?.open(id)}
                                        isLoading={false}
                                    />
                                ))}
                            </ul>
                        </section>
                    ))}
                </CardContent>
            </Card>

            <EditTransformationModal ref={editModalRef} />
            <DeleteTransformationModal ref={deleteModalRef} />
        </>
    );
}
