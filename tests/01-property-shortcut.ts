import { RdfReader } from '@/util/rdf-reader';
import { TripleStore } from '@/util/triple-store';
import type { Quad } from '@rdfjs/types';
import { beforeEach, describe, expect, it } from 'vitest';
import peopleGraph from '../example-data/people-graph.ttl?raw';

function readableFormatQuad(quad: Quad) {
    return [
        quad.subject.value.replace('http://example.org/university#', 'uni:'),
        quad.predicate.value.replace('http://example.org/university#', 'uni:'),
        quad.object.value.replace('http://example.org/university#', 'uni:'),
    ].join(' ');
}

describe('property shortcut pattern', () => {
    const reader = new RdfReader();
    let store!: TripleStore;

    beforeEach(async () => {
        store = new TripleStore();
        await reader.readFromString(peopleGraph, 'text/turtle', (quad) => {
            store.addQuad(quad);
        });
    });

    it('creates a property shortcut', async () => {
        const before = store.quads.map(readableFormatQuad);

        await store.queryVoid(`
            PREFIX uni: <http://example.org/university#>

            INSERT {
                ?student uni:studiesUnderProfessor ?professor .
            }

            WHERE {
                ?student uni:major ?course .
                ?professor uni:teaches ?course .
            }
        `);

        const after = store.quads.map(readableFormatQuad);
        const diff = after.filter((quad) => !before.includes(quad));

        console.log('diff', diff);

        expect(diff).toHaveLength(2);
        expect(diff).toContainEqual(
            'uni:Alice uni:studiesUnderProfessor uni:Bob',
        );
        expect(diff).toContainEqual(
            'uni:Charlie uni:studiesUnderProfessor uni:David',
        );
    });
});
