import * as templates from '@/sparql-templates';

export function renderTemplate<TTemplate extends keyof typeof templates>(
    template: TTemplate,
    opts: Parameters<ReturnType<(typeof templates)[TTemplate]>[number]['body']>[0],
) {
    let sparql = '';
    for (const subTemplate of templates[template]()) {
        const header = subTemplate.header;

        if (!('name' in header) || !(`_${header.name}` in opts)) {
            continue;
        }

        sparql += subTemplate.body(opts as any);
        sparql += '\n';
    }

    return sparql;
}
