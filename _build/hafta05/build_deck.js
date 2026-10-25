// Hafta 5 sunumu (MBLP131, Türkçe): İşlemci Zamanlama Algoritmaları ve Süreç Eşzamanlaması
// İngilizce referans: ../week05/build_deck.js (aynı slayt sırası, aynı diyagramlar, aynı sayılar).
// Tüm zamanlama sayıları code/sched_results.json dosyasından okunur (code/sched_check.py üretir).
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("../lib/deck");
const d = new Deck({ week: 5, lang: "tr", assets: path.join(__dirname, "../lib") });
const code = f => fs.readFileSync(path.join(__dirname, "code", f), "utf8");
const P = d.pres;
const R = JSON.parse(code("sched_results.json"));
const RUN = code("run_output.txt").trim().split("\n");   // gerçek program çıktısı (olduğu gibi)

// ---------- yardımcılar ---------------------------------------------------------------
const PC = { P1: [C.mint, C.dark], P2: [C.slate, C.white], P3: [C.amber, C.white], P4: [C.charcoal, C.white] };
const fmtPt = x => (Number.isInteger(x) ? String(x) : x.toFixed(2).replace(/0$/, ""));   // kod kutuları: nokta
const fmt = x => fmtPt(x).replace(".", ",");                                               // Türkçe metin: virgül
const pct = (x, k = 1) => "%" + (100 * x).toFixed(k).replace(".", ",");
const BODY = "3A464C";

// Doğal olarak çizilen Gantt şeması: bir sıra kutu, altında zaman işaretleri.
function gantt(s, x, y, w, segs, { T, h = 0.62, label, labelW = 1.25, size = 13 } = {}) {
  if (label) {
    d.text(s, label, { x, y, w: labelW - 0.1, h, fontSize: 13, bold: true, color: C.charcoal, valign: "middle" });
    x += labelW; w -= labelW;
  }
  T = T || Math.max(...segs.map(g => g[2]));
  const k = w / T;
  segs.forEach(([p, a, b]) => {
    const [fill, fg] = PC[p] || [C.light, C.charcoal];
    d.box(s, x + a * k + 0.01, y, (b - a) * k - 0.02, h, p, { fill, color: fg, size });
  });
  const ticks = [...new Set([0, ...segs.map(g => g[1]), ...segs.map(g => g[2])])].sort((a, b) => a - b);
  ticks.forEach(t => {
    s.addShape(P.shapes.LINE, { x: x + t * k, y: y + h, w: 0.0001, h: 0.08, line: { color: C.mutedOnLight, width: 1 } });
    d.text(s, String(t), { x: x + t * k - 0.3, y: y + h + 0.08, w: 0.6, h: 0.26, fontSize: 12, align: "center", color: C.mutedOnLight });
  });
}

// Süreç başına sonuç tablosu (+ ortalama satırı)
function resultsTable(s, x, y, w, key, { cols = ["arrival", "burst", "completion", "turnaround", "waiting", "response"], fontSize = 13, rowH } = {}) {
  const names = { arrival: "Varış", burst: "Patlama", priority: "Öncelik", completion: "Bitiş", turnaround: "Dönüş", waiting: "Bekleme", response: "Yanıt" };
  const per = R[key].per, avg = R[key].avg;
  const hdr = ["Süreç", ...cols.map(c => names[c])].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize, align: "center" } }));
  const body = Object.keys(per).map((p, i) => [p, ...cols.map(c => String(per[p][c]))].map((t, j) => ({ text: t, options: { color: BODY, fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: F.body, fontSize, align: "center" } })));
  const avgRow = ["Ortalama", ...cols.map(c => (avg[c] !== undefined ? fmt(avg[c]) : ""))].map((t, j) => ({ text: t, options: { color: C.mintDeep, bold: true, fill: { color: "D7E9E6" }, fontFace: F.body, fontSize, align: "center" } }));
  const colW0 = 1.05, extra = cols.includes("turnaround") ? 0.3 : 0, rest = (w - colW0 - extra) / cols.length;
  hdr.forEach(h => { h.options.fontSize = fontSize - 0.5; });
  s.addTable([hdr, ...body, avgRow], { x, y, w, colW: [colW0, ...cols.map(c => rest + (c === "turnaround" ? extra : 0))], rowH, border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [3, 4, 3, 4], valign: "middle" });
}

// Standart algoritma slaydı: üstte Gantt, solda tablo, sağda açıklama kartı.
function algoSlide({ kicker, title, lead, key, side, sideTitle, notes, cols, sideSize = 14.5 }) {
  const s = d.content({ kicker, title, lead });
  gantt(s, MX, 2.3, 12.15, R[key].segs, { T: 16 });
  resultsTable(s, MX, 3.55, 7.3, key, { cols, rowH: 0.44 });
  d.card(s, MX + 7.55, 3.55, 4.6, 3.3, { title: sideTitle || "Karar nasıl verildi?", body: side, bodySize: sideSize });
  if (notes) s.addNotes(notes);
  return s;
}

// kütüphane varsayılanından daha büyük gövde metinli karşılaştırma slaydı
function compare2({ kicker, title, lead, left, right, callout, bodySize = 16 }) {
  const s = d.content({ kicker, title, lead });
  const y0 = lead ? 2.3 : 1.65, h = (callout ? 5.75 : 6.85) - y0;
  d.card(s, MX, y0, 5.95, h, { title: left.title, body: left.items, titleColor: left.color, bodySize, titleSize: 17 });
  d.card(s, MX + 6.2, y0, 5.95, h, { title: right.title, body: right.items, titleColor: right.color, bodySize, titleSize: 17 });
  if (callout) d.callout(s, MX, 6.0, 12.15, 0.85, callout, 15);
  return s;
}
// daha büyük yan metinli kod slaydı
function code2({ kicker, title, lead, code: src, size = 12, codeW = 7.2, side, sideTitle, run, sideSize = 15 }) {
  const s = d.content({ kicker, title, lead });
  const y0 = lead ? 2.25 : 1.65, h = 6.85 - y0;
  d.code(s, MX, y0, codeW, h, src, size);
  const sx = MX + codeW + 0.3, sw = 12.15 - codeW - 0.3;
  if (run) {
    const rh = run.h || 1.6;
    d.card(s, sx, y0, sw, h - rh - 0.25, { title: sideTitle, body: side, bodySize: sideSize });
    d.code(s, sx, y0 + h - rh, sw, rh, run.text, run.size || 11);
  } else d.card(s, sx, y0, sw, h, { title: sideTitle, body: side, bodySize: sideSize });
  return s;
}

(async () => {
  // 1 ── Başlık
  let s = d.titleSlide({
    kicker: "MBLP131  ·  HAFTA 5",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 5  ·  İşlemci Zamanlama Algoritmaları ve Süreç Eşzamanlaması",
    tagline: "Sırada kim çalışacak ve iş parçacıkları veriyi bozmadan nasıl paylaşır?",
  });
  s.addNotes("Tekrar hoş geldiniz. İlk saatte zamanlama algoritmalarının kendisini işliyoruz: 'İşlemciyi sıradaki hangi hazır süreç alacak?' sorusunu nihayet sayılarla yanıtlıyoruz. Aradan sonra birkaç iş parçacığı aynı veriyi paylaştığında neyin ters gidebileceğine ve bunu düzelten araçlara (kilitler, semaforlar) bakacağız. Dersi, bu makinede gerçekten oluşan bir yarış durumunu gösteren C programlarıyla bitiriyoruz.");

  // 2 ── Geçen hafta
  s = d.cardsSlide({
    kicker: "Geçen hafta", title: "Dört Fikirde 4. Hafta",
    cards: [
      { title: "İş parçacıkları", body: "Bir süreç içindeki iş parçacıkları kodu, veriyi ve açık dosyaları paylaşır; her birinin kendi yazmaçları ve yığıtı (stack) vardır." },
      { title: "CPU–G/Ç patlamaları", body: "Süreç, CPU patlamaları (CPU burst) ile G/Ç beklemeleri arasında gidip gelir. Patlamaların çoğu kısa, birkaçı uzundur." },
      { title: "Kesintili mi, değil mi?", body: "Kesintisiz: süreç bloklanana ya da bitene kadar işlemciyi tutar. Kesintili (preemptive): işletim sistemi işlemciyi geri alabilir. Geçişi dağıtıcı yapar." },
      { title: "Bir planı puanlamak", body: [{ b: "Dönüş", t: " = bitiş − varış" }, { b: "Bekleme", t: " = dönüş − patlama" }, { b: "Yanıt", t: " = ilk çalışma − varış" }] },
    ], cols: 4, bodySize: 15,
    callout: "Bugün: bu kararı veren algoritmalar ve zamanladığımız iş parçacıkları veri paylaştığında olanlar.",
  });
  s.addNotes("İki dakikalık bir tekrar. Üç formülü tahtaya yazın; bugün her algoritma slaydında kullanacağız. Öğrencilere hatırlatın: işlemci kullanımını ve iş çıkarma hızını (throughput) en büyük, dönüş, bekleme ve yanıt sürelerini en küçük yapmak istiyoruz.");

  // 3 ── Gündem
  s = d.content({ kicker: "Hafta 5", title: "Bugünün Gündemi" });
  [
    ["1", "FCFS ve SJF", "İlk gelen ilk hizmet alır, en kısa iş önce, en kısa kalan süre önce."],
    ["2", "Öncelik ve döngüsel", "Açlık ve yaşlandırma; zaman dilimi; çok düzeyli kuyruklar; Linux ne yapıyor?"],
    ["3", "Yarış durumları", "counter++ neden güncelleme kaybedebilir; kritik bölge problemi."],
    ["4", "Eşzamanlama araçları", "Peterson, atomik komutlar, muteks kilitleri, semaforlar, üretici–tüketici."],
    ["5", "Uygulama", "pthreads ile C'de gerçek bir yarış ve ölçülmüş çözümü."],
  ].forEach((a, i) => {
    const y = 1.7 + i * 1.0;
    d.box(s, MX, y, 0.8, 0.8, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 1.0, y, w: 11.15, h: 0.8, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "   ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.3, y, w: 10.7, h: 0.8, valign: "middle" });
  });
  s.addNotes("1. ve 2. bölümler aradan önce, 3–5. bölümler aradan sonra. 1. bölümdeki her şey TEK bir dört süreçlik iş kümesini kullanıyor; böylece sonunda algoritmaları tek bir tabloda adil biçimde karşılaştırabileceğiz.");

  // ───────────────────────── BÖLÜM 1: ALGORİTMALAR
  s = d.sectionSlide({ kicker: "Bölüm 1", title: "İşlemci Zamanlama Algoritmaları", subtitle: "Tek iş kümesi, yedi plan, tek karşılaştırma tablosu." });
  s.addNotes("Hazır kuyruğunda birkaç süreç bekliyor. Zamanlayıcı birini seçer, dağıtıcı ona işlemciyi verir. Aşağıdaki her algoritma, 'birini seç' adımı için farklı bir kuraldan ibarettir.");

  // 5 ── İş kümesi
  s = d.content({ kicker: "Sürekli örneğimiz", title: "Her Algoritma için Tek Bir İş Kümesi", lead: "Dört süreç. Süreler milisaniye cinsinden. Öncelik numarası küçüldükçe öncelik yükselir." });
  {
    const hdr = ["Süreç", "Varış zamanı", "CPU patlaması", "Öncelik"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 15, align: "center" } }));
    const rows = R.jobs.map((j, i) => [j[0], String(j[1]), String(j[2]), String(j[3])].map((t, k) => ({ text: t, options: { color: k === 0 ? (PC[j[0]][0] === C.mint ? C.mintDeep : PC[j[0]][0]) : BODY, bold: k === 0, fill: { color: i % 2 ? C.white : C.light }, fontFace: F.body, fontSize: 16, align: "center" } })));
    s.addTable([hdr, ...rows], { x: MX, y: 2.3, w: 6.6, colW: [1.3, 1.85, 1.9, 1.55], rowH: 0.5, border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [4, 6, 4, 6], valign: "middle" });
    // varış zaman çizelgesi
    const x0 = MX + 0.3, y0 = 6.25, k = 0.75;
    s.addShape(P.shapes.LINE, { x: x0, y: y0, w: 6.0, h: 0, line: { color: C.slate, width: 1.5, endArrowType: "triangle" } });
    for (let t = 0; t <= 7; t++) d.text(s, String(t), { x: x0 + t * k - 0.2, y: y0 + 0.06, w: 0.4, h: 0.3, fontSize: 12, align: "center", color: C.mutedOnLight });
    d.text(s, "zaman (ms)", { x: x0 + 4.7, y: y0 + 0.35, w: 1.4, h: 0.3, fontSize: 12, italic: true, color: C.mutedOnLight, align: "right" });
    R.jobs.forEach(j => {
      const [fill, fg] = PC[j[0]];
      d.box(s, x0 + j[1] * k - 0.3, y0 - 0.75, 0.6, 0.45, j[0], { fill, color: fg, size: 13 });
      d.arrow(s, x0 + j[1] * k, y0 - 0.28, x0 + j[1] * k, y0 - 0.03, { w: 1.25 });
    });
    d.text(s, "varışlar", { x: MX, y: 5.1, w: 3, h: 0.3, fontSize: 12, italic: true, color: C.mutedOnLight });
  }
  d.card(s, MX + 6.9, 2.3, 5.25, 4.55, { title: "Oyunun kuralları", body: [
    { b: "Gantt şeması:", t: " bir sıra kutu; her kutu bir CPU kullanım aralığı, altındaki işaretler zamanlar." },
    { b: "Bağlam değişimi", t: " süresi 0 alınır (geçişleri ayrıca sayarız)." },
    { b: "Eşitlikler", t: " önce varış zamanına, sonra ada göre bozulur." },
    { b: "Tüm sayılar", t: " küçük bir simülatörle hesaplandı: code/sched_check.py." },
  ], bodySize: 15.5 });
  s.addNotes("İş kümesini yavaşça tanıtın; öğrenciler bunu defterlerine yazmalı. Toplam CPU işi 7+4+1+4 = 16 ms'dir; burada işlemci hiç boş kalmadığından her plan t = 16'da biter. Simülatör dosyası ders klasöründe; biraz Python bilen öğrenciler işleri değiştirip yeniden çalıştırabilir.");

  // 6 ── FCFS
  algoSlide({
    kicker: "Algoritma 1", title: "İlk Gelen İlk Hizmet Alır (FCFS)",
    lead: "Hazır kuyruğu basit bir FIFO kuyruğudur: önce gelen önce çalışır; bitene ya da bloklanana kadar. Kesintisizdir (non-preemptive).",
    key: "FCFS",
    side: [
      "Varış sırası: P1 (0), P2 (2), P3 (4), P4 (5).",
      "Örnek, P3: dönüş 12 − 4 = 8, bekleme 8 − 1 = 7 ms.",
      "Basit ve 'banka kuyruğu' anlamında adil; ama kısa işler uzun işlerin arkasında uzun süre bekleyebilir.",
    ],
    sideTitle: "Şemayı okumak",
    notes: "Tahtada bir satırı birlikte hesaplayın: P3 t = 4'te gelir, 11'de başlar, 12'de biter. Dönüş 12 − 4 = 8, bekleme 8 − 1 = 7, yanıt 11 − 4 = 7. Kesintisiz her algoritmada bekleme = yanıt olur, çünkü süreç tek parça hâlinde çalışır. Ortalama bekleme 4,75 ms.",
  });

  // 7 ── Konvoy etkisi
  s = d.content({ kicker: "FCFS", title: "Konvoy Etkisi: Sıra Önemlidir", lead: "Patlamaları 24, 3 ve 3 ms olan üç iş t = 0'da geliyor. Aynı işler, aynı algoritma, iki farklı varış sırası." });
  {
    const segsA = R.convoy_long_first.segs, segsB = R.convoy_short_first.segs;
    const cw = 7.4;
    d.text(s, "A sırası: uzun iş tesadüfen önde", { x: MX, y: 2.25, w: cw, h: 0.35, fontSize: 15, bold: true, color: C.red });
    gantt(s, MX, 2.65, cw, segsA, { T: 30 });
    d.text(s, "B sırası: kısa işler tesadüfen önde", { x: MX, y: 4.1, w: cw, h: 0.35, fontSize: 15, bold: true, color: C.mintDeep });
    gantt(s, MX, 4.5, cw, segsB, { T: 30 });
    d.code(s, MX + 7.75, 2.25, 4.4, 2.95,
`Bekleme süreleri (ms)
A: P1 = 0, P2 = 24, P3 = 27
   ortalama = 51 / 3 = ${fmtPt(R.convoy_long_first.avg.waiting)}

B: P2 = 0, P3 = 3, P1 = 6
   ortalama =  9 / 3 = ${fmtPt(R.convoy_short_first.avg.waiting)}`, 14);
  }
  d.callout(s, MX + 7.75, 5.45, 4.4, 1.4, "Konvoy etkisi (convoy effect): kısa (G/Ç ağırlıklı) süreçler, yavaş bir kamyonun arkasındaki arabalar gibi tek bir uzun süreci bekler.", 13.5);
  d.text(s, "FCFS'de ortalama bekleme süresi tamamen şansa, yani işlerin tesadüfen hangi sırayla geldiğine bağlıdır.", { x: MX, y: 5.75, w: 7.2, h: 0.8, fontSize: 15, italic: true, color: C.slate });
  s.addNotes("Ders kitabındaki klasik örnek (Silberschatz). B sırasını göstermeden önce sınıfa sorun: İşleri değiştirmeden daha iyisini yapabilir miyiz? Yalnızca sırayı değiştirerek ortalama bekleme 17 ms'den 3 ms'ye düşüyor. Bu, sonraki slaytlardaki SJF'ye geçişi hazırlar.");

  // 8 ── SJF
  algoSlide({
    kicker: "Algoritma 2", title: "En Kısa İş Önce (SJF), Kesintisiz",
    lead: "İşlemci boşaldığında, bir sonraki CPU patlaması en kısa olan hazır süreci seç. Başlayan iş sonuna kadar çalışır.",
    key: "SJF",
    side: [
      "t = 0: yalnızca P1 hazır → P1 7'ye kadar çalışır.",
      "t = 7: P2 (4), P3 (1), P4 (4) bekliyor → en kısası P3.",
      "t = 8: P2 ile P4 4'te eşit → P2 önce gelmişti.",
      "Ortalama bekleme 4,75 (FCFS) → 4 ms.",
    ],
    notes: "Kesintisiz SJF'nin zayıflığına dikkat çekin: P1, başka kimse olmadığı için t = 0'da başladı ve sonra kısa P3'ü bir süre bekletti. Sonraki slayttaki kesintili sürüm bunu düzeltir.",
  });

  // 9 ── SRTF
  algoSlide({
    kicker: "Algoritma 2b", title: "Kesintili SJF: En Kısa Kalan Süre Önce (SRTF)",
    lead: "Yeni bir süreç geldiğinde, onun patlamasını çalışan sürecin kalan süresiyle karşılaştır. Kısa olan işlemciyi alır.",
    key: "SRTF",
    side: [
      "t = 2: P2'ye 4 gerekir < P1'in kalan 5'i → P1 kesilir.",
      "t = 4: P3'e 1 gerekir < P2'nin kalan 2'si → P2 kesilir.",
      "t = 5: P2 (2) < P4 (4) < P1 (5) → önce P2, sonra P4, sonra P1.",
      "Ortalama bekleme: 3 ms — günün en iyisi.",
    ],
    sideTitle: "Her varışta verilen karar",
    sideSize: 14,
    notes: "Her varış anını tek tek izleyin. P1 iki parçaya bölünür: 0–2 ve 11–16. Bekleme süresi 16 − 0 − 7 = 9 ms ile en büyüğüdür: kısa işlerin hızının bedelini uzun işler öder. Ortalama yanıt süresi yalnızca 0,5 ms'dir, çünkü üç süreç geldiği anda başlar.",
  });

  // 10 ── SJF neden en iyisi
  s = d.content({ kicker: "SJF", title: "En Kısa İş Önce, Ortalama Beklemeyi Neden En Aza İndirir?", titleSize: 28, lead: "Bir yer değiştirme argümanı: planda art arda gelen iki işe bakın; uzun bir L, kısa bir S'den önce olsun." });
  {
    const y = 2.4, k = 0.42;
    d.text(s, "Önce uzun", { x: MX, y: y + 0.12, w: 1.6, h: 0.4, fontSize: 14, bold: true, color: C.red });
    d.box(s, MX + 1.7, y, 6 * k, 0.6, "L = 6", { fill: C.charcoal, size: 13 });
    d.box(s, MX + 1.7 + 6 * k + 0.02, y, 2 * k, 0.6, "S = 2", { fill: C.amber, size: 12 });
    d.text(s, "S 6 bekler", { x: MX + 1.7 + 8 * k + 0.2, y: y + 0.12, w: 2.0, h: 0.4, fontSize: 14, color: C.red });
    d.text(s, "Önce kısa", { x: MX, y: y + 1.02, w: 1.6, h: 0.4, fontSize: 14, bold: true, color: C.mintDeep });
    d.box(s, MX + 1.7, y + 0.9, 2 * k, 0.6, "S = 2", { fill: C.amber, size: 12 });
    d.box(s, MX + 1.7 + 2 * k + 0.02, y + 0.9, 6 * k, 0.6, "L = 6", { fill: C.charcoal, size: 13 });
    d.text(s, "L 2 bekler", { x: MX + 1.7 + 8 * k + 0.2, y: y + 1.02, w: 2.0, h: 0.4, fontSize: 14, color: C.mintDeep });
    d.card(s, MX, 4.25, 6.9, 2.6, { title: "Argüman", body: [
      "Çiftin yerini değiştirmek, öncesindeki ve sonrasındaki işler için hiçbir şeyi değiştirmez.",
      "Çiftin içinde toplam bekleme L'den S'ye düşer.",
      "Uzun işin kısadan önce geldiği her plan iyileştirilebilir → patlama uzunluğuna göre sıralamak en iyisidir.",
    ], bodySize: 14 });
  }
  d.card(s, MX + 7.2, 2.4, 4.95, 2.35, { title: "İki kesin ifade", body: [
    { b: "SJF,", t: " tüm işler aynı anda hazırsa en iyisidir (optimal)." },
    { b: "SRTF,", t: " işler farklı zamanlarda geliyorsa en iyisidir (bağlam değişimi maliyeti yok sayılırsa)." },
  ], bodySize: 14 });
  d.callout(s, MX + 7.2, 5.0, 4.95, 1.85, "Püf noktası: zamanlayıcının bir sonraki CPU patlamasının uzunluğunu, süreç çalışmadan önce bilmesi gerekir.", 15);
  s.addNotes("Bu, öğrencilerin izleyebileceği bir ispattır. Konvoy örneğinde B sırası tam olarak en kısa önce sırasıdır ve 3 ms vermişti. Bizim iş kümemizde SRTF (3 ms) kesintisiz SJF'yi (4 ms) geçer, çünkü işler farklı zamanlarda gelir. Sonra püf noktasını sorun: İşletim sistemine bir sonraki patlamanın ne kadar süreceğini kimse söylemez.");

  // 11 ── Üstel ortalama
  s = d.content({ kicker: "Uygulamada SJF", title: "Bir Sonraki CPU Patlamasını Tahmin Etmek", lead: "İşletim sistemi geleceği bilemez, ama geçmişten tahmin yürütebilir: son patlamalar bir sonrakinin iyi göstergeleridir." });
  {
    const tx = MX, tw = 6.3;
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: tx, y: 2.3, w: tw, h: 1.0, fill: { color: C.charcoal }, rectRadius: 0.06, line: { type: "none" } });
    d.text(s, "τₙ₊₁  =  α · tₙ  +  (1 − α) · τₙ", { x: tx, y: 2.3, w: tw, h: 1.0, align: "center", valign: "middle", fontSize: 28, color: C.white, fontFace: F.body });
    d.card(s, tx, 3.5, tw, 1.6, { body: [
      { b: "t", t: "ₙ = n'inci patlamanın gerçek uzunluğu;  τₙ = onun için yapılmış tahmin." },
      { b: "α", t: " (0 ≤ α ≤ 1) yakın geçmişin ağırlığı. Yaygın seçim: α = 1/2." },
    ], bodySize: 14 });
    d.code(s, tx, 5.3, tw, 1.55,
`Bir adım; α = 1/2, τ0 = 10 ms, t0 = 6 ms:
  τ1 = 0.5 · 6 + 0.5 · 10 = 8 ms
  τ2 = 0.5 · 4 + 0.5 ·  8 = 6 ms     (t1 = 4)`, 13.5);
    const e = R.expavg;
    s.addChart(P.charts.LINE, [
      { name: "gerçek patlama t", labels: e.bursts.map((_, i) => String(i)), values: e.bursts },
      { name: "tahmin τ", labels: e.bursts.map((_, i) => String(i)), values: e.taus.slice(0, e.bursts.length) },
    ], {
      x: MX + 6.6, y: 2.3, w: 5.55, h: 4.55, chartColors: [C.charcoal, C.mint], lineSize: 2.5, lineDataSymbol: "circle", lineDataSymbolSize: 8,
      showLegend: true, legendPos: "b", legendFontSize: 12, legendFontFace: F.body,
      showTitle: true, title: "Patlama uzunluğu (ms) ve patlama numarası n", titleFontSize: 14, titleFontFace: F.body, titleColor: C.charcoal,
      catAxisLabelFontSize: 12, valAxisLabelFontSize: 12, catAxisLabelColor: C.mutedOnLight, valAxisLabelColor: C.mutedOnLight,
      valAxisMinVal: 0, valAxisMaxVal: 14, valAxisMajorUnit: 2, valGridLine: { color: "E3E7E8", size: 0.5 }, catGridLine: { style: "none" },
      showCatAxisTitle: true, catAxisTitle: "n", catAxisTitleFontSize: 12, catAxisTitleColor: C.mutedOnLight,
    });
  }
  s.addNotes("Formülü bir kez açın: tau_{n+1} = a t_n + (1-a) a t_{n-1} + (1-a)^2 a t_{n-2} + ... — eski patlamaların ağırlığı giderek (üstel olarak) azalır. alfa = 0 şimdiki durumu yok sayar; alfa = 1 yalnızca son patlamaya güvenir. Grafikte patlamalar 6, 4, 6, 4, 13, 13, 13: tahmin 13'e sıçramayı gecikmeli izler (5 → 9 → 11, sonra 12); yumuşatmanın bedeli budur. Tüm değerler sched_check.py'den.");

  // 12 ── Öncelikli zamanlama
  s = d.content({ kicker: "Algoritma 3", title: "Öncelikli Zamanlama (Priority Scheduling)", lead: "Her sürecin bir öncelik numarası vardır; işlemci en yüksek öncelikli sürece (burada: en küçük numara) gider. SJF, öncelik = patlama uzunluğu olan özel durumdur." });
  {
    gantt(s, MX, 2.35, 7.6, R.PRIO_NP.segs, { T: 16, label: "Kesintisiz", labelW: 1.95, size: 12 });
    gantt(s, MX, 3.6, 7.6, R.PRIO_P.segs, { T: 16, label: "Kesintili", labelW: 1.95, size: 12 });
    const np = R.PRIO_NP.per, pp = R.PRIO_P.per;
    const hdr = ["Süreç", "Öncelik", "Bekleme (kesintisiz)", "Bekleme (kesintili)"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 13, align: "center" } }));
    const rows = Object.keys(np).map((p, i) => [p, String(np[p].priority), String(np[p].waiting), String(pp[p].waiting)].map((t, j) => ({ text: t, options: { color: BODY, bold: j === 0, fill: { color: i % 2 ? C.white : C.light }, fontFace: F.body, fontSize: 13, align: "center" } })));
    const avg = ["Ortalama", "", fmt(R.PRIO_NP.avg.waiting), fmt(R.PRIO_P.avg.waiting)].map(t => ({ text: t, options: { color: C.mintDeep, bold: true, fill: { color: "D7E9E6" }, fontFace: F.body, fontSize: 13, align: "center" } }));
    s.addTable([hdr, ...rows, avg], { x: MX, y: 4.75, w: 7.6, colW: [1.25, 1.15, 2.6, 2.6], rowH: 0.3, border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [2, 4, 2, 4], valign: "middle" });
  }
  d.card(s, MX + 7.9, 2.35, 4.25, 4.5, { title: "Dikkat edilecekler", body: [
    "Kesintili: P2 (öncelik 1), t = 2'de gelir gelmez işlemciyi P1'den alır.",
    "P3'ün önceliği en düşüktür (4): iki sürümde de 11 ms bekler ve en son çalışır.",
    "Öncelikler iç (bellek ihtiyacı, patlama uzunluğu) ya da dış (önem, kimin ödediği) kaynaklı olabilir.",
  ], bodySize: 14 });
  s.addNotes("Kesintili izleme: t=2'de P2 (1), P1'i (3) yener ve 2–6 arasında çalışır; 5'te gelen P4 (2) 6–10 arasında çalışır; sonra P1 (3) 10–15; en son P3 (4) 15–16. Mağdur P3'tür. Şimdi yüksek öncelikli işlerin sonsuza kadar gelmeye devam ettiğini düşünün: P3 hiç çalışamaz. Bu, sonraki slaydın konusu.");

  // 13 ── Açlık ve yaşlandırma
  s = compare2({
    kicker: "Öncelikli zamanlama", title: "Açlık ve Çaresi: Yaşlandırma",
    lead: "Yoğun bir sistemde düşük öncelikli bir süreç süresiz bekleyebilir; aç kalır (starvation).",
    left: { title: "Sorun: açlık", color: C.red, items: [
      "Daha yüksek öncelikli süreçlerin kesintisiz akışı işlemciyi meşgul tutar.",
      "Düşük öncelikli süreç hep hazırdır, ama hiç çalışmaz.",
      "Anlatılan bir hikâye: MIT 1973'te IBM 7094'ünü kapattığında, 1967'de gönderilmiş ve hiç çalışmamış düşük öncelikli bir iş bulmuş.",
    ] },
    right: { title: "Çare: yaşlandırma (aging)", items: [
      "Bir süreç ne kadar uzun beklerse önceliğini o kadar yükselt.",
      "Örnek: öncelikler 127 (düşük) … 0 (yüksek); her saniyelik bekleme önceliği 1 artırır.",
      "En düşük öncelikli süreç bile en geç 127 s = 2 dk 7 s sonra 0 önceliğine ulaşır.",
    ] },
    callout: "Yaşlandırma 'belki hiçbir zaman'ı 'sınırlı bir süre içinde'ye çevirir. Aynı fikir 2. bölümde sınırlı bekleme olarak yeniden karşımıza çıkacak.",
    bodySize: 15.5,
  });
  s.addNotes("7094 anekdotu Silberschatz'da bir söylenti olarak aktarılır; bir halk hikâyesi olarak sunun. Yaşlandırma hesabı: her biri 1 s olan 127 adım = 127 s. Sorun: Yaşlandırmanın dezavantajı nedir? (Öncelikler daha az anlamlı hâle gelir; daha fazla kayıt tutmak gerekir.)");

  // 14 ── Döngüsel zamanlama
  s = d.content({ kicker: "Algoritma 4", title: "Döngüsel Zamanlama (Round Robin, RR): Sırayla", lead: "FCFS artı zamanlayıcıyla kesme. Her süreç en çok bir zaman dilimi (quantum) q kadar çalışır, sonra kuyruğun sonuna gider." });
  {
    const y = 2.55;
    d.text(s, "hazır kuyruğu (FIFO)", { x: MX, y: y - 0.05, w: 4, h: 0.3, fontSize: 12, italic: true, color: C.mutedOnLight });
    ["P4", "P3", "P2"].forEach((p, i) => d.box(s, MX + i * 1.15, y + 0.35, 1.0, 0.75, p, { fill: PC[p][0], color: PC[p][1], size: 15 }));
    d.arrow(s, MX + 3.45, y + 0.72, MX + 4.25, y + 0.72, { w: 2 });
    d.box(s, MX + 4.3, y + 0.2, 1.9, 1.05, "CPU", { sub: "P1'i ≤ q çalıştırır", fill: C.mint, color: C.dark, size: 16 });
    // kuyruğun sonuna geri dönüş
    s.addShape(P.shapes.LINE, { x: MX + 5.25, y: y + 1.27, w: 0, h: 0.75, line: { color: C.red, width: 2 } });
    s.addShape(P.shapes.LINE, { x: MX + 0.5, y: y + 2.02, w: 4.75, h: 0, line: { color: C.red, width: 2 } });
    d.arrow(s, MX + 0.5, y + 2.02, MX + 0.5, y + 1.14, { color: C.red, w: 2 });
    d.text(s, "zaman dilimi doldu (zamanlayıcı kesmesi) → kuyruğun sonuna", { x: MX + 0.7, y: y + 2.1, w: 6.2, h: 0.35, fontSize: 13, color: C.red, bold: true });
    d.arrow(s, MX + 6.25, y + 0.72, MX + 7.0, y + 0.72, { w: 2 });
    d.text(s, "bitti ya da\nG/Ç için bloklandı", { x: MX + 7.05, y: y + 0.4, w: 1.6, h: 0.7, fontSize: 13, color: C.slate });
  }
  d.card(s, MX, 5.35, 8.4, 1.5, { body: [
    "Kuyrukta n süreç varsa hiçbir süreç bir sonraki sırasından önce (n − 1) · q'dan fazla beklemez.",
    "Tipik zaman dilimleri: 10–100 ms; bir bağlam değişimi 10 µs'nin çok altında sürer.",
  ], bodySize: 14 });
  d.card(s, MX + 8.7, 2.45, 3.45, 4.4, { title: "Bizim kuralımız", body: [
    "Bir zaman dilimi tam bittiği anda gelen süreç, kesilen süreçten önce kuyruğa girer.",
    "Patlama q'dan kısaysa süreç erken ayrılır ve sıradaki hemen başlar.",
  ], bodySize: 14 });
  s.addNotes("Döngüsel zamanlama, zaman paylaşımının (1. hafta) temelidir. İyi yanıt süresini sağlayan şey (n-1)q sınırıdır. Eşzamanlı olaylar için kuralımıza dikkat çekin: ders kitapları bu konuda farklıdır; bizimki Silberschatz'ı izler. Farklı kurallar biraz farklı Gantt şemaları verebilir; sınav yanıtında kuralınızı her zaman belirtin.");

  // 15 ── RR q=4
  algoSlide({
    kicker: "Döngüsel zamanlama", title: "Çözümlü Örnek: q = 4 ms ile Döngüsel Zamanlama",
    lead: "Aynı dört süreç. Her zaman diliminden sonra hazır kuyruğunu izleyin (baş solda).",
    key: "RR4",
    side: [
      "t = 4: kuyruk P2, P3, P1 (P2 ve P3 geldi, P1 sona döndü).",
      "t = 8: P2 bitti; kuyruk P3, P1, P4.",
      "t = 9: P3 1 ms sonra bitti; P1'e yalnızca 3 ms daha gerek.",
      "t = 12: P1 bitti; P4 16'ya kadar tek başına çalışır.",
    ],
    sideTitle: "Hazır kuyruğu",
    notes: "İlerledikçe kuyruğu tahtaya çizin. Ortalama bekleme 4,5 ms (SJF'den kötü), ama ortalama yanıt 3,25 ms. 4 bağlam değişimi. P4'ün 7 ms beklediğine dikkat edin: P1 kuyruğa yeniden katıldıktan hemen sonra gelmişti.",
  });

  // 16 ── RR q=2
  algoSlide({
    kicker: "Döngüsel zamanlama", title: "Aynı İşler, Daha Küçük Zaman Dilimi: q = 2 ms",
    lead: "Daha kısa sıralar: herkes işlemciye daha erken kavuşur, ama işlemci çok daha sık geçiş yapar.",
    key: "RR2",
    side: [
      "Yanıt süresi düşer: ortalama 3,25 → 1,5 ms.",
      "Bekleme süresi artar: ortalama 4,5 → 5 ms.",
      "Bağlam değişimleri: 4 → 8.",
      "P1 dört parçaya bölünür ve t = 16'da en son biter.",
    ],
    sideTitle: "q = 4 ile karşılaştırma",
    notes: "Tahta için kuyruk izlemesi: t=2 [P2,P1]; t=4 [P1,P3,P2]; t=6 [P3,P2,P4,P1]; P3 7'de biter; P2 9'da biter; [P4,P1]; ... Daha küçük zaman dilimi sistemi daha duyarlı hissettirir, ama gerçek geçiş maliyetleriyle daha çok işlemci zamanı harcar — sonraki slayt.",
  });

  // 17 ── q seçimi
  s = d.content({ kicker: "Döngüsel zamanlama", title: "Zaman Dilimini Seçmek" });
  {
    const qs = [["1", "RR1"], ["2", "RR2"], ["4", "RR4"], ["8", "RR8"]];
    const hdr = ["Zaman dilimi q", "Ort. bekleme", "Ort. yanıt", "Geçiş"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 14, align: "center" } }));
    const rows = qs.map(([q, k], i) => [q + " ms", fmt(R[k].avg.waiting), fmt(R[k].avg.response), String(R[k].switches)].map((t, j) => ({ text: t, options: { color: BODY, bold: j === 0, fill: { color: i % 2 ? C.white : C.light }, fontFace: F.body, fontSize: 14, align: "center" } })));
    s.addTable([hdr, ...rows], { x: MX, y: 1.7, w: 6.3, colW: [1.85, 1.6, 1.5, 1.35], rowH: 0.42, border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [3, 5, 3, 5], valign: "middle" });
    d.text(s, "Bizim iş kümemiz, sched_check.py'den. q = 8 her patlamadan büyük ya da eşit olduğundan, RR tam olarak FCFS planını verir.", { x: MX, y: 3.95, w: 6.3, h: 0.6, fontSize: 13, italic: true, color: C.mutedOnLight });
    const ov = R.extras.rr_overhead;
    d.code(s, MX, 4.7, 6.3, 2.15,
`Geçişe giden zaman = s / (q + s)
geçiş maliyeti s = 0.1 ms ile:
  q =   1 ms  ->  ${(100 * ov["1"]).toFixed(1)} %
  q =   4 ms  ->  ${(100 * ov["4"]).toFixed(1)} %
  q =  10 ms  ->  ${(100 * ov["10"]).toFixed(1)} %
  q = 100 ms  ->  ${(100 * ov["100"]).toFixed(1)} %`, 13);
  }
  d.card(s, MX + 6.6, 1.7, 5.55, 1.55, { title: "q çok büyükse", titleColor: C.red, body: "RR, FCFS'ye dönüşür: etkileşimli kullanıcılar uzun işlerin arkasında bekler.", bodySize: 14 });
  d.card(s, MX + 6.6, 3.45, 5.55, 1.55, { title: "q çok küçükse", titleColor: C.red, body: "İşlemci zamanının büyük bir kısmı iş yapmaya değil, geçiş yapmaya gider.", bodySize: 14 });
  d.callout(s, MX + 6.6, 5.2, 5.55, 1.65, "Pratik kural: q'yu, CPU patlamalarının yaklaşık %80'i tek bir zaman dilimi içinde bitecek biçimde seçin; q, geçiş süresinden çok daha büyük olmalıdır.", 14);
  s.addNotes("Ek yük formülü: her q kadar yararlı iş, bir s geçişine mal olur; bu yüzden boşa giden pay s/(q+s)'dir. s = 0,1 ms, etkiyi görünür kılmak için bilerek kötümser seçildi; gerçek geçişler birkaç mikrosaniye sürer, artı soğuk önbelleklerin dolaylı maliyeti vardır. Tablodaki ödünleşimi gösterin: q küçüldükçe yanıt iyileşir, geçiş sayısı patlar.");

  // 18 ── Çok düzeyli kuyruklar (genel bakış)
  s = d.content({ kicker: "Genel bakış", title: "Çok Düzeyli Kuyruklar ve Çok Düzeyli Geri Beslemeli Kuyruklar", titleSize: 26, lead: "Gerçek sistemler algoritmaları birleştirir: her birinin kendi politikası olan birkaç hazır kuyruğu." });
  {
    const x = MX, y = 2.3, w = 6.9;
    const qs = [["Kuyruk 0", "RR, q = 8 ms", "en yüksek öncelik", C.mint, C.dark], ["Kuyruk 1", "RR, q = 16 ms", "", C.slate, C.white], ["Kuyruk 2", "FCFS", "en düşük öncelik", C.charcoal, C.white]];
    qs.forEach((q, i) => {
      const yy = y + i * 1.3;
      d.box(s, x, yy, 1.5, 0.8, q[0], { fill: q[3], color: q[4], size: 14 });
      s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: x + 1.65, y: yy, w: 3.2, h: 0.8, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
      d.text(s, q[1], { x: x + 1.65, y: yy, w: 3.2, h: 0.8, fontSize: 15, bold: true, color: C.charcoal, align: "center", valign: "middle" });
      if (q[2]) d.text(s, q[2], { x: x + 5.0, y: yy + 0.2, w: 1.9, h: 0.4, fontSize: 12, italic: true, color: C.mutedOnLight });
      if (i < 2) d.arrow(s, x + 3.25, yy + 0.82, x + 3.25, yy + 1.28, { color: C.red, w: 2 });
    });
    d.text(s, "dilimin tamamını kullanırsa → bir alta iner", { x: x + 3.4, y: y + 0.85, w: 3.5, h: 0.4, fontSize: 12, color: C.red, bold: true });
    d.text(s, "Yeni bir süreç Kuyruk 0'a girer. Kısa, etkileşimli işler orada biter; uzun, CPU ağırlıklı işler dibe çöker.", { x, y: y + 3.85, w, h: 0.7, fontSize: 13, italic: true, color: C.slate });
  }
  d.card(s, MX + 7.2, 2.3, 4.95, 4.55, { title: "İki türü", body: [
    { b: "Çok düzeyli kuyruk:", t: " süreç kalıcı olarak tek bir kuyruğa atanır (ör. ön plan = RR, arka plan = FCFS)." },
    { b: "Çok düzeyli geri beslemeli kuyruk (MLFQ):", t: " süreçler davranışlarına göre kuyruklar arasında yer değiştirir; çok uzun bekleyen yukarı çıkar (yaşlandırma)." },
    "En genel çözüm, ama ayarlaması en zor olanı.",
  ], bodySize: 14 });
  s.addNotes("Yalnızca genel bakış; ayrıntısıyla sınav konusu değil. Örnek, Silberschatz'daki üç kuyruklu MLFQ'dur. Ana fikir: MLFQ, patlama uzunluklarını bilmeden, sürecin bir önceki davranışını gözleyerek SJF'ye yaklaşır.");

  // 19 ── Linux
  s = d.content({ kicker: "Genel bakış", title: "Linux Gerçekte Ne Yapıyor?", lead: "Linux sabit bir zaman dilimi kullanmaz. Çalışmaya hazır her göreve işlemciden adil bir pay vermeye çalışır." });
  d.card(s, MX, 2.3, 6.3, 4.55, { title: "Adil zamanlama", body: [
    { b: "CFS", t: " (Completely Fair Scheduler, 2007–2023): şimdiye kadar en az ağırlıklı işlemci zamanı almış görevi çalıştır." },
    { b: "EEVDF", t: " (çekirdek 6.6'dan beri, 2023): aynı adalet hedefi, artı gecikmeye duyarlı görevler daha erken çalışsın diye sanal son tarihler." },
    { b: "nice değerleri", t: " −20 (en çok işlemci) … +19 (en az). Her adım ağırlığı yaklaşık 1,25 kat değiştirir." },
    { b: "Gerçek zamanlı sınıflar", t: " SCHED_FIFO ve SCHED_RR her zaman normal görevlerden önce çalışır." },
  ], bodySize: 14 });
  d.code(s, MX + 6.6, 2.3, 5.55, 2.65, code("nice_output.txt").replace(/^\$ sleep 10; /m, "$ sleep 10\n$ "), 12);
  const ns = R.extras.nice_share;
  d.callout(s, MX + 6.6, 5.2, 5.55, 1.65, `TEK işlemcide iki sonsuz döngü. Ağırlıklar 1024 (nice 0) ve 110 (nice 10): beklenen ${pct(ns[0])} : ${pct(ns[1])}. 6.18 çekirdeğimizde ölçülen: %88,0 : %9,4.`, 13.5);
  s.addNotes("Derleme konteynerimizde yapılmış gerçek bir ölçüm (code/cpu_hog.c, EEVDF'li 6.18 çekirdeği). 88,0/9,4 = 9,4 oranı, beklenen 1024/110 = 9,3 oranına çok yakındır; ikisinin toplamı %100 etmez, çünkü ps her sürecin başladığı andan beri olan ortalamayı bildirir. CLS TS = 'time sharing' (zaman paylaşımı), yani normal adil sınıf. Öğrenciler bunu 13. haftada (süreçler ve iş denetimi) tekrarlayabilir.");

  // 20 ── Karşılaştırma
  {
    const rowsDef = [["FCFS", "FCFS", "hayır"], ["SJF", "SJF", "hayır"], ["SRTF", "SRTF", "evet"], ["Öncelik (KS)", "PRIO_NP", "hayır"], ["Öncelik (K)", "PRIO_P", "evet"], ["RR, q = 4", "RR4", "evet"], ["RR, q = 2", "RR2", "evet"]];
    s = d.tableSlide({
      kicker: "1. bölümün özeti", title: "Aynı İşler, Yedi Plan",
      header: ["Algoritma", "Kesintili mi?", "Ort. bekleme (ms)", "Ort. dönüş (ms)", "Ort. yanıt (ms)", "Geçiş"],
      colW: [2.1, 1.85, 2.3, 2.2, 2.15, 1.55],
      rows: rowsDef.map(([n, k, pre]) => [n, pre, fmt(R[k].avg.waiting), fmt(R[k].avg.turnaround), fmt(R[k].avg.response), String(R[k].switches)]),
      fontSize: 16,
      callout: "SRTF burada her sütunu kazanır — ama geleceği bilmesi gerekir. RR hiçbir bilgi istemez ve her beklemeyi (n − 1) · q ile sınırlar. FCFS en basitidir. Öncelik ortalamalara değil, öneme hizmet eder. (KS = kesintisiz, K = kesintili)",
    });
    s.addNotes("Tüm değerler sched_check.py ile hesaplandı. Öğrencilere hatırlatın: bunlar TEK bir küçük iş kümesinin ortalamalarıdır; başka bir iş kümesi tablonun ortasının sırasını değiştirebilir, ama SRTF her zaman en küçük ortalama bekleme süresini verir (geçiş maliyeti sıfırken). Sorun: Bir masaüstü bilgisayar için hangi algoritmayı seçerdiniz? Bir toplu iş sunucusu için? Bir arabanın fren denetleyicisi için (hiçbiri — gerçek zamanlı zamanlama)?");
  }

  // 21 ── Ara
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Ara", subtitle: "Sırada: iki iş parçacığı tek bir değişkeni paylaştığında neyin ters gittiği." });
  s.addNotes("On dakika. İsteğe bağlı: ara sırasında karşılaştırma tablosunu ekranda bırakın.");

  // ───────────────────────── BÖLÜM 2: EŞZAMANLAMA
  s = d.sectionSlide({ kicker: "Bölüm 2", title: "Süreç Eşzamanlaması", subtitle: "Zamanlayıcı iş parçacıklarını herhangi bir komutta değiştirebilir. Ya veri paylaşıyorlarsa?" });
  s.addNotes("Köprü: 1. bölümde zamanlayıcı süreçleri istediği an kesiyordu. Bağımsız süreçler için bu zararsızdır, ama bir sürecin iş parçacıkları belleği paylaşır (4. hafta).");

  // 23 ── counter++ üç komuttur
  s = d.content({ kicker: "Sorun", title: "counter++ Tek Bir Adım Değildir", lead: "Tek satır C kodu üç makine komutuna dönüşür. Bu, race.c için gcc -O2 -S komutunun gerçek çıktısıdır (x86-64)." });
  d.code(s, MX, 2.3, 6.3, 2.0,
`counter++;          // C kaynak kodu

movq  counter(%rip), %rax   # 1. OKU (LOAD)
addq  $1, %rax              # 2. 1 EKLE (ADD)
movq  %rax, counter(%rip)   # 3. YAZ (STORE)`, 13);
  d.card(s, MX, 4.55, 6.3, 2.3, { title: "Her iş parçacığının kendi yazmaçları vardır", body: [
    "counter ortak bellekte durur; %rax her iş parçacığına özeldir (geçişte iş parçacığı denetim bloğuna kaydedilir).",
    "Bir geçiş — ya da başka bir işlemci — üç adımın herhangi ikisi arasına girebilir.",
  ], bodySize: 14 });
  {
    const x = MX + 6.6, y = 2.3;
    d.box(s, x + 1.4, y, 2.7, 0.9, "counter", { sub: "ortak bellek", fill: C.mint, color: C.dark, size: 16 });
    d.box(s, x, y + 2.3, 2.3, 0.9, "İş parçacığı A", { sub: "%rax yazmacı", fill: C.charcoal, size: 15 });
    d.box(s, x + 3.25, y + 2.3, 2.3, 0.9, "İş parçacığı B", { sub: "%rax yazmacı", fill: C.slate, size: 15 });
    d.arrow(s, x + 1.15, y + 2.28, x + 2.0, y + 0.93, { w: 2, both: true });
    d.arrow(s, x + 4.4, y + 2.28, x + 3.5, y + 0.93, { w: 2, both: true });
    d.text(s, "oku / yaz", { x: x, y: y + 1.35, w: 1.4, h: 0.35, fontSize: 12, color: C.slate, italic: true });
    d.text(s, "oku / yaz", { x: x + 4.15, y: y + 1.35, w: 1.4, h: 0.35, fontSize: 12, color: C.slate, italic: true, align: "right" });
    d.callout(s, x, y + 3.55, 5.55, 1.0, "İki iş parçacığı, tek değişken, pek çok farklı sırayla iç içe geçebilen altı komut.", 14);
  }
  s.addNotes("Bu gerçek derleyici çıktısıdır (gcc 13, -O2, x86-64); değişken volatile olduğu için derleyici her seferinde okuyup yazmak zorundadır. Bir RISC işlemcide (ARM) ldr / add / str olurdu — aynı üç adım.");

  // 24 ── İç içe geçme tablosu
  s = d.tableSlide({
    kicker: "Kayıp bir güncelleme", title: "Şanssız Bir İç İçe Geçme",
    lead: "counter 5 ile başlıyor. A ve B iş parçacıkları counter++ işlemini birer kez yürütüyor. Doğru sonuç: 7.",
    header: ["Adım", "İş parçacığı A", "İş parçacığı B", "A'nın %rax'ı", "B'nin %rax'ı", "counter (bellek)"],
    colW: [0.95, 2.55, 2.55, 1.8, 1.8, 2.5],
    rows: [
      ["1", "counter'ı oku", "", "5", "–", "5"],
      ["2", "", "counter'ı oku", "5", "5", "5"],
      ["3", "1 ekle", "", "6", "5", "5"],
      ["4", "", "1 ekle", "6", "6", "5"],
      ["5", "yaz", "", "6", "6", "6"],
      ["6", "", "yaz", "6", "6", "6  ✗ (7 olmalıydı)"],
    ],
    fontSize: 14,
    callout: "B'nin yazması A'nınkinin üstüne yazar: bir artırma kaybolur. İki işlemcide 10 milyon kez çalıştırın, milyonlarcası kaybolur — birazdan canlı göreceğiz.",
  });
  s.addNotes("Bunu iki öğrenci ve tahtadaki bir sayıyla canlandırın: her biri sayıyı defterine kopyalar (oku), bir ekler (ekle) ve geri yazar (yaz). İkisi de geri yazmadan önce kopyalarsa bir güncelleme kaybolur. Başka iç içe geçmeler 7 verir: sonuç zamanlamaya bağlıdır; bu tür hataları yeniden üretmeyi bu kadar zorlaştıran da budur.");

  // 25 ── Yarış durumu tanımı
  s = d.cardsSlide({
    kicker: "Tanım", title: "Yarış Durumu (Race Condition)",
    lead: "Birden çok iş parçacığı aynı veriye eşzamanlı erişir, en az biri yazar ve sonuç yürütmenin tam sırasına bağlıdır.",
    cards: [
      { title: "Banka hesabı", body: "İki ATM aynı anda aynı hesaptan para çeker; ikisi de eski bakiyeyi okur ve bir çekim kaybolur." },
      { title: "Uçaktaki son koltuk", body: "İki rezervasyon sunucusu da '1 koltuk kaldı' görür ve ikisi de onu satar." },
      { title: "Çekirdeğin içinde", body: "İki süreç aynı anda fork() çağırır; önlem alınmazsa ikisi de aynı yeni süreç kimliğini alabilir." },
    ],
    bodySize: 16,
    callout: "Yarış durumları zamanlama hatalarıdır: program bin testi geçip bir sonraki çalıştırmada çökebilir. Test ederek değil, tasarımla önleyin.",
  });
  s.addNotes("Çekirdek örneği Silberschatz'dandır: next_available_pid değişkeni. Vurgulayın: yalnızca yazılan ortak veri yarışabilir; salt okunur paylaşım güvenlidir.");

  // 26 ── Kritik bölge yapısı
  s = d.content({ kicker: "Kritik bölge problemi", title: "Kritik Bölgeler", lead: "Kritik bölge (critical section), bir iş parçacığının ortak veriye eriştiği koddur. İş parçacıkları onu asla aynı anda yürütmesin diye bir protokol tasarlayın." });
  {
    const x = MX, y = 2.35, w = 5.8;
    const parts = [["giriş bölümü", "izin iste", C.mint, C.dark], ["kritik bölge", "ortak veriye dokun", C.charcoal, C.white], ["çıkış bölümü", "duyur: işim bitti", C.mint, C.dark], ["kalan bölüm", "geri kalan her şey", C.light, C.charcoal]];
    parts.forEach((p, i) => d.box(s, x + 0.6, y + i * 1.08, w - 0.6, 0.85, p[0], { sub: p[1], fill: p[2], color: p[3], size: 16 }));
    s.addShape(P.shapes.LINE, { x: x + 0.25, y: y + 0.42, w: 0, h: 3.24, line: { color: C.slate, width: 2 } });
    s.addShape(P.shapes.LINE, { x: x + 0.25, y: y + 3.66, w: 0.33, h: 0, line: { color: C.slate, width: 2 } });
    d.arrow(s, x + 0.25, y + 0.42, x + 0.57, y + 0.42, { w: 2 });
    d.text(s, "tekrar", { x: x - 0.55, y: y + 1.85, w: 0.75, h: 0.3, fontSize: 12, italic: true, color: C.slate });
  }
  d.code(s, MX + 6.2, 2.35, 5.95, 2.6,
`while (true) {
    /* giriş bölümü     */
        counter++;   // kritik bölge
    /* çıkış bölümü     */
    /* kalan bölüm      */
}`, 14);
  d.callout(s, MX + 6.2, 5.2, 5.95, 1.65, "Tasarlamamız gereken, giriş ve çıkış bölümleridir. Bugün bundan sonraki her şey — Peterson, atomik komutlar, muteksler, semaforlar — onları kurmanın bir yoludur.", 14);
  s.addNotes("Genel yapı Silberschatz'dandır. race.c'de kritik bölge tek bir satırdır: counter++. Gerçek programlarda bir bağlı listenin, bir banka bakiyesinin ya da bir dosyanın güncellenmesi olabilir.");

  // 27 ── Üç gereksinim
  s = d.cardsSlide({
    kicker: "Kritik bölge problemi", title: "Doğru Bir Çözüm için Üç Gereksinim",
    cards: [
      { title: "1. Karşılıklı dışlama", body: ["Herhangi bir anda kritik bölgesinde en çok bir iş parçacığı bulunur.", "Bu, güvenlik özelliğidir: kayıp güncelleme imkânsız hâle gelir."] },
      { title: "2. İlerleme", body: ["Kritik bölge boşsa ve girmek isteyen iş parçacıkları varsa, biri kısa sürede içeri alınmalıdır.", "Kalan bölümündeki iş parçacıklarının veto hakkı yoktur."] },
      { title: "3. Sınırlı bekleme", body: ["Bir iş parçacığı girmek istedikten sonra, diğerleri ondan önce ancak sınırlı sayıda girebilir.", "Açlık yok — 1. bölümdeki yaşlandırmayla karşılaştırın."] },
    ], bodySize: 15.5,
    callout: "Her iş parçacığının sıfırdan büyük bir hızla çalıştığını varsayarız; ama iş parçacıklarının göreli hızları ya da işlemci sayısı hakkında hiçbir varsayım yapmayız.",
  });
  s.addNotes("Her biri için bir karşı örnek verin: 'kimseyi asla içeri alma' karşılıklı dışlamayı sağlar ama ilerlemeyi ihlal eder; 'katı sırayla A, B, A, B' B girmek istemediğinde ilerlemeyi ihlal eder; her zaman A'yı kayıran bir kilit sınırlı beklemeyi ihlal edebilir.");

  // 28 ── Kesmeleri kapatmak
  s = compare2({
    kicker: "İlk fikir", title: "Neden Kesmeleri Kapatmıyoruz?",
    lead: "Tek işlemcide bir iş parçacığı yalnızca bir kesmeyle işlemciden alınır. Kritik bölge boyunca kesme yok → geçiş yok → yarış yok.",
    left: { title: "İşe yaradığı yerler", items: [
      "Tek işlemcili bir sistemde, çekirdeğin içinde.",
      "Çok kısa kritik bölgeler (birkaç komut).",
      "Erken UNIX çekirdekleri ve küçük gömülü sistemler bunu kullandı.",
    ] },
    right: { title: "Neden ölçeklenmez?", color: C.red, items: [
      "Çok işlemcili sistemler: diğer işlemciler çalışmayı sürdürür ve veriye yine dokunabilir.",
      "Kesmeleri tüm işlemcilerde kapatmak zaman alır ve bütün makineyi durdurur.",
      "Ayrıcalıklı komut: kullanıcı programları bunu yapamaz (yapmamalıdır da!).",
      "Uzun kritik bölgeler saati ve G/Ç aygıtlarını geciktirir.",
    ] },
    callout: "Modern sistemler bunun yerine atomik donanım komutlarını kullanır — işlemciler arasında çalışırlar ve özel ayrıcalık gerektirmezler.",
    bodySize: 15.5,
  });
  s.addNotes("2. haftaya bağlayın: kesmeleri kapatmak ayrıcalıklı bir komuttur, bu yüzden yalnızca çekirdek modunda kullanılabilir. Linux çok kısa bölümler için kesmeleri yerel olarak hâlâ kapatır, ama çok işlemcili sistemlerde bunu her zaman bir döner kilitle (spinlock) birlikte yapar.");

  // 29 ── Peterson
  s = code2({
    kicker: "Yazılımsal çözüm", title: "Peterson Çözümü (İki İş Parçacığı)",
    code:
`int  turn;          // bekleme sırası kimde?
bool flag[2];       // flag[i]: i girmek istiyor

/* i iş parçacığının kodu; j = 1 - i diğeri */
while (true) {
    flag[i] = true;          // girmek istiyorum ...
    turn = j;                // ... ama önce sen geç
    while (flag[j] && turn == j)
        ;                    // meşgul bekleme
    /* kritik bölge */
    flag[i] = false;         // işim bitti
    /* kalan bölüm */
}`, size: 13, codeW: 7.0, sideTitle: "Neden çalışır?",
    side: [
      "Her iş parçacığı nazikçe sırayı diğerine verir.",
      "İkisi de girmek isterse turn yalnızca tek bir değer tutar — onu en son yazan bekler.",
      "Üç gereksinimi de sağlar (ispatı notlarda).",
      { b: "Ama:", t: " modern işlemciler ve derleyiciler bellek erişimlerinin sırasını değiştirir; bu yüzden bellek bariyerleri olmadan gerçek donanımda başarısız olabilir. Bir fikir olarak öğrenin." },
    ],
    sideSize: 14,
  });
  s.addNotes("Yalnızca kavramsal. İkisinin de bayrağını kaldırdığı durumu izleyin: A turn = B yapar, sonra B turn = A yapar; turn A olarak kalır, bu yüzden B (en son yazan) bekler ve A girer. Gary Peterson, 1981. Bellek yeniden sıralama uyarısı, gerçek sistemlerin donanım komutlarını kullanmasının nedenidir.");

  // 30 ── Test-and-set
  s = code2({
    kicker: "Donanım desteği", title: "Atomik Komutlar: test_and_set",
    code:
`/* donanımın TEK ve bölünmez adımda yaptığı */
bool test_and_set(bool *target) {
    bool old = *target;
    *target = true;
    return old;
}

bool lock = false;            // ortak, false = boş

while (true) {
    while (test_and_set(&lock))
        ;                     // boşalana kadar dön
    /* kritik bölge */
    lock = false;             // bırak
    /* kalan bölüm */
}`, size: 13, codeW: 7.0, sideTitle: "Fikir",
    side: [
      "Eski değeri oku ve true yaz — tek bir atomik adımda: arada başka hiçbir işlemci araya giremez.",
      "false döndü → kilit boştu ve artık benim.",
      "true döndü → kilidi başkası tutuyor; yeniden dene.",
      "Gerçek komutlar: x86'da xchg ve lock cmpxchg (compare-and-swap); ARM'da ldxr/stxr.",
    ],
    sideSize: 14.5,
  });
  s.addNotes("Atomikliği donanım garanti eder (işlemci bu süre boyunca önbellek satırını / veri yolunu kilitler). Bu basit kilit karşılıklı dışlamayı ve ilerlemeyi sağlar; sınırlı bekleme biraz daha fazlasını ister (ör. bir bilet kilidi ya da Silberschatz'daki waiting[] dizisi). C11 bunları atomic_flag_test_and_set ve atomic_compare_exchange olarak sunar.");

  // 31 ── Muteks kilitleri
  s = d.content({ kicker: "Eşzamanlama araçları", title: "Muteks Kilitleri (Mutex Locks)", lead: "Programcılar test_and_set'i doğrudan kullanmaz. İşletim sistemi ve kütüphaneler onu iki işlemli bir kilide sarar." });
  d.code(s, MX, 2.3, 5.6, 4.55,
`acquire(&m);        // boşalana kadar bekle,
                    // sonra al
    /* kritik bölge */
release(&m);        // geri ver

/* POSIX threads (Linux, macOS) */
pthread_mutex_lock(&m);
    counter++;
pthread_mutex_unlock(&m);`, 14);
  d.card(s, MX + 5.9, 2.3, 6.25, 2.15, { title: "Döner kilit (spinlock): meşgul bekleme", body: [
    "Bekleyen iş parçacığı, kilit boşalana kadar işlemci yakarak döngüde döner.",
    "Çok işlemcide çok kısa kritik bölgeler için iyidir: bağlam değişimi gerekmez.",
  ], bodySize: 14 });
  d.card(s, MX + 5.9, 4.7, 6.25, 2.15, { title: "Uyuyan kilit", body: [
    "Bekleyen iş parçacığı bloklanır, işlemci başkasını çalıştırır; release onu uyandırır.",
    "Uzun bölümler için daha iyidir. Linux pthread muteksleri futex kullanır: kilit boşken sistem çağrısı yok.",
  ], bodySize: 14 });
  s.addNotes("Muteks = MUTual EXclusion (karşılıklı dışlama). Silberschatz'ın pratik kuralı: kilit iki bağlam değişiminden daha kısa süre tutulacaksa dönerek bekleyin. Tek işlemcide dönmek anlamsızdır: siz dönerken kilidi tutan iş parçacığı çalışamaz.");

  // 32 ── Semaforlar
  s = d.content({ kicker: "Eşzamanlama araçları", title: "Semaforlar", lead: "Dijkstra (1965): yalnızca iki atomik işlemle değiştirilen bir S tamsayısı." });
  d.code(s, MX, 2.3, 5.6, 3.0,
`wait(S) {          // P() olarak da bilinir
    while (S <= 0)
        ;          // (ya da: bloklan)
    S--;
}
signal(S) {        // V() olarak da bilinir
    S++;           // (+ bekleyeni uyandır)
}`, 14);
  d.text(s, "P ve V, Felemenkçe proberen (sınamak) ve verhogen (artırmak) sözcüklerinden gelir. POSIX'te: sem_wait() ve sem_post().", { x: MX, y: 5.45, w: 5.6, h: 0.8, fontSize: 13, italic: true, color: C.mutedOnLight });
  d.card(s, MX + 5.9, 2.3, 6.25, 2.1, { title: "İkili semafor (0 ya da 1)", body: [
    "1 ile başlarsa: muteks kilidi gibi davranır.",
    "0 ile başlarsa: sıra dayatır — B'deki S2, ancak A S1'in bittiğini bildirdikten sonra çalışır.",
  ], bodySize: 14 });
  d.card(s, MX + 5.9, 4.65, 6.25, 2.2, { title: "Sayan semafor (0 … N)", body: [
    "N = özdeş kaynak sayısıyla başlar, ör. 3 yazıcı.",
    "Her kullanıcı önce bekler (S−−), sonra bildirir (S++); 4. kullanıcı bir yazıcı boşalana kadar bloklanır.",
  ], bodySize: 14 });
  s.addNotes("Meşgul beklemeli tanım ders kitabındakidir; gerçek gerçekleştirmeler bloklanmış iş parçacıkları için bir kuyruk tutar, böylece wait() dönmek yerine uyur. O zaman değer şöyle okunabilir: S > 0 → boş kaynaklar; S = 0 → boş kaynak yok (negatif değerlere izin veren gerçekleştirmelerde −S = bekleyen sayısı).");

  // 33 ── Sınırlı tampon
  s = d.content({ kicker: "Klasik problem", title: "Sınırlı Tampon: Üretici ve Tüketici", lead: "Üretici n gözlü bir tampona öğe koyar; tüketici onları alır. Üç semafor ikisini eşgüdümler." });
  {
    const x = MX, y = 2.3;
    for (let i = 0; i < 5; i++) {
      const filled = i < 3;
      d.box(s, x + 1.55 + i * 0.72, y + 0.25, 0.64, 0.7, filled ? "öğe" : "", { fill: filled ? C.mint : C.light, color: C.dark, size: 11 });
    }
    d.box(s, x, y + 0.2, 1.25, 0.8, "Üretici", { fill: C.charcoal, size: 13 });
    d.box(s, x + 5.35, y + 0.2, 1.3, 0.8, "Tüketici", { fill: C.slate, size: 13 });
    d.arrow(s, x + 1.27, y + 0.6, x + 1.52, y + 0.6, { w: 2 });
    d.arrow(s, x + 5.1, y + 0.6, x + 5.33, y + 0.6, { w: 2 });
    d.text(s, "n = 5 göz: burada full = 3, empty = 2", { x: x + 1.4, y: y + 1.0, w: 4.0, h: 0.3, fontSize: 12, italic: true, color: C.mutedOnLight, align: "center" });
    const hdr = ["Semafor", "Başlangıç değeri", "Saydığı"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 13 } }));
    const rows = [["empty", "n", "boş gözler"], ["full", "0", "dolu gözler"], ["mutex", "1", "tampon erişim kilidi"]].map((r, i) => r.map((t, j) => ({ text: t, options: { color: BODY, bold: j === 0, fontFace: j === 0 ? F.code : F.body, fill: { color: i % 2 ? C.white : C.light }, fontSize: 13 } })));
    s.addTable([hdr, ...rows], { x, y: y + 1.55, w: 6.65, colW: [1.6, 2.0, 3.05], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [3, 6, 3, 6], valign: "middle" });
    d.text(s, "Üretici empty = 0 olunca (tampon dolu), tüketici full = 0 olunca (tampon boş) bloklanır.", { x, y: y + 3.4, w: 6.65, h: 0.7, fontSize: 13, color: C.slate, italic: true });
  }
  d.code(s, MX + 6.95, 2.3, 2.55, 2.75,
`/* üretici */
wait(empty);
wait(mutex);
 öğe ekle
signal(mutex);
signal(full);`, 13);
  d.code(s, MX + 9.6, 2.3, 2.55, 2.75,
`/* tüketici */
wait(full);
wait(mutex);
 öğe çıkar
signal(mutex);
signal(empty);`, 13);
  d.callout(s, MX + 6.95, 5.3, 5.2, 1.55, "Sıra önemlidir: önce sayan semaforda, sonra mutex'te bekleyin. İkisinin yerini değiştirmek kilitlenmeye yol açabilir (sonraki slayt).", 14);
  s.addNotes("Tek örnekte iki tür semafor kullanımı: empty ve full sayan semaforlardır (kaynak sayarlar), mutex ise ikili semafordur (karşılıklı dışlama). Sınıfa soru: Tampon doluyken üretici wait(empty)'den ÖNCE wait(mutex) yaparsa ne olur? Yanıt sonraki slaytta.");

  // 34 ── Kilitlenme uyarısı
  s = d.content({ kicker: "Bir uyarı", title: "Dikkatsiz Kilitleme Kilitlenmeye Yol Açabilir", lead: "S ve Q adlı iki semafor, ikisi de 1 ile başlıyor. Her iş parçacığına ikisi de gerekiyor — ama onları farklı sırayla alıyorlar." });
  d.code(s, MX, 2.3, 3.0, 2.3, "/* P0 iş parç. */\nwait(S);\nwait(Q);\n  ...\nsignal(S);\nsignal(Q);", 14);
  d.code(s, MX + 3.2, 2.3, 3.0, 2.3, "/* P1 iş parç. */\nwait(Q);\nwait(S);\n  ...\nsignal(Q);\nsignal(S);", 14);
  {
    const hdr = ["Zaman", "P0", "P1", "S", "Q"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 13, align: "center" } }));
    const rows = [["1", "wait(S) ✓", "", "0", "1"], ["2", "", "wait(Q) ✓", "0", "0"], ["3", "wait(Q) bloklanır", "", "0", "0"], ["4", "", "wait(S) bloklanır", "0", "0"]].map((r, i) => r.map((t, j) => ({ text: t, options: { color: /bloklanır/.test(t) ? C.red : BODY, bold: /bloklanır/.test(t), fill: { color: i % 2 ? C.white : C.light }, fontFace: F.body, fontSize: 13, align: "center" } })));
    s.addTable([hdr, ...rows], { x: MX + 6.5, y: 2.3, w: 5.65, colW: [0.85, 1.9, 1.9, 0.5, 0.5], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [3, 3, 3, 3], valign: "middle" });
  }
  d.callout(s, MX, 4.9, 12.15, 1.95, "Kilitlenme (deadlock): her iş parçacığı yalnızca diğerinin tetikleyebileceği bir olayı bekler — ikisi de sonsuza dek bekler. En basit çare: tüm iş parçacıkları kilitleri aynı genel sırayla alsın. Aynı tuzak: tampon doluyken empty'den önce mutex'i alan bir üretici. (Kilitlenmenin ayrıntıları bu dersin kapsamı dışındadır.)", 15);
  s.addNotes("Bilerek tek slayt. Sınırlı tampon sorusunun yanıtı: üretici mutex'i tutarken empty üzerinde uyur; tüketici bir öğe çıkarmak için mutex'i alamaz; kimse ilerleyemez. Kilitlenmenin açlıktan farklı olduğuna dikkat çekin: kilitlenmede kimse ilerlemez, açlıkta başkaları ilerler.");

  // 35 ── Uygulama: race.c
  s = code2({
    kicker: "Uygulama", title: "Örnek 1: C'de Gerçek Bir Yarış (race.c)",
    code: code("race_excerpt.c"), size: 12.5, codeW: 5.75, sideTitle: "Deney",
    side: [
      "İki iş parçacığı, her biri on milyon kez 1 ekliyor → 20.000.000 vermeli.",
      "Güncellemelerin %28–40'ı kayboluyor — iki iş parçacığı TEK bir işlemciyi paylaşsa bile.",
      "Aynı program, her çalıştırmada farklı yanıt:",
    ],
    run: { h: 2.55, size: 11.5, text: [...RUN.slice(0, 5), ...RUN.slice(9, 12)].join("\n") },
  });
  s.addNotes("Derleme konteynerimizde (2 işlemci) yapılmış gerçek çalıştırmalar. Artırmaların yaklaşık %28–40'ı kayboluyor ve sayı her çalıştırmada değişiyor. TEK işlemciye sabitlendiğinde bile (taskset -c 0) güncellemeler kayboluyor: bir iş parçacığı okuma ile yazma arasında kesilirse, onun eskimiş yazması daha sonra diğer iş parçacığının bütün zaman dilimi boyunca yaptığı her şeyi siler. Öğrenciler bunu 9. haftada herhangi bir Linux makinesinde derleyebilir.");

  // 36 ── Uygulama: race_fixed.c
  s = code2({
    kicker: "Uygulama", title: "Örnek 2: Çözüm ve Bedeli (race_fixed.c)",
    code: code("race_fixed_excerpt.c"), size: 12.5, codeW: 5.75, sideTitle: "Doğru, ama daha yavaş",
    side: [
      "Her zaman tam olarak 20.000.000.",
      "Kilitsiz (yanlış): 0,05–0,11 s. Kilitli (doğru): 0,75–1,12 s — yaklaşık 10–20 kat yavaş.",
      "Neden? 20 milyon kilitle/aç çifti ve iki işlemci kilit için çekişiyor.",
    ],
    run: { h: 1.7, size: 11.5, text: RUN.slice(5, 9).join("\n") },
  });
  s.addNotes("Ders: önce doğruluk, sonra başarım. Daha iyi tasarım: her iş parçacığı özel bir yerel değişkende saysın ve toplamı ortak sayaca kilit altında YALNIZCA BİR KEZ eklesin — o zaman 20 milyon yerine yalnızca iki kilit işlemi olur. Bu, notlarda bir alıştırma.");

  // 37 ── Uygulama: prodcons.c
  s = code2({
    kicker: "Uygulama", title: "Örnek 3: POSIX Semaforlarıyla Üretici–Tüketici",
    code: code("prodcons_excerpt.c"), size: 12.5, codeW: 6.9, sideTitle: "Sözde koddan C'ye",
    side: [
      "wait → sem_wait, signal → sem_post.",
      "sem_init(&empty, 0, SIZE): 0, 'tek bir sürecin iş parçacıkları arasında ortak' demektir.",
      "5 gözlü tampon, 20 öğe: üretici 5 öğe öne geçtiğinde bloklanır.",
    ],
    run: { h: 1.9, size: 11, text: RUN.slice(12).join("\n") },
    sideSize: 14.5,
  });
  s.addNotes("Programın tamamı: code/prodcons.c. 210 = 20·21/2 toplam denetimi, hiçbir öğenin kaybolmadığını ya da iki kez alınmadığını gösterir. Alıştırma: üreticideki iki sem_wait çağrısının yerini değiştirin ve tampon boyutunu 1 yapın — program takılır (kilitlenme).");

  // 38 ── Kısa sınav
  s = d.quizSlide({ questions: [
    "Patlamaları 5, 2, 8 ms olan işlerin hepsi t = 0'da geliyor. SJF sırasını ve ortalama bekleme süresini verin.",
    "Üstel ortalamada α = 0,5, τ = 8 ms ve son patlama t = 12 ms. Bir sonraki tahmin nedir?",
    "Hepsi 50 ms'den az süre isteyen işler üzerinde q = 100 ms ile döngüsel zamanlama hangi algoritma gibi davranır? Neden?",
    "Bir kritik bölge çözümünün üç gereksinimini sayın. 'Yalnızca A iş parçacığı girebilir' kuralı hangisini ihlal eder?",
  ] });
  s.addNotes("Yanıtlar: (1) sıra 2, 5, 8 → beklemeler 0, 2, 7 → ortalama 3 ms. (2) 0,5·12 + 0,5·8 = 10 ms. (3) FCFS: hiçbir iş zaman dilimini doldurmaz. (4) Karşılıklı dışlama, ilerleme, sınırlı bekleme; ilerlemeyi (ve B için sınırlı beklemeyi) ihlal eder.");

  // 39 ── Temel çıkarımlar
  s = d.content({ kicker: "Kapanış", title: "5. Hafta: Temel Çıkarımlar" });
  d.bullets(s, [
    { b: "FCFS", t: " basittir ama konvoy etkisinden muzdariptir (aynı işler için ortalama bekleme 17 ya da 3 ms)." },
    { b: "SJF / SRTF", t: " ortalama bekleme süresini en aza indirir, ama bir sonraki patlama uzunluğunu bilmeleri gerekir — üstel ortalamayla tahmin edilir." },
    { b: "Öncelikli", t: " zamanlama düşük öncelikli işleri aç bırakabilir; yaşlandırma bunu düzeltir." },
    { b: "Döngüsel zamanlama", t: " her beklemeyi (n − 1)·q ile sınırlar; q çok büyük → FCFS, q çok küçük → geçiş yükü. Linux adil pay hedefler (CFS, 6.6'dan beri EEVDF)." },
    { b: "Yarış durumu:", t: " counter++ oku–ekle–yaz demektir; iç içe geçmeler güncelleme kaybettirir (testimizde milyonlarca)." },
    { b: "Kritik bölgeler", t: " karşılıklı dışlama, ilerleme ve sınırlı bekleme ister; atomik komutlardan muteks kilitleri ve semaforlar kurulur." },
  ], { fontSize: 18, y: 1.7, h: 4.2, paraSpaceAfter: 10 });
  d.callout(s, MX, 6.0, 12.15, 0.85, "Ara sınav (8. hafta) için: yukarıdaki her algoritmada Gantt şeması çizip bekleme, dönüş ve yanıt sürelerini hesaplayabilmelisiniz.", 15);
  s.addNotes("Bunları bir kontrol listesi gibi okuyun; her satır, öğrencilerin ara sınavda (8. hafta) hesaplayabilmesi ya da açıklayabilmesi gereken bir şeydir.");

  d.closing({ nextWeek: "Bellek Yönetimi, Sayfalama ve Bölütleme", nextItems: [
    "Adres bağlama; mantıksal ve fiziksel adresler; MMU",
    "Takas (swapping) ve bitişik bellek tahsisi",
    "Dış ve iç parçalanma (fragmentation)",
    "Sayfalama, sayfa tabloları, TLB ve etkin erişim süresi; bölütleme",
  ] });
  const sl = P._slides;
  sl[sl.length - 2].addNotes("6. hafta işlemciden ikinci büyük kaynağa geçiyor: ana bellek. Öğrencilerden ikilik sayıları ve ikinin kuvvetlerini (2^10 = 1024, 2^12 = 4096) gözden geçirmelerini isteyin — sayfa boyutları ve adresler için gerekecek.");
  sl[sl.length - 1].addNotes("Sorular. Öğrencilere 5. hafta notlarında sayısal tekrar sorularının çözümlü yanıtlarının bulunduğunu ve sched_check.py simülatörüyle kendi Gantt şemalarını denetleyebileceklerini hatırlatın.");

  await d.save(path.join(__dirname, "MBLP131_Hafta5.pptx"));
  console.log("slides:", d.n);
})();
