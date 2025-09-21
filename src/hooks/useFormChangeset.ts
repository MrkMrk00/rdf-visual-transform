import { useEffect, useRef, useState } from 'react';

export function useFormChangeset(onSubmit: (data: Record<string, string | undefined>) => void) {
    const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const form = formRef.current;
        if (!form) {
            console.error('useFormChangeset :: form not bound');

            return;
        }

        function submitHandler(ev: Event) {
            const target = ev.currentTarget;
            if (!(target instanceof HTMLFormElement)) {
                return;
            }

            ev.preventDefault();
            if (changedFields.size <= 0) {
                return;
            }

            const formData = new FormData(target);
            const changedEntries: [string, string | undefined][] = [];

            for (const changedField of changedFields) {
                changedEntries.push([
                    changedField,
                    formData.has(changedField) ? String(formData.get(changedField)) : undefined,
                ]);
            }

            onSubmit(Object.fromEntries(changedEntries));
        }

        form.addEventListener('submit', submitHandler);

        return () => void form.removeEventListener('submit', submitHandler);
    }, [formRef, changedFields, onSubmit]);

    useEffect(() => {
        if (!formRef.current) {
            return;
        }

        const abortController = new AbortController();

        function changeListener(ev: Event) {
            const target = ev.target;

            if (!target || !(target instanceof HTMLInputElement)) {
                return;
            }

            if (ev.type === 'click' && target.type !== 'checkbox' && target.role !== 'checkbox') {
                return;
            }

            setChangedFields((prev) => new Set([...prev, target.name]));
        }

        formRef.current.addEventListener('change', changeListener, { signal: abortController.signal });
        formRef.current.addEventListener('input', changeListener, { signal: abortController.signal });
        formRef.current.addEventListener('click', changeListener, { signal: abortController.signal });

        return () => abortController.abort();
    }, [formRef]);

    return { formRef };
}
