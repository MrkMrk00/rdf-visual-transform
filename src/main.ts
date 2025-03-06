import * as graphology from 'graphology';
import * as layouts from 'graphology-layout';
import { getNodesInViewport } from '@sigma/utils';
import { Sigma } from 'sigma';
import { RdfStreamingReader } from "./RdfStreamingReader";

(() => {
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

  async function renderWithSigma() {
    // @ts-ignore
    const urlForm: HTMLFormElement = document.forms.graphUrl;
    const container = document.querySelector('main')!;

    let sigma: Sigma | null = null;

    urlForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();

      sigma?.kill();
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
  };

  renderWithSigma();
})();

