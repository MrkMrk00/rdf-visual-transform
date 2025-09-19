import { ANONYMOUS_IRI, GRAPH_DELETED } from '@/util/graph/backpatching';
import { syncGraphWithStore } from '@/util/graph/graphology';
import { renderTemplate } from '@/util/transformations/renderTemplate';
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
    return `${quad.subject.value}-${quad.predicate.value}-${quad.object.value}`;
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

        const sparqlQuery = renderTemplate('relationshipDereification', {
            predicate0: templatedIRI('isTaughtBy'),
            predicate1: templatedIRI('isAttendedBy'),
            result: templatedIRI('studiesUnder'),
            delete: true,
        });

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

    it('backpatches is from the deleted graph', async () => {
        store.add(quad(exampleNode('subjectA'), exampleNode('isTaughtBy'), exampleNode('profA')));
        store.add(quad(exampleNode('subjectA'), exampleNode('isAttendedBy'), exampleNode('studentA')));
        syncGraphWithStore(graph, store);

        const sparqlQuery = renderTemplate('relationshipDereification', {
            predicate0: templatedIRI('isTaughtBy'),
            predicate1: templatedIRI('isAttendedBy'),
            result: templatedIRI('studiesUnder'),
            delete: true,
        });

        await queryEngine.queryVoid(sparqlQuery, {
            sources: [store],
        });

        syncGraphWithStore(graph, store);
    });

    it('deleted nodes from inverse transformation gets backpatched', async () => {
        const profToSubject = quad(exampleNode('subjectA'), exampleNode('isTaughtBy'), exampleNode('profA'));
        store.add(profToSubject);

        const studentToSubject = quad(exampleNode('subjectA'), exampleNode('isAttendedBy'), exampleNode('studentA'));
        store.add(studentToSubject);

        syncGraphWithStore(graph, store);

        const sparqlQuery = renderTemplate('relationshipDereification', {
            predicate0: templatedIRI('isTaughtBy'),
            predicate1: templatedIRI('isAttendedBy'),
            result: templatedIRI('studiesUnder'),
            delete: true,
        });

        await queryEngine.queryVoid(sparqlQuery, {
            sources: [store],
        });
        syncGraphWithStore(graph, store);

        // The old nodes should be included inside the deleted graph now...
        // An inverse transformations should be able to backpatch them.

        const inverseTransfQuery = renderTemplate('relationshipReification', {
            newSubject: `<${ANONYMOUS_IRI}>`, // signal, that it should be backpatched
            predicate0: templatedIRI('isTaughtBy'),
            predicate1: templatedIRI('isAttendedBy'),
            shortcut: templatedIRI('studiesUnder'), // renamed from `result`
            delete: true,
        });

        await queryEngine.queryVoid(inverseTransfQuery, {
            sources: [store],
        });

        const anonymousTripples = store
            .getQuads(ANONYMOUS_IRI, null, null, DataFactory.defaultGraph())
            .map(trippleToString);

        // Anonymous nodes were inserted as placeholders for the "backpatching alghorithm".
        expect(anonymousTripples)
            .length(2)
            .contains(
                trippleToString(quad(namedNode(ANONYMOUS_IRI), exampleNode('isAttendedBy'), exampleNode('studentA'))),
            )
            .contains(trippleToString(quad(namedNode(ANONYMOUS_IRI), exampleNode('isTaughtBy'), exampleNode('profA'))));

        syncGraphWithStore(graph, store);

        // no anonymous tripples remanining
        expect(store.getQuads(ANONYMOUS_IRI, null, null, null)).length(0);

        // the original data wasn't lost
        expect(store.getQuads(null, null, null, null).map(trippleToString))
            .contains(trippleToString(profToSubject))
            .contains(trippleToString(studentToSubject));
    });
});
