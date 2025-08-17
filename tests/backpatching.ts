import * as templates from '@/sparql-templates';
import { GRAPH_DELETED, syncGraphWithStore } from '@/util/graph/graphology';
import { QueryEngine } from '@comunica/query-sparql';
import { Quad } from '@rdfjs/types';
import { DirectedGraph } from 'graphology';
import { DataFactory, Store } from 'n3';
import { beforeEach, describe, expect, it } from 'vitest';

const { quad, namedNode } = DataFactory;

function exampleNode(id: string) {
    return namedNode(`https://example.com/${id}`);
}

function templatedIRI(id: string) {
    return `<https://example.com/${id}>`;
}

function trippleToString(quad: Quad) {
    return `${quad.subject}-${quad.predicate}-${quad.object}`;
}

describe('backpathing from deleted', () => {
    let graph: DirectedGraph;
    let store: Store;
    const queryEngine = new QueryEngine();

    beforeEach(() => {
        graph = new DirectedGraph();
        store = new Store();
    });

    it('should move deleted nodes into the deleted graph', async () => {
        const profToSubject = quad(exampleNode('subjectA'), exampleNode('isTaughtBy'), exampleNode('profA'));
        store.add(profToSubject);

        const studentToSubject = quad(exampleNode('subjectA'), exampleNode('isAttendedBy'), exampleNode('studentA'));
        store.add(studentToSubject);

        syncGraphWithStore(graph, store);
        expect(graph.edges().length).toEqual(2);
        expect(graph.nodes().length).toEqual(3);

        let sparqlQuery = '';
        for (const template of templates.relationshipDereification()) {
            sparqlQuery += template.body({
                predicate0: templatedIRI('isTaughtBy'),
                predicate1: templatedIRI('isAttendedBy'),
                result: templatedIRI('studiesUnder'),
                delete: true,
            });

            sparqlQuery += '\n';
        }

        await queryEngine.queryVoid(sparqlQuery, {
            sources: [store],
        });

        syncGraphWithStore(graph, store);
        expect(graph.edges().length).toEqual(1);

        const deletedTripples = store.getQuads(null, null, null, GRAPH_DELETED);

        expect(deletedTripples.map(trippleToString))
            .contains(trippleToString(studentToSubject))
            .contains(trippleToString(profToSubject));
    });

    it('backpatches is from the deleted graph', () => {
    });
});
