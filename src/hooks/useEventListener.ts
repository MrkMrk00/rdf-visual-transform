import { useEffect } from "react";

export function useEventListener(
    target: EventTarget,
    eventName: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
) {
    useEffect(() => {
        if (target && target.addEventListener) {
            target.addEventListener(eventName, handler, options);
        }

        return () => {
            if (target && target.removeEventListener) {
                target.removeEventListener(eventName, handler, options);
            }
        };
    }, [target, eventName, handler, options]);
}
