// Hafta 8 sunumu (MBLP131, Türkçe): Ara Sınav (Vize) Tekrarı ve Alıştırma (1–7. haftaları kapsar)
// İngilizce referans: ../week08/build_deck.js (aynı slayt sırası, aynı diyagramlar, aynı sayılar).
// Çözümlü problemlerdeki her sayı code/review_results.json dosyasından okunur;
// bu dosyayı code/review_problems.py yazar (çalıştırma: python3 review_problems.py --json).
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("../lib/deck");
const d = new Deck({ week: 8, lang: "tr", assets: path.join(__dirname, "../lib") });
const code = f => fs.readFileSync(path.join(__dirname, "code", f), "utf8");
const P = d.pres;
const R = JSON.parse(code("review_results.json"));
const PALE = "D7E9E6";
const BODY = "3A464C";
const fmt = x => (Number.isInteger(x) ? String(x) : String(+x.toFixed(2)));   // kod kutuları: ondalık nokta
const tr = x => fmt(x).replace(".", ",");                                       // düz metin: ondalık virgül
const trf = (x, k) => x.toFixed(k).replace(".", ",");

// ---------- yardımcılar ---------------------------------------------------------
const PC = { P1: [C.mint, C.dark], P2: [C.slate, C.white], P3: [C.amber, C.white], P4: [C.charcoal, C.white] };

function gantt(s, x, y, w, segs, { T, h = 0.5, label, labelW = 1.6, size = 12, tick = 11 } = {}) {
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
    s.addShape(P.shapes.LINE, { x: x + t * k, y: y + h, w: 0.0001, h: 0.07, line: { color: C.mutedOnLight, width: 1 } });
    d.text(s, String(t), { x: x + t * k - 0.25, y: y + h + 0.06, w: 0.5, h: 0.24, fontSize: tick, align: "center", color: C.mutedOnLight });
  });
}

// Çerçeve tablosu (7. hafta biçimi): nane = yeni yüklenen sayfa, soluk = hata sütunu, gri = isabet.
function frameTable(s, refs, tb, n, x, y, w, rowH = 0.36, fsz = 13) {
  const labW = 0.95, T = refs.length, cw = (w - labW) / T;
  const labels = ["başvuru", ...Array.from({ length: n }, (_, k) => `çerçeve ${k}`), "hata?"];
  labels.forEach((l, r) => d.text(s, l, { x, y: y + r * rowH, w: labW - 0.08, h: rowH, fontSize: 10.5, italic: true, color: C.mutedOnLight, valign: "middle", align: "right" }));
  for (let t = 0; t < T; t++) {
    const cx = x + labW + t * cw, fr = tb.frames[t], prev = t > 0 ? tb.frames[t - 1] : [];
    d.box(s, cx + 0.02, y + 0.02, cw - 0.04, rowH - 0.04, String(refs[t]), { fill: C.charcoal, size: fsz });
    for (let k = 0; k < n; k++) {
      const v = k < fr.length ? String(fr[k]) : "";
      const isNew = tb.fault[t] && v === String(refs[t]) && (k >= prev.length || String(prev[k]) !== v);
      const fill = isNew ? C.mint : tb.fault[t] ? PALE : C.light;
      d.box(s, cx + 0.02, y + (k + 1) * rowH + 0.02, cw - 0.04, rowH - 0.04, v,
        { fill, size: fsz, bold: isNew, color: tb.fault[t] ? C.dark : "9AA5A8" });
    }
    d.text(s, tb.fault[t] ? "F" : "", { x: cx, y: y + (n + 1) * rowH, w: cw, h: rowH, fontSize: fsz, bold: true, color: C.red, align: "center", valign: "middle" });
  }
  return y + (n + 2) * rowH;
}

function stat(s, x, y, w, h, big, small, fill = C.charcoal) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: 0.06, line: { type: "none" } });
  d.text(s, [{ text: big, options: { fontSize: 34, bold: true, fontFace: F.title, color: C.mint, breakLine: true } },
             { text: small, options: { fontSize: 12.5, color: C.light } }], { x: x + 0.15, y, w: w - 0.3, h, align: "center", valign: "middle" });
}

function line(s, x1, y1, x2, y2, o = {}) {
  s.addShape(P.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 0.0001, h: Math.abs(y2 - y1) || 0.0001,
    flipH: x2 < x1, flipV: y2 < y1, line: Object.assign({ color: C.slate, width: 1.25 }, o) });
}

function table(s, rows, { x = MX, y, w = 12.15, colW, fontSize = 13, header = true, rowH, align } = {}) {
  const data = rows.map((r, i) => r.map((t, j) => {
    if (header && i === 0) return { text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize, align: align ? align[j] : undefined } };
    return { text: t, options: { color: BODY, fill: { color: (i % 2) ? C.light : C.white }, bold: j === 0, fontFace: F.body, fontSize, align: align ? align[j] : undefined } };
  }));
  s.addTable(data, { x, y, w, colW, rowH, border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [4, 6, 4, 6], valign: "middle" });
}

function weekTag(s, txt) {   // tekrar slaytlarının sağ üstündeki küçük nane etiket
  d.box(s, 11.25, 0.3, 1.5, 0.36, txt, { fill: C.mint, color: C.dark, size: 12 });
}

(async () => {
  // 1 ── Başlık
  let s = d.titleSlide({
    kicker: "MBLP131  ·  HAFTA 8",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 8  ·  Ara Sınav Tekrarı ve Alıştırma",
    tagline: "Yedi haftalık kuram, tek sınav: neyi bilmeli ve bunu nasıl puana çevirmeli?",
  });
  s.addNotes("8. haftaya, yani vize haftasına hoş geldiniz. Ara sınav (vize) 1–7. haftaları kapsıyor. Bugünün planı: sınavla ilgili pratik bilgiler, her haftanın formülleriyle birlikte kısa bir tekrarı, 10 dakikalık mola, ardından sayısal soru türlerinin hepsini kapsayan yedi çözümlü alıştırma problemi, en sık yapılan hatalar ve bir sınav stratejisi. Bu haftanın ders notları bir çalışma kılavuzudur: içinde bir formül kâğıdı ve çözümleri eksiksiz verilmiş bir deneme sınavı var. Ayrıca cevap anahtarıyla birlikte ayrı bir örnek vize kâğıdı da dağıtılıyor.");

  // 2 ── Neredeyiz
  s = d.content({ kicker: "Şimdiye kadar", title: "Neredeyiz: Dersin Yarısındayız" });
  {
    const wk = [["H1", "Tarihçe", "toplu işleme, çoklu programlama, zaman paylaşımı"], ["H2", "Temeller", "hedefler, kesmeler, ikili mod, yapılar"],
      ["H3", "Süreçler", "sistem çağrıları, durumlar, PCB, fork()"], ["H4", "İş parçacıkları", "modeller, Amdahl, zamanlama ölçütleri"],
      ["H5", "Zamanlama, eşzamanlama", "FCFS … RR, muteks, semaforlar"], ["H6", "Bellek", "MMU, parçalanma, sayfalama, TLB"],
      ["H7", "SB ve dosyalar", "sayfa hataları, FIFO/OPT/LRU, dizinler"]];
    const w = 1.6, gap = (12.15 - 7 * w) / 6;
    wk.forEach((c, i) => {
      const x = MX + i * (w + gap);
      s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y: 1.75, w, h: 2.45, fill: { color: C.light }, rectRadius: 0.06, line: { type: "none" } });
      d.box(s, x + 0.15, 1.9, 0.75, 0.42, c[0], { fill: C.mint, color: C.dark, size: 14, font: F.title });
      d.text(s, c[1], { x: x + 0.15, y: 2.42, w: w - 0.3, h: 0.62, fontSize: 13, bold: true, fontFace: F.title, color: C.charcoal, valign: "top" });
      d.text(s, c[2], { x: x + 0.15, y: 3.05, w: w - 0.3, h: 1.05, fontSize: 12, color: BODY, valign: "top" });
    });
    d.text(s, "Kuram: 1–7. haftalar  —  hepsi vizede", { x: MX, y: 4.3, w: 12.15, h: 0.35, fontSize: 13, italic: true, color: C.mintDeep, align: "center" });
    const band = [["H8", "Vize sınavı", "bugün: tekrar ve alıştırma", C.charcoal, C.white], ["H9–H14", "Uygulamalı Linux", "kabuk, dosyalar, izinler, borular, süreçler, betikler", C.light, C.charcoal], ["H15", "Final sınavı", "dersin tamamı", C.light, C.charcoal]];
    const bw = [2.9, 6.25, 2.6]; let bx = MX;
    band.forEach((b, i) => {
      s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: bx, y: 4.85, w: bw[i], h: 1.25, fill: { color: b[3] }, rectRadius: 0.06, line: { type: "none" } });
      d.text(s, [{ text: b[0] + "   ", options: { bold: true, color: i === 0 ? C.mint : C.mintDeep, fontFace: F.title, fontSize: 16 } }, { text: b[1], options: { bold: true, fontFace: F.title, fontSize: 16, color: b[4], breakLine: true } },
                 { text: b[2], options: { fontSize: 12.5, color: i === 0 ? C.light : BODY } }], { x: bx + 0.25, y: 4.85, w: bw[i] - 0.5, h: 1.25, valign: "middle" });
      bx += bw[i] + 0.2;
    });
    d.text(s, "Buradasınız ↑", { x: MX, y: 6.2, w: 2.9, h: 0.35, fontSize: 13, bold: true, color: C.red, align: "center" });
  }
  s.addNotes("Dersin ilk yarısı kuramdı: işletim sistemi nedir, işlemciyi, belleği ve dosyaları nasıl yönetir. Üst sıradaki her şey vizede var. Sınavdan sonra ders uygulamalı hâle geliyor: 9. haftadan itibaren her hafta Linux kabuğunda çalışacağız ve bugünkü fikirlerin çoğunu komut olarak yeniden göreceksiniz (ps ile süreçler, ls -i ve ln ile dosyalar, düğümdeki izinler). 15. haftadaki final sınavı iki yarıyı da kapsar.");

  // 3 ── Gündem
  s = d.content({ kicker: "Hafta 8", title: "Bugünün Gündemi" });
  [
    ["1", "Sınav", "Pratik bilgiler, kapsam, soru türleri ve puanlar."],
    ["2", "Tekrar: 1–7. haftalar", "Her hafta için bir iki slayt: tanımlar, diyagramlar, formüller."],
    ["3", "Formül kâğıdı", "Dersin bütün formülleri tek slaytta."],
    ["4", "Çözümlü problemler", "Yedi problem: sınavdaki her sayısal soru türü."],
    ["5", "Hatalar ve strateji", "Puanlar genellikle nerede kaybedilir, 90 dakika nasıl kullanılır?"],
    ["6", "Kısa sınav ve sorular", "Kendinizi sınayın, sonra sınavla ilgili her şeyi sorun."],
  ].forEach((a, i) => {
    const y = 1.65 + i * 0.86;
    d.box(s, MX, y, 0.72, 0.72, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 0.9, y, w: 11.25, h: 0.72, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "   ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.2, y, w: 10.8, h: 0.72, valign: "middle" });
  });
  s.addNotes("1–3. bölümler moladan önce, 4–6. bölümler moladan sonra. Sınavınız haftanın ilerleyen bir günündeyse dersin ikinci yarısını rehberli bir alıştırma oturumu olarak kullanın: çözümü göstermeden önce her problemi kendiniz deneyin.");

  // 4 ── Sınavla ilgili pratik bilgiler
  s = d.cardsSlide({
    kicker: "Sınav", title: "Vize: Pratik Bilgiler",
    cards: [
      { title: "Ne zaman, nerede?", body: ["Tarih ve saat: [duyurulacak]", "Salon: [duyurulacak]", "Süre: [90] dakika", "10 dakika erken gelin; öğrenci kimliğinizi getirin."] },
      { title: "İzin verilen malzeme", body: ["Kalem; basit bir hesap makinesi [kesinleşecek]", "Kitap kapalı: not yok, telefon yok [kesinleşecek]", "Formül kâğıdı verilecek mi: [evet / hayır — kesinleşecek]"] },
      { title: "Biçim (örnek kâğıttaki gibi)", body: ["A Bölümü: 10 çoktan seçmeli soru × 2 puan", "B Bölümü: 4 kısa yanıtlı soru × 5 puan", "C Bölümü: 5 sayısal problem, 60 puan", "Toplam: 100 puan"] },
    ], cols: 3, bodySize: 15.5,
    callout: "[Köşeli parantez] içindeki her şey öğretim üyesi tarafından dersin Telegram kanalında kesinleştirilecek. Sınav gününden önce kanala bakın.",
  });
  s.addNotes("ÖĞRETİM ÜYESİ İÇİN: tarihi, salonu, süreyi, hesap makinesi kuralını, sınavın kitap kapalı olup olmadığını ve formül kâğıdı verilip verilmeyeceğini kesinleştirin, sonra köşeli parantezleri silin. Gösterilen biçim, bu haftanın malzemesiyle dağıtılan örnek kâğıdın biçimidir (exam/MBLP131_Vize_Ornek.pdf); aksi duyurulmadıkça gerçek kâğıt da aynı yapıyı izler. Öğrencilere: kimliğinizi getirin; telefonlar kapalı ve kaldırılmış olmalı.");

  // 5 ── Kapsam
  s = d.tableSlide({
    kicker: "Sınav", title: "Kapsam: 1–7. Haftalar",
    header: ["Hafta", "Konular", "Tipik sorular"],
    colW: [0.95, 6.0, 5.2],
    rows: [
      ["H1", "Tarihçe: toplu işleme, çoklu programlama, zaman paylaşımı, UNIX, Linux", "Dönüm noktaları; U = t_çalışma/(t_çalışma + t_hazırlık), U(n) = 1 − pⁿ"],
      ["H2", "Tanımlar, bakış açıları, hedefler, kesmeler, bellek hiyerarşisi, ikili mod, yapılar", "Açıklama / karşılaştırma; mod biti; monolitik ve mikroçekirdek"],
      ["H3", "Hizmetler, sistem çağrıları, süreç, durumlar, PCB, bağlam değişimi, fork()", "Durum diyagramı; ek yük s/(q + s); fork() ile süreç sayma"],
      ["H4", "İş parçacıkları, çoklu iş parçacığı modelleri, Amdahl yasası, zamanlama ölçütleri", "Ortak ve özel öğeler; hızlanma; dönüş, bekleme, yanıt"],
      ["H5", "FCFS, SJF, SRTF, öncelikli, RR; yarış, kritik bölge, muteks, semafor", "Gantt şeması + ortalama bekleme süresi; yarış sonuçları"],
      ["H6", "Bağlama, MMU, takas, uyan stratejileri, parçalanma, sayfalama, TLB, bölütleme", "Yerleştirme; adres çevirisi; TLB ile EAT"],
      ["H7", "İsteğe bağlı sayfalama, sayfa hataları, FIFO/OPT/LRU, boşa çalışma, dosyalar, dizinler", "Çerçeve tabloları; p ile EAT; blok hesabı; bağlantılar"],
    ],
    fontSize: 13.5, y: 1.7,
    callout: "A ve B bölümleri her haftanın tanım ve açıklamalarını sorar; C bölümündeki sayısal problemler ağırlıklı olarak 5, 6 ve 7. haftalardan gelir.",
  });
  s.addNotes("Her hafta katkıda bulunuyor. Hesap türü soruları olduğu için sayısal puanların çoğu 5, 6 ve 7. haftalardan gelir; ama 1–4. haftalar çoktan seçmeli ve kısa yanıtlı bölümlerde çıkar; Amdahl yasası, bağlam değişimi ek yükü ve fork() sayma da küçük sayısal sorulardır. Ortadaki sütun kontrol listenizdir, sağdaki sütun neyi alıştırmanız gerektiğini söyler.");

  // 6 ── Bölüm: tekrar
  s = d.sectionSlide({ kicker: "Bölüm 1", title: "Tekrar: 1–7. Haftalar", subtitle: "Bilmeniz gereken tanımlar, diyagramlar ve formüller — ders notlarındaki sözcüklerle." });
  s.addNotes("Her hafta için: temel tanımlar, çizebilmeniz gereken o tek diyagram ve formüller. Her şey haftalık notlardaki gösterimin aynısıdır.");

  // 7 ── 1. hafta
  s = d.content({ kicker: "1. hafta · Tarihçe", title: "İşletim Sistemleri Neden Var?" });
  weekTag(s, "1. hafta");
  {
    const ms = [["1945", "ENIAC", "işletim sistemi yok, tek iş, kablolama"], ["1956", "GM-NAA I/O", "yerleşik monitör: toplu işleme"], ["1960'lar", "Çoklu programlama", "G/Ç sırasında işlemci geçiş yapar"],
      ["1961", "CTSS", "ilk zaman paylaşımı"], ["1964", "System/360", "tek işletim sistemi, çok makine"], ["1969/73", "UNIX", "küçük araçlar; C ile yeniden yazıldı"],
      ["1981", "IBM PC", "MS-DOS, koruma yok"], ["1991", "Linux", "özgür, UNIX benzeri çekirdek"], ["2006–08", "Bulut, telefon", "AWS, iPhone, Android"]];
    const y = 2.3, w = 12.15 / ms.length;
    line(s, MX + 0.1, y, MX + 12.05, y, { color: C.slate, width: 2 });
    ms.forEach((m, i) => {
      const cx = MX + i * w + w / 2;
      s.addShape(P.shapes.OVAL, { x: cx - 0.11, y: y - 0.11, w: 0.22, h: 0.22, fill: { color: C.mint }, line: { type: "none" } });
      d.text(s, m[0], { x: cx - w / 2, y: y - 0.55, w, h: 0.32, fontSize: 12, bold: true, color: C.mintDeep, align: "center" });
      d.text(s, m[1], { x: cx - w / 2 + 0.03, y: y + 0.2, w: w - 0.06, h: 0.55, fontSize: 12.5, bold: true, color: C.charcoal, align: "center", fontFace: F.title });
      d.text(s, m[2], { x: cx - w / 2 + 0.05, y: y + 0.75, w: w - 0.1, h: 0.7, fontSize: 11, color: BODY, align: "center" });
    });
  }
  d.card(s, MX, 3.95, 6.0, 2.9, { title: "Her biri tek satırda", body: [
    { b: "Toplu işleme:", t: " yerleşik monitör işleri art arda çalıştırır; insanın hazırlık süresi ortadan kalkar." },
    { b: "Çoklu programlama:", t: " bellekte birkaç iş; biri G/Ç beklerken işlemci başkasına geçer." },
    { b: "Zaman paylaşımı:", t: " sırayla kısa zaman dilimleri; her kullanıcı makinenin tamamı kendisininmiş gibi hisseder." },
  ], bodySize: 13.5 });
  d.code(s, MX + 6.25, 3.95, 5.9, 2.9,
`# işlemci kullanım oranı, toplu işleme
U = t_çalışma / (t_çalışma + t_hazırlık)

# n iş, her biri p kesri kadar G/Ç bekler
U(n) = 1 − pⁿ

# zaman paylaşımı: en kötü durumda bekleme
T_bekleme ≈ n · q`, 14);
  s.addNotes("1. haftanın soruları çoğunlukla çoktan seçmelidir: hangi sistem hangi fikri getirdi ve neden. Her adımın ardındaki nedeni hatırlayın: her buluş, işlemcinin boşta kaldığı bir zaman kaynağını ortadan kaldırdı. Üç formül basittir; örneğin p = 0,6 için U(3) = 1 − 0,216 = %78,4 (ileride 1. problem). Hatırlanacak iki tarih: UNIX 1969, Linux 1991.");

  // 8 ── 2. hafta (a)
  s = d.cardsSlide({
    kicker: "2. hafta · Temeller", title: "İşletim Sistemi Nedir, Kendini Nasıl Korur?",
    cards: [
      { title: "Tanım ve bakış açıları", body: ["Çekirdek: her zaman çalışan tek program.", "Genişletilmiş makine (yukarıdan aşağı): temiz soyutlamalar — dosyalar, süreçler.", "Kaynak yöneticisi (aşağıdan yukarı): zamanda ve uzayda çoğullama."] },
      { title: "Hedefler ve bileşenler", body: ["Hedefler: kullanım kolaylığı, verimlilik, gelişebilirlik — birbiriyle çatışırlar.", "Dört bileşen: donanım, işletim sistemi, uygulama programları, kullanıcılar."] },
      { title: "Kesmeler", body: ["Aygıt işlemciye sinyal verir; durum kaydedilir; işleyici kesme vektöründe bulunur; durum geri yüklenir.", "İşletim sistemi kesme güdümlüdür; yoklama işlemciyi boşa harcar."] },
      { title: "Bellek hiyerarşisi", body: ["Yazmaçlar ≈ 0,3 ns, önbellek, RAM ≈ 100 ns, SSD ≈ 50 µs, HDD ≈ 5 ms.", "Yazmaçlar, önbellek ve RAM uçucudur."] },
      { title: "İkili mod", body: ["Mod biti 0 = çekirdek modu, 1 = kullanıcı modu.", "Kullanıcı modunda ayrıcalıklı komut → tuzak.", "Sistem çağrısı: çekirdek moduna geçiş ve geri dönüş."] },
      { title: "Sistem çağrısının maliyeti", body: ["Ölçtük: sistem çağrısı başına ≈ 116 ns, fonksiyon çağrısı başına ≈ 1,5 ns.", "Kullanıcı/çekirdek sınırını geçmek pahalıdır."] },
    ], cols: 3, bodySize: 13.5,
  });
  weekTag(s, "2. hafta");
  s.addNotes("Tipik kısa yanıtlı soru: iki bakış açısını birer örnekle açıklayın (disk kesimleri yerine dosyalar; işlemci zamanının çoğullanması). Dersin mod biti uzlaşımını bilin: çekirdek modu için 0, kullanıcı modu için 1. Kullanıcı modunda yürütülen ayrıcalıklı bir komut yürütülmez; donanım işletim sistemine tuzak üretir. 116 ns değeri 2. haftadaki ölçümümüzdür; sizin makinenizde farklı olacaktır, ders oranın kendisidir.");

  // 9 ── 2. hafta (b)
  s = d.tableSlide({
    kicker: "2. hafta · İşletim sistemi yapıları", title: "Bir İşletim Sistemini Kurmanın Altı Yolu",
    header: ["Yapı", "Çekirdek modunda", "Hız", "Güvenilirlik", "Örnek"],
    colW: [2.0, 3.6, 1.4, 1.9, 3.25],
    rows: [
      ["Basit", "her şey (koruma yok)", "yüksek", "çok düşük", "MS-DOS"],
      ["Monolitik", "tüm işletim sistemi hizmetleri", "yüksek", "orta", "UNIX, Linux"],
      ["Katmanlı", "tüm katmanlar", "düşük", "yüksek", "THE (1968)"],
      ["Mikroçekirdek", "yalnızca küçük çekirdek", "daha düşük", "yüksek", "MINIX 3, QNX, seL4"],
      ["Modüler", "öz + yüklenen modüller", "yüksek", "orta", "Linux, Solaris"],
      ["Hibrit", "değişir", "yüksek", "orta–yüksek", "Windows, macOS, Android"],
    ],
    fontSize: 15.5, y: 1.7,
    callout: "Tek bir isteğin maliyeti: T_mono = 2t_s + t_w, buna karşılık T_µ = 4t_s + 2t_c + t_w (4 mod geçişi + 2 ileti kopyası). Her sınır güvenilirlik kazandırır, hız kaybettirir.",
  });
  weekTag(s, "2. hafta");
  s.addNotes("Karşılaştırma tablosu doğrudan 2. haftanın notlarından. Monolitik çekirdeğin (hızlı; bir sürücü hatası her şeyi çökertir) ve mikroçekirdeğin (çöken bir sunucu yeniden başlatılabilir; fazladan iletiler ve mod geçişleri onu yavaşlatır) birer üstünlüğünü ve birer zayıflığını söyleyebilmelisiniz. Linux hem monolitik HEM modülerdir (yüklenebilir çekirdek modülleri). t_s = 0,1, t_c = 0,15 ve t_w = 2 mikrosaniye için mikroçekirdek 2,7 / 2,2 ≈ 1,23 kat yavaştır (review_problems.py ile denetlendi).");

  // 10 ── 3. hafta (a)
  s = d.content({ kicker: "3. hafta · Hizmetler ve sistem çağrıları", title: "printf()'ten Çekirdeğe ve Geri" });
  weekTag(s, "3. hafta");
  {
    const y = 1.85, bw = 2.15, gap = 0.35;
    const steps = [["printf()", "C kütüphanesi (API)"], ["write() sarmalayıcı", "rax = 1, rdi, rsi, rdx"], ["syscall", "tuzak: mod biti → çekirdek"], ["sistem çağrısı tablosu", "girdi 1 → sys_write()"], ["dönüş", "yazılan bayt sayısı rax'ta"]];
    steps.forEach((st, i) => {
      const x = MX + i * (bw + gap);
      d.box(s, x, y, bw, 0.95, st[0], { sub: st[1], fill: i >= 2 && i <= 3 ? C.charcoal : C.light, size: i === 1 || i === 3 ? 12.5 : 14, subSize: 11, font: F.code });
      if (i < steps.length - 1) d.arrow(s, x + bw + 0.02, y + 0.47, x + bw + gap - 0.02, y + 0.47, { color: C.mintDeep, w: 1.75 });
    });
    d.text(s, "kullanıcı modu", { x: MX, y: y + 1.0, w: 4.8, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "center" });
    d.text(s, "çekirdek modu", { x: MX + 2 * (bw + gap), y: y + 1.0, w: 4.8, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "center" });
  }
  d.card(s, MX, 3.45, 4.0, 3.4, { title: "Hizmetler", body: [
    { b: "Kullanıcı için:", t: " kullanıcı arayüzü, program yürütme, G/Ç, dosya sistemi işlemleri, iletişim, hata algılama." },
    { b: "Sistem için:", t: " kaynak ayırma, hesap tutma ve kayıt, koruma ve güvenlik." },
  ], bodySize: 13 });
  d.card(s, MX + 4.15, 3.45, 3.85, 3.4, { title: "Parametre aktarımı", body: [
    "1. Yazmaçlarda (en hızlı).", "2. Bellekte bir blokta; adresi bir yazmaçta.", "3. Yığıtta.",
    "x86-64 Linux: numara rax'ta, en çok altı parametre yazmaçlarda.",
  ], bodySize: 13 });
  d.card(s, MX + 8.15, 3.45, 4.0, 3.4, { title: "Altı tür", body: [
    "Süreç denetimi (fork, exit, wait)", "Dosya yönetimi (open, read, close)", "Aygıt yönetimi (ioctl)", "Bilgi bakımı (getpid)", "İletişim (pipe, socket)", "Koruma (chmod)",
  ], bodySize: 13 });
  s.addNotes("Bir API fonksiyonu, bir sarmalayıcı ve sistem çağrısının kendisi arasındaki farkı bilin: printf() bir API fonksiyonudur ve write() çağırabilir de çağırmayabilir de; strlen() hiçbir zaman sistem çağrısı yapmaz. Çekirdeğe tek ve sabit bir noktadan girilir; çekirdek numarayı sistem çağrısı tablosunda bir indeks olarak kullanır ve istekteki hiçbir şeye güvenmez. Tipik çoktan seçmeli soru: x86-64 Linux'ta sistem çağrısı numarası nerededir? Yanıt: rax yazmacında.");

  // 11 ── 3. hafta (b)
  s = d.content({ kicker: "3. hafta · Süreçler", title: "Süreç Durumları, PCB, Bağlam Değişimi, fork()" });
  weekTag(s, "3. hafta");
  {
    const bw = 1.55, bh = 0.6;
    const pos = { new: [MX + 0.1, 1.85], terminated: [MX + 5.0, 1.85], ready: [MX + 0.1, 3.75], running: [MX + 5.0, 3.75], waiting: [MX + 2.55, 5.75] };
    const name = { new: "yeni", terminated: "sonlandı", ready: "hazır", running: "çalışıyor", waiting: "bekliyor" };
    Object.entries(pos).forEach(([n, [x, y]]) => d.box(s, x, y, bw, bh, name[n], { fill: n === "running" ? C.mint : n === "ready" || n === "waiting" ? PALE : C.light, color: C.dark, size: 14 }));
    const lab = (t, x, y, w = 1.8, al = "center") => d.text(s, t, { x, y, w, h: 0.3, fontSize: 10.5, italic: true, color: C.mintDeep, align: al });
    d.arrow(s, MX + 0.88, 2.47, MX + 0.88, 3.73, { color: C.mintDeep }); lab("kabul edildi", MX + 0.95, 2.95, 1.3, "left");
    d.arrow(s, MX + 1.67, 3.92, MX + 4.98, 3.92, { color: C.mintDeep }); lab("zamanlayıcı seçti", MX + 2.4, 3.6);
    d.arrow(s, MX + 4.98, 4.2, MX + 1.67, 4.2, { color: C.mintDeep }); lab("kesme", MX + 2.4, 4.22);
    d.arrow(s, MX + 5.78, 3.73, MX + 5.78, 2.47, { color: C.mintDeep }); lab("çıkış", MX + 5.85, 2.95, 1.0, "left");
    d.arrow(s, MX + 5.4, 4.37, MX + 3.9, 5.73, { color: C.mintDeep }); lab("G/Ç ya da olay bekleme", MX + 4.55, 5.05, 2.0);
    d.arrow(s, MX + 2.75, 5.73, MX + 1.1, 4.37, { color: C.mintDeep }); lab("G/Ç ya da olay tamamlandı", MX - 0.25, 5.05, 2.4);
    d.text(s, "bekliyor → çalışıyor oku yok!", { x: MX + 1.7, y: 6.45, w: 3.3, h: 0.3, fontSize: 11.5, bold: true, color: C.red, align: "center" });
  }
  d.card(s, MX + 7.0, 1.65, 5.15, 2.55, { title: "PCB ve bağlam değişimi", body: [
    "PCB: durum, PID, program sayacı, yazmaçlar, zamanlama, bellek ve hesap bilgileri, açık dosyalar.",
    "Bağlam değişimi = durumu eski PCB'ye kaydet, yeni PCB'yi yükle. Saf ek yük: s / (q + s).",
  ], bodySize: 13 });
  d.card(s, MX + 7.0, 4.4, 5.15, 2.45, { title: "Süreç oluşturma", body: [
    "fork() çocuğa 0, ebeveyne çocuğun PID'sini döndürür.",
    "exec() programı değiştirir; wait() çocuğu toplar.",
    "Art arda n fork → 2ⁿ süreç. Zombi: bitmiş ama henüz beklenmemiş.",
  ], bodySize: 13 });
  s.addNotes("Bu diyagramı sınavdan önce ezbere çizin. Her ok için bir olay söyleyebilmelisiniz: seçilme (zamanlayıcı onu seçer), kesme (zaman dilimi bitti), G/Ç isteği ya da wait() (çalışıyor → bekliyor), disk kesmesi (bekliyor → hazır), çıkış. Bir süreç hiçbir zaman bekliyor durumundan doğrudan çalışıyor durumuna geçmez: önce hazır kuyruğuna girmelidir. Bağlam değişimi ek yükü s/(q + s) ve 2 üzeri n süreç, sevilen küçük sayısal sorulardır (1. problem).");

  // 12 ── 4. hafta (a)
  s = d.content({ kicker: "4. hafta · İş parçacıkları", title: "İş Parçacıkları, Modeller, Amdahl Yasası" });
  weekTag(s, "4. hafta");
  table(s, [
    ["Tüm iş parçacıklarında ortak", "Her iş parçacığına özel"],
    ["kod (metin bölümü)", "iş parçacığı kimliği"],
    ["global veri ve yığın (heap)", "program sayacı ve yazmaçlar"],
    ["açık dosyalar, PID, kullanıcı kimliği", "yığıt (yerel değişkenler)"],
  ], { x: MX, y: 1.7, w: 5.9, colW: [2.95, 2.95], fontSize: 13 });
  d.card(s, MX, 3.6, 5.9, 3.25, { title: "Modeller (kullanıcı : çekirdek iş parçacığı)", body: [
    { b: "Çoktan bire:", t: " hızlı, ama tek bir bloklayan çağrı hepsini durdurur; paralellik yok." },
    { b: "Birebir:", t: " Linux ve Windows; gerçek paralellik; her iş parçacığı bir çekirdek iş parçacığına mal olur." },
    { b: "Çoktan çoğa:", t: " Go goroutine'leri, Java sanal iş parçacıkları." },
    "Eşzamanlılık = birlikte ilerleme; paralellik = aynı anda (≥ 2 çekirdek gerekir).",
  ], bodySize: 12.5 });
  d.card(s, MX + 6.15, 1.7, 6.0, 1.75, { title: "İş parçacıklarının yararları", body: "Tepki verebilirlik, kaynak paylaşımı, ekonomi (süreçten ucuz: test makinemizde ≈ 4 kat), çok çekirdekli işlemcilerde ölçeklenebilirlik.", bodySize: 13 });
  d.code(s, MX + 6.15, 3.6, 6.0, 3.25,
`# Amdahl yasası: seri kesir S, N çekirdek
hızlanma(N) ≤ 1 / (S + (1 − S)/N)
sınır N → ∞:  1 / S

# S = 0.25:
N = 2 → 1.60   N = 4 → 2.29
N = 8 → 2.91   N → ∞ → 4`, 13.5);
  s.addNotes("Ortak ve özel öğeler tablosu klasik bir çoktan seçmeli soru kaynağıdır: yığıt (stack) özeldir, yığın (heap) ortaktır. Linux ve Windows birebir modeli kullanır. Amdahl yasası: slayttaki sayılar 4. hafta notlarındaki S = 0,25 örneğidir. Pratik ders: önce seri kısmı küçültün, sonra çekirdek ekleyin. 1(d) problemi S = 0,2 ile alıştırma yaptırır.");

  // 13 ── 4. hafta (b)
  s = d.content({ kicker: "4. hafta · İşlemci zamanlamanın temelleri", title: "Patlamalar, Karar Noktaları, Dağıtıcı, Ölçütler" });
  weekTag(s, "4. hafta");
  d.card(s, MX, 1.65, 6.0, 1.65, { title: "CPU–G/Ç patlama döngüsü", body: "İşlemci yoğun: az sayıda uzun CPU patlaması. G/Ç yoğun: çok sayıda kısa patlama. Patlamaların çoğu kısadır.", bodySize: 13 });
  d.card(s, MX, 3.45, 6.0, 1.95, { title: "Dört karar noktası", body: [
    "1 çalışıyor → bekliyor   2 çalışıyor → hazır", "3 bekliyor → hazır   4 sonlanma",
    "Kesintisiz: yalnızca 1 ve 4. Kesintili: dördü de.",
  ], bodySize: 13 });
  d.card(s, MX, 5.55, 6.0, 1.3, { title: "Dağıtıcı (dispatcher)", body: "Bağlamı değiştirir, kullanıcı moduna geçer, kaydedilmiş PC'ye atlar. Süresi = dağıtım gecikmesi.", bodySize: 12.5 });
  d.code(s, MX + 6.25, 1.65, 5.9, 3.75,
`T_dönüş   = T_tamamlanma − T_geliş
T_bekleme = T_dönüş − T_patlama
T_yanıt   = T_ilk çalışma − T_geliş

işlemci kullanımı = B / T  (meşgul / toplam)
üretilen iş       = n / T

en büyük: kullanım, üretilen iş
en küçük: dönüş, bekleme, yanıt`, 13.5);
  d.callout(s, MX + 6.25, 5.55, 5.9, 1.3, "Bekleme süresi = yalnızca hazır kuyruğunda geçen süre. Zamanlayıcı patlamaları ya da G/Ç'yi değiştiremez — yalnızca beklemeyi.", 13.5);
  s.addNotes("Bu üç formül her zamanlama sorusunda kullanılır (5. hafta notları aynı büyüklükleri T_bitiş ve T_varış diye yazar: T_dönüş = T_bitiş − T_varış). Bekleme süresini, özellikle bir süreç birkaç parça hâlinde çalıştığında, her zaman T_bekleme = T_dönüş − T_patlama formülünden hesaplayın. Süreç G/Ç yapıyorsa G/Ç süresini de çıkarın. Kesintisiz algoritmalarda yanıt süresi bekleme süresine eşittir.");

  // 14 ── 5. hafta (a)
  s = d.tableSlide({
    kicker: "5. hafta · Zamanlama algoritmaları", title: "Beş Algoritmaya Toplu Bakış",
    header: ["Algoritma", "Kural", "Kesintili mi?", "Dikkat"],
    colW: [1.85, 4.65, 1.6, 4.05],
    rows: [
      ["FCFS", "FIFO hazır kuyruğu, bitene kadar çalışır", "hayır", "konvoy etkisi: kısa işler uzun bir işin arkasında"],
      ["SJF", "en kısa sonraki CPU patlaması önce; τₙ₊₁ = α tₙ + (1 − α) τₙ", "hayır", "en iyi ortalama bekleme (hepsi hazırsa); tahmin gerekir"],
      ["SRTF", "KALAN süreden kısa olan yeni gelen işlemciyi alır", "evet", "en küçük ortalama bekleme; uzun işler aç kalabilir"],
      ["Öncelikli", "en yüksek öncelik önce (küçük sayı = yüksek)", "ikisi de", "açlık → çaresi: yaşlandırma"],
      ["Döngüsel (RR)", "zaman dilimi q, kesilen süreç kuyruğun sonuna", "evet", "q çok büyük → FCFS; çok küçük → ek yük s/(q + s)"],
    ],
    fontSize: 13.5, y: 1.7,
    callout: "Sınav uzlaşımları (yazın): bağlam değişimi = 0 · eşitlikte önce erken gelen, sonra ad · küçük sayı = yüksek öncelik · RR: zaman dilimi biterken gelen süreç kuyruğa kesilenden ÖNCE girer.",
  });
  weekTag(s, "5. hafta");
  s.addNotes("Bunlar tam olarak 5. hafta notlarının uzlaşımlarıdır; ders kitapları farklılaştığı için her zamanlama yanıtının başına yazın. Round Robin bir sonraki sıra için her beklemeyi (n − 1)q ile sınırlar. Üstel ortalama: alfa = 0,5, tau0 = 8 ve patlamalar 6, 10, 4 için tahminler 7, 8,5 ve 6,25'tir (review_problems.py ile denetlendi). 2. problem beş algoritmanın hepsini tek bir iş kümesine uygular.");

  // 15 ── 5. hafta (b)
  s = d.cardsSlide({
    kicker: "5. hafta · Eşzamanlama", title: "Yarış Durumu, Kritik Bölge, Semaforlar",
    cards: [
      { title: "Yarış durumu", body: ["Birkaç iş parçacığı ortak veriye erişir, en az biri yazar, sonuç zamanlamaya bağlıdır.", "counter++ = oku – ekle – yaz: bir güncelleme kaybolabilir."] },
      { title: "Kritik bölge problemi", body: ["Karşılıklı dışlama: içeride en çok bir iş parçacığı.", "İlerleme: dışarıdan veto yok, sonsuz erteleme yok.", "Sınırlı bekleme: açlık yok."] },
      { title: "Kilitler", body: ["Kesmeleri kapatmak: çok işlemcide olmaz, ayrıcalıklı.", "Peterson (2 iş parçacığı); atomik test_and_set / CAS.", "Muteks: acquire / release; döner kilit ya da uyuyarak bekleme."] },
      { title: "Semaforlar", body: ["wait(S): while (S <= 0); S--;   signal(S): S++;", "İkili (= muteks, başlangıç 1) ya da sayan (başlangıç N).", "Sınırlı tampon: empty = n, full = 0, mutex = 1."] },
    ], cols: 2, bodySize: 13.5,
    callout: "Kilitlenme: bir gruptaki her iş parçacığı yalnızca grubun başka bir üyesinin yol açabileceği bir olayı bekler (örn. wait(S); wait(Q) ile wait(Q); wait(S)). Önlem: kilitleri tek bir genel sırayla alın.",
  });
  weekTag(s, "5. hafta");
  s.addNotes("counter++ için kaybettiren bir iç içe geçme (interleaving) gösterebilmelisiniz (3. problem). Üç gereksinimin her biri için onu bozan bir 'çözüm' bilin: kimseyi içeri almamak ilerlemeyi bozar; katı sırayla dönüşüm ilerlemeyi bozar; her zaman A'yı tercih etmek sınırlı beklemeyi bozar. Sınırlı tamponda wait(empty) wait(mutex)'ten önce gelmelidir; yoksa üretici muteksi tutarken uyuyabilir ve sistem kilitlenir.");

  // 16 ── 6. hafta (a)
  s = d.cardsSlide({
    kicker: "6. hafta · Bellek yönetimi", title: "Bağlama, MMU, Yer Ayırma ve Parçalanma",
    cards: [
      { title: "Adres bağlama", body: ["Derleme zamanı: mutlak kod.", "Yükleme zamanı: yeri değiştirilebilir kod.", "Yürütme zamanı: MMU her erişimi çevirir — tüm modern sistemler."] },
      { title: "Taban ve sınır", body: ["Mantıksal a: 0 ≤ a < sınır ise fiziksel = taban + a; değilse tuzak.", "Bu yazmaçları yalnızca çekirdek yükleyebilir."] },
      { title: "Takas", body: ["Süre = boyut / aktarım hızı (100 MB, 50 MB/s: her yön 2 s).", "Modern sistemler süreçleri değil sayfaları takas eder."] },
      { title: "Yerleştirme", body: ["İlk uyan: yeterince büyük ilk delik.", "En iyi uyan: yeterince büyük en küçük delik.", "En kötü uyan: en büyük delik."] },
      { title: "Parçalanma", body: ["Dış: boş bellek, kullanılamayacak kadar küçük deliklerde (%50 kuralı: 1/3'e kadar kayıp).", "İç: ayrılmış bir bloğun içindeki kullanılmayan bellek."] },
      { title: "Sıkıştırma", body: ["Blokları bir araya taşı, tek delik kalsın.", "Yürütme zamanında bağlama gerekir; pahalıdır.", "Daha iyi çare: sayfalama."] },
    ], cols: 3, bodySize: 13.5,
  });
  weekTag(s, "6. hafta");
  s.addNotes("Denetim katıdır: sınıra eşit bir mantıksal adres zaten tuzak üretir, çünkü geçerli aralık 0 ile sınır − 1 arasıdır. Örnek: taban 12000, sınır 2500: 2499 adresi 14499'a eşlenir, 2500 adresi tuzak üretir. Uyan stratejileri: delik listesi adres sırasındadır ve istek seçilen deliğin başından kesilir (4. problem). Hangi parçalanmanın hangi yönteme ait olduğunu hatırlayın: değişken bölümler ve bölütleme dış parçalanmadan, sayfalama yalnızca iç parçalanmadan etkilenir.");

  // 17 ── 6. hafta (b)
  s = d.content({ kicker: "6. hafta · Sayfalama, TLB, bölütleme", title: "Sayfalar, Çerçeveler, TLB ve Bölütler" });
  weekTag(s, "6. hafta");
  {
    const y = 1.75;
    d.box(s, MX, y, 1.9, 0.6, "p", { sub: "sayfa numarası", fill: C.charcoal, size: 16, subSize: 10.5 });
    d.box(s, MX + 1.95, y, 1.9, 0.6, "d", { sub: "ofset (n bit)", fill: C.mint, color: C.dark, size: 16, subSize: 10.5 });
    d.arrow(s, MX + 3.9, y + 0.3, MX + 4.55, y + 0.3, { color: C.mintDeep, w: 2 });
    d.box(s, MX + 4.6, y, 2.0, 0.6, "sayfa tablosu [p] = f", { fill: C.light, size: 12.5 });
    d.arrow(s, MX + 6.65, y + 0.3, MX + 7.3, y + 0.3, { color: C.mintDeep, w: 2 });
    d.box(s, MX + 7.35, y, 1.9, 0.6, "f", { sub: "çerçeve numarası", fill: C.charcoal, size: 16, subSize: 10.5 });
    d.box(s, MX + 9.3, y, 1.9, 0.6, "d", { sub: "değişmez", fill: C.mint, color: C.dark, size: 16, subSize: 10.5 });
  }
  d.code(s, MX, 2.6, 6.0, 2.2,
`sayfa boyu 2ⁿ:  p = ⌊a / 2ⁿ⌋,   d = a mod 2ⁿ
a_fiz = f · 2ⁿ + d
4 KB sayfa + onaltılık: sayfa basamağını değiştir
tablo boyu = (2ᵐ / 2ⁿ) girdi × girdi boyu
32 bit, 4 KB, 4 B → 2²⁰ girdi = 4 MB`, 12.5);
  d.code(s, MX + 6.15, 2.6, 6.0, 2.2,
`# ders uzlaşımı (TLB araması hep sayılır)
EAT = α(t_TLB + t_m) + (1 − α)(t_TLB + 2t_m)
    = t_TLB + (2 − α) t_m
# sadeleştirilmiş (t_TLB ≈ 0):
EAT = α t_m + (1 − α) 2t_m`, 13);
  d.card(s, MX, 5.0, 6.0, 1.85, { title: "Sayfalama", body: "Dış parçalanma yok; iç: süreç başına ortalama yarım sayfa. Geçerli–geçersiz bit ve r/w/x bitleri her erişimde denetlenir.", bodySize: 13 });
  d.card(s, MX + 6.15, 5.0, 6.0, 1.85, { title: "Bölütleme", body: "Adres ⟨s, d⟩: 0 ≤ d < sınır[s] ise taban[s] + d, değilse tuzak. Değişken boy → dış parçalanma. x86-64 Linux: düz bölütler, işi sayfalama yapar.", bodySize: 13 });
  s.addNotes("Ofset hiçbir zaman çevrilmez: yalnızca sayfa numarası çerçeve numarasıyla değiştirilir. 4 KB'lık sayfalarda ve onaltılık adreslerde ofset son üç onaltılık basamaktır; bu yüzden çeviri yalnızca ilk basamağı değiştirmektir (5. problem). TLB için, soru aksini söylemedikçe ders uzlaşımını kullanın ve hangi uzlaşımı kullandığınızı yazın. Buradaki alfa TLB isabet oranıdır; üstel ortalamadaki alfa ile karıştırmayın.");

  // 18 ── 7. hafta (a)
  s = d.content({ kicker: "7. hafta · Sanal bellek", title: "İsteğe Bağlı Sayfalama, Sayfa Hataları, Değiştirme" });
  weekTag(s, "7. hafta");
  {
    const steps = ["1 Başvuru", "2 Tuzak", "3 Bulma", "4 Okuma", "5 Güncelleme", "6 Yeniden başlatma"];
    const sub = ["bit = i", "MMU → işletim sistemi", "diskteki sayfa, boş çerçeve", "disk → çerçeve", "çerçeve no., bit = v", "aynı komut"];
    const w = 1.85, gap = (12.15 - 6 * w) / 5;
    steps.forEach((t, i) => {
      const x = MX + i * (w + gap);
      d.box(s, x, 1.7, w, 0.85, t, { sub: sub[i], fill: i === 1 ? "F3D9D6" : i === 3 ? PALE : C.light, size: i === 5 ? 12.5 : 14, subSize: 10.5, color: C.dark });
      if (i < 5) d.arrow(s, x + w + 0.01, 2.12, x + w + gap - 0.01, 2.12, { color: C.mintDeep, w: 1.5 });
    });
  }
  d.code(s, MX, 2.8, 5.6, 1.6,
`EAT = (1 − p) t_m + p t_fault
p = sayfa hatası oranı; t_fault ≈ ms
→ p çok küçük olmalı (≈ 10⁻⁶)`, 13.5);
  d.card(s, MX, 4.6, 5.6, 2.25, { title: "Bunları da bilin", body: [
    "Geçerli–geçersiz bit; saf isteğe bağlı sayfalama; sayfalayıcı.",
    "Yazınca kopyala: fork() sayfaları ilk yazmaya kadar paylaşır.",
    "Değişiklik (kirli) biti: temiz kurban diske geri yazılmaz.",
  ], bodySize: 13 });
  table(s, [
    ["Algoritma", "Kurban", "Not"],
    ["FIFO", "en önce yüklenen", "ucuz; Belady anomalisi olabilir"],
    ["OPT", "en uzak gelecekte kullanılacak", "en az hata; geleceği ister"],
    ["LRU", "en uzun süredir kullanılmayan", "iyi; saat algoritmasıyla yaklaşılır"],
  ], { x: MX + 5.85, y: 2.8, w: 6.3, colW: [1.15, 2.45, 2.7], fontSize: 12 });
  d.card(s, MX + 5.85, 4.6, 6.3, 2.25, { title: "Boşa çalışma ve çalışma kümesi", body: [
    "Çok az çerçeve → sürekli hata → işlemci boşta → daha çok süreç alınır → daha kötü.",
    "WS(t, Δ) = son Δ başvurudaki farklı sayfalar; D = Σ WSSᵢ > m çerçeve ise → bir süreci askıya al.",
  ], bodySize: 13 });
  s.addNotes("Altı adım klasik bir kısa yanıtlı sorudur; komut yeniden başlatılır, çünkü hata oluştuğunda tamamlanmamıştı. Not: sayfa hatalı EAT'deki p hata oranıdır, 1. haftadaki G/Ç bekleme kesri p değil. Saat (ikinci şans): başvuru biti 1 → biti sıfırla ve ilerle; 0 → kurban. OPT ve LRU yığıt algoritmalarıdır ve hiçbir zaman Belady anomalisi göstermez.");

  // 19 ── 7. hafta (b)
  s = d.content({ kicker: "7. hafta · Dosya sistemleri", title: "Dosyalar, Erişim Yöntemleri, Dizinler, Bağlantılar" });
  weekTag(s, "7. hafta");
  d.card(s, MX, 1.65, 4.0, 2.55, { title: "Dosya ve düğüm (inode)", body: [
    "Öznitelikler: ad, kimlik, tür, konum, boyut, koruma, zaman damgaları.",
    "Linux: hepsi düğümde — ad hariç (o dizindedir).",
  ], bodySize: 13.5 });
  d.card(s, MX + 4.15, 1.65, 3.9, 2.55, { title: "İşlemler, tablolar", body: [
    "create, open, read, write, seek, close, delete (unlink), truncate.",
    "Bir kez open() → dosya tanımlayıcısı; süreç başına tablo (dosya işaretçisi), sistem geneli tablo (açılma sayısı).",
  ], bodySize: 12.5 });
  d.code(s, MX + 8.2, 1.65, 3.95, 2.55,
`# doğrudan erişim, k. kayıt
konum   = k · R
blok    = ⌊k·R / B⌋
blok içi = k·R − blok · B
SON baytı da denetle!`, 12.5);
  d.card(s, MX, 4.4, 4.0, 2.45, { title: "Erişim yöntemleri", body: [
    { b: "Sıralı:", t: " sırayla (teyp modeli)." },
    { b: "Doğrudan:", t: " herhangi bir n. blok (disk modeli)." },
    { b: "İndeksli:", t: " küçük bir indekste ara, sonra atla." },
  ], bodySize: 13 });
  d.card(s, MX + 4.15, 4.4, 3.9, 2.45, { title: "Dizin yapıları", body: [
    "Tek düzeyli → iki düzeyli → ağaç → döngüsüz çizge → genel çizge (döngüler).",
    "Mutlak yol / ile başlar; göreli yol çalışma dizininden; . ve ..",
  ], bodySize: 12.5 });
  d.card(s, MX + 8.2, 4.4, 3.95, 2.45, { title: "Bağlantılar", body: [
    { b: "Sabit:", t: " aynı düğüm için başka bir ad; bağlantı sayısı." },
    { b: "Sembolik:", t: " bir yol tutan dosya; hedef silinirse boşta kalır." },
  ], bodySize: 13 });
  s.addNotes("Blok hesabı: önce bayt konumunu, sonra taban (floor) bölmesiyle bloğu, sonra blok içindeki konumu bulun. Ardından kaydın son baytını denetleyin: bir sonraki bloğa düşüyorsa kayıt bir blok sınırını aşıyordur ve iki blok okuması gerekir (7. problem). Bağlantılar: ln a b ve rm a komutlarından sonra b hâlâ çalışır (bağlantı sayısı yeniden 1); ln -s a b ve rm a komutlarından sonra b boşta kalır.");

  // 20 ── Formül kâğıdı
  s = d.content({ kicker: "Formül kâğıdı", title: "1–7. Haftaların Bütün Formülleri Tek Slaytta" });
  table(s, [
    ["Hafta", "Büyüklük", "Formül"],
    ["1", "Toplu işleme kullanımı / çoklu programlama", "U = t_çalışma / (t_çalışma + t_hazırlık);   U(n) = 1 − pⁿ"],
    ["2", "Mikroçekirdek ve monolitik (tek istek)", "T_mono = 2t_s + t_w;   T_µ = 4t_s + 2t_c + t_w"],
    ["3, 5", "Bağlam değişimi (RR) ek yükü", "s / (q + s)"],
    ["3", "Art arda n fork() çağrısından sonra süreç", "2ⁿ  (2ⁿ − 1 tanesi yeni)"],
    ["4", "Amdahl yasası", "hızlanma ≤ 1 / (S + (1 − S)/N);  sınır 1/S"],
    ["4", "Dönüş ve bekleme süresi", "T_dönüş = T_tamamlanma − T_geliş;  T_bekleme = T_dönüş − T_patlama"],
    ["4", "Yanıt süresi", "T_yanıt = T_ilk çalışma − T_geliş"],
    ["5", "Patlamaların üstel ortalaması", "τₙ₊₁ = α tₙ + (1 − α) τₙ"],
    ["6", "Taban ve sınır", "0 ≤ a < sınır → taban + a, değilse tuzak"],
    ["6", "Sayfalama", "p = ⌊a/2ⁿ⌋, d = a mod 2ⁿ;  a_fiz = f · 2ⁿ + d"],
    ["6", "TLB ile etkin erişim süresi", "EAT = t_TLB + (2 − α) t_m"],
    ["7", "Sayfa hatalı etkin erişim süresi", "EAT = (1 − p) t_m + p t_fault"],
    ["7", "Doğrudan erişim, k. kayıt", "blok = ⌊kR / B⌋;  blok içi konum = kR − blok · B"],
  ], { y: 1.6, colW: [0.8, 3.85, 7.5], fontSize: 13.5 });
  s.addNotes("Bu tablo ders notlarında tek sayfalık bir formül kâğıdı olarak da basıldı. Harflerle ilgili uyarı: p 1. haftada G/Ç bekleme kesri, 7. haftada ise sayfa hatası oranıdır; alfa 6. haftada TLB isabet oranı, 5. haftada ise üstel ortalamanın ağırlığıdır. Sembollerinizin ne anlama geldiğini her zaman yazın. Sınavda formül kâğıdı verilip verilmeyeceği duyurulacak; bunları ezbere bilmeyi planlayın.");

  // 21 ── Mola
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Mola", subtitle: "Sırada: yedi çözümlü problem — her sayısal soru türü için bir tane." });
  s.addNotes("On dakika. Öğrencilerden mola sırasında 2. problemi (zamanlama) kâğıt üzerinde denemelerini isteyin: iş kümesi bir sonraki bölümün ilk problem slaytında.");

  // 22 ── Bölüm: problemler
  s = d.sectionSlide({ kicker: "Bölüm 2", title: "Çözümlü Problemler", subtitle: "Önce her birini kendiniz deneyin. Her sayı code/review_problems.py ile denetlendi." });
  s.addNotes("Her sayısal soru için yöntem: formülü yazın, sayıları birimleriyle yerine koyun, hesaplayın ve sonucu kutu içine alın. Aritmetik kaysa bile doğru yöntem için kısmi puan verilir.");

  // 23 ── 1. problem
  {
    const w1 = R.w1, w3 = R.w3, w4 = R.w4;
    s = d.cardsSlide({
      kicker: "1. problem · 1, 3, 4. haftalar", title: "Dört Kısa Hesap",
      cards: [
        { title: "(a) Çoklu programlama (H1)", body: [`İşler zamanın p = 0,6'sında G/Ç bekliyor. U(3)? U ≥ %95 için en küçük n?`,
          { b: `U(3) = 1 − 0,6³ = %${trf(100 * w1.U3, 1)}.`, t: ` 0,6⁵ ≈ 0,078 > 0,05 ama 0,6⁶ ≈ 0,047 ≤ 0,05 → n = ${w1.nmin}.` }] },
        { title: "(b) Bağlam değişimi (H3)", body: ["s = 4 µs. q = 2 ms ve q = 50 µs için ek yük?",
          { b: `4 / 2004 ≈ %${trf(100 * w3.cs1, 2)};`, t: `  4 / 54 ≈ %${trf(100 * w3.cs2, 1)}. Çok küçük zaman dilimleri işlemciyi boşa harcar.` }] },
        { title: "(c) fork() (H3)", body: ["fork(); fork(); printf(\"A\\n\"); fork(); printf(\"B\\n\");",
          { b: `A: ${w3.A} kez, B: ${w3.B} kez,`, t: ` ${w3.B} süreç (${w3.B - 1} tanesi yeni). Çıktı terminale gidiyor.` }] },
        { title: "(d) Amdahl (H4)", body: ["S = 0,2. 4 ve 8 çekirdekte hızlanma? Sınır?",
          { b: `1/(0,2 + 0,8/4) = ${tr(w4.N4)};`, t: `  1/(0,2 + 0,1) ≈ ${trf(w4.N8, 2)};  sınır 1/0,2 = 5.` }] },
      ], cols: 2, bodySize: 16,
    });
  }
  s.addNotes("(a) U(n) = 1 − p^n; ln 0,05 / ln 0,6 ≈ 5,86, dolayısıyla n = 6. (b) s/(q + s), q mikrosaniye cinsinden: 2 ms = 2000 µs. (c) İlk printf'ten önce 2 × 2 = 4 süreç vardır, her biri A yazar; üçüncü fork onları 8'e katlar, her biri B yazar. review_problems.py içinde os.fork() ile yapılan gerçek bir çalıştırma tam olarak 4 A ve 8 B yazdı. 3. haftadan uyarı: çıktı bir dosyaya giderse printf tamponlar ve fork() tamponu kopyalar; bu durumda A 8 kez görünebilir — sınav soruları terminali varsayar. (d) 8 çekirdek yalnızca 3,33 verir; 8'den çok uzak.");

  // 24 ── 2a. problem
  s = d.content({ kicker: "2. problem · 5. hafta", title: "Tek İş Kümesi, Beş Zamanlayıcı" });
  table(s, [["Süreç", "Varış", "Patlama", "Öncelik"], ...R.jobs.map(j => [j[0], String(j[1]), String(j[2]), String(j[3])])],
    { x: MX, y: 1.7, w: 3.7, colW: [0.9, 0.85, 1.0, 0.95], fontSize: 13, align: ["center", "center", "center", "center"] });
  d.card(s, MX, 4.0, 3.7, 2.85, { title: "Şemayı okuyun", body: [
    "SRTF t = 3: P3 (2) < P2'nin kalanı 3 → kesme.",
    "SRTF t = 8: P1 ve P4'ün ikisi de 5 ister → erken gelen P1.",
    "RR t = 3: P3, P1'in zaman dilimi biterken gelir → önce P3.",
  ], bodySize: 12 });
  {
    const rows = [["FCFS", "FCFS"], ["SJF", "SJF"], ["SRTF", "SRTF"], ["PRIO_P", "Öncelik (kes.)"], ["RR", "RR, q = 3"]];
    rows.forEach(([k, lab], i) => gantt(s, MX + 3.95, 1.75 + i * 1.02, 8.2, R[k].segs, { T: 18, label: lab, labelW: 1.75, h: 0.5, size: 12, tick: 10.5 }));
  }
  s.addNotes("İş kümesi: P1 (0, 7, öncelik 2), P2 (2, 4, 1), P3 (3, 2, 4), P4 (5, 5, 3); toplam işlemci işi 18 ms, işlemci hiç boşta kalmaz. SRTF'yi yavaşça izleyin: t = 2'de P2 (4) < P1'in kalanı 5, kesme; t = 3'te P3 (2) < P2'nin kalanı 3, kesme; P3 5'te biter; P2 (3 kaldı) 5–8 arası çalışır; t = 8'de P1 ve P4'ün ikisi de 5 ms ister, eşitlik kuralı P1'i seçer (erken gelen). Öncelikli: P2 (öncelik 1) t = 2'de P1'i keser. RR q = 3: t = 3'te P3, tam P1'in zaman dilimi biterken gelir; dolayısıyla kuyruk P2, P3, P1 olur.");

  // 25 ── 2b. problem
  {
    s = d.content({ kicker: "2. problem · 5. hafta", title: "Sonuçlar: Ortalamalar ve Bağlam Değişimleri" });
    const algos = [["FCFS", "FCFS", "hayır"], ["SJF", "SJF", "hayır"], ["SRTF", "SRTF", "evet"], ["PRIO_P", "Öncelikli", "evet"], ["RR", "RR, q = 3", "evet"]];
    table(s, [["Algoritma", "Kesintili", "Ort. bekleme", "Ort. dönüş", "Ort. yanıt", "Geçiş"],
      ...algos.map(([k, n, pre]) => [n, pre, tr(R[k].avg.waiting), tr(R[k].avg.turnaround), tr(R[k].avg.response), String(R[k].switches)])],
      { x: MX, y: 1.7, w: 7.3, colW: [1.45, 1.15, 1.25, 1.2, 1.2, 1.05], fontSize: 13, align: ["left", "center", "center", "center", "center", "center"] });
    const sr = R.SRTF.per;
    d.code(s, MX + 7.55, 1.7, 4.6, 3.05,
`# SRTF, formüllerden
P1: dönüş 13 − 0 = ${sr.P1.turnaround}, bekleme ${sr.P1.turnaround} − 7 = ${sr.P1.waiting}
P2: dönüş  8 − 2 = ${sr.P2.turnaround}, bekleme  ${sr.P2.turnaround} − 4 = ${sr.P2.waiting}
P3: dönüş  5 − 3 = ${sr.P3.turnaround}, bekleme  ${sr.P3.turnaround} − 2 = ${sr.P3.waiting}
P4: dönüş 18 − 5 = ${sr.P4.turnaround}, bekleme ${sr.P4.turnaround} − 5 = ${sr.P4.waiting}
ortalama bekleme = 16/4 = ${fmt(R.SRTF.avg.waiting)} ms`, 12);
    d.card(s, MX, 4.95, 12.15, 1.9, { title: "Sayılar ne söylüyor?", body: [
      `SRTF en küçük ortalama bekleme süresini (${tr(R.SRTF.avg.waiting)} ms) verir — kuramın söylediği gibi — ama RR'den sonra en çok bağlam değişimini yapar.`,
      `Öncelikli zamanlama ortalamaya değil öneme hizmet eder: düşük öncelikli P3 ${R.PRIO_P.per.P3.waiting} ms bekler. RR en kötü ortalama beklemeyi (${tr(R.RR.avg.waiting)} ms) ama iyi bir yanıt süresini (${tr(R.RR.avg.response)} ms) verir.`,
    ], bodySize: 13 });
  }
  s.addNotes("Sınav yanıtında Gantt şeması, her süreç için bitiş, dönüş ve bekleme süresini içeren bir tablo ve ortalamalar bulunmalıdır. Bekleme süresini dönüş eksi patlama olarak hesaplayın; kesintili zamanlamalarda boşlukları toplamaya çalışmayın. Buradaki bağlam değişimi sayısı = çalışan sürecin kaç kez değiştiği (bağlam değişimi süresi 0 alındı). Bu tablodaki her sayı review_results.json dosyasından geliyor.");

  // 26 ── 3. problem: eşzamanlama
  s = d.content({ kicker: "3. problem · 5. hafta", title: "Bir Yarış ve Bir Semafor, Adım Adım" });
  table(s, [
    ["Adım", "A: counter++", "B: counter--", "counter"],
    ["1", "oku (rax = 10)", "", "10"], ["2", "", "oku (rax = 10)", "10"], ["3", "1 ekle (rax = 11)", "", "10"],
    ["4", "", "−1 ekle (rax = 9)", "10"], ["5", "yaz", "", "11"], ["6", "", "yaz", "9  (10 olmalı)"],
  ], { x: MX, y: 1.7, w: 6.4, colW: [0.75, 2.05, 2.05, 1.55], fontSize: 12, align: ["center", "left", "left", "center"] });
  d.callout(s, MX, 5.0, 6.4, 1.85, `Altı adımın ${Object.values(R.race).reduce((a, b) => a + b, 0)} iç içe geçmesinin hepsi denetlendi: counter 9 (${R.race["9"]} sıra), 10 (${R.race["10"]} sıra) ya da 11 (${R.race["11"]} sıra) ile biter. 20 sıranın yalnızca 2'si doğru!`, 13.5);
  table(s, [
    ["Olay", "S", "Sonuç"],
    ["başlangıç (2 yazıcı)", "2", ""], ["T1 wait", "1", "T1 girer"], ["T2 wait", "0", "T2 girer"],
    ["T3 wait", "0", "T3 bloklanır"], ["T1 signal", "1 → 0", "T3 girer"], ["T2 signal", "1", ""], ["T3 signal", "2", "hepsi bitti"],
  ], { x: MX + 6.65, y: 1.7, w: 5.5, colW: [1.95, 1.05, 2.5], fontSize: 12.5, align: ["left", "center", "left"] });
  d.text(s, "Sayan semafor S = 2: aynı anda en çok iki iş parçacığı yazıcı kullanır.", { x: MX + 6.65, y: 5.4, w: 5.5, h: 0.6, fontSize: 13, italic: true, color: C.mutedOnLight });
  s.addNotes("Solda: artırmayı kaybettiren 9 iç içe geçmeden biri; B'nin yazması A'nınkinin üzerine yazar. 20 iç içe geçmenin tamamının sayımı (6 konumdan 3'ünü seçmek) review_problems.py içindedir. Çözüm: counter++ ve counter-- işlemlerini bir muteksle korunan kritik bölgeye koymak. Sağda: 5. haftadaki tanımla semafor izi; wait: while (S <= 0); S--. T1 signal yaptığında S 1 olur ve bekleyen T3 hemen wait'ini geçer; böylece S yeniden 0 olur. Muteks, S'nin 1 ile başlatıldığı özel durumdur.");

  // 27 ── 4. problem: uyan stratejileri
  s = d.content({ kicker: "4. problem · 6. hafta", title: "İlk Uyan, En İyi Uyan, En Kötü Uyan" });
  {
    const H = R.fit.holes, end = 2750, x0 = MX, w = 12.15, k = w / end, y = 1.95;
    s.addShape(P.shapes.RECTANGLE, { x: x0, y, w, h: 0.55, fill: { color: "E4E8E9" }, line: { type: "none" } });
    H.forEach(([st, sz]) => {
      d.box(s, x0 + st * k, y, sz * k, 0.55, `${sz}`, { fill: C.mint, color: C.dark, size: 13 });
      d.text(s, String(st), { x: x0 + st * k - 0.3, y: y + 0.57, w: 0.6, h: 0.25, fontSize: 10, color: C.mutedOnLight, align: "center" });
    });
    d.text(s, "Delikler (nane, boyut KB) adres sırasında; gri = kullanımda. İstekler sırayla: A = 340, B = 180, C = 420, D = 500 KB.", { x: MX, y: 1.6, w: 12.15, h: 0.32, fontSize: 13, italic: true, color: C.mutedOnLight });
    const cell = (rule, n) => { const p = R.fit[rule].placed[n]; return p ? `${p[0]}@${p[1]} → kalan ${p[2]}` : "beklemek zorunda"; };
    table(s, [["İstek", "İlk uyan", "En iyi uyan", "En kötü uyan"],
      ...R.fit.req.map(([n, sz]) => [`${n} = ${sz}`, cell("first", n), cell("best", n), cell("worst", n)])],
      { x: MX, y: 3.05, w: 12.15, colW: [1.65, 3.5, 3.5, 3.5], fontSize: 14 });
    const free = r => R.fit[r].left.reduce((a, h) => a + h[1], 0);
    d.callout(s, MX, 5.55, 12.15, 1.3, `İlk uyan: ${free("first")} KB boş olduğu hâlde D bekler (en büyük delik 350 KB) — dış parçalanma. En iyi uyan dördünü de yerleştirir. En kötü uyan iki kez başarısız: ${free("worst")} KB boş, en büyük delik 350 KB. Tek bir örnek genel bir şey kanıtlamaz.`, 13.5);
  }
  s.addNotes("Gösterim: 600@500, 500 KB adresinde başlayan 600 KB'lık delik demektir. Her istek seçilen deliğin başından kesilir, geri kalanı daha küçük bir delik olarak kalır. İlk uyan, yeterince büyük olan ilk deliği (adres sırasında) alır; en iyi uyan sığanların en küçüğünü; en kötü uyan en büyüğünü. osim.py içindeki fit_run() ile benzetildi. Örnek sınav kâğıdında ilk uyanın kazandığı ve en iyi uyanın başarısız olduğu bir durum bulacaksınız; bu yüzden hiçbir zaman bir algoritmanın her zaman en iyi olduğunu söylemeyin.");

  // 28 ── 5. problem: sayfalama + TLB
  s = d.content({ kicker: "5. problem · 6. hafta", title: "Adres Çevirisi ve TLB" });
  table(s, [["Sayfa", "Çerçeve", "Geçerli"], ["0", "3", "v"], ["1", "8", "v"], ["2", "6", "v"], ["3", "—", "i"], ["4", "10 (0xA)", "v"], ["5", "2", "v"]],
    { x: MX, y: 1.7, w: 2.9, colW: [0.8, 1.2, 0.9], fontSize: 13, align: ["center", "center", "center"] });
  d.text(s, "16 bitlik adresler, 4 KB sayfalar: p = ilk onaltılık basamak, d = son üç basamak.", { x: MX, y: 4.7, w: 2.9, h: 1.0, fontSize: 12, italic: true, color: C.mutedOnLight });
  d.code(s, MX + 3.15, 1.7, 4.6, 5.15,
`0x1C3B: p = 1, d = 0xC3B
  çerçeve 8 → 0x8C3B = 35899
  (8 × 4096 + 3131)

0x4F0E: p = 4, d = 0xF0E
  çerçeve 10 → 0xAF0E = 44814

0x2010: p = 2 → 0x6010 = 24592

0x3004: p = 3 geçersiz
  → TUZAK (çeviri yok)`, 13);
  {
    const t = R.tlb;
    d.code(s, MX + 8.0, 1.7, 4.15, 3.4,
`t_TLB = ${t.tt}, t_m = ${t.tm} ns, α = ${t.a}
EAT = 0.95 × 90 + 0.05 × 170
    = 85.5 + 8.5 = ${fmt(t.eat)} ns
denetim: 10 + 1.05 × 80 = 94
TLB'siz: 2 × 80 = 160 ns

EAT = 100 ns → α = ?
10 + (2 − α) 80 = 100
α = ${t.need}`, 12.5);
    d.card(s, MX + 8.0, 5.3, 4.15, 1.55, { title: "Sadeleştirilmiş (t_TLB ≈ 0)", body: "0,95 × 80 + 0,05 × 160 = 84 ns. Uzlaşımınızı yazın!", bodySize: 13 });
  }
  s.addNotes("0x1C3B için onluk yol: 7227 = 1 × 4096 + 3131, dolayısıyla p = 1, d = 3131; 8. çerçeve 8 × 4096 + 3131 = 35899 = 0x8C3B verir. Onaltılık yol daha hızlıdır: ilk basamağı değiştirin. 3. sayfa geçersizdir: MMU tuzak üretir, fiziksel adres yoktur. TLB: bir isabet t_TLB + t_m = 90 ns, bir ıska t_TLB + 2t_m = 170 ns tutar. Gereken isabet oranını bulmak için: 2 − alfa = 90/80 = 1,125, alfa = 0,875.");

  // 29 ── 6a. problem: FIFO ve LRU
  {
    const refs = R.refs;
    s = d.content({ kicker: "6. problem · 7. hafta", title: "Sayfa Değiştirme: FIFO ve LRU, 3 Çerçeve" });
    d.text(s, `Başvuru dizisi: ${refs.join(", ")}   ·   3 çerçeve, başlangıçta boş`, { x: MX, y: 1.55, w: 12.15, h: 0.32, fontSize: 13, italic: true, color: C.mutedOnLight });
    d.text(s, "FIFO", { x: MX, y: 1.9, w: 2, h: 0.32, fontSize: 14, bold: true, color: C.mintDeep });
    frameTable(s, refs, R.repl_FIFO, 3, MX, 2.2, 9.6, 0.36, 13);
    d.text(s, "LRU", { x: MX, y: 4.4, w: 2, h: 0.32, fontSize: 14, bold: true, color: C.mintDeep });
    frameTable(s, refs, R.repl_LRU, 3, MX, 4.7, 9.6, 0.36, 13);
    stat(s, MX + 9.85, 2.2, 2.3, 1.8, String(R.repl_FIFO.faults), "FIFO ile hata");
    stat(s, MX + 9.85, 4.7, 2.3, 1.8, String(R.repl_LRU.faults), "LRU ile hata");
  }
  s.addNotes("FIFO: 1, 2, 0 çerçeveleri doldurur (3 zorunlu hata). 4, 1'in yerine geçer (en eski). 2 bir isabettir — ve FIFO'da isabet sırayı DEĞİŞTİRMEZ. 3, 2'nin yerine geçer, sonra 2, 0'ın yerine; 1, 4'ün yerine ve böyle devam eder: 11 hata. LRU: 4'e başvuruda 1, 2, 0 içinde en uzun süredir kullanılmayan 1'dir; 3'e başvuruda çerçevelerde 4, 2, 0 vardır ve en uzun süredir kullanılmayan 0'dır, dolayısıyla 0 çıkar — sık kullanılan 2 kalır. 9 hata. Nane = yeni yüklenen sayfa; soluk sütunlar hatalardır.");

  // 30 ── 6b. problem: OPT
  {
    const refs = R.refs;
    s = d.content({ kicker: "6. problem · 7. hafta", title: "Sayfa Değiştirme: OPT ve Karşılaştırma" });
    d.text(s, "OPT (ileriye bak: en uzak gelecekte kullanılacak sayfayı değiştir)", { x: MX, y: 1.6, w: 12.15, h: 0.32, fontSize: 14, bold: true, color: C.mintDeep });
    frameTable(s, refs, R.repl_OPT, 3, MX, 1.95, 9.6, 0.36, 13);
    stat(s, MX + 9.85, 1.95, 2.3, 1.8, String(R.repl_OPT.faults), "OPT ile hata (en az)");
    const bars = [["OPT", R.repl_OPT.faults, C.mint], ["LRU", R.repl_LRU.faults, C.mintDeep], ["FIFO", R.repl_FIFO.faults, C.slate]];
    bars.forEach(([n, v, col], i) => {
      const y = 4.3 + i * 0.55;
      d.text(s, n, { x: MX, y, w: 0.9, h: 0.45, fontSize: 14, bold: true, color: C.charcoal, valign: "middle" });
      s.addShape(P.shapes.RECTANGLE, { x: MX + 0.95, y: y + 0.06, w: 5.2 * v / 14, h: 0.34, fill: { color: col }, line: { type: "none" } });
      d.text(s, `${v} hata`, { x: MX + 1.05 + 5.2 * v / 14, y, w: 1.4, h: 0.45, fontSize: 13, bold: true, color: C.charcoal, valign: "middle" });
    });
    d.text(s, "14 başvuru içinde", { x: MX, y: 5.95, w: 5.0, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight });
    d.card(s, MX + 7.0, 4.15, 5.15, 2.7, { title: "Yapabileceğiniz denetimler", body: [
      "Zorunlu hatalar: 5 farklı sayfa (0, 1, 2, 3, 4) → her algoritmada en az 5 hata.",
      "Her zaman OPT ≤ LRU ve OPT ≤ FIFO.",
      "4 çerçeveyle: FIFO 8, LRU 7, OPT 6 — burada anomali yok.",
    ], bodySize: 13 });
  }
  s.addNotes("OPT, 4'e başvuruda (4. konum): çerçeveler 1, 2, 0. Sonraki kullanımlar: 2 5. konumda, 1 8. konumda, 0 11. konumda — dolayısıyla 0 değiştirilir. 3'te: çerçeveler 1, 2, 4; sonraki kullanımlar 2 (7), 1 (8), 4 (10) → 4 çıkar. 7 hata, mümkün olan en az sayı. Akıl sağlığı denetimleri: dizi 5 farklı sayfa (0, 1, 2, 3, 4) kullanır, dolayısıyla her algoritmanın en az 5 hatası vardır; OPT hiçbir zaman geçilemez. 4 çerçeve sayıları review_problems.py'den.");

  // 31 ── 7. problem
  {
    const pf = R.pf, b = R.blk;
    s = d.content({ kicker: "7. problem · 7. hafta", title: "Sayfa Hatalı EAT ve Doğrudan Erişim Hesabı" });
    d.text(s, "(a) t_m = 100 ns, t_fault = 6 ms, p = 0,0002", { x: MX, y: 1.6, w: 6.0, h: 0.35, fontSize: 14, bold: true, color: C.mintDeep });
    d.code(s, MX, 2.0, 6.0, 3.3,
`t_fault = 6 ms = 6,000,000 ns
EAT = 0.9998 × 100 + 0.0002 × 6,000,000
    = 99.98 + 1,200 = ${pf.eat.toFixed(2)} ns
→ RAM'den yaklaşık ${(pf.eat / pf.tm).toFixed(0)} kat yavaş

yavaşlama < %5:  EAT < 105 ns
100 + p (6,000,000 − 100) < 105
p < 5 / 5,999,900 ≈ 8.3 × 10⁻⁷`, 13);
    d.text(s, "(b) 120 baytlık kayıtlar, 4096 baytlık bloklar: 750. kayıt?", { x: MX + 6.15, y: 1.6, w: 6.0, h: 0.35, fontSize: 14, bold: true, color: C.mintDeep });
    d.code(s, MX + 6.15, 2.0, 6.0, 3.3,
`konum    = 750 × 120 = ${b.off.toLocaleString("en-US")}
blok     = ⌊90,000 / 4096⌋ = ${b.blk}
blok içi = 90,000 − ${b.blk} × 4096 = ${b.inblk}

son bayt = 90,000 + 119 = 90,119
⌊90,119 / 4096⌋ = ${b.last}  → sonraki blok!
→ 21. bloğun 3984…4095 baytları
  ve 22. bloğun 0…7 baytları: iki okuma`, 13);
    d.callout(s, MX, 5.55, 12.15, 1.3, "Ders (a): önce her şeyi ns'ye çevirin; 5.000 erişimde tek bir hata bile belleği 13 kat yavaşlatır. Ders (b): kaydın son baytını her zaman denetleyin — burada kayıt bir blok sınırını aşıyor.", 13.5);
  }
  s.addNotes("(a) En sık yapılan hata milisaniye ile nanosaniyeyi karıştırmaktır. 1/p_maks ≈ 1,2 milyon: %5'lik bir yavaşlama için en çok 1,2 milyon bellek erişiminde bir hata. (b) Kayıt 21. bloğun 3984. baytında başlar; 4096 − 3984 = 112 bayt 21. bloğa sığar, kalan 8 bayt 22. bloktadır. Karşılaştırma için 40. kayıt (4.800. bayt) tamamen 1. bloktadır, konum 704 (bu da review_problems.py içinde). Not: kod kutularında sayılar programın yazdığı gibi (ondalık nokta, binler için virgül) bırakıldı.");

  // 32 ── Sık yapılan hatalar
  s = d.cardsSlide({
    kicker: "Sınav tekniği", title: "Puanlar Genellikle Nerede Kaybedilir?",
    cards: [
      { title: "Zamanlama", body: ["Bekleme = dönüş − patlama, 'başlama zamanı' değil.", "SRTF KALAN süreyle karşılaştırır.", "RR: yeni gelen kesilen süreçten önce."] },
      { title: "Birimler", body: ["8 ms = 8.000.000 ns; 2 ms = 2000 µs.", "Sayfalamada KB = 1024 B; takas sürelerinde MB/s verildiği gibi."] },
      { title: "Sayfalama", body: ["Ofset hiçbir zaman çevrilmez.", "Geçersiz sayfa → tuzak, sayı değil.", "a = sınır zaten tuzak (katı <)."] },
      { title: "Çerçeve tabloları", body: ["FIFO: isabet sırayı değiştirmez.", "LRU: isabet sayfayı en yeni yapar.", "Hataları iki kez sayın."] },
      { title: "Tanımlar", body: ["Eşzamanlılık ≠ paralellik.", "Karşılıklı dışlama ≠ ilerleme ≠ sınırlı bekleme.", "Açlık ≠ kilitlenme."] },
      { title: "Yanıtlar", body: ["Uzlaşımları ve birimleri yazın.", "Sayıdan önce formülü gösterin.", "'Neden'i tek cümleyle açıklayın."] },
    ], cols: 3, bodySize: 13.5,
  });
  s.addNotes("Bunlar bu tür sınavlarda en sık görülen hatalardır. İki tane daha: fork() sorularında var olan her sürecin bir sonraki fork'u yürüttüğünü unutmayın; bağlantılarda ise sabit bağlantı öbür adın silinmesinden sonra da yaşar, sembolik bağlantı yaşamaz. Kısa yanıtlı sorularda bir tanım artı bir somut örnek genellikle tam puan getirir.");

  // 33 ── Sınav stratejisi
  s = d.content({ kicker: "Sınav tekniği", title: "90 Dakikayı İyi Kullanmak" });
  {
    const parts = [["Oku", 5, C.slate], ["A Bölümü · 20 puan", 15, C.mint], ["B Bölümü · 20 puan", 20, C.mintDeep], ["C Bölümü · 60 puan", 45, C.charcoal], ["Denetim", 5, C.amber]];
    let x = MX; const k = 12.15 / 90;
    parts.forEach(([n, m, col]) => {
      d.box(s, x + 0.02, 1.8, m * k - 0.04, 0.75, n, { sub: `${m} dk`, fill: col, color: col === C.mint ? C.dark : C.white, size: m === 5 ? 11 : 13, subSize: 11 });
      x += m * k;
    });
    d.text(s, "Puan başına ≈ 0,9 dakika: 2 puanlık bir soru 10 dakika sürmemeli. [Süreler 90 dakikalık bir sınav varsayar.]", { x: MX, y: 2.65, w: 12.15, h: 0.35, fontSize: 13, italic: true, color: C.mutedOnLight });
  }
  d.card(s, MX, 3.2, 3.95, 3.65, { title: "Sınavdan önce", body: [
    "1–7. problemleri bakmadan yeniden çözün.",
    "Notlardaki deneme sınavını 90 dakikada yazın, sonra puanlayın.",
    "Kendi sayılarınızı denetlemek için code/*.py betiklerini çalıştırın.",
  ], bodySize: 13.5 });
  d.card(s, MX + 4.1, 3.2, 3.95, 3.65, { title: "Sınav sırasında", body: [
    "En iyi bildiğinizle başlayın.",
    "Gantt şemalarını ve çerçeve tablolarını zamanlarıyla düzgünce çizin.",
    "Takıldınız mı? Formülü yazın ve geçin — sonra geri dönün.",
  ], bodySize: 13.5 });
  d.card(s, MX + 8.2, 3.2, 3.95, 3.65, { title: "Kısmi puan", body: [
    "Yöntem sayılır: formül, yerine koyma, sonuç.",
    "Doğru yöntemle bulunan yanlış bir sayı da puan alır.",
    "Her yanıta birim yazın.",
  ], bodySize: 13.5 });
  s.addNotes("Zaman çubuğu, örnek yapıdaki (A: 20, B: 20, C: 60 puan) 90 dakikalık bir kâğıt için bir öneridir. Puanların çoğu C bölümündedir; bu yüzden çoktan seçmeliye 40 dakika harcamayın. Notlardaki 'Deneme Sınavı' bölümünün çözümleri verilmiştir; ayrı örnek kâğıdın da puanlama yönergesi (rubrik) içeren bir cevap anahtarı var; böylece puanların nasıl verildiğini görebilirsiniz.");

  // 34 ── Kısa sınav
  s = d.quizSlide({ questions: [
    "Bir süreç t = 3'te geliyor, 4 ms işlemci süresine ihtiyaç duyuyor ve t = 15'te bitiyor. Dönüş ve bekleme süreleri nedir?",
    "5. problemdeki sayfa tablosuyla (2. sayfa → 6. çerçeve) 0x2ABC mantıksal adresini çevirin.",
    "t_TLB = 10 ns, t_m = 100 ns, isabet oranı α = 0,9. Etkin erişim süresi (ders uzlaşımı)?",
    "ln -s a.txt b.txt, ardından rm a.txt. Veriyi b.txt üzerinden hâlâ okuyabilir misiniz? Neden?",
  ] });
  s.addNotes("Yanıtlar. (1) Dönüş 15 − 3 = 12 ms, bekleme 12 − 4 = 8 ms. (2) p = 2, d = 0xABC, 6. çerçeve → 0x6ABC. (3) EAT = 10 + (2 − 0,9) × 100 = 120 ns (= 0,9 × 110 + 0,1 × 210 = 99 + 21). (4) Hayır: sembolik bağlantı yalnızca artık var olmayan a.txt yolunu saklar — bağlantı boşta kalır. Sabit bağlantıyla (-s olmadan ln) veri hâlâ okunabilirdi. Bütün sayılar review_problems.py ile denetlendi.");

  // 35 ── Akılda kalanlar
  s = d.content({ kicker: "Toparlama", title: "8. Hafta: Akılda Kalması Gerekenler" });
  d.bullets(s, [
    { b: "1–4. haftalar:", t: " tarihçe ve hedefler, ikili mod ve sistem çağrıları, süreç durumları ve PCB, iş parçacıkları — her birinin tanımını ve bir örneğini bilin." },
    { b: "Zamanlama:", t: " Gantt şemasını çizin, sonra dönüş = tamamlanma − geliş ve bekleme = dönüş − patlama; uzlaşımları yazın." },
    { b: "Eşzamanlama:", t: " counter++ = oku–ekle–yaz; üç gereksinim; muteks ve semaforlar; kilitlenmeye karşı kilit sırası." },
    { b: "Bellek:", t: " taban + sınır denetimi, uyan stratejileri ve parçalanma, p | d ayrımı, EAT = t_TLB + (2 − α) t_m." },
    { b: "Sanal bellek ve dosyalar:", t: " EAT = (1 − p) t_m + p t_fault; FIFO / OPT / LRU tabloları; blok = ⌊kR/B⌋; sabit ve sembolik bağlantılar." },
    { b: "Alıştırma:", t: " notlardaki deneme sınavı ve örnek kâğıt — saat tutarak." },
  ], { fontSize: 18, y: 1.7, h: 5.15, paraSpaceAfter: 12 });
  s.addNotes("Bugünkü yedi problemi bakmadan çözebiliyor ve kapsam slaytındaki her terimi bir örnekle tek cümlede açıklayabiliyorsanız iyi hazırlanmışsınız demektir. Başarılar!");

  // 36–37 ── Kapanış
  d.closing({ nextWeek: "Linux Kabuğuna Giriş ve Dosya Sisteminde Gezinme", nextItems: [
    "Linux edinmek: laboratuvar bilgisayarları, WSL (wsl --install) ya da VirtualBox'ta bir Ubuntu sanal makinesi",
    "Terminal, kabuk ve çekirdek — kabuk bir sistem programıdır (2. hafta)",
    "İlk komutlar: whoami, date, uname -a, pwd, ls, cd",
    "Gerçek dizin ağacında mutlak ve göreli yollar (7. hafta)",
    "Yardım almak: --help, man, sekme tamamlama, komut geçmişi",
  ] });
  d.pres.slides[d.n - 2].addNotes("Vizeden sonra ders uygulamalı hâle geliyor. 9. haftada bir Linux sistemi kuruyor ya da açıyor ve kabuğu kullanmaya başlıyoruz: 7. haftanın dizin ağacı, mutlak ve göreli yollar ve düğüm (inode) fikirleri yazdığınız komutlara dönüşüyor. Lütfen 9. haftadan önce bir Linux terminali açabildiğinizden emin olun: bir laboratuvar bilgisayarı, Windows'ta WSL (yönetici olarak açılmış bir PowerShell'de wsl --install) ya da bir Ubuntu sanal makinesi.");
  d.pres.slides[d.n - 1].addNotes("Sınavla ilgili sorular için sözü öğrencilere bırakın. Kesinleşen tarih, salon ve kuralların Telegram kanalında duyurulacağını ve orada sorulan soruların herkese yardımcı olduğunu hatırlatın.");

  await d.save(path.join(__dirname, "MBLP131_Hafta8.pptx"));
  console.log("slides:", d.n);
})();
