import { compile } from 'handlebars';
import { load } from 'js-yaml';
import propertyChainShortcutTemplate from './01-property-shortcut.hbs?raw';
import linkCountingPropertyTemplate from './06-link-counting-property.hbs?raw';

export type PropertyChainShortcutOpts = {
    prefixes?: string[];

    predicate0: string;
    predicate1: string;
    result: string;

    delete: boolean;
};

export const propertyChainShortcut =
    (): TemplateOutput<PropertyChainShortcutOpts>[] =>
        parseTemplate(propertyChainShortcutTemplate);

export type LinkCountingPropertyOpts = {
    newProperty: string;
    sourceProperty: string;
};

export const linkCountingProperty =
    (): TemplateOutput<LinkCountingPropertyOpts>[] =>
        parseTemplate(linkCountingPropertyTemplate);

export type TemplateOutput<TOpts extends object = object> = {
    header: object;
    body: (opts: TOpts) => string;
};

function parseTemplate(rawOutput: string) {
    const subtempltes = rawOutput
        .trim()
        .split('---')
        .map((sub) => sub.trim())
        .filter(Boolean);

    const templates: TemplateOutput[] = [];

    for (const sub of subtempltes) {
        let header: TemplateOutput['header'] = {};
        let body = '';

        for (let i = 0; i < sub.length - 1; i++) {
            if (sub[i] === '\n' && sub[i + 1] === '\n') {
                const headerSource = sub.slice(0, i + 1).trim();

                header = load(headerSource) as any;
                body = sub.slice(i + 2).trim();

                break;
            }
        }

        templates.push({
            header,
            body: (opts) => compile(body)(opts),
        });
    }

    return templates;
}
