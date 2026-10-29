"""
Writes the site's trimmed serif (docs/site.md §12): Source Serif 4's Latin
upright file, cut to one weight per file, with every optical size kept.

The package's file carries every weight from 200 to 900, 122 KB, and the hero's
heading waited on it before its first paint. The site sets the serif at 600,
and at 400 in one place, Inline citation's popover number. So it gets two files:
600, preloaded, and 400, fetched only when a page asks for it. The `opsz` axis
stays, because it gives the 64px heading the display cut (docs/design-system.md
§8.4).

The font's licence (SIL OFL 1.1) reserves the name "Source", and a cut file is a
Modified Version, so the family is renamed "Tabular Serif". The copyright,
trademark and licence records are kept unchanged.

Run it when @fontsource-variable/source-serif-4 changes; tests/quality.spec.ts
fails until you do. It needs fontTools and brotli, which are not dependencies
of this repository:

    python3 -m venv /tmp/serif-trim && /tmp/serif-trim/bin/pip install fonttools brotli
    /tmp/serif-trim/bin/python -I apps/site/scripts/serif-trim.py
"""

import hashlib
import json
from pathlib import Path

import fontTools
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

repo = Path(__file__).resolve().parents[3]
package = repo / "packages/ui/node_modules/@fontsource-variable/source-serif-4"
source = package / "files/source-serif-4-latin-opsz-normal.woff2"
out = repo / "apps/site/src/fonts"

# Name records that must not change: copyright, trademark, licence and its URL.
kept = {0, 7, 13, 14}
weights = {400: "Regular", 600: "SemiBold"}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rename(font: TTFont, style: str) -> None:
    names = font["name"]
    for record in names.names:
        if record.nameID in kept:
            continue
        text = record.toUnicode()
        text = text.replace("Source Serif 4", "Tabular Serif").replace("SourceSerif4", "TabularSerif")
        record.string = text
    # One weight per file: the family and style the browser reads.
    names.setName("Tabular Serif", 1, 3, 1, 0x409)
    names.setName(style, 2, 3, 1, 0x409)
    names.setName(f"Tabular Serif {style}", 4, 3, 1, 0x409)
    names.setName(f"TabularSerif-{style}", 6, 3, 1, 0x409)
    names.setName("Tabular Serif", 16, 3, 1, 0x409)
    names.setName(style, 17, 3, 1, 0x409)
    for record in names.names:
        if record.nameID not in kept:
            assert "Source" not in record.toUnicode(), (record.nameID, record.toUnicode())


manifest = {
    "note": "Written by apps/site/scripts/serif-trim.py. Do not edit.",
    "source": f"@fontsource-variable/source-serif-4@{json.loads((package / 'package.json').read_text())['version']}",
    "sourceFile": source.name,
    "sourceSha256": sha256(source),
    "fontTools": fontTools.version,
    "files": {},
}

out.mkdir(exist_ok=True)
for weight, style in weights.items():
    font = instancer.instantiateVariableFont(TTFont(source), {"wght": weight})
    rename(font, style)
    font.flavor = "woff2"
    path = out / f"tabular-serif-{weight}.woff2"
    font.save(path)
    manifest["files"][path.name] = {"weight": weight, "bytes": path.stat().st_size, "sha256": sha256(path)}
    print(f"{path.relative_to(repo)}: {path.stat().st_size / 1024:.1f} KB")

(out / "tabular-serif.json").write_text(json.dumps(manifest, indent=2) + "\n")
