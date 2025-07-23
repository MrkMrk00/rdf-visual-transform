import { useGraphStore, type GraphSettingsStore } from '@/stores/graphSettings';
import { insertQuadIntoGraph } from '@/util/graphology';
import { RdfReader } from '@/util/rdf-reader';
import { useQuery } from '@tanstack/react-query';
import { DirectedGraph } from 'graphology';
import { circular } from 'graphology-layout';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { Store } from 'n3';
import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useMemo,
} from 'react';
import { toast } from 'sonner';

type StoreContext = { store: Store; isLoading: boolean; graph: DirectedGraph };

const trippleStoreContext = createContext<StoreContext>({
    store: new Store(),
    isLoading: true,
    graph: new DirectedGraph(),
});

async function loadDataIntoStore({
    queryKey,
}: {
    queryKey: [string, GraphSettingsStore['graph']];
}) {
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
    const graphDescriptor = useGraphStore((store) => store.graph);

    const {
        data: store,
        error,
        isLoading,
    } = useQuery({
        queryKey: ['rdf-graph', graphDescriptor],
        queryFn: loadDataIntoStore,
    });

    useEffect(() => {
        if (!error) {
            return;
        }

        toast(String(error));
    }, [error]);

    const graph = useMemo(() => {
        if (!store) {
            return new DirectedGraph();
        }

        const graph = new DirectedGraph();
        for (const quad of store) {
            insertQuadIntoGraph(graph, quad);
        }

        circular.assign(graph);

        const settings = forceAtlas2.inferSettings(graph);
        forceAtlas2.assign(graph, { ...settings, iterations: 5 });

        return graph;
    }, [store]);

    const context = useMemo(
        () => ({
            store: store ?? new Store(),
            isLoading,
            graph,
        }),
        [store, graph, isLoading],
    );

    return (
        <trippleStoreContext.Provider value={context}>
            {children}
        </trippleStoreContext.Provider>
    );
};

const rdfReader = new RdfReader();

export const useTripleStore = (): Readonly<Store> => {
    return useContext(trippleStoreContext).store;
};

export const useGraphIsLoading = (): boolean => {
    return useContext(trippleStoreContext).isLoading;
};

export const useGraphologyGraph = (): DirectedGraph => {
    return useContext(trippleStoreContext).graph;
};
