import * as graphology from 'graphology';
import * as layouts from 'graphology-layout';
import forceLayout from 'graphology-layout-force';
import forceAtlas2Layout from 'graphology-layout-forceatlas2';
import { getNodesInViewport } from '@sigma/utils';
import { Sigma } from 'sigma';
import { DEFAULT_NODE_PROGRAM_CLASSES } from 'sigma/settings';
import { NodeSquareProgram } from '@sigma/node-square';
import { RdfStreamingReader } from "./RdfStreamingReader";
import cytoscape from 'cytoscape';
import { Quad_Object, Quad_Predicate, Quad_Subject } from '@rdfjs/types';

type Layout = 'force' | 'circular' | 'circlepack' | 'random' | 'forceAtlas2';
type LayoutInstance = {
  assign(graph: graphology.DirectedGraph): void;
};

(() => {
  function getObjectKey(subject: Quad_Subject, predicate: Quad_Predicate, object: Quad_Object) {
    if (object.termType === 'Literal') {
      return `lit:${subject.value}-${predicate.value}-${object.value}`;
    }

    return object.value;
  }

  function instantiateGraphologyLayout(layout: Layout): LayoutInstance {
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

  async function renderSigmaGraph(url: string | URL, target: HTMLElement, layout: Layout = 'random') {
    const graph = new graphology.DirectedGraph();

    const rdfReader = new RdfStreamingReader();
    await rdfReader.read(url, ({ subject, predicate, object }) => {
      if (!graph.hasNode(subject.value)) {
        graph.addNode(subject.value, { label: subject.value });
      }

      const objectKey = getObjectKey(subject, predicate, object);
      if (object.termType === 'Literal') {
        graph.addNode(objectKey, { label: object.value, type: 'square' });
      } else if (!graph.hasNode(object.value)) {
        graph.addNode(objectKey, { label: object.value });
      }

      if (!graph.hasEdge(subject.value, objectKey)) {
        graph.addEdge(subject.value, objectKey, { label: predicate.value });
      }
    });

    instantiateGraphologyLayout(layout).assign(graph);

    return new Sigma(graph, target, {
      nodeProgramClasses: {
        ...DEFAULT_NODE_PROGRAM_CLASSES,
        square: NodeSquareProgram,
      },
    });
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

      sigma = await renderSigmaGraph(options.url, container, options.layout as Layout | undefined);
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

  async function renderWithCytoscape() {
    const cy = cytoscape({
      layout: { name: 'random' },
      container: document.querySelector('main')!,
      styleEnabled: true,
      style: [{
        selector: 'node',
        style: {
          shape: 'ellipse',
          label: 'data(label)',
        },
      }],
    });

    const urlForm = (document.forms as unknown as Record<string, HTMLFormElement>).graphUrl;
    const options = Object.fromEntries(new FormData(urlForm));

    const rdfReader = new RdfStreamingReader();
    let i = 0;
    await rdfReader.read(options.url as string, ({ subject, predicate, object }) => {
      if (i++ > 100) {
        return;
      }

      if (!cy.hasElementWithId(subject.value)) {
        cy.add({
          group: 'nodes',
          data: { id: subject.value, label: subject.value },
        });
      }

      const objectKey = getObjectKey(subject, predicate, object);
      if (!cy.hasElementWithId(objectKey)) {
        cy.add({
          group: 'nodes',
          data: { id: objectKey, label: object.value },
          style: {
            shape: object.termType === 'Literal' ? 'rectangle' : 'circle',
            width: '100px',
          },
        });
      }

      const edgeKey = `${subject.value}-${predicate.value}-${objectKey}`;
      if (!cy.hasElementWithId(edgeKey)) {
        cy.add({
          group: 'edges',
          data: {
            id: edgeKey,
            source: subject.value,
            target: objectKey,
            label: predicate.value,
          },
        });
      }
    });

    cy.layout({ name: 'random' }).run();

  }

  if (window.location.href.includes('cytoscape')) {
    renderWithCytoscape();

    return;
  }

  renderWithSigma();
})();

