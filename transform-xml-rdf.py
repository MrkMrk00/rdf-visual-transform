#!/usr/bin/env python3

import sys
import xml.etree.ElementTree as ET


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        raise AssertionError("provide input file")

    input_file = argv[1]
    ctx = ET.iterparse(input_file, events=("end",))

    print(
        """
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
		xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
		xmlns:food="http://data.lirmm.fr/ontologies/food#"
		xmlns:dcterms="http://purl.org/dc/terms/"
		xmlns:dc="http://purl.org/dc/elements/1.1/"
		xmlns:void="http://rdfs.org/ns/void#"
		xmlns:owl="http://www.w3.org/2002/07/owl#"
		xmlns:foaf="http://xmlns.com/foaf/0.1/">
        """,
        end="",
    )

    i = 0
    for _, elem in ctx:
        if not elem.tag.endswith("Description"):
            continue

        i += 1

        if i > 1000:
            break

        print(ET.tostring(elem, encoding="unicode"), end="")

        elem.clear()

    print("</rdf:RDF>")


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
