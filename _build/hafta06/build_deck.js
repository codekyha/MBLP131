// Hafta 6 sunumu (MBLP131, Türkçe): Bellek Yönetimi -- Bitişik Tahsis, Sayfalama ve Bölütleme
// İngilizce referans: ../week06/build_deck.js (aynı slayt sırası, aynı diyagramlar, aynı sayılar).
// Tüm sayılar code/verify.py ve code/fit.py ile doğrulanmıştır (İngilizce haftadan aynen alındı).
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("../lib/deck");
const d = new Deck({ week: 6, lang: "tr", assets: path.join(__dirname, "../lib") });
const code = f => fs.readFileSync(path.join(__dirname, "code", f), "utf8");
const P = d.pres;
const PALE = "D7E9E6", PROC = "C9D3D6", RED = C.red;

// ---------- küçük çizim yardımcıları ----------
function circle(s, x, y, dia, label, { fill = C.mint, color = C.dark, size = 20 } = {}) {
  s.addShape(P.shapes.OVAL, { x, y, w: dia, h: dia, fill: { color: fill }, line: { type: "none" } });
  d.text(s, label, { x, y, w: dia, h: dia, align: "center", valign: "middle", fontSize: size, bold: true, color, fontFace: F.title });
}
function dashedFrame(s, x, y, w, h, color = C.slate) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { type: "none" }, line: { color, width: 1.25, dashType: "dash" }, rectRadius: 0.06 });
}
function compare({ kicker, title, lead, left, right, callout, bodySize = 16.5, calloutSize = 14, notes }) {
  const s = d.content({ kicker, title, lead });
  const y0 = lead ? 2.3 : 1.65, h = (callout ? 5.75 : 6.85) - y0;
  d.card(s, MX, y0, 5.95, h, { title: left.title, body: left.items, titleColor: left.color, bodySize, titleSize: 17 });
  d.card(s, MX + 6.2, y0, 5.95, h, { title: right.title, body: right.items, titleColor: right.color, bodySize, titleSize: 17 });
  if (callout) d.callout(s, MX, 6.0, 12.15, 0.85, callout, calloutSize);
  return s;
}
function label(s, t, x, y, w, h, o = {}) {
  d.text(s, t, Object.assign({ x, y, w, h, fontSize: 12, color: C.mintDeep, bold: true }, o));
}

// yatay bellek çubuğu: segs = [{a, b, label, kind}], kind: os|proc|hole|new
function memBar(s, x, y, w, h, segs, total, { size = 11, below = true, minW = 0.42 } = {}) {
  const k = w / total;
  segs.forEach(g => {
    const sx = x + g.a * k, sw = (g.b - g.a) * k;
    const fill = { os: C.charcoal, proc: PROC, hole: C.white, new: C.mint }[g.kind];
    const line = g.kind === "hole" ? { color: C.slate, width: 1, dashType: "dash" } : { color: C.white, width: 0.75 };
    s.addShape(P.shapes.RECTANGLE, { x: sx, y, w: sw, h, fill: { color: fill }, line });
    const fg = g.kind === "os" ? C.white : g.kind === "hole" ? C.slate : C.dark;
    if (sw >= (g.kind === "hole" ? 0.42 : minW)) d.text(s, g.label, { x: sx, y, w: sw, h, fontSize: size, bold: g.kind !== "hole", color: fg, align: "center", valign: "middle" });
    else if (below) d.text(s, g.label, { x: sx - 0.3, y: y + h + 0.02, w: sw + 0.6, h: 0.25, fontSize: 10, color: C.slate, align: "center" });
  });
}

// ---------- ortak yerleştirme örneği (code/fit.py ile aynı veriler) ----------
const TOTAL = 2800;
const HOLES = [[300, 150], [600, 450], [1200, 200], [1600, 350], [2100, 550]];
const USED = [[0, 300, "İS", "os"], [450, 600, "P1", "proc"], [1050, 1200, "P2", "proc"], [1400, 1600, "P3", "proc"], [1950, 2100, "P4", "proc"], [2650, 2800, "P5", "proc"]];
const REQ = [["A", 220], ["B", 400], ["C", 130], ["D", 430]];
function simulate(rule) {
  const holes = HOLES.map(h => h.slice()), placed = [], waiting = [];
  for (const [n, sz] of REQ) {
    const fits = holes.map((h, i) => [h, i]).filter(([h]) => h[1] >= sz);
    if (!fits.length) { waiting.push(n); continue; }
    let pick = fits[0];
    if (rule === "best") pick = fits.reduce((m, c) => (c[0][1] < m[0][1] ? c : m));
    if (rule === "worst") pick = fits.reduce((m, c) => (c[0][1] > m[0][1] ? c : m));
    const h = holes[pick[1]];
    placed.push([h[0], h[0] + sz, n, "new"]);
    h[0] += sz; h[1] -= sz;
  }
  const segs = USED.concat(placed).map(([a, b, l, kind]) => ({ a, b, label: l, kind }));
  holes.filter(h => h[1] > 0).forEach(([a, sz]) => segs.push({ a, b: a + sz, label: String(sz), kind: "hole" }));
  return { segs, waiting, free: holes.reduce((t, h) => t + h[1], 0) };
}
const initialSegs = USED.map(([a, b, l, kind]) => ({ a, b, label: l, kind })).concat(HOLES.map(([a, sz]) => ({ a, b: a + sz, label: `${sz} KB`, kind: "hole" })));

(async () => {
  // 1 ── Başlık
  let s = d.titleSlide({
    kicker: "MBLP131  ·  HAFTA 6",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 6  ·  Bellek Yönetimi: Bitişik Tahsis, Sayfalama ve Bölütleme",
    tagline: "Birçok program, tek bir RAM: her süreç kendine ait, korunmuş bir bellek parçasını nasıl alır?",
  });
  s.addNotes("6. haftaya hoş geldiniz. 4. ve 5. haftalar işlemcinin zaman içinde paylaşılmasıyla ilgiliydi. Bugün ana belleğin alan olarak paylaşılmasını konuşuyoruz. İlk saat: temel donanım (taban ve sınır yazmaçları, bellek yönetim birimi MMU), takas ve bitişik bellek tahsisi ile onun parçalanma sorunu. İkinci saat: sayfalama, TLB ve bölütleme; ardından bir Linux makinesinde gerçek adreslere bakacağız.");

  // 2 ── Geçen hafta
  s = d.cardsSlide({
    kicker: "Geçen hafta", title: "Dört Fikirde 5. Hafta",
    cards: [
      { title: "Zamanlama algoritmaları", body: "FCFS, SJF/SRTF, Öncelik ve Round Robin; Gantt şemaları ve ortalama bekleme süresiyle karşılaştırıldı." },
      { title: "Zaman dilimi", body: "Çok küçük dilimli Round Robin zamanı bağlam değişimlerine harcar; çok büyük dilim FCFS'ye dönüşür." },
      { title: "Yarış durumları", body: "İş parçacıkları ortak veriyi eşgüdümsüz güncellerse sonuç zamanlamaya bağlı olur. Kritik bölge korunmalıdır." },
      { title: "Mutex ve semafor", body: "lock()/unlock() ve wait()/signal() karşılıklı dışlama sağlar; iş parçacıkları işlemciyi boşa yakmadan bekler." },
    ], cols: 4, bodySize: 15.5,
    callout: "5. hafta işlemciyi zaman içinde paylaştırdı. Bugün ana belleği alan olarak paylaştırıyoruz: RAM'de aynı anda birçok süreç, her biri diğerlerinden korunmuş.",
  });
  s.addNotes("Kısa tekrar, iki dakika. Bir öğrenciden ortalama bekleme süresi fikrini, bir başkasından yarış durumunun ne olduğunu isteyin. 2. haftaya bağlayın: zaman çoğullama (işlemci) ve alan çoğullama (bellek). Bugünkü konu alan çoğullama.");

  // 3 ── Gündem
  s = d.content({ kicker: "Hafta 6", title: "Bugünün Gündemi" });
  [
    ["1", "Temeller", "Adres bağlama, mantıksal ve fiziksel adres, MMU, taban ve sınır yazmaçları, takas."],
    ["2", "Bitişik tahsis", "Delikler, ilk uyan / en iyi uyan / en kötü uyan, parçalanma, sıkıştırma."],
    ["3", "Sayfalama", "Sayfa ve çerçeve, sayfa tablosu, adres çevirisi, TLB, etkin erişim süresi."],
    ["4", "Bölütleme", "Belleğe programcının gözüyle bakış, bölüt tablosu ve x86-64 Linux'un gerçekte yaptığı."],
    ["5", "Uygulama", "Linux'ta gerçek adresler: /proc/self/maps, fork() ve iki kez aynı adres."],
  ].forEach((a, i) => {
    const y = 1.7 + i * 1.0;
    d.box(s, MX, y, 0.8, 0.8, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 1.0, y, w: 11.15, h: 0.8, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "   ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.3, y, w: 10.7, h: 0.8, valign: "middle" });
  });
  s.addNotes("Molanın öncesinde 1. ve 2. bölüm, sonrasında sayfalama ve bölütleme, en sonda canlı gösterim. Bugün anlatılan her şey donanım ile işletim sisteminin birlikte yaptığı işlerdir; gelecek haftanın konusu olan sanal bellek doğrudan sayfalamanın üzerine kurulur.");

  // ───────────────────────── BÖLÜM 1
  s = d.sectionSlide({ kicker: "Bölüm 1", title: "Bellek Yönetiminin Temelleri", subtitle: "Tek bir RAM'de birçok süreç ve hiçbiri bir başkasının belleğine dokunamaz." });
  s.addNotes("1. bölüm: sorun ve en basit donanım çözümü.");

  s = d.cardsSlide({
    kicker: "Motivasyon", title: "Bellek Neden Yönetilmeli?",
    lead: "İşlemci yalnızca ana bellekteki komutları yürütebilir ve verileri okuyabilir (yazmaçlar ve önbellek, RAM'in kopyalarıdır).",
    cards: [
      { title: "Aynı anda birçok süreç", body: ["Çoklu programlama (1. hafta), işlemci boş kalmasın diye RAM'de birkaç süreç tutar.", "RAM'in hangi kısmı kime verilecek?"] },
      { title: "Koruma", body: ["Bir süreç başka bir sürecin ya da çekirdeğin belleğini okuyamamalı, üzerine yazamamalı.", "Her erişimi yazılımla denetlemek çok yavaştır: bunu donanım yapmalıdır."] },
      { title: "Yer değiştirme", body: ["Program RAM'in neresine yükleneceğini önceden bilmez.", "Hatta çalışırken başka bir yere taşınabilir."] },
    ],
    bodySize: 15.5,
    callout: "Hatırlatma: her sürecin düzeni metin · veri · öbek (heap) · yığıt (stack) şeklindedir (3. hafta). Bugünkü soru: bu baytlar RAM'de gerçekte nerede durur?",
  });
  s.addNotes("Bellek hiyerarşisinden (2. hafta): işlemci yazmaçlara ve RAM'e doğrudan erişir; disklere ise yalnızca G/Ç yoluyla. Bu yüzden bir programın çalışabilmesi için RAM'de olması gerekir. Üç gereksinim var: RAM'i birçok süreç arasında paylaştırmak, süreçleri birbirinden korumak ve programların herhangi bir yere yüklenebilmesine izin vermek. Sorun: korumanın olmadığı MS-DOS'ta (2. hafta) ne olur? Tek bir hatalı işaretçi makineyi çökertir.");

  // Adres bağlama
  s = d.content({ kicker: "Adres bağlama", title: "Bir Ad Ne Zaman Adrese Dönüşür?", lead: "Program değişkenlere adlarıyla başvurur; donanım ise sayılara ihtiyaç duyar. Bağlama üç farklı zamanda yapılabilir." });
  {
    const y = 2.4, bw = 2.05, gap = 0.97;
    const st = [["Kaynak program", "count.c", C.light], ["Nesne modülü", "count.o", PALE], ["Yürütülebilir dosya", "count (diskte)", PALE], ["Bellekteki süreç", "çalışıyor", C.mint]];
    const tools = ["derleyici", "bağlayıcı", "yükleyici"];
    st.forEach((b, i) => {
      const x = MX + i * (bw + gap);
      d.box(s, x, y, bw, 0.95, b[0], { sub: b[1], fill: b[2], color: C.dark, size: 13.5 });
      if (i < 3) {
        d.arrow(s, x + bw + 0.04, y + 0.48, x + bw + gap - 0.04, y + 0.48, { w: 1.75 });
        d.text(s, tools[i], { x: x + bw, y: y + 0.05, w: gap, h: 0.3, fontSize: 11, italic: true, color: C.slate, align: "center" });
      }
    });
  }
  [
    ["Derleme zamanı", "Son konum biliniyorsa derleyici mutlak adresler üretebilir. Programı taşımak yeniden derlemek demektir. (MS-DOS .COM dosyaları)"],
    ["Yükleme zamanı", "Derleyici yer değiştirebilir kod üretir (\"başlangıçtan 14 bayt ötede\"); adresleri yükleyici düzeltir. Yüklendikten sonra program taşınamaz."],
    ["Yürütme zamanı", "Adresler her erişimde donanım tarafından çevrilir; süreç çalışırken taşınabilir. Tüm modern işletim sistemleri bunu kullanır."],
  ].forEach((c, i) => d.card(s, MX + i * 4.12, 3.75, 3.9, 3.1, { title: c[0], body: c[1], bodySize: 15, titleColor: i === 2 ? C.mintDeep : C.slate }));
  s.addNotes("Örnek: C kaynağındaki 'count' bir addır. Derleyici onu 'veri bölümümde 14. konum' biçimine çevirebilir (yer değiştirebilir kod). Program 74000 adresine yüklenirse yükleyici bunu 74014 yapabilir (yükleme zamanında bağlama). Yürütme zamanında bağlamada ise program 14'ü kullanmaya devam eder ve donanım her erişimde başlangıç adresini ekler. Bu sonuncusu özel bir donanım gerektirir: MMU, sonraki slaytlar.");

  s = compare({
    kicker: "İki tür adres", title: "Mantıksal ve Fiziksel Adres",
    left: { title: "Mantıksal (sanal) adres", items: [
      "Program çalışırken işlemcinin ürettiği adres.",
      "Programın (ve printf(\"%p\") ile sizin) gördüğü adres.",
      "Her süreç 0 adresinden başlayabilir.",
      { b: "Mantıksal adres uzayı:", t: " bir sürecin tüm mantıksal adreslerinin kümesi." },
      "Örnek: sonraki slayttaki MMU örneğinde 346; C programımızın yazdırdığı 0x55f2….",
    ] },
    right: { title: "Fiziksel adres", color: C.slate, items: [
      "Bellek yoluna (bus) gerçekten konan adres.",
      "Yalnızca bellek donanımı görür.",
      "RAM'in her baytının tek bir fiziksel adresi vardır.",
      { b: "Fiziksel adres uzayı:", t: " bunlara karşılık gelen fiziksel adreslerin kümesi." },
      "Örnek: 14346, yani mantıksal 346'nın RAM'de gerçekte vardığı yer.",
    ] },
    bodySize: 15.5, calloutSize: 13,
    callout: "Derleme ya da yükleme zamanında bağlamada ikisi aynıdır. Yürütme zamanında bağlamada farklıdır ve birini diğerine bir donanım birimi, bellek yönetim birimi (memory-management unit, MMU) çevirir.",
  });
  s.addNotes("Haftanın en önemli ayrımı. Kullanıcı programı fiziksel adresleri hiçbir zaman görmez. Uygulama bölümünde iki süreç, farklı veriler için aynı mantıksal adresi yazdıracak: bu ancak mantıksal adres fiziksel adres olmadığı için mümkündür.");

  // Yer değiştirme yazmaçlı MMU
  s = d.content({ kicker: "Donanım", title: "Yer Değiştirme Yazmaçlı MMU", lead: "En basit MMU, işlemcinin ürettiği her adrese bir yer değiştirme (taban) yazmacının değerini ekler." });
  {
    const y = 3.6;
    d.box(s, MX, y, 1.6, 1.2, "İşlemci", { fill: C.charcoal, size: 17 });
    dashedFrame(s, 3.05, 2.35, 3.3, 3.25);
    d.text(s, "MMU", { x: 3.2, y: 5.2, w: 1.0, h: 0.3, fontSize: 12, bold: true, color: C.slate });
    d.box(s, 3.3, 2.5, 2.8, 0.85, "14000", { sub: "yer değiştirme yazmacı", fill: PALE, color: C.dark, size: 17 });
    circle(s, 4.3, y + 0.2, 0.8, "+");
    d.arrow(s, 4.7, 3.37, 4.7, y + 0.18, { w: 1.75 });
    d.arrow(s, MX + 1.62, y + 0.6, 4.28, y + 0.6, { w: 1.75 });
    label(s, "mantıksal\nadres  346", MX + 1.7, y + 0.72, 1.6, 0.6, { fontSize: 12 });
    d.arrow(s, 5.12, y + 0.6, 6.95, y + 0.6, { w: 1.75 });
    label(s, "fiziksel\nadres  14346", 5.15, y + 0.72, 1.8, 0.6, { fontSize: 12 });
    d.box(s, 7.0, 2.35, 1.2, 4.0, "Bellek", { fill: C.light, size: 14 });
  }
  d.card(s, 8.55, 2.35, 4.2, 4.5, { title: "Bunun anlamı", body: [
    "Program 0 … 2999 adreslerinde çalıştığını sanır.",
    "İşletim sistemi onu 14000'e yükledi ve yer değiştirme yazmacına 14000 yazdı.",
    "Süreci taşımak için işletim sistemi onu kopyalar ve tek bir yazmacı değiştirir.",
    "Bu yazmacı yüklemek ayrıcalıklı bir komuttur: yalnızca çekirdek yapabilir (2. hafta).",
  ], bodySize: 13.5 });
  s.addNotes("Adım adım anlatın: işlemci '346 adresinden oku' komutunu yürütür. MMU, her bir bellek erişiminde, donanımda, anında 14000 ekler; yazılım ek yükü yoktur. Bu, yürütme zamanında bağlamadır. Sayılar Silberschatz'ın klasik örneğinden.");

  // taban + sınır ile koruma
  s = d.content({ kicker: "Koruma", title: "Taban ve Sınır Yazmaçları: Koruma Denetimi", lead: "İkinci bir yazmaç, sınır (limit), sürecin boyunu tutar. Her erişim, yer değiştirmeden önce denetlenir." });
  {
    const y = 3.75;
    d.box(s, MX, y, 1.4, 1.1, "İşlemci", { fill: C.charcoal, size: 15 });
    d.box(s, 2.75, 2.35, 2.2, 0.8, "sınır (limit)", { sub: "3000", fill: PALE, color: C.dark, size: 14, subSize: 13 });
    d.box(s, 6.05, 2.35, 2.2, 0.8, "taban (base)", { sub: "14000", fill: PALE, color: C.dark, size: 14, subSize: 13 });
    s.addShape(P.shapes.DIAMOND, { x: 2.75, y: y - 0.2, w: 2.2, h: 1.5, fill: { color: C.mint }, line: { type: "none" } });
    d.text(s, "mantıksal\n< sınır ?", { x: 2.75, y: y - 0.2, w: 2.2, h: 1.5, fontSize: 12.5, bold: true, color: C.dark, align: "center", valign: "middle" });
    d.arrow(s, 3.85, 3.17, 3.85, y - 0.22, { w: 1.5 });
    d.arrow(s, MX + 1.42, y + 0.55, 2.73, y + 0.55, { w: 1.75 });
    label(s, "mantıksal", MX + 1.42, y + 0.6, 1.3, 0.3, { fontSize: 11 });
    circle(s, 6.75, y + 0.15, 0.8, "+");
    d.arrow(s, 7.15, 3.17, 7.15, y + 0.13, { w: 1.5 });
    d.arrow(s, 4.97, y + 0.55, 6.73, y + 0.55, { w: 1.75 });
    label(s, "evet", 5.3, y + 0.15, 0.8, 0.3);
    d.arrow(s, 7.57, y + 0.55, 8.6, y + 0.55, { w: 1.75 });
    label(s, "fiziksel", 7.55, y + 0.6, 1.1, 0.3);
    d.box(s, 8.65, 2.35, 1.0, 4.5, "Bellek", { fill: C.light, size: 12 });
    d.arrow(s, 3.85, y + 1.32, 3.85, 6.0, { color: RED, w: 1.75 });
    label(s, "hayır", 4.0, y + 1.4, 0.8, 0.3, { color: RED });
    d.box(s, 2.35, 6.02, 3.8, 0.8, "İşletim sistemine TUZAK (trap)", { sub: "adresleme hatası → süreç sonlandırılır", fill: RED, color: C.white, size: 12.5, subSize: 11 });
  }
  d.card(s, 9.95, 2.35, 2.8, 4.5, { title: "Kurallar", body: [
    "Geçerli: 0 ≤ mantıksal < sınır.",
    "Fiziksel = taban + mantıksal.",
    "Bu yazmaçları yalnızca çekirdek yükleyebilir.",
    "Linux'ta tuzak \"Segmentation fault\" olarak görünür.",
  ], bodySize: 13 });
  s.addNotes("Gerçek donanımda denetim ve toplama paralel olarak, her erişimde yapılır. Denetim başarısız olursa işlemci bir tuzak (trap) üretir (2. hafta: tuzak, yazılım kaynaklı bir kesmedir) ve işletim sistemi genellikle süreci sonlandırır. Linux'taki ünlü 'Segmentation fault (core dumped)' iletisi tam olarak bu türden bir tuzaktır; bugün bir sınır yazmacı yerine sayfalama donanımı tarafından üretilir.");

  s = d.tableSlide({
    kicker: "Çözümlü örnek", title: "Onluk ve Onaltılık Tabanda Taban ve Sınır",
    header: ["Taban", "Sınır", "Mantıksal adres", "Denetim: mantıksal < sınır?", "Sonuç"],
    colW: [1.9, 1.7, 2.3, 3.15, 3.1],
    rows: [
      ["14000", "3000", "346", "346 < 3000  ✓", "fiziksel 14346"],
      ["14000", "3000", "2999", "2999 < 3000  ✓", "fiziksel 16999 (son geçerli bayt)"],
      ["14000", "3000", "3500", "3500 < 3000  ✗", "TUZAK: adresleme hatası"],
      ["0x4000", "0x1000", "0x02A4", "0x02A4 < 0x1000  ✓", "fiziksel 0x42A4  (= 17060)"],
      ["0x4000", "0x1000", "0x1200", "0x1200 < 0x1000  ✗", "TUZAK: adresleme hatası"],
    ],
    fontSize: 14.5, y: 1.7,
    callout: "Süreç tam olarak [taban, taban + sınır) fiziksel aralığına sahiptir: onluk tabanda 14000 … 16999, onaltılıkta 0x4000 … 0x4FFF (0x4000 = 16384, 0x1000 = 4096).",
  });
  {
    const y = 4.6, x0 = MX, w = 12.15, tot = 20000, k = w / tot;
    d.text(s, "fiziksel bellek (onluk satır): süreç yalnızca nane yeşili aralığa dokunabilir", { x: x0, y: y - 0.38, w: 9, h: 0.3, fontSize: 12, italic: true, color: C.mutedOnLight });
    [[0, 14000, "diğer süreçler / işletim sistemi", PROC, C.dark], [14000, 17000, "14000 … 16999", C.mint, C.dark], [17000, 20000, "TUZAK", "F3DAD7", RED]].forEach(([a, b, t, f, c]) => {
      s.addShape(P.shapes.RECTANGLE, { x: x0 + a * k, y, w: (b - a) * k, h: 0.7, fill: { color: f }, line: { color: C.white, width: 1 } });
      d.text(s, t, { x: x0 + a * k, y, w: (b - a) * k, h: 0.7, fontSize: 13, bold: true, color: c, align: "center", valign: "middle" });
    });
    [[14000, "taban"], [17000, "taban + sınır"]].forEach(([a, t]) => d.text(s, `${t} = ${a}`, { x: x0 + a * k - 1.2, y: y + 0.74, w: 2.4, h: 0.3, fontSize: 11, color: C.slate, align: "center" }));
  }
  s.addNotes("Onaltılık satırı tahtada yapın: tabanın alt basamakları sıfır olduğu için 0x4000 + 0x02A4 = 0x42A4; yani ofseti alt basamaklara yazmanız yeterli. Onluk tabanda kontrol: 16384 + 676 = 17060. Sorun: onaltılık tabanda son geçerli mantıksal adres nedir? 0x0FFF; fiziksel karşılığı 0x4FFF.");

  // Takas
  s = d.content({ kicker: "Takas", title: "Takas (Swapping): Bütün Süreci Diske Taşımak", lead: "RAM dolarsa işletim sistemi bir süreci yardımcı belleğe (backing store, disk) kopyalayıp daha sonra geri getirebilir." });
  {
    const x = MX, y = 2.45;
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.6, h: 4.35, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, "ana bellek", { x, y: y + 0.08, w: 2.6, h: 0.3, fontSize: 12, bold: true, color: C.charcoal, align: "center" });
    d.box(s, x + 0.2, y + 0.45, 2.2, 0.8, "İS", { fill: C.charcoal, size: 14 });
    d.box(s, x + 0.2, y + 1.45, 2.2, 1.0, "P1", { fill: C.mint, size: 15, color: C.dark });
    d.box(s, x + 0.2, y + 2.65, 2.2, 1.4, "kullanıcı alanı", { fill: C.white, size: 12, bold: false, color: C.slate });
    s.addShape(P.shapes.CAN, { x: x + 4.35, y: y + 0.85, w: 2.2, h: 2.9, fill: { color: C.charcoal }, line: { type: "none" } });
    d.text(s, "yardımcı bellek\n(disk)", { x: x + 4.35, y: y + 1.0, w: 2.2, h: 0.7, fontSize: 12, bold: true, color: C.white, align: "center" });
    d.box(s, x + 4.6, y + 1.85, 1.7, 0.6, "P2", { fill: PALE, size: 14, color: C.dark });
    d.arrow(s, x + 2.65, y + 1.7, x + 4.55, y + 1.9, { w: 2, color: C.mintDeep });
    label(s, "① P1 dışarı", x + 2.75, y + 1.2, 1.7, 0.3);
    d.arrow(s, x + 4.55, y + 2.35, x + 2.65, y + 3.2, { w: 2, color: C.mintDeep });
    label(s, "② P2 içeri", x + 2.75, y + 3.15, 1.7, 0.3);
  }
  d.code(s, 7.45, 2.45, 5.3, 2.2,
`Süreç boyu        100 MB
Disk aktarımı      50 MB/s

dışarı: 100 / 50 = 2 s
içeri : 100 / 50 = 2 s
toplam ≈ 4 s   (+ disk gecikmesi)`, 13.5);
  d.callout(s, 7.45, 4.85, 5.3, 1.95, "4 s, 10 ms'lik 400 Round Robin dilimi demektir! Bu yüzden modern sistemler bütün süreçleri değil, tek tek sayfaları takas eder (50 MB/s'de 4 KB ≈ 80 µs), bkz. 7. hafta.", 13.5);
  s.addNotes("Takas süresine aktarım süresi hâkimdir ve taşınan bellek miktarıyla orantılıdır. 50 MB/s hızla 100 MB, her yön için 2 s sürer. 10-100 ms'lik bir zaman dilimiyle (5. hafta) karşılaştırıldığında bu çok büyüktür. Bütün süreçlerin standart takası bugün yalnızca acil durumlarda kullanılır; Linux, Windows ve macOS sayfaları takas eder (sayfalama, 3. bölüm ve 7. hafta). Mobil işletim sistemleri (iOS, Android) genellikle hiç takas yapmaz; bunun yerine arka plandaki uygulamaları sonlandırır. 4096 B / 50e6 B/s = 82 µs.");

  // Bitişik tahsis
  s = d.content({ kicker: "Bitişik tahsis", title: "Değişken Bölümler ve Delik Listesi", lead: "Her süreç tam ihtiyacı kadar, bitişik tek bir blok alır. Süreçler arasındaki boş bloklara delik (hole) denir." });
  memBar(s, MX, 2.55, 12.15, 0.95, initialSegs, TOTAL, { size: 12 });
  [0, 300, 600, 1050, 1200, 1600, 2100, 2800].forEach(a => d.text(s, String(a), { x: MX + a * 12.15 / TOTAL - 0.4, y: 3.53, w: 0.8, h: 0.25, fontSize: 10, color: C.mutedOnLight, align: "center" }));
  d.text(s, "adres (KB)", { x: MX + 12.15 - 1.5, y: 2.2, w: 1.5, h: 0.3, fontSize: 10, italic: true, color: C.mutedOnLight, align: "right" });
  d.card(s, MX, 4.05, 5.95, 2.8, { title: "İşletim sisteminin tuttuğu delik listesi", body: [
    "Her deliğin (başlangıç, boy) çifti, burada adres sırasıyla:",
    "(300, 150) · (600, 450) · (1200, 200) · (1600, 350) · (2100, 550)",
    "Toplam boş: 1700 KB, 5 parça hâlinde.",
  ], bodySize: 14 });
  d.card(s, MX + 6.2, 4.05, 5.95, 2.8, { title: "İşletim sistemi ne yapar?", body: [
    { b: "Süreç gelince:", t: " yeterince büyük bir delik bulur, gerekeni alır, kalanı daha küçük bir delik olarak bırakır." },
    { b: "Süreç bitince:", t: " bloğu deliğe dönüşür; komşu deliklerle birleştirilir." },
  ], bodySize: 14 });
  s.addNotes("Bu bizim sürekli kullanacağımız örneğimiz; aynı bellek sonraki üç slaytta da görünüyor. Bellek 2800 KB (sayılar okunaklı kalsın diye oyuncak bir boyut). En altta işletim sistemi (İS), beş süreç P1..P5 ve beş delik var. İşletim sistemi bir delik listesi tutar. Soru şu: yeni gelen süreç hangi deliği almalı?");

  s = d.content({ kicker: "Yerleştirme", title: "İlk Uyan, En İyi Uyan, En Kötü Uyan", lead: "Dört süreç bu sırayla geliyor: A = 220 KB, B = 400 KB, C = 130 KB, D = 430 KB. Her biri hangi deliği alır?" });
  [
    ["İlk uyan (first-fit)", "Yeterince büyük ilk deliği (en düşük adresli) al.", "Hızlı: arama erken durabilir."],
    ["En iyi uyan (best-fit)", "Yeterince büyük en küçük deliği al.", "En küçük artığı bırakır; tüm listeyi taramalı (ya da listeyi boya göre sıralı tutmalı)."],
    ["En kötü uyan (worst-fit)", "En büyük deliği al.", "Fikir: artık işe yarayacak kadar büyük kalır. O da her şeyi taramalı."],
  ].forEach((c, i) => d.card(s, MX + i * 4.12, 2.4, 3.9, 2.55, { title: c[0], body: [c[1], c[2]], bodySize: 13.5, titleSize: 15.5 }));
  d.code(s, MX, 5.2, 6.4, 1.65,
`delikler (boy@başlangıç, KB):
150@300  450@600  200@1200  350@1600  550@2100

A = 220:  ilk → 450@600   en iyi → 350@1600
          en kötü → 550@2100`, 12.5);
  d.callout(s, MX + 6.65, 5.2, 5.5, 1.65, "Benzetimler (Silberschatz): ilk uyan ve en iyi uyan, hem zaman hem bellek kullanımında en kötü uyandan iyidir; ilk uyan genellikle daha hızlıdır.", 13.5);
  s.addNotes("A isteğini tahtada birlikte yapın: ilk uyan düşük adreslerden başlar: 150 küçük, 450 sığıyor -> 600'deki delik. En iyi uyan: sığan delikler 450, 350, 550; en küçüğü 350 -> 1600'deki delik. En kötü uyan: en büyüğü, 550 -> 2100'deki delik. Sonra sonraki slaydı göstermeden önce öğrencilere B, C ve D'yi ikişerli gruplarda 3 dakikada yaptırın. Sonuçlar code/fit.py ile doğrulandı.");

  s = d.content({ kicker: "Yerleştirme: sonuç", title: "Aynı İstekler, Üç Farklı Sonuç" });
  {
    const rules = [["İlk uyan", "first"], ["En iyi uyan", "best"], ["En kötü uyan", "worst"]];
    rules.forEach(([name, r], i) => {
      const y = 1.75 + i * 1.5;
      const res = simulate(r);
      d.text(s, name, { x: MX, y, w: 1.65, h: 0.8, fontSize: 14.5, bold: true, fontFace: F.title, color: C.charcoal, valign: "middle" });
      memBar(s, MX + 1.7, y, 7.0, 0.8, res.segs, TOTAL, { size: 10.5, minW: 0.3 });
      const ok = res.waiting.length === 0;
      d.text(s, ok ? "Dördü de yerleşti." : `${res.waiting.join(", ")} beklemek zorunda: 950 KB boş, ama ≥\u00A0430 KB delik yok.`,
        { x: 9.55, y, w: 3.2, h: 0.8, fontSize: 13, bold: true, color: ok ? C.mintDeep : RED, valign: "middle" });
    });
  }
  d.text(s, [
    { text: "■ ", options: { color: C.mint } }, { text: "yeni süreç   ", options: {} },
    { text: "■ ", options: { color: PROC } }, { text: "mevcut süreç   ", options: {} },
    { text: "□ ", options: { color: C.slate } }, { text: "delik (boyu KB)", options: {} },
  ], { x: MX + 1.7, y: 6.15, w: 7.6, h: 0.35, fontSize: 12, color: C.mutedOnLight });
  d.text(s, "Küçük deliklerin (ör. 20 KB) etiketi çubuğun altında.", { x: MX + 1.7, y: 6.5, w: 7.6, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight });
  s.addNotes("Çubukları okuyun. İlk uyan: A->600, B->2100, C->300; toplam 950 KB boş olmasına rağmen D yerleştirilemiyor, en büyük delik 350. En iyi uyan: A->1600 (350), B->600 (450), C 1820'deki 130 KB'lık artığa tam sığıyor, D->2100: hepsi sığıyor. En kötü uyan: A->2100, B->600, C->1600, D bekliyor (en büyük delik 330). Uyarın: bu tek bir örnek; en iyi uyan her zaman en iyisi değildir. İşe yaramayan çok küçük delikler oluşturma eğilimindedir (burada 50 KB).");

  s = compare({
    kicker: "Parçalanma", title: "Dış ve İç Parçalanma",
    left: { title: "Dış parçalanma (external fragmentation)", items: [
      "Toplamda yeterince boş bellek var, ama her biri tek başına küçük deliklere bölünmüş.",
      "Yukarıda ilk uyan: 950 KB boş, D'nin 430 KB'a ihtiyacı var, en büyük delik 350 KB.",
      "Değişken bölümlerin ve bölütlemenin tipik sorunu.",
      { b: "Çareler:", t: " sıkıştırma (sonraki slayt) ya da sürecin bitişik olmamasına izin vermek (sayfalama, 2. bölüm)." },
    ] },
    right: { title: "İç parçalanma (internal fragmentation)", color: C.slate, items: [
      "Sürece verilmiş ama onun kullanmadığı bellek: bloğun içindeki israf.",
      "Bellek sabit boyutlu birimlerle dağıtılınca olur: 18.462 bayt istenir, 18.464 verilir.",
      "Sabit bölümlerin ve sayfalamanın tipik sorunu.",
      { b: "Çare:", t: " daha küçük tahsis birimleri; bedeli daha fazla kayıt tutma (daha büyük tablolar)." },
    ] },
    bodySize: 15, calloutSize: 13,
    callout: "%50 kuralı (Silberschatz): ilk uyanda, tahsis edilmiş N blok için yaklaşık 0,5 N blok daha parçalanmaya gider; belleğin üçte birine kadarı kullanılamaz hâle gelebilir.",
  });
  s.addNotes("%50 kuralı istatistiksel bir sonuçtur (Knuth'un çözümlemesi, Silberschatz'ın aktardığı biçimiyle): N blok tahsis edilmişse N/2 blok daha parçalanmaya gider. Kaybedilen oran = 0,5N / (N + 0,5N) = 1/3. İç parçalanma örneği: 2 baytlık bir deliği listede tutmanın maliyeti deliğin kendisinden fazladır, bu yüzden tahsis edici yukarı yuvarlar.");

  s = d.content({ kicker: "Parçalanma", title: "Sıkıştırma (Compaction): Belleği Bir Araya Toplamak", lead: "Tüm süreçleri bir uca taşıyın; böylece bütün delikler tek bir büyük delikte birleşir." });
  {
    const ff = simulate("first");
    d.text(s, "Önce (ilk uyan sonucu)", { x: MX, y: 2.35, w: 4, h: 0.3, fontSize: 13, bold: true, color: C.charcoal });
    memBar(s, MX, 2.7, 12.15, 0.8, ff.segs, TOTAL, { size: 11 });
    const order = ff.segs.filter(g => g.kind !== "hole").sort((p, q) => p.a - q.a);
    let a = 0; const packed = [];
    order.forEach(g => { const sz = g.b - g.a; packed.push({ a, b: a + sz, label: g.label, kind: g.kind }); a += sz; });
    packed.push({ a, b: a + 430, label: "D", kind: "new" });
    packed.push({ a: a + 430, b: TOTAL, label: "520", kind: "hole" });
    d.text(s, "Sıkıştırmadan sonra: 950 KB'lık tek delik → D (430 KB) sığar", { x: MX, y: 3.85, w: 8, h: 0.3, fontSize: 13, bold: true, color: C.charcoal });
    memBar(s, MX, 4.2, 12.15, 0.8, packed, TOTAL, { size: 11 });
  }
  d.card(s, MX, 5.35, 5.95, 1.5, { body: [
    { b: "Yalnızca", t: " yürütme zamanında bağlamada mümkün: taşıdıktan sonra yer değiştirme yazmacı güncellenir." },
  ], bodySize: 14 });
  d.card(s, MX + 6.2, 5.35, 5.95, 1.5, { body: [
    { b: "Pahalı:", t: " RAM'in tamamına kadarını kopyalar; süreçler durmalıdır ve taşınan bir tampona G/Ç yapılması sorun yaratır." },
  ], bodySize: 14 });
  s.addNotes("Sıkıştırmadan sonra boş bellek tek parça hâlinde 2800 - 1850 = 950 KB'tır; D 430 KB alır, 520 KB kalır. Sıkıştırma bir diski birleştirmeye (defrag) benzer: doğru ama yavaş. Daha iyi çözüm, bir sürecin belleğinin bitişik olmamasına izin vermektir. Molanın ardından gelen konu: sayfalama.");

  // Mola
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Mola", subtitle: "Sırada: dış parçalanmayı ortadan kaldıran fikir, sayfalama." });
  s.addNotes("On dakika. Moladan önce öğrencilerden şunu düşünmelerini isteyin: bir sürecin tek parça olması gerekmeseydi ne olurdu?");

  // ───────────────────────── BÖLÜM 2: SAYFALAMA
  s = d.sectionSlide({ kicker: "Bölüm 2", title: "Sayfalama (Paging)", subtitle: "Belleği eşit parçalara bölün ve sürecin parçalarını RAM'in her yerine dağıtın." });
  s.addNotes("2. bölüm: tüm modern genel amaçlı işletim sistemlerinin kullandığı yöntem olan sayfalama.");

  s = d.content({ kicker: "Sayfalama", title: "Sayfalar, Çerçeveler ve Sayfa Tablosu", lead: "Mantıksal bellek sayfalara (page), fiziksel bellek aynı boyda çerçevelere (frame) bölünür (burada 4 KB). Her sayfa her boş çerçeveye konabilir." });
  {
    const y0 = 2.35;
    d.text(s, "mantıksal bellek\n(süreç, 5 sayfa)", { x: MX, y: y0, w: 2.2, h: 0.55, fontSize: 12, bold: true, color: C.charcoal, align: "center" });
    const pt = [5, 9, 1, 7, 12];
    pt.forEach((f, i) => d.box(s, MX + 0.2, y0 + 0.7 + i * 0.62, 1.8, 0.56, `sayfa ${i}`, { fill: C.mint, color: C.dark, size: 13 }));
    d.text(s, "sayfa tablosu", { x: 3.3, y: y0, w: 2.1, h: 0.55, fontSize: 12, bold: true, color: C.charcoal, align: "center", valign: "bottom" });
    pt.forEach((f, i) => {
      const y = y0 + 0.7 + i * 0.62;
      d.box(s, 3.45, y, 0.6, 0.56, String(i), { fill: C.light, size: 12, color: C.mutedOnLight, bold: false });
      d.box(s, 4.1, y, 1.1, 0.56, String(f), { fill: PALE, size: 14, color: C.dark });
      d.arrow(s, 2.42, y + 0.28, 3.43, y + 0.28, { w: 1.25 });
    });
    d.text(s, "sayfa  çerçeve", { x: 3.4, y: y0 + 3.85, w: 2.0, h: 0.3, fontSize: 10.5, italic: true, color: C.mutedOnLight });
    d.text(s, "fiziksel bellek (16 çerçeve)", { x: 5.8, y: 1.95 + 0.25, w: 2.8, h: 0.3, fontSize: 12, bold: true, color: C.charcoal, align: "center" });
    for (let f = 0; f < 16; f++) {
      const y = 2.55 + f * 0.268;
      const pg = pt.indexOf(f);
      s.addShape(P.shapes.RECTANGLE, { x: 6.45, y, w: 2.0, h: 0.268, fill: { color: pg >= 0 ? C.mint : (f % 3 === 0 ? PROC : C.white) }, line: { color: "AAB4B8", width: 0.5 } });
      d.text(s, pg >= 0 ? `sayfa ${pg}` : (f % 3 === 0 ? "başka" : ""), { x: 6.45, y, w: 2.0, h: 0.268, fontSize: 10, align: "center", valign: "middle", color: C.dark, bold: pg >= 0 });
      d.text(s, String(f), { x: 5.95, y, w: 0.42, h: 0.268, fontSize: 10, align: "right", valign: "middle", color: C.mutedOnLight });
    }
  }
  d.card(s, 8.9, 2.35, 3.85, 4.5, { title: "Önemli noktalar", body: [
    "Sayfa boyu = çerçeve boyu, 2'nin bir kuvveti (Linux/x86: 4 KB).",
    "Bir sürecin çerçeveleri bitişik ya da sıralı olmak zorunda değildir.",
    "Her boş çerçeve kullanılabilir → dış parçalanma yok.",
    "Her sürecin bir sayfa tablosu var; işletim sistemi bir boş çerçeve listesi tutar.",
  ], bodySize: 13 });
  s.addNotes("Bu sayfa tablosu (0->5, 1->9, 2->1, 3->7, 4->12) sonraki slaytlarda ve page_split.c'de kullanılan tablodur. Dikkat çekin: 1, 5, 7, 9, 12 numaralı çerçeveler dağınık ve sırasız, yine de süreç 0..20479 arasında bitişik bir mantıksal bellek görür. 'başka' ile işaretli çerçeveler başka süreçlere aittir.");

  s = d.content({ kicker: "Adres çevirisi", title: "Adresi Sayfa Numarası ve Ofsete Bölmek", lead: "m bitlik mantıksal adreste ve 2^n baytlık sayfada, üstteki m − n bit sayfa numarası p, alttaki n bit ofset (sayfa içi konum) d'dir." });
  {
    const y = 2.5;
    d.box(s, MX, y, 4.6, 0.9, "sayfa numarası  p", { sub: "üstteki  m − n  bit", fill: C.mint, color: C.dark, size: 16 });
    d.box(s, MX + 4.7, y, 3.4, 0.9, "ofset  d", { sub: "alttaki  n  bit", fill: C.charcoal, size: 16 });
    d.code(s, MX, 3.7, 8.1, 3.15,
`p = adres div 2^n   =  adres >> n
d = adres mod 2^n   =  adres & (2^n - 1)
fiziksel = çerçeve(p) × 2^n + d

16 bit adres, 4 KB sayfa (n = 12):  p = 4 bit, d = 12 bit
32 bit adres, 4 KB sayfa (n = 12):  p = 20 bit, d = 12 bit

0x3A7F = 0011 | 1010 0111 1111
         p = 3   d = 0xA7F`, 14.5);
  }
  d.card(s, 9.0, 2.5, 3.75, 4.35, { title: "Onaltılık kısayol", body: [
    "Bir onaltılık basamak = 4 bit; 4 KB sayfada (12 bit) ofset son 3 onaltılık basamaktır.",
    "0x3A7F → p = 0x3, d = 0xA7F.",
    "Ofset değişmeden kopyalanır: yalnızca sayfa numarası çevrilir.",
  ], bodySize: 15 });
  s.addNotes("Neden 2'nin kuvvetleri? Çünkü bölme işlemi gerekmez: donanım yalnızca ilgili telleri alır. n bit sağa kaydırmak 2^n'e bölmek, 2^n - 1 ile VE işlemi kalanı almak demektir. Bugünün sonunda öğrenciler onaltılık bölmeyi akıldan yapabilmeli.");

  s = d.content({ kicker: "Çözümlü örnek", title: "Mantıksal Adres 0x3A7F'nin Çevirisi", lead: "16 bitlik adresler, 4 KB sayfalar (n = 12), sayfa tablosu önceki slaytlardaki." });
  {
    const y = 2.6;                       // adres kutularının satırı
    d.box(s, MX, y - 0.15, 1.3, 1.0, "İşlemci", { fill: C.charcoal, size: 14 });
    d.box(s, 2.3, y, 0.75, 0.7, "3", { fill: C.mint, color: C.dark, size: 18, font: F.code });
    d.box(s, 3.05, y, 1.1, 0.7, "A7F", { fill: C.light, size: 18, font: F.code });
    d.text(s, "p", { x: 2.3, y: y + 0.72, w: 0.75, h: 0.28, fontSize: 12, italic: true, color: C.slate, align: "center" });
    d.text(s, "d", { x: 3.05, y: y + 0.72, w: 1.1, h: 0.28, fontSize: 12, italic: true, color: C.slate, align: "center" });
    d.arrow(s, MX + 1.32, y + 0.35, 2.28, y + 0.35, { w: 1.5 });
    d.box(s, 7.6, y, 0.75, 0.7, "7", { fill: C.mint, color: C.dark, size: 18, font: F.code });
    d.box(s, 8.35, y, 1.1, 0.7, "A7F", { fill: C.light, size: 18, font: F.code });
    d.text(s, "f", { x: 7.6, y: y + 0.72, w: 0.75, h: 0.28, fontSize: 12, italic: true, color: C.slate, align: "center" });
    d.text(s, "d", { x: 8.35, y: y + 0.72, w: 1.1, h: 0.28, fontSize: 12, italic: true, color: C.slate, align: "center" });
    // ofset yolu: satır boyunca düz
    s.addShape(P.shapes.LINE, { x: 3.6, y: y - 0.25, w: 0, h: 0.25, line: { color: C.slate, width: 1.25 } });
    s.addShape(P.shapes.LINE, { x: 3.6, y: y - 0.25, w: 5.3, h: 0, line: { color: C.slate, width: 1.25, dashType: "dash" } });
    d.arrow(s, 8.9, y - 0.25, 8.9, y - 0.02, { w: 1.25, color: C.slate });
    d.text(s, "ofset d değişmeden kopyalanır", { x: 4.4, y: y - 0.2, w: 3.4, h: 0.3, fontSize: 11, italic: true, color: C.slate, align: "center" });
    d.arrow(s, 9.47, y + 0.35, 10.25, y + 0.35, { w: 1.5 });
    d.box(s, 10.3, y - 0.15, 2.45, 1.0, "Bellek", { sub: "fiziksel 0x7A7F", fill: C.light, size: 14, subSize: 13 });
    // aşağıda sayfa tablosu
    const ty = 3.75, tx = 5.0;
    d.text(s, "sayfa tablosu", { x: tx - 0.2, y: ty - 0.35, w: 2.1, h: 0.3, fontSize: 12, bold: true, color: C.charcoal, align: "center" });
    [5, 9, 1, 7, 12].forEach((f, i) => {
      const hl = i === 3;
      d.box(s, tx, ty + i * 0.52, 0.55, 0.46, String(i), { fill: C.light, size: 12, bold: false, color: C.mutedOnLight });
      d.box(s, tx + 0.6, ty + i * 0.52, 1.1, 0.46, String(f), { fill: hl ? C.mint : PALE, color: C.dark, size: 14 });
    });
    const ry = ty + 3 * 0.52 + 0.23;
    d.arrow(s, 2.67, y + 1.02, tx - 0.05, ry, { w: 1.75, color: C.mintDeep });
    label(s, "① p = 3'e bak", 1.3, 4.75, 2.0, 0.3);
    d.arrow(s, tx + 1.72, ry, 7.72, y + 0.72, { w: 1.75, color: C.mintDeep });
    label(s, "② çerçeve 7", 8.05, 3.5, 1.6, 0.3);
  }
  d.code(s, 7.75, 4.0, 5.0, 2.85,
`0x3A7F   = 14975
p = 14975 div 4096 = 3
d = 14975 mod 4096 = 2687 = 0xA7F
sayfa_tablosu[3] = 7
fiziksel = 7 × 4096 + 2687
         = 31359 = 0x7A7F   ✓`, 13);
  d.callout(s, MX, 5.55, 3.85, 1.3, "Onaltılık kısayol: ilk basamağı (sayfa) çerçeveyle değiştirin: 0x3A7F → 0x7A7F.", 13);
  s.addNotes("İki kez yapın: bir kez onaltılık tabanda (ilk basamak 3'ü 7 ile değiştirin: 0x3A7F -> 0x7A7F), bir kez de herkes ikna olsun diye onluk tabanda. Sorun: mantıksal 0x1234'ün fiziksel adresi nedir? Sayfa 1 -> çerçeve 9 -> 0x9234 = 37428. Ya mantıksal 0x5000? Sayfa 5 tabloda yok: tuzak (geçerli bitiyle buna geri döneceğiz). Uygulama bölümündeki page_split.c programı tam olarak bu satırları yazdırır.");

  s = d.content({ kicker: "Sayfalama", title: "İç Parçalanma ve Sayfa Boyu Seçimi", lead: "Sayfalamada dış parçalanma yoktur; ancak bir sürecin son sayfası genellikle dolu değildir." });
  d.code(s, MX, 2.3, 6.0, 2.35,
`Süreç boyu     10000 bayt
Sayfa boyu      4096 bayt

10000 = 2 × 4096 + 1808
→ 3 çerçeve, sonuncusunda 1808 bayt
→ iç parçalanma = 2288 bayt`, 13.5);
  {
    const y = 4.95;
    [[4096, "sayfa 0: dolu"], [4096, "sayfa 1: dolu"], [1808, "1808 dolu"], [2288, "2288 boşa"]].forEach((b, i, arr) => {
      const k = 6.0 / 12288; const x = MX + arr.slice(0, i).reduce((t, c) => t + c[0], 0) * k;
      s.addShape(P.shapes.RECTANGLE, { x, y, w: b[0] * k, h: 0.7, fill: { color: i < 3 ? C.mint : C.white }, line: i < 3 ? { color: C.white, width: 1 } : { color: RED, width: 1.25, dashType: "dash" } });
      d.text(s, b[1], { x, y, w: b[0] * k, h: 0.7, fontSize: 11.5, align: "center", valign: "middle", bold: true, color: i < 3 ? C.dark : RED });
    });
    d.text(s, "her 4096 baytta bir çerçeve sınırı", { x: MX, y: y + 0.75, w: 6, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight });
  }
  d.card(s, 6.9, 2.3, 5.85, 4.55, { title: "Sayfa boyu bir ödünleşimdir", body: [
    { b: "Ortalama israf:", t: " süreç başına yarım sayfa (4 KB sayfada 2 KB); en kötü durumda bir sayfa eksi bir bayt." },
    { b: "Küçük sayfalar:", t: " daha az israf, ama daha çok sayfa → daha büyük sayfa tabloları." },
    { b: "Büyük sayfalar:", t: " daha küçük tablolar ve daha verimli disk G/Ç'si, ama daha çok israf." },
    { b: "x86-64 üzerinde Linux:", t: " normalde 4 KB; veritabanı gibi büyük programlar için 2 MB ya da 1 GB'lık \"dev sayfalar\" (huge pages)." },
  ], bodySize: 13.5 });
  s.addNotes("10000 / 4096 = 2, kalan 1808. Sürecin 3 çerçeveye ihtiyacı var ve üçüncü çerçevenin 4096 - 1808 = 2288 baytı boşa gidiyor. Süreç boyları rastgeleyse son sayfa ortalama yarı doludur; bu yüzden beklenen israf süreç başına yarım sayfadır. Linux'ta getconf PAGESIZE 4096 yazdırır; /proc/meminfo ise Hugepagesize: 2048 kB gösterir (test makinemizde gördük).");

  s = d.content({ kicker: "Sayfalama", title: "Sayfa Tablosu Ne Kadar Büyük?", lead: "Her sayfa için bir girdi. Büyük adres uzaylarında tablolar çok büyür." });
  d.code(s, MX, 2.3, 6.4, 3.0,
`32 bit mantıksal adres, 4 KB sayfa, 4 baytlık girdi

sayfa  = 2^32 / 2^12 = 2^20 = 1048576
boyut  = 2^20 × 4 B  = 4 MB   süreç başına!

100 süreç → 400 MB sayfa tablosu`, 13.5);
  d.callout(s, MX, 5.55, 6.4, 1.3, "Bir sürecin adres uzayının büyük kısmı hiç kullanılmaz; yani bu tablonun çoğu boş girdilerden oluşurdu.", 14);
  {
    const x = 7.3, y = 2.3;
    d.text(s, "İki düzeyli sayfa tablosu (32 bit)", { x, y, w: 5.45, h: 0.35, fontSize: 14, bold: true, color: C.mintDeep, fontFace: F.title });
    d.box(s, x, y + 0.5, 1.6, 0.7, "p1: 10", { fill: C.mint, color: C.dark, size: 13 });
    d.box(s, x + 1.65, y + 0.5, 1.6, 0.7, "p2: 10", { fill: PALE, color: C.dark, size: 13 });
    d.box(s, x + 3.3, y + 0.5, 2.15, 0.7, "d: 12 bit", { fill: C.charcoal, size: 13 });
    d.box(s, x, y + 1.6, 1.6, 2.0, "dış tablo", { sub: "1024 girdi\n= bir 4 KB sayfa", fill: C.light, size: 12 });
    d.box(s, x + 2.0, y + 1.6, 1.6, 2.0, "iç tablolar", { sub: "yalnızca gerçekten kullanılan kısımlar için", fill: C.light, size: 12 });
    d.box(s, x + 4.0, y + 1.6, 1.45, 2.0, "çerçeve", { sub: "+ ofset", fill: C.mint, color: C.dark, size: 12 });
    d.arrow(s, x + 1.62, y + 2.6, x + 1.98, y + 2.6, { w: 1.5 });
    d.arrow(s, x + 3.62, y + 2.6, x + 3.98, y + 2.6, { w: 1.5 });
    d.text(s, "Sayfa tablosunun kendisi de sayfalanır. x86-64 dört düzey kullanır (9 + 9 + 9 + 9 + 12 = 48 bit); yeni işlemciler beş düzey sunar.", { x, y: y + 3.8, w: 5.45, h: 0.75, fontSize: 12.5, color: "3A464C" });
  }
  s.addNotes("2^32 / 2^12 = 2^20 girdi, 4 baytla çarpınca 2^22 bayt = 4 MB. Her süreç için! 64 bit için durum daha kötü: 48 bitlik adresler ve 8 baytlık girdilerle düz bir tablo 2^36 x 8 B = 512 GB olurdu. Çözüm (bugün yalnızca kısaca): sayfa numarasını birkaç parçaya bölüp sayfa tablosunun kendisini sayfalamak; böylece iç tablolar yalnızca adres uzayının kullanılan kısımları için var olur. Öğrencilerin ayrıntıyı değil, yalnızca fikri bilmesi yeterli.");

  // TLB
  s = d.content({ kicker: "Hız", title: "TLB: Sayfa Tablosu Girdileri İçin Bir Önbellek", lead: "Sayfa tablosu RAM'de durduğu için her erişim iki bellek erişimi gerektirirdi: biri girdi için, biri veri için." });
  {
    const y = 2.55;
    d.box(s, MX, y + 0.55, 1.2, 0.9, "İşlemci", { fill: C.charcoal, size: 13 });
    d.box(s, 2.15, y + 0.65, 0.6, 0.7, "p", { fill: C.mint, color: C.dark, size: 16 });
    d.box(s, 2.75, y + 0.65, 0.6, 0.7, "d", { fill: C.light, size: 16 });
    d.arrow(s, MX + 1.22, y + 1.0, 2.13, y + 1.0, { w: 1.5 });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 4.0, y, w: 2.3, h: 2.0, fill: { color: PALE }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, "TLB", { x: 4.0, y: y + 0.05, w: 2.3, h: 0.35, fontSize: 14, bold: true, color: C.charcoal, align: "center" });
    ["p  →  f", "p  →  f", "p  →  f"].forEach((t, i) => d.box(s, 4.2, y + 0.45 + i * 0.5, 1.9, 0.42, t, { fill: C.white, size: 12, font: F.code, bold: false }));
    d.arrow(s, 2.45, y + 0.63, 3.98, y + 0.4, { w: 1.5 });
    d.arrow(s, 6.32, y + 1.0, 7.6, y + 1.0, { w: 1.75, color: C.mintDeep });
    label(s, "isabet", 6.45, y + 0.6, 1.1, 0.3);
    d.box(s, 7.65, y + 0.65, 0.6, 0.7, "f", { fill: C.mint, color: C.dark, size: 16 });
    d.box(s, 8.25, y + 0.65, 0.6, 0.7, "d", { fill: C.light, size: 16 });
    d.arrow(s, 8.87, y + 1.0, 9.6, y + 1.0, { w: 1.5 });
    d.box(s, 9.65, y - 0.1, 1.2, 3.5, "Bellek", { fill: C.light, size: 13 });
    d.arrow(s, 5.15, y + 2.02, 5.15, y + 2.6, { w: 1.75, color: RED });
    label(s, "ıska", 5.25, y + 2.1, 0.8, 0.3, { color: RED });
    d.box(s, 4.0, y + 2.65, 2.3, 0.85, "sayfa tablosu", { sub: "RAM'de: +1 erişim", fill: C.light, size: 13 });
    d.arrow(s, 6.32, y + 3.05, 7.95, y + 1.38, { w: 1.5, color: RED });
    d.text(s, "girdiyi TLB'ye kopyala", { x: 6.55, y: y + 2.75, w: 2.6, h: 0.3, fontSize: 11, italic: true, color: RED });
  }
  d.card(s, 11.05, 2.45, 1.7, 3.5, { body: ["İsabet: 1 bellek erişimi.", "Iska: 2 bellek erişimi."], bodySize: 13 });
  d.callout(s, MX, 6.15, 12.15, 0.7, "TLB (translation look-aside buffer, çeviri önbelleği): MMU'nun içinde küçük (≈ 64 – 1536 girdi), çok hızlı, ilişkisel bir bellek.", 13.5);
  s.addNotes("Diyagramı okuyun: sayfa numarası TLB'de aranır, tüm girdilerde aynı anda. İsabet (hit): çerçeve numarası hemen çıkar. Iska (miss): MMU (bazı işlemcilerde işletim sistemi) RAM'deki sayfa tablosunu okur, sonra girdiyi bir dahaki sefer için TLB'ye yazar. Programlar belleğe yerellikle (locality: döngüler, diziler, yığıt) eriştiği için %99 ve üzeri isabet oranları olağandır. Bağlam değişiminde TLB boşaltılmalı ya da girdiler bir adres uzayı kimliğiyle (ASID) etiketlenmelidir.");

  s = d.content({ kicker: "Çözümlü örnek", title: "Etkin Erişim Süresi (EAT)", lead: "Bizim uzlaşımımız: TLB arama süresi t_TLB her erişimde sayılır; bir ıska fazladan bir bellek erişimine mal olur." });
  d.code(s, MX, 2.3, 6.6, 1.25,
`EAT = α (t_TLB + t_m) + (1 − α)(t_TLB + 2 t_m)
    = t_TLB + (2 − α) t_m       α = TLB isabet oranı`, 14);
  d.code(s, MX, 3.75, 6.6, 3.1,
`t_TLB = 20 ns,  t_m = 100 ns

α = 0.80:  0.80 × 120 + 0.20 × 220
         = 96 + 44    = 140 ns   (%40 yavaş)
α = 0.98:  0.98 × 120 + 0.02 × 220
         = 117.6 + 4.4 = 122 ns  (%22 yavaş)
TLB yok :  2 × 100    = 200 ns   (2 kat yavaş)`, 13.5);
  d.card(s, 7.45, 2.3, 5.3, 4.55, { title: "Sonucu yorumlamak", body: [
    "TLB olmasaydı sayfalama her bellek erişimini iki katına çıkarırdı.",
    "En çok isabet oranı önemlidir: %80 → %98, erişim başına 18 ns kazandırır.",
    { b: "Modern sadeleştirme", t: " (Silberschatz 10. baskı): TLB araması başka işlerle örtüştüğü için t_TLB ≈ 0: EAT = α t_m + (1 − α) 2 t_m → α = 0,80 için 120 ns, α = 0,99 için 101 ns." },
  ], bodySize: 13.5 });
  s.addNotes("Formülü tahtaya yazın ve her terimi açıklayın: α olasılıkla bir TLB araması artı bir bellek erişimi öderiz; 1 - α olasılıkla bir arama artı iki bellek erişimi. t_TLB + (2 - α) t_m biçimine sadeleştirin: 20 + 1,2 x 100 = 140. Sınavda hangi uzlaşımı kullandığınızı mutlaka belirtin; ders kitapları farklıdır. code/verify.py ile doğrulandı.");

  s = d.content({ kicker: "Koruma", title: "Koruma Bitleri ve Geçerli–Geçersiz Bit", lead: "Her sayfa tablosu girdisi bir çerçeve numarasından fazlasını taşır. MMU bitleri her erişimde denetler." });
  s.addTable([
    ["Sayfa", "Çerçeve", "Geçerli", "İzinler", "İçerik"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 14 } })),
    ...[["0", "5", "v", "r-x", "kod"], ["1", "9", "v", "r-x", "kod"], ["2", "1", "v", "rw-", "veri"], ["3", "7", "v", "rw-", "öbek (heap)"], ["4", "12", "v", "rw-", "yığıt (stack)"], ["5 … 15", "—", "i", "—", "sürecin parçası değil"]]
      .map((r, i) => r.map((t, j) => ({ text: t, options: { color: r[2] === "i" ? RED : "3A464C", fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: j === 3 ? F.code : F.body, fontSize: 14 } }))),
  ], { x: MX, y: 2.3, w: 6.6, colW: [1.05, 1.15, 1.0, 1.2, 2.2], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [4, 8, 4, 8], valign: "middle" });
  d.text(s, "v = geçerli (valid), i = geçersiz (invalid)", { x: MX, y: 5.75, w: 6.6, h: 0.3, fontSize: 12, italic: true, color: C.mutedOnLight });
  d.card(s, 7.45, 2.3, 5.3, 4.55, { title: "Donanım neyi denetler?", body: [
    { b: "Geçerli biti = i:", t: " sayfa sürecin adres uzayında değil → tuzak. Mantıksal 0x5000 (sayfa 5) tuzağa düşer." },
    { b: "r-x sayfaya yazma:", t: " tuzak. Kodun üzerine yanlışlıkla yazılamaz." },
    { b: "rw- sayfayı yürütme:", t: " tuzak (NX biti). Veriye kod enjekte eden birçok saldırıyı durdurur." },
    "Aynı r, w, x harflerini /proc/self/maps içinde göreceksiniz.",
  ], bodySize: 13.5 });
  s.addNotes("Bu, sınır yazmacının sayfalamadaki karşılığıdır. Gelecek hafta geçerli bitinin ikinci bir anlamı olacak: 'geçerli ama şu an RAM'de değil' -> sayfa hatası (page fault), isteğe bağlı sayfalama. Şimdilik: geçersiz, yasak demektir. NX (no-execute, yürütme yok) biti x86-64'te yaklaşık 2004'ten beri vardır.");

  s = d.content({ kicker: "Paylaşım", title: "Paylaşılan Sayfalar: Herkes İçin Tek C Kütüphanesi", lead: "Salt okunur (yeniden girilebilir, reentrant) kod aynı anda birçok sürece eşlenebilir. Yalnızca veri sayfaları özeldir." });
  {
    const procs = [["Süreç 1", "8"], ["Süreç 2", "11"], ["Süreç 3", "14"]];
    const libF = [3, 4, 6];
    procs.forEach((p, i) => {
      const x = MX + i * 2.35, y = 2.4;
      d.text(s, p[0], { x, y, w: 2.15, h: 0.3, fontSize: 13, bold: true, color: C.charcoal, align: "center" });
      ["libc 0", "libc 1", "libc 2"].forEach((l, j) => d.box(s, x, y + 0.4 + j * 0.62, 2.15, 0.55, `${l}  → ${libF[j]}`, { fill: C.mint, color: C.dark, size: 12.5 }));
      d.box(s, x, y + 0.4 + 3 * 0.62, 2.15, 0.55, `veri  → ${p[1]}`, { fill: PROC, color: C.dark, size: 12.5 });
    });
    d.text(s, "girdiler şöyle okunur: sayfa → çerçeve", { x: MX, y: 5.2, w: 6.9, h: 0.25, fontSize: 11, italic: true, color: C.mutedOnLight, align: "center" });
    const fx = 8.0;
    d.text(s, "fiziksel çerçeveler", { x: fx - 0.5, y: 2.0, w: 2.8, h: 0.3, fontSize: 12, bold: true, color: C.charcoal, align: "center" });
    for (let f = 0; f < 16; f++) {
      const y = 2.35 + f * 0.28;
      const lib = libF.indexOf(f), dat = ["8", "11", "14"].indexOf(String(f));
      s.addShape(P.shapes.RECTANGLE, { x: fx, y, w: 1.8, h: 0.28, fill: { color: lib >= 0 ? C.mint : dat >= 0 ? PROC : C.white }, line: { color: "AAB4B8", width: 0.5 } });
      d.text(s, lib >= 0 ? `libc ${lib}` : dat >= 0 ? `veri P${dat + 1}` : "", { x: fx, y, w: 1.8, h: 0.28, fontSize: 10, align: "center", valign: "middle", color: C.dark, bold: true });
      d.text(s, String(f), { x: fx - 0.5, y, w: 0.42, h: 0.28, fontSize: 10, align: "right", valign: "middle", color: C.mutedOnLight });
    }
    d.card(s, 10.15, 2.35, 2.6, 4.5, { body: ["Üç süreç var, ama libc RAM'de yalnızca bir kez bulunur.", "Paylaşılan sayfalar salt okunur işaretlenir.", "Aynı fikir: fork() başlangıçta tüm sayfaları paylaştırır (yazınca kopyala, 7. hafta)."], bodySize: 12.5 });
    d.callout(s, MX, 5.55, 6.9, 1.3, "40 süreç ve 2 MB'lık bir kütüphaneyle paylaşım 39 × 2 MB = 78 MB RAM kazandırır.", 14);
  }
  s.addNotes("Her sürecin kendi sayfa tablosu vardır, ama kütüphane sayfalarının girdileri aynı 3, 4 ve 6 numaralı çerçeveleri gösterir. Yalnızca özel veri sayfası farklıdır (8, 11, 14 numaralı çerçeveler). Paylaşılan kütüphanelerin (Linux'ta .so, Windows'ta .dll) bu kadar bellek kazandırmasının nedeni budur; /proc/self/maps her süreçte libc.so.6'yı listeler. Paylaşılan kod yeniden girilebilir (reentrant) olmalıdır: kendini asla değiştirmez.");

  // ───────────────────────── BÖLÜM 3: BÖLÜTLEME
  s = d.sectionSlide({ kicker: "Bölüm 3", title: "Bölütleme (Segmentation)", subtitle: "Belleğe programcının gözüyle bakış: farklı boylarda, adı olan parçalardan oluşan bir topluluk." });
  s.addNotes("3. bölüm: diğer klasik yöntem. Daha kısa tutun: bölütleme bugün daha çok tarihsel ve kavramsal açıdan önemlidir.");

  s = d.content({ kicker: "Bölütleme", title: "Programa Kullanıcının Gözüyle Bakış", lead: "Programcı 4 KB'lık sayfaları değil; ana programı, fonksiyonları, yığıtı, sembol tablosunu, verileri … düşünür." });
  {
    const segs = [["0", "ana program", 1200, 2000], ["1", "sqrt()  kütüphanesi", 300, 6500], ["2", "yığıt (stack)", 600, 4800], ["3", "sembol tablosu", 900, 3400], ["4", "öbek / veri", 700, 5600]];
    const k = 1.25 / 600;
    let x = MX;
    segs.forEach(sg => {
      const h = sg[2] * k; const w = 1.55;
      d.box(s, x, 2.45 + (2.6 - h), w, h, sg[1], { sub: `bölüt ${sg[0]}`, fill: C.mint, color: C.dark, size: 11.5, subSize: 10.5 });
      x += w + 0.18;
    });
    d.text(s, "mantıksal görünüm: her biri 0 ofsetinden başlayan, farklı boylarda ayrı parçalar", { x: MX, y: 5.15, w: 8.6, h: 0.3, fontSize: 12, italic: true, color: C.mutedOnLight });
    // fiziksel bellek sütunu
    const px = 9.75, py = 2.55, ph = 4.3, lo = 1400, hi = 7000, kk = ph / (hi - lo);
    d.text(s, "fiziksel bellek", { x: px - 0.2, y: py - 0.35, w: 2.4, h: 0.3, fontSize: 12, bold: true, color: C.charcoal, align: "center" });
    s.addShape(P.shapes.RECTANGLE, { x: px, y: py, w: 2.0, h: ph, fill: { color: C.white }, line: { color: C.slate, width: 1 } });
    segs.forEach(sg => {
      const y = py + (sg[3] - lo) * kk, h = sg[2] * kk;
      s.addShape(P.shapes.RECTANGLE, { x: px, y, w: 2.0, h, fill: { color: C.mint }, line: { color: C.white, width: 1 } });
      d.text(s, `bölüt ${sg[0]}`, { x: px, y, w: 2.0, h, fontSize: 11, bold: true, align: "center", valign: "middle", color: C.dark });
      d.text(s, String(sg[3]), { x: px - 0.75, y: y - 0.12, w: 0.68, h: 0.25, fontSize: 10, align: "right", color: C.mutedOnLight });
    });
  }
  d.callout(s, MX, 5.6, 8.5, 1.25, "Mantıksal adres = ⟨bölüt numarası s, ofset d⟩. Bölütleri derleyici oluşturur; yükleyici her birine fiziksel bellekte bir taban verir.", 14);
  s.addNotes("Yükseklikler bölüt boylarıyla orantılı (sınır değerleri bir sonraki slaytta). Sayfaların aksine bölütler farklı boylardadır ve programın anlamlı parçalarına karşılık gelir; bu yüzden koruma anlamlı birim başına ayarlanabilir (kod salt okunur, yığıt okunur-yazılır). Bedeli: bölütler yine değişken boylu, bitişik bloklardır -> dış parçalanma geri gelir.");

  s = d.content({ kicker: "Bölütleme", title: "Bölüt Tablosu ve Adres Çevirisi", lead: "Her bölütün bir tabanı (RAM'de nerede başladığı) ve bir sınırı (uzunluğu) vardır. Ofset sınırla denetlenir." });
  s.addTable([
    ["s", "Bölüt", "Taban", "Sınır"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 14 } })),
    ...[["0", "ana program", "2000", "1200"], ["1", "sqrt() kütüphanesi", "6500", "300"], ["2", "yığıt", "4800", "600"], ["3", "sembol tablosu", "3400", "900"], ["4", "öbek / veri", "5600", "700"]]
      .map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: F.body, fontSize: 14 } }))),
  ], { x: MX, y: 2.3, w: 5.4, colW: [0.5, 2.5, 1.2, 1.2], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [4, 8, 4, 8], valign: "middle" });
  {
    const x = 6.35, y = 2.3;
    d.box(s, x, y, 1.0, 0.65, "s", { fill: C.mint, color: C.dark, size: 15 });
    d.box(s, x + 1.05, y, 1.0, 0.65, "d", { fill: C.light, size: 15 });
    s.addShape(P.shapes.DIAMOND, { x: x + 2.55, y: y - 0.2, w: 1.7, h: 1.05, fill: { color: C.mint }, line: { type: "none" } });
    d.text(s, "d < sınır[s] ?", { x: x + 2.55, y: y - 0.2, w: 1.7, h: 1.05, fontSize: 11, bold: true, align: "center", valign: "middle", color: C.dark });
    d.arrow(s, x + 2.07, y + 0.33, x + 2.53, y + 0.33, { w: 1.5 });
    d.arrow(s, x + 4.27, y + 0.33, x + 4.75, y + 0.33, { w: 1.5 });
    label(s, "evet", x + 4.22, y - 0.05, 0.6, 0.3);
    d.box(s, x + 4.8, y, 1.6, 0.65, "taban[s] + d", { fill: PALE, color: C.dark, size: 13 });
    d.arrow(s, x + 3.4, y + 0.87, x + 3.4, y + 1.3, { w: 1.5, color: RED });
    d.text(s, "hayır → TUZAK", { x: x + 3.55, y: y + 0.9, w: 1.9, h: 0.35, fontSize: 12, bold: true, color: RED });
  }
  d.code(s, 6.35, 3.85, 6.4, 3.0,
`(s=2, d=53)  : 53 < 600    → 4800 + 53  = 4853
(s=3, d=852) : 852 < 900   → 3400 + 852 = 4252
(s=1, d=299) : 299 < 300   → 6500 + 299 = 6799
(s=0, d=1222): 1222 ≥ 1200 → TUZAK
               (adresleme hatası)`, 13.5);
  d.callout(s, MX, 5.75, 5.4, 1.1, "Taban + sınır fikrinin aynısı; ama her bölüt için bir çift.", 14);
  s.addNotes("Dört örneği birlikte çözün. Öğrencilerden 1. bölütteki en büyük geçerli ofseti bulmalarını isteyin: 299; fiziksel 6799, yani son bayt. 0. bölütteki 1222 ofseti 1200 sınırını aşıyor: donanım tuzak üretir. 'Segmentation fault' (bölütleme hatası) adı bu tür bir denetimden gelir. Sayılar code/verify.py ile doğrulandı.");

  s = d.tableSlide({
    kicker: "Karşılaştırma", title: "Sayfalama ve Bölütleme",
    header: ["", "Sayfalama", "Bölütleme"],
    colW: [3.0, 4.6, 4.55],
    rows: [
      ["Birim boyu", "sabit (ör. 4 KB), donanım belirler", "değişken, programın yapısını izler"],
      ["Programcı görür mü?", "hayır, görünmez", "evet: ana program, yığıt, veri …"],
      ["Mantıksal adres", "tek sayı, p | d olarak bölünür", "bir çift ⟨s, d⟩"],
      ["Dış parçalanma", "yok", "var (değişken boylu bloklar)"],
      ["İç parçalanma", "var, süreç başına ortalama ½ sayfa", "yok"],
      ["Koruma ve paylaşım", "sayfa başına", "anlamlı birim (bölüt) başına"],
      ["Tablo girdisi", "çerçeve numarası + bitler", "taban + sınır + bitler"],
    ],
    fontSize: 14.5,
    callout: "Birleşim: Multics ve Intel 80386 sayfalardan oluşan bölütler kullandı. Modern 64 bit sistemler yalnızca sayfalamayı tutar.",
  });
  s.addNotes("Özetleyin: sayfalama dış parçalanmayı çözer ve tahsisi önemsizleştirir (herhangi bir boş çerçeve). Bölütleme programcının bakışına uyar ve doğal koruma birimleri verir. Tarihsel olarak sistemler ikisini birleştirdi (sayfalardan oluşan bölütler, ör. Intel 80386 / Multics). Bugün sayfalama kazandı; bölüt fikri /proc/self/maps'teki 'bölgeler' (VMA) olarak yaşıyor.");

  s = d.cardsSlide({
    kicker: "Gerçek sistemler", title: "x86-64 Linux Gerçekte Ne Yapar?",
    lead: "Intel işlemcilerde bölütleme donanımı hâlâ var; ama 64 bit işletim sistemleri onu fiilen devre dışı bırakır.",
    cards: [
      { title: "Bölütleme: düz", body: ["Kod, veri ve yığıt bölütlerinin tabanı 0'dır ve tüm adres uzayını kapsarlar.", "Yalnızca FS/GS kullanımda kalır (iş parçacığına özel veriler için)."] },
      { title: "Sayfalama: her şey", body: ["4 düzeyli sayfa tabloları, 48 bit adresler (9+9+9+9+12); yeni işlemcilerde 5 düzey / 57 bit.", "4 KB, 2 MB, 1 GB'lık sayfalar."] },
      { title: "Süreç başına tablolar", body: ["Her sürecin kendi sayfa tabloları vardır; CR3 yazmacı onları gösterir.", "Bağlam değişimi CR3'ü yeniden yükler (3. hafta)."] },
    ],
    bodySize: 15.5,
    callout: "Bölüt fikri yazılımda yaşıyor: Linux her süreç için bir bölge listesi (metin, öbek, yığıt, kütüphaneler) tutar; /proc/self/maps bunu gösterir.",
  });
  s.addNotes("Kısa bir genel bakış; ayrıntıları sınav konusu değil. 64 bit kipte işlemci CS, DS, ES ve SS'nin taban ve sınırını yok sayar. ARM64'te (telefonlar, Apple M serisi) bölütleme hiç yoktur. Linux'ta bugün 'segmentation fault', bir erişim sayfa tablosu/bölge kurallarını ihlal ettiğinde bildirilir: ad, donanımdan daha uzun yaşadı. CR3, en üst düzey sayfa tablosunun fiziksel adresini tutar.");

  // ───────────────────────── UYGULAMA
  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 1: Değişkenlerim Nerede Duruyor?",
    code: code("mem_layout_excerpt.c"), size: 10.5, codeW: 7.0, sideTitle: "Gözlemleyin",
    side: [
      "Kod ve global değişkenler: düşük adresler (0x55…).",
      "Öbek (heap) biraz daha yukarıda; yığıt (stack) en üste yakın (0x7ff…).",
      "Her adres, /proc/self/maps içinde izinleri uygun bir bölgeye düşer.",
    ],
    run: { h: 3.05, size: 9.5, text: fs.readFileSync(path.join(__dirname, "code/out_mem_layout.txt"), "utf8").replace(/\n\n--- my regions in \/proc\/self\/maps ---\n/, "\n").split("\n").map(l => l.replace(/^(\S+)-(\S+) (\S+) (\S+)$/, "$1-$2 $3 $4").replace(/^(text|data|bss|heap|stack|page)\s+\([^)]*\)\s*\S*\s*:/, m => m.replace(/\s+/g, " "))).join("\n").replace(/^\$?/, "$ ./mem_layout\n") },
  });
  s.addNotes("Canlı çalıştırın: make; ./mem_layout. text, mem_layout'un r-xp bölgesinde (yürütülebilir, yazılamaz); data ve bss rw-p bölgesinde; öbek [heap] içinde; yerel değişken [stack] içinde. İki kez çalıştırın: adresler her seferinde değişir; bunun nedeni bir güvenlik özelliği olan ASLR'dir (address-space layout randomisation, adres uzayı düzeninin rastgeleleştirilmesi). Bunlar mantıksal (sanal) adreslerdir; fiziksel adresleri hiçbir zaman görmeyiz.");

  s = d.content({ kicker: "Uygulama", title: "Kabuktan Sayfa Boyu ve Bellek Haritası" });
  d.code(s, MX, 1.65, 12.15, 3.55,
`$ getconf PAGESIZE
4096
$ grep Hugepagesize /proc/meminfo
Hugepagesize:       2048 kB
$ head -n 6 /proc/self/maps        # head sürecinin kendi bellek haritası
559948881000-559948883000 r--p 00000000 fe:00 270606         /usr/bin/head
559948883000-559948889000 r-xp 00002000 fe:00 270606         /usr/bin/head
559948889000-55994888b000 r--p 00008000 fe:00 270606         /usr/bin/head
55994888b000-55994888c000 r--p 00009000 fe:00 270606         /usr/bin/head
55994888c000-55994888d000 rw-p 0000a000 fe:00 270606         /usr/bin/head
559970df7000-559970e18000 rw-p 00000000 00:00 0              [heap]`, 11.5);
  [
    ["Sütunlar", "başlangıç–bitiş (sanal), izinler r/w/x + p (özel) ya da s (paylaşılan), dosya ofseti, aygıt, inode, dosya."],
    ["Sayfa aritmetiği", "0x559948883000 − 0x559948881000 = 0x2000 = 8192 bayt = 2 sayfa. Her sınır 000 ile biter: bölgeler sayfaya hizalıdır."],
    ["Aynı dosya, 5 bölge", "Tek program dosyası, farklı izinlerle eşlenmiş: başlıklar, kod (r-x), sabitler, veri (rw-)."],
  ].forEach((c, i) => d.card(s, MX + i * 4.12, 5.4, 3.9, 1.45, { title: c[0], body: c[1], bodySize: 12.5, titleSize: 14 }));
  s.addNotes("Linux test ortamımızda yakalanmış gerçek çıktı (son sütundaki boşluklar kısaltıldı). /proc/self her zaman 'onu okuyan süreç' demektir; burada head'in kendisi. Öğrencilerden öbek bölgesinin boyunu hesaplamalarını isteyin: 0x559970e18000 - 0x559970df7000 = 0x21000 = 135168 bayt = 33 sayfa. Her başlangıç ve bitiş adresi üç onaltılık sıfırla biter: bölgeler tam 4 KB'lık sayfalardan oluşur.");

  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 2: Aynı Adres, Farklı Değerler",
    code: code("fork_vaddr.c").split("\n").slice(8).join("\n"), size: 11, codeW: 7.0, sideTitle: "Bu nasıl mümkün?",
    side: [
      "fork() ebeveyni kopyalar: aynı düzen, aynı adresler.",
      "Çocuk x = 200 yapar; ebeveyn hâlâ 100 görür.",
      "&x mantıksal bir adrestir. Her sürecin kendi sayfa tablosu onu farklı bir çerçeveye eşler.",
    ],
    run: { h: 1.45, size: 10, text: "$ ./fork_vaddr\n" + code("out_fork_vaddr.txt").trim().replace(/   x =/g, "  x =") },
  });
  s.addNotes("Günün en ikna edici gösterimi. İki satır da aynı adresi gösteriyor ama iki farklı değer: &x fiziksel bir adres olsaydı bu imkânsız olurdu. Teknik olarak, fork()'tan sonra iki sayfa tablosu da önce salt okunur işaretlenmiş aynı çerçeveyi gösterir; çocuk yazınca çekirdek sayfayı kopyalar ve çocuğun sayfa tablosu girdisini değiştirir (yazınca kopyala, copy-on-write, 7. hafta). ASLR adresi çalıştırmadan çalıştırmaya değiştirir, ama ebeveyn ve çocuk her zaman aynı adresi görür.");

  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 3: Bit İşlemleriyle Sayfa Numarası ve Ofset",
    code: code("page_split_excerpt.c"), size: 11, codeW: 7.3, sideTitle: "Ne yapıyor?",
    side: [
      "p = a >> 12 ve d = a & 0xFFF.",
      "Çeviri: (frame << 12) | d.",
      "Slaytlardaki sayfa tablosunun aynısı.",
    ],
    run: { h: 2.35, size: 9.5, text: "$ ./page_split 0x3A7F 0x1234 0x5000\n" + code("out_page_split.txt").split("\n").filter(l => /^0x(3A7F|1234|5000)/.test(l)).join("\n").replace(/ \(/g, "(").replace(/: p = /g, ":\n  p=").replace(/, d = /g, " d=").replace(/ -> /g, "→") },
  });
  s.addNotes("MMU tam olarak bunu donanımda, bir nanosaniyenin kesrinde yapar. Öğrenciler herhangi bir adresi deneyebilir: ./page_split 0x0 0xFFF 0x1000 ile sayfa sınırını görürler. Tablomuzda sayfa 5 geçersiz olduğu için 0x5000 tuzağa düşer.");

  s = d.content({ kicker: "Kendiniz deneyin", title: "Kendi Makinenizde Belleği Keşfedin" });
  d.code(s, MX, 1.65, 6.6, 5.2,
`# Linux (laboratuvar, WSL ya da sanal makine)
$ getconf PAGESIZE          # bayt olarak sayfa boyu
$ cat /proc/self/maps       # cat'in bellek haritası
$ ./mem_layout; ./mem_layout   # iki kez: ASLR
$ free -h                   # kullanılan RAM ve takas
$ cat /proc/swaps           # takas alanları
$ vmstat 1 5                # si/so = takas içeri/dışarı

# Windows
# Görev Yöneticisi > Performans > Bellek:
# "Kullanımda", "Kaydedildi", "Disk belleğine
# alınan havuz"`, 13);
  d.card(s, MX + 6.9, 1.65, 5.25, 5.2, { title: "Yanıtlanacak sorular", body: [
    "Makinenizde sayfa boyu ne kadar? Apple silicon işlemcili bir Mac'te deneyin: 16 KB.",
    "cat'in [stack] bölgesi kaç sayfa büyüklüğünde?",
    "mem_layout'un yazdırdığı adresler çalıştırmalar arasında değişiyor mu? Bu güvenlik için neden iyi olabilir?",
    "Makineniz şu anda takas alanı kullanıyor mu? Ne kadar?",
  ], bodySize: 15 });
  s.addNotes("Ödev tarzı bir keşif; yanıtlar makineden makineye değişir. Apple silicon Mac'ler 16 KB'lık sayfa kullanır (getconf PAGESIZE 16384 yazdırır); çoğu x86 bilgisayar 4 KB kullanır. Türkçe Windows'ta Görev Yöneticisi alanlarının adları sürüme göre biraz farklı olabilir.");

  // Sınav soruları → temel çıkarımlar (spesifikasyondaki sıra)
  s = d.quizSlide({ questions: [
    "Taban = 0x2000, sınır = 0x0800. Mantıksal 0x07FF nereye gider? Ya mantıksal 0x0800?",
    "Sayfalar 4 KB. Mantıksal adres 0x5C21'i sayfa numarası p ve ofset d olarak bölün.",
    "t_TLB = 20 ns, t_m = 100 ns, isabet oranı %90. Etkin erişim süresini hesaplayın.",
    "Sayfalamada neden dış parçalanma yoktur, ama iç parçalanma hâlâ vardır?",
  ] });
  s.addNotes("Yanıtlar: (1) 0x07FF < 0x0800, dolayısıyla fiziksel 0x2000 + 0x07FF = 0x27FF; 0x0800 sınırdan küçük değil -> tuzak. (2) p = 0x5 = 5, d = 0xC21 = 3105. (3) EAT = 0,9 x 120 + 0,1 x 220 = 108 + 22 = 130 ns (= 20 + 1,1 x 100). (4) Her boş çerçeve her sayfaya uyar, bu yüzden boş bellek hiçbir zaman kullanılamayacak kadar parçalanmaz; ama bellek tam sayfalar hâlinde verildiği için bir sürecin son sayfası kısmen boştur.");

  s = d.content({ kicker: "Kapanış", title: "6. Hafta: Temel Çıkarımlar" });
  d.bullets(s, [
    { b: "Mantıksal ve fiziksel:", t: " programlar mantıksal adres kullanır; MMU bunları her erişimde çevirir (yürütme zamanında bağlama)." },
    { b: "Taban + sınır:", t: " en basit MMU; mantıksal < sınır denetlenir, sonra taban eklenir; aksi hâlde tuzak." },
    { b: "Bitişik tahsis:", t: " ilk / en iyi / en kötü uyan; dış parçalanma (%50 kuralı), sıkıştırma pahalıdır." },
    { b: "Sayfalama:", t: " sayfa ↔ çerçeve, adres = p | d, süreç başına sayfa tablosu; dış parçalanma yok, yalnızca iç." },
    { b: "TLB:", t: " sayfa tablosu girdilerini önbellekte tutar; bizim uzlaşımımızla EAT = t_TLB + (2 − α) t_m." },
    { b: "Bölütleme:", t: " bölüt başına taban/sınır ile ⟨bölüt, ofset⟩; x86-64 Linux düz bölütlerle sayfalama kullanır." },
  ], { fontSize: 18, y: 1.75, h: 5.1, paraSpaceAfter: 14 });
  s.addNotes("Akılda tutulacak altı cümle. Gelecek haftanın konusu sanal bellek, sayfalamanın üzerine tek bir fikir ekler: bir sayfanın RAM'de olması hiç gerekmez.");

  d.closing({ nextWeek: "Sanal Bellek ve Dosya Sistemleri", nextItems: [
    "İsteğe bağlı sayfalama (demand paging) ve sayfa hataları (page fault)",
    "Sayfa değiştirme: FIFO, OPT, LRU ve boşa çalışma (thrashing)",
    "Dosya sistemleri: dosya kavramı, erişim yöntemleri, dizin yapıları",
    "Ara sınavdan önceki son ders (8. hafta: 1–7. haftalar)",
  ] });
  const all = P.slides;
  all[all.length - 2].addNotes("7. hafta bellek hikâyesini tamamlıyor: bir sayfa geçerli ama RAM'de değilse ne olur? Ayrıca dosya sistemlerine başlıyoruz. Öğrencilere hatırlatın: 7. hafta, 1-7. haftaları kapsayan 8. hafta ara sınavından önceki son derstir.");
  all[all.length - 1].addNotes("Soruları alın. Ders sonrası sorular için dersin Telegram kanalını ve daha fazla çözümlü örnek ile yanıtlı tekrar soruları içeren 6. hafta ders notlarını hatırlatın.");

  await d.save(path.join(__dirname, "MBLP131_Hafta6.pptx"));
  console.log("slides:", d.n);
})();
