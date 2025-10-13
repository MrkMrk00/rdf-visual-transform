import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebounced<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function useThrottledFunc<TFunc extends (...args: TArgs) => void, TArgs extends any[]>(
    func: TFunc,
    timeout: number = 200,
): (...args: TArgs) => void {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            const timeout = timeoutRef.current;
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [func, timeout]);

    return useCallback(
        (...args: TArgs) => {
            if (timeoutRef.current !== null) {
                return;
            }

            timeoutRef.current = setTimeout(() => {
                timeoutRef.current = null;
            }, timeout);

            func(...args);
        },
        [func, timeout],
    );
}
