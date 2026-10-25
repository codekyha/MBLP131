// Hafta 7 sunumu (MBLP131, Türkçe): Sanal Bellek ve Dosya Sistemleri (8. haftadaki vizeden önceki son ders)
// İngilizce referans: ../week07/build_deck.js (aynı slayt sırası, aynı diyagramlar, aynı sayılar)
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("../lib/deck");
const d = new Deck({ week: 7, lang: "tr", assets: path.join(__dirname, "../lib") });
const code = f => fs.readFileSync(path.join(__dirname, "code", f), "utf8");
const P = d.pres;
const PALE = "D7E9E6";

// ---------- benzetim çıktısını ayrıştır (code/page_replacement.py) ----------
// Her blok şöyledir:  "<etiket>FIFO, 3 frames: 15 page faults" / ref / fr0.. / fault
function parseTables(txt) {
  const lines = txt.split("\n"), out = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(.*?)(FIFO|OPT|LRU), (\d) frames: (\d+) page faults/);
    if (!m) continue;
    const n = +m[3], cells = l => { const r = []; for (let k = 6; k < l.length; k += 3) r.push(l.substr(k, 2).trim()); return r; };
    const refs = cells(lines[i + 1]);
    const frames = []; for (let k = 0; k < n; k++) frames.push(cells(lines[i + 2 + k].padEnd(lines[i + 1].length)));
    const faults = cells(lines[i + 2 + n].padEnd(lines[i + 1].length)).map(c => c === "F");
    out[(m[1] + m[2] + n).replace(/[^A-Za-z0-9]/g, "")] = { refs, frames, faults, total: +m[4], n };
  }
  return out;
}
const T = parseTables(code("out_page_replacement.txt"));
// anahtarlar: FIFO3, OPT3, LRU3, BeladyFIFO3, BeladyFIFO4

// Çerçeve tablosunu doğal şekillerle çiz. Hata sütunları: soluk nane; yeni yüklenen sayfa: nane.
function frameTable(s, tb, x, y, w, rowH = 0.46, fsz = 14) {
  const labW = 1.0, n = tb.refs.length, cw = (w - labW) / n;
  const labels = ["başvuru", ...tb.frames.map((_, k) => `çerçeve ${k}`), "hata?"];
  labels.forEach((l, r) => d.text(s, l, { x, y: y + r * rowH, w: labW - 0.08, h: rowH, fontSize: 11, italic: true, color: C.mutedOnLight, valign: "middle", align: "right" }));
  for (let t = 0; t < n; t++) {
    const cx = x + labW + t * cw;
    d.box(s, cx + 0.02, y + 0.02, cw - 0.04, rowH - 0.04, tb.refs[t], { fill: C.charcoal, size: fsz });
    tb.frames.forEach((col, k) => {
      const v = col[t] === "." ? "" : col[t];
      const prev = t > 0 ? tb.frames[k][t - 1] : ".";
      const isNew = tb.faults[t] && v === tb.refs[t] && prev !== v;
      const fill = isNew ? C.mint : tb.faults[t] ? PALE : C.light;
      d.box(s, cx + 0.02, y + (k + 1) * rowH + 0.02, cw - 0.04, rowH - 0.04, v,
        { fill, size: fsz, bold: isNew, color: tb.faults[t] ? C.dark : "9AA5A8" });
    });
    d.text(s, tb.faults[t] ? "F" : "", { x: cx, y: y + (tb.frames.length + 1) * rowH, w: cw, h: rowH, fontSize: fsz, bold: true, color: C.red, align: "center", valign: "middle" });
  }
  return y + (tb.frames.length + 2) * rowH;
}

function stat(s, x, y, w, h, big, small, fill = C.charcoal) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: 0.06, line: { type: "none" } });
  d.text(s, [{ text: big, options: { fontSize: 40, bold: true, fontFace: F.title, color: C.mint, breakLine: true } },
             { text: small, options: { fontSize: 13, color: C.light } }], { x: x + 0.2, y, w: w - 0.4, h, align: "center", valign: "middle" });
}

function disk(s, x, y, w, h, label, sub) {
  s.addShape(P.shapes.CAN, { x, y, w, h, fill: { color: C.slate }, line: { type: "none" } });
  d.text(s, [{ text: label, options: { bold: true, breakLine: !!sub } }].concat(sub ? [{ text: sub, options: { fontSize: 11 } }] : []),
    { x, y: y + h * 0.2, w, h: h * 0.8, fontSize: 13, color: C.white, align: "center", valign: "middle" });
}

function numDot(s, x, y, n, fill = C.mint) {
  s.addShape(P.shapes.OVAL, { x, y, w: 0.36, h: 0.36, fill: { color: fill }, line: { type: "none" } });
  d.text(s, String(n), { x, y, w: 0.36, h: 0.36, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle" });
}

function line(s, x1, y1, x2, y2, o = {}) {
  s.addShape(P.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 0.0001, h: Math.abs(y2 - y1) || 0.0001,
    flipH: x2 < x1, flipV: y2 < y1, line: Object.assign({ color: C.slate, width: 1.25 }, o) });
}

(async () => {
  // 1 ── Başlık
  let s = d.titleSlide({
    kicker: "MBLP131  ·  HAFTA 7",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 7  ·  Sanal Bellek ve Dosya Sistemleri",
    tagline: "4 GB'lık bir program 2 GB RAM'de nasıl çalışır ve dosyalar gerçekte nerede durur?",
  });
  s.addNotes("7. haftaya hoş geldiniz; bu, gelecek haftaki vizeden önceki son dersimiz. İlk saat: sanal bellek (isteğe bağlı sayfalama, sayfa hataları, sayfa değiştirme, boşa çalışma). İkinci saat: dosya sistemleri (dosyalar, erişim yöntemleri, dizinler) ve Linux'taki düğümlere (inode) ve bağlantılara bir bakış. En sonda: vizenin kapsadığı her şeyin bir kontrol listesi.");

  // 2 ── Geçen hafta
  s = d.cardsSlide({
    kicker: "Geçen hafta", title: "Dört Fikirde 6. Hafta",
    cards: [
      { title: "İki tür adres", body: "Programlar mantıksal adres kullanır; MMU bunları çalışma anında fiziksel adrese çevirir." },
      { title: "Bitişik yer ayırma", body: "Her sürece tek bir RAM bloğu vermek basittir ama delikler bırakır: dış parçalanma." },
      { title: "Sayfalama", body: "Sayfalar (mantıksal) bir sayfa tablosuyla çerçevelere (fiziksel) eşlenir: dış parçalanma olmaz." },
      { title: "TLB", body: "Sayfa tablosu girdilerinin küçük bir önbelleği. Etkin erişim süresi isabet oranı α'ya bağlıdır." },
    ], cols: 4, bodySize: 16,
    callout: "Geçen hafta bir sürecin her sayfası RAM'deydi. Bugün bu varsayımı bırakıyoruz: bir sayfa diskte de olabilir.",
  });
  s.addNotes("İki dakikalık tekrar. Sorun: MMU ne yapar? (Mantıksal adresleri fiziksel adreslere çevirir.) Sayfalama dış parçalanmayı neden önler? (Herhangi bir boş çerçeve herhangi bir sayfayı tutabilir.) 6. haftadaki TLB'li etkin erişim süresi formülünü hatırlatın; bugün aynı fikri sayfa hatalarına genişleteceğiz.");

  // 3 ── Gündem
  s = d.content({ kicker: "Hafta 7", title: "Bugünün Gündemi" });
  [
    ["1", "Sanal bellek", "Programın yalnızca bir kısmının RAM'de olması yeter: isteğe bağlı sayfalama, sayfa hataları."],
    ["2", "Sayfa değiştirme", "Bellek dolunca kim çıkar? FIFO, OPT, LRU, Belady anomalisi, saat algoritması."],
    ["3", "Boşa çalışma", "Çok fazla süreç, çok az çerçeve ve çalışma kümesi fikri."],
    ["4", "Dosya sistemleri", "Dosyalar, öznitelikler, işlemler, erişim yöntemleri."],
    ["5", "Dizinler ve Linux", "Dizin yapıları, yollar, düğümler (inode), sabit ve sembolik bağlantılar."],
    ["6", "Vize kontrol listesi", "Gelecek haftaki sınav için neleri tekrar etmeli (1–7. haftalar)."],
  ].forEach((a, i) => {
    const y = 1.65 + i * 0.86;
    d.box(s, MX, y, 0.72, 0.72, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 0.9, y, w: 11.25, h: 0.72, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "   ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.2, y, w: 10.8, h: 0.72, valign: "middle" });
  });
  s.addNotes("1–3. bölümler moladan önce, 4–5. bölümler moladan sonra; ardından uygulamalı gösterimler, kısa bir sınav ve vize kontrol listesi.");

  // ───────────────────────── BÖLÜM 1: SANAL BELLEK
  s = d.sectionSlide({ kicker: "Bölüm 1", title: "Sanal Bellek", subtitle: "Bir programın çalışması için bütün sayfalarının RAM'de olması gerekmez." });
  s.addNotes("Geçiş: geçen hafta sürecin tamamının bellekte olduğunu varsaydık. Bu gerçekten gerekli mi?");

  // 5 ── Fikir
  s = d.content({ kicker: "Sanal bellek", title: "Fikir: Programın Görüşünü RAM'den Ayırmak" });
  {
    const x = MX, y = 2.15, ph = 0.5;
    d.text(s, "Sanal adres alanı", { x, y: 1.65, w: 2.0, h: 0.45, fontSize: 12, bold: true, color: C.charcoal, align: "center", valign: "bottom" });
    "ABCDEFGH".split("").forEach((p, i) => d.box(s, x + 0.1, y + i * ph, 1.8, ph - 0.06, `sayfa ${i}  ·  ${p}`, { fill: [0, 2, 5].includes(i) ? C.mint : C.light, color: C.dark, size: 12 }));
    d.text(s, "programın görüşü: büyük ve bitişik", { x, y: y + 8 * ph + 0.02, w: 2.0, h: 0.5, fontSize: 10.5, italic: true, color: C.mutedOnLight, align: "center" });
    const px = x + 3.55;
    d.text(s, "Fiziksel bellek (RAM)", { x: px - 0.1, y: 1.65, w: 2.0, h: 0.45, fontSize: 12, bold: true, color: C.charcoal, align: "center", valign: "bottom" });
    const frames = ["F", "—", "A", "—", "C"];
    frames.forEach((f, i) => d.box(s, px, y + i * ph, 1.8, ph - 0.06, f === "—" ? "başka süreç" : `çerçeve ${i}  ·  ${f}`, { fill: f === "—" ? "E4E8E9" : C.mint, color: f === "—" ? C.mutedOnLight : C.dark, size: 12, bold: f !== "—" }));
    [[0, 2], [2, 4], [5, 0]].forEach(([pg, fr]) => d.arrow(s, x + 1.92, y + pg * ph + 0.22, px - 0.02, y + fr * ph + 0.22, { color: C.mintDeep, w: 1.5 }));
    disk(s, px - 0.05, y + 2.75, 1.9, 1.55, "Disk", "yedek depo: B D E G H");
    line(s, x + 1.92, y + 3.5 * ph, px - 0.05, y + 3.5, { color: C.slate, dashType: "dash" });
  }
  d.card(s, MX + 6.0, 1.65, 6.15, 5.2, { title: "Neden işe yarar?", body: [
    "Bir programın büyük kısmı nadiren kullanılır: hata işleyicileri, sıra dışı menü seçenekleri, gerekenden büyük tanımlanmış diziler.",
    { b: "Yerellik (locality):", t: " kısa bir süre içinde program sayfalarının yalnızca birkaçını kullanır." },
    { b: "Öyleyse:", t: " yalnızca kullanılan sayfaları RAM'de tut; gerisi diskte beklesin." },
    { b: "Kazançlar:", t: " RAM'den büyük programlar çalışabilir; belleğe daha çok süreç sığar (daha yüksek işlemci kullanımı); daha az şey yüklendiği için programlar daha hızlı başlar." },
  ], bodySize: 15 });
  s.addNotes("Sanal bellek (virtual memory), programcının gördüğü mantıksal belleği fiziksel bellekten ayırır. A, C ve F sayfaları RAM'de (nane rengi); diğerleri yalnızca diskte. Programcı tek, büyük ve bitişik bir adres alanı görür; hangi sayfanın nerede olduğunu bilmesi gerekmez. 64 bitlik Linux'ta bir sürecin sanal adres alanı 128 TiB'tır; bu, herhangi bir makinenin RAM'inden çok daha fazladır.");

  // 6 ── İsteğe bağlı sayfalama
  s = d.compareSlide({
    kicker: "İsteğe bağlı sayfalama", title: "Hepsini mi Yükleyelim, Yalnızca Gerekeni mi?",
    lead: "İsteğe bağlı sayfalama (demand paging) = sayfalama + tembel yükleme: bir sayfa ancak ilk kullanıldığında RAM'e getirilir.",
    left: { title: "Hevesli: programın tamamını yükle", color: C.red, items: [
      "Program başlamadan önce tüm sayfalar diskten okunur.",
      "Kullanıcı tek bir menü açacak olsa bile başlangıç yavaştır.",
      "Hiç kullanılmayan sayfalar için RAM harcanır.",
      "Bellekte aynı anda daha az program yer alır.",
    ] },
    right: { title: "Tembel: isteğe bağlı sayfalama", items: [
      "Az sayıda (ya da hiç) sayfayla başla.",
      "Bir sayfayı ona ilk başvurulduğunda yükle.",
      "Daha az G/Ç, daha az bellek, hızlı başlangıç, daha çok süreç.",
      "Bedeli: her sayfanın ilk kullanımı bir sayfa hatasına yol açar.",
    ] },
    callout: "Sayfaları disk ile RAM arasında taşıyan işletim sistemi parçasına sayfalayıcı (pager) denir. \"Saf\" isteğe bağlı sayfalamada program bellekte hiç sayfa olmadan başlar.",
  });
  s.addNotes("Benzetme: kütüphane bütün kitapları aynı anda masanıza getirmez; siz istediğinizde bir kitabı getirir. Bazen 'takasçı' (swapper) sözcüğü de kullanılır, ama takasçı süreçlerin tamamını taşır; sayfalayıcı (pager) ise tek tek sayfaları taşır. Bu yüzden burada doğru terim 'sayfalayıcı'dır.");

  // 7 ── Geçerli–geçersiz biti
  s = d.content({ kicker: "İsteğe bağlı sayfalama", title: "Geçerli–Geçersiz Biti: Sayfa Bellekte mi?" });
  {
    const y = 2.15, ph = 0.5, x = MX;
    const pages = "ABCDEFGH".split(""), map = { 0: 4, 2: 6, 5: 9 };
    d.text(s, "Mantıksal bellek", { x: x - 0.1, y: 1.65, w: 1.7, h: 0.45, fontSize: 12, bold: true, color: C.charcoal, align: "center", valign: "bottom" });
    pages.forEach((p, i) => {
      d.text(s, String(i), { x: x - 0.05, y: y + i * ph, w: 0.3, h: ph - 0.06, fontSize: 11, color: C.mutedOnLight, valign: "middle" });
      d.box(s, x + 0.25, y + i * ph, 1.2, ph - 0.06, p, { fill: C.light, size: 14 });
    });
    const tx = x + 2.0;
    d.text(s, "Sayfa tablosu", { x: tx, y: 1.65, w: 1.9, h: 0.45, fontSize: 12, bold: true, color: C.charcoal, align: "center", valign: "bottom" });
    pages.forEach((p, i) => {
      const v = i in map;
      d.box(s, tx, y + i * ph, 1.1, ph - 0.06, v ? String(map[i]) : "", { fill: v ? C.charcoal : C.light, size: 14 });
      d.box(s, tx + 1.15, y + i * ph, 0.75, ph - 0.06, v ? "v" : "i", { fill: v ? C.mint : "F3D9D6", color: v ? C.dark : C.red, size: 14 });
    });
    d.text(s, "çerçeve      bit", { x: tx + 0.1, y: y + 8 * ph, w: 1.9, h: 0.3, fontSize: 10.5, italic: true, color: C.mutedOnLight });
    const mx = x + 4.6, fh = 0.4, my = 2.15;
    d.text(s, "Fiziksel bellek", { x: mx - 0.1, y: 1.65, w: 1.7, h: 0.45, fontSize: 12, bold: true, color: C.charcoal, align: "center", valign: "bottom" });
    for (let f = 0; f < 10; f++) {
      const pg = Object.keys(map).find(k => map[k] === f);
      d.text(s, String(f), { x: mx - 0.32, y: my + f * fh, w: 0.3, h: fh - 0.05, fontSize: 10, color: C.mutedOnLight, valign: "middle", align: "right" });
      d.box(s, mx, my + f * fh, 1.5, fh - 0.05, pg !== undefined ? pages[pg] : "", { fill: pg !== undefined ? C.mint : C.light, color: C.dark, size: 13 });
    }
    disk(s, x + 6.45, 2.6, 1.75, 2.6, "Disk", "A B C D\nE F G H");
  }
  d.card(s, MX + 8.55, 1.65, 3.6, 5.2, { title: "Biti okumak", body: [
    { b: "v (valid, geçerli):", t: " sayfa yasaldır ve bir çerçevededir." },
    { b: "i (invalid, geçersiz):", t: " sayfa bellekte değildir (ya da programın parçası bile değildir)." },
    "Başlangıçta her girdi i'dir.",
    "i olan bir sayfaya dokunulunca MMU işletim sistemine tuzak (trap) üretir: sayfa hatası.",
  ], bodySize: 14 });
  s.addNotes("Bellekte yalnızca A, C ve F sayfaları var (4, 6 ve 9 numaralı çerçeveler). Sekiz sayfanın hepsi diskte bulunur. Program yalnızca A, C ve F'ye dokunduğu sürece, 6. haftadaki gibi tam hızda çalışır. İlginç olan durum geçersiz bir sayfaya erişimdir: sonraki slayt.");

  // 8 ── Sayfa hatasının işlenmesi
  s = d.content({ kicker: "Sayfa hataları", title: "Bir Sayfa Hatasının Adım Adım İşlenmesi" });
  {
    const x = MX, y = 1.75;
    d.box(s, x, y + 0.2, 1.75, 0.95, "Süreç", { sub: "load M", fill: C.light, size: 14 });
    d.text(s, "sayfa tablosu", { x: x + 2.45, y: y - 0.12, w: 1.7, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "center" });
    ["", "i", ""].forEach((b, i) => {
      d.box(s, x + 2.55, y + 0.2 + i * 0.42, 0.95, 0.38, i === 1 ? "M" : "", { fill: i === 1 ? PALE : C.light, size: 12 });
      d.box(s, x + 3.53, y + 0.2 + i * 0.42, 0.5, 0.38, b || "v", { fill: i === 1 ? "F3D9D6" : C.light, color: i === 1 ? C.red : C.mutedOnLight, size: 12 });
    });
    d.box(s, x + 5.0, y + 0.2, 1.7, 0.95, "İşletim sistemi", { fill: C.charcoal, size: 13 });
    d.text(s, "fiziksel bellek", { x: x + 2.4, y: y + 2.05, w: 1.9, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "center" });
    for (let f = 0; f < 5; f++) d.box(s, x + 2.5, y + 2.4 + f * 0.48, 1.6, 0.42, f === 3 ? "boş çerçeve → M" : "", { fill: f === 3 ? C.mint : C.light, color: C.dark, size: 11 });
    disk(s, x + 5.0, y + 2.75, 1.7, 1.75, "Yedek", "depo (disk)");
    d.arrow(s, x + 1.77, y + 0.65, x + 2.53, y + 0.65, { color: C.mintDeep, w: 2 });           // 1 başvuru
    d.arrow(s, x + 4.05, y + 0.62, x + 4.98, y + 0.62, { color: C.red, w: 2 });                // 2 tuzak
    d.arrow(s, x + 5.85, y + 1.17, x + 5.85, y + 2.73, { color: C.mintDeep, w: 2 });           // 3 diskte bul
    d.arrow(s, x + 4.98, y + 4.05, x + 4.12, y + 4.05, { color: C.mintDeep, w: 2 });           // 4 getir
    d.arrow(s, x + 3.0, y + 2.38, x + 3.0, y + 1.47, { color: C.mintDeep, w: 2 });             // 5 tabloyu güncelle
    d.arrow(s, x + 2.53, y + 1.0, x + 1.77, y + 1.0, { color: C.mintDeep, w: 2 });             // 6 yeniden başlat
    numDot(s, x + 1.97, y + 0.17, 1); numDot(s, x + 4.33, y + 0.15, 2, C.red); numDot(s, x + 5.95, y + 1.75, 3);
    numDot(s, x + 4.37, y + 3.55, 4); numDot(s, x + 3.12, y + 1.75, 5); numDot(s, x + 1.97, y + 1.12, 6);
  }
  d.card(s, MX + 7.2, 1.65, 4.95, 5.2, { title: "Altı adım", body: [
    { b: "1 Başvuru:", t: " süreç M sayfasına dokunur; biti i'dir." },
    { b: "2 Tuzak:", t: " MMU sayfa hatası üretir; işletim sistemi adresin yasal olup olmadığına bakar (değilse: çökme)." },
    { b: "3 Bulma:", t: " işletim sistemi M sayfasını diskte ve boş bir çerçeve bulur." },
    { b: "4 Okuma:", t: " disk → çerçeve (milisaniyeler; bu arada başka bir süreç çalışır)." },
    { b: "5 Güncelleme:", t: " sayfa tablosu girdisi = çerçeve numarası, bit = v." },
    { b: "6 Yeniden başlatma:", t: " aynı komut yeniden çalışır ve bu kez başarılı olur." },
  ], bodySize: 14 });
  s.addNotes("Okları sırayla izleyin. 2. adımı vurgulayın: programın dışındaki bir adrese erişim de tuzağa düşer, ama bu durumda işletim sistemi süreci sonlandırır (segmentation fault). 4. adım pahalı olandır: bir disk okuması milisaniyeler sürer, bu yüzden zamanlayıcı (4. hafta) işlemciyi başka bir sürece verir. 6. adım: komut, hata hiç olmamış gibi baştan yeniden çalıştırılır. 3. adımda boş çerçeve yoksa sayfa değiştirme gerekir; bunu bugün ileride göreceğiz.");

  // 9 ── Sayfa hatalarıyla EAT
  s = d.content({ kicker: "Başarım", title: "Sayfa Hatalarıyla Etkin Erişim Süresi", lead: "p sayfa hatası oranı olsun (0 ≤ p ≤ 1): tek bir bellek erişiminin sayfa hatasına yol açma olasılığı." });
  d.card(s, MX, 2.3, 5.3, 3.4, { title: "Formül", body: [
    { b: "EAT = (1 − p) × tₘ + p × t_fault", t: "" },
    { b: "tₘ:", t: " bellek erişim süresi (burada 200 ns)." },
    { b: "t_fault:", t: " sayfa hatası hizmet süresi: tuzak, disk okuması, yeniden başlatma (burada 8 ms; süreyi disk belirler)." },
    "6. haftadaki TLB formülü gibi ağırlıklı bir ortalama.",
  ], bodySize: 15 });
  d.code(s, MX + 5.55, 2.3, 6.6, 4.55,
`tₘ = 200 ns,  t_fault = 8 ms = 8 000 000 ns

# Örnek: p = 0.001 (1000 erişimde 1 hata)
EAT = 0.999 × 200 + 0.001 × 8 000 000
    = 199.8 + 8 000 = 8 199.8 ns ≈ 8.2 µs
→ RAM'den 41 kat yavaş!

# Yavaşlama %10'un altında  ⇔  EAT < 220 ns
200 + p × (8 000 000 − 200) < 220
p < 20 / 7 999 800 ≈ 2.5 × 10⁻⁶
→ en fazla ≈ 400 000 erişimde 1 hata`, 13.5);
  d.callout(s, MX, 5.95, 5.3, 0.9, "Ders: sayfa hatası oranı çok küçük olmalıdır. Onu küçük tutan şey yerelliktir.", 14);
  s.addNotes("Sayılar code/page_replacement.py ile doğrulandı: EAT(0,001) = 8199,8 ns, yavaşlama çarpanı 41,0; p_maks = 20/7.999.800 = 2,50 × 10⁻⁶, yani 399.990 erişimde bir hata. Disk süresi baskındır: binde bir hata bile belleği kırk kat yavaşlatır. Bir SSD ile (t_fault yaklaşık 0,1 ms) tablo daha iyidir, ama ders aynıdır.");

  // 10 ── Yazınca kopyala
  s = d.content({ kicker: "Sanal bellek hilesi", title: "Yazınca Kopyala: fork() Çağrısını Ucuzlatmak", lead: "3. hafta: fork(), ebeveyninin kopyası olan bir çocuk oluşturur. Her sayfayı kopyalamak yavaş olurdu ve çoğu zaman boşa giderdi." });
  function cowPanel(x, y, title, after) {
    d.text(s, title, { x, y, w: 5.9, h: 0.35, fontSize: 14, bold: true, color: C.mintDeep });
    const py = y + 0.55;
    d.box(s, x, py + 0.3, 1.25, 1.8, "Ebeveyn", { fill: C.charcoal, size: 13 });
    d.box(s, x + 4.6, py + 0.3, 1.25, 1.8, "Çocuk", { fill: C.charcoal, size: 13 });
    const pg = ["sayfa A", "sayfa B", "sayfa C"];
    if (after) pg.push("C'nin kopyası");
    pg.forEach((p, i) => d.box(s, x + 2.15, py + i * 0.62, 1.55, 0.5, p, { fill: i === 3 ? C.mint : i === 2 && after ? PALE : C.light, color: C.dark, size: 12 }));
    d.text(s, "fiziksel bellek", { x: x + 2.0, y: py + (after ? 2.45 : 1.85), w: 1.85, h: 0.3, fontSize: 10.5, italic: true, color: C.mutedOnLight, align: "center" });
    [0, 1, 2].forEach(i => d.arrow(s, x + 1.27, py + 1.2, x + 2.13, py + i * 0.62 + 0.25, { w: 1.25 }));
    const targets = after ? [0, 1, 3] : [0, 1, 2];
    targets.forEach(i => d.arrow(s, x + 4.58, py + 1.2, x + 3.72, py + i * 0.62 + 0.25, { w: 1.25, color: i === 3 ? C.mintDeep : C.slate }));
  }
  cowPanel(MX, 2.35, "1. fork()'tan hemen sonra: sayfalar ortak, salt okunur", false);
  cowPanel(MX + 6.3, 2.35, "2. Çocuk C'ye yazar: yalnızca C kopyalanır", true);
  d.callout(s, MX, 5.75, 12.15, 1.1, "fork()'tan sonra iki süreç tüm sayfaları salt okunur olarak paylaşır. Bir sayfaya ilk yazma bir sayfa hatasına yol açar; işletim sistemi yalnızca o sayfayı kopyalar. Hiç yazılmayan sayfalar (çoğu zaman sayfaların çoğu, özellikle çocuk hemen exec() çağırırsa) hiç kopyalanmaz.", 14);
  s.addNotes("Yazınca kopyala (copy-on-write, COW), 3. haftayı (fork) bugüne bağlar. Tuzak mekanizması isteğe bağlı sayfalamadakiyle aynıdır: geçersiz sayfa yerine bir koruma hatası. Sonraki slaytlardaki cow_fork.c gösterimi bunu gerçek hata sayılarıyla gösterir.");

  // 11 ── Uygulama: sayfa hataları
  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 1: İsteğe Bağlı Sayfalamayı İzlemek",
    code: code("page_faults_excerpt.c"), size: 11.5, codeW: 7.1, sideTitle: "Neye dikkat edelim?",
    side: [
      "malloc() yalnızca sanal alan ayırır: neredeyse hiç hata yok.",
      "Her sayfaya ilk yazma bir kez hata verir: 16.383 + 1 = 16.384 sayfa.",
      "İkinci geçiş: 0 hata; sayfalar artık bellekte.",
    ],
    run: { h: 1.7, size: 10.5, text: code("out_page_faults.txt").replace(/^/, "$ ./page_faults\n") },
  });
  s.addNotes("Linux test makinemizden gerçek çıktı. Bunlar KÜÇÜK (minor) hatalardır: çekirdek yalnızca boş bir çerçeve bulup sıfırladı, disk okuması olmadı. BÜYÜK (major) bir hata disk G/Ç'si gerektirir (ör. bir program dosyasının ya da diske takaslanmış bir sayfanın okunması). '/usr/bin/time -v ./page_faults' tüm çalışmayı raporlar: Minor page faults 16463 (bizim 16384 hatamız artı programın ve C kütüphanesinin yüklenmesi için yaklaşık 80), Major 0, en büyük yerleşik küme yaklaşık 67 MB. 'after malloc' satırındaki tek hata, malloc'un kendi kayıt başlığını ilk sayfaya yazmasıdır; döngünün 16384 değil 16383 hata görmesinin nedeni budur. Saydam büyük sayfaların (transparent huge pages) tüm bellek için etkin olduğu sistemlerde çok daha az hata görebilirsiniz (2 MB başına bir hata).");

  // 12 ── Uygulama: yazınca kopyala
  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 2: Yazınca Kopyala, Ölçülmüş Hâliyle",
    code: code("cow_fork_excerpt.c"), size: 11.5, codeW: 7.1, sideTitle: "Neye dikkat edelim?",
    side: [
      "Paylaşılan sayfaları okumak: hiç hata yok.",
      "Yazmak: sayfa başına bir hata (8192); her sayfa ilk yazmada kopyalanır.",
      "Ebeveynin verisine dokunulmaz.",
    ],
    run: { h: 1.95, size: 10, text: "$ ./cow_fork\n" + code("out_cow_fork.txt").replace(" (copy-on-write)", "\n                      (copy-on-write)").replace("  (its copy was never changed)", "") },
  });
  s.addNotes("Gerçek çıktı. Çocuk 8192 sayfanın hepsini sıfır sayfa hatasıyla okur, çünkü sayfalar ebeveynle paylaşılmaktadır. Yazma, sayfa başına tam olarak bir hata tetikler: yazınca kopyala. Ebeveyn hâlâ 'A' görür, çünkü kendi özgün sayfalarını korumuştur. fork()'un kendisi hızlıydı, çünkü yalnızca sayfa tabloları kopyalandı.");

  // 13 ── Sayfa değiştirme: neden
  s = d.content({ kicker: "Sayfa değiştirme", title: "Boş Çerçeve Yok mu? Biri Çıkmak Zorunda", lead: "Bellek bilerek fazla dağıtılır. Bir sayfa hatası tüm çerçeveleri dolu bulursa işletim sistemi bir kurban sayfa seçmelidir." });
  {
    const steps = [
      ["1. Sayfayı bul", "İstenen sayfanın diskteki yerini bul."],
      ["2. Kurban seç", "Boş çerçeve yok → bir değiştirme algoritması birini seçer."],
      ["3. Diske yaz?", "Yalnızca kurban kirliyse (değiştirilmişse)."],
      ["4. İçeri oku", "İstenen sayfayı yükle; iki sayfa tablosunu güncelle."],
      ["5. Sürdür", "Hata veren süreci kaldığı yerden sürdür."],
    ];
    const w = 2.25, gap = 0.22;
    steps.forEach((st, i) => {
      const x = MX + i * (w + gap);
      d.card(s, x, 2.35, w, 2.0, { title: st[0], body: st[1], bodySize: 14, titleSize: 15, fill: i === 1 ? PALE : C.light });
      if (i < steps.length - 1) d.arrow(s, x + w + 0.01, 3.35, x + w + gap - 0.01, 3.35, { w: 1.5 });
    });
  }
  d.card(s, MX, 4.6, 5.95, 2.25, { title: "Değişiklik (kirli) biti", body: "Bir sayfaya yazıldığında donanım bu biti kurar. Temiz bir kurbanın (ör. program kodu) diskte aynısı zaten vardır, bu yüzden atılabilir: iki yerine tek disk aktarımı.", bodySize: 14 });
  d.card(s, MX + 6.2, 4.6, 5.95, 2.25, { title: "Algoritmaları nasıl karşılaştırırız?", body: "Her birini aynı başvuru dizisi (reference string: programın dokunduğu sayfa numaraları dizisi) ve aynı çerçeve sayısıyla çalıştırıp sayfa hatalarını sayarız. Az olan iyidir.", bodySize: 14 });
  s.addNotes("Fazla dağıtma (over-allocation): süreçlerin sanal belleklerinin toplamının fiziksel bellekten büyük olmasına bilerek izin veririz; tüm sayfaların aynı anda gerekmeyeceğine bahse gireriz. Bahis tutmazsa sayfa değiştiririz. Kirli bit, temiz sayfaları değiştirmenin maliyetini yarıya indirir. Bundan sonra algoritmaları adil karşılaştırabilmek için hepsinde aynı başvuru dizisini kullanıyoruz.");

  // 14–16 ── FIFO, OPT, LRU çerçeve tabloları
  const refStr = T.FIFO3.refs.join(", ");
  function algoSlide(key, kicker, title, rule, howTitle, how, result, notes) {
    const tb = T[key];
    const s = d.content({ kicker, title, lead: rule });
    d.text(s, `Başvuru dizisi: ${refStr}   ·   3 çerçeve`, { x: MX, y: 2.2, w: 12.15, h: 0.35, fontSize: 13, color: C.mutedOnLight, italic: true });
    frameTable(s, tb, MX, 2.6, 12.15, 0.46, 14);
    d.card(s, MX, 5.5, 8.85, 1.35, { title: howTitle, body: how, bodySize: 13.5, titleSize: 14 });
    stat(s, MX + 9.1, 5.5, 3.05, 1.35, String(tb.total), result);
    s.addNotes(notes);
    return s;
  }
  algoSlide("FIFO3", "Sayfa değiştirme · FIFO", "FIFO: En Eski Sayfayı Değiştir", "İlk giren ilk çıkar (First-In, First-Out): kurban, bellekte en uzun süredir duran sayfadır. Bir kuyrukla kolayca gerçeklenir.",
    "Not", "FIFO bir sayfanın ne sıklıkla kullanıldığına bakmaz: 7. başvuruda 0 sayfasını atar, oysa o hemen yine gerekir (11. başvuru). Nane = yeni yüklenen sayfa; soluk sütunlar = hatalar.",
    "FIFO ile sayfa hatası",
    "İlk birkaç sütunu yavaşça izleyin. 7, 0, 1 boş çerçeveleri doldurur (3 zorunlu hata). 2, 7'nin yerine geçer (en eski). 0 isabettir. 3, 0'ın yerine geçer (artık en eski o); şanssızlık, 0 hemen geri gelir ve 1'in yerine geçer. Toplam 15 hata; code/page_replacement.py ile hesaplandı.");
  algoSlide("OPT3", "Sayfa değiştirme · OPT", "OPT: Gelecekte En Geç Kullanılacak Sayfayı Değiştir", "En iyi (optimal; Belady, 1966): kurban, en uzun süre kullanılmayacak olan sayfadır. Olası en düşük hata sayısını verir.",
    "Sorun", "OPT gelecekteki başvuru dizisini bilmeyi gerektirir; bu yüzden hiçbir gerçek işletim sistemi onu gerçekleyemez. Bir ölçüttür: \"algoritmamız en iyinin %10 yakınında\".",
    "OPT ile sayfa hatası (en az)",
    "4 numaralı sayfaya başvuruda (8. sütun) çerçevelerde 2, 0, 3 var. İleriye bakarsak: 2 sonraki kez 9. konumda, 3 10. konumda, 0 11. konumda kullanılacak; bu yüzden gelecekte en geç kullanılacak olan 0 değiştirilir. 9 hata; bunların 3'ü kaçınılmazdır (7, 0, 1'in ilk kullanımı). 3 çerçeveyle hiçbir algoritma daha iyisini yapamaz.");
  algoSlide("LRU3", "Sayfa değiştirme · LRU", "LRU: En Uzun Süredir Kullanılmayan Sayfayı Değiştir", "En uzun süredir kullanılmayan (Least Recently Used): kurban, en uzun süredir kullanılmamış sayfadır. Geçmişi geleceğin tahmini olarak kullanır.",
    "Gerçekleme", "Tam LRU, her bellek erişiminde güncellenen bir zaman damgası ya da bir yığıt (stack) gerektirir; donanımda bu çok pahalıdır. Gerçek sistemler ona yaklaşır (saat algoritması, birazdan).",
    "LRU ile sayfa hatası",
    "4 numaralı sayfaya başvuruda (8. sütun) çerçevelerde 2, 0, 3 var; GERİYE bakarsak en uzun süre önce kullanılan 2'dir, bu yüzden 2 değiştirilir (OPT 0'ı değiştirmişti). 12 hata: FIFO (15) ile OPT (9) arasında. LRU yerellik sayesinde iyi çalışır: yakın zamanda kullanılan sayfaların yakında yine kullanılması olasıdır.");

  // 17 ── Karşılaştırma
  s = d.tableSlide({
    kicker: "Sayfa değiştirme", title: "Üç Algoritma, Tek Başvuru Dizisi",
    header: ["Algoritma", "Kurban şu sayfadır…", "Hata (3 çerçeve)", "Gerçeklenebilir mi?", "Belady anomalisi?"],
    colW: [1.6, 3.4, 2.25, 2.55, 2.35],
    rows: [
      ["FIFO", "en uzun süre önce yüklenen", String(T.FIFO3.total), "evet, çok ucuz", "olabilir"],
      ["OPT", "gelecekte en geç kullanılacak", String(T.OPT3.total), "hayır (geleceği ister)", "asla"],
      ["LRU", "en uzun süredir kullanılmayan", String(T.LRU3.total), "yaklaşık olarak", "asla"],
    ],
    fontSize: 16, y: 1.7,
    callout: "Bu dizide sıralama: OPT (9) < LRU (12) < FIFO (15). Her algoritma 7, 0 ve 1'in ilk kullanımı için 3 zorunlu hatayı öder.",
  });
  {
    const bars = [["OPT", T.OPT3.total, C.mint], ["LRU", T.LRU3.total, C.mintDeep], ["FIFO", T.FIFO3.total, C.slate]];
    const maxW = 9.0, y0 = 3.95;
    bars.forEach(([n, v, col], i) => {
      const y = y0 + i * 0.62;
      d.text(s, n, { x: MX, y, w: 1.1, h: 0.5, fontSize: 15, bold: true, color: C.charcoal, valign: "middle" });
      s.addShape(P.shapes.RECTANGLE, { x: MX + 1.2, y: y + 0.05, w: maxW * v / 20, h: 0.4, fill: { color: col }, line: { type: "none" } });
      d.text(s, `${v} hata`, { x: MX + 1.3 + maxW * v / 20, y, w: 1.6, h: 0.5, fontSize: 14, bold: true, color: C.charcoal, valign: "middle" });
    });
    d.text(s, "20 başvurudan", { x: MX + 9.0, y: y0 + 1.35, w: 3.1, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "right" });
  }
  s.addNotes("Bu tipik bir sınav sorusu türüdür: bir başvuru dizisi ve çerçeve sayısı verilir; FIFO, OPT ve LRU için çerçeve tablosunu çizip hataları sayın. Vizeden önce en az iki diziyle alıştırma yapın. Ders notlarındaki 'yığıt algoritması' (stack algorithm) kavramı, OPT ve LRU'nun neden hiçbir zaman Belady anomalisi göstermediğini açıklar.");

  // 18 ── Belady anomalisi
  s = d.content({ kicker: "Sürpriz", title: "Belady Anomalisi: Daha Çok Çerçeve, Daha Çok Hata?" });
  d.text(s, `FIFO, dizi: ${T.BeladyFIFO3.refs.join(", ")}`, { x: MX, y: 1.6, w: 8.4, h: 0.35, fontSize: 13, italic: true, color: C.mutedOnLight });
  d.text(s, `3 çerçeve → ${T.BeladyFIFO3.total} hata`, { x: MX, y: 1.95, w: 8.4, h: 0.35, fontSize: 14, bold: true, color: C.mintDeep });
  frameTable(s, T.BeladyFIFO3, MX, 2.3, 8.4, 0.36, 13);
  d.text(s, `4 çerçeve → ${T.BeladyFIFO4.total} hata`, { x: MX, y: 4.25, w: 8.4, h: 0.35, fontSize: 14, bold: true, color: C.red });
  frameTable(s, T.BeladyFIFO4, MX, 4.6, 8.4, 0.36, 13);
  d.card(s, MX + 8.7, 1.65, 3.45, 5.2, { title: "Ne anlama gelir?", body: [
    "Sağduyu: daha çok bellek asla zarar vermemeli.",
    `FIFO'da verebilir: 3 çerçeveyle ${T.BeladyFIFO3.total}, 4 çerçeveyle ${T.BeladyFIFO4.total} hata.`,
    "OPT ve LRU asla böyle davranmaz (bunlar \"yığıt algoritmaları\"dır).",
    "Aynı dizide LRU 10 → 8 hata verir.",
  ], bodySize: 14 });
  s.addNotes("László Bélády ve çalışma arkadaşları tarafından 1969'da keşfedildi. Nedeni: FIFO'da 4 çerçeveyle bellekte bulunan sayfalar kümesi, 3 çerçeveyle bulunanların her zaman bir üst kümesi değildir. LRU'da en son kullanılan 3 sayfa her zaman en son kullanılan 4 sayfanın içindedir; bu yüzden bir çerçeve eklemek hiçbir zaman hata eklemez. LRU sayıları (10 ve 8) code/page_replacement.py çıktısındandır.");

  // 19 ── Saat / ikinci şans
  s = d.content({ kicker: "LRU yaklaşımı", title: "Başvuru Biti ve İkinci Şans (Saat) Algoritması", lead: "Bir sayfa her kullanıldığında donanım onun başvuru bitini (R) 1 yapar. İşletim sistemi bu biti okuyabilir ve sıfırlayabilir." });
  {
    const cx = MX + 3.0, cy = 4.55, r = 1.7;
    const fr = [["3", 1], ["7", 0], ["1", 1], ["4", 1], ["9", 0], ["2", 1]];
    s.addShape(P.shapes.OVAL, { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, fill: { type: "none" }, line: { color: C.slate, width: 1.25, dashType: "dash" } });
    fr.forEach((f, i) => {
      const t = -Math.PI / 2 + i * 2 * Math.PI / fr.length, x = cx + r * Math.cos(t), y = cy + r * Math.sin(t);
      const victim = i === 1;
      d.box(s, x - 0.62, y - 0.36, 1.24, 0.72, `sayfa ${f[0]}`, { sub: i === 0 ? "R = 1 → 0" : `R = ${f[1]}`, fill: victim ? C.red : i === 0 ? PALE : C.light, color: victim ? C.white : C.dark, size: 13, subSize: 11 });
    });
    d.arrow(s, cx, cy, cx + 0.05, cy - r + 0.45, { color: C.mintDeep, w: 3 });
    d.arrow(s, cx, cy, cx + 1.1, cy - 0.8, { color: C.mintDeep, w: 1.5 });
    s.addShape(P.shapes.OVAL, { x: cx - 0.12, y: cy - 0.12, w: 0.24, h: 0.24, fill: { color: C.mintDeep }, line: { type: "none" } });
    d.text(s, "ibre", { x: cx - 0.85, y: cy - 0.1, w: 0.7, h: 0.3, fontSize: 11, italic: true, color: C.mintDeep, align: "right" });
  }
  d.card(s, MX + 6.4, 2.3, 5.75, 4.55, { title: "Algoritma", body: [
    "Çerçeveler bir çember oluşturur; bir \"saat ibresi\" sıradaki adayı gösterir.",
    { b: "R = 1:", t: " ikinci bir şans ver: R'yi 0 yap, ilerle." },
    { b: "R = 0:", t: " yakın zamanda kullanılmamış → kurban budur." },
    { b: "Örnek:", t: " ibre 3. sayfada (R = 1): biti sıfırla, 7. sayfaya ilerle (R = 0): 7. sayfayı değiştir." },
    "Bütün R'ler 1 ise ibre tam bir tur atar: FIFO.",
  ], bodySize: 14 });
  s.addNotes("Saat algoritması LRU'ya sayfa başına tek bir bitle ve neredeyse hiç ek yük olmadan yaklaşır. İbre son geçtiğinden beri kullanılmış sayfalar hayatta kalır; boşta duran sayfalar değiştirilir. Linux bu fikrin daha ayrıntılı bir akrabasını kullanır (etkin ve etkin olmayan listeler). Öğrencilerin yalnızca temel sürümü bilmesi yeterlidir.");

  // 20 ── Boşa çalışma
  s = d.content({ kicker: "Boşa çalışma", title: "Boşa Çalışma: Yoğun Sayfalama, Gerçek İş Yok", lead: "Bir sürecin çerçeve sayısı etkin olarak kullandığı sayfalardan azsa, süreç tekrar tekrar hata verir." });
  {
    const xs = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    const ys = [18, 34, 48, 60, 70, 77, 82, 84, 76, 55, 30, 14];
    s.addChart(P.charts.LINE, [{ name: "İşlemci kullanımı", labels: xs, values: ys }], {
      x: MX, y: 2.3, w: 6.4, h: 4.15, chartColors: [C.mintDeep], lineSize: 3, lineDataSymbol: "none", lineSmooth: true,
      catAxisLabelColor: "FFFFFF", valAxisLabelColor: "FFFFFF", catAxisLabelFontSize: 8, valAxisLabelFontSize: 8,
      valAxisMaxVal: 100, valAxisMinVal: 0, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
      catAxisLineColor: C.charcoal, valAxisLineColor: C.charcoal,
      showValAxisTitle: true, valAxisTitle: "İşlemci kullanımı", valAxisTitleColor: "3A464C", valAxisTitleFontSize: 12,
      showCatAxisTitle: true, catAxisTitle: "çoklu programlama derecesi →", catAxisTitleColor: "3A464C", catAxisTitleFontSize: 12,
    });
    d.text(s, "boşa çalışma →", { x: MX + 3.0, y: 4.9, w: 2.0, h: 0.35, fontSize: 14, bold: true, color: C.red, align: "right" });
    d.text(s, "kavramsal eğri, ölçülmüş veri değildir", { x: MX, y: 6.45, w: 6.4, h: 0.3, fontSize: 10.5, italic: true, color: C.mutedOnLight, align: "center" });
  }
  d.card(s, MX + 6.7, 2.3, 5.45, 4.55, { title: "Kısır döngü", body: [
    "Çok fazla süreç → her birine çok az çerçeve → çok sayıda sayfa hatası.",
    "Süreçler diski bekler → işlemci kullanımı düşer.",
    "Saf bir zamanlayıcı boşta duran işlemciyi görür ve daha çok süreç kabul eder…",
    "…bu da durumu kötüleştirir. Sistem zamanını hesaplamaya değil, sayfalamaya harcar.",
    { b: "Çare:", t: " çoklu programlama derecesini düşürmek (süreçleri askıya almak) ya da RAM eklemek." },
  ], bodySize: 14 });
  s.addNotes("Çoklu programlama derecesi = bellekteki süreç sayısı (1. ve 4. haftalar). Belli bir noktaya kadar süreç eklemek işlemci kullanımını artırır; o noktadan sonra kullanım çöker. Boşa çalışmayı (thrashing) yaşamış olabilirsiniz: RAM'i az, tarayıcı sekmesi çok bir bilgisayarda disk ışığı sürekli yanar ve fare zar zor hareket eder.");

  // 21 ── Çalışma kümesi
  s = d.content({ kicker: "Boşa çalışma", title: "Çalışma Kümesi Modeli", lead: "Çalışma kümesi (working set) WS(t, Δ) = son Δ başvuruda kullanılan farklı sayfaların kümesi. Programın yerelliğini izler." });
  {
    const refs = [2, 6, 1, 5, 7, 7, 7, 7, 5, 1, 6, 2, 3, 4, 1, 2, 3, 4, 4, 4, 3, 4, 3, 4, 4, 4];
    const n = refs.length, x0 = MX, cw = 12.15 / n, y = 2.85;
    refs.forEach((r, i) => {
      const inA = i <= 9, inB = i >= 16;
      d.box(s, x0 + i * cw + 0.02, y, cw - 0.04, 0.5, String(r), { fill: inA || inB ? PALE : C.light, color: C.dark, size: 14 });
    });
    const br = (i0, i1, label, yy) => {
      line(s, x0 + i0 * cw + 0.03, yy, x0 + (i1 + 1) * cw - 0.03, yy, { color: C.mintDeep, width: 2 });
      line(s, x0 + i0 * cw + 0.03, yy - 0.12, x0 + i0 * cw + 0.03, yy, { color: C.mintDeep, width: 2 });
      line(s, x0 + (i1 + 1) * cw - 0.03, yy - 0.12, x0 + (i1 + 1) * cw - 0.03, yy, { color: C.mintDeep, width: 2 });
      d.text(s, label, { x: x0 + i0 * cw, y: yy + 0.05, w: (i1 - i0 + 1) * cw, h: 0.4, fontSize: 14, bold: true, color: C.mintDeep, align: "center" });
    };
    br(0, 9, "Δ = 10   →   WS(t₁) = {1, 2, 5, 6, 7}", y + 0.75);
    br(16, 25, "Δ = 10   →   WS(t₂) = {3, 4}", y + 0.75);
    d.arrow(s, x0 + 9.5 * cw, y - 0.4, x0 + 9.5 * cw, y - 0.04, { color: C.charcoal, w: 1.5 });
    d.text(s, "t₁", { x: x0 + 9.5 * cw - 0.3, y: y - 0.68, w: 0.6, h: 0.3, fontSize: 13, bold: true, color: C.charcoal, align: "center" });
    d.arrow(s, x0 + 25.5 * cw, y - 0.4, x0 + 25.5 * cw, y - 0.04, { color: C.charcoal, w: 1.5 });
    d.text(s, "t₂", { x: x0 + 25.5 * cw - 0.3, y: y - 0.68, w: 0.6, h: 0.3, fontSize: 13, bold: true, color: C.charcoal, align: "center" });
  }
  d.card(s, MX, 4.4, 5.95, 2.45, { title: "İşletim sisteminin kuralı", body: [
    "Her sürece en az |WS| çerçeve ver (çalışma kümesi boyutu).",
    "Toplam talep D = Σ |WSᵢ|. D > çerçeve sayısı m ise boşa çalışma yaklaşıyor → bir süreci askıya al.",
  ], bodySize: 14 });
  d.card(s, MX + 6.2, 4.4, 5.95, 2.45, { title: "Δ'yı seçmek", body: [
    "Δ çok küçük: yerelliğin bir kısmını kaçırır.",
    "Δ çok büyük: birkaç yerelliği kapsar, çerçeve israf eder.",
    "Daha basit akrabası: sayfa hatası sıklığını izle ve çok sık hata veren süreçlere çerçeve ver.",
  ], bodySize: 14 });
  s.addNotes("t1 anında program 1, 2, 5, 6, 7 sayfalarını kullanan bir yerellikte (çalışma kümesi boyutu 5); t2 anında yalnızca 3 ve 4 sayfalarını kullanan bir döngüye geçmiş (boyut 2). Çalışma kümeleri code/page_replacement.py ile hesaplandı. Yalnızca kavramsal: sınavda bu düzeyin ötesinde hesap beklenmiyor.");

  // 22 ── Mola
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Mola", subtitle: "Sırada: dosya sistemleri; dosyalar, erişim yöntemleri, dizinler ve Linux bağlantıları." });
  s.addNotes("On dakika. Mola sırasında öğrenciler FIFO tablosunu kâğıt üzerinde yeniden hesaplamayı deneyebilir.");

  // ───────────────────────── BÖLÜM 2: DOSYA SİSTEMLERİ
  s = d.sectionSlide({ kicker: "Bölüm 2", title: "Dosya Sistemleri", subtitle: "İşletim sisteminin en görünür parçası." });
  s.addNotes("Bellek uçucudur; veriler elektrik kesildikten sonra dosyalar sayesinde hayatta kalır. Dosya sistemi, işletim sisteminin kullanıcıların en doğrudan gördüğü parçasıdır.");

  // 24 ── Dosya kavramı ve öznitelikler
  s = d.tableSlide({
    kicker: "Dosya kavramı", title: "Bir Dosya ve Öznitelikleri",
    lead: "Dosya, ikincil bellekte saklanan, adı olan bir ilişkili bilgiler topluluğudur; kullanıcının kaydedebileceği en küçük birimdir.",
    header: ["Öznitelik", "Anlamı", "Örnek (Linux, notes.txt)"],
    colW: [2.1, 5.45, 4.6],
    rows: [
      ["Ad", "İnsanın okuyabileceği ad; Linux'ta diğer özniteliklerle değil, dizinde tutulur", "notes.txt"],
      ["Tanımlayıcı", "Dosya sistemi içinde benzersiz bir numara", "düğüm (inode) 368662"],
      ["Tür", "Normal dosya, dizin, bağlantı, aygıt, …", "normal dosya"],
      ["Konum", "Veri bloklarının aygıttaki yeri", "düğümdeki blok işaretçileri"],
      ["Boyut", "Bayt (ya da blok) cinsinden güncel boyut", "6 bayt (512 B'lık 8 blok)"],
      ["Koruma", "Kim okuyabilir, yazabilir, çalıştırabilir", "-rw-rw-r--  sahibi student"],
      ["Zaman damgaları", "Oluşturma, son erişim, son değişiklik", "Access / Modify / Change"],
    ],
    fontSize: 14.5, y: 2.2,
    callout: "stat notes.txt çalıştırırsanız bu tablonun neredeyse her satırını görürsünüz. İşletim sistemi bu öznitelikleri bir dosya denetim bloğunda (Linux'ta: düğüm, inode) tutar.",
  });
  s.addNotes("Örnek sütunu, bugünkü uygulamalı oturumdaki 'stat notes.txt' komutunun gerçek çıktısıdır. Linux'ta öznitelikler düğümde (inode), ad ise dizinde durur. stat'taki 'Blocks: 8' 512 baytlık birimleri sayar; yani 6 baytlık bir dosya için bile 8 blok = bir adet 4 KB'lık dosya sistemi bloğu.");

  // 25 ── Dosya işlemleri
  s = d.cardsSlide({
    kicker: "Dosya işlemleri", title: "Bir Dosya Üzerinde Sekiz Temel İşlem",
    cards: [
      { title: "create (oluştur)", body: "Yer bul; dizine bir girdi ekle.  open(…, O_CREAT)" },
      { title: "open (aç)", body: "Adı bir kez ara; dosya tanımlayıcısı al.  open()" },
      { title: "read (oku)", body: "Geçerli konumdan baytları kopyala.  read()" },
      { title: "write (yaz)", body: "Geçerli konuma baytları kopyala.  write()" },
      { title: "seek (konumlan)", body: "Geçerli konumu taşı; G/Ç yok.  lseek()" },
      { title: "close (kapat)", body: "Açık dosya tablosu girdisini bırak.  close()" },
      { title: "delete (sil)", body: "Adı kaldır; kullanılmıyorsa yeri boşalt.  unlink()" },
      { title: "truncate (kırp)", body: "İçeriği sil, öznitelikleri koru.  truncate()" },
    ], cols: 4, bodySize: 14,
    callout: "Bir kez açın, sonra her okuma/yazma için küçük tamsayıyı (dosya tanımlayıcısı) kullanın: işletim sistemi dizini yeniden aramak zorunda kalmaz. 0, 1, 2 zaten açıktır: stdin, stdout, stderr (2. hafta).",
  });
  s.addNotes("Her kartın sonunda Linux sistem çağrısının adı var. Silme işlemine unlink denir, çünkü dosyanın bir ADINI (bağlantısını) kaldırır; veri ancak hiçbir ad ve hiçbir açık tanımlayıcı kalmadığında serbest bırakılır. Bunu sabit bağlantılarla göreceğiz. 10. hafta (Linux dosya işlemleri) bunların komut satırı karşılıklarını kullanır: touch, cat, cp, mv, rm.");

  // 26 ── Açık dosya tabloları
  s = d.content({ kicker: "Dosya işlemleri", title: "Açık Dosya Tabloları", lead: "open() yavaş işi (dizin araması, izin denetimi) bir kez yapar ve sonucu tablolarda saklar." });
  {
    const y = 2.45;
    const proc = (x, yy, name, rows) => {
      d.text(s, name, { x, y: yy - 0.38, w: 3.2, h: 0.35, fontSize: 12, bold: true, color: C.charcoal });
      rows.forEach((r, i) => d.box(s, x, yy + i * 0.42, 2.4, 0.38, r, { fill: i === rows.length - 1 ? PALE : C.light, size: 11, bold: false, font: F.code }));
    };
    proc(MX, y, "A süreci: süreç başına tablo", ["fd 0  stdin", "fd 1  stdout", "fd 3  pos = 96"]);
    proc(MX, y + 2.15, "B süreci: süreç başına tablo", ["fd 0  stdin", "fd 4  pos = 0"]);
    const sx = MX + 3.4;
    d.text(s, "Sistem geneli açık dosya tablosu", { x: sx, y: y - 0.38, w: 3.4, h: 0.35, fontSize: 12, bold: true, color: C.charcoal });
    d.box(s, sx, y + 0.4, 2.9, 1.25, "students.dat", { sub: "açılma sayısı = 2\nboyut, diskteki konum", fill: C.charcoal, size: 13 });
    d.box(s, sx, y + 1.85, 2.9, 0.6, "diğer açık dosyalar …", { fill: C.light, size: 12, bold: false });
    d.arrow(s, MX + 2.42, y + 1.03, sx - 0.02, y + 0.95, { color: C.mintDeep, w: 1.75 });
    d.arrow(s, MX + 2.42, y + 2.57, sx - 0.02, y + 1.35, { color: C.mintDeep, w: 1.75 });
    disk(s, sx + 3.5, y + 0.25, 1.6, 1.6, "Disk", "dosya denetim bloğu / düğüm");
    d.arrow(s, sx + 2.92, y + 1.02, sx + 3.48, y + 1.02, { color: C.slate, w: 1.5 });
  }
  d.card(s, MX + 8.8, 1.65 + 0.6, 3.35, 4.6, { title: "Kim neyi tutar?", body: [
    { b: "Süreç başına:", t: " dosya işaretçisi (geçerli konum) ve erişim kipi." },
    { b: "Sistem geneli:", t: " dosyanın tüm kullanıcılarınca paylaşılan bilgiler ve bir açılma sayısı." },
    "close() sayıyı bir azaltır; 0 olunca girdi silinir.",
  ], bodySize: 13.5 });
  s.addNotes("Bu, ders kitabındaki (Silberschatz) modeldir. Linux'ta bir düzey daha vardır: dosya tanımlayıcısı, konumu tutan bir 'açık dosya tanımına' (open file description) işaret eder; o da bellekteki düğüme işaret eder. Öğrencilerin yalnızca iki düzeyli resmi bilmesi yeterlidir: dosya işaretçisini tutan süreç başına girdiler ve açılma sayısını tutan sistem geneli bir girdi.");

  // 27 ── Dosya türleri
  s = d.content({ kicker: "Dosya türleri", title: "Dosya Türleri ve Uzantılar" });
  s.addTable([
    ["Dosya türü", "Olağan uzantılar", "İçerik"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 14 } })),
    ...[["Kaynak kod", ".c  .py  .java", "program metni"], ["Nesne / çalıştırılabilir", ".o  .exe  (Linux'ta yok)", "makine kodu"], ["Betik", ".sh  .bat", "kabuk için komutlar"], ["Metin / belge", ".txt  .pdf  .docx", "metin, biçimli belgeler"], ["Çoklu ortam", ".jpg  .mp3  .mp4", "görüntü, ses, video"], ["Arşiv", ".zip  .tar.gz", "sıkıştırılmış birden çok dosya"]]
      .map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: F.body, fontSize: 13.5 } }))),
  ], { x: MX, y: 1.7, w: 6.9, colW: [2.15, 2.45, 2.3], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [5, 8, 5, 8], valign: "middle" });
  {
    const fc = code("out_file_cmd.txt").split("\n").filter(Boolean).map(l => l.length > 46 ? l.slice(0, 43) + "…" : l).join("\n");
    d.code(s, MX + 7.2, 1.7, 4.95, 2.6, fc, 11);
  }
  d.card(s, MX + 7.2, 4.5, 4.95, 2.35, { title: "Ad ve içerik", body: [
    "Windows hangi programın açacağını uzantıya göre seçer.",
    "Linux'ta uzantı yalnızca bir ipucudur; `file` içeriği okur (\"sihirli sayı\"). photo.txt aslında bir JPEG'dir.",
  ], bodySize: 13.5 });
  s.addNotes("file komutunun gerçek çıktısı; uzun satırlar '…' ile kesildi. Pek çok biçimin ilk baytları sabit bir 'sihirli sayıdır' (magic number): JPEG FF D8 FF ile, ELF çalıştırılabilir dosyaları 7F 45 4C 46 = 0x7F 'E' 'L' 'F' ile başlar. students.dat bugünkü file_access.c programının yazdığı ikili kayıt dosyasıdır; bu yüzden file yalnızca 'data' der.");

  // 28 ── Erişim yöntemleri: sıralı ve doğrudan
  s = d.content({ kicker: "Erişim yöntemleri", title: "Sıralı Erişim ve Doğrudan Erişim" });
  {
    const y = 1.7;
    d.text(s, "Sıralı: sonrakini oku / sonrakini yaz / başa sar", { x: MX, y, w: 5.95, h: 0.35, fontSize: 15, bold: true, color: C.mintDeep });
    for (let i = 0; i < 9; i++) d.box(s, MX + i * 0.64, y + 0.7, 0.6, 0.6, "", { fill: i < 4 ? PALE : C.light });
    d.text(s, "baş", { x: MX - 0.1, y: y + 1.35, w: 1.3, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight });
    d.text(s, "son", { x: MX + 5.0, y: y + 1.35, w: 0.75, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "right" });
    d.arrow(s, MX + 2.56, y + 2.0, MX + 2.56, y + 1.33, { color: C.charcoal, w: 2 });
    d.text(s, "geçerli konum", { x: MX + 1.6, y: y + 2.02, w: 1.95, h: 0.3, fontSize: 11, bold: true, color: C.charcoal, align: "center" });
    d.arrow(s, MX + 2.6, y + 0.5, MX + 3.8, y + 0.5, { color: C.mintDeep, w: 2 });
    d.text(s, "sonrakini oku", { x: MX + 3.85, y: y + 0.33, w: 1.6, h: 0.32, fontSize: 11, color: C.mintDeep, bold: true });
    d.card(s, MX, y + 2.55, 5.95, 2.6, { body: ["Bilgi sırayla, bir kayıt ötekinin ardından işlenir.", "Teybin modeli; çoğu programın da modeli: derleyiciler, düzenleyiciler, medya oynatıcılar.", "C'de: art arda read() çağrıları; konum kendiliğinden ilerler."], bodySize: 15.5 });
    const x2 = MX + 6.2;
    d.text(s, "Doğrudan (göreli): n'yi oku / n'ye yaz / n'ye git", { x: x2, y, w: 5.95, h: 0.35, fontSize: 15, bold: true, color: C.mintDeep });
    for (let i = 0; i < 9; i++) d.box(s, x2 + i * 0.64, y + 0.7, 0.6, 0.6, String(i), { fill: i === 6 ? C.mint : i === 2 ? PALE : C.light, size: 12, color: C.dark });
    d.arrow(s, x2 + 1.6, y + 1.55, x2 + 4.1, y + 1.55, { color: C.mintDeep, w: 2 });
    d.text(s, "2. bloktan 6. bloğa atla; aradakiler okunmaz", { x: x2, y: y + 1.75, w: 5.95, h: 0.35, fontSize: 11, italic: true, color: C.mintDeep });
    d.card(s, x2, y + 2.55, 5.95, 2.6, { body: ["Dosya, sabit boyutlu blok ya da kayıtlardan oluşan numaralı bir dizidir.", "Herhangi bir kayıt herhangi bir sırada okunabilir: diskin modeli.", "Veritabanları, uçak rezervasyonları. C'de: önce lseek(), sonra read()."], bodySize: 15.5 });
  }
  s.addNotes("Doğrudan erişimdeki blok numaraları dosyanın başına GÖRELİDİR (0, 1, 2 …); işletim sistemi göreli blok numaralarını fiziksel disk bloklarına eşler, böylece kullanıcının dosyanın diskte nerede olduğunu bilmesi gerekmez. Doğrudan erişimli bir dosyada sıralı erişim, bir geçerli konum (cp) tutularak kolayca taklit edilebilir: sonrakini oku = cp'yi oku; cp = cp + 1.");

  // 29 ── Doğrudan erişim hesabı
  s = d.content({ kicker: "Erişim yöntemleri", title: "Çözümlü Örnek: 1000. Kayıt Nerede?" });
  d.card(s, MX, 1.65, 5.6, 3.25, { title: "Soru", body: [
    "Bir dosya, 0'dan numaralanmış, her biri 100 bayt olan öğrenci kayıtları tutuyor.",
    "Dosya sistemi 4096 baytlık bloklar kullanıyor.",
    "1000. kayıt hangi blokta ve o bloğun neresinde başlıyor?",
  ], bodySize: 15 });
  d.code(s, MX + 5.85, 1.65, 6.3, 3.25,
`bayt konumu = kayıt no × kayıt boyutu
            = 1000 × 100 = 100 000

blok        = ⌊100 000 / 4096⌋ = 24
blok içi    = 100 000 − 24 × 4096
            = 100 000 − 98 304 = 1 696

son bayt    = 100 099  → yine 24. blok`, 13.5);
  d.callout(s, MX, 5.15, 12.15, 1.7, "Yani: 24 numaralı göreli bloğu oku ve 1696 … 1795 arasındaki baytları al. C'de bu tek satırdır: lseek(fd, 1000 * 100, SEEK_SET); ardından read(fd, rec, 100). İşletim sistemi bayt konumunu tam yukarıdaki gibi blok numarasına çevirir. Gösterim programımız 32 baytlık kayıtlar kullanır: 3. kayıt 3 × 32 = 96. baytta başlar.", 14);
  s.addNotes("Aritmetik Python ile denetlendi: 1000*100 = 100000; 100000 // 4096 = 24; 100000 % 4096 = 1696; (100000+99)//4096 = 24, yani kayıt bir blok sınırını aşmıyor. Sınav ipucu: üç satırı yazın (bayt konumu, blok = tam bölme, blok içi konum = kalan).");

  // 30 ── İndeksli erişim
  s = d.content({ kicker: "Erişim yöntemleri", title: "İndeksli Erişim: Önce Bak, Sonra Atla", lead: "Küçük bir indeks dosyası anahtarları blok numaralarına eşler; indekste ara, sonra tek bir bloğu doğrudan oku." });
  {
    const y = 2.6, ix = MX;
    d.text(s, "İndeks (anahtara göre sıralı)", { x: ix, y: y - 0.4, w: 3.4, h: 0.35, fontSize: 12, bold: true, color: C.charcoal });
    const idx = [["Aksoy", "0"], ["Demir", "1"], ["Kaya", "2"], ["Öztürk", "3"], ["Yılmaz", "4"]];
    idx.forEach((r, i) => {
      d.box(s, ix, y + i * 0.55, 2.0, 0.48, r[0], { fill: i === 2 ? PALE : C.light, size: 13, bold: false });
      d.box(s, ix + 2.05, y + i * 0.55, 0.9, 0.48, "→ " + r[1], { fill: i === 2 ? PALE : C.light, size: 13 });
    });
    const dx = MX + 4.3;
    d.text(s, "Veri dosyası (göreli bloklar)", { x: dx, y: y - 0.4, w: 3.0, h: 0.35, fontSize: 12, bold: true, color: C.charcoal });
    for (let b = 0; b < 5; b++) d.box(s, dx, y + b * 0.55, 2.3, 0.48, `blok ${b}`, { sub: b === 2 ? "Kaya … kayıtları" : undefined, fill: b === 2 ? C.mint : C.light, color: C.dark, size: 12, subSize: 10 });
    d.arrow(s, ix + 2.97, y + 2 * 0.55 + 0.24, dx - 0.02, y + 2 * 0.55 + 0.24, { color: C.mintDeep, w: 2 });
  }
  d.card(s, MX + 7.2, 2.2, 4.95, 4.65, { title: "Neden ve nasıl?", body: [
    "Tüm dosya yerine küçük, sıralı bir indekste ara (hızlı).",
    "Sonra doğru bloğu tek bir doğrudan okumayla getir.",
    "Çok büyük dosyalar: indeksin indeksi (çok düzeyli).",
    "Veritabanlarının (B-ağaçları) ve dosya sistemlerinin bir dosyanın kendi bloklarını bulma yönteminin temeli.",
  ], bodySize: 14 });
  s.addNotes("Örnek: 'Kaya' adlı öğrenciyi bulun. İndekste ikili arama (burada 5 girdi, uygulamada binlercesi) 2. bloğu verir; tek bir disk okuması onu getirir. İndeks olmasaydı Kaya'yı bulana kadar dosyayı sırayla okurduk. IBM'in ISAM'ı (indexed sequential access method, indeksli sıralı erişim yöntemi) klasik örnektir.");

  // 31 ── Tek düzeyli ve iki düzeyli dizinler
  s = d.content({ kicker: "Dizin yapıları", title: "Tek Düzeyli ve İki Düzeyli Dizinler" });
  {
    const y = 1.75;
    d.text(s, "Tek düzeyli: herkese tek bir dizin", { x: MX, y, w: 5.95, h: 0.35, fontSize: 15, bold: true, color: C.mintDeep });
    const names = ["cat", "test", "data", "mail", "hex", "test?"];
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX, y: y + 0.55, w: 5.95, h: 0.6, fill: { color: C.charcoal }, rectRadius: 0.05, line: { type: "none" } });
    names.forEach((n, i) => {
      const x = MX + 0.15 + i * 0.97;
      d.text(s, n, { x, y: y + 0.55, w: 0.8, h: 0.6, fontSize: 12, color: i === 5 ? "F3B5AE" : C.white, align: "center", valign: "middle", bold: true });
      line(s, x + 0.4, y + 1.15, x + 0.4, y + 1.6, { color: C.slate });
      if (i < 5) s.addShape(P.shapes.OVAL, { x: x + 0.22, y: y + 1.6, w: 0.36, h: 0.36, fill: { color: C.mint }, line: { type: "none" } });
    });
    d.card(s, MX, y + 2.25, 5.95, 2.85, { body: ["Basit, ama her dosya adı tüm kullanıcılar arasında benzersiz olmalı.", "İki kullanıcı da bir dosyasına test adını veremez.", "Tek listede yüzlerce dosya: düzenlemek imkânsız."], bodySize: 14 });
    const x2 = MX + 6.2;
    d.text(s, "İki düzeyli: her kullanıcıya bir dizin", { x: x2, y, w: 5.95, h: 0.35, fontSize: 15, bold: true, color: C.mintDeep });
    d.box(s, x2 + 1.0, y + 0.5, 4.0, 0.5, "ana dosya dizini:  ayse  ·  mehmet", { fill: C.charcoal, size: 12 });
    [["ayse", ["test", "data"]], ["mehmet", ["test", "mail"]]].forEach((u, k) => {
      const ux = x2 + 0.3 + k * 3.05;
      line(s, x2 + 2.1 + k * 1.8, y + 1.0, ux + 1.2, y + 1.35, { color: C.slate });
      d.box(s, ux, y + 1.35, 2.4, 0.45, `${u[0]}: ` + u[1].join(" · "), { fill: PALE, size: 12, color: C.dark });
      u[1].forEach((f, j) => {
        line(s, ux + 0.6 + j * 1.2, y + 1.8, ux + 0.6 + j * 1.2, y + 2.05, { color: C.slate });
        s.addShape(P.shapes.OVAL, { x: ux + 0.42 + j * 1.2, y: y + 2.05, w: 0.36, h: 0.36, fill: { color: C.mint }, line: { type: "none" } });
      });
    });
    d.card(s, x2, y + 2.65, 5.95, 2.45, { body: ["Her kullanıcının özel bir dizini var: ikisinin de test dosyası olabilir.", "Yol adı = kullanıcı + dosya adı, ör. /ayse/test.", "Ama alt klasör yok ve kullanıcılar arasında dosya paylaşmak zahmetli."], bodySize: 14 });
  }
  s.addNotes("Tek düzeyli dizinler ilk kişisel bilgisayarlarda vardı ve basit aygıtlarda (bazı fotoğraf makineleri, gömülü flaş bellekler) hâlâ kullanılır. Kırmızı 'test?' ad çakışmasını gösterir. İki düzeyli dizinler kullanıcıları birbirinden yalıtır: koruma için iyi, iş birliği için kötü.");

  // 32 ── Ağaç yapılı
  s = d.content({ kicker: "Dizin yapıları", title: "Ağaç Yapılı Dizinler ve Yol Adları" });
  {
    const node = (x, y, label, opt = {}) => d.box(s, x, y, opt.w || 1.25, 0.46, label, Object.assign({ fill: C.light, size: 12, color: C.dark }, opt));
    const edge = (x1, y1, x2, y2) => line(s, x1, y1, x2, y2, { color: C.slate });
    const Y = [1.75, 2.75, 3.75, 4.75, 5.75];
    node(MX + 3.0, Y[0], "/", { fill: C.charcoal, color: C.white });
    const l1 = [["bin", MX + 0.6], ["home", MX + 3.0], ["etc", MX + 4.95]];
    l1.forEach(([n, x]) => { edge(MX + 3.62, Y[0] + 0.46, x + 0.62, Y[1]); node(x, Y[1], n, { fill: PALE }); });
    [["ls", MX + 0.0], ["cat", MX + 1.25]].forEach(([n, x]) => { edge(MX + 1.22, Y[1] + 0.46, x + 0.55, Y[2]); node(x, Y[2], n, { w: 1.1 }); });
    [["ayse", MX + 2.6], ["mehmet", MX + 4.2]].forEach(([n, x]) => { edge(MX + 3.62, Y[1] + 0.46, x + 0.62, Y[2]); node(x, Y[2], n, { fill: PALE }); });
    [["os", MX + 1.75], ["photo.jpg", MX + 3.15]].forEach(([n, x]) => { edge(MX + 3.22, Y[2] + 0.46, x + 0.62, Y[3]); node(x, Y[3], n, { fill: n === "os" ? PALE : C.light }); });
    edge(MX + 4.82, Y[2] + 0.46, MX + 5.35, Y[3]); node(MX + 4.65, Y[3], "report.txt", { w: 1.4 });
    [["notes.txt", MX + 1.0], ["lab1.c", MX + 2.4]].forEach(([n, x]) => { edge(MX + 2.37, Y[3] + 0.46, x + 0.62, Y[4]); node(x, Y[4], n, { fill: n === "notes.txt" ? C.mint : C.light }); });
    d.text(s, "soluk = dizin, beyaz = dosya", { x: MX, y: 6.4, w: 6.2, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight });
  }
  d.card(s, MX + 6.6, 1.65, 5.55, 2.45, { title: "Bir dosyayı adlandırmanın iki yolu", body: [
    { b: "Mutlak yol:", t: " kök dizinden (/) başlar." },
    { b: "Göreli yol:", t: " geçerli dizinden başlar." },
    { b: ". ve ..", t: " bu dizin ve üst dizin demektir." },
    "9. hafta: pwd, cd ve ls ile bu ağaçta dolaşacaksınız.",
  ], bodySize: 14 });
  d.code(s, MX + 6.6, 4.3, 5.55, 2.55,
`# mutlak: her yerden çalışır
/home/ayse/os/notes.txt

# göreli, geçerli dizin /home/ayse
os/notes.txt

# göreli, geçerli dizin /home/ayse/os
../../mehmet/report.txt`, 12.5);
  s.addNotes("Tüm modern işletim sistemleri bir ağaç (ya da sonraki slayttaki genellemeleri) kullanır. Öğrencilere yolları sesli söyletin. Windows aynı fikri sürücü harfleri ve ters bölü işaretleriyle kullanır: C:\\Users\\ayse\\os\\notes.txt. 9. haftada mutlak ve göreli yollarla cd alıştırması yapacaklar.");

  // 33 ── Döngüsüz çizge ve genel çizge
  s = d.content({ kicker: "Dizin yapıları", title: "Döngüsüz Çizgeler: Bağlantılarla Paylaşım" });
  {
    const y = 1.8;
    d.box(s, MX + 0.2, y, 1.9, 0.5, "/home/ayse", { fill: PALE, size: 13, color: C.dark });
    d.box(s, MX + 3.9, y, 1.9, 0.5, "/home/mehmet", { fill: PALE, size: 13, color: C.dark });
    d.box(s, MX + 0.2, y + 1.2, 1.9, 0.5, "notes.txt", { fill: C.light, size: 13, color: C.dark });
    d.box(s, MX + 3.9, y + 1.2, 1.9, 0.5, "hard.txt", { fill: C.light, size: 13, color: C.dark });
    line(s, MX + 1.15, y + 0.5, MX + 1.15, y + 1.2); line(s, MX + 4.85, y + 0.5, MX + 4.85, y + 1.2);
    d.box(s, MX + 1.8, y + 2.35, 2.4, 0.9, "düğüm 368662", { sub: "bağlantı sayısı = 2", fill: C.charcoal, size: 13 });
    d.arrow(s, MX + 1.15, y + 1.72, MX + 2.4, y + 2.33, { color: C.mintDeep, w: 2 });
    d.arrow(s, MX + 4.85, y + 1.72, MX + 3.6, y + 2.33, { color: C.mintDeep, w: 2 });
    d.text(s, "sabit bağlantı: iki ad, tek dosya", { x: MX, y: y + 3.3, w: 6.0, h: 0.35, fontSize: 13, bold: true, color: C.mintDeep, align: "center" });
    d.box(s, MX + 0.2, y + 4.0, 1.9, 0.6, "soft.txt", { sub: "içeriği: \"notes.txt\"", fill: C.light, size: 12, subSize: 10, color: C.dark });
    d.arrow(s, MX + 2.12, y + 4.3, MX + 3.88, y + 4.3, { color: C.amber, w: 2 });
    d.box(s, MX + 3.9, y + 4.0, 1.9, 0.6, "notes.txt", { fill: C.light, size: 12, color: C.dark });
    d.text(s, "sembolik bağlantı: bir yol saklayan dosya", { x: MX, y: y + 4.65, w: 6.0, h: 0.35, fontSize: 13, bold: true, color: C.amber, align: "center" });
  }
  d.card(s, MX + 6.4, 1.65, 5.75, 2.75, { title: "Döngüsüz çizge (acyclic graph)", body: [
    "Bir dosya (ya da dizin) birden çok dizinde yer alabilir: kopyalanmaz, paylaşılır.",
    { b: "Sabit bağlantı (hard link):", t: " aynı düğüm için ikinci bir dizin girdisi. Bir adı silmek dosyayı silmez." },
    { b: "Sembolik bağlantı:", t: " bir yol tutan küçük bir dosya; hedef silinirse boşta (sarkık) kalır." },
  ], bodySize: 13.5 });
  d.card(s, MX + 6.4, 4.6, 5.75, 2.25, { title: "Genel çizge (döngülere izin veren)", titleColor: C.red, body: [
    "Bir üst dizine geri dönen bağlantı döngü oluşturur: aramalar sonsuza dek dönebilir, silinmiş bir alt ağaç hiç \"kullanılmaz\" duruma gelmeyebilir.",
    "Linux dizinlere sabit bağlantıyı yasaklar; sembolik bağlantı döngüleri bir hatayla (ELOOP) durur.",
  ], bodySize: 13.5 });
  s.addNotes("Bağlantı sayısı (link count): düğüm, kendisine işaret eden dizin girdilerinin (sabit bağlantıların) sayısını tutar; dosyanın verisi ancak bu sayı 0'a indiğinde ve hiçbir süreç dosyayı açık tutmadığında serbest bırakılır. Linux'taki silme çağrısının adının unlink olmasının nedeni budur. Sembolik bağlantılar dizinlere ve başka dosya sistemlerine işaret edebilir; sabit bağlantılar dosya sistemi sınırını aşamaz.");

  // 34 ── Düğümler
  s = d.content({ kicker: "Linux", title: "Linux Ne Gösterir: Dizin Girdileri ve Düğümler", lead: "Dizin, (ad, düğüm numarası) çiftlerinden oluşan bir tablodur. Bir dosyayla ilgili diğer her şey onun düğümünde (inode) durur." });
  {
    const y = 2.4;
    d.text(s, "/home/student/lab dizini", { x: MX, y: y - 0.05, w: 3.4, h: 0.35, fontSize: 12, bold: true, color: C.charcoal });
    [["notes.txt", "368662"], ["hard.txt", "368662"], ["soft.txt", "368663"]].forEach((r, i) => {
      d.box(s, MX, y + 0.35 + i * 0.5, 1.7, 0.44, r[0], { fill: C.light, size: 12, bold: false, font: F.code });
      d.box(s, MX + 1.75, y + 0.35 + i * 0.5, 1.15, 0.44, r[1], { fill: i < 2 ? PALE : C.light, size: 12, bold: false, font: F.code, color: C.dark });
    });
    const ix = MX + 3.6;
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: ix, y: y - 0.05, w: 3.4, h: 3.55, fill: { color: C.charcoal }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [
      { text: "düğüm 368662", options: { bold: true, color: C.mint, fontSize: 14, breakLine: true } },
      { text: "tür: normal dosya", options: { breakLine: true } },
      { text: "kip: -rw-rw-r--", options: { breakLine: true } },
      { text: "sahip, grup: student", options: { breakLine: true } },
      { text: "boyut: 6 bayt", options: { breakLine: true } },
      { text: "bağlantı sayısı: 2", options: { breakLine: true } },
      { text: "atime, mtime, ctime", options: { breakLine: true } },
      { text: "blok işaretçileri ──►", options: { bold: true, color: C.mint, breakLine: true } },
      { text: "(dosya adı yok!)", options: { italic: true, color: C.mutedOnDark } },
    ], { x: ix + 0.25, y: y + 0.1, w: 3.0, h: 4.0, fontSize: 13, color: C.light, paraSpaceAfter: 3 });
    d.arrow(s, MX + 2.92, y + 0.6, ix - 0.02, y + 0.4, { color: C.mintDeep, w: 1.75 });
    d.arrow(s, MX + 2.92, y + 1.1, ix - 0.02, y + 0.6, { color: C.mintDeep, w: 1.75 });
    for (let b = 0; b < 3; b++) d.box(s, ix + 3.75, y + 1.83 + b * 0.5, 1.2, 0.44, b === 0 ? "\"hello\\n\"" : "", { fill: b === 0 ? C.mint : C.light, size: 12, color: C.dark, font: F.code });
    d.text(s, "veri blokları", { x: ix + 3.6, y: y + 3.33, w: 1.5, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "center" });
    d.arrow(s, ix + 2.6, y + 2.05, ix + 3.73, y + 2.05, { color: C.mint, w: 1.75 });
  }
  d.card(s, MX + 8.8, 2.35, 3.35, 3.55, { title: "Kendiniz görün", body: [
    "ls -i: düğüm numaraları.",
    "ls -l: 2. sütun = bağlantı sayısı.",
    "stat dosya: düğümün tamamı.",
    "df -i: boş düğümler.",
  ], bodySize: 14 });
  s.addNotes("Bu slayt Linux haftalarına köprüdür: 9. hafta (dizinlerde gezinme), 10. hafta (dosya işlemleri: cp, mv, rm, ln) ve 11. hafta (düğümün kip alanında saklanan izinler). Şuna dikkat çekin: aynı dosya sistemi içinde mv yalnızca bir dizin girdisini değiştirir; düğüm ve veri yer değiştirmez. Dev bir dosyayı taşımanın anında bitmesinin nedeni budur.");

  // 35 ── Uygulama: bağlantılar
  s = d.content({ kicker: "Uygulama", title: "Örnek 3: ls -li, ln, ln -s ve stat" });
  {
    const out = code("out_links.txt").replace(/\t/g, "   ").split("\n");
    const keep = out.filter(l => !/^ Birth|^Access: 20|^total|^\$ ls -li notes.txt|^\d+ .* 1 student student 6 .*notes.txt$/.test(l));
    const txt = keep.join("\n").replace(/\n+$/, "");
    d.code(s, MX, 1.65, 7.95, 5.2, txt, 10.5);
  }
  d.card(s, MX + 8.25, 1.65, 3.9, 5.2, { title: "Neye dikkat edelim?", body: [
    "notes.txt ve hard.txt: aynı düğüm, bağlantı sayısı 2.",
    "soft.txt: kendi düğümü var; boyutu 9 = \"notes.txt\" dizgesinin uzunluğu.",
    "Değişim zamanı (ctime) ilerledi: ln düğümü güncelledi.",
    "rm sonrasında: hard.txt hâlâ çalışır, soft.txt boşta kalır.",
  ], bodySize: 13.5 });
  s.addNotes("Sıradan bir kullanıcı olarak yakalanmış gerçek oturum (betik: code/links_demo.sh; birkaç satır kırpıldı, tam çıktı ders notlarında). ls -li çıktısının ilk sütununu gösterin. Sorun: rm notes.txt'den sonra hard.txt'nin bağlantı sayısı kaçtır? (1; son listede görülüyor.) 10. hafta ln, cp, mv ve rm konularına ayrıntılı olarak döner.");

  // 36 ── Uygulama: file_access
  s = d.content({ kicker: "Uygulama", title: "Örnek 4: C'de Sıralı ve Doğrudan Erişim" });
  d.code(s, MX, 1.65, 7.4, 3.75, code("file_access_excerpt.c"), 11);
  d.card(s, MX + 7.7, 1.65, 4.45, 3.75, { title: "Ne oluyor?", body: [
    "read() dosya işaretçisini her seferinde 32 bayt ilerletir: sıralı.",
    "lseek() işaretçiyi herhangi bir yere koyar; sonraki read() ya da write() oradan başlar: doğrudan.",
    "1. kayda yazmak diğer kayıtlara dokunmaz.",
  ], bodySize: 13.5 });
  d.code(s, MX, 5.6, 12.15, 1.25, "$ ./file_access\n" + code("out_file_access.txt").replace(/\n$/, ""), 11);
  s.addNotes("Gerçek çıktı. Buradaki dosya işaretçisi, süreç başına açık dosya tablosunda tutulan 'geçerli konumun' ta kendisidir. Dosya 160 bayttır = 5 kayıt × 32 bayt. Sorun: son kaydı hangi lseek() çağrısı okur? (lseek(fd, 4 * 32, SEEK_SET), 128. bayt.)");

  // 37 ── Kısa sınav
  s = d.quizSlide({ questions: [
    "Başvuru dizisi 1, 2, 3, 1, 4, 1, 2 ve 3 çerçeve: FIFO ile kaç sayfa hatası olur? LRU ile?",
    "tₘ = 200 ns, t_fault = 8 ms, p = 0,0001. Etkin erişim süresi nedir?",
    "Kayıtlar 64 bayt, bloklar 4096 bayt. 200. kayıt hangi blokta, hangi konumda başlar?",
    "ln a.txt b.txt ve rm a.txt komutlarından sonra veriyi hâlâ okuyabilir misiniz? b.txt ln -s ile yapılmış olsaydı?",
  ] });
  s.addNotes("Yanıtlar. (1) FIFO: 1H 2H 3H 1isabet 4H(1'i çıkarır) 1H(2'yi çıkarır) 2H(3'ü çıkarır) = 6 hata; LRU: 1H 2H 3H 1isabet 4H(2'yi çıkarır) 1isabet 2H(3'ü çıkarır) = 5 hata (page_replacement.py ile denetlendi; OPT 4 verir). (2) EAT = 0,9999 × 200 + 0,0001 × 8.000.000 = 199,98 + 800 = 999,98 ns, yaklaşık 1 mikrosaniye: RAM'den 5 kat yavaş. (3) Bayt 200 × 64 = 12.800; blok ⌊12800/4096⌋ = 3; blok içi konum 12800 − 12288 = 512. (4) Sabit bağlantıda evet (düğümün hâlâ bir adı var); sembolik bağlantıda hayır (artık var olmayan bir yolu gösteriyor).");

  // 38 ── Akılda kalanlar
  s = d.content({ kicker: "Toparlama", title: "7. Hafta: Akılda Kalması Gerekenler" });
  d.bullets(s, [
    { b: "Sanal bellek:", t: " süreç büyük bir adres alanı görür; yalnızca kullanılan sayfalar RAM'dedir. İsteğe bağlı sayfalama bir sayfayı ilk kullanımda yükler." },
    { b: "Sayfa hatası:", t: " geçersiz bir sayfaya erişim işletim sistemine tuzak üretir; o da sayfayı yükleyip komutu yeniden başlatır. EAT = (1 − p)·tₘ + p·t_fault, yani p çok küçük olmalı." },
    { b: "Yazınca kopyala:", t: " fork() sayfaları taraflardan biri yazana kadar paylaştırır." },
    { b: "Değiştirme:", t: " FIFO (basit, Belady anomalisi), OPT (en iyi, geleceği ister), LRU (iyi, saat algoritmasıyla yaklaşılır). Örnek: 15 / 9 / 12 hata." },
    { b: "Boşa çalışma:", t: " çok az çerçeve → sürekli sayfalama; her çalışma kümesini bellekte tut." },
    { b: "Dosyalar:", t: " öznitelikleri olan adlandırılmış veri (düğümde); açık dosya tabloları; sıralı, doğrudan, indeksli erişim." },
    { b: "Dizinler:", t: " tek düzeyli → iki düzeyli → ağaç → döngüsüz çizge (sabit ve sembolik bağlantılar)." },
  ], { fontSize: 18, y: 1.7, h: 5.15, paraSpaceAfter: 11 });
  s.addNotes("Bunları hızlıca okuyun; her satır olası bir sınav konusudur.");

  // 39 ── Vize kontrol listesi
  s = d.cardsSlide({
    kicker: "Vize · 8. hafta", title: "Vize Kontrol Listesi: 1–7. Haftalar",
    cards: [
      { title: "H1 Tarihçe", body: "Toplu işleme, çoklu programlama, zaman paylaşımı; boşta duran işlemci tasarımı nasıl yönlendirdi; UNIX ve Linux." },
      { title: "H2 Temeller", body: "Tanımlar, hedefler, kesmeler, bellek hiyerarşisi, ikili mod, sistem çağrıları, yapılar." },
      { title: "H3 Süreçler", body: "Hizmetler, sistem çağrısı türleri, süreç durumları, PCB, bağlam değişimi, fork()." },
      { title: "H4 İş parçacıkları", body: "Kullanıcı ve çekirdek iş parçacıkları, çoklu iş parçacığı modelleri, zamanlama ölçütleri." },
      { title: "H5 Eşzamanlama", body: "Gantt şemalarıyla FCFS, SJF/SRTF, Öncelik, RR; yarış durumu, mutex, semafor." },
      { title: "H6 Bellek", body: "Mantıksal ve fiziksel adres, MMU, parçalanma, sayfalama, TLB ve EAT, bölümleme." },
      { title: "H7 SB ve dosyalar", body: "Sayfa hataları, p ile EAT, FIFO/OPT/LRU tabloları, boşa çalışma; erişim yöntemleri, dizinler, bağlantılar." },
      { title: "Nasıl hazırlanmalı?", body: "Slaytlardaki her çözümlü örneği ve sınavı, notlardaki tekrar sorularını yeniden çözün." },
    ], cols: 4, bodySize: 15,
  });
  s.addNotes("Sınav 1'den 7'ye kadar tüm haftaları kapsar. Alıştırma yapılacak sayısal soru türleri: Gantt şemaları ve bekleme süreleri (5. hafta), adres çevirisi ve TLB ile EAT (6. hafta), sayfa hatalı EAT ve sayfa değiştirme çerçeve tabloları (7. hafta), doğrudan erişim blok hesabı (7. hafta). Her haftanın ders notları çözümlü yanıtlı tekrar sorularıyla biter; en iyi çalışma malzemesi budur. Kesin saat ve salon Telegram kanalında duyurulacak.");

  // 40–41 ── Kapanış
  d.closing({ nextWeek: "Vize Sınavı (8. hafta)", nextItems: [
    "1–7. haftaları kapsar: slaytlar ve ders notları",
    "Alıştırın: Gantt şemaları, EAT (TLB ve sayfa hataları), FIFO/OPT/LRU tabloları, blok hesabı",
    "Öğrenci kimliğinizi, kaleminizi ve izin verilirse basit bir hesap makinesi getirin",
    "Saat ve salon: dersin Telegram kanalını takip edin",
    "Vizeden sonra 9. hafta uygulamalı Linux ile başlıyor: kabuk ve dizinlerde gezinme",
  ] });
  d.pres.slides[d.n - 2].addNotes("Gelecek hafta vize var; 1. haftadan bugüne kadar her şeyi kapsıyor. Hesap makinesi kuralları ile kesin salon ve saat Telegram'da kesinleşecek. Sınavdan sonra dersin uygulamalı yarısına geçiyoruz: 9. haftadan itibaren her hafta Linux kabuğunu kullanacağız ve işe bugün çizdiğimiz dizin ağacında gezinmekle başlayacağız.");
  d.pres.slides[d.n - 1].addNotes("Özellikle vizeyle ilgili sorular için sözü öğrencilere bırakın. Telegram kanalında sorulan soruların herkese yardımcı olduğunu hatırlatın.");

  await d.save(path.join(__dirname, "MBLP131_Hafta7.pptx"));
  console.log("slides:", d.n);
})();
