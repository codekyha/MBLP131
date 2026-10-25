// Hafta 4 sunumu (MBLP131, Türkçe): İş Parçacıkları ve İşlemci Zamanlamasının Temelleri
// İngilizce referans: ../week04/build_deck.js (aynı slayt sırası, aynı diyagramlar, aynı sayılar)
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("../lib/deck");
const d = new Deck({ week: 4, lang: "tr", assets: path.join(__dirname, "../lib") });
const code = f => fs.readFileSync(path.join(__dirname, "code", f), "utf8");
const P = d.pres;
const MINT_L = "D7E9E6";
const lastSlide = () => P._slides[P._slides.length - 1];
const tr2 = v => v.toFixed(2).replace(".", ",");   // ondalık virgül (slayt metni)

// ok başı olmayan düz bağlantı çizgisi
function line(s, x1, y1, x2, y2, { color = C.slate, w = 1.5, dash } = {}) {
  s.addShape(P.shapes.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 0.0001, h: Math.abs(y2 - y1) || 0.0001,
    flipH: (x2 < x1) !== (y2 < y1) ? true : false, line: { color, width: w, dashType: dash },
  });
}
// Gantt satırı: segs = [[etiket, başlangıç, bitiş, dolgu, renk?]], x0 = t0 anı, u = birim zaman başına inç
function gantt(s, x0, y, u, segs, { h = 0.6, ticks, t0 = 0, size = 13, tickSize = 11 } = {}) {
  segs.forEach(([lab, a, b, fill, col]) => {
    s.addShape(P.shapes.RECTANGLE, { x: x0 + (a - t0) * u, y, w: (b - a) * u, h, fill: { color: fill }, line: { color: C.white, width: 1.5 } });
    if (lab) d.text(s, lab, { x: x0 + (a - t0) * u, y, w: (b - a) * u, h, fontSize: size, bold: true, align: "center", valign: "middle", color: col || ([C.charcoal, C.slate, C.mintDeep, C.dark].includes(fill) ? C.white : C.charcoal) });
  });
  (ticks || []).forEach(t => d.text(s, String(t), { x: x0 + (t - t0) * u - 0.3, y: y + h + 0.04, w: 0.6, h: 0.28, fontSize: tickSize, align: "center", color: C.mutedOnLight }));
}
// iş parçacığı modeli diyagramı: üstte kullanıcı iş parçacıkları, altta çekirdek iş parçacıkları
function modelDiagram(s, x, y, w, nU, nK, links, caption) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 1.25, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
  d.text(s, "kullanıcı alanı", { x: x + 0.15, y: y + 0.06, w: 2.5, h: 0.28, fontSize: 11, italic: true, color: C.mutedOnLight });
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y: y + 2.45, w, h: 1.25, fill: { color: C.charcoal }, rectRadius: 0.05, line: { type: "none" } });
  d.text(s, "çekirdek alanı", { x: x + 0.15, y: y + 3.36, w: 2.5, h: 0.28, fontSize: 11, italic: true, color: C.mutedOnDark });
  const ux = i => x + (i + 0.5) * w / nU, kx = i => x + (i + 0.5) * w / nK;
  const r = 0.27, uy = y + 0.62, ky = y + 3.07;
  links.forEach(([u, k]) => line(s, ux(u), uy + r, kx(k), ky - r, { color: C.mintDeep, w: 2 }));
  for (let i = 0; i < nU; i++) {
    s.addShape(P.shapes.OVAL, { x: ux(i) - r, y: uy - r, w: 2 * r, h: 2 * r, fill: { color: C.mint }, line: { type: "none" } });
    d.text(s, "K", { x: ux(i) - r, y: uy - r, w: 2 * r, h: 2 * r, fontSize: 13, bold: true, align: "center", valign: "middle", color: C.dark });
  }
  for (let i = 0; i < nK; i++) {
    s.addShape(P.shapes.OVAL, { x: kx(i) - r, y: ky - r, w: 2 * r, h: 2 * r, fill: { color: C.white }, line: { type: "none" } });
    d.text(s, "Ç", { x: kx(i) - r, y: ky - r, w: 2 * r, h: 2 * r, fontSize: 13, bold: true, align: "center", valign: "middle", color: C.charcoal });
  }
  if (caption) d.text(s, caption, { x, y: y + 3.85, w, h: 0.6, fontSize: 12, italic: true, color: C.mutedOnLight });
}
function modelSlide({ kicker, title, lead, nU, nK, links, caption, pros, cons, examples, notes }) {
  const s = d.content({ kicker, title, lead });
  const y0 = 2.3;
  modelDiagram(s, MX, y0, 6.2, nU, nK, links, caption);
  const x = MX + 6.55, w = 5.6, gap = 0.2, eh = 0.95;
  const hh = (6.85 - y0 - eh - 2 * gap) / 2;
  d.card(s, x, y0, w, hh, { title: "Avantajlar", body: pros, bodySize: 14 });
  d.card(s, x, y0 + hh + gap, w, hh, { title: "Dezavantajlar", titleColor: C.red, body: cons, bodySize: 14 });
  d.callout(s, x, y0 + 2 * hh + 2 * gap, w, eh, examples, 13);
  s.addNotes(notes);
  return s;
}

(async () => {
  // 1 ── Başlık
  let s = d.titleSlide({
    kicker: "MBLP131  ·  HAFTA 4",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 4  ·  İş Parçacıkları ve İşlemci Zamanlamasının Temelleri",
    tagline: "Bir program aynı anda birkaç işi nasıl yapar — ve sırada kimin çalışacağına kim karar verir?",
  });
  s.addNotes("Tekrar hoş geldiniz. Geçen hafta süreci (process) gördük. Bugün ilk saatte süreci iş parçacıklarına (thread) bölüyoruz; ikinci saatte ise her işletim sisteminin saniyede yüzlerce kez yanıtlaması gereken soruyu soruyoruz: işlemciyi sıradaki hangi iş parçacığı alacak? Ortada kısa bir mola vereceğiz.");

  // 2 ── Geçen hafta
  s = d.cardsSlide({
    kicker: "Geçen hafta", title: "Dört Fikirde 3. Hafta",
    cards: [
      { title: "Süreç", body: "Belleği: metin (kod), veri, bss, öbek (heap) ve yığıt (stack) — ayrıca işlemci durumu ve açık dosyalar." },
      { title: "Beş durum", body: "yeni → hazır → çalışıyor → bekliyor → sonlandı. Her çekirdekte aynı anda tek süreç çalışır." },
      { title: "PCB", body: "Çekirdeğin süreç kaydı: durum, PC, yazmaçlar, bellek bilgisi, açık dosyalar, zamanlama bilgisi." },
      { title: "Bağlam değişimi", body: "Bir sürecin PCB'si kaydedilir, diğerininki yüklenir. fork() yaratır, exec() değiştirir, wait() toplar." },
    ], cols: 4, bodySize: 15.5,
    callout: "Bugün: bir süreç birden çok yürütme akışı (iş parçacığı) içerebilir — ve işletim sisteminin sırada hangisinin çalışacağına dair bir kurala ihtiyacı vardır.",
  });
  s.addNotes("Kısa tekrar, iki üç dakika. Sorun: bağlam değişiminde ne kaydedilir? (Yazmaçlar, program sayacı ... PCB'ye.) Bugün göreceğiz ki iş parçacığı aslında 'PCB'nin yürütmeyi anlatan kısmı'dır; bu kısım ayrılarak bir sürecin birden çok iş parçacığına sahip olması sağlanır.");

  // 3 ── Gündem
  s = d.content({ kicker: "Hafta 4", title: "Bugünün Gündemi" });
  [
    ["1", "İş parçacıkları", "Neden iş parçacığı? Neleri paylaşırlar, neleri kendilerine saklarlar; yararları."],
    ["2", "Çok çekirdek", "Eşzamanlılık ve paralellik; çözümlü örnekle Amdahl yasası."],
    ["3", "Modeller", "Kullanıcı ve çekirdek iş parçacıkları; çoktan bire, birebir, çoktan çoğa; Pthreads."],
    ["4", "Zamanlama", "İşlemci–G/Ç patlamaları, hazır kuyruğu, kesintili zamanlama, dağıtıcı."],
    ["5", "Ölçütler", "Kullanım, üretilen iş, dönüş, bekleme ve yanıt süresi — hesaplamalı."],
  ].forEach((a, i) => {
    const y = 1.7 + i * 1.0;
    d.box(s, MX, y, 0.8, 0.8, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 1.0, y, w: 11.15, h: 0.8, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "   ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.3, y, w: 10.7, h: 0.8, valign: "middle" });
  });
  s.addNotes("1–3. bölümler moladan önce, 4–5. bölümler moladan sonra. Uygulamalı C programları her bölümün içinde yer alıyor; çıktılar bir Linux makinesinde gerçekten ölçüldü.");

  // ───────────────────────── BÖLÜM 1: İŞ PARÇACIKLARI
  s = d.sectionSlide({ kicker: "Bölüm 1", title: "İş Parçacıkları", subtitle: "Tek süreç, birden çok yürütme akışı." });
  s.addNotes("Herhangi bir tanımdan önce, merak uyandıran bir örnekle başlayın.");

  // 5 ── Neden iş parçacığı
  s = d.content({ kicker: "Motivasyon", title: "Neden İş Parçacığı? Bir Web Sunucusu Örneği", lead: "Bir web sunucusu saniyede binlerce istek alır. Her istek biraz işlemci zamanı ve çok fazla bekleme (disk, ağ) gerektirir." });
  {
    const x = MX, y = 2.35;
    // tek iş parçacıklı
    d.text(s, "Tek iş parçacıklı sunucu", { x, y, w: 6.4, h: 0.35, fontSize: 14, bold: true, color: C.red });
    ["istek 1", "istek 2", "istek 3", "istek 4"].forEach((r, i) => d.box(s, x + i * 0.95, y + 0.5, 0.85, 0.6, r, { fill: C.light, size: 11 }));
    d.arrow(s, x + 3.85, y + 0.8, x + 4.35, y + 0.8, { w: 1.5 });
    d.box(s, x + 4.4, y + 0.45, 1.9, 0.7, "1 iş parçacığı", { sub: "sırayla, tek tek", fill: C.slate, size: 13 });
    d.text(s, "1. istek diski beklerken 2–4. istekler sırada bekler.", { x, y: y + 1.2, w: 6.4, h: 0.35, fontSize: 12, italic: true, color: C.mutedOnLight });
    // çok iş parçacıklı
    const y2 = y + 1.8;
    d.text(s, "Çok iş parçacıklı sunucu", { x, y: y2, w: 6.4, h: 0.35, fontSize: 14, bold: true, color: C.mintDeep });
    d.box(s, x, y2 + 1.0, 1.7, 0.8, "dinleyici", { sub: "istekleri kabul eder", fill: C.mint, color: C.dark, size: 13 });
    [0, 1, 2].forEach(i => {
      d.box(s, x + 3.0, y2 + 0.45 + i * 0.68, 2.0, 0.56, `işçi iş parçacığı ${i + 1}`, { fill: C.charcoal, size: 11.5 });
      d.arrow(s, x + 1.72, y2 + 1.4, x + 2.98, y2 + 0.73 + i * 0.68, { w: 1.25 });
    });
    d.text(s, "…her isteğe bir iş parçacığı", { x: x + 5.1, y: y2 + 1.2, w: 1.6, h: 0.5, fontSize: 11, italic: true, color: C.mutedOnLight });
  }
  d.card(s, MX + 6.9, 2.35, 5.25, 4.5, { title: "Aynı fikir her yerde", body: [
    { b: "Kelime işlemci:", t: " bir iş parçacığı tuşları okur, biri ekranı yeniden çizer, biri yazımı denetler, biri otomatik kaydeder." },
    { b: "Tarayıcı:", t: " her sekme aynı anda sayfa yükler, resim çözer, betik çalıştırır." },
    { b: "Oyun:", t: " görüntü, fizik, ses ve ağ ayrı iş parçacıklarında." },
    "Hepsi aynı belge / sayfa / dünya üzerinde çalışır — dolayısıyla belleği paylaşmaları gerekir.",
  ], bodySize: 14 });
  s.addNotes("A seçeneği her istek için ayrı bir süreç yaratmak olurdu (eski Apache bunu fork ile yapıyordu). Çalışır, ama süreç yaratmak pahalıdır ve süreçler belleği kolayca paylaşamaz. İş parçacıkları TEK bir süreç içinde, onun belleğini paylaşarak eşzamanlılık sağlar. Öğrencilere sorun: telefonunuzdaki hangi programlar açıkça aynı anda birkaç iş yapıyor?");

  // 6 ── İş parçacığı nedir
  s = d.content({ kicker: "Tanım", title: "İş Parçacığı, İşlemcide Yürütmenin Birimidir", lead: "Her iş parçacığının kendi kimliği (TID), program sayacı (PC), yazmaç kümesi ve yığıtı vardır. Gerisini sürecindeki diğer iş parçacıklarıyla paylaşır." });
  {
    const panel = (x, y, w, n, label) => {
      d.text(s, label, { x, y, w, h: 0.35, fontSize: 14, bold: true, color: C.charcoal, align: "center" });
      s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y: y + 0.4, w, h: 3.85, fill: { color: C.white }, line: { color: C.slate, width: 1 }, rectRadius: 0.05 });
      const cw = (w - 0.4) / 3;
      ["kod", "veri", "dosyalar"].forEach((t, i) => d.box(s, x + 0.2 + i * cw, y + 0.55, cw - 0.08, 0.55, t, { fill: C.mint, color: C.dark, size: 12 }));
      const tw = (w - 0.4) / n;
      for (let k = 0; k < n; k++) {
        const tx = x + 0.2 + k * tw;
        d.box(s, tx, y + 1.25, tw - 0.08, 0.5, "yazmaçlar", { fill: C.light, size: 11 });
        d.box(s, tx, y + 1.8, tw - 0.08, 0.5, "PC", { fill: C.light, size: 11 });
        d.box(s, tx, y + 2.35, tw - 0.08, 0.5, "yığıt", { fill: C.light, size: 11 });
        // iş parçacığının kendisi: ok olarak çizilmiş akış
        d.arrow(s, tx + (tw - 0.08) / 2, y + 2.95, tx + (tw - 0.08) / 2, y + 4.1, { color: C.mintDeep, w: 2.5 });
      }
    };
    panel(MX, 2.3, 3.6, 1, "Tek iş parçacıklı süreç");
    panel(MX + 4.0, 2.3, 5.4, 3, "Çok iş parçacıklı süreç (3 iş parçacığı)");
    d.text(s, "↓ = bir yürütme akışı (iş parçacığı)", { x: MX + 4.0, y: 6.6, w: 5.4, h: 0.3, fontSize: 11, italic: true, color: C.mintDeep, align: "center" });
  }
  d.card(s, MX + 9.75, 2.3, 2.4, 4.55, { title: "Not", body: "Geleneksel (\"ağır siklet\") süreç, tam olarak bir iş parçacığı olan süreçtir.\n\n3. haftanın PCB'si artık ikiye ayrılır: sürece ait kısım + her iş parçacığı için küçük bir blok.", bodySize: 13 });
  s.addNotes("Bu, ders kitabındaki klasik şekildir. Nane yeşili kutular = tüm iş parçacıklarınca paylaşılır; gri kutular = her iş parçacığında bir kopya. Linux her iş parçacığına 'görev' (task) der ve her birine kendi task_struct kaydını verir; bir sürecin iş parçacıkları aynı bellek haritasını ve aynı dosya tablosunu gösterir. Eski kitaplar iş parçacıklarına 'hafif süreç' (lightweight process, LWP) der — bu kısaltmayı birazdan ps çıktısında göreceksiniz.");

  // 7 ── Ortak / özel tablosu
  s = d.tableSlide({
    kicker: "Süreç ve iş parçacığı", title: "İş Parçacıkları Neyi Paylaşır? Ne Kendilerine Özeldir?",
    header: ["Öğe", "Bir sürecin iş parçacıkları…", "Neden"],
    colW: [3.3, 2.9, 5.95],
    rows: [
      ["Kod (metin bölümü)", "paylaşır", "Tüm iş parçacıkları aynı programın fonksiyonlarını çalıştırır."],
      ["Global veri ve öbek", "paylaşır", "Global bir değişken ya da malloc ile ayrılmış bir dizi her iş parçacığınca görülür."],
      ["Açık dosyalar, PID, kullanıcı kimliği", "paylaşır", "Kaynaklar iş parçacığına değil, sürece aittir."],
      ["Program sayacı ve yazmaçlar", "özel", "Her iş parçacığı kodda kendi yerindedir."],
      ["Yığıt (yerel değişkenler)", "özel", "Her iş parçacığının kendi fonksiyon çağrı zinciri vardır."],
      ["İş parçacığı kimliği, zamanlama durumu", "özel", "İşletim sistemi her iş parçacığını ayrı zamanlar."],
    ],
    fontSize: 15,
    callout: "Paylaşım işin özüdür — ve tehlikesidir: aynı değişkeni aynı anda değiştiren iki iş parçacığı yanlış sonuç üretir (yarış durumu, race condition; 5. hafta).",
  });
  s.addNotes("Tabloyu satır satır geçin. Ortak olan = sürecin bir kap olarak sahip olduğu her şey. Özel olan = 'yürütmede neredeyim' sorusunu yanıtlayan her şey. 5. haftanın tohumunu ekin: iki iş parçacığında aynı anda yapılan shared_counter++ güncellemeleri kaybedebilir.");

  // 8 ── Yararlar
  s = d.cardsSlide({
    kicker: "Yararlar", title: "Çok İş Parçacıklı Programlamanın Dört Yararı",
    cards: [
      { title: "1. Yanıt verebilirlik", body: "Bir iş parçacığı bloke olsa ya da uzun bir hesap yapsa bile diğerleri çalışmayı sürdürür — kullanıcı arayüzü donmaz." },
      { title: "2. Kaynak paylaşımı", body: "İş parçacıkları belleği ve dosyaları kendiliğinden paylaşır. Süreçlerin iş birliği için ek mekanizmalar (paylaşılan bellek, borular) gerekir." },
      { title: "3. Ekonomi", body: "İş parçacığı yaratmak ve iş parçacıkları arasında geçiş yapmak, süreçlere göre çok daha ucuzdur: yeni adres alanı gerekmez." },
      { title: "4. Ölçeklenebilirlik", body: "Çok çekirdekli işlemcide bir sürecin iş parçacıkları farklı çekirdeklerde paralel çalışabilir. Tek iş parçacıklı süreç yalnızca bir çekirdek kullanır." },
    ], cols: 2, bodySize: 16.5,
    callout: "Sonraki slayt: 3. yararı ölçüyoruz — iş parçacığı süreçten ne kadar ucuz?",
  });
  s.addNotes("Bu dört yarar Silberschatz 4. bölümden. Yanıt verebilirlik: klasik 'Uygulama yanıt vermiyor' mesajı, arayüz iş parçacığı meşgulken ortaya çıkar. Ölçeklenebilirlik, yaklaşık 2005'ten sonra işlemci saat hızları artmayı bırakıp çekirdek sayıları artmaya başlayınca çok iş parçacıklı programlamanın vazgeçilmez olmasının nedenidir.");

  // 9 ── Yaratma maliyeti
  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 1: İş Parçacığı Gerçekten Daha mı Ucuz?",
    code: code("create_cost_excerpt.c"), size: 12, codeW: 7.1, sideTitle: "Deney",
    side: [
      "5000 süreç yarat (fork + wait); her biri hemen çıkar.",
      "Sonra hiçbir şey yapmayan 5000 iş parçacığı yarat (pthread_create + join).",
      "2 çekirdekli bir Linux sanal makinesinde ölçüldü:",
    ],
    run: { h: 1.9, size: 11.5, text:
`$ ./create_cost
fork + wait          :  205.5 us per process
pthread_create + join:   51.9 us per thread
a thread is about 4 times cheaper to create` },
  });
  s.addNotes("Derleme makinemizden (2 sanal işlemci, paylaşımlı) gerçek çıktı. Doğrudan donanım üzerinde iş parçacığı yaratmak çoğu zaman 10–20 µs sürer ve oran daha büyüktür (Silberschatz, Solaris için süreç yaratmanın yaklaşık 30 kat yavaş olduğunu aktarır). fork(), yazınca kopyala (copy-on-write) olsa bile sayfa tablolarını ve birçok çekirdek yapısını kopyalamak zorundadır; iş parçacığı ise yalnızca bir yığıt ve küçük bir çekirdek kaydı ister. Çıktıdaki us = mikrosaniye (µs).");

  // 10 ── Eşzamanlılık ve paralellik
  s = d.content({ kicker: "Çok çekirdek", title: "Eşzamanlılık ve Paralellik", lead: "Zaman içinde dört iş parçacığı, T1–T4. Aynı program, iki farklı makine." });
  {
    const x0 = MX + 2.0, u = 0.62, cols = [C.mint, C.charcoal, C.slate, MINT_L];
    const seq = i => ["T1", "T2", "T3", "T4"][i % 4];
    d.text(s, "Tek çekirdek", { x: MX, y: 2.55, w: 1.9, h: 0.6, fontSize: 15, bold: true, color: C.charcoal, valign: "middle" });
    gantt(s, x0, 2.55, u, Array.from({ length: 16 }, (_, i) => [seq(i), i, i + 1, cols[i % 4]]), { size: 12 });
    d.text(s, "Çekirdek 0", { x: MX, y: 3.75, w: 1.9, h: 0.6, fontSize: 15, bold: true, color: C.charcoal, valign: "middle" });
    d.text(s, "Çekirdek 1", { x: MX, y: 4.4, w: 1.9, h: 0.6, fontSize: 15, bold: true, color: C.charcoal, valign: "middle" });
    gantt(s, x0, 3.75, u, Array.from({ length: 16 }, (_, i) => [["T1", "T3"][i % 2], i, i + 1, cols[(i % 2) * 2]]), { size: 12 });
    gantt(s, x0, 4.4, u, Array.from({ length: 16 }, (_, i) => [["T2", "T4"][i % 2], i, i + 1, cols[(i % 2) * 2 + 1]]), { size: 12 });
    d.arrow(s, x0, 5.2, x0 + 16 * u, 5.2, { w: 1.5 });
    d.text(s, "zaman", { x: x0 + 16 * u - 0.9, y: 5.25, w: 0.9, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "right" });
  }
  d.card(s, MX, 5.65, 5.95, 1.2, { title: "Eşzamanlılık (concurrency)", body: "Görevler sırayla ilerler — TEK çekirdekte bile.", bodySize: 15, titleSize: 14 });
  d.card(s, MX + 6.2, 5.65, 5.95, 1.2, { title: "Paralellik (parallelism)", body: "Görevler AYNI anda yürür — en az 2 çekirdek gerekir.", bodySize: 15, titleSize: 14 });
  s.addNotes("Üst satır: tek çekirdek dört iş parçacığı arasında hızla (her birine birkaç ms) geçiş yapar — insana eşzamanlı görünür, ama herhangi bir anda yalnızca biri çalışır. Bu, paralellik olmadan eşzamanlılıktır. Alt satırlar: iki çekirdek, iki iş parçacığı gerçekten aynı anda çalışır. Paralellik eşzamanlılığı gerektirir; tersi doğru değildir. Test makinemizde 2 çekirdek var (nproc = 2).");

  // 11 ── Çok çekirdekli programlamanın zorlukları
  s = d.cardsSlide({
    kicker: "Çok çekirdek", title: "Çok Çekirdek İçin Programlama: Beş Zorluk",
    cards: [
      { title: "Görev bulma", body: "İşin bağımsız çalışabilecek parçalarını belirlemek." },
      { title: "Denge", body: "Her çekirdeğe benzer miktarda iş vermek; yoksa bazıları boşta kalır." },
      { title: "Veriyi bölmek", body: "Veriyi, her iş parçacığı kendi parçasında çalışacak biçimde ayırmak." },
      { title: "Veri bağımlılığı", body: "B görevi A'nın sonucuna muhtaçsa B beklemelidir: eşzamanlama." },
      { title: "Test", body: "Olası iç içe geçiş sırası çok fazladır: hatalar yalnızca bazen ortaya çıkar." },
    ], cols: 5, bodySize: 15,
    callout: "Veri paralelliği: verinin farklı parçalarına aynı işlem (dizi toplama örneğimiz). Görev paralelliği: aynı anda farklı işlemler (kelime işlemcinin iş parçacıkları).",
  });
  s.addNotes("Bu beş zorluk Silberschatz 4.2.1'den. Birazdan çalıştıracağımız dizi toplama programı saf veri paralelliğidir: her iş parçacığı kendi dilimini toplar; en sondaki birleştirmeye, yani main'in kısmi toplamları eklemesine kadar hiçbir bağımlılık yoktur. Test: bir yarış durumu milyonda bir çalıştırmada ortaya çıkabilir.");

  // 12 ── Amdahl yasası
  s = d.content({ kicker: "Çok çekirdek", title: "Amdahl Yasası: Çekirdek Eklemenin Sınırı", lead: "Her programın bir kısmı seri çalışır (bölünemez). Bu kısım, çekirdek sayısı arttıkça hızlanmaz." });
  {
    const x = MX, y = 2.45;
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w: 6.6, h: 2.3, fill: { color: C.light }, rectRadius: 0.06, line: { type: "none" } });
    d.text(s, "hızlanma ≤", { x: x + 0.25, y: y + 0.55, w: 2.4, h: 1.0, fontSize: 26, fontFace: F.title, bold: true, color: C.charcoal, valign: "middle" });
    d.text(s, "1", { x: x + 2.6, y: y + 0.35, w: 3.6, h: 0.6, fontSize: 28, fontFace: F.title, color: C.charcoal, align: "center", valign: "middle" });
    line(s, x + 2.7, y + 1.05, x + 6.1, y + 1.05, { color: C.charcoal, w: 2 });
    d.text(s, [{ text: "S  +  (1 − S) / N", options: {} }], { x: x + 2.6, y: y + 1.15, w: 3.6, h: 0.6, fontSize: 26, fontFace: F.title, color: C.charcoal, align: "center", valign: "middle" });
    d.text(s, "S = işin seri kesri,  N = çekirdek sayısı", { x: x + 0.35, y: y + 1.8, w: 6, h: 0.35, fontSize: 13, italic: true, color: C.mutedOnLight });
    // zaman çubukları
    const by = 5.05, u = 1.4;
    d.text(s, "1 çekirdek", { x, y: by, w: 1.15, h: 0.5, fontSize: 12.5, bold: true, valign: "middle" });
    gantt(s, x + 1.2, by, u, [["seri", 0, 1, C.charcoal], ["paralel kısım", 1, 4, C.mint]], { h: 0.5, size: 12 });
    d.text(s, "4 çekirdek", { x, y: by + 0.75, w: 1.15, h: 0.5, fontSize: 12.5, bold: true, valign: "middle" });
    gantt(s, x + 1.2, by + 0.75, u, [["seri", 0, 1, C.charcoal], ["÷4", 1, 1.75, C.mint]], { h: 0.5, size: 12 });
    d.text(s, "seri kısım aynen kalır", { x: x + 1.2 + 1.85 * u, y: by + 0.75, w: 2.8, h: 0.5, fontSize: 12, italic: true, color: C.red, valign: "middle" });
  }
  d.card(s, MX + 6.9, 2.45, 5.25, 4.4, { title: "Formülü okumak", body: [
    "1 çekirdekte program S + (1 − S) = 1 sürer.",
    "N çekirdekte yalnızca paralel kısım kısalır: (1 − S)/N.",
    { b: "Sınır:", t: " sonsuz sayıda çekirdekle bile hızlanma ≤ 1/S." },
    "%25 seri ⇒ kaç çekirdek alırsanız alın, asla 4 kattan fazla hızlanmaz.",
  ], bodySize: 16 });
  s.addNotes("Gene Amdahl, IBM, 1967. Tahtada türetin: eski süre = 1 (normalize). Yeni süre = S + (1-S)/N. Hızlanma = eski/yeni. Bu bir üst sınırdır (≤), çünkü gerçek programlar iş parçacığı yaratma, eşzamanlama ve bellek bant genişliği için de bedel öder. Çubuk şekli S = 0,25 kullanır.");

  // 13 ── Amdahl çözümlü örnek
  s = d.content({ kicker: "Çok çekirdek", title: "Çözümlü Örnek: %75 Paralel, %25 Seri" });
  d.code(s, MX, 1.65, 6.0, 3.85,
`S = 0.25, yani 1 − S = 0.75

N = 2:   1 / (0.25 + 0.75/2)
       = 1 / 0.625   = 1.60

N = 4:   1 / (0.25 + 0.75/4)
       = 1 / 0.4375  ≈ 2.29

N → ∞:   1 / 0.25    = 4.00`, 15);
  {
    const vals = [[1, 1.0], [2, 1.6], [4, 2.29], [8, 2.91], [16, 3.37], ["∞", 4.0]];
    const bx = MX + 6.6, base = 5.5, sc = 0.85, bw = 0.7, gap = 0.22;
    d.text(s, "hızlanma – çekirdek sayısı N", { x: bx, y: 1.65, w: 5.5, h: 0.35, fontSize: 13, bold: true, color: C.charcoal });
    vals.forEach(([n, v], i) => {
      const x = bx + 0.2 + i * (bw + gap), h = v * sc;
      s.addShape(P.shapes.RECTANGLE, { x, y: base - h, w: bw, h, fill: { color: i === 5 ? C.charcoal : C.mint }, line: { type: "none" } });
      d.text(s, tr2(v), { x: x - 0.15, y: base - h - 0.32, w: bw + 0.3, h: 0.3, fontSize: 12, bold: true, align: "center", color: C.charcoal });
      d.text(s, "N=" + n, { x: x - 0.15, y: base + 0.05, w: bw + 0.3, h: 0.3, fontSize: 12, align: "center", color: C.mutedOnLight });
    });
    line(s, bx, base, bx + 6 * (bw + gap) + 0.2, base, { color: C.slate, w: 1.25 });
  }
  d.callout(s, MX, 5.95, 12.15, 0.9, "8 çekirdekten 16 çekirdeğe çıkmak (donanımı ikiye katlamak) hızlanmayı yalnızca 2,91'den 3,37'ye yükseltir. Önce seri kısmı küçültün — sonra çekirdek ekleyin.", 14);
  s.addNotes("Tüm değerler tam olarak hesaplandı: N=8: 1/(0,25+0,09375)=2,909; N=16: 1/(0,25+0,046875)=3,368. Sınıfa sorun: kodun %95'i paralelse (S=0,05) sınır nedir? (20 kat.) GPU programlarının seri kısmı küçücük tutmak için bu kadar uğraşmasının nedeni budur.");

  // 14 ── Kullanıcı ve çekirdek iş parçacıkları
  s = d.compareSlide({
    kicker: "İş parçacığı türleri", title: "Kullanıcı Düzeyi ve Çekirdek Düzeyi İş Parçacıkları",
    lead: "İş parçacıklarının varlığından kim haberdar — yalnızca programın içindeki bir kütüphane mi, yoksa çekirdeğin kendisi mi?",
    left: { title: "Kullanıcı düzeyi (user-level)", items: [
      "Süreç içindeki bir kütüphane yönetir; çekirdek tek iş parçacıklı tek bir süreç görür.",
      "Yaratma ve geçiş: yalnızca fonksiyon çağrıları — çok hızlı, sistem çağrısı yok.",
      "Bir iş parçacığı bloke eden bir sistem çağrısı yaparsa çekirdek bütün süreci bloke eder.",
      "İki çekirdeği kullanamaz: çekirdek tek bir şeyi zamanlar.",
    ] },
    right: { title: "Çekirdek düzeyi (kernel-level)", items: [
      "İşletim sistemi çekirdeği yaratır ve zamanlar; her birinin kendi çekirdek kaydı vardır.",
      "Yaratma ve geçiş sistem çağrısı ister — kullanıcı düzeyine göre yavaştır.",
      "Bir iş parçacığı bloke olursa çekirdek aynı sürecin başka bir iş parçacığını çalıştırır.",
      "Bir sürecin iş parçacıkları birkaç çekirdekte paralel çalışır.",
    ] },
    callout: "Her kullanıcı iş parçacığı eninde sonunda bir çekirdek iş parçacığı üzerinde çalışmalıdır. Bu eşleştirmenin biçimine çoklu iş parçacığı modeli denir.",
  });
  s.addNotes("Erken Java (\"green threads\") ve GNU Portable Threads kullanıcı düzeyindeydi. Bugün Linux, Windows ve macOS çekirdek iş parçacıklarını destekler; kullanıcı düzeyinde zamanlama ise Go goroutine'leri ve Java sanal iş parçacıkları (virtual threads, 2023) biçiminde, çoktan çoğa model olarak geri döndü.");

  // 15–17 ── modeller
  modelSlide({
    kicker: "Çoklu iş parçacığı modelleri", title: "Model 1: Çoktan Bire (Many-to-One)",
    lead: "Birçok kullanıcı iş parçacığı tek bir çekirdek iş parçacığına eşlenir. Yönetimi kullanıcı alanındaki bir kütüphane yapar.",
    nU: 4, nK: 1, links: [[0, 0], [1, 0], [2, 0], [3, 0]], caption: "K = kullanıcı iş parçacığı,  Ç = çekirdek iş parçacığı",
    pros: ["Hızlı: iş parçacığı geçişi çekirdeğe uğramadan yapılır.", "Çekirdek iş parçacığı olmayan bir işletim sisteminde bile çalışır."],
    cons: ["Bloke eden tek bir çağrı TÜM iş parçacıklarını durdurur.", "Paralellik yok: çekirdekte aynı anda tek iş parçacığı olabilir."],
    examples: "Örnekler: Solaris Green Threads, GNU Portable Threads. Bugün nadiren kullanılır.",
    notes: "Çekirdek tek bir zamanlanabilir varlık gördüğü için onu yalnızca tek bir çekirdekte çalıştırabilir. Herhangi bir iş parçacığı yavaş bir aygıttan read() yaparsa çekirdek bütün süreci uyutur. Çok çekirdekli işlemcilerden yararlanamadığı için bugün bu modeli kullanan sistem çok azdır.",
  });
  modelSlide({
    kicker: "Çoklu iş parçacığı modelleri", title: "Model 2: Birebir (One-to-One)",
    lead: "Her kullanıcı iş parçacığı kendi çekirdek iş parçacığına eşlenir. pthread_create() çekirdekten yeni bir iş parçacığı ister.",
    nU: 4, nK: 4, links: [[0, 0], [1, 1], [2, 2], [3, 3]], caption: "Her pthread_create(), çekirdeğin zamanladığı yeni bir iş parçacığı yaratır.",
    pros: ["Bloke eden bir çağrı yalnızca o iş parçacığını bloke eder.", "Çok çekirdekli işlemcilerde gerçek paralellik."],
    cons: ["Her kullanıcı iş parçacığı bir çekirdek iş parçacığına mal olur: yaratmak sistem çağrısı ister.", "Çok sayıda iş parçacığı çekirdeğe yük olabilir."],
    examples: "Linux (NPTL) ve Windows bu modeli kullanır — bugün programlarımızda göreceğimiz model.",
    notes: "Linux'ta pthread_create() clone() sistem çağrısını çağırır; her iş parçacığı çekirdekte kendi TID'sine sahip ayrı bir görevdir (task). ps -eLf'in her iş parçacığı için bir satır göstermesinin nedeni budur. Windows da her iş parçacığını birebir eşler.",
  });
  modelSlide({
    kicker: "Çoklu iş parçacığı modelleri", title: "Model 3: Çoktan Çoğa (Many-to-Many)",
    lead: "Birçok kullanıcı iş parçacığı, daha az ya da eşit sayıda çekirdek iş parçacığı üzerine çoğullanır.",
    nU: 5, nK: 3, links: [[0, 0], [1, 0], [2, 1], [3, 2], [4, 2]], caption: "Hangi kullanıcı iş parçacığının hangi çekirdek iş parçacığında çalışacağına kütüphane karar verir.",
    pros: ["İstediğiniz kadar kullanıcı iş parçacığını ucuza yaratabilirsiniz.", "Çok çekirdekte yine paraleldir; bloke eden bir çağrı her şeyi durdurmaz."],
    cons: ["Gerçeklemesi karmaşıktır: iki zamanlayıcı (kütüphane + çekirdek) uyum içinde çalışmalıdır."],
    examples: "Türevi iki düzeyli model: bir iş parçacığını 1:1 bağlamaya da izin verir. Modern biçimi: Go goroutine'leri, Java sanal iş parçacıkları.",
    notes: "Klasik örnekler, 9. sürümden önceki Solaris ve Windows ThreadFiber'dı. Genel amaçlı işletim sistemi çekirdekleri birebir modele geçti; çünkü çekirdek sayısı arttı ve çekirdek iş parçacıkları ucuzladı. Ama dil çalışma ortamları (Go, Java 21 sanal iş parçacıkları, Erlang) milyonlarca hafif görevi desteklemek için çoktan çoğa modeli kendileri gerçekler.",
  });

  // 18 ── modeller tablosu
  s = d.tableSlide({
    kicker: "Özet", title: "Üç Model Yan Yana",
    header: ["Model", "Kullanıcı : çekirdek", "Çok çekirdekte paralel mi?", "Bloke eden çağrı durdurur…", "Kullananlar"],
    colW: [2.3, 2.2, 2.55, 2.6, 2.5],
    rows: [
      ["Çoktan bire", "N : 1", "hayır", "tüm iş parçacıklarını", "Green threads (eski)"],
      ["Birebir", "1 : 1", "evet", "yalnızca o iş parçacığını", "Linux, Windows"],
      ["Çoktan çoğa", "N : M  (M ≤ N)", "evet", "yalnızca o iş parçacığını", "Go, Java sanal iş parçacıkları"],
    ],
    fontSize: 16,
    callout: "Linux ve Windows birebir modeli kullanır: pthread_create() ile yarattığınız her iş parçacığı, çekirdeğin zamanlayıcısında ayrı bir varlıktır.",
  });
  s.addNotes("Öğrencilerin bu tabloyu ezberden doldurabildiğinden emin olun. Sınavların gözdesi: çoktan bire model neden çok çekirdekten yararlanamaz? Çünkü çekirdek yalnızca tek bir çekirdek iş parçacığı görür.");

  // 19 ── İş parçacığı kütüphaneleri / Pthreads API
  s = d.tableSlide({
    kicker: "İş parçacığı kütüphaneleri", title: "POSIX İş Parçacıkları (Pthreads): Temel Çağrılar",
    lead: "Üç ana iş parçacığı kütüphanesi: POSIX Pthreads (Linux, macOS), Windows iş parçacığı API'si ve Java iş parçacıkları.",
    header: ["Çağrı", "Ne yapar?"],
    colW: [4.4, 7.75],
    rows: [
      ["pthread_create(&t, NULL, f, arg)", "f(arg) fonksiyonunu çalıştıran yeni bir iş parçacığı başlatır. Tutamacı t'ye yazılır."],
      ["pthread_join(t, &result)", "t iş parçacığı bitene kadar bekler (süreçlerdeki wait() gibi)."],
      ["pthread_exit(value)", "Çağıran iş parçacığını sonlandırır (f'den dönmek de aynı işi görür)."],
      ["pthread_self()", "Çağıran iş parçacığının kendi tutamacını döndürür."],
      ["gcc -pthread prog.c", "Pthreads kütüphanesiyle derler ve bağlar."],
    ],
    fontSize: 16,
    callout: "Pthreads bir gerçekleme değil, bir belirtimdir (POSIX standardı). Linux'ta glibc (NPTL) tarafından clone() sistem çağrısının üzerine gerçeklenir.",
  });
  s.addNotes("İş parçacığı fonksiyonunun imzası her zaman void *f(void *arg) biçimindedir: genel bir işaretçi alır ve genel bir işaretçi döndürür. Birden çok değer geçirmek için bir struct'a işaretçi verin. Java: sınıf Thread'den türetilir ya da Runnable'ı gerçekler; Linux'ta JVM, Java iş parçacıklarını çekirdek iş parçacıklarına birebir eşler.");

  // 20 ── thread_hello
  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 2: Üç İş Parçacığından Merhaba",
    code: code("thread_hello_excerpt.c"), size: 11, codeW: 7.1, sideTitle: "Neye dikkat edelim?",
    side: [
      "Tüm iş parçacıkları aynı PID'yi yazar: tek süreç.",
      "Her iş parçacığının kendi TID'si var (bir çekirdek iş parçacığı: birebir model).",
      "İş parçacıkları herhangi bir sırada biter: 3, 2'den önce yazdı!",
    ],
    run: { h: 2.6, size: 12, text:
`$ ./thread_hello
main    : PID = 6351, TID = 6351
thread 1: PID = 6351, TID = 6352
thread 3: PID = 6351, TID = 6354
thread 2: PID = 6351, TID = 6353
main    : all threads done,
          shared_counter = 3` },
  });
  s.addNotes("Derleme: gcc -Wall -O2 -pthread thread_hello.c -o thread_hello. Satırların sırası çalıştırmadan çalıştırmaya değişir: buna zamanlayıcı karar verir. Ana iş parçacığının TID'si PID'ye eşittir. shared_counter = 3, global değişkenin paylaşıldığını gösterir — ama kilitsiz shared_counter++ bir yarış durumudur; 3 iş parçacığıyla hatayı neredeyse hiç görmezsiniz, milyonlarca artırmada görürsünüz (5. hafta). Tam programda her iş parçacığı ayrıca 2 s uyur; böylece onu ps ile izleyebiliriz.");

  // 21 ── array_sum kodu
  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 3: Bir Diziyi T İş Parçacığıyla Toplamak",
    code: code("array_sum_excerpt.c"), size: 11, codeW: 7.1, sideTitle: "Veri paralelliği",
    side: [
      "100 milyon int (400 MB), T eşit dilime bölünür.",
      "k. iş parçacığı k. dilimi partial[k]'ya toplar — sonuçlar paylaşılmaz, kilit gerekmez.",
      "main() tüm iş parçacıklarını bekler (join) ve kısmi toplamları ekler.",
    ],
    run: { h: 1.9, size: 11.5, text:
`$ ./array_sum 1
threads = 1  sum = 9000000000  time = 1.686 s
$ ./array_sum 2
threads = 2  sum = 9000000000  time = 0.999 s` },
  });
  s.addNotes("Tam program, ölçülen süre kararlı olacak kadar uzun olsun diye diziyi 20 kez toplar; beklenen toplam 10^7 × 45 × 20 = 9 × 10^9'dur ve her çalıştırma bunu verir: bu bir doğruluk denetimidir. İş parçacığı fonksiyonu dilim numarası k'yı işaretçiye dönüştürülmüş olarak alır — küçük bir tamsayıyı geçirmenin yaygın bir hilesidir.");

  // 22 ── sonuçlar
  s = d.content({ kicker: "Uygulama", title: "Ölçüm: 2 Çekirdekte 1, 2 ve 4 İş Parçacığı", lead: "Test sanal makinemizde 9 çalıştırmanın ortancası ($ nproc → 2). Makine başka işlerle paylaşıldığından tek tek çalıştırmalar ±%30'a kadar değişti." });
  {
    const rows = [["1", "1,564 s", "1,00"], ["2", "0,932 s", "1,68"], ["4", "0,855 s", "1,83"]];
    const hdr = ["İş parçacığı T", "Süre (ortanca)", "Hızlanma"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 15 } }));
    const body = rows.map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: F.body, fontSize: 15, align: j ? "center" : "left" } })));
    s.addTable([hdr, ...body], { x: MX, y: 2.35, w: 6.0, colW: [2.0, 2.2, 1.8], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [6, 8, 6, 8], valign: "middle" });
    // hızlanma çubukları
    const bx = MX, by = 4.35, sc = 1.75;
    [["T=1", 1.0], ["T=2", 1.68], ["T=4", 1.83], ["ideal, 2 çekirdek", 2.0]].forEach(([l, v], i) => {
      const y = by + i * 0.58;
      d.text(s, l, { x: bx, y, w: 1.8, h: 0.45, fontSize: 12.5, bold: true, valign: "middle" });
      s.addShape(P.shapes.RECTANGLE, { x: bx + 1.8, y: y + 0.05, w: v * sc, h: 0.36, fill: { color: i === 3 ? C.light : C.mint }, line: i === 3 ? { color: C.slate, width: 1, dashType: "dash" } : { type: "none" } });
      d.text(s, tr2(v) + "×", { x: bx + 1.85 + v * sc, y, w: 0.8, h: 0.45, fontSize: 12, valign: "middle", color: C.charcoal });
    });
  }
  d.card(s, MX + 6.4, 2.35, 5.75, 4.5, { title: "Yorum", body: [
    { b: "2 iş parçacığı:", t: " 1,68× daha hızlı — iyi, ama ideal 2×'in altında." },
    { b: "4 iş parçacığı:", t: " pek daha iyi değil: yalnızca 2 çekirdek var, herhangi bir anda en çok 2 iş parçacığı çalışır." },
    { b: "Neden 2× değil?", t: " iş parçacıklarını yaratma ve bekleme, ortak bellek bant genişliği ve makinedeki diğer işler." },
    "Amdahl: 2 çekirdekte 1,68× sanki S ≈ 0,19 gibi davranır — \"seri kısım\" tüm bu ek yükleri içerir.",
  ], bodySize: 14 });
  s.addNotes("Dürüst sayılar: her biri 9 çalıştırmanın ortancası, aynı sanal makineyi başka işler de kullanırken ölçüldü. En iyi çalıştırmalar: 1,50 s, 0,76 s, 0,73 s. Amdahl'dan S'yi çözün: 1,68 = 1/(S + (1-S)/2) ise S = 2/1,68 - 1 ≈ 0,19. Burada sınırı koyan çoğunlukla bellek bant genişliğidir, bölünemeyen kod değil — Amdahl yasasının bir üst sınır ve bir model olduğunu hatırlatır. Meşgul bir makinede 4 iş parçacığı 2'den biraz hızlı olabilir, çünkü süreç işlemci zamanından daha büyük pay alır; ama çekirdek sayısının izin verdiğinden asla daha hızlı olamaz. Öğrenciler kendi dizüstü bilgisayarlarında denemeli (nproc çekirdek sayısını söyler).");

  // 23 ── iş parçacıklarını görmek
  s = d.content({ kicker: "Uygulama", title: "İş Parçacıklarını ps ve /proc ile Görmek" });
  d.code(s, MX, 1.65, 7.6, 5.2,
`$ ./thread_hello &      # iş parçacıkları 2 s uyur
$ ps -eLf | grep thread_hello
UID    PID  PPID   LWP  C NLWP CMD
root 27241 27234 27241  0    4 ./thread_hello
root 27241 27234 27243  0    4 ./thread_hello
root 27241 27234 27244  0    4 ./thread_hello
root 27241 27234 27245  0    4 ./thread_hello

$ ls /proc/27241/task
27241  27243  27244  27245

$ grep Threads /proc/27241/status
Threads:	4`, 12.5);
  d.card(s, MX + 7.9, 1.65, 4.25, 5.2, { title: "Çıktıyı okumak", body: [
    { b: "-L", t: " her iş parçacığı için bir satır gösterir." },
    { b: "PID", t: " tüm satırlarda aynı: tek süreç." },
    { b: "LWP", t: " (light-weight process, hafif süreç) = iş parçacığı kimliği." },
    { b: "NLWP", t: " = iş parçacığı sayısı: main + 3 işçi = 4." },
    "/proc/<pid>/task/ altında her iş parçacığı için bir klasör vardır.",
  ], bodySize: 14 });
  s.addNotes("Gerçek çıktı; sığması için bazı sütunlar (STIME, TTY, TIME) çıkarıldı. Şunları da deneyin: top -H (her iş parçacığı için bir satır) ya da iş parçacığı gösterimi açık htop. Windows'ta: Görev Yöneticisi > Ayrıntılar > sütun başlığına sağ tık > Sütunları seç > İş parçacıkları.");

  // 24 ── Mola
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Mola", subtitle: "Sırada işlemci zamanlayıcısı var: sıradaki kim çalışacak ve \"iyi\"yi nasıl ölçeriz?" });
  s.addNotes("Mola. Öğrenciler sorarsa: mola sırasında kendi Linux/WSL ortamınızda nproc ve ps -eLf komutlarını deneyin.");

  // ───────────────────────── BÖLÜM 2: ZAMANLAMA
  s = d.sectionSlide({ kicker: "Bölüm 2", title: "İşlemci Zamanlaması: Temel Kavramlar", subtitle: "Çok sayıda hazır iş parçacığı, az sayıda çekirdek: biri seçim yapmalı." });
  s.addNotes("Terimler: ders kitapları 'süreç zamanlaması' der; Linux ve Windows'ta çekirdek aslında iş parçacıklarını zamanlar. 2. bölümdeki her şey ikisi için de geçerlidir; ders kitabıyla uyumlu olmak için 'süreç' diyoruz.");

  // 26 ── İşlemci–G/Ç patlama döngüsü
  s = d.content({ kicker: "Zamanlamanın temelleri", title: "İşlemci–G/Ç Patlama Döngüsü", lead: "Bir süreç hesaplama (CPU patlaması, CPU burst) ile G/Ç beklemesi (G/Ç patlaması, I/O burst) arasında gidip gelir." });
  {
    const x0 = MX + 2.3, u = 0.32;
    const cpuB = (a, b) => ["CPU", a, b, C.mint];
    const ioB = (a, b) => ["G/Ç", a, b, C.light];
    d.text(s, "İşlemci yoğun", { x: MX, y: 2.45, w: 2.2, h: 0.6, fontSize: 15, bold: true, valign: "middle", color: C.charcoal });
    gantt(s, x0, 2.45, u, [cpuB(0, 11), ioB(11, 13), cpuB(13, 25), ioB(25, 27), cpuB(27, 30)], { size: 12 });
    d.text(s, "G/Ç yoğun", { x: MX, y: 3.4, w: 2.2, h: 0.6, fontSize: 15, bold: true, valign: "middle", color: C.charcoal });
    gantt(s, x0, 3.4, u, [cpuB(0, 2), ioB(2, 7), cpuB(7, 8.5), ioB(8.5, 14), cpuB(14, 16), ioB(16, 21), cpuB(21, 22.5), ioB(22.5, 28), cpuB(28, 30)], { size: 12 });
    d.arrow(s, x0, 4.2, x0 + 30 * u, 4.2, { w: 1.5 });
    d.text(s, "zaman", { x: x0 + 30 * u - 0.9, y: 4.25, w: 0.9, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "right" });
  }
  d.card(s, MX, 4.75, 3.9, 2.1, { title: "İşlemci yoğun (CPU-bound)", body: "Az sayıda, uzun CPU patlaması. Örnek: video kodlama, derleme, bilimsel benzetim.", bodySize: 14 });
  d.card(s, MX + 4.12, 4.75, 3.9, 2.1, { title: "G/Ç yoğun (I/O-bound)", body: "Çok sayıda kısa CPU patlaması, çoğunlukla bekleme. Örnek: metin düzenleyici, web sunucusu, dosya kopyalama.", bodySize: 14 });
  d.card(s, MX + 8.25, 4.75, 3.9, 2.1, { title: "Ölçülmüş gerçek", body: "CPU patlamalarının çoğu kısadır (birkaç ms); uzun olanlar azdır. Zamanlayıcılar buna göre tasarlanır.", bodySize: 14 });
  s.addNotes("Ders kitabındaki şekli çizin: yükle, sakla, topla, dosyadan oku → G/Ç'yi bekle → sakla, artır → dosyaya yaz → bekle... Patlama uzunluğu histogramı kabaca üsteldir: çok sayıda kısa patlama, uzun patlamalardan oluşan bir kuyruk. Süreç G/Ç beklerken işlemci boşta kalırdı — zamanlayıcı onu başka bir sürece vermedikçe. Çoklu programlamanın (1. hafta) bütün nedeni budur.");

  // 27 ── burst uygulaması
  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 4: time ile İşlemci Yoğun ve G/Ç Yoğun",
    code: code("burst_excerpt.c"), size: 13, codeW: 6.4, sideTitle: "real ile user + sys",
    side: [
      { b: "real:", t: " duvar saati süresi." },
      { b: "user / sys:", t: " kullanıcı / çekirdek modunda harcanan işlemci zamanı." },
      "İşlemci yoğun: real ≈ user + sys.",
      "G/Ç yoğun: real ≫ user + sys — sürecin zamanın yaklaşık %73'ünde beklediği, işlemcinin de başkalarına boş kaldığı anlamına gelir.",
    ],
    run: { h: 2.0, size: 12, text:
`$ time ./burst cpu
real 0m1.266s  user 0m1.197s  sys 0m0.001s
$ time ./burst io
real 0m0.384s  user 0m0.000s  sys 0m0.104s` },
  });
  s.addNotes("Gerçek çıktı; sığması için bash'in time çıktısının üç satırı birer satırda birleştirildi. G/Ç yoğun çalıştırmanın işlemci payı: (0,000+0,104)/0,384 = %27; yani geçen sürenin %73'ünde süreç fsync içinde bloke olmuş, diski bekliyordu. İşlemci zamanının neredeyse tamamının sys olduğuna dikkat edin: write ve fsync sistem çağrılarıdır. İşlemci yoğun çalıştırma 1 + 1/2 + ... + 1/400000000 ≈ 20,38 toplamını hesaplar.");

  // 28 ── kısa vadeli zamanlayıcı ve hazır kuyruğu
  s = d.content({ kicker: "Zamanlamanın temelleri", title: "İşlemci Zamanlayıcısı ve Hazır Kuyruğu", lead: "İşlemci her boşa çıktığında kısa vadeli zamanlayıcı (short-term scheduler) hazır kuyruğundan bir süreç seçer." });
  {
    const x = MX + 0.3, y = 3.0;
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w: 4.6, h: 1.0, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    ["PCB 7", "PCB 3", "PCB 9", "PCB 2"].forEach((p, i) => d.box(s, x + 0.15 + i * 1.1, y + 0.18, 1.0, 0.64, p, { fill: C.white, size: 12 }));
    d.text(s, "hazır kuyruğu", { x, y: y - 0.35, w: 2.5, h: 0.3, fontSize: 12, bold: true, color: C.mintDeep });
    d.arrow(s, x + 4.65, y + 0.5, x + 5.35, y + 0.5, { w: 2, color: C.mintDeep });
    d.box(s, x + 5.4, y, 1.5, 1.0, "CPU", { fill: C.mint, color: C.dark, size: 16 });
    d.text(s, "dağıt", { x: x + 4.55, y: y + 0.55, w: 0.95, h: 0.3, fontSize: 10, italic: true, color: C.mintDeep, align: "center" });
    // G/Ç bekleme kuyruğu
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y: y + 2.2, w: 4.6, h: 1.0, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    ["PCB 5", "PCB 1"].forEach((p, i) => d.box(s, x + 0.15 + i * 1.1, y + 2.38, 1.0, 0.64, p, { fill: C.white, size: 12 }));
    d.text(s, "G/Ç bekleme kuyruğu", { x, y: y + 3.25, w: 2.8, h: 0.3, fontSize: 12, bold: true, color: C.slate });
    // oklar: CPU -> bekleme kuyruğu (G/Ç isteği), bekleme -> hazır (G/Ç bitti), CPU -> hazır (zaman dilimi doldu)
    d.arrow(s, x + 6.15, y + 1.05, x + 6.15, y + 2.7, { w: 1.5 });
    d.arrow(s, x + 6.1, y + 2.7, x + 4.65, y + 2.7, { w: 1.5 });
    d.text(s, "G/Ç isteği", { x: x + 4.7, y: y + 2.3, w: 1.4, h: 0.3, fontSize: 11, italic: true, color: C.slate, align: "center" });
    line(s, x - 0.25, y + 2.7, x, y + 2.7, { w: 1.5 });
    line(s, x - 0.25, y + 0.5, x - 0.25, y + 2.7, { w: 1.5 });
    d.arrow(s, x - 0.25, y + 0.5, x - 0.02, y + 0.5, { w: 1.5 });
    d.text(s, "G/Ç bitti", { x: x + 0.05, y: y + 1.45, w: 1.2, h: 0.3, fontSize: 11, italic: true, color: C.slate });
    d.arrow(s, x + 6.9, y + 0.25, x + 6.9, y - 0.5, { w: 1.5 });
    line(s, x + 6.9, y - 0.5, x + 2.3, y - 0.5, { w: 1.5 });
    d.arrow(s, x + 2.3, y - 0.5, x + 2.3, y - 0.36, { w: 1.5 });
    d.text(s, "zaman dilimi doldu", { x: x + 4.0, y: y - 0.82, w: 2.8, h: 0.3, fontSize: 11, italic: true, color: C.slate, align: "right" });
  }
  d.card(s, MX + 7.6, 2.35, 4.55, 4.5, { title: "Önemli noktalar", body: [
    "Hazır kuyruğu (ready queue), şu anda çalışabilecek süreçlerin PCB'lerini tutar.",
    "Mutlaka FIFO değildir: bir öncelik kuyruğu, bir ağaç ya da bir liste olabilir. Sırayı belirlemek zamanlama algoritmasının işidir (5. hafta).",
    "Kısa vadeli zamanlayıcı çok sık (birkaç ms'de bir) çalışır; bu yüzden hızlı olmalıdır.",
  ], bodySize: 14 });
  s.addNotes("3. haftanın 5 durumlu diyagramını hatırlayın: hazır kuyruğu tam olarak 'hazır' durumdaki süreçleri tutar. Bekleyen süreçler aygıt kuyruklarında durur. Linux'un varsayılan zamanlayıcısı (CFS, çekirdek 6.6'dan beri EEVDF) hazır görevleri basit bir liste yerine bir kırmızı-siyah ağaçta tutar.");

  // 29 ── dört durum
  s = d.content({ kicker: "Zamanlamanın temelleri", title: "Zamanlayıcı Ne Zaman Karar Vermek Zorunda?", lead: "Süreç durum diyagramındaki dört durum bir zamanlama kararını tetikleyebilir." });
  {
    const x = MX, y = 2.45;
    const st = (lab, bx, by, fill = C.light) => d.box(s, bx, by, 1.75, 0.75, lab, { fill, size: 14, color: fill === C.mint ? C.dark : undefined });
    st("yeni", x, y);
    st("hazır", x + 1.3, y + 1.6);
    st("çalışıyor", x + 4.25, y + 1.6, C.mint);
    st("bekliyor", x + 2.8, y + 3.3);
    st("sonlandı", x + 4.25, y);
    d.arrow(s, x + 0.9, y + 0.78, x + 1.6, y + 1.57, { w: 1.5 });
    // hazır -> çalışıyor (dağıtım)
    d.arrow(s, x + 3.08, y + 1.8, x + 4.22, y + 1.8, { w: 1.5 });
    d.text(s, "dağıtım", { x: x + 3.05, y: y + 1.45, w: 1.2, h: 0.3, fontSize: 10, italic: true, color: C.slate, align: "center" });
    const num = (n, nx, ny) => {
      s.addShape(P.shapes.OVAL, { x: nx, y: ny, w: 0.42, h: 0.42, fill: { color: C.red }, line: { type: "none" } });
      d.text(s, String(n), { x: nx, y: ny, w: 0.42, h: 0.42, fontSize: 13, bold: true, color: C.white, align: "center", valign: "middle" });
    };
    // 2: çalışıyor -> hazır (kesme)
    d.arrow(s, x + 4.22, y + 2.15, x + 3.08, y + 2.15, { w: 2, color: C.red });
    num(2, x + 3.45, y + 2.3);
    // 1: çalışıyor -> bekliyor
    d.arrow(s, x + 4.7, y + 2.38, x + 4.2, y + 3.27, { w: 2, color: C.red });
    num(1, x + 4.75, y + 2.75);
    // 3: bekliyor -> hazır
    d.arrow(s, x + 3.0, y + 3.27, x + 2.4, y + 2.38, { w: 2, color: C.red });
    num(3, x + 2.05, y + 2.75);
    // 4: çalışıyor -> sonlandı
    d.arrow(s, x + 5.12, y + 1.57, x + 5.12, y + 0.78, { w: 2, color: C.red });
    num(4, x + 5.3, y + 0.95);
  }
  d.card(s, MX + 6.6, 2.35, 5.55, 4.5, { title: "Dört durum", body: [
    { b: "1. çalışıyor → bekliyor:", t: " G/Ç isteği ya da bir çocuk için wait()." },
    { b: "2. çalışıyor → hazır:", t: " bir kesme; örneğin zamanlayıcı saati zaman diliminin bittiğini bildirir." },
    { b: "3. bekliyor → hazır:", t: " G/Ç tamamlandı." },
    { b: "4. çalışıyor → sonlandı:", t: " süreç çıkar." },
    "1 ve 4'te işlemci boşalmıştır: yeni bir süreç seçilMELİDİR. 2 ve 3'te işletim sistemi geçiş yapmayı SEÇEBİLİR.",
  ], bodySize: 13.5 });
  s.addNotes("3. haftadaki beş durumlu diyagramın aynısını, bu kez numaralı kırmızı geçişlerle kullanın. 3. durum: daha yüksek öncelikli bir süreç hazır hâle gelince işletim sistemi işlemciyi çalışan süreçten almak isteyebilir. Bu bizi doğrudan sonraki slayta götürür: kesintili ve kesintisiz zamanlama.");

  // 30 ── kesintili / kesintisiz
  s = d.compareSlide({
    kicker: "Zamanlamanın temelleri", title: "Kesintisiz ve Kesintili Zamanlama",
    left: { title: "Kesintisiz (non-preemptive, iş birlikçi)", items: [
      "Zamanlama yalnızca 1. ve 4. durumlarda yapılır.",
      "Bir süreç işlemciyi aldığında, bloke olana ya da sonlanana kadar bırakmaz.",
      "Basittir, ama tek bir uzun süreç herkesi bekletebilir.",
      "Windows 3.x, klasik Mac OS (OS X öncesi).",
    ] },
    right: { title: "Kesintili (preemptive)", color: C.mintDeep, items: [
      "Zamanlama 2. ve 3. durumlarda da yapılır.",
      "İşletim sistemi işlemciyi (zamanlayıcı kesmesiyle) geri alabilir.",
      "Daha iyi yanıt verebilirlik; kontrolden çıkan bir program sistemi donduramaz.",
      "Tüm modern işletim sistemleri: Windows, macOS, Linux, Android, iOS.",
    ] },
    callout: "Kesintinin bedeli: bir iş parçacığı ortak veriyi güncellemenin tam ortasında kesilebilir → yarış durumları. Bu, 5. haftanın ikinci yarısının konusudur.",
  });
  s.addNotes("İş birlikçi zamanlama örneği: Windows 3.1'de işletim sistemini çağırmadan sonsuz döngüye giren bir program bütün bilgisayarı dondururdu. Linux, kullanıcı süreçleri için baştan beri kesintilidir; 2.6 sürümünden beri çekirdeğin kendisi de kesintilidir (preemptible kernel).");

  // 31 ── dağıtıcı
  s = d.content({ kicker: "Zamanlamanın temelleri", title: "Dağıtıcı ve Dağıtım Gecikmesi", lead: "Zamanlayıcı sırada KİMİN çalışacağına karar verir; dağıtıcı (dispatcher) işlemciyi o sürece fiilen verir." });
  d.card(s, MX, 2.35, 5.4, 2.95, { title: "Dağıtıcının üç görevi", body: [
    "Bağlam değişimi: eski sürecin durumunu PCB'sine kaydet, yenisininkini yükle.",
    "Kullanıcı moduna geç.",
    "Yeni programda doğru yere (kaydedilmiş PC'sine) atla.",
  ], bodySize: 14 });
  {
    const x0 = MX + 5.8, u = 0.5, y = 2.55;
    gantt(s, x0, y, u, [["P0 çalışıyor", 0, 4.5, C.mint], ["", 4.5, 7, C.red], ["P1 çalışıyor", 7, 12, C.charcoal]], { h: 0.75, size: 14 });
    d.text(s, "dağıtım\ngecikmesi", { x: x0 + 4.5 * u - 0.1, y: y + 0.82, w: 2.5 * u + 0.2, h: 0.55, fontSize: 12, bold: true, color: C.red, align: "center" });
    d.text(s, "P0 → PCB0 kaydet, PCB1 → P1 yükle", { x: x0, y: y + 1.45, w: 6.0, h: 0.3, fontSize: 12, italic: true, color: C.mutedOnLight, align: "center" });
  }
  d.callout(s, MX + 5.8, 4.6, 6.35, 0.7, "Dağıtım gecikmesi saf ek yüktür: bu sırada yararlı hiçbir iş yapılmaz.", 14);
  d.callout(s, MX, 5.55, 12.15, 1.3, "Küçüktür (mikrosaniyeler) ama çok sık yaşanır: vmstat 1 komutunu izleyin — boştaki test sanal makinemizde cs sütunu saniyede yaklaşık 500–600 bağlam değişimi gösterdi; meşgul bir sunucu on binlerce gösterir.", 14);
  s.addNotes("Zaman ekseni ölçekli değildir: dağıtım gecikmesi birkaç mikrosaniye, bir zaman dilimi birkaç milisaniyedir. vmstat sayıları gerçektir: boştaki 2 çekirdekli sanal makinemiz, iki ayrı bir saniyelik örnekte saniyede 487 ve 614 bağlam değişimi gösterdi.");

  // 32 ── gönüllü / zorunlu
  s = d.content({ kicker: "Uygulama", title: "Bağlam Değişimlerini Saymak: Gönüllü mü, Zorla mı?", lead: "GNU time -v, sürecin işlemciyi kaç kez kendisi bıraktığını (bloke oldu) ve kaç kez elinden alındığını raporlar." });
  d.code(s, MX, 2.3, 6.9, 4.55,
`$ /usr/bin/time -v ./burst cpu
  User time (seconds): 1.17
  System time (seconds): 0.01
  Elapsed (wall clock) time: 0:01.22
  Voluntary context switches: 1
  Involuntary context switches: 50

$ /usr/bin/time -v ./burst io
  User time (seconds): 0.00
  System time (seconds): 0.11
  Elapsed (wall clock) time: 0:00.46
  Voluntary context switches: 3714
  Involuntary context switches: 0`, 12.5);
  d.card(s, MX + 7.2, 2.3, 4.95, 4.55, { title: "Sonucu okumak", body: [
    { b: "Voluntary (gönüllü):", t: " süreç bloke oldu (1. durum) — G/Ç yoğun programlara özgü." },
    { b: "Involuntary (zorla):", t: " zamanlayıcı işlemciyi elinden aldı (2. durum) — işlemci yoğun programlara özgü." },
    "1,2 s'de 50 kesinti: işlemci yoğun program ortalama yaklaşık 24 ms'de bir kesildi.",
  ], bodySize: 14 });
  s.addNotes("Gerçek çıktı; time -v'nin diğer satırları çıkarıldı. 1,22 s / 50 ≈ 24 ms: kesintiler arası ortalama süre, yük altındaki bir Linux zaman diliminin mertebesindedir. G/Ç programı her fsync'te birden fazla kez bloke olur (günlük/journal yazımları); 1000 fsync çağrısına karşılık 3714 gönüllü geçiş bu yüzdendir. Çalışan bir sürecin canlı sayaçlarını /proc/<pid>/status içinde de okuyabilirsiniz (voluntary_ctxt_switches, nonvoluntary_ctxt_switches).");

  // 33 ── ölçütler tablosu
  s = d.tableSlide({
    kicker: "Zamanlama ölçütleri", title: "Bir Zamanlayıcıyı Nasıl Değerlendiririz? Beş Ölçüt",
    header: ["Ölçüt", "Tanım", "Hedef"],
    colW: [3.0, 7.25, 1.9],
    rows: [
      ["İşlemci kullanımı (CPU utilisation)", "İşlemcinin yararlı işle meşgul olduğu zamanın oranı (hafif yükte %40 … ağır yükte %90).", "en büyük"],
      ["Üretilen iş (throughput)", "Birim zamanda tamamlanan süreç sayısı.", "en büyük"],
      ["Dönüş süresi (turnaround)", "Gelişten (sunuluştan) tamamlanmaya kadar her şey: bekleme ve G/Ç dahil.", "en küçük"],
      ["Bekleme süresi (waiting)", "Hazır kuyruğunda geçen toplam süre. Zamanlayıcının doğrudan denetlediği tek kısım.", "en küçük"],
      ["Yanıt süresi (response)", "Gelişten, sürecin işlemciyi ilk kez aldığı ana (ilk yanıta) kadar.", "en küçük"],
    ],
    fontSize: 14.5,
    callout: "Genellikle ortalamayı iyileştiririz. Etkileşimli sistemlerde öngörülebilir (düşük varyanslı) bir yanıt süresi, düşük bir ortalamadan daha önemli olabilir.",
  });
  s.addNotes("Bekleme süresini vurgulayın: zamanlama algoritması bir sürecin ne kadar hesap yaptığını ya da G/Ç yaptığını değiştirmez; yalnızca hazır kuyruğunda ne kadar oturduğunu değiştirir. Yanıt süresini burada ilk kez işlemcide çalışmaya kadar geçen süre olarak tanımlıyoruz (Silberschatz: ilk yanıt üretilene kadar geçen süre; alıştırmalarda ilk çalışmayı kullanırız).");

  // 34 ── formüller
  s = d.content({ kicker: "Zamanlama ölçütleri", title: "Tanımların Formülleri", lead: "Tek CPU patlaması olan (G/Ç yapmayan) bir süreç için; tüm zamanlar aynı saatle ölçülür." });
  {
    const fx = MX, fy = 2.3;
    const f = (y, a, b, c) => d.text(s, [
      { text: "T", options: { bold: true } }, { text: a, options: { subscript: true, bold: true } },
      { text: "  =  T", options: {} }, { text: b, options: { subscript: true } },
      { text: "  −  T", options: {} }, { text: c, options: { subscript: true } },
    ], { x: fx + 0.3, y, w: 6.2, h: 0.6, fontSize: 22, fontFace: F.title, color: C.charcoal, valign: "middle" });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: fx, y: fy, w: 6.6, h: 2.15, fill: { color: C.light }, rectRadius: 0.06, line: { type: "none" } });
    f(fy + 0.1, "dönüş", "tamamlanma", "geliş");
    f(fy + 0.75, "bekleme", "dönüş", "patlama");
    f(fy + 1.4, "yanıt", "ilk çalışma", "geliş");
    // zaman çizelgesi
    const x0 = fx + 0.3, u = 0.5, y = 5.0;
    gantt(s, x0, y, u, [["bekler (hazır)", 0, 4, C.light], ["çalışır", 4, 7, C.mint], ["bekler", 7, 9, C.light], ["çalışır", 9, 11, C.mint]], { h: 0.55, ticks: [], size: 12 });
    [["geliş", 0], ["ilk çalışma", 4], ["tamamlanma", 11]].forEach(([l, t]) => {
      line(s, x0 + t * u, y - 0.3, x0 + t * u, y + 0.85, { color: C.red, w: 1.5, dash: "dash" });
      d.text(s, l, { x: x0 + t * u - 0.75, y: y + 0.9, w: 1.5, h: 0.3, fontSize: 11, bold: true, color: C.red, align: "center" });
    });
    d.text(s, "patlama = 3 + 2 = 5,   bekleme = 4 + 2 = 6,   dönüş = 11", { x: x0, y: y - 0.62, w: 6.2, h: 0.3, fontSize: 12, italic: true, color: C.mutedOnLight });
  }
  d.card(s, MX + 6.9, 2.3, 5.25, 4.55, { title: "Şekille sağlayalım", body: [
    "Dönüş = 11 − 0 = 11.",
    "Bekleme = 11 − 5 = 6  (= hazır kuyruğunda 4 + 2).",
    "Yanıt = 4 − 0 = 4.",
    "G/Ç patlamaları varsa bekleme süresi yalnızca HAZIR kuyruğundaki süredir; G/Ç süresini de çıkarın.",
  ], bodySize: 14 });
  s.addNotes("Şekil kesintiye uğrayan bir süreci gösteriyor: 3 birim çalışır, kesilir, 2 birim bekler, 2 birim daha çalışır. Birimler ms olabilir. Vurgulayın: böyle bir süreç için yanıt ≤ bekleme ≤ dönüş. Kesintisiz durumda bir süreç yalnızca bir kez bekler; dolayısıyla yanıt süresi = bekleme süresi.");

  // 35 ── çözümlü örnek: Gantt
  s = d.content({ kicker: "Çözümlü örnek", title: "Alıştırma: Geliş Sırasına Göre Dört Süreç (FCFS)", lead: "\"Akla ilk gelen\" sıra — ilk gelen ilk hizmet alır (first come, first served) — tek işlemci, kesinti yok. Süreler ms." });
  {
    const hdr = ["Süreç", "Geliş", "Patlama"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 15, align: "center" } }));
    const rows = [["P1", 0, 5], ["P2", 1, 3], ["P3", 2, 6], ["P4", 16, 2]].map((r, i) => r.map((t, j) => ({ text: String(t), options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontSize: 15, align: "center", fontFace: F.body } })));
    s.addTable([hdr, ...rows], { x: MX, y: 2.35, w: 4.2, colW: [1.4, 1.4, 1.4], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [6, 8, 6, 8], valign: "middle" });
    const x0 = MX + 4.8, u = 0.39, y = 2.65;
    d.text(s, "Gantt şeması", { x: x0, y: 2.25, w: 3, h: 0.3, fontSize: 13, bold: true, color: C.charcoal });
    gantt(s, x0, y, u, [["P1", 0, 5, C.mint], ["P2", 5, 8, C.charcoal], ["P3", 8, 14, C.slate], ["boş", 14, 16, C.white, C.mutedOnLight], ["P4", 16, 18, MINT_L]], { h: 0.75, ticks: [0, 5, 8, 14, 16, 18], size: 14, tickSize: 12 });
    s.addShape(P.shapes.RECTANGLE, { x: x0 + 14 * u, y, w: 2 * u, h: 0.75, fill: { type: "none" }, line: { color: C.slate, width: 1, dashType: "dash" } });
  }
  d.card(s, MX + 4.8, 4.0, 7.35, 2.85, { title: "Nasıl okunur?", body: [
    "P1 0'da gelir ve hemen çalışır. P2 ile P3, P1 çalışırken gelir: hazır kuyruğunda beklerler.",
    "14'te hazır kuyruğu boştur: P4 16'da gelene kadar işlemci boşta kalır.",
    "Sonraki slayt: bu şemadan her ölçütü hesaplayacağız.",
  ], bodySize: 14 });
  d.callout(s, MX, 4.75, 4.2, 2.1, "Asıl soruyu 5. hafta soracak: geliş sırası iyi bir sıra mı? (P2 ile P3'ün yerini değiştirip karşılaştırın.)", 13.5);
  s.addNotes("Gantt şemasını öğrencilerle birlikte tahtada kurun: her an hazır kuyruğunda kim var? t=0: P1 çalışır. t=1'de P2 gelir, bekler. t=2'de P3 gelir, bekler. t=5'te P1 biter -> P2 (önce o geldi). t=8 -> P3. t=14'te kuyruk boş, işlemci boşta. t=16'da P4 gelir, hemen çalışır, 18'de biter.");

  // 36 ── çözümlü örnek: sonuçlar
  s = d.tableSlide({
    kicker: "Çözümlü örnek", title: "Alıştırma: Ölçütleri Hesaplamak",
    header: ["Süreç", "Geliş", "Patlama", "Tamamlanma", "Dönüş = Tam. − Gel.", "Bekleme = Dön. − Pat.", "Yanıt"],
    colW: [1.3, 1.2, 1.3, 1.75, 2.35, 2.45, 1.8],
    rows: [
      ["P1", "0", "5", "5", "5 − 0 = 5", "5 − 5 = 0", "0"],
      ["P2", "1", "3", "8", "8 − 1 = 7", "7 − 3 = 4", "4"],
      ["P3", "2", "6", "14", "14 − 2 = 12", "12 − 6 = 6", "6"],
      ["P4", "16", "2", "18", "18 − 16 = 2", "2 − 2 = 0", "0"],
      ["Ortalama", "", "", "", "26 / 4 = 6,5 ms", "10 / 4 = 2,5 ms", "2,5 ms"],
    ],
    fontSize: 15,
    callout: "İşlemci kullanımı = 16 ms meşgul / 18 ms = %88,9.   Üretilen iş = 4 süreç / 18 ms ≈ ms başına 0,22 (saniyede 222).",
  });
  s.addNotes("Tüm sayılar küçük bir Python betiğiyle denetlendi. Başlıklardaki kısaltmalar: Tam. = tamamlanma, Gel. = geliş, Dön. = dönüş, Pat. = patlama. Burada yanıt = bekleme, çünkü zamanlama kesintisizdir: her süreç bir kez bekler, sonra sonuna kadar çalışır. Boşta geçen aralık kullanımı düşürür ama hiçbir sürecin bekleme süresini artırmaz. Sorun: P2 ile P3'ün yeri değişseydi ortalamalar ne olurdu? (Ödev olarak bırakın; gelecek hafta.)");

  // 37 ── hangi ölçüt önemli
  s = d.cardsSlide({
    kicker: "İyileştirme hedefleri", title: "Hangi Ölçüt Daha Önemli? Duruma Bağlı",
    lead: "İşlemci kullanımını ve üretilen işi en büyük; dönüş, bekleme ve yanıt süresini en küçük yap. Bu hedefler çatışır.",
    cards: [
      { title: "Toplu iş / sunucular", body: ["Üretilen iş ve işlemci kullanımı.", "Saatte yapılan toplam iş yüksek olduğu sürece uzun işler sorun değildir."] },
      { title: "Masaüstü / telefon", body: ["Yanıt süresi: kullanıcı tepkiyi hemen görmeli.", "Öngörülebilirlik: hep 50 ms, bazen 2 s'ye çıkan 5 ms'den daha iyi hissettirir."] },
      { title: "Gerçek zamanlı", body: ["Son tarihlere uymak her ortalamadan önemlidir.", "Geç = yanlış (frenler, insansız hava araçları, tıbbi cihazlar)."] },
    ], bodySize: 16,
    callout: "Ödünleşim örneği: çok sık geçiş yapmak yanıt süresini iyileştirir ama dağıtım ek yükünü artırır ve üretilen işi düşürür.",
  });
  s.addNotes("2. haftanın hedefleriyle bağlayın: yine kullanım kolaylığı ile verimlilik. Bir telefonun zamanlayıcısı ile bir süper bilgisayarınki farklı ölçütleri iyileştirir. Gelecek hafta: FCFS, SJF/SRTF, Öncelik, Round Robin — her biri bir Gantt şeması ve az önce hesapladığımız tabloyla.");

  // 38 ── kendiniz deneyin
  s = d.content({ kicker: "Kendiniz deneyin", title: "Kendi Makinenizde İş Parçacıkları ve Zamanlama" });
  d.code(s, MX, 1.65, 6.6, 5.2,
`# Linux (laboratuvar, WSL ya da sanal makine)
$ nproc                    # kaç çekirdek?
$ make                     # code/ klasöründe
$ ./array_sum 1; ./array_sum 2; ./array_sum 4
$ ./thread_hello & ps -eLf | grep thread_hello
$ time ./burst cpu ; time ./burst io
$ vmstat 1 5               # cs = geçiş/s

# Windows
# Görev Yöneticisi > Ayrıntılar > "İş parçacıkları"
# Görev Yöneticisi > Performans > CPU`, 13.5);
  d.card(s, MX + 6.9, 1.65, 5.25, 5.2, { title: "Yanıtlanacak sorular", body: [
    "Makinenizde kaç çekirdek var? 2, 4 ve 8 iş parçacığıyla hangi hızlanmayı elde ediyorsunuz?",
    "2 iş parçacığıyla elde ettiğiniz hızlanmadan Amdahl yasasıyla S'yi tahmin edin.",
    "Bilgisayarınızda en çok iş parçacığına sahip program hangisi?",
    "Bir sayfayı okurken tarayıcınız işlemci yoğun mu, G/Ç yoğun mu? Ya video oynatırken?",
  ], bodySize: 15 });
  s.addNotes("4 ya da 8 çekirdekli dizüstü bilgisayarı olan öğrencileri array_sum sürelerini Telegram kanalında paylaşmaya teşvik edin; gelecek hafta hızlanmaları karşılaştırabiliriz.");

  // 39 ── çıkarımlar
  s = d.content({ kicker: "Özet", title: "4. Hafta — Temel Çıkarımlar" });
  d.bullets(s, [
    { b: "İş parçacığı:", t: " kendi PC'si, yazmaçları ve yığıtı olan bir yürütme birimi; bir sürecin iş parçacıkları kodu, veriyi, öbeği ve dosyaları paylaşır." },
    { b: "Yararlar:", t: " yanıt verebilirlik, kaynak paylaşımı, ekonomi (burada yaratması ≈ 4× ucuz), çok çekirdekte ölçeklenebilirlik." },
    { b: "Amdahl yasası:", t: " hızlanma ≤ 1 / (S + (1 − S)/N); seri kısım S, 1/S sınırını koyar." },
    { b: "Modeller:", t: " çoktan bire, birebir (Linux, Windows), çoktan çoğa; Pthreads: pthread_create / pthread_join." },
    { b: "Zamanlamanın temelleri:", t: " işlemci–G/Ç patlamaları, hazır kuyruğu, dört karar noktası, kesintili ve kesintisiz zamanlama, dağıtım gecikmesi." },
    { b: "Ölçütler:", t: " kullanım ve üretilen işi en büyük; dönüş (tamamlanma − geliş), bekleme (dönüş − patlama) ve yanıt süresini en küçük yap." },
  ], { fontSize: 19, y: 1.75, h: 5.1, paraSpaceAfter: 20 });
  s.addNotes("Altı maddeyi yavaşça okuyun; öğrencilere en çok hangisini zor bulduklarını sorun.");

  // 40 ── kısa sınav
  s = d.quizSlide({ questions: [
    "Aynı sürecin iki iş parçacığı: paylaştıkları iki şeyi ve her birinin kendine özel iki şeyini sayın.",
    "Bir program %90 paraleldir. 4 çekirdekte en büyük hızlanma nedir? Sonsuz sayıda çekirdekte?",
    "Çoktan bire bir iş parçacığı kütüphanesi neden ikinci bir işlemci çekirdeğini kullanamaz?",
    "P1 (geliş 0, patlama 4) ve P2 (geliş 1, patlama 2) FCFS ile çalışıyor. Her birinin dönüş ve bekleme süresini bulun.",
  ] });
  s.addNotes("Yanıtlar: (1) Ortak: kod, global değişkenler/öbek, açık dosyalar; özel: PC, yazmaçlar, yığıt, TID. (2) S = 0,1: 1/(0,1 + 0,9/4) = 1/0,325 ≈ 3,08; sınır 1/0,1 = 10. (3) Çekirdek yalnızca tek bir çekirdek iş parçacığı görür; bu yüzden süreci tek bir çekirdekte zamanlar. (4) P1: 0-4, dönüş 4, bekleme 0. P2: 4-6, dönüş 6-1 = 5, bekleme 5-2 = 3.");

  d.closing({ nextWeek: "Zamanlama Algoritmaları ve Eşzamanlama", nextItems: [
    "Zamanlama algoritmaları: FCFS, SJF / SRTF, Öncelik, Round Robin",
    "Her algoritma için Gantt şemaları ve ortalama bekleme süreleri",
    "Yarış durumları ve kritik bölge problemi",
    "Muteks kilitleri ve semaforlar",
  ] });
  P._slides[P._slides.length - 2].addNotes("Gelecek hafta bugünkü ölçütleri dört algoritmayı karşılaştırmak için kullanacağız. Sonra thread_hello'daki shared_counter++ sorununa dönüp onu kilitlerle çözeceğiz.");
  lastSlide().addNotes("Sorular. Öğrencilere Telegram kanalını ve code klasöründe dört programın tamamının bir Makefile ile birlikte bulunduğunu hatırlatın.");

  await d.save(path.join(__dirname, "MBLP131_Hafta4.pptx"));
  console.log("slides:", d.n);
})();
