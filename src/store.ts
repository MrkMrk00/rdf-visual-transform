import { QueryEngine } from "@comunica/query-sparql";
import { Store } from "n3";

export const store = new Store();
const queryEngine = new QueryEngine();

export function query(query: string) {
    return queryEngine.query(query, { sources: [store] });
}

export function update(query: string, additionalSources: string[] = []) {
    queryEngine.queryVoid(query, { sources: [store, ...additionalSources], destination: store });
}
