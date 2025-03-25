import * as graphology from "graphology";
import * as layouts from "graphology-layout";

export type Layout = "force" | "circular" | "circlepack" | "random" | "forceAtlas2";
type LayoutInstance = {
    assign(graph: graphology.DirectedGraph | graphology.UndirectedGraph): void;
};

export async function instantiateGraphologyLayout(layout: Layout): Promise<LayoutInstance> {
    switch (layout) {
        case "force":
            const { default: forceLayout } = await import("graphology-layout-force");

            return {
                assign: (graph) => {
                    layouts.random.assign(graph, { scale: 2, dimensions: ["200", "200"] });

                    forceLayout.assign(graph, { maxIterations: 2 });
                },
            };
        case "forceAtlas2":
            const { default: forceAtlas2Layout } = await import("graphology-layout-forceatlas2");
            const randomLayout = await instantiateGraphologyLayout("random");

            return {
                assign: (graph) => {
                    randomLayout.assign(graph);
                    const settings = forceAtlas2Layout.inferSettings(graph);

                    forceAtlas2Layout.assign(graph, {
                        iterations: 2,
                        settings: {
                            ...settings,
                        },
                    });
                },
            };
        case "random":
            return layouts.random;
        case "circular":
            return layouts.circular;
        case "circlepack":
            return layouts.circlepack;
    }
}
