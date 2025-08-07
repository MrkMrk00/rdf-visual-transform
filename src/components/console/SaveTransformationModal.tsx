import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DialogDescription } from '@radix-ui/react-dialog';
import { ReactNode, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export type SaveTransformationModalProps = {
    children: ReactNode;
    onSubmit?: (name: string) => void;
};

export function SaveTransformationModal({ children, ...props }: SaveTransformationModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const close = setIsOpen.bind(null, false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save transformation</DialogTitle>
                    {error !== null && <DialogDescription className="text-red-500">{error}</DialogDescription>}
                </DialogHeader>
                <form
                    className="flex flex-col gap-2"
                    onSubmit={(ev) => {
                        ev.preventDefault();

                        const name = new FormData(ev.currentTarget).get('name') as string;

                        if (!name) {
                            setError('A transformation must have a valid name.');

                            return;
                        }

                        if (props.onSubmit) {
                            props.onSubmit(name);
                        }

                        close();
                    }}
                >
                    <Input name="name" placeholder="Transformation name" />
                    <DialogFooter>
                        <Button type="submit">Save transformation</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
