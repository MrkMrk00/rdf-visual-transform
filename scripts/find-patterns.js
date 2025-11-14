#!/usr/bin/env node

import { QueryEngine } from '@comunica/query-sparql';
import { Store } from 'n3';
import { rdfParser } from 'rdf-parse';

const contentType = 'text/turtle';

const verbose = process.argv.some((arg) => arg === '-v' || arg === '--verbose');

/**
 * @returns {Promise<Store>}
 */
function doParse() {
    const store = new Store();
    const parser = rdfParser.parse(process.stdin, { contentType });

    return new Promise((resolve, reject) => {
        verbose && console.log('loading data...');

        parser.on('data', (quad) => {
            store.add(quad);
        });

        parser.on('error', reject);
        parser.on('end', () => resolve(store));
    });
}

const store = await doParse();
const queryEngine = new QueryEngine();

const propertyChainShortcut = `\
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
}`;

const countingProperty = `\
WHERE {
    ?from ?property ?to .
}
GROUP BY ?from ?property
HAVING (COUNT(?property) > 1)
`;

console.log(
    'property-chain-shortcut',
    await queryEngine.queryBoolean(`ASK ${propertyChainShortcut}`, {
        sources: [store],
    }),
);

const result = await queryEngine.queryBindings(`SELECT ?from (COUNT(?property) as ?count) ${countingProperty}`, {
    sources: [store],
});

console.log((await result.toArray()).map(it => it.toString()));

// console.log(
//     'counting property',
//     await queryEngine.query(`SELECT ?from (COUNT(?property) as ?count) ${countingProperty}`, {
//         sources: [store],
//     }),
// );
