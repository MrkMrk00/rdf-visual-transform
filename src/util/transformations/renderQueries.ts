import type { TemplateOutput } from '@/sparql-templates';

export function renderQueries<T extends TemplateOutput[] = TemplateOutput[]>(
    template: T,
    data: Parameters<T[number]['body']>[0],
) {
    return Object.fromEntries(
        template
            .filter(
                (t) => `_${(t.header as Record<string, string>).name}` in data,
            )
            .map((t) => {
                return [(t.header as any).name as string, t.body(data as any)];
            }),
    );
}
