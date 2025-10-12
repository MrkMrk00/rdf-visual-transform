declare global {
    type ValueOf<T extends object> = T[keyof T];
}

export {};
