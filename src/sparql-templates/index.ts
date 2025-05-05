import { compile } from "handlebars";
import propertyChainShortcutTemplate from "./01-property-shortcut.hbs?raw";

export type PropertyChainShortcutOpts = {
    prefixes?: string[];

    predicate0: string;
    predicate1: string;
    result: string;

    delete: boolean;
};

export const propertyChainShortcut: (opts: PropertyChainShortcutOpts) => string =
    compile(propertyChainShortcutTemplate);
