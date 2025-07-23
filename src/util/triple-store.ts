import { QueryEngine } from '@comunica/query-sparql';
import type { Quad } from '@rdfjs/types';
import { Store } from 'n3';

export type EventType = 'update';

export class TripleStore implements EventTarget {
    private _store = new Store();
    private _queryEngine = new QueryEngine();
    private _eventBus = new EventTarget();

    addQuad(quad: Quad): void {
        this._eventBus.dispatchEvent(new Event('update'));

        this._store.addQuad(quad);
    }

    async queryVoid(
        query: string,
        additionalSources: string[] = [],
    ): Promise<void> {
        await this._queryEngine.queryVoid(query, {
            sources: [this._store, ...additionalSources],
            destination: this._store,
        });

        this._eventBus.dispatchEvent(new Event('update'));
    }

    get quads() {
        return this._store.toArray();
    }

    addEventListener(
        type: EventType,
        callback: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean,
    ): void {
        this._eventBus.addEventListener(type, callback, options);
    }

    removeEventListener(
        type: EventType,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean,
    ): void {
        this._eventBus.removeEventListener(type, callback, options);
    }

    dispatchEvent(_: Event): boolean {
        throw new Error('Outside events are not supported');
    }
}
