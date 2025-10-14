import { QueryEngine } from '@comunica/query-sparql';
import { Bindings } from '@rdfjs/types';
import * as n3 from 'n3';
import * as fs from 'node:fs';
import { rdfParser } from 'rdf-parse';
import { describe, it } from 'vitest';

const ONE_GIGABYTE = Math.pow(2, 30);
const RDF_DATA_FILE = 'example-data/food-small.ttl';

function loadIntoStore(stream: NodeJS.ReadableStream, contentType: string = 'application/rdf+xml') {
    return new Promise<n3.Store>((resolve, reject) => {
        const store = new n3.Store();

        let i = 0;
        const self = rdfParser
            .parse(stream, { contentType })
            .on('data', (quad) => {
                store.add(quad);

                if (i++ > 100_000 || process.memoryUsage().rss > ONE_GIGABYTE) {
                    self.emit('end');
                    self.destroy();
                }
            })
            .on('error', reject)
            .on('end', () => {
                resolve(store);
            });
    });
}

describe('Pattern exists 01', () => {
    it('loads dataset', async () => {
        const stream = fs.createReadStream(RDF_DATA_FILE);
        const store = await loadIntoStore(stream, 'text/turtle');
        const qe = new QueryEngine();

        const result = await qe.query(
            `
            SELECT ?from ?middle ?to ?p1 ?p2
            WHERE {
              ?from ?p1 ?middle .
              ?middle ?p2 ?to .
              {
                SELECT ?middle (COUNT(?in) AS ?inCount)
                WHERE {
                  ?in ?p ?middle .
                }
                GROUP BY ?middle
                HAVING (COUNT(?in) = 1)
              }
            }`,
            {
                sources: [store],
            },
        );

        const r = (await result.execute()) as unknown as AsyncIterableIterator<Bindings>;

        for await (const a of r) {
            console.log(a.get('from')?.value);
            console.log('\t ->', a.get('p1')?.value);
            console.log('\t ->', a.get('middle')?.value);
            console.log('\t ->', a.get('p2')?.value);
            console.log('\t ->', a.get('to')?.value);
        }

        stream.destroy();
    }, 1_000_0);
});
