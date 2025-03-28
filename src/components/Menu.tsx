import { Input } from "@/components/ui/input";
import { useGraphStore } from "@/stores/graphSettings";
import { useEffect, useRef } from "react";

export function Menu() {
    const graphUrlFromStore = useGraphStore((store) => store.graphUrl);
    const updateGraphUrl = useGraphStore((store) => store.updateGraphUrl);

    const urlRef = useRef<HTMLInputElement>(null);

    return (
        <nav className="w-full px-4 py-2">
            <label className="inline-flex text-nowrap items-center gap-2">
                Graph URL
                <Input className="min-w-sm" placeholder="Graph URL" defaultValue={graphUrlFromStore} />
            </label>
        </nav>
    );
}
