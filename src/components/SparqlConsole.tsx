import { useTransformer } from '@/hooks/useTransformer';
import * as templates from '@/sparql-templates';
import { useTransformationStore } from '@/stores/transformations';
import { useUiControlStore } from '@/stores/uiControl';
import { XMarkIcon } from '@heroicons/react/20/solid';
import MonacoEditor, {
    type Monaco as MonacoInstance,
    loader,
} from '@monaco-editor/react';
import { shikiToMonaco } from '@shikijs/monaco';
import type Monaco from 'monaco-editor';
import * as monaco from 'monaco-editor';
import { use, useMemo, useRef, useState } from 'react';
import { createHighlighter } from 'shiki';
import { SaveTransformationModal } from './console/SaveTransformationModal';
import { TransformationInputsForm } from './console/TransformationInputsForm';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';

const highlighterPromise = createHighlighter({
    themes: ['github-light'],
    langs: ['sparql'],
});

loader.config({ monaco });

export function SparqlConsole() {
    const highlighter = use(highlighterPromise);
    const close = useUiControlStore((store) => store.toggleSparqlConsole);
    const saveTransformation = useTransformationStore(
        (store) => store.saveTransformation,
    );

    const [chosenPatternName, setChosenPatternName] = useState<
        keyof typeof templates
    >('propertyChainShortcut');

    const templ = useMemo(
        () => templates[chosenPatternName](),
        [chosenPatternName],
    );

    const formRef = useRef<HTMLFormElement>(null);
    const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const { update } = useTransformer();

    function initMonaco(monaco: MonacoInstance) {
        monaco.languages.register({ id: 'sparql' });

        shikiToMonaco(highlighter, monaco);
    }

    function editorMount(editor: Monaco.editor.IStandaloneCodeEditor) {
        editorRef.current = editor;
    }

    function renderQueries<T extends typeof templ = typeof templ>(
        template: T,
        data: Parameters<T[number]['body']>[0],
    ) {
        return Object.fromEntries(
            template
                .filter(
                    (t) => (t.header as Record<string, string>).name in data,
                )
                .map((t) => {
                    return [
                        (t.header as any).name as string,
                        t.body(data as any),
                    ];
                }),
        );
    }

    return (
        <Card className="h-full">
            <CardHeader className="flex items-center justify-between">
                <span>SPARQL Console</span>
                <Button variant="ghost" size="icon" onClick={close}>
                    <XMarkIcon className="h-8 w-8" />
                </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 h-full">
                <div className="flex gap-4 items-center w-full h-full">
                    <TransformationInputsForm
                        ref={formRef}
                        title={chosenPatternName}
                        templates={templ}
                        onSubmit={(ev) => {
                            ev.preventDefault();

                            const data = Object.fromEntries(
                                new FormData(ev.currentTarget),
                            );

                            const queries = renderQueries(templ, data as any);

                            editorRef.current?.setValue(
                                Object.values(queries).join('\n'),
                            );
                        }}
                    />

                    <MonacoEditor
                        defaultLanguage="sparql"
                        height="80%"
                        theme="github-light"
                        beforeMount={initMonaco}
                        onMount={editorMount}
                    />

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
                                    renderQueries(
                                        templ,
                                        Object.entries(
                                            new FormData(formRef.current),
                                        ) as any,
                                    ),
                                );
                            }}
                        >
                            <Button variant="secondary">Save</Button>
                        </SaveTransformationModal>
                    </div>
                </div>

                <div className="flex gap-2 items-center shrink-0">
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

                            setChosenPatternName('linkCountingProperty');
                        }}
                    >
                        link counting property
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
