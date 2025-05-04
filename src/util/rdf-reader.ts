import { stringToStream, webStreamToNodeStream } from "@/util/streams";
import type { Quad } from "@rdfjs/types";
import { rdfParser } from "rdf-parse";

export class RdfReader {
    constructor(private fallbackContentType = "application/rdf+xml") {}

    readFromString(data: string, contentType: string, onData: (quad: Quad) => void) {
        const { promise, resolve, reject } = Promise.withResolvers<void>();

        const parser = rdfParser.parse(stringToStream(data), { contentType });

        parser
            .on("data", onData)
            .on("error", (err) => {
                parser.destroy();

                reject(err);
            })
            .on("end", resolve);

        return promise;
    }

    readFromUrl(url: string | URL, onData: (quad: Quad) => void) {
        const { promise, resolve, reject } = Promise.withResolvers<void>();

        fetch(url).then((response) => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const stream = webStreamToNodeStream(response.body!);
            let contentType = response.headers.get("Content-Type") ?? this.fallbackContentType;

            // content type can include charset etc. after semi
            if (contentType.includes(";")) {
                contentType = contentType.split(";")[0];
            }

            const parser = rdfParser.parse(stream, { contentType });

            parser
                .on("data", onData)
                .on("error", (err) => {
                    parser.destroy();

                    reject(err);
                })
                .on("end", resolve);
        });

        return promise;
    }
}
