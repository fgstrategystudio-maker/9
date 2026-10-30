// Impagina un report Word a partire da una descrizione JSON (blocchi) preparata da report_docx.py.
// Grafica: A4 orizzontale, Inter, antracite, oro e crema.
// Uso: node render.js descrizione.json uscita.docx
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
  BorderStyle, HeadingLevel, LevelFormat, PageBreak, Footer, Header, PageNumber, PageOrientation, ImageRun,
} = require('docx');

const [, , specPath, outPath] = process.argv;
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const INK = '1A1A1A', GOLD = 'D8B86A', MID = '6B6B6B', LG = 'F7F6F2', F = 'Inter', W = 15038;
const nb = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NB = { top: nb, bottom: nb, left: nb, right: nb };

const t = (x, o = {}) => new TextRun({ text: x, font: F, size: 19, ...o });
// "testo con **grassetto**" -> runs
function runs(x, o = {}) {
  if (Array.isArray(x)) return x.flatMap((y) => runs(y, o));
  return String(x).split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((s) =>
    s.startsWith('**') ? t(s.slice(2, -2), { ...o, bold: true }) : t(s, o));
}
const p = (x, o = {}) => new Paragraph({ spacing: { after: 100, line: 276 }, ...o, children: runs(x) });
const gap = () => new Paragraph({ spacing: { after: 200 }, children: [] });
const sp = () => new Paragraph({ spacing: { after: 60 }, children: [] });
const pb = () => new Paragraph({ children: [new PageBreak()] });
let lista = 0;

function h1(n, titolo) {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [1500, W - 1500],
    rows: [new TableRow({ children: [
      new TableCell({ borders: NB, shading: { fill: GOLD, type: ShadingType.CLEAR, color: 'auto' }, width: { size: 1500, type: WidthType.DXA }, verticalAlign: 'center', margins: { top: 200, bottom: 200, left: 200, right: 200 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [t(String(n), { size: 52, bold: true, color: INK })] })] }),
      new TableCell({ borders: NB, shading: { fill: INK, type: ShadingType.CLEAR, color: 'auto' }, width: { size: W - 1500, type: WidthType.DXA }, verticalAlign: 'center', margins: { top: 200, bottom: 200, left: 360, right: 200 }, children: [new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(titolo, { size: 40, bold: true, color: 'FFFFFF' })] })] }),
    ] })],
  });
}
const h2 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: s, font: F })] });
const bul = (x) => new Paragraph({ numbering: { reference: 'b', level: 0 }, spacing: { after: 80, line: 290 }, children: runs(x) });
const num = (x) => new Paragraph({ numbering: { reference: 'n', level: 0, instance: lista }, spacing: { after: 80, line: 290 }, children: runs(x) });
const note = (s) => new Paragraph({ spacing: { after: 100, line: 276 }, children: runs(s, { size: 17, italics: true, color: MID }) });

const bd = { style: BorderStyle.SINGLE, size: 4, color: 'E4E0D6' };
function cell(x, w, o = {}) {
  return new TableCell({ borders: { top: nb, bottom: bd, left: nb, right: nb }, width: { size: w, type: WidthType.DXA }, shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined, margins: { top: 70, bottom: 70, left: 140, right: 140 }, children: [new Paragraph({ alignment: o.al || AlignmentType.LEFT, children: runs(String(x ?? ''), { size: 18, bold: o.bold, color: o.color }) })] });
}
function table(b) {
  const w0 = b.widths || b.head.map(() => 1);
  const sm = w0.reduce((a, x) => a + x, 0);
  const widths = w0.map((x) => Math.floor(x * W / sm));
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, rows: [
    new TableRow({ tableHeader: true, children: b.head.map((x, i) => cell(x, widths[i], { fill: INK, bold: true, color: 'FFFFFF', al: i ? AlignmentType.RIGHT : AlignmentType.LEFT })) }),
    ...b.rows.map((r, ri) => { const last = b.total && ri === b.rows.length - 1; return new TableRow({ children: r.map((c, i) => cell(c, widths[i], { fill: last ? 'F3EBD6' : 'FFFFFF', bold: last || (b.boldFirst && i === 0), al: i ? AlignmentType.RIGHT : AlignmentType.LEFT })) }); }),
  ] });
}
function kpis(items) {
  const w = Math.floor(W / items.length);
  const g = { style: BorderStyle.SINGLE, size: 48, color: 'FFFFFF' }, gt = { style: BorderStyle.SINGLE, size: 24, color: GOLD };
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: items.map(() => w), rows: [new TableRow({ children: items.map(([v, l]) => new TableCell({ borders: { top: gt, bottom: g, left: g, right: g }, shading: { fill: LG, type: ShadingType.CLEAR, color: 'auto' }, width: { size: w, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 240, right: 160 }, children: [new Paragraph({ children: [t(v, { size: 36, bold: true, color: INK })] }), new Paragraph({ spacing: { before: 40 }, children: [t(String(l).toUpperCase(), { size: 15, color: MID, characterSpacing: 20 })] })] })) })] });
}
function box(x) {
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({ borders: { top: nb, bottom: nb, right: nb, left: { style: BorderStyle.SINGLE, size: 36, color: GOLD } }, shading: { fill: LG, type: ShadingType.CLEAR, color: 'auto' }, width: { size: W, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 220, right: 180 }, children: [new Paragraph({ spacing: { line: 290 }, children: runs(x) })] })] })] });
}
function cards(items) {
  const cw = Math.floor(W / items.length);
  const g = { style: BorderStyle.SINGLE, size: 48, color: 'FFFFFF' }, gt = { style: BorderStyle.SINGLE, size: 24, color: GOLD };
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: items.map(() => cw), rows: [new TableRow({ children: items.map(([h, tx]) => new TableCell({ borders: { top: gt, bottom: g, left: g, right: g }, shading: { fill: LG, type: ShadingType.CLEAR, color: 'auto' }, width: { size: cw, type: WidthType.DXA }, margins: { top: 160, bottom: 160, left: 240, right: 200 }, children: [new Paragraph({ spacing: { after: 80 }, children: [t(h, { size: 22, bold: true, color: INK })] }), new Paragraph({ spacing: { line: 276 }, children: runs(tx, { size: 18, color: '3A3A3A' }) })] })) })] });
}
function takeaways(items) {
  const hl = { style: BorderStyle.SINGLE, size: 4, color: 'E4E0D6' };
  return items.map((x, i) => new Paragraph({ spacing: { before: 60, after: 120 }, border: { bottom: hl }, children: [t(String(i + 1).padStart(2, '0') + '   ', { size: 30, bold: true, color: GOLD }), t(x[0] + ' ', { bold: true, size: 20 }), ...runs(x[1], { size: 19, color: '3A3A3A' })] }));
}
function image(b) {
  const w = b.width, h = Math.round(w * b.h / b.w);
  const out = [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: b.cap ? 40 : 160 }, children: [new ImageRun({ type: b.path.endsWith('.jpg') || b.path.endsWith('.jpeg') ? 'jpg' : 'png', data: fs.readFileSync(b.path), transformation: { width: w, height: h }, altText: { title: b.cap || 'grafico', description: b.cap || 'grafico', name: 'immagine' } })] })];
  if (b.cap) out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 140 }, children: [t(b.cap, { size: 16, italics: true, color: MID })] }));
  return out;
}
function cols(b) {
  const n = b.items.length;
  const parts = b.ratio || b.items.map(() => 1 / n);
  const widths = parts.map((x) => Math.floor(W * x));
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, rows: [new TableRow({ children: b.items.map((blocks, i) => new TableCell({ borders: NB, width: { size: widths[i], type: WidthType.DXA }, verticalAlign: b.vcenter ? 'center' : 'top', margins: { left: 60, right: i < n - 1 ? 240 : 60 }, children: blocks.flatMap(render) })) })] });
}
function cover(b) {
  const lines = [
    new Paragraph({ spacing: { after: 200 }, children: [t(b.occhiello, { size: 24, bold: true, color: GOLD, characterSpacing: 40 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [t(b.titolo, { size: 88, bold: true, color: 'FFFFFF' })] }),
    new Paragraph({ spacing: { after: 500 }, border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: GOLD, space: 14 } }, children: [t(b.sottotitolo, { size: 44, color: GOLD })] }),
    new Paragraph({ spacing: { after: 120 }, children: [t(b.locali, { size: 24, color: 'D9D4C7' })] }),
    ...(b.righe || []).map((r) => new Paragraph({ spacing: { after: 80 }, children: [t(r, { size: 20, color: 'A8A39A' })] })),
  ];
  return [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ height: { value: 9600, rule: 'exact' }, children: [new TableCell({ borders: NB, shading: { fill: INK, type: ShadingType.CLEAR, color: 'auto' }, width: { size: W, type: WidthType.DXA }, verticalAlign: 'center', margins: { top: 600, bottom: 600, left: 1100, right: 900 }, children: lines })] })] }), pb()];
}

function render(b) {
  switch (b.t) {
    case 'cover': return cover(b);
    case 'h1': return [h1(b.n, b.titolo), gap()];
    case 'h2': return [h2(b.s)];
    case 'p': return [p(b.s)];
    case 'note': return [note(b.s)];
    case 'bul': return b.items.map(bul);
    case 'num': lista += 1; return b.items.map(num);
    case 'table': return [table(b), sp()];
    case 'kpis': return [kpis(b.items), sp()];
    case 'cards': return [cards(b.items), sp()];
    case 'takeaways': return takeaways(b.items);
    case 'box': return [box(b.s), sp()];
    case 'img': return image(b);
    case 'cols': return [cols(b), sp()];
    case 'sp': return [sp()];
    case 'pb': return [pb()];
    default: throw new Error('blocco sconosciuto: ' + b.t);
  }
}

const children = spec.blocchi.flatMap(render);
const doc = new Document({
  creator: spec.autore || '',
  title: spec.titolo || '',
  numbering: { config: [
    { reference: 'b', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }] },
    { reference: 'n', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 300 } } } }] },
  ] },
  styles: { default: { document: { run: { font: F, size: 20 } } }, paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: F, color: INK }, paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, font: F, color: INK }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1, border: { left: { style: BorderStyle.SINGLE, size: 36, color: GOLD, space: 10 } }, indent: { left: 200 } } },
  ] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 900, bottom: 800, left: 900, right: 900 } } },
    headers: { default: new Header({ children: [new Paragraph({ children: [t(spec.testata_oro, { size: 16, bold: true, color: GOLD }), t('   ' + spec.testata, { size: 16, color: MID })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [t(spec.piede + ' · ', { size: 16, color: MID }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MID, font: F })] })] }) },
    children,
  }],
});
Packer.toBuffer(doc).then((x) => { fs.writeFileSync(outPath, x); });
