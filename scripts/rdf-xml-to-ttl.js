#!/usr/bin/env node

import * as n3 from 'n3';
import * as fs from 'node:fs';
import { rdfParser } from 'rdf-parse';

let fromFile = process.argv[process.argv.length - 1];
let stream;

if (fromFile === '--') {
    stream = process.stdin;
} else {
    stream = fs.createReadStream(fromFile);
}

const writer = new n3.Writer(process.stdout, { end: false, format: 'text/turtle' });

rdfParser
    .parse(stream, { contentType: 'application/rdf+xml' })
    .on('data', (data) => writer.addQuad(data))
    .on('end', () => writer.end())
    .on('error', (err) => console.error(err));
