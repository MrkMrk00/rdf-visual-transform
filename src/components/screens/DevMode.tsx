import { AvailableTransformations } from '@/components/dev-mode/AvailableTransformations';
import { useTransformer } from '@/hooks/useTransformer';
import { useGraphSettings } from '@/store/graphSettings';
import { useTransformationsStore } from '@/store/transformations';
import { SparqlConsole } from './SparqlConsole';
import { Button } from '../ui/button';
import { Card, CardContent, CardTitle } from '../ui/card';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';

function PerformedTransformations() {
    const stack = useGraphSettings((store) => store.transformationsStack);
    const transformations = useTransformationsStore((store) => store.transformations);

    const { popTransformationsStack } = useTransformer();

    return (
        <Card>
            <CardTitle className="px-4">Performed transformations</CardTitle>
            <CardContent>
                {stack.length > 0 && (
                    <div className="w-full flex justify-end">
                        <Button onClick={popTransformationsStack} size="sm" variant="success">
                            Pop
                        </Button>
                    </div>
                )}

                {stack.length === 0 && <span>Nothing here...</span>}
                <ul className="flex flex-col gap-2">
                    {stack
                        .slice()
                        .reverse()
                        .map(({ id }, index) => (
                            <li key={`${id}-${index}`}>
                                {transformations.find((t) => t.id === id)?.name ?? 'unknown'}
                            </li>
                        ))}
                </ul>
            </CardContent>
        </Card>
    );
}

export function DevMode() {
    return (
        <ResizablePanelGroup
            className="inset-0 absolute z-30 pointer-events-auto backdrop-blur-md bg-black/20 p-4"
            direction="horizontal"
        >
            <ResizablePanel>
                <PerformedTransformations />
            </ResizablePanel>
            <ResizableHandle className="bg-transparent" />
            <ResizablePanel>
                <AvailableTransformations />
            </ResizablePanel>
            <ResizableHandle className="bg-transparent" />
            <ResizablePanel>
                <SparqlConsole />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
