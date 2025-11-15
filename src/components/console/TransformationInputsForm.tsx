import type { TemplateOutput } from '@/sparql-templates';
import { forwardRef, HTMLAttributes, useMemo } from 'react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';

export type TransformationInputsFormProps = HTMLAttributes<HTMLFormElement> & {
    title: string;
    templates: Pick<TemplateOutput, 'header'>[];
};

export const TransformationInputsForm = forwardRef<HTMLFormElement, TransformationInputsFormProps>(
    function TransformationInputsForm(props, ref) {
        const { title, templates, ...formProps } = props;

        const subtemplateNames = useMemo(() => {
            return templates
                .map((template) => {
                    if (!('name' in template.header) || typeof template.header.name !== 'string') {
                        return null;
                    }

                    return template.header.name;
                })
                .filter(Boolean as unknown as (p: unknown) => p is string);
        }, [templates]);

        const fields = useMemo(() => {
            const allInputs = templates.flatMap((template) => {
                if (!('inputs' in template.header) || !Array.isArray(template.header.inputs)) {
                    return [];
                }

                return (template.header.inputs ?? []) as { name: string }[];
            });

            return Array.from(new Set(allInputs.map((input) => input.name)));
        }, [templates]);

        return (
            <div className="flex flex-col gap-2 shrink-0 px-4">
                <div className="font-bold text-xl">{title}</div>

                <form {...formProps} className="flex flex-col gap-2" ref={ref}>
                    {fields.map((name) => (
                        <Input key={`form-field-input-${name}`} placeholder={name} name={name} />
                    ))}
                    <hr />
                    {subtemplateNames.map((subtemplName) => (
                        <label className="flex items-center gap-2" key={`subtempl-name-${subtemplName}`}>
                            {subtemplName}:
                            <Checkbox defaultChecked name={`_${subtemplName}`} />
                        </label>
                    ))}

                    <Button type="submit">Compile</Button>
                </form>
            </div>
        );
    },
);
