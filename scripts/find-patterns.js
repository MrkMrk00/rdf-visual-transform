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

const relationshipDereification = `\
WHERE {
    ?middle ?a ?start .
    ?middle ?b ?end   .

    FILTER (?start != ?end && isIRI(?start) && isIRI(?end))
}
`;

const countingProperty = `\
WHERE {
    ?from ?property ?to .
}
GROUP BY ?from ?property
HAVING (COUNT(?property) > 1)
`;

async function queryBindings(query, bindings) {
    const bindingsPlaceholders = bindings.reduce((acc, item) => {
        return acc + `?${item} `;
    }, '');

    const result = await queryEngine.queryBindings(`SELECT ${bindingsPlaceholders} ${query}`, {
        sources: [store],
    });

    return (await result.toArray()).map((it) => {
        return Object.fromEntries(bindings.map((key) => [key, it.get(key).value]));
    });
}

console.log(
    'property-chain-shortcut',
    await queryBindings(propertyChainShortcut, ['from', 'middle', 'to']),
);

console.log(
    'relationship-dereification',
    await queryBindings(relationshipDereification, ['start', 'a', 'middle', 'b', 'end']),
);

console.log(
    'counting-property',
    await queryBindings(countingProperty, ['from', 'property']),
);
