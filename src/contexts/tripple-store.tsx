import { useGraphSettings, type GraphSettingsStore } from '@/store/graphSettings';
import { RdfReader } from '@/util/rdf-reader';
import { GraphTransformer } from '@/util/transformations/GraphTransformer';
import { useQuery } from '@tanstack/react-query';
import Graph, { DirectedGraph } from 'graphology';
import { Store } from 'n3';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

const rdfReader = new RdfReader();

type StoreContext = { store: Store; isLoading: boolean; graph: DirectedGraph };

const trippleStoreContext = createContext<StoreContext>({
    store: new Store(),
    isLoading: true,
    graph: new Graph({ multi: true, type: 'directed' }),
});

class EmptyResponseError extends Error {
    name = 'EmptyResponseError';
    graph!: GraphSettingsStore['graph'];

    static create(graph: GraphSettingsStore['graph']) {
        const me = new this('could not load any tripples from graph (did you enter a correct URL?)');
        me.graph = graph;

        return me;
    }
}

async function loadDataIntoStore({ queryKey }: { queryKey: [string, GraphSettingsStore['graph']] }) {
    const [, graph] = queryKey;

    const store = new Store();
    if (!graph) {
        return store;
    }

    let didSomeDataLoad = false;
    if ('data' in graph) {
        await rdfReader.readFromString(graph.data, 'text/turtle', (quad) => {
            didSomeDataLoad = true;

            store.addQuad(quad);
        });
    } else {
        await rdfReader.readFromUrl(graph.url, (quad) => {
            didSomeDataLoad = true;

            store.addQuad(quad);
        });
    }

    if (!didSomeDataLoad) {
        throw EmptyResponseError.create(graph);
    }

    return store;
}

export const StoreProvider = ({ children }: PropsWithChildren) => {
    const graphDescriptor = useGraphSettings((store) => store.graph);

    const {
        data: store,
        error,
        isLoading,
    } = useQuery({
        queryKey: ['rdf-graph', graphDescriptor],
        queryFn: loadDataIntoStore,
        retry: (failureCount, error) => {
            if (error instanceof EmptyResponseError) {
                return false;
            }

            return failureCount < 2;
        },
    });

    const {
        data: graph,
        error: graphError,
        isLoading: isStoreLoading,
    } = useQuery({
        queryKey: ['rdf-store-context', store],
        queryFn: async () => {
            if (!store) {
                return new Graph({ type: 'directed', multi: true });
            }

            return GraphTransformer.createGraph(store);
        },
        retry: false,
    });

    useEffect(() => {
        if (error) {
            toast.error(String(error));
        }

        if (graphError) {
            toast.error(String(graphError));
        }
    }, [error, graphError]);

    const context = useMemo(
        () => ({
            store: store ?? new Store(),
            isLoading: isLoading || isStoreLoading,
            graph: graph ?? new Graph({ type: 'directed', multi: true }),
        }),
        [store, graph, isLoading, isStoreLoading],
    );

    return <trippleStoreContext.Provider value={context}>{children}</trippleStoreContext.Provider>;
};

export const useTripleStore = (): Readonly<Store> => {
    return useContext(trippleStoreContext).store;
};

export const useGraphIsLoading = (): boolean => {
    return useContext(trippleStoreContext).isLoading;
};

export const useGraphologyGraph = (): DirectedGraph => {
    return useContext(trippleStoreContext).graph;
};
