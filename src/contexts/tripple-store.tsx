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
    graph: new DirectedGraph(),
});

async function loadDataIntoStore({ queryKey }: { queryKey: [string, GraphSettingsStore['graph']] }) {
    const [, graph] = queryKey;

    const store = new Store();
    if (!graph) {
        return store;
    }

    if ('data' in graph) {
        await rdfReader.readFromString(graph.data, 'text/turtle', (quad) => {
            store.addQuad(quad);
        });
    } else {
        await rdfReader.readFromUrl(graph.url, (quad) => {
            store.addQuad(quad);
        });
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
    });

    const { data: graph, error: graphError } = useQuery({
        queryKey: [store],
        queryFn: async () => {
            if (!store) {
                return new Graph({ type: 'directed', multi: true });
            }

            return GraphTransformer.createGraph(store);
        },
    });

    useEffect(() => {
        if (error) {
            toast(String(error));
        }

        if (graphError) {
            toast(String(graphError));
        }
    }, [error, graphError]);

    const context = useMemo(
        () => ({
            store: store ?? new Store(),
            isLoading,
            graph: graph ?? new Graph({ type: 'directed', multi: true }),
        }),
        [store, graph, isLoading],
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
