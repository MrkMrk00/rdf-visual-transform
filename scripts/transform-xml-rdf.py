#!/usr/bin/env python3

import sys
import os
import random
import xml.etree.ElementTree as ET

FILE_MAX_SIZE = 2_000_000


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        raise AssertionError("provide input file")

    input_file = argv[1]
    file_size = os.stat(input_file).st_size

    keep_margin = min(FILE_MAX_SIZE / file_size, 1)

    context = ET.iterparse(input_file, events=("start", "end"))

    _, root = next(context)

    attrs = " ".join(
        f'{k}="{v}"' for k, v in root.attrib.items()
    )
    rdf_ns = 'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"'
    sys.stdout.write(f"<rdf:RDF {attrs} {rdf_ns}>\n")

    for event, elem in context:
        if event == "end" and elem.tag.endswith("Description"):
            if random.random() < keep_margin:
                sys.stdout.write(ET.tostring(elem).decode())

            elem.clear()
            root.clear()

    sys.stdout.write("</rdf:RDF>\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
