import { RdfReader } from "@/util/rdf-reader";
import { useQuery } from "@tanstack/react-query";
import { Store } from "n3";
import { create } from "zustand";

type GraphSettingsStore = {
    graphUrl: string;

    updateGraphUrl: (maybeGraphUrl: string) => void;
};

export const useGraphStore = create<GraphSettingsStore>()((set) => ({
    graphUrl: "https://data.cityofnewyork.us/api/views/5ery-qagt/rows.rdf",

    updateGraphUrl: (maybeGraphUrl: string) => {
        let url!: URL;
        try {
            url = new URL(maybeGraphUrl);
        } catch (_) {
            return;
        }

        set({ graphUrl: url.href });
    },
}));

const rdfReader = new RdfReader();

export function useTripleStore() {
    const graphUrl = useGraphStore((store) => store.graphUrl);

    return useQuery({
        queryKey: ["rdf-graph", graphUrl],
        queryFn: async () => {
            const store = new Store();

            await rdfReader.readFromUrl(graphUrl, (quad) => {
                store.addQuad(quad);
            });

            return store;
        },
    });
}
