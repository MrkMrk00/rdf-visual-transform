import { useTransformationsStore } from '@/store/transformations';
import { useTransformationsStackStore } from '@/store/transformationsStack';

export function TransformationsStack() {
    const stack = useTransformationsStackStore((store) => store.performed);
    const transformations = useTransformationsStore((store) => store.transformations);

    return (
        <aside className="w-full h-full min-w-md flex flex-col gap-2">
            {stack.map(({ id }, index) => (
                <div key={`${index}-${id}`}>{transformations.find((t) => t.id === id)?.name ?? 'unknown'}</div>
            ))}
        </aside>
    );
}
