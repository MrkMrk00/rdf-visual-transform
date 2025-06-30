import { useEffect } from "react";
import { Sigma } from "sigma";
import { SigmaNodeEventPayload } from "sigma/types";
import { toast } from "sonner";

function doubleClickHandler(payload: SigmaNodeEventPayload) {
    payload.preventSigmaDefault();

    navigator.clipboard.writeText(payload.node).then(() => {
        toast("📋 Node IRI (or value) written to clipboard.");
    });
}

export function useDoubleClickToCopy(sigma: Sigma) {
    useEffect(() => {
        sigma.on("doubleClickNode", doubleClickHandler);

        return () => void sigma.removeListener("doubleClickNode", doubleClickHandler);
    }, [sigma]);
}
