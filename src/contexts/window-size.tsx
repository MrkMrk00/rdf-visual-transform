import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useState,
} from 'react';

const windowWidthContext = createContext<number>(window.innerWidth);

const MOBILE_BREAKPOINT_PX = 768;

export function WindowSizeProvider({ children }: PropsWithChildren) {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;

        const onResize = (ev: Event) => {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }

            const newWidth = (ev.target as Window).innerWidth;

            timeout = setTimeout(() => {
                setWidth(newWidth);
            }, 200);
        };

        window.addEventListener('resize', onResize);
        return () => {
            if (timeout !== null) {
                clearTimeout(timeout);
                timeout = null;
            }

            window.removeEventListener('resize', onResize);
        };
    }, []);

    return (
        <windowWidthContext.Provider value={width}>
            {children}
        </windowWidthContext.Provider>
    );
}

export function useIsMobile() {
    return useContext(windowWidthContext) <= MOBILE_BREAKPOINT_PX;
}
