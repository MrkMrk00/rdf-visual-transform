import * as graphology from 'graphology';
import * as layouts from 'graphology-layout';
import { getNodesInViewport } from '@sigma/utils';
import { Sigma } from 'sigma';
import { RdfStreamingReader } from "./RdfStreamingReader";

(() => {
  const pathPrefix = '/rdf-visual-transform/';

  async function renderGraph(url: string | URL, target: HTMLElement) {
    const graph = new graphology.UndirectedGraph();

    const rdfReader = new RdfStreamingReader();
    await rdfReader.read(url, ({ subject, predicate, object }) => {
      if (!graph.hasNode(subject.value)) {
        graph.addNode(subject.value, { label: subject.value });
      }

      if (!graph.hasNode(object.value)) {
        graph.addNode(object.value, { label: object.value });
      }

      if (!graph.hasEdge(subject.value, object.value)) {
        graph.addEdge(subject.value, object.value, { label: predicate.value });
      }
    });

    layouts.random.assign(graph);

    return new Sigma(graph, target);
  }

  const routes: Record<string, VoidFunction> = {
    'sigma': async function() {
      // @ts-ignore
      const urlForm: HTMLFormElement = document.forms.graphUrl;
      const container = document.querySelector('main')!;

      let sigma: Sigma | null = null;

      urlForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();

        sigma = null;

        const graphUrl = Object.fromEntries(
          new FormData(ev.currentTarget as HTMLFormElement),
        ).url as string;

        sigma = await renderGraph(graphUrl, container);
      });

      const submitButton = urlForm.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitButton.click();

      document.getElementById('nodes-in-viewport')!.addEventListener('click', () => {
        if (!sigma) {
          console.error('Sigma handle is not available. Maybe the graph is currently re-rendering.');

          return;
        }

        console.log(getNodesInViewport(sigma));
      });
    },
  };

  const route = window.location.pathname.replace(pathPrefix, '');

  if (route in routes) {
    routes[route]();
  } else {
    window.location.replace(new URL(`${pathPrefix}sigma`, window.location.href));
  }

  function renderLinks(links: string[], target: HTMLElement) {
    target.style.display = 'flex';
    target.style.alignItems = 'center';
    target.style.gap = '2em';

    for (const link of links) {
      const a = document.createElement('a');
      a.href = `${pathPrefix}${link}`;
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

