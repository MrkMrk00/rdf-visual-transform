import * as templates from "@/sparql-templates";
import { useUiControlStore } from "@/stores/uiControl";
import { XMarkIcon } from "@heroicons/react/20/solid";
import MonacoEditor, { type Monaco as MonacoInstance } from "@monaco-editor/react";
import { shikiToMonaco } from "@shikijs/monaco";
import type Monaco from "monaco-editor";
import { use, useRef, useState } from "react";
import { createHighlighter } from "shiki";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";

const highlighterPromise = createHighlighter({
    themes: ["github-light"],
    langs: ["sparql"],
});

export function SparqlConsole() {
    const highlighter = use(highlighterPromise);
    const close = useUiControlStore((store) => store.toggleSparqlConsole);

    const [chosenPattern, setChosenPattern] = useState<keyof typeof templates>("propertyChainShortcut");

    const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

    function initMonaco(monaco: MonacoInstance) {
        monaco.languages.register({ id: "sparql" });

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
                            const data = Object.fromEntries(new FormData(ev.currentTarget)) as Record<string, any>;
                            data["delete"] = !!data["delete"];

                            editorRef.current?.setValue(
                                templates.propertyChainShortcut(data as unknown as templates.PropertyChainShortcutOpts),
                            );
                        }}
                    >
                        <div className="font-bold text-xl">{chosenPattern}</div>
                        <Input name="result" placeholder="result" />
                        <Input name="predicate0" placeholder="predicate0" />
                        <Input name="predicate1" placeholder="predicate1" />
                        <label className="text-center inline-flex items-center gap-2">
                            Delete:
                            <Checkbox name="delete" />
                        </label>

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
                        <Button variant="success">Execute</Button>
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

                            setChosenPattern("propertyChainShortcut");
                        }}
                    >
                        property chain shortcut
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
