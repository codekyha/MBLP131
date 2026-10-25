// deck.js -- shared slide helpers for MCMP117 (Charcoal Minimal + mint accent)
// Layout: LAYOUT_WIDE (13.333 x 7.5 in). Fonts: Cambria (titles), Calibri (body), Consolas (code).
const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

const C = {
  dark: "212121", charcoal: "36454F", slate: "50808E", mint: "02C39A", mintDeep: "028090",
  light: "F2F2F2", white: "FFFFFF", mutedOnDark: "8A9AA0", mutedOnLight: "6B7679",
  red: "B5453A", amber: "C98A1B",
};
const F = { title: "Cambria", body: "Calibri", code: "Consolas" };
const W = 13.333, H = 7.5, MX = 0.6;

const shadow = () => ({ type: "outer", color: "000000", opacity: 0.12, blur: 8, offset: 2, angle: 90 });

// UI strings per language. lang: "en" (MCMP117) or "tr" (MBLP131).
const L = {
  en: { code: "MCMP117", footer: "MCMP117 — Fundamentals of Operating Systems", week: "Week", nextWeek: "NEXT WEEK",
        willCover: w => `Week ${w} will cover:`, questions: "QUESTIONS?", discussion: "Discussion",
        askTelegram: "If you have questions after class, ask them on the course Telegram channel — everyone benefits from the answer.",
        name: "Asst. Prof. Dr. Hasan Oğuz",
        quizKicker: "Quick quiz", quizTitle: "Check Your Understanding",
        titleFoot: "Electronical Communication Technology Programme  ·  Vocational School  ·  Istanbul Okan University" },
  tr: { code: "MBLP131", footer: "MBLP131 — İşletim Sistemleri Temelleri", week: "Hafta", nextWeek: "GELECEK HAFTA",
        willCover: w => `${w}. haftanın konuları:`, questions: "SORULAR?", discussion: "Tartışma",
        askTelegram: "Dersten sonra sorularınız olursa dersin Telegram kanalında sorun — yanıttan herkes yararlanır.",
        name: "Dr. Öğr. Üyesi Hasan Oğuz",
        quizKicker: "Kısa sınav", quizTitle: "Kendinizi Sınayın",
        titleFoot: "Elektronik Haberleşme Teknolojisi Programı  ·  Meslek Yüksekokulu  ·  İstanbul Okan Üniversitesi" },
};

class Deck {
  constructor({ week, lang = "en", footer, assets }) {
    this.L = L[lang]; this.lang = lang;
    footer = footer || this.L.footer;
    this.pres = new pptxgen();
    this.pres.layout = "LAYOUT_WIDE";
    this.pres.title = `${this.L.code} ${this.L.week} ${week}`;
    this.week = week; this.footerText = footer; this.n = 0;
    this.assets = assets || path.join(__dirname);
  }
  up(t) { return this.lang === "tr" ? t.toLocaleUpperCase("tr-TR") : t.toUpperCase(); }
  // ---------- primitives ----------
  slide(dark = false) {
    const s = this.pres.addSlide();
    s.background = { color: dark ? C.dark : C.white };
    this.n += 1; s._dark = dark; s._num = this.n;
    return s;
  }
  footer(s, leftX = MX) {
    const col = s._dark ? C.mutedOnDark : C.mutedOnLight;
    s.addText(this.footerText, { x: leftX, y: 7.14, w: 7, h: 0.3, fontFace: F.body, fontSize: 9, color: col, margin: 0, isTextBox: true });
    s.addText(`${this.L.week} ${this.week}  ·  ${s._num}`, { x: W - MX - 1.5, y: 7.14, w: 1.5, h: 0.3, fontFace: F.body, fontSize: 9, color: col, align: "right", margin: 0, isTextBox: true });
  }
  header(s, kicker, title, opts = {}) {
    const dark = s._dark;
    if (kicker) s.addText(this.up(kicker), { x: MX, y: 0.32, w: 12, h: 0.32, fontFace: F.body, fontSize: 12, bold: true, color: C.mint, charSpacing: 2, margin: 0, isTextBox: true });
    s.addText(title, { x: MX, y: 0.62, w: 12.1, h: 0.85, fontFace: F.title, fontSize: opts.titleSize || 30, bold: true, color: dark ? C.white : C.charcoal, margin: 0, valign: "middle", isTextBox: true });
  }
  lead(s, text, y = 1.55, h = 0.55) {
    s.addText(text, { x: MX, y, w: 12.1, h, fontFace: F.body, fontSize: 15, color: s._dark ? C.light : "3A464C", margin: 0, valign: "top", isTextBox: true });
  }
  text(s, text, o) {
    s.addText(text, Object.assign({ fontFace: F.body, fontSize: 14, color: s._dark ? C.light : "3A464C", margin: 0, valign: "top", isTextBox: true }, o));
  }
  card(s, x, y, w, h, { title, body, fill, titleColor, bodyColor, bodySize = 13, titleSize = 15 } = {}) {
    const dark = fill === C.charcoal;
    s.addShape(this.pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill || C.light }, rectRadius: 0.06, line: { type: "none" }, shadow: shadow() });
    let ty = y + 0.2;
    if (title) {
      s.addText(title, { x: x + 0.25, y: ty, w: w - 0.5, h: 0.42, fontFace: F.title, fontSize: titleSize, bold: true, color: titleColor || (dark ? C.mint : C.mintDeep), margin: 0, valign: "middle", isTextBox: true });
      ty += 0.5;
    }
    if (body) {
      const opts = { x: x + 0.25, y: ty, w: w - 0.5, h: y + h - ty - 0.15, fontFace: F.body, fontSize: bodySize, color: bodyColor || (dark ? C.light : "3A464C"), margin: 0, valign: "top", paraSpaceAfter: 4, isTextBox: true };
      s.addText(Array.isArray(body) ? this.bulletRuns(body, bodySize) : body, opts);
    }
  }
  callout(s, x, y, w, h, text, size = 15) {
    s.addShape(this.pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.charcoal }, rectRadius: 0.06, line: { type: "none" }, shadow: shadow() });
    s.addText(text, { x: x + 0.25, y, w: w - 0.5, h, fontFace: F.body, fontSize: size, color: C.light, margin: 0, valign: "middle", isTextBox: true });
  }
  bulletRuns(items, size = 15) {
    return items.map((it, i) => {
      const last = i === items.length - 1;
      if (typeof it === "string") return { text: it, options: { bullet: { indent: 18 }, breakLine: !last, fontSize: size } };
      // {b:"Bold lead", t:" rest"}
      return [
        { text: it.b, options: { bold: true, bullet: { indent: 18 }, fontSize: size, color: it.color } },
        { text: it.t || "", options: { breakLine: !last, fontSize: size } },
      ];
    }).flat();
  }
  bullets(s, items, o = {}) {
    s.addText(this.bulletRuns(items, o.fontSize || 16), Object.assign({ x: MX, y: 1.6, w: 12.1, h: 5.2, fontFace: F.body, color: s._dark ? C.light : "3A464C", margin: 0, valign: "top", paraSpaceAfter: 9, isTextBox: true }, o));
  }
  box(s, x, y, w, h, label, { fill = C.light, color, size = 13, bold = true, font = F.body, sub, subSize = 11 } = {}) {
    s.addShape(this.pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: 0.05, line: { type: "none" } });
    const fg = color || ([C.charcoal, C.dark, C.mintDeep, C.slate].includes(fill) ? C.white : C.charcoal);
    const runs = [{ text: label, options: { bold, fontSize: size, fontFace: font, color: fg, breakLine: !!sub } }];
    if (sub) runs.push({ text: sub, options: { fontSize: subSize, color: fg, fontFace: F.body } });
    s.addText(runs, { x, y, w, h, align: "center", valign: "middle", margin: 3, isTextBox: true });
  }
  arrow(s, x1, y1, x2, y2, { color = C.slate, w = 2, both = false } = {}) {
    s.addShape(this.pres.shapes.LINE, {
      x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 0.0001, h: Math.abs(y2 - y1) || 0.0001,
      flipH: x2 < x1, flipV: y2 < y1,
      line: { color, width: w, endArrowType: "triangle", beginArrowType: both ? "triangle" : undefined },
    });
  }
  code(s, x, y, w, h, code, size = 12) {
    s.addShape(this.pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.dark }, rectRadius: 0.05, line: { type: "none" } });
    const lines = code.replace(/\n$/, "").split("\n");
    const runs = lines.map((ln, i) => {
      const t = ln.trim();
      const isComment = t.startsWith("//") || t.startsWith("/*") || t.startsWith("*") || t.startsWith("#!") || (t.startsWith("# ") && !t.startsWith("#include"));
      const isPrompt = t.startsWith("$ ");
      const color = isComment ? C.mutedOnDark : isPrompt ? C.mint : C.light;
      return { text: ln.length ? ln : " ", options: { color, breakLine: i < lines.length - 1 } };
    });
    s.addText(runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: h - 0.24, fontFace: F.code, fontSize: size, valign: "top", margin: 0, lineSpacingMultiple: 1.05, isTextBox: true });
  }
  image(s, file, bx, by, bw, bh, natW, natH) { // contain-fit, never distorted
    const ar = natW / natH; let w = bw, h = bw / ar;
    if (h > bh) { h = bh; w = bh * ar; }
    s.addImage({ path: file, x: bx + (bw - w) / 2, y: by + (bh - h) / 2, w, h });
  }
  // ---------- slide templates ----------
  titleSlide({ kicker, title, subtitle, tagline, foot }) {
    const s = this.slide(true);
    s.addText(kicker, { x: MX, y: 1.9, w: 8, h: 0.35, fontFace: F.body, fontSize: 13, bold: true, color: C.mint, charSpacing: 3, margin: 0, isTextBox: true });
    s.addText(title, { x: MX, y: 2.35, w: 9, h: 1.6, fontFace: F.title, fontSize: 40, bold: true, color: C.white, margin: 0, valign: "top", isTextBox: true });
    s.addText(subtitle, { x: MX, y: 4.05, w: 11, h: 0.5, fontFace: F.body, fontSize: 20, color: C.light, margin: 0, isTextBox: true });
    if (tagline) s.addText(tagline, { x: MX, y: 4.55, w: 11, h: 0.4, fontFace: F.body, fontSize: 14, italic: true, color: C.mutedOnDark, margin: 0, isTextBox: true });
    s.addText(foot || this.L.titleFoot, { x: MX, y: 6.8, w: 11, h: 0.3, fontFace: F.body, fontSize: 10, color: C.mutedOnDark, margin: 0, isTextBox: true });
    return s;
  }
  sectionSlide({ kicker, title, subtitle }) {
    const s = this.slide(true);
    s.addText(this.up(kicker), { x: MX, y: 2.75, w: 10, h: 0.35, fontFace: F.body, fontSize: 13, bold: true, color: C.mint, charSpacing: 3, margin: 0, isTextBox: true });
    s.addText(title, { x: MX, y: 3.15, w: 12, h: 0.95, fontFace: F.title, fontSize: 38, bold: true, color: C.white, margin: 0, isTextBox: true });
    if (subtitle) s.addText(subtitle, { x: MX, y: 4.15, w: 11.5, h: 0.5, fontFace: F.body, fontSize: 16, italic: true, color: C.light, margin: 0, isTextBox: true });
    this.footer(s); return s;
  }
  content({ kicker, title, lead, dark = false, titleSize }) {
    const s = this.slide(dark);
    this.header(s, kicker, title, { titleSize });
    if (lead) this.lead(s, lead);
    this.footer(s); return s;
  }
  cardsSlide({ kicker, title, lead, cards, cols, top, cardH, callout, bodySize, dark }) {
    const s = this.content({ kicker, title, lead, dark });
    const n = cards.length; cols = cols || Math.min(n, 3);
    const rows = Math.ceil(n / cols), gap = 0.25;
    const y0 = top || (lead ? 2.3 : 1.65);
    const bottom = callout ? 5.75 : 6.85;
    const ch = cardH || (bottom - y0 - gap * (rows - 1)) / rows;
    const cw = (12.15 - gap * (cols - 1)) / cols;
    cards.forEach((c, i) => {
      const r = Math.floor(i / cols), k = i % cols;
      this.card(s, MX + k * (cw + gap), y0 + r * (ch + gap), cw, ch, Object.assign({ bodySize: bodySize || 15, titleSize: 16 }, c));
    });
    if (callout) this.callout(s, MX, 6.0, 12.15, 0.85, callout, 14);
    return s;
  }
  compareSlide({ kicker, title, lead, left, right, callout }) {
    const s = this.content({ kicker, title, lead });
    const y0 = lead ? 2.3 : 1.65, h = (callout ? 5.75 : 6.85) - y0;
    this.card(s, MX, y0, 5.95, h, { title: left.title, body: left.items, titleColor: left.color, bodySize: 14 });
    this.card(s, MX + 6.2, y0, 5.95, h, { title: right.title, body: right.items, titleColor: right.color, bodySize: 14 });
    if (callout) this.callout(s, MX, 6.0, 12.15, 0.85, callout, 14);
    return s;
  }
  codeSlide({ kicker, title, lead, code, size = 12, codeW = 7.2, side, sideTitle, run }) {
    const s = this.content({ kicker, title, lead });
    const y0 = lead ? 2.25 : 1.65, h = 6.85 - y0;
    this.code(s, MX, y0, codeW, h, code, size);
    const sx = MX + codeW + 0.3, sw = 12.15 - codeW - 0.3;
    if (run) {
      const rh = run.h || 1.6;
      this.card(s, sx, y0, sw, h - rh - 0.25, { title: sideTitle, body: side, bodySize: 13 });
      this.code(s, sx, y0 + h - rh, sw, rh, run.text, run.size || 11);
    } else {
      this.card(s, sx, y0, sw, h, { title: sideTitle, body: side, bodySize: 13 });
    }
    return s;
  }
  tableSlide({ kicker, title, lead, header, rows, colW, fontSize = 13, callout, y }) {
    const s = this.content({ kicker, title, lead });
    const hdr = header.map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: fontSize + 1 } }));
    const body = rows.map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: F.body, fontSize } })));
    s.addTable([hdr, ...body], { x: MX, y: y || (lead ? 2.3 : 1.7), w: 12.15, colW, border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [5, 8, 5, 8], valign: "middle" });
    if (callout) this.callout(s, MX, 6.0, 12.15, 0.85, callout, 14);
    return s;
  }
  quizSlide({ title, questions }) {
    const s = this.content({ kicker: this.L.quizKicker, title: title || this.L.quizTitle });
    const gap = 0.22, h = (6.85 - 1.65 - gap * (questions.length - 1)) / questions.length;
    questions.forEach((q, i) => {
      const y = 1.65 + i * (h + gap);
      s.addShape(this.pres.shapes.ROUNDED_RECTANGLE, { x: MX, y, w: 12.15, h, fill: { color: C.light }, rectRadius: 0.06, line: { type: "none" }, shadow: shadow() });
      s.addShape(this.pres.shapes.OVAL, { x: MX + 0.25, y: y + h / 2 - 0.27, w: 0.54, h: 0.54, fill: { color: C.mint }, line: { type: "none" } });
      s.addText(String(i + 1), { x: MX + 0.25, y: y + h / 2 - 0.27, w: 0.54, h: 0.54, align: "center", valign: "middle", fontFace: F.title, fontSize: 16, bold: true, color: C.white, margin: 0, isTextBox: true });
      s.addText(q, { x: MX + 1.05, y, w: 10.85, h, fontFace: F.body, fontSize: 16, color: "3A464C", valign: "middle", margin: 0, isTextBox: true });
    });
    return s;
  }
  closing({ nextWeek, nextItems }) {
    let s = this.slide(true);
    s.addText(this.L.nextWeek, { x: MX, y: 1.55, w: 10, h: 0.35, fontFace: F.body, fontSize: 13, bold: true, color: C.mint, charSpacing: 3, margin: 0, isTextBox: true });
    s.addText(nextWeek, { x: MX, y: 1.95, w: 12, h: 0.85, fontFace: F.title, fontSize: 34, bold: true, color: C.white, margin: 0, isTextBox: true });
    s.addShape(this.pres.shapes.ROUNDED_RECTANGLE, { x: MX, y: 3.1, w: 8.4, h: 3.2, fill: { color: C.charcoal }, rectRadius: 0.06, line: { type: "none" } });
    s.addText(this.L.willCover(this.week + 1), { x: MX + 0.35, y: 3.3, w: 7.8, h: 0.4, fontFace: F.body, fontSize: 14, bold: true, color: C.mint, margin: 0, isTextBox: true });
    s.addText(this.bulletRuns(nextItems, 15), { x: MX + 0.35, y: 3.8, w: 7.8, h: 2.35, fontFace: F.body, color: C.light, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
    this.footer(s);
    s = this.slide(true);
    s.addText(this.L.questions, { x: MX, y: 1.55, w: 10, h: 0.35, fontFace: F.body, fontSize: 13, bold: true, color: C.mint, charSpacing: 3, margin: 0, isTextBox: true });
    s.addText(this.L.discussion, { x: MX, y: 1.95, w: 10, h: 0.85, fontFace: F.title, fontSize: 38, bold: true, color: C.white, margin: 0, isTextBox: true });
    s.addText(this.L.askTelegram, { x: MX, y: 2.95, w: 7.5, h: 0.7, fontFace: F.body, fontSize: 14, italic: true, color: C.light, margin: 0, isTextBox: true });
    s.addText([
      { text: this.L.name, options: { bold: true, breakLine: true } },
    ], { x: MX, y: 3.95, w: 6, h: 0.5, fontFace: F.body, fontSize: 14, color: C.light, margin: 0, valign: "top", paraSpaceAfter: 4, isTextBox: true });
    this.footer(s);
  }
  async save(file) {
    await this.pres.writeFile({ fileName: file });
    // pptxgenjs writes an <a:pPr> before EVERY run of a multi-run paragraph; only the
    // first is valid OOXML (later ones make PowerPoint "repair" the file). Strip the extras.
    const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));
    const zip = await JSZip.loadAsync(fs.readFileSync(file));
    let fixed = 0;
    for (const name of Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
      let xml = await zip.file(name).async("string");
      xml = xml.replace(/<a:p>([\s\S]*?)<\/a:p>/g, (m, inner) => {
        let seen = false;
        const out = inner.replace(/<a:pPr\b[^>]*\/>|<a:pPr\b[^>]*>[\s\S]*?<\/a:pPr>/g, pp => {
          if (!seen) { seen = true; return pp; } fixed++; return "";
        });
        return "<a:p>" + out + "</a:p>";
      });
      if (this.lang === "tr") xml = xml.replace(/lang="en-US"/g, 'lang="tr-TR"');
      zip.file(name, xml);
    }
    fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
    return fixed;
  }
}
module.exports = { Deck, C, F, W, H, MX, L };
