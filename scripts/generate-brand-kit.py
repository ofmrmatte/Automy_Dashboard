from __future__ import annotations

import shutil
import subprocess
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "brand-kit"
RAR_PATH = ROOT / "automy-brand-kit-v2.rar"

BLUE = "#2563EB"
BLUE_LIGHT = "#60A5FA"
NAVY = "#0F172A"
TEAL = "#14B8A6"
TEAL_LIGHT = "#5EEAD4"
SUCCESS = "#22C55E"
WARNING = "#F59E0B"
ERROR = "#EF4444"
BG = "#F8FAFC"
SURFACE = "#FFFFFF"
TEXT = "#0F172A"
TEXT_SECONDARY = "#64748B"
BORDER = "#E2E8F0"

LEFT_PATH = "M54 190 C70 150 88 98 110 52"
RIGHT_PATH = "M121 52 C142 99 162 150 180 190"
GAP_PATH = "M117 122 C128 122 140 122 151 122"
FLOW_PATH = "M104 126 C124 135 147 146 170 156"

SYMBOL_BOUNDS = (39, 37, 195, 205)
SYMBOL_CENTER = ((SYMBOL_BOUNDS[0] + SYMBOL_BOUNDS[2]) / 2, (SYMBOL_BOUNDS[1] + SYMBOL_BOUNDS[3]) / 2)


def ensure_out() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)


def write(path: Path, content: str) -> None:
    path.write_text(content.strip() + "\n", encoding="utf-8")


def font_path(name: str) -> str:
    candidates = {
        "regular": [
            Path("C:/Windows/Fonts/Geist-Regular.ttf"),
            Path("C:/Windows/Fonts/Inter-Regular.ttf"),
            Path("C:/Windows/Fonts/segoeui.ttf"),
            Path("C:/Windows/Fonts/arial.ttf"),
        ],
        "semibold": [
            Path("C:/Windows/Fonts/Geist-SemiBold.ttf"),
            Path("C:/Windows/Fonts/Inter-SemiBold.ttf"),
            Path("C:/Windows/Fonts/seguisb.ttf"),
            Path("C:/Windows/Fonts/arialbd.ttf"),
        ],
        "bold": [
            Path("C:/Windows/Fonts/Geist-Bold.ttf"),
            Path("C:/Windows/Fonts/Inter-Bold.ttf"),
            Path("C:/Windows/Fonts/segoeuib.ttf"),
            Path("C:/Windows/Fonts/arialbd.ttf"),
        ],
    }
    for candidate in candidates[name]:
        if candidate.exists():
            return str(candidate)
    return str(Path("C:/Windows/Fonts/arial.ttf"))


def svg_defs(prefix: str = "automy") -> str:
    return f"""
  <defs>
    <linearGradient id="{prefix}-blue" x1="48" y1="198" x2="132" y2="46" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="{BLUE}"/>
      <stop offset="1" stop-color="{BLUE_LIGHT}"/>
    </linearGradient>
    <linearGradient id="{prefix}-teal" x1="104" y1="126" x2="170" y2="156" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="{BLUE}"/>
      <stop offset="0.48" stop-color="{TEAL}"/>
      <stop offset="1" stop-color="{TEAL_LIGHT}"/>
    </linearGradient>
  </defs>
"""


def symbol_group(color: str | None = None, prefix: str = "automy", include_gap: bool = True) -> str:
    blue_stroke = color or f"url(#{prefix}-blue)"
    flow_stroke = color or f"url(#{prefix}-teal)"
    gap = (
        f'\n    <path id="control-gap" d="{GAP_PATH}" stroke="{SURFACE}" stroke-width="30" opacity="0.98"/>'
        if include_gap and color is None
        else ""
    )
    return f"""
  <g id="automy-symbol" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path id="left-ascending-stroke" d="{LEFT_PATH}" stroke="{blue_stroke}" stroke-width="30"/>
    <path id="right-ascending-stroke" d="{RIGHT_PATH}" stroke="{blue_stroke}" stroke-width="30"/>{gap}
    <path id="data-flow-crossbar" d="{FLOW_PATH}" stroke="{flow_stroke}" stroke-width="26"/>
  </g>
"""


def svg_shell(width: int, height: int, body: str, view_box: str | None = None) -> str:
    vb = view_box or f"0 0 {width} {height}"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="{vb}" role="img" aria-labelledby="title desc">
  <title id="title">Automy brand asset</title>
  <desc id="desc">Original vector identity for Automy, a logistics software platform.</desc>
{body}
</svg>"""


def logo_horizontal(white: bool = False, black: bool = False) -> str:
    word = "#FFFFFF" if white else ("#000000" if black else NAVY)
    support = "#CBD5E1" if white else ("#000000" if black else TEXT_SECONDARY)
    symbol_color = "#FFFFFF" if white else ("#000000" if black else None)
    defs = "" if symbol_color else svg_defs("horizontal")
    body = f"""
{defs}
  <g id="logo-horizontal">
    <g id="symbol" transform="translate(28 22) scale(0.58)">
{symbol_group(symbol_color, "horizontal", include_gap=not symbol_color)}
    </g>
    <text id="wordmark" x="166" y="93" fill="{word}" font-family="Geist, Inter, Arial, sans-serif" font-size="62" font-weight="700" font-kerning="normal" letter-spacing="-0.4">Automy</text>
    <text id="descriptor" x="169" y="128" fill="{support}" font-family="Geist, Inter, Arial, sans-serif" font-size="9.5" font-weight="600" letter-spacing="3.1">SOFTWARE PARA LOGISTICA E TRANSPORTADORAS</text>
  </g>
"""
    return svg_shell(640, 180, body)


def logo_vertical() -> str:
    body = f"""
{svg_defs("vertical")}
  <g id="logo-vertical">
    <g id="symbol" transform="translate(74 18) scale(0.72)">
{symbol_group(None, "vertical")}
    </g>
    <text id="wordmark" x="160" y="224" text-anchor="middle" fill="{NAVY}" font-family="Geist, Inter, Arial, sans-serif" font-size="47" font-weight="700" font-kerning="normal" letter-spacing="-0.2">Automy</text>
  </g>
"""
    return svg_shell(320, 260, body)


def symbol_svg(color: str | None = None) -> str:
    defs = "" if color else svg_defs("symbol")
    body = f"""
{defs}
  <g id="symbol-artwork">
{symbol_group(color, "symbol", include_gap=color is None)}
  </g>
"""
    return svg_shell(240, 240, body)


def favicon_svg() -> str:
    body = f"""
  <rect id="favicon-background" x="2" y="2" width="60" height="60" rx="15" fill="{BLUE}"/>
  <g id="favicon-symbol" transform="translate(6 5) scale(0.22)">
{symbol_group("#FFFFFF", "favicon", include_gap=False)}
  </g>
"""
    return svg_shell(64, 64, body)


def pwa_icon_svg() -> str:
    body = f"""
  <rect id="pwa-background" width="512" height="512" rx="112" fill="{BLUE}"/>
  <g id="pwa-symbol" transform="translate(30 20) scale(1.93)">
{symbol_group("#FFFFFF", "pwa", include_gap=False)}
  </g>
"""
    return svg_shell(512, 512, body)


def brand_colors_svg() -> str:
    palette = [
        ("Primary Blue", BLUE, "Acoes principais, foco e destaque"),
        ("Deep Navy", NAVY, "Marca, navegacao e texto forte"),
        ("Accent Teal", TEAL, "Conexao, fluxo e apoio visual"),
        ("Success", SUCCESS, "Estados positivos"),
        ("Warning", WARNING, "Pendencias e alertas"),
        ("Error", ERROR, "Falhas e acoes destrutivas"),
        ("Background", BG, "Fundo claro da aplicacao"),
        ("Surface", SURFACE, "Cards, modais e paineis"),
        ("Text", TEXT, "Texto primario"),
        ("Secondary Text", TEXT_SECONDARY, "Texto auxiliar"),
    ]
    swatches = []
    for index, (name, hex_value, use) in enumerate(palette):
        x = 48 + (index % 2) * 430
        y = 122 + (index // 2) * 108
        stroke = BORDER if hex_value in {SURFACE, BG} else "none"
        swatches.append(
            f"""
  <g id="swatch-{index + 1}" transform="translate({x} {y})">
    <rect width="76" height="76" rx="18" fill="{hex_value}" stroke="{stroke}"/>
    <text x="100" y="24" fill="{TEXT}" font-family="Geist, Inter, Arial, sans-serif" font-size="20" font-weight="700">{name}</text>
    <text x="100" y="48" fill="{TEXT_SECONDARY}" font-family="Geist, Inter, Arial, sans-serif" font-size="14" font-weight="600">{hex_value}</text>
    <text x="100" y="70" fill="{TEXT_SECONDARY}" font-family="Geist, Inter, Arial, sans-serif" font-size="12">{use}</text>
  </g>"""
        )
    body = f"""
  <rect width="960" height="680" rx="28" fill="{BG}"/>
  <rect x="24" y="24" width="912" height="632" rx="24" fill="{SURFACE}" stroke="{BORDER}"/>
  <text x="48" y="72" fill="{TEXT}" font-family="Geist, Inter, Arial, sans-serif" font-size="30" font-weight="700">Automy Brand Colors</text>
  <text x="48" y="96" fill="{TEXT_SECONDARY}" font-family="Geist, Inter, Arial, sans-serif" font-size="14">Paleta oficial para produtos SaaS de logistica, automacao e controle operacional.</text>
{''.join(swatches)}
"""
    return svg_shell(960, 680, body)


def cubic_points(points: tuple[float, float, float, float, float, float, float, float], steps: int = 36) -> list[tuple[float, float]]:
    x0, y0, x1, y1, x2, y2, x3, y3 = points
    out: list[tuple[float, float]] = []
    for i in range(steps + 1):
        t = i / steps
        mt = 1 - t
        x = mt**3 * x0 + 3 * mt**2 * t * x1 + 3 * mt * t**2 * x2 + t**3 * x3
        y = mt**3 * y0 + 3 * mt**2 * t * y1 + 3 * mt * t**2 * y2 + t**3 * y3
        out.append((x, y))
    return out


def transformed(points: list[tuple[float, float]], scale: float, offset: tuple[float, float]) -> list[tuple[float, float]]:
    ox, oy = offset
    return [(ox + x * scale, oy + y * scale) for x, y in points]


def rounded_polyline(draw: ImageDraw.ImageDraw, pts: list[tuple[float, float]], fill: tuple[int, int, int, int], width: int) -> None:
    for start, end in zip(pts, pts[1:]):
        draw.line((start, end), fill=fill, width=width)
    r = width / 2
    for x, y in pts:
        draw.ellipse((x - r, y - r, x + r, y + r), fill=fill)


def draw_symbol(
    draw: ImageDraw.ImageDraw,
    scale: float,
    offset: tuple[float, float],
    color: tuple[int, int, int, int] | None = None,
    include_gap: bool = True,
) -> None:
    blue = color or (37, 99, 235, 255)
    teal = color or (20, 184, 166, 255)
    white = (255, 255, 255, 255)
    w_main = max(1, int(round(30 * scale)))
    w_gap = max(1, int(round(30 * scale)))
    w_flow = max(1, int(round(26 * scale)))
    left = transformed(cubic_points((54, 190, 70, 150, 88, 98, 110, 52)), scale, offset)
    right = transformed(cubic_points((121, 52, 142, 99, 162, 150, 180, 190)), scale, offset)
    gap = transformed(cubic_points((117, 122, 128, 122, 140, 122, 151, 122), 8), scale, offset)
    flow = transformed(cubic_points((104, 126, 124, 135, 147, 146, 170, 156), 20), scale, offset)
    rounded_polyline(draw, left, blue, w_main)
    rounded_polyline(draw, right, blue, w_main)
    if include_gap and color is None:
        rounded_polyline(draw, gap, white, w_gap)
    rounded_polyline(draw, flow, teal, w_flow)


def symbol_offset(size: int, scale: float) -> tuple[float, float]:
    cx, cy = SYMBOL_CENTER
    return (size / 2 - cx * scale, size / 2 - cy * scale)


def write_icon_png(path: Path, size: int) -> None:
    ss = 4
    image = Image.new("RGBA", (size * ss, size * ss), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    radius = int(size * ss * 0.22)
    inset = max(0, int(size * ss * 0.015))
    draw.rounded_rectangle((inset, inset, size * ss - inset, size * ss - inset), radius=radius, fill=(37, 99, 235, 255))
    scale = size * ss * 0.82 / 240
    draw_symbol(draw, scale, symbol_offset(size * ss, scale), (255, 255, 255, 255), include_gap=False)
    image = image.resize((size, size), Image.Resampling.LANCZOS)
    image.save(path)


def pdf_symbol_path(c: canvas.Canvas, x: float, y: float, s: float, path: tuple[float, ...]) -> None:
    x0, y0, x1, y1, x2, y2, x3, y3 = path
    p = c.beginPath()
    p.moveTo(x + x0 * s, y + (240 - y0) * s)
    p.curveTo(x + x1 * s, y + (240 - y1) * s, x + x2 * s, y + (240 - y2) * s, x + x3 * s, y + (240 - y3) * s)
    c.drawPath(p)


def draw_pdf_symbol(c: canvas.Canvas, x: float, y: float, s: float, mono: bool = False) -> None:
    c.setLineCap(1)
    c.setLineJoin(1)
    c.setLineWidth(30 * s)
    c.setStrokeColor(colors.HexColor("#FFFFFF" if mono else BLUE))
    pdf_symbol_path(c, x, y, s, (54, 190, 70, 150, 88, 98, 110, 52))
    pdf_symbol_path(c, x, y, s, (121, 52, 142, 99, 162, 150, 180, 190))
    if not mono:
        c.setLineWidth(30 * s)
        c.setStrokeColor(colors.white)
        pdf_symbol_path(c, x, y, s, (117, 122, 128, 122, 140, 122, 151, 122))
    c.setLineWidth(26 * s)
    c.setStrokeColor(colors.HexColor("#FFFFFF" if mono else TEAL))
    pdf_symbol_path(c, x, y, s, (104, 126, 124, 135, 147, 146, 170, 156))


def make_guidelines_pdf() -> None:
    path = OUT / "brand-guidelines.pdf"
    c = canvas.Canvas(str(path), pagesize=A4)
    w, h = A4

    def header(title: str) -> None:
        c.setFillColor(colors.HexColor(BG))
        c.rect(0, 0, w, h, fill=1, stroke=0)
        c.setFillColor(colors.HexColor(TEXT))
        c.setFont("Helvetica-Bold", 22)
        c.drawString(22 * mm, h - 24 * mm, title)
        c.setStrokeColor(colors.HexColor("#CBD5E1"))
        c.line(22 * mm, h - 30 * mm, w - 22 * mm, h - 30 * mm)

    header("Automy Brand Guidelines")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor(TEXT_SECONDARY))
    c.drawString(22 * mm, h - 38 * mm, "Identidade visual para plataforma SaaS de logistica, automacao e controle operacional.")
    c.setFillColor(colors.HexColor(BLUE))
    c.roundRect(22 * mm, 112 * mm, 60 * mm, 60 * mm, 14 * mm, fill=1, stroke=0)
    draw_pdf_symbol(c, 27 * mm, 116 * mm, 0.72, mono=True)
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 42)
    c.drawString(92 * mm, 147 * mm, "Automy")
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.HexColor(TEXT_SECONDARY))
    c.drawString(93 * mm, 138 * mm, "Software que conecta dados, processos e operacoes.")
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(colors.HexColor(TEXT))
    c.drawString(22 * mm, 84 * mm, "Conceito refinado")
    c.setFont("Helvetica", 10)
    text = c.beginText(22 * mm, 77 * mm)
    text.setFillColor(colors.HexColor(TEXT_SECONDARY))
    for line in [
        "O simbolo parte de um A geometrico formado por dois vetores ascendentes.",
        "A barra transversal representa fluxo de dados e conexao operacional.",
        "A relacao entre azul e teal reforca controle, tecnologia e movimento.",
    ]:
        text.textLine(line)
    c.drawText(text)
    c.showPage()

    header("Construcao e Espacamento")
    c.setStrokeColor(colors.HexColor("#CBD5E1"))
    for i in range(14):
        x = 22 * mm + i * 6 * mm
        c.line(x, 52 * mm, x, 130 * mm)
        y = 52 * mm + i * 6 * mm
        c.line(22 * mm, y, 100 * mm, y)
    draw_pdf_symbol(c, 22 * mm, 50 * mm, 1.35)
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 13)
    c.drawString(116 * mm, 122 * mm, "Proporcao e area livre")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor(TEXT_SECONDARY))
    for idx, line in enumerate([
        "Use o modulo A como area minima de protecao.",
        "Mantenha alinhamento optico entre simbolo e wordmark.",
        "Tamanho minimo: 25 mm impresso, 32 px digital.",
        "Favicons e PWA usam a versao branca simplificada.",
    ]):
        c.drawString(116 * mm, (114 - idx * 6) * mm, line)
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(colors.HexColor(TEXT))
    c.drawString(22 * mm, 35 * mm, "Nao distorcer, rotacionar, alterar cores ou adicionar sombras.")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor(TEXT_SECONDARY))
    c.drawString(22 * mm, 29 * mm, "Nao aplicar sobre fundos sem contraste suficiente.")
    c.showPage()

    header("Cores e Tipografia")
    palette = [
        ("Primary Blue", BLUE),
        ("Deep Navy", NAVY),
        ("Accent Teal", TEAL),
        ("Success", SUCCESS),
        ("Warning", WARNING),
        ("Error", ERROR),
    ]
    for index, (name, hex_value) in enumerate(palette):
        x = 22 * mm + (index % 3) * 56 * mm
        y = 133 * mm - (index // 3) * 42 * mm
        c.setFillColor(colors.HexColor(hex_value))
        c.roundRect(x, y, 32 * mm, 20 * mm, 4 * mm, fill=1, stroke=0)
        c.setFillColor(colors.HexColor(TEXT))
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x, y - 6 * mm, name)
        c.setFont("Helvetica", 8)
        c.setFillColor(colors.HexColor(TEXT_SECONDARY))
        c.drawString(x, y - 11 * mm, hex_value)
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 36)
    c.drawString(22 * mm, 54 * mm, "Aa")
    c.setFont("Helvetica-Bold", 18)
    c.drawString(54 * mm, 56 * mm, "Geist")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor(TEXT_SECONDARY))
    c.drawString(54 * mm, 48 * mm, "Fallback: Inter. Pesos: 400, 500, 600, 700.")
    c.showPage()

    header("Versoes e Aplicacoes")
    c.setFillColor(colors.HexColor(SURFACE))
    c.roundRect(22 * mm, 122 * mm, 74 * mm, 44 * mm, 7 * mm, fill=1, stroke=0)
    draw_pdf_symbol(c, 26 * mm, 125 * mm, 0.42)
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 22)
    c.drawString(57 * mm, 141 * mm, "Automy")
    c.setFillColor(colors.HexColor(NAVY))
    c.roundRect(106 * mm, 122 * mm, 74 * mm, 44 * mm, 7 * mm, fill=1, stroke=0)
    draw_pdf_symbol(c, 110 * mm, 125 * mm, 0.42, mono=True)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(141 * mm, 141 * mm, "Automy")
    c.setFillColor(colors.HexColor(BLUE))
    c.roundRect(22 * mm, 78 * mm, 28 * mm, 28 * mm, 7 * mm, fill=1, stroke=0)
    draw_pdf_symbol(c, 24 * mm, 80 * mm, 0.31, mono=True)
    c.setFillColor(colors.HexColor(TEXT))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(58 * mm, 96 * mm, "Icone independente")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor(TEXT_SECONDARY))
    c.drawString(58 * mm, 89 * mm, "Use em favicon, PWA, avatar e assinaturas compactas.")
    c.drawString(22 * mm, 59 * mm, "Use a versao colorida em fundos claros e a versao branca em fundos escuros.")
    c.drawString(22 * mm, 52 * mm, "Use monocromatico preto apenas quando a reproducao colorida nao for possivel.")
    c.save()


def draw_text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font: ImageFont.FreeTypeFont, fill: str) -> None:
    draw.text(xy, text, font=font, fill=fill)


def make_preview_png() -> None:
    w, h = 1800, 1200
    ss = 3
    image = Image.new("RGBA", (w * ss, h * ss), BG)
    draw = ImageDraw.Draw(image)

    def box(values: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
        return tuple(int(v * ss) for v in values)  # type: ignore[return-value]

    def point(values: tuple[int, int]) -> tuple[int, int]:
        return (int(values[0] * ss), int(values[1] * ss))

    def rr(values: tuple[int, int, int, int], radius: int, fill: str, outline: str | None = None, width: int = 1) -> None:
        draw.rounded_rectangle(box(values), radius=radius * ss, fill=fill, outline=outline, width=width * ss)

    def text_at(xy: tuple[int, int], text: str, font_name: str, size: int, fill: str) -> None:
        draw.text(point(xy), text, font=ImageFont.truetype(font_path(font_name), size * ss), fill=fill)

    def symbol_at(scale: float, offset: tuple[int, int], color: tuple[int, int, int, int] | None = None, include_gap: bool = True) -> None:
        draw_symbol(draw, scale * ss, (offset[0] * ss, offset[1] * ss), color, include_gap)

    rr((44, 44, w - 44, h - 44), 34, SURFACE, BORDER, 2)
    text_at((88, 78), "Automy Brand Kit", "bold", 58, TEXT)
    text_at((90, 146), "Identidade refinada para software SaaS de logistica e operacoes.", "regular", 22, TEXT_SECONDARY)

    rr((88, 226, 830, 470), 24, "#FFFFFF", BORDER, 2)
    symbol_at(0.75, (116, 230))
    text_at((286, 300), "Automy", "bold", 82, TEXT)
    text_at((291, 388), "SOFTWARE PARA LOGISTICA E TRANSPORTADORAS", "semibold", 18, TEXT_SECONDARY)

    rr((900, 226, 1284, 470), 24, BG, BORDER, 2)
    symbol_at(0.78, (986, 244))
    text_at((1048, 420), "Simbolo", "semibold", 28, TEXT)

    rr((1330, 226, 1710, 470), 24, NAVY)
    symbol_at(0.78, (1416, 244), (255, 255, 255, 255), include_gap=False)
    text_at((1418, 420), "Monocromatico", "semibold", 28, "#FFFFFF")

    text_at((88, 544), "Versoes", "semibold", 28, TEXT)
    for i, (label, fill, symbol_color) in enumerate([
        ("Colorida", "#FFFFFF", None),
        ("Branca", NAVY, (255, 255, 255, 255)),
        ("Preta", "#FFFFFF", (0, 0, 0, 255)),
    ]):
        x = 88 + i * 405
        rr((x, 590, x + 340, 740), 22, fill, BORDER if fill == "#FFFFFF" else fill, 2)
        symbol_at(0.40, (x + 28, 590), symbol_color, include_gap=symbol_color is None)
        text_color = "#FFFFFF" if fill == NAVY else TEXT
        text_at((x + 122, 636), "Automy", "bold", 42, text_color)
        text_at((x, 758), label, "regular", 18, TEXT_SECONDARY)

    text_at((1340, 544), "Icones", "semibold", 28, TEXT)
    for i, size in enumerate([64, 96, 128]):
        x = 1340 + i * 118
        y = 602
        rr((x, y, x + size, y + size), int(size * 0.22), BLUE)
        icon_scale = size * 0.82 / 240
        local_offset = symbol_offset(size, icon_scale)
        draw_symbol(draw, icon_scale * ss, ((x + local_offset[0]) * ss, (y + local_offset[1]) * ss), (255, 255, 255, 255), include_gap=False)
        text_at((x, 746), f"{size} px", "regular", 18, TEXT_SECONDARY)

    text_at((88, 846), "Paleta", "semibold", 28, TEXT)
    palette = [
        ("Primary", BLUE),
        ("Navy", NAVY),
        ("Teal", TEAL),
        ("Success", SUCCESS),
        ("Warning", WARNING),
        ("Error", ERROR),
        ("Surface", SURFACE),
        ("Text", TEXT),
    ]
    for i, (name, value) in enumerate(palette):
        x = 88 + i * 205
        rr((x, 904, x + 96, 1000), 22, value, BORDER if value == SURFACE else value, 2)
        text_at((x, 1020), name, "regular", 18, TEXT)
        text_at((x, 1046), value, "regular", 18, TEXT_SECONDARY)

    rr((88, 1100, 1710, 1110), 5, BORDER)
    image = image.resize((w, h), Image.Resampling.LANCZOS)
    image.save(OUT / "brand-kit-preview.png")


def make_readme() -> None:
    write(
        OUT / "README.md",
        f"""
# Automy Brand Kit

Kit oficial de marca da Automy, criado originalmente em SVG com elementos vetoriais limpos.

## Estrutura

- `automy-logo-horizontal.svg`: logo principal colorido.
- `automy-logo-vertical.svg`: versao empilhada.
- `automy-symbol.svg`: simbolo A isolado.
- `automy-symbol-monochrome.svg`: simbolo em uma unica cor.
- `automy-logo-white.svg`: logo completa para fundos escuros.
- `automy-logo-black.svg`: logo monocromatica preta.
- `favicon.svg`: favicon vetorial.
- `favicon-16.png`, `favicon-32.png`, `favicon-48.png`: favicons raster.
- `apple-touch-icon.png`: icone 180x180.
- `android-chrome-192.png`, `android-chrome-512.png`: icones Android/PWA.
- `pwa-icon.svg`: icone PWA vetorial.
- `brand-colors.svg`: prancha vetorial de cores oficiais.
- `brand-kit-preview.png`: prancha de validacao visual.
- `brand-guidelines.pdf`: manual simples de aplicacao.

## Cores

- Primary Blue: `{BLUE}`
- Deep Navy: `{NAVY}`
- Accent Teal: `{TEAL}`
- Background: `{BG}`
- Surface: `{SURFACE}`
- Text: `{TEXT}`
- Secondary Text: `{TEXT_SECONDARY}`
- Success: `{SUCCESS}`
- Warning: `{WARNING}`
- Error: `{ERROR}`

## Tipografia

Use Geist como fonte principal. Caso nao esteja disponivel, use Inter.

Pesos recomendados: 400, 500, 600 e 700.

## Regras de uso

- Use o logo colorido em fundos claros.
- Use `automy-logo-white.svg` em fundos escuros.
- Use o simbolo isolado apenas quando o contexto ja identificar a marca.
- Mantenha area livre equivalente a altura do simbolo ao redor do logo.
- Nao distorca, rotacione, altere cores, adicione sombras ou use sobre fundos sem contraste.
- Favicons e icones PWA usam a versao branca simplificada sobre Primary Blue.

## Uso em web

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```
""",
    )


def validate_svgs() -> None:
    for svg in OUT.glob("*.svg"):
        tree = ET.parse(svg)
        root = tree.getroot()
        if "viewBox" not in root.attrib:
            raise ValueError(f"Missing viewBox: {svg.name}")
        for element in root.iter():
            tag = element.tag.split("}")[-1].lower()
            if tag == "image":
                raise ValueError(f"Embedded image found: {svg.name}")
            if element.attrib.get("opacity") == "0":
                raise ValueError(f"Invisible element found: {svg.name}")


def validate_outputs() -> None:
    validate_svgs()
    expected_pngs = {
        "favicon-16.png": (16, 16),
        "favicon-32.png": (32, 32),
        "favicon-48.png": (48, 48),
        "apple-touch-icon.png": (180, 180),
        "android-chrome-192.png": (192, 192),
        "android-chrome-512.png": (512, 512),
        "brand-kit-preview.png": (1800, 1200),
    }
    for name, size in expected_pngs.items():
        with Image.open(OUT / name) as img:
            if img.size != size:
                raise ValueError(f"Invalid PNG size for {name}: {img.size}")
            if img.mode != "RGBA":
                raise ValueError(f"PNG is not RGBA: {name}")
    reader = PdfReader(str(OUT / "brand-guidelines.pdf"))
    if len(reader.pages) != 4:
        raise ValueError("brand-guidelines.pdf must have 4 pages")


def make_rar() -> None:
    rar = Path("C:/Program Files/WinRAR/Rar.exe")
    if RAR_PATH.exists():
        RAR_PATH.unlink()
    subprocess.run([str(rar), "a", "-r", "-ep1", str(RAR_PATH), str(OUT)], check=True, cwd=ROOT)


def main() -> None:
    ensure_out()
    write(OUT / "automy-logo-horizontal.svg", logo_horizontal())
    write(OUT / "automy-logo-vertical.svg", logo_vertical())
    write(OUT / "automy-symbol.svg", symbol_svg())
    write(OUT / "automy-symbol-monochrome.svg", symbol_svg(color=NAVY))
    write(OUT / "automy-logo-white.svg", logo_horizontal(white=True))
    write(OUT / "automy-logo-black.svg", logo_horizontal(black=True))
    write(OUT / "favicon.svg", favicon_svg())
    write(OUT / "pwa-icon.svg", pwa_icon_svg())
    write(OUT / "brand-colors.svg", brand_colors_svg())
    for filename, size in [
        ("favicon-16.png", 16),
        ("favicon-32.png", 32),
        ("favicon-48.png", 48),
        ("apple-touch-icon.png", 180),
        ("android-chrome-192.png", 192),
        ("android-chrome-512.png", 512),
    ]:
        write_icon_png(OUT / filename, size)
    make_preview_png()
    make_guidelines_pdf()
    make_readme()
    validate_outputs()
    make_rar()


if __name__ == "__main__":
    main()
