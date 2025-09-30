#!/usr/bin/env python3

import sys
import os
import random
import argparse
import xml.etree.ElementTree as ET

FILE_MAX_SIZE = 2_000_000


def parse_args():
    parser = argparse.ArgumentParser(sys.argv[0])
    parser.add_argument('--subjects', '-s', default=None, type=int,
                        help='the number of subjects to keep from the input file')
    parser.add_argument('--filesize', '-f', default=None,
                        type=int, help='approximation of how much of the file to keep')
    parser.add_argument('input', type=str)

    return parser.parse_args()


def main() -> int:
    args = parse_args()

    input_file = args.input
    file_size = os.stat(input_file).st_size
    keep_margin = min(args.filesize or FILE_MAX_SIZE / file_size, 1)

    context = ET.iterparse(input_file, events=("start", "end"))
    _, root = next(context)

    attrs = " ".join(
        f'{k}="{v}"' for k, v in root.attrib.items()
    )
    rdf_ns = 'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"'
    sys.stdout.write(f"<rdf:RDF {attrs} {rdf_ns}>\n")

    subject_count = 0

    for event, elem in context:
        if args.subjects is not None and subject_count >= args.subjects:
            elem.clear()
            break

        if event == "end" and elem.tag.endswith("Description"):
            if args.subjects is not None and subject_count < args.subjects:
                sys.stdout.write(ET.tostring(elem).decode())
                subject_count += 1
            elif args.filesize is not None and random.random() < keep_margin:
                sys.stdout.write(ET.tostring(elem).decode())

            elem.clear()
            root.clear()

    sys.stdout.write("</rdf:RDF>\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
