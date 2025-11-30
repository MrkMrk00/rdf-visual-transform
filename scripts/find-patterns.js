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

  {
    SELECT ?middle
    WHERE {
      ?middle ?a [] .
      ?middle ?b [] .
    }
    GROUP BY ?middle
    HAVING (COUNT(?a) = 1 && COUNT(?b) = 1)
  }

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

const propChainShortcut = await queryBindings(propertyChainShortcut, ['from', 'p1', 'middle', 'p2', 'to']);

const dereification = await queryBindings(relationshipDereification, ['start', 'a', 'middle', 'b', 'end']);

const countingPropertyResult = await queryBindings(countingProperty, ['from', 'property']);

if (verbose) {
    console.log('property-chain-shortcut', propChainShortcut);
    console.log('relationship-dereification', dereification);
    console.log('counting-property', countingPropertyResult);
}

console.log({
    'property-chain-shortcut': propChainShortcut.length,
    'relationship-dereification': dereification.length,
    'counting-property': countingPropertyResult.length,
});
