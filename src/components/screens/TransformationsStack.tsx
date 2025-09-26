import { useGraphSettings } from '@/store/graphSettings';
import { useTransformationsStore } from '@/store/transformations';

export function TransformationsStack() {
    const stack = useGraphSettings((store) => store.transformationsStack);
    const transformations = useTransformationsStore((store) => store.transformations);

    return (
        <aside className="w-full h-full min-w-md flex flex-col gap-2">
            {stack.map(({ id }, index) => (
                <div key={`${index}-${id}`}>{transformations.find((t) => t.id === id)?.name ?? 'unknown'}</div>
            ))}
        </aside>
    );
}
