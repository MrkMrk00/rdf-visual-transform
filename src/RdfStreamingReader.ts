import { webStreamToNodeStream } from "./streams";
import { rdfParser } from "rdf-parse";
import type { Quad } from "@rdfjs/types";

export class RdfStreamingReader {
  constructor(
    private fallbackContentType = 'application/rdf+xml',
  ) {
  }

  read(url: string | URL, onData: (quad: Quad) => void) {
    const { promise, resolve, reject } = Promise.withResolvers<void>();

    fetch(url).then(response => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const stream = webStreamToNodeStream(response.body!);
      let contentType = response.headers.get('Content-Type') ?? this.fallbackContentType;

      // content type can include charset etc. after semi
      if (contentType.includes(';')) {
        contentType = contentType.split(';')[0];
      }

      const parser = rdfParser.parse(stream, { contentType });

      parser
        .on('data', onData)
        .on('error', (err) => {
          parser.destroy();

          reject(err);
        })
        .on('end', resolve);
    });

    return promise;
  }
}

