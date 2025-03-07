import * as graphology from 'graphology';
import * as layouts from 'graphology-layout';
import forceLayout from 'graphology-layout-force';
import forceAtlas2Layout from 'graphology-layout-forceatlas2';
import { getNodesInViewport } from '@sigma/utils';
import { Sigma } from 'sigma';
import { RdfStreamingReader } from "./RdfStreamingReader";

type Layout = 'force' | 'circular' | 'circlepack' | 'random' | 'forceAtlas2';
type LayoutInstance = {
  assign(graph: graphology.DirectedGraph): void;
};

(() => {
  function instantiateLayout(layout: Layout): LayoutInstance {
    switch (layout) {
      case 'force': return ({
        assign: (graph) => {
          layouts.random.assign(graph);

          forceLayout.assign(graph, { maxIterations: 2 });
        },
      });
      case 'forceAtlas2': return ({
        assign: (graph) => {
          layouts.random.assign(graph);
          const settings = forceAtlas2Layout.inferSettings(graph);

          forceAtlas2Layout.assign(graph, { iterations: 2, settings });
        },
      });
      case 'random': return layouts.random;
      case 'circular': return layouts.circular;
      case 'circlepack': return layouts.circlepack;
    }
  }

  async function renderGraph(url: string | URL, target: HTMLElement, layout: Layout = 'random') {
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

    instantiateLayout(layout).assign(graph);

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

      const options = Object.fromEntries(
        new FormData(ev.currentTarget as HTMLFormElement),
      ) as Record<string, string>;

      sigma = await renderGraph(options.url, container, options.layout as Layout | undefined);
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

