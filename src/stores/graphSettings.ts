import { RdfReader } from "@/util/rdf-reader";
import { useQuery } from "@tanstack/react-query";
import { createStore, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Store } from "n3";
import type { Settings as SigmaSettings } from "sigma/settings";
import { create } from "zustand";

type GraphSettingsStore = {
    graph: { url: string } | { data: string; name: string } | null;
    sigmaSettings: Partial<SigmaSettings>;

    loadGraphFromUrl: (url: string) => void;
};

const graphUrlHistory = atomWithStorage<string[]>("graphUrlHistory", []);
const store = createStore();

const HISTORY_MAX_SIZE = 20;

export const useGraphStore = create<GraphSettingsStore>()((set) => ({
    graph: { url: "https://data.cityofnewyork.us/api/views/5ery-qagt/rows.rdf" },
    sigmaSettings: {},

    loadGraphFromUrl: (url) => {
        store.set(graphUrlHistory, (history) => {
            return Array.from(new Set([url, ...history])).slice(0, Math.min(history.length + 1, HISTORY_MAX_SIZE));
        });

        set({ graph: { url } });
    },
}));

const rdfReader = new RdfReader();

export function useTripleStore() {
    const graph = useGraphStore((store) => store.graph);

    return useQuery({
        queryKey: ["rdf-graph", graph],
        queryFn: async () => {
            const store = new Store();

            if (!graph) {
                return store;
            }

            if ("data" in graph) {
                await rdfReader.readFromString(graph.data, "text/turtle", (quad) => {
                    store.addQuad(quad);
                });
            } else {
                await rdfReader.readFromUrl(graph.url, (quad) => {
                    store.addQuad(quad);
                });
            }

            return store;
        },
    });
}

export function useGraphUrlHistory() {
    const [urlHistory] = useAtom(graphUrlHistory);

    return urlHistory;
}
