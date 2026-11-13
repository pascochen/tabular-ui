"""
Writes src/styles/figures.css: Golos Text's ten digits, with tabular figures that
are really one width (docs/design-system.md §8.3, "Tabular figures").

Golos Text's `tnum` swaps in its `.tf` digits, but they are not one width. At 400,
0, 1, 4 and 7 are 0.620em, 8 is 0.610em, 6 and 9 0.605em, 3 0.585em, 2 and 5
0.580em, and the gaps hold at every weight. A right-aligned column of amounts
drifts by up to 3.2px across a 12px row (measured 2026-11-13). This script gives
every `.tf` digit the advance of `zero.tf`, the widest of them at every weight
from 400 to 900, and centres each digit's outline in the new width, at the
default master and in every variation, so the figures stay one width and
centred across the `wght` axis. The proportional digits are unchanged.

The output is a digits-only font, U+0030-0039, embedded as a data URL in an
@font-face rule under the family name "Golos Text Variable", declared after the
package's faces. For a character inside more than one face's unicode-range,
the face declared last wins (CSS Fonts 4, §4.5), so the digits come from this
file and every other character from the package's. Embedding it keeps the
library's CSS self-contained: dist/ ships the stylesheet as source, and the
shadcn registry carries text files only.

The licence (SIL OFL 1.1) reserves no font name for Golos Text, but a patched
file is a Modified Version, so its family is renamed "Tabular Figures", as the
site's serif is renamed "Tabular Serif". The copyright, trademark and licence
records are kept unchanged. The CSS family name is an alias the stylesheet
gives the face, not the font's name.

Run it when @fontsource-variable/golos-text changes; figures.spec.ts fails until
you do. It needs fontTools and brotli, which are not dependencies of this
repository:

    python3 -m venv /tmp/tabular-figures && /tmp/tabular-figures/bin/pip install fonttools brotli
    /tmp/tabular-figures/bin/python -I packages/ui/scripts/tabular-figures.py
"""

import base64
import hashlib
import io
import json
from pathlib import Path

import fontTools
from fontTools import subset
from fontTools.ttLib import TTFont

repo = Path(__file__).resolve().parents[3]
package = repo / "packages/ui/node_modules/@fontsource-variable/golos-text"
source = package / "files/golos-text-latin-wght-normal.woff2"
out = repo / "packages/ui/src/styles/figures.css"

digits = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
target = "zero.tf"
# Name records that must not change: copyright, trademark, licence and its URL.
kept = {0, 7, 13, 14}


def cut(font: TTFont) -> None:
    """Keep the ten digits, their tabular forms, and the two figure features."""
    options = subset.Options()
    options.layout_features = ["tnum", "pnum"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.notdef_outline = True
    options.glyph_names = True  # so a check can find the .tf digits by name
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=range(0x30, 0x3A))
    subsetter.subset(font)


def phantom_advance(variation) -> float:
    """A gvar tuple's change to the advance: the right phantom point's x delta
    minus the left one's. The phantom points are the last four coordinates."""
    left, right = variation.coordinates[-4], variation.coordinates[-3]
    return right[0] - left[0]


def equalize(font: TTFont) -> dict:
    glyf, hmtx, gvar = font["glyf"], font["hmtx"], font["gvar"].variations
    hvar = font["HVAR"].table.AdvWidthMap.mapping
    widths = {}

    def expand(name: str) -> None:
        coords, ctrl = glyf._getCoordinatesAndControls(name, hmtx.metrics, None)
        for variation in gvar.get(name, []):
            if None in variation.coordinates:
                variation.calcInferredDeltas(coords, ctrl.endPts)

    expand(target)
    target_advance = hmtx[target][0]
    # The target's advance change in each region, by the region's axis tuple.
    target_deltas = {tuple(sorted(v.axes.items())): phantom_advance(v) for v in gvar[target]}

    for base in digits:
        name = f"{base}.tf"
        expand(name)
        advance, lsb = hmtx[name]
        shift = (target_advance - advance) / 2
        glyph = glyf[name]
        if glyph.isComposite():
            for component in glyph.components:
                component.x += round(shift)
        else:
            glyph.coordinates.translate((round(shift), 0))
        glyph.recalcBounds(glyf)
        hmtx[name] = (target_advance, getattr(glyph, "xMin", lsb + round(shift)))

        regions = {tuple(sorted(v.axes.items())): v for v in gvar.get(name, [])}
        assert set(regions) == set(target_deltas), f"{name}: its regions differ from {target}'s"
        for key, variation in regions.items():
            change = target_deltas[key] - phantom_advance(variation)
            # Every outline point (or component offset) moves by half the extra
            # width; the right phantom takes the whole of it.
            count = len(variation.coordinates)
            moved = []
            for i, (x, y) in enumerate(variation.coordinates):
                if i == count - 3:
                    moved.append((x + change, y))
                elif i < count - 4:
                    moved.append((x + change / 2, y))
                else:
                    moved.append((x, y))
            variation.coordinates = [(round(x), round(y)) for x, y in moved]
        # HVAR carries the advance variation the browser reads: take the target's.
        hvar[name] = hvar[target]
        widths[name] = advance

    return widths


def rename(font: TTFont) -> None:
    names = font["name"]
    for record in names.names:
        if record.nameID in kept:
            continue
        text = record.toUnicode()
        record.string = text.replace("Golos Text", "Tabular Figures").replace("GolosText", "TabularFigures")
    for record in names.names:
        if record.nameID not in kept:
            assert "Golos" not in record.toUnicode(), (record.nameID, record.toUnicode())


font = TTFont(source)
cut(font)
before = equalize(font)
rename(font)
font.flavor = "woff2"
buffer = io.BytesIO()
font.save(buffer)
data = buffer.getvalue()

version = json.loads((package / "package.json").read_text())["version"]
source_sha = hashlib.sha256(source.read_bytes()).hexdigest()
encoded = base64.b64encode(data).decode("ascii")
widths = ", ".join(f"{name.split('.')[0]} {width}" for name, width in before.items())

out.write_text(
    f"""/* GENERATED by packages/ui/scripts/tabular-figures.py. Do not edit: change the script and run it.
   Golos Text's digits with tabular figures that are one width (design-system.md §8.3).
   Source: @fontsource-variable/golos-text@{version}, {source.name}
   Source sha256: {source_sha}
   fontTools {fontTools.version}. {len(data)} bytes of woff2.
   The .tf advances it replaces, in units of 1000 at 400: {widths}.
   Every .tf digit now takes {target}'s advance at every weight, its outline centred.
   Licence: SIL OFL 1.1, Copyright 2019 The Golos Text Project Authors. Renamed Tabular Figures.

   Declared AFTER @fontsource-variable/golos-text/wght.css (src/index.css): for a
   character inside two faces' unicode-range, the face declared last wins. */
@font-face {{
  font-family: 'Golos Text Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 400 900;
  src: url('data:font/woff2;base64,{encoded}') format('woff2-variations');
  unicode-range: U+0030-0039;
}}
"""
)
print(f"{out.relative_to(repo)}: {len(data)} bytes of woff2, {out.stat().st_size} bytes of CSS")
