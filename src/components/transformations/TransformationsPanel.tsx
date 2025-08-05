import {
    type Transformation,
    useTransformationsStore,
} from '@/stores/transformations';
import { useUiControlStore } from '@/stores/uiControl';
import { truncateText } from '@/util/ui/truncateText';
import { CodeBracketIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PlayIcon, XMarkIcon } from '@heroicons/react/24/solid';
import {
    forwardRef,
    Fragment,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import { toast } from 'sonner';
import { EditTransformation } from '../screens/EditTransformation';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

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
    const transformations = useTransformationsStore(
        (store) => store.transformations,
    );
    const close = useUiControlStore(
        (store) => store.toggleTransformationsPanel,
    );

    const transformationsByPattern = useMemo(
        () => partitionTransformations(transformations),
        [transformations],
    );

    const editModalRef = useRef<EditTransformationHandle>(null);
    const deleteModalRef = useRef<DeleteTransformationHandle>(null);

    return (
        <div className="relative w-full h-full bg-white flex flex-col gap-2">
            <EditTransformationModal ref={editModalRef} />
            <DeleteTransformationModal ref={deleteModalRef} />

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
                            {transformations.map((transformation, index) => (
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
                                                transformation.name,
                                                20,
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex gap-1 items-center h-full">
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                editModalRef.current?.open(
                                                    transformation.id,
                                                );
                                            }}
                                        >
                                            <CodeBracketIcon className="size-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                deleteModalRef.current?.open(
                                                    transformation.id,
                                                );
                                            }}
                                        >
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

type DeleteTransformationHandle = {
    open: (transformationId: Transformation['id']) => void;
};

const DeleteTransformationModal = forwardRef<DeleteTransformationHandle>(
    function DeteleTransformationModal(_, ref) {
        const [transformationId, setTransformationId] = useState<string | null>(
            null,
        );

        const doDelete = useTransformationsStore(
            (store) => store.deleteTransformation,
        );

        useImperativeHandle(
            ref,
            () => ({
                open: setTransformationId,
            }),
            [],
        );

        return (
            <Dialog
                open={transformationId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setTransformationId(null);
                    }
                }}
            >
                <DialogContent className="flex flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            Are you sure?
                        </DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this transformation?</p>
                    <DialogFooter className="flex w-full justify-end items-center">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setTransformationId(null);
                            }}
                        >
                            No, go back
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (transformationId) {
                                    doDelete(transformationId);
                                }

                                setTransformationId(null);
                            }}
                        >
                            Yes, delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    },
);

type EditTransformationHandle = {
    open: (transformationId: Transformation['id']) => void;
    close: () => void;
};

const EditTransformationModal = forwardRef<EditTransformationHandle>(
    function EditTransformationModal(_, ref) {
        const [transformationId, setTransformationId] = useState<string | null>(
            null,
        );

        useImperativeHandle(
            ref,
            () => ({
                open: setTransformationId,
                close: setTransformationId.bind(null, null),
            }),
            [],
        );

        return (
            <Dialog
                open={transformationId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setTransformationId(null);
                    }
                }}
            >
                <DialogContent>
                    <EditTransformation
                        onError={(errorMessage) => {
                            toast.error(errorMessage);
                        }}
                    />
                </DialogContent>
            </Dialog>
        );
    },
);
