import { Transformation } from '@/store/transformations';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { toast } from 'sonner';
import { EditTransformation } from '../screens/EditTransformation';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';

export type EditTransformationHandle = {
    open: (transformationId: Transformation['id']) => void;
    close: () => void;
};

export const EditTransformationModal = forwardRef<EditTransformationHandle>(function EditTransformationModal(_, ref) {
    const [transformationId, setTransformationId] = useState<string | null>(null);

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
                <DialogTitle>Edit transformation</DialogTitle>
                {transformationId && (
                    <EditTransformation
                        onError={(errorMessage) => {
                            toast.error(errorMessage);
                        }}
                        transformationId={transformationId}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
});
