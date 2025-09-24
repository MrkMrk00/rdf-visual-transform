import { Transformation, useTransformationsStore } from "@/store/transformations";
import { forwardRef, useImperativeHandle, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

export type DeleteTransformationHandle = {
    open: (transformationId: Transformation['id']) => void;
};

export const DeleteTransformationModal = forwardRef<DeleteTransformationHandle>(function DeteleTransformationModal(_, ref) {
    const [transformationId, setTransformationId] = useState<string | null>(null);

    const doDelete = useTransformationsStore((store) => store.deleteTransformation);

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
                    <DialogTitle className="text-xl font-bold">Are you sure?</DialogTitle>
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
});
