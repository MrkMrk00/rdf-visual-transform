import { useTransformer } from '@/hooks/useTransformer';
import * as templates from '@/sparql-templates';
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
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';

const highlighterPromise = createHighlighter({
    themes: ['github-light'],
    langs: ['sparql'],
});

loader.config({ monaco });

export function SparqlConsole() {
    const highlighter = use(highlighterPromise);
    const close = useUiControlStore((store) => store.toggleSparqlConsole);

    const [chosenPatternName, setChosenPatternName] = useState<
        keyof typeof templates
    >('propertyChainShortcut');

    const queryTemplateNames = useMemo(() => {
        const templ = templates[chosenPatternName]();
        const queryNames = templ.map(
            (t) => (t.header as Record<string, string>).name ?? '<unknown>',
        );

        return queryNames;
    }, [chosenPatternName]);

    const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const { update } = useTransformer();

    function initMonaco(monaco: MonacoInstance) {
        monaco.languages.register({ id: 'sparql' });

        shikiToMonaco(highlighter, monaco);
    }

    function editorMount(editor: Monaco.editor.IStandaloneCodeEditor) {
        editorRef.current = editor;
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
                    <form
                        className="h-full flex flex-col gap-2"
                        onSubmit={(ev) => {
                            ev.preventDefault();

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const data = Object.fromEntries(
                                new FormData(ev.currentTarget),
                            ) as Record<string, any>;

                            const templs = templates[chosenPatternName]()
                                .filter(
                                    (t) =>
                                        (t.header as Record<string, string>)
                                            .name in data,
                                )
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                .map((t) => t.body(data as any))
                                .join('\n');

                            editorRef.current?.setValue(templs);
                        }}
                    >
                        <div className="font-bold text-xl">
                            {chosenPatternName}
                        </div>

                        {chosenPatternName === 'propertyChainShortcut' && (
                            <>
                                <Input name="result" placeholder="result" />
                                <Input
                                    name="predicate0"
                                    placeholder="predicate0"
                                />
                                <Input
                                    name="predicate1"
                                    placeholder="predicate1"
                                />
                            </>
                        )}

                        {chosenPatternName === 'linkCountingProperty' && (
                            <>
                                <Input
                                    name="newProperty"
                                    placeholder="newProperty"
                                />
                                <Input
                                    name="sourceProperty"
                                    placeholder="sourceProperty"
                                />
                            </>
                        )}

                        {queryTemplateNames.map((templateName) => (
                            <label
                                key={`template-${templateName}`}
                                className="text-center inline-flex items-center gap-2"
                            >
                                {templateName}:
                                <Checkbox name={templateName} />
                            </label>
                        ))}

                        <Button type="submit">Compile template</Button>
                    </form>

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
                        <Button onClick={() => {}} variant="secondary">
                            Save
                        </Button>
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
