import {
    EditorProps,
    Editor as MonacoEditor,
    type Monaco as MonacoInstance,
    loader,
} from '@monaco-editor/react';
import { shikiToMonaco } from '@shikijs/monaco';
import type Monaco from 'monaco-editor';
import * as monaco from 'monaco-editor';
import { forwardRef, use, useImperativeHandle, useState } from 'react';
import { createHighlighter } from 'shiki';

const highlighterPromise = createHighlighter({
    themes: ['github-light'],
    langs: ['sparql'],
});

loader.config({ monaco });

type SparqlEditorProps = Omit<
    EditorProps,
    'defaultLanguage' | 'theme' | 'beforeMount' | 'onMount'
>;

export type EditorHandle = Monaco.editor.IStandaloneCodeEditor | undefined;

export const SparqlEditor = forwardRef<
    Monaco.editor.IStandaloneCodeEditor | undefined,
    SparqlEditorProps
>(function SparqlEditor(props, ref) {
    const highlighter = use(highlighterPromise);
    const [editor, setEditor] = useState<EditorHandle>(undefined);

    useImperativeHandle(ref, () => editor, [editor]);

    function initMonaco(monaco: MonacoInstance) {
        monaco.languages.register({ id: 'sparql' });

        shikiToMonaco(highlighter, monaco);
    }

    return (
        <MonacoEditor
            {...props}
            defaultLanguage="sparql"
            theme="github-light"
            beforeMount={initMonaco}
            onMount={setEditor}
        />
    );
});
