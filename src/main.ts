import { rdfParser } from "rdf-parse";
import { PassThrough } from 'readable-stream';
import type * as RDF from '@rdfjs/types';

function webStreamToNodeStream(webStream: ReadableStream) {
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

(() => {
  const DATA_URL = 'https://data.wa.gov/api/views/f6w7-q2d2/rows.rdf';

  async function doGetData(cb: (quad: RDF.Quad) => void) {
    fetch(DATA_URL).then(response => {
      let contentType = response.headers.get('Content-Type') ?? 'application/rdf+xml';
      if (contentType.includes(';')) {
        contentType = contentType.split(';')[0];
      }

      rdfParser.parse(webStreamToNodeStream(response.body!), { contentType })
        .on('data', cb)
        .on('error', () => { });
    });
  }



  const routes: Record<string, VoidFunction> = {
    'sigma': async function() {
      doGetData(({ subject, object, predicate }) =>
        console.log(`<${subject.value}> <${predicate.value}> <${object.value}>`));
    },
  };

  const route = window.location.pathname.slice(1);

  if (route in routes) {
    routes[route]();
  } else {
    window.location.replace(new URL('/sigma', window.location.href));
  }

  function renderLinks(links: string[], target: HTMLElement) {
    target.style.display = 'flex';
    target.style.alignItems = 'center';
    target.style.gap = '2em';

    for (const link of links) {
      const a = document.createElement('a');
      a.href = `/${link}`;
      a.innerText = link[0].toUpperCase() + link.slice(1);

      if (link === route) {
        a.style.fontWeight = 'bold';
        a.style.textDecoration = 'none';
      }

      target.insertAdjacentElement('beforeend', a);
    }
  }

  renderLinks(Object.keys(routes), document.getElementById('links')!);
})();

