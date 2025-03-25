import { PassThrough, Readable } from "readable-stream";

export function webStreamToNodeStream(webStream: ReadableStream) {
    const pass = new PassThrough();
    const reader = webStream.getReader();

    function read() {
        reader
            .read()
            .then(({ done, value }) => {
                if (done) {
                    pass.end();

                    return;
                }

                pass.write(value);
                read();
            })
            .catch((err) => pass.destroy(err));
    }

    read();

    return pass;
}

export function stringToStream(text: string) {
    return new Readable({
        read() {
            this.push(text);
            this.push(null);
        },
    });
}
