import { useTransformationStore } from '@/stores/transformations';

export function TransformationsPanel() {
    const transformations = useTransformationStore(
        (store) => store.transformations,
    );

    return (
        <div className="w-full h-full bg-red-100 flex flex-col gap-2">
            {transformations.map((transformantion, index) => (
                <div key={`transformation-row-${index}`}>
                    {transformantion.name}
                </div>
            ))}
        </div>
    );
}
