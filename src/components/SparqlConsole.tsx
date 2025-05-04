import { useTripleStore } from "@/stores/graphSettings";
import { useUiControlStore } from "@/stores/uiControl";
import { QueryEngine } from "@comunica/query-sparql";
import { XMarkIcon } from "@heroicons/react/20/solid";
import MonacoEditor, { type Monaco as MonacoInstance } from "@monaco-editor/react";
import { shikiToMonaco } from "@shikijs/monaco";
import type Monaco from "monaco-editor";
import { use, useRef } from "react";
import { createHighlighter } from "shiki";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";

const highlighterPromise = createHighlighter({
    themes: ["github-light"],
    langs: ["sparql"],
});

const propertyChainShortcut = `\
PREFIX uni: <http://example.org/university#>
INSERT {
    ?student uni:studiesUnderProfessor ?professor .
}
WHERE {
    ?student uni:major ?course .
    ?professor uni:teaches ?course .
}`;

const queryEngine = new QueryEngine();
function useSparqlEngine() {
    const { data: store } = useTripleStore();

    return {
        queryVoid: (query: string) => {
            if (!store) {
                throw new Error("No store available");
            }

            const result = queryEngine.queryVoid(query, {
                sources: [store],
            });

            result.then(() => {
                document.body.dispatchEvent(new Event("rdf.rerender"));
            });

            return result;
        },
    };
}

export function SparqlConsole() {
    const highlighter = use(highlighterPromise);
    const close = useUiControlStore((store) => store.toggleSparqlConsole);
    const { queryVoid } = useSparqlEngine();

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
                    <MonacoEditor
                        defaultLanguage="sparql"
                        height="80%"
                        theme="github-light"
                        beforeMount={initMonaco}
                        onMount={editorMount}
                    />

                    <div className="flex flex-col gap-2 h-full">
                        <Button
                            variant="success"
                            onClick={() => {
                                queryVoid(editorRef.current?.getValue() ?? "");
                            }}
                        >
                            Execute
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

                            editorRef.current.setValue(propertyChainShortcut);
                        }}
                    >
                        property chain shortcut
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
