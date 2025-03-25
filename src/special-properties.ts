import type { Quad_Object, Quad_Predicate } from "@rdfjs/types";

export const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
export const RDFS = "http://www.w3.org/2000/01/rdf-schema#";

const specialProperties = {
    [`${RDF}type`]: "type",
    [`${RDFS}label`]: "label",
};

export type SpecialPropertyPredicate = Quad_Predicate & { value: keyof typeof specialProperties };

export function isSpecialProperty(predicate: Quad_Predicate): predicate is SpecialPropertyPredicate {
    return predicate.value in specialProperties;
}

type Attributes = Record<string, any>;

export function updateNodeAttributes(previous: Attributes, predicate: SpecialPropertyPredicate, object: Quad_Object) {
    const updatedAttributes: Attributes = {
        ...previous,
        properties: {
            ...(previous.properties || {}),
            [specialProperties[predicate.value]]: object.value,
        },
    };

    if (predicate.value === `${RDFS}label`) {
        updatedAttributes["label"] = object.value;
    }

    return updatedAttributes;
}
