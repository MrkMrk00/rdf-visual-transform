import { AvailableTransformations } from '@/components/dev-mode/AvailableTransformations';
import { useTransformer } from '@/hooks/useTransformer';
import { useGraphSettings, useShouldZoomWhileTransforming } from '@/store/graphSettings';
import { useTransformationsStore } from '@/store/transformations';
import { useUiControlStore } from '@/store/uiControl';
import { COMMON_PREDICATES_TO_HIDE } from '../Menu';
import { Button } from '../ui/button';
import { Card, CardContent, CardTitle } from '../ui/card';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import { SparqlConsole } from './SparqlConsole';

function PerformedTransformations() {
    const stack = useGraphSettings((store) => store.transformationsStack);
    const transformations = useTransformationsStore((store) => store.transformations);

    const { popTransformationsStack } = useTransformer();

    return (
        <Card>
            <CardTitle className="px-4">Performed transformations</CardTitle>
            <CardContent>
                {stack.length > 0 && (
                    <div className="w-full flex justify-end">
                        <Button onClick={popTransformationsStack} size="sm" variant="success">
                            Pop
                        </Button>
                    </div>
                )}

                {stack.length === 0 && <span>Nothing here...</span>}
                <ul className="flex flex-col gap-2">
                    {stack
                        .slice()
                        .reverse()
                        .map(({ id }, index) => (
                            <li key={`${id}-${index}`}>
                                {transformations.find((t) => t.id === id)?.name ?? 'unknown'}
                            </li>
                        ))}
                </ul>
            </CardContent>
        </Card>
    );
}

function ReadyToUseProfiles() {
    const loadFromJson = useTransformationsStore((store) => store.loadFromJson);
    const loadGraph = useGraphSettings((store) => store.loadGraphFromUrl);
    const setHiddenPredicates = useGraphSettings((store) => store.setHiddenPredicates);
    const [shouldZoom, toggleShouldZoom] = useShouldZoomWhileTransforming();
    const sigmaSettings = useGraphSettings((store) => store.sigmaSettings);
    const toggleSigmaSetting = useGraphSettings((store) => store.toggleSetting);
    const toggleDevMode = useUiControlStore((store) => store.toggleDevMode);

    // yeah, this is not very clean :)
    const profiles = [
        {
            name: '[artificial] People graph',
            graph: new URL(`${window.location.pathname}/people-graph.ttl`, window.location.href).toString(),
            profile: `{"state":{"transformations":[{"id":"01K5GQ0KTM0T6TDRM67ANQ6Q5P","name":"Teaches count","patternName":"linkCountingProperty","parameters":{"newProperty":"<http://example.org/university#teachesCount>","sourceProperty":"<http://example.org/university#teaches>","_insert":"on","_delete":"on"},"priority":0},{"id":"01K5X8XYXM42XBPMHZZ7EEW4YM","name":"studies under","patternName":"propertyChainShortcut","parameters":{"result":"<http://example.org/university#studiesUnder>","predicate0":"<http://example.org/university#major>","predicate1":"<http://example.org/university#hasProfessor>","_insert":"on","_delete":"on"},"priority":0},{"id":"01KA3DXDA59AN3B67WRR1A6M96","name":"Colleagues from employees","patternName":"relationshipDereification","parameters":{"result":"<http://example.org/university#hasColleague>","predicate0":"<http://example.org/university#employs>","predicate1":"<http://example.org/university#employs>","_insert":"on","_delete":"on"},"priority":0},{"id":"01KA3FWSR1EFJP2YN446T6ESFS","name":"Count attendees","patternName":"inlinkCountingProperty","parameters":{"newProperty":"<http://example.org/university#attendeeCount>","sourceProperty":"<http://example.org/university#attends>","_insert":"on","_delete":"on"},"priority":0}]},"version":0}`,
        },
    ];

    return (
        <Card>
            <CardTitle className="px-4">Ready-to-use profiles</CardTitle>
            <CardContent className="flex flex-col gap-2">
                {profiles.map(({ name, graph, profile }) => (
                    <Button
                        type="button"
                        key={name}
                        onClick={() => {
                            if (!sigmaSettings.renderEdgeLabels) {
                                toggleSigmaSetting('renderEdgeLabels');
                            }

                            if (!shouldZoom) {
                                toggleShouldZoom();
                            }

                            setHiddenPredicates(COMMON_PREDICATES_TO_HIDE);
                            loadGraph(graph);

                            toggleDevMode();
                            loadFromJson(profile);
                        }}
                    >
                        {name}
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
}

export function DevMode() {
    return (
        <ResizablePanelGroup
            className="inset-0 absolute z-30 pointer-events-auto backdrop-blur-md bg-black/20 p-4 gap-2"
            direction="horizontal"
        >
            <ResizablePanel className="flex flex-col gap-2">
                <PerformedTransformations />
                <ReadyToUseProfiles />
                <AvailableTransformations />
            </ResizablePanel>
            <ResizableHandle className="bg-transparent" />
            <ResizablePanel>
                <SparqlConsole />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
