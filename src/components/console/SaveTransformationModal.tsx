import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ReactNode } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export type SaveTransformationModalProps = {
    children: ReactNode;
    onSubmit?: (name: string) => void;
};

export function SaveTransformationModal({
    children,
    ...props
}: SaveTransformationModalProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save transformation</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(ev) => {
                        ev.preventDefault();

                        if (props.onSubmit) {
                            const name = new FormData(ev.currentTarget).get(
                                'name',
                            ) as string;

                            props.onSubmit(name);
                        }
                    }}
                >
                    <Input name="name" placeholder="Transformation name" />
                </form>
                <DialogFooter>
                    <Button>Save transformation</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
