#!/usr/bin/env python3
"""Convert the kaiti font (LXGW WenKai) from TrueType (glyf) to CFF-flavored woff.

Why: react-pdf embeds fonts through fontkit@2.0.4, whose TrueType glyf subsetter
drops/corrupts outlines for complex glyphs (empty contours from transformed woff2
glyf; buggy `encodeSimple` for multi-contour ideographs like 程). CFF fonts ride a
completely different, working path (`CFFSubset`) — the same one that lets the CID
CFF Source Han fonts embed correctly. So we convert kaiti to CFF once, up front;
the runtime pipeline (subset-fonts.mjs) then subsets the CFF woff → woff2 like the
others. See docs/specs/kaiti-pdf-fontkit/.

One-time prep step. Inputs are the upstream LXGW WenKai TTFs; run manually when the
kaiti source changes, then commit the resulting .woff into public/fonts/full/.

    python3 scripts/ttf2otf-kaiti.py        (needs `pip install fonttools`)

Requires the upstream TTFs to be present next to the outputs while running:
    public/fonts/full/LXGWWenKai-Regular.ttf  ->  LXGWWenKai-Regular.woff
    public/fonts/full/LXGWWenKai-Medium.ttf   ->  LXGWWenKai-Medium.woff
"""
import os
from fontTools.ttLib import TTFont
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.boundsPen import BoundsPen

FULL_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "fonts", "full")
WEIGHTS = ["Regular", "Medium"]


def ttf_to_cff_woff(src_path, dst_path):
    font = TTFont(src_path)
    glyph_order = font.getGlyphOrder()
    glyph_set = font.getGlyphSet()
    upm = font["head"].unitsPerEm
    hmtx = font["hmtx"]

    name = font["name"]
    family = name.getDebugName(1) or "LXGW WenKai"
    subfamily = name.getDebugName(2) or "Regular"
    full = name.getDebugName(4) or family
    ps_name = (name.getDebugName(6) or family).replace(" ", "")
    version = name.getDebugName(5) or "Version 1.0"

    # Redraw every glyph's quadratic (glyf) outline into a T2 (CFF) charstring.
    charstrings = {}
    metrics = {}
    for gname in glyph_order:
        width, _ = hmtx[gname]
        pen = T2CharStringPen(width, glyph_set)
        glyph_set[gname].draw(pen)
        charstrings[gname] = pen.getCharString()
        bpen = BoundsPen(glyph_set)
        glyph_set[gname].draw(bpen)
        xmin = int(round(bpen.bounds[0])) if bpen.bounds else 0
        metrics[gname] = (width, xmin)

    hhea = font["hhea"]
    os2 = font.get("OS/2")

    fb = FontBuilder(upm, isTTF=False)
    fb.setupGlyphOrder(glyph_order)
    fb.setupCharacterMap(font.getBestCmap())
    fb.setupCFF(
        ps_name,
        {"FullName": full, "FamilyName": family, "Weight": subfamily},
        charstrings,
        {},
    )
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=hhea.ascent, descent=hhea.descent)
    fb.setupNameTable({
        "familyName": family,
        "styleName": subfamily,
        "uniqueFontIdentifier": ps_name,
        "fullName": full,
        "version": version,
        "psName": ps_name,
    })
    if os2 is not None:
        fb.setupOS2(
            sTypoAscender=os2.sTypoAscender,
            sTypoDescender=os2.sTypoDescender,
            sTypoLineGap=os2.sTypoLineGap,
            usWinAscent=os2.usWinAscent,
            usWinDescent=os2.usWinDescent,
            sxHeight=getattr(os2, "sxHeight", 0),
            sCapHeight=getattr(os2, "sCapHeight", 0),
        )
    else:
        fb.setupOS2()
    fb.setupPost()
    fb.font.flavor = "woff"
    fb.save(dst_path)
    print(f"{os.path.basename(src_path)} -> {os.path.basename(dst_path)}  glyphs={len(glyph_order)}")


if __name__ == "__main__":
    for weight in WEIGHTS:
        src = os.path.join(FULL_DIR, f"LXGWWenKai-{weight}.ttf")
        dst = os.path.join(FULL_DIR, f"LXGWWenKai-{weight}.woff")
        if not os.path.exists(src):
            print(f"SKIP (missing): {src}")
            continue
        ttf_to_cff_woff(src, dst)
