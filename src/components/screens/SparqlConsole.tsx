import { useTransformer } from '@/hooks/useTransformer';
import * as templates from '@/sparql-templates';
import { useTransformationsStore } from '@/store/transformations';
import { renderTemplate } from '@/util/transformations/renderTemplate';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { SaveTransformationModal } from '../console/SaveTransformationModal';
import { TransformationInputsForm } from '../console/TransformationInputsForm';
import type { EditorHandle } from '../SparqlEditor';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';

const SparqlEditor = lazy(() =>
    import('../SparqlEditor').then(({ SparqlEditor }) => ({
        default: SparqlEditor,
    })),
);

export function SparqlConsole({ close }: { close?: VoidFunction }) {
    const saveTransformation = useTransformationsStore((store) => store.saveTransformation);

    const [chosenPatternName, setChosenPatternName] = useState<keyof typeof templates>('propertyChainShortcut');

    const templ = useMemo(() => templates[chosenPatternName](), [chosenPatternName]);

    const formRef = useRef<HTMLFormElement>(null);
    const { update } = useTransformer();

    const editorRef = useRef<EditorHandle>(undefined);

    return (
        <Card className="@container h-full">
            <CardHeader className="flex items-center justify-between">
                <span>SPARQL Console</span>
                {typeof close !== 'undefined' && (
                    <Button variant="ghost" size="icon" onClick={close}>
                        <XMarkIcon className="h-8 w-8" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex flex-col gap-4 h-full">
                <div className="flex flex-col @xl:flex-row gap-4 items-center w-full h-full">
                    <div className="h-full w-full @xl:w-[unset]">
                        <TransformationInputsForm
                            ref={formRef}
                            title={chosenPatternName}
                            templates={templ}
                            onSubmit={(ev) => {
                                ev.preventDefault();

                                const data = Object.fromEntries(new FormData(ev.currentTarget));
                                const queries = renderTemplate(chosenPatternName, data as any);

                                editorRef.current?.setValue(queries);
                            }}
                        />
                    </div>

                    <div className="w-full h-full rounded-xl overflow-hidden shadow-sm p-2">
                        <Suspense fallback={<div className="w-full"></div>}>
                            <SparqlEditor ref={editorRef} height="80%" />
                        </Suspense>
                    </div>

                    <div className="flex flex-col gap-2 h-full">
                        <Button
                            onClick={() => {
                                update(editorRef.current?.getValue() ?? '');
                            }}
                            variant="success"
                        >
                            Execute
                        </Button>
                        <SaveTransformationModal
                            onSubmit={(name) => {
                                if (!formRef.current) {
                                    return;
                                }

                                saveTransformation(
                                    name,
                                    chosenPatternName,
                                    Object.fromEntries(new FormData(formRef.current)) as any,
                                );
                            }}
                        >
                            <Button variant="secondary">Save</Button>
                        </SaveTransformationModal>
                    </div>
                </div>

                <div className="flex gap-2 items-center shrink-0 overflow-x-scroll">
                    <span className="pr-4">Load</span>
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (!editorRef.current) {
                                return;
                            }

                            setChosenPatternName('propertyChainShortcut');
                        }}
                    >
                        property chain shortcut
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => {
                            if (!editorRef.current) {
                                return;
                            }

                            setChosenPatternName('relationshipDereification');
                        }}
                    >
                        relationship dereification
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => {
                            if (!editorRef.current) {
                                return;
                            }

                            setChosenPatternName('linkCountingProperty');
                        }}
                    >
                        link counting property
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => {
                            if (!editorRef.current) {
                                return;
                            }

                            setChosenPatternName('inlinkCountingProperty');
                        }}
                    >
                        in-link counting property
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
