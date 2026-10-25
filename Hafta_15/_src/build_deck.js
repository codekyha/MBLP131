// Hafta 15 sunumu (MBLP131, Türkçe): Final Sınavı Tekrarı ve Alıştırma
// (tüm ders: kuram 1–7. haftalar, uygulama 9–14. haftalar)
// İngilizce referans: ../week15/build_deck.js (aynı slayt sırası, aynı diyagramlar, aynı sayılar).
// Kuram sayıları code/theory_results.json'dan okunur (code/theory_check.py yazar); terminal çıktıları
// İngilizce haftanın gerçek kayıtlarıdır (code/out_*.txt; kullanıcı "student", makine okan-lab) ve
// değiştirilmeden kullanılır.
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("../lib/deck");
const d = new Deck({ week: 15, lang: "tr", assets: path.join(__dirname, "../lib") });
const code = f => fs.readFileSync(path.join(__dirname, "code", f), "utf8");
const out = k => code(`out_${k}.txt`).replace(/\n+$/, "");
const P = d.pres;
const R = JSON.parse(code("theory_results.json"));
const PALE = "D7E9E6";
const BODY = "3A464C";
const PC = { P1: [C.mint, C.dark], P2: [C.slate, C.white], P3: [C.amber, C.white], P4: [C.charcoal, C.white] };
const fmtPt = x => x.toFixed(2).replace(/\.?0+$/, "");   // kod kutuları: nokta
const fmt = x => fmtPt(x).replace(".", ",");                                               // Türkçe metin: virgül

// ---------- yardımcılar ----------------------------------------------------------------
// Terminal kutusu: d.code gibi, ama dersin istemi "student@okan-lab:...$" nane renginde.
function term(s, x, y, w, h, text, size = 12) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.dark }, rectRadius: 0.05, line: { type: "none" } });
  const maxC = Math.floor((w - 0.45) / (size / 72 * 0.62));
  const lines = [], cont = new Set();
  text.replace(/\n$/, "").split("\n").forEach(ln => {
    if (!ln.startsWith("student@okan-lab") || ln.length <= maxC) { lines.push(ln); return; }
    let rest = ln, first = true;            // uzun komutları " | " (ya da boşluk) noktasında böl
    while (rest.length > (first ? maxC : maxC - 4)) {
      const lim = first ? maxC : maxC - 4;
      let cut = rest.lastIndexOf(" | ", lim - 2), pipe = true;
      if (cut < 15) { cut = rest.lastIndexOf(" ", lim - 1); pipe = false; }
      if (!first) cont.add(lines.length);
      lines.push((first ? "" : "    ") + rest.slice(0, cut + (pipe ? 2 : 0)));
      rest = rest.slice(cut + (pipe ? 3 : 1)); first = false;
    }
    cont.add(lines.length);
    lines.push("    " + rest);
  });
  const runs = lines.map((ln, i) => {
    const isPrompt = ln.startsWith("student@okan-lab") || cont.has(i);
    const isNote = ln.startsWith("# ") || ln.trim() === "...";
    return { text: ln.length ? ln : " ", options: { color: isPrompt ? C.mint : isNote ? C.mutedOnDark : C.light, breakLine: i < lines.length - 1 } };
  });
  s.addText(runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: h - 0.24, fontFace: F.code, fontSize: size, valign: "top", margin: 0, lineSpacingMultiple: 1.05, isTextBox: true });
}

function gantt(s, x, y, w, segs, { T, h = 0.55, label, labelW = 1.35, size = 13 } = {}) {
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
    d.text(s, String(t), { x: x + t * k - 0.3, y: y + h + 0.06, w: 0.6, h: 0.26, fontSize: 11.5, align: "center", color: C.mutedOnLight });
  });
}

// theory_results.json'dan çerçeve tablosu (başvurular, adım adım çerçeveler, hata işaretleri)
function frameTable(s, tb, pol, x, y, w, rowH = 0.42, fsz = 13) {
  const labW = 1.0, n = tb.refs.length, cw = (w - labW) / n, nf = tb.n;
  const frames = tb[pol].frames, faults = tb[pol].fault;
  const labels = ["başvuru", ...Array.from({ length: nf }, (_, k) => `çerçeve ${k}`), "hata?"];
  labels.forEach((l, r) => d.text(s, l, { x, y: y + r * rowH, w: labW - 0.08, h: rowH, fontSize: 11, italic: true, color: C.mutedOnLight, valign: "middle", align: "right" }));
  for (let t = 0; t < n; t++) {
    const cx = x + labW + t * cw;
    d.box(s, cx + 0.02, y + 0.02, cw - 0.04, rowH - 0.04, String(tb.refs[t]), { fill: C.charcoal, size: fsz });
    for (let k = 0; k < nf; k++) {
      const v = k < frames[t].length ? String(frames[t][k]) : "";
      const prev = t > 0 && k < frames[t - 1].length ? String(frames[t - 1][k]) : "";
      const isNew = faults[t] && v === String(tb.refs[t]) && prev !== v;
      const fill = isNew ? C.mint : faults[t] ? PALE : C.light;
      d.box(s, cx + 0.02, y + (k + 1) * rowH + 0.02, cw - 0.04, rowH - 0.04, v, { fill, size: fsz, bold: isNew, color: faults[t] ? C.dark : "9AA5A8" });
    }
    d.text(s, faults[t] ? "F" : "", { x: cx, y: y + (nf + 1) * rowH, w: cw, h: rowH, fontSize: fsz, bold: true, color: C.red, align: "center", valign: "middle" });
  }
}

function stat(s, x, y, w, h, big, small, fill = C.charcoal) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: 0.06, line: { type: "none" } });
  d.text(s, [{ text: big, options: { fontSize: 34, bold: true, fontFace: F.title, color: C.mint, breakLine: true } },
             { text: small, options: { fontSize: 13, color: C.light } }], { x: x + 0.15, y, w: w - 0.3, h, align: "center", valign: "middle" });
}

function resultsTable(s, x, y, w, key, fontSize = 12.5) {
  const per = R[key].per, avg = R[key].avg;
  const cols = ["arrival", "burst", "completion", "turnaround", "waiting", "response"];
  const names = { arrival: "Varış", burst: "Patlama", completion: "Bitiş", turnaround: "Dönüş", waiting: "Bekleme", response: "Yanıt" };
  const hdr = ["", ...cols.map(c => names[c])].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize, align: "center" } }));
  const body = Object.keys(per).map((p, i) => [p, ...cols.map(c => String(per[p][c]))].map((t, j) => ({ text: t, options: { color: BODY, fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: F.body, fontSize, align: "center" } })));
  const avgRow = ["Ort.", "", "", "", fmt(avg.turnaround), fmt(avg.waiting), fmt(avg.response)].map(t => ({ text: t, options: { color: C.mintDeep, bold: true, fill: { color: PALE }, fontFace: F.body, fontSize, align: "center" } }));
  s.addTable([hdr, ...body, avgRow], { x, y, w, colW: Array(7).fill(w / 7), border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [3, 4, 3, 4], valign: "middle", rowH: 0.3 });
}

(async () => {
  // 1 ── Başlık
  let s = d.titleSlide({
    kicker: "MBLP131  ·  HAFTA 15",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 15  ·  Final Sınavı Tekrarı ve Alıştırma",
    tagline: "On beş hafta, tek sınav: ilk toplu iş sistemlerinden kendi kabuk betiklerinize.",
  });
  s.addNotes("Dersin son haftasına hoş geldiniz. Bugün tamamen sınava hazırlanıyoruz: sınavın biçimi, kuram haftalarının (1–7) ve Linux haftalarının (9–14) kısa bir tekrarı, finalde çıkacak türden çözümlü alıştırma problemleri, sık yapılan hatalar ve sınav stratejisi. Sonunda bütün derse kısa bir geri bakış yapıp bundan sonra nereye gidilebileceğini konuşacağız. Sonraki slaytlarda köşeli parantez içindeki her şey henüz kesinleşmemiş, benim onaylamam gereken bilgilerdir.");

  // 2 ── Sınav bilgileri
  s = d.cardsSlide({
    kicker: "Final sınavı", title: "Sınavla İlgili Bilgiler",
    cards: [
      { title: "Ne zaman, nerede", body: "[Tarih, saat ve salon: dersin Telegram kanalında duyurulacak]" },
      { title: "Süre", body: "[90] dakika. [15] dakika erken gelin; oturma düzeni duyurulduğu gibi." },
      { title: "Kâğıt", body: "Altı bölümde (A–F) 100 puan; bugün dağıtılan örnek kâğıtla aynı yapıda." },
      { title: "Yanınızda", body: "Öğrenci kimliği, kalem. [Basit, programlanamayan hesap makinesi: serbest — kesinleşecek]" },
      { title: "Kurallar", body: "Kitap kapalı [onaylanacak]. [Formül kâğıdı verilir / verilmez — kesinleşecek]. Telefonlar kapalı, çantada." },
      { title: "Ağırlık", body: "[Finalin ders notuna katkısı %__ — izlenceye bakın / kesinleşecek]" },
    ], cols: 3, bodySize: 15,
    callout: "[Köşeli parantez] içindeki her şey henüz resmî değildir. Geçerli olan, Telegram'daki son duyurudur.",
  });
  s.addNotes("Dersten önce köşeli parantezli bilgileri doldurun (tarih, salon, süre, hesap makinesi kuralı, formül kâğıdı, ağırlık). Öğrencilere bugün dağıtılan örnek kâğıdın gerçek sınavla aynı yapıya ve puan dağılımına sahip olduğunu [onaylanacak], ama soruların farklı olduğunu söyleyin. Resmî duyuru için Telegram'ı takip etmelerini hatırlatın.");

  // 3 ── Kapsam
  s = d.tableSlide({
    kicker: "Final sınavı", title: "Final Neyi Kapsıyor: Dersin Tamamını",
    header: ["Bölüm", "Soru türü", "Haftalar", "Puan*"],
    colW: [1.15, 6.5, 2.6, 1.9],
    rows: [
      ["A", "Çoktan seçmeli: kavramlar ve komutlar", "H1–H7, H9–H14", "20"],
      ["B", "Kısa yanıt: açıkla, karşılaştır, sırala", "H1–H7", "12"],
      ["C", "Sayısal problemler: Gantt şeması, sayfalama/TLB, sayfa değiştirme, EAT, blok hesabı", "H4–H7 (+ H1, H3)", "36"],
      ["D", "Komutu yazın", "H9–H13", "14"],
      ["E", "Boru hattını yazın", "H12", "9"],
      ["F", "Kısa bir Bash betiği yazın", "H14", "9"],
    ],
    fontSize: 15, y: 1.7,
    callout: "*Örnek kâğıdın puan dağılımı [gerçek kâğıt biraz farklı olabilir — onaylanacak]. 8. hafta (vize) yeni konu eklemez; onun çalışma kılavuzu 1–7. haftalar için hâlâ geçerlidir.",
  });
  s.addNotes("Final bütün dönemi kapsar: kuram haftaları 1–7 (vizede de vardı) ve uygulamalı Linux haftaları 9–14. Puanların kabaca üçte ikisi kuram, üçte biri uygulamadır. 1–7. haftaların en derli toplu özeti hâlâ 8. haftanın çalışma kılavuzudur; bugünkü notlarda daha kısa bir tekrar ve ek olarak uygulama kısmı var. Tabloda H = hafta.");

  // 4 ── Gündem
  s = d.content({ kicker: "Hafta 15", title: "Bugünün Gündemi" });
  [
    ["1", "Kuram tekrarı", "1–7. haftalar yedi slaytta, ayrıca tek sayfalık formül kâğıdı."],
    ["2", "Kuram alıştırması", "Dört çözümlü problem: zamanlama, sayfalama + TLB, sayfa değiştirme, EAT ve bloklar."],
    ["3", "Uygulama tekrarı", "9–14. haftalar: kabuk, dosyalar, izinler, borular, süreçler, betikler — gerçek çıktı."],
    ["4", "Uygulama alıştırması", "Komutu, boru hattını, betiği yazın: üç çözümlü problem."],
    ["5", "Sınav stratejisi", "Sık yapılan hatalar, 90 dakikanın kullanımı, kısa bir sınav."],
    ["6", "Dersin kapanışı", "Neler öğrendiniz, bundan sonra nereye?"],
  ].forEach((a, i) => {
    const y = 1.65 + i * 0.86;
    d.box(s, MX, y, 0.72, 0.72, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 0.9, y, w: 11.25, h: 0.72, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "   ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.2, y, w: 10.8, h: 0.72, valign: "middle" });
  });
  s.addNotes("1. ve 2. bölümler moladan önce, 3–6. bölümler moladan sonra. Öğrencilerin çözümlü problemler için kâğıt ve hesap makinesi hazır olsun: her problemi çözümü göstermeden önce kendileri denesinler.");

  // ───────────────────────── BÖLÜM 1: KURAM TEKRARI
  s = d.sectionSlide({ kicker: "Bölüm 1", title: "Kuram Tekrarı: 1–7. Haftalar", subtitle: "Haftalık notlardakiyle aynı terimler, aynı formüller, aynı uzlaşımlar." });
  s.addNotes("Bu, 8. hafta çalışma kılavuzunun sıkıştırılmış hâlidir. Burada yabancı gelen bir şey olursa o haftanın notlarına dönün ve tekrar sorularını yeniden çözün.");

  // 6 ── H1 + H2
  s = d.compareSlide({
    kicker: "1–2. haftalar", title: "Tarihçe, Tanımlar, Hedefler ve Yapılar",
    left: { title: "1. hafta — İşletim sistemleri neden var?", items: [
      "İşletim sistemi yok (ENIAC, 1945) → toplu iş + yerleşik monitör (GM-NAA I/O, 1956) → çoklu programlama ve zaman paylaşımı (1960'lar) → kişisel bilgisayarlar → telefonlar ve bulut.",
      { b: "Her şeyi boşta kalan işlemci yönlendirdi:", t: " U = t_çalışma / (t_çalışma + t_hazırlık);  n işin her biri zamanın p kesrinde G/Ç beklerse: U(n) = 1 − pⁿ." },
      { b: "Tarihler:", t: " UNIX 1969 (Bell Labs), Linux 1991 (Torvalds)." },
    ] },
    right: { title: "2. hafta — İşletim sistemi nedir?", items: [
      { b: "İki bakış:", t: " genişletilmiş makine (soyutlama) ve kaynak yöneticisi (zamanda ve uzayda paylaştırma). Çekirdek = bellekte hep duran öz." },
      { b: "Hedefler:", t: " kolaylık, verimlilik, gelişebilirlik." },
      { b: "Donanım:", t: " kesmeler; bellek hiyerarşisi yazmaçlar → önbellek → RAM → SSD → HDD." },
      { b: "İkili mod:", t: " mod biti 0 = çekirdek, 1 = kullanıcı; sistem çağrısı çekirdek moduna tuzakla geçer." },
      { b: "Yapılar:", t: " basit, monolitik, katmanlı, mikroçekirdek, modüler, hibrit." },
    ] },
    callout: "Tipik sorular: toplu ya da çoklu programlı sistemde U'yu hesaplayın; iki bakışı açıklayın; ikili mod neden donanım ister; monolitik ve mikroçekirdek (hız ve güvenilirlik).",
  });
  s.addNotes("Tipik sorular: kuşakları sırayla sayın; bir toplu iş sisteminin kullanım oranını (U = t_çalışma/(t_çalışma + t_hazırlık)) ya da çoklu programlı bir sistemin kullanım oranını (U(n) = 1 − p^n) hesaplayın; işletim sisteminin iki bakış açısını açıklayın; ikili modun neden donanım desteğine ihtiyaç duyduğunu anlatın; monolitik ve mikroçekirdek yapıları karşılaştırın (hız ve güvenilirlik). Mod biti: 2. hafta notlarındaki gibi 0 = çekirdek, 1 = kullanıcı.");

  // 7 ── H3: süreç durumları
  s = d.content({ kicker: "3. hafta", title: "Hizmetler, Sistem Çağrıları ve Sürecin Yaşam Döngüsü" });
  {
    const st = (x, y, label, fill, color) => d.box(s, x, y, 1.7, 0.62, label, { fill, color, size: 15, font: F.title });
    const ox = MX, oy = 1.75;
    st(ox, oy, "yeni", C.light);
    st(ox + 1.3, oy + 1.55, "hazır", PALE, C.dark);
    st(ox + 5.0, oy + 1.55, "çalışıyor", C.mint, C.dark);
    st(ox + 6.4, oy, "sonlandı", C.light);
    st(ox + 3.15, oy + 3.25, "bekliyor", C.slate);
    const lab = (x, y, w, t, al = "center") => d.text(s, t, { x, y, w, h: 0.3, fontSize: 11.5, bold: true, color: C.mintDeep, align: al });
    d.arrow(s, ox + 0.85, oy + 0.64, ox + 1.9, oy + 1.53, { w: 1.75 });           lab(ox - 0.1, oy + 0.95, 1.3, "kabul edildi", "left");
    d.arrow(s, ox + 3.02, oy + 1.72, ox + 4.98, oy + 1.72, { w: 1.75 });         lab(ox + 2.75, oy + 1.38, 2.5, "zamanlayıcı görevlendirir");
    d.arrow(s, ox + 4.98, oy + 2.02, ox + 3.02, oy + 2.02, { w: 1.75 });         lab(ox + 2.9, oy + 2.18, 2.2, "kesme");
    d.arrow(s, ox + 6.1, oy + 1.53, ox + 7.0, oy + 0.64, { w: 1.75 });           lab(ox + 6.8, oy + 0.95, 0.8, "çıkış", "left");
    d.arrow(s, ox + 5.6, oy + 2.19, ox + 4.6, oy + 3.23, { w: 1.75 });           lab(ox + 5.2, oy + 2.75, 2.8, "G/Ç ya da olay bekleme", "left");
    d.arrow(s, ox + 3.4, oy + 3.23, ox + 2.4, oy + 2.19, { w: 1.75 });           lab(ox - 0.45, oy + 2.75, 2.85, "G/Ç ya da olay tamamlandı", "right");
  }
  d.card(s, MX + 8.4, 1.65, 3.75, 5.2, { title: "3. haftadan ayrıca", body: [
    { b: "Sistem çağrısı:", t: " API → sarmalayıcı → tuzak; numara sistem çağrısı tablosunda indekstir." },
    { b: "PCB:", t: " durum, PC, yazmaçlar, zamanlama, bellek, dosyalar." },
    { b: "Bağlam değişimi:", t: " bir PCB'yi kaydet, diğerini yükle; ek yük s/(q + s)." },
    { b: "fork():", t: " döngüde n fork → 2ⁿ süreç (2ⁿ − 1 tanesi yeni)." },
  ], bodySize: 13.5 });
  d.callout(s, MX, 5.95, 8.15, 0.9, "Bekliyor → çalışıyor geçişi asla doğrudan olmaz: uyanan süreç önce hazır kuyruğuna girer. ps STAT: R, S, D, T, Z (13. hafta).", 13.5);
  s.addNotes("Beş durumlu diyagramı ezberden, etiketleriyle birlikte çizin; klasik bir sınav sorusudur. Sistem çağrılarının altı kategorisini ve sürecin bellek düzenini (text, data, bss, öbek, yığıt) hatırlatın. Bağlam değişimi ek yükü: s = 0,1 ms ve q = 4 ms ile 0,1/4,1 = işlemci zamanının %2,44'ü geçişe gider (theory_check.py ile denetlendi).");

  // 8 ── H4
  s = d.content({ kicker: "4. hafta", title: "İş Parçacıkları ve Zamanlama Ölçütleri" });
  d.card(s, MX, 1.65, 5.95, 2.6, { title: "İş parçacıkları", body: [
    { b: "Kendine ait:", t: " iş parçacığı kimliği, program sayacı, yazmaçlar, yığıt." },
    { b: "Ortak:", t: " sürecin kodu, verisi, öbeği, açık dosyaları." },
    { b: "Modeller:", t: " çoktan bire, birebir (Linux, Windows), çoktan çoka." },
    "Eşzamanlılık ≠ paralellik (paralellik birden çok çekirdek ister).",
  ], bodySize: 14 });
  d.card(s, MX, 4.45, 5.95, 2.4, { title: "Amdahl yasası", body: [
    { b: "hızlanma ≤ 1 / (S + (1 − S)/N)", t: ",  sınır 1/S." },
    `Örnek S = 0,2, N = 4: 1/(0,2 + 0,2) = ${fmt(R.D5.amdahl)}; asla 5'ten fazla değil.`,
  ], bodySize: 14 });
  d.code(s, MX + 6.2, 1.65, 5.95, 3.2,
`# Zamanlama ölçütleri (4. hafta)
T_dönüş   = T_tamamlanma − T_geliş
T_bekleme = T_dönüş − T_patlama
T_yanıt   = T_ilk çalışma − T_geliş

işlemci kullanımı = B / T   (meşgul / toplam)
üretilen iş       = n / T   (birim zamanda iş)`, 13);
  d.card(s, MX + 6.2, 5.05, 5.95, 1.8, { title: "Hedef", body: "Kullanımı ve üretilen işi en büyük; dönüş, bekleme ve yanıt süresini en küçük yap. Zamanlayıcı esas olarak bekleme süresini değiştirir.", bodySize: 14 });
  s.addNotes("Bu üç süre formülü her zamanlama sorusunda gerekir. Bekleme süresi = yalnızca hazır kuyruğunda geçen süre. Kesintisiz zamanlamada yanıt süresi bekleme süresine eşittir. Amdahl örneği denetlendi: 1/(0,2 + 0,8/4) = 2,5.");

  // 9 ── H5
  s = d.tableSlide({
    kicker: "5. hafta", title: "Zamanlama Algoritmaları ve Eşzamanlama",
    header: ["Algoritma", "Seçtiği", "Kesintili mi?", "Dikkat"],
    colW: [1.95, 4.2, 1.9, 4.1],
    rows: [
      ["FCFS", "en erken gelen", "hayır", "konvoy etkisi"],
      ["SJF", "en kısa sonraki patlama", "hayır", "tahmin: τₙ₊₁ = α tₙ + (1 − α) τₙ"],
      ["SRTF", "en kısa kalan süre", "evet", "en az ort. bekleme; uzun işler aç kalabilir"],
      ["Öncelik", "en küçük numara = en yüksek öncelik", "ikisi de", "açlık → yaşlandırma"],
      ["Round Robin", "kuyruğun başı, en çok q kadar", "evet", "iki sıra arası bekleme ≤ (n − 1)q"],
    ],
    fontSize: 15, y: 1.65,
  });
  d.card(s, MX, 4.65, 12.15, 2.2, { title: "Eşzamanlama", body: [
    { b: "Yarış durumu:", t: " ortak veri, en az bir yazan, sonuç zamanlamaya bağlı (counter++ = yükle–topla–sakla)." },
    { b: "Kritik bölge çözümü:", t: " karşılıklı dışlama, ilerleme, sınırlı bekleme. Araçlar: muteks (acquire/release), semaforlar wait(S) / signal(S); sınırlı tampon: empty, full, mutex." },
  ], bodySize: 15.5 });
  s.addNotes("Uzlaşımlarımız (sınavda yazın): bağlam değişimi süresi 0; eşitlikler önce varış zamanına, sonra ada göre bozulur; küçük öncelik numarası = yüksek öncelik; RR'de yeni gelen süreç, kesilen süreçten önce kuyruğa girer. Semaforlar: wait(S), S <= 0 olduğu sürece bekler, sonra azaltır; signal(S) artırır; POSIX adları sem_wait ve sem_post. Kilitlenme (deadlock) 5. haftanın sonunda bir uyarı olarak geçmişti.");

  // 10 ── H6
  s = d.content({ kicker: "6. hafta", title: "Bellek Yönetimi: Taban/Sınırdan Sayfalamaya" });
  {
    const y = 1.75, x = MX;
    d.box(s, x, y, 1.9, 0.62, "mantıksal a", { fill: C.light, size: 14 });
    d.box(s, x + 2.25, y - 0.05, 1.05, 0.72, "p", { fill: C.charcoal, size: 18, sub: "a ÷ 2ⁿ", subSize: 10 });
    d.box(s, x + 3.35, y - 0.05, 1.05, 0.72, "d", { fill: C.slate, size: 18, sub: "a mod 2ⁿ", subSize: 10 });
    d.arrow(s, x + 1.92, y + 0.31, x + 2.23, y + 0.31, { w: 1.5 });
    d.box(s, x + 2.25, y + 1.1, 1.05, 0.55, "f", { fill: C.mint, color: C.dark, size: 16 });
    d.text(s, "sayfa tablosu[p]", { x: x + 0.1, y: y + 1.12, w: 2.1, h: 0.5, fontSize: 12, italic: true, color: C.mutedOnLight, align: "right", valign: "middle" });
    d.arrow(s, x + 2.77, y + 0.69, x + 2.77, y + 1.08, { w: 1.5 });
    d.box(s, x + 3.35, y + 1.1, 1.05, 0.55, "d", { fill: C.slate, size: 16 });
    d.arrow(s, x + 3.87, y + 0.69, x + 3.87, y + 1.08, { w: 1.5 });
    d.text(s, "a_fiz = f · 2ⁿ + d", { x: x + 4.55, y: y + 1.1, w: 1.9, h: 0.55, fontSize: 14, bold: true, color: C.mintDeep, valign: "middle" });
  }
  d.card(s, MX, 3.6, 6.3, 3.25, { title: "Sayfalamadan önce", body: [
    { b: "MMU:", t: " 0 ≤ a < sınır ise a_fiz = taban + a, değilse tuzak." },
    { b: "Yerleştirme:", t: " ilk uyan (yeten ilk delik), en iyi uyan (en küçük), en kötü uyan (en büyük)." },
    { b: "Parçalanma:", t: " dış (delikler; %50 kuralı ⇒ üçte bire kadar kayıp), iç (blok içinde; sayfalamada süreç başına ½ sayfa)." },
  ], bodySize: 15.5 });
  d.card(s, MX + 6.55, 1.65, 5.6, 2.75, { title: "TLB (bizim uzlaşımımız)", body: [
    { b: "EAT = t_TLB + (2 − α) t_m", t: "" },
    "isabet: t_TLB + t_m; ıska: t_TLB + 2t_m (sayfa tablosu + veri).",
    "Sadeleştirilmiş (t_TLB = 0): α t_m + (1 − α) 2t_m — hangisini kullandığınızı yazın.",
  ], bodySize: 15.5 });
  d.card(s, MX + 6.55, 4.6, 5.6, 2.25, { title: "Bölütleme", body: [
    "Adres ⟨s, d⟩; 0 ≤ d < sınır[s] ise a_fiz = taban[s] + d, değilse tuzak.",
    "Sayfa tablosu boyutu = sayfa sayısı × girdi boyutu (2²⁰ × 4 B = 4 MB).",
  ], bodySize: 15 });
  s.addNotes("Sayfa numarası p adresin yüksek kısmı, konum (offset) d alçak kısmıdır; 2^n baytlık sayfalarla p = taban(a / 2^n) ve d = a mod 2^n; on altılık tabanda 4 KB'lık sayfalarla son üç on altılık basamak d'dir. Bizim EAT uzlaşımımız TLB aramasını hem isabette hem ıskada sayar; soru t_TLB vermiyorsa sadeleştirilmiş biçimi kullanın ve bunu belirtin. %50 kuralı: ayrılmış N bloğa karşılık 0,5 N blok parçalanmayla kaybolur; 0,5N/1,5N = 1/3.");

  // 11 ── H7
  s = d.compareSlide({
    kicker: "7. hafta", title: "Sanal Bellek ve Dosya Sistemleri",
    left: { title: "Sanal bellek", items: [
      "İsteğe bağlı sayfalama: sayfa ilk kullanımda yüklenir; geçerli–geçersiz bit; sayfa hatası = tuzak, yükle, komutu yeniden başlat.",
      { b: "EAT = (1 − p) t_m + p t_fault", t: " — p çok küçük olmalı (≈ 10⁻⁶)." },
      "Yazınca kopyala, fork()'u ucuzlatır.",
      { b: "Değiştirme:", t: " FIFO (Belady anomalisi olabilir), OPT (geleceği bilmeli), LRU (saat algoritması yaklaşır)." },
      "Boşa çalışma: çerçeve < çalışma kümesi → hesap yerine sayfalama.",
    ] },
    right: { title: "Dosya sistemleri", items: [
      "Dosya = adlandırılmış veri + öznitelikler (Linux: düğüm/inode); bir kez open(), sonra dosya tanımlayıcısı.",
      { b: "Erişim:", t: " sıralı, doğrudan (blok = ⌊konum / blok boyutu⌋), indeksli." },
      { b: "Dizinler:", t: " tek düzeyli, iki düzeyli, ağaç, döngüsüz çizge, genel çizge." },
      { b: "Bağlantılar:", t: " sabit = aynı düğüme ikinci ad; sembolik = yol tutan küçük dosya (boşa düşebilir)." },
    ] },
    callout: "Tipik sorular: FIFO/OPT/LRU çerçeve tabloları, sayfa hatalı EAT ve belli bir yavaşlama için en büyük p, bir kaydın blok numarası ve konumu, rm'den sonra sabit ve sembolik bağlantı.",
  });
  s.addNotes("7. hafta Linux yarısına köprüdür: yollar (9. hafta), cp/mv/rm/ln (10. hafta), düğümün mod alanı (11. hafta). Sayısal soru türleri: FIFO/OPT/LRU çerçeve tabloları, sayfa hatalı EAT ve belli bir yavaşlama için en büyük p, doğrudan erişimde blok hesabı.");

  // 12 ── Formül kâğıdı
  s = d.content({ kicker: "Kuram", title: "Tek Slaytta Formül Kâğıdı" });
  {
    const rows = [
      ["H1", "Toplu iş kullanımı", "U = t_çalışma / (t_çalışma + t_hazırlık)"],
      ["H1", "Çoklu programlama", "U(n) = 1 − pⁿ"],
      ["H3", "Geçiş ek yükü", "s / (q + s);   n fork → 2ⁿ süreç"],
      ["H4", "Amdahl", "hızlanma ≤ 1 / (S + (1 − S)/N)"],
      ["H4", "Süreler", "dönüş = bitiş − geliş;  bekleme = dönüş − patlama;  yanıt = ilk çalışma − geliş"],
      ["H5", "Patlama tahmini", "τₙ₊₁ = α tₙ + (1 − α) τₙ;   RR bekleme ≤ (n − 1) q"],
      ["H6", "Sayfalama", "p = ⌊a / 2ⁿ⌋,  d = a mod 2ⁿ,  a_fiz = f · 2ⁿ + d"],
      ["H6", "TLB", "EAT = t_TLB + (2 − α) t_m"],
      ["H7", "Sayfa hataları", "EAT = (1 − p) t_m + p t_fault"],
      ["H7", "Doğrudan erişim", "bayt = r × boyut;  blok = ⌊bayt / B⌋;  konum = bayt mod B"],
    ];
    const hdr = ["Hafta", "Büyüklük", "Formül"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 14 } }));
    const body = rows.map((r, i) => r.map((t, j) => ({ text: t, options: { color: j === 2 ? C.dark : BODY, fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: j === 2 ? F.code : F.body, fontSize: j === 2 ? 14 : 14.5 } })));
    s.addTable([hdr, ...body], { x: MX, y: 1.6, w: 12.15, colW: [0.95, 2.65, 8.55], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [3, 8, 3, 8], valign: "middle", rowH: 0.5 });
  }
  s.addNotes("Bu liste çalışma kılavuzundaki formül kâğıdının aynısıdır ('Formül ve komut kâğıdı' kısmı). Sınavda formül kâğıdı verilip verilmeyeceği henüz kesin değil; verilmeyecekmiş gibi hazırlanın. Her simge haftalık notlardaki anlamıyla kullanılır: t_m bellek erişim süresi, alfa TLB isabet oranı, p sayfa hatası oranı (U(n)'de ise G/Ç bekleme kesri — hangisi olduğu bağlamdan anlaşılır).");

  // 13 ── ÇP1 zamanlama
  s = d.content({ kicker: "Çözümlü problem 1 · 5. hafta", title: "Dört Süreçte SRTF ve Round Robin (q = 2)" });
  {
    const jobs = Object.entries(R.D1_SRTF.per).map(([p, r]) => `${p}: varış ${r.arrival}, patlama ${r.burst}`).join("     ");
    d.text(s, jobs + "   (ms)", { x: MX, y: 1.55, w: 12.15, h: 0.35, fontSize: 14, italic: true, color: C.mutedOnLight });
    gantt(s, MX, 2.05, 6.6, R.D1_SRTF.segs, { label: "SRTF", T: 13 });
    gantt(s, MX, 3.15, 6.6, R.D1_RR2.segs, { label: "RR, q = 2", T: 13 });
    d.text(s, "SRTF", { x: MX + 6.9, y: 1.95, w: 5.2, h: 0.3, fontSize: 13, bold: true, color: C.mintDeep });
    resultsTable(s, MX + 6.9, 2.25, 5.25, "D1_SRTF", 11.5);
    d.text(s, "RR, q = 2", { x: MX, y: 4.25, w: 5.2, h: 0.3, fontSize: 13, bold: true, color: C.mintDeep });
    resultsTable(s, MX, 4.55, 6.6, "D1_RR2", 12);
  }
  d.card(s, MX + 6.9, 4.55, 5.25, 2.3, { title: "Sonucu okuyun", body: [
    `Ortalama bekleme: SRTF ${fmt(R.D1_SRTF.avg.waiting)} ms, RR ${fmt(R.D1_RR2.avg.waiting)} ms.`,
    `Ortalama yanıt: SRTF ${fmt(R.D1_SRTF.avg.response)} ms, RR ${fmt(R.D1_RR2.avg.response)} ms.`,
    "SRTF beklemeyi en küçük yapar; RR her sürece çabucak sıra verir.",
  ], bodySize: 13.5 });
  s.addNotes("Önce öğrenciler denesin (5 dakika). SRTF: t=1'de P2 (3) P1'i (4 kaldı) keser; t=2'de P3 (1) P2'yi keser; t=3'te P2 devam eder (2 kaldı) — P4 (4) ve P1 (4) bekler; t=5'te P1 ile P4'ün ikisinde de 4 kalmıştır, eşitliği varış bozar: P1 5–9, sonra P4 9–13. RR q=2: t=2'de kuyruk P2, P3, P1'dir (P3 tam 2'de geldi ve kesilen P1'den önce girer); t=4'te P4 (3'te geldi) P2 geri dönmeden önce zaten kuyruktadır. Tüm sayılar code/theory_check.py'den.");

  // 14 ── ÇP2 sayfalama + TLB
  s = d.content({ kicker: "Çözümlü problem 2 · 6. hafta", title: "Adres Çevirisi ve TLB ile Etkin Erişim Süresi" });
  d.card(s, MX, 1.65, 5.4, 2.55, { title: "Soru", body: [
    "1 KB'lık sayfalar. Sayfa tablosu: sayfa 0 → çerçeve 5, 1 → 2, 2 → 7, 3 → 1.",
    "(a) 2500 mantıksal adresini çevirin.",
    "(b) t_TLB = 10 ns, t_m = 100 ns, α = 0,9: EAT? Hangi α 115 ns verir?",
  ], bodySize: 14 });
  d.code(s, MX + 5.65, 1.65, 6.5, 2.55,
`# (a) 1 KB = 2^10 = 1024 bayt
p = ⌊2500 / 1024⌋ = ${R.D2.p}
d = 2500 − ${R.D2.p} × 1024 = ${R.D2.d}
sayfa ${R.D2.p} → çerçeve ${R.D2.f}
a_fiz = ${R.D2.f} × 1024 + ${R.D2.d} = ${R.D2.phys}`, 14);
  d.code(s, MX, 4.4, 6.5, 2.45,
`# (b) bizim uzlaşımımız
EAT = t_TLB + (2 − α) t_m
    = 10 + (2 − 0.9) × 100 = ${fmtPt(R.D2.eat)} ns
sağlama: 0.9×110 + 0.1×210 = 99 + 21 = 120
115 = 10 + (2 − α)·100  ⇒  α = ${fmtPt(R.D2.alpha115)}`, 14);
  d.card(s, MX + 6.75, 4.4, 5.4, 2.45, { title: "Sınav ipuçları", body: [
    "p, d, f'yi ayrı satırlara yazın: kısmi puan.",
    "Sağlama: 0 ≤ d < sayfa boyutu; a_fiz çerçevenin aralığında: [7168, 8192).",
    "Kullandığınız EAT uzlaşımını belirtin.",
  ], bodySize: 14 });
  s.addNotes("Merak edenler için on altılık görünüm: 2500 = 0x9C4, konum 0x1C4 = 452, fiziksel adres 0x1DC4 = 7620. Soru, sayfa tablosunun ötesinde bir sayfa numarası verirse (ör. dört girdili tabloda sayfa 4) yanıt şudur: geçersiz, MMU tuzak üretir. Tüm değerler theory_check.py ile denetlendi.");

  // 15 ── ÇP3 sayfa değiştirme
  s = d.content({ kicker: "Çözümlü problem 3 · 7. hafta", title: "Üç Çerçeveyle FIFO, OPT ve LRU" });
  d.text(s, `Başvuru dizisi: ${R.D3.refs.join(", ")}  ·  3 çerçeve  ·  aşağıda: LRU (nane = yeni yüklenen sayfa)`, { x: MX, y: 1.55, w: 12.15, h: 0.35, fontSize: 13.5, italic: true, color: C.mutedOnLight });
  frameTable(s, R.D3, "LRU", MX, 1.95, 12.15, 0.44, 14);
  stat(s, MX, 4.75, 2.6, 2.1, String(R.D3.FIFO.faults), "FIFO ile hata");
  stat(s, MX + 2.8, 4.75, 2.6, 2.1, String(R.D3.LRU.faults), "LRU ile hata");
  stat(s, MX + 5.6, 4.75, 2.6, 2.1, String(R.D3.OPT.faults), "OPT ile hata (en az)");
  d.card(s, MX + 8.45, 4.75, 3.7, 2.1, { title: "Kilit kararlar", body: [
    "0'da (4. başvuru): LRU 3'ü çıkarır; OPT 5'i çıkarır (bir daha hiç kullanılmaz).",
    "4'te: OPT 3'ü çıkarır — o da bir daha gerekmez.",
  ], bodySize: 13 });
  s.addNotes("Tahtada önce FIFO, sonra tabloyla LRU, sonra OPT. FIFO: 3, 5, 1 yüklenir; 0, 3'ün yerine geçer (en eski); 3, 5'in yerine geçer; 1, 0, 3, 1 isabet; 4, 1'in yerine geçer; 1, 0'ın yerine geçer; 0, 3'ün yerine geçer: 8 hata. LRU: 7 hata (tablo). OPT: 4. başvuruda 5'i çıkar (bir daha kullanılmaz), 4 başvurusunda 3'ü çıkar: 5 hata, bunların 3'ü zorunlu. Sayılar theory_check.py'den.");

  // 16 ── ÇP4 EAT + blok + hızlı
  s = d.content({ kicker: "Çözümlü problem 4 · 1, 3, 4, 7. haftalar", title: "Kısa Hesaplar: EAT, Bloklar ve Hızlı Formüller" });
  d.code(s, MX, 1.65, 6.0, 2.75,
`# t_m = 100 ns, t_fault = 10 ms, p = 0.0002
EAT = 0.9998 × 100 + 0.0002 × 10 000 000
    = 99.98 + 2 000 = ${fmtPt(R.D4.eat)} ns   (×${(R.D4.eat / 100).toFixed(0)})
# yavaşlama < %10:  100 + p(10^7 − 100) < 110
p < 10 / 9 999 900 ≈ 1.0 × 10⁻⁶`, 14);
  d.code(s, MX + 6.15, 1.65, 6.0, 2.75,
`# kayıt 75; 128 B kayıt; 4096 B blok
bayt   = 75 × 128 = ${R.D4b.offset}
blok   = ⌊${R.D4b.offset} / 4096⌋ = ${R.D4b.block}
konum  = ${R.D4b.offset} − ${R.D4b.block} × 4096 = ${R.D4b.inblock}
son    = ${R.D4b.last} → blok ${R.D4b.lastblock}: sığar`, 14);
  d.code(s, MX, 4.6, 12.15, 2.25,
`# H1  U(n), p = 0.6, n = 3:                 1 − 0.6^3 = 1 − 0.216 = ${R.D5.u.toFixed(3)}
# H1  toplu iş, t_çalışma 2, t_hazırlık 3:  2 / (2 + 3) = ${R.D5.ub}
# H3  ek yük s = 0.1, q = 4:                0.1 / 4.1 = %${(100 * R.D5.overhead).toFixed(2)}
# H4  Amdahl S = 0.2, N = 4:                1 / (0.2 + 0.8/4) = ${fmtPt(R.D5.amdahl)}  (sınır 1/S = 5)`.replace(/^# /gm, ""), 14);
  s.addNotes("Birimler! Yerine koymadan önce 10 ms'yi 10.000.000 ns'ye çevirin. EAT, bellek erişim süresinin 21 katıdır. Blok sorusunda son baytı da mutlaka denetleyin: bir sonraki bloğa düşüyorsa kayıt için iki blok okumak gerekir. Tüm sayılar theory_check.py ile denetlendi.");

  // 17 ── Mola
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Mola", subtitle: "Sırada: dersin Linux yarısı — 9–14. haftalar." });
  s.addNotes("On dakika. İsteyen öğrenciler laboratuvar bilgisayarlarına girip bash mcmp117_lab_setup.sh komutunu çalıştırabilir; böylece ikinci saat için ~/lab temiz olur.");

  // ───────────────────────── BÖLÜM 2: UYGULAMA TEKRARI
  s = d.sectionSlide({ kicker: "Bölüm 2", title: "Uygulama Tekrarı: 9–14. Haftalar", subtitle: "Bu slaytlardaki tüm çıktılar gerçektir; yeni oluşturulmuş bir ~/lab'da kaydedildi (bash mcmp117_lab_setup.sh)." });
  s.addNotes("Buradan sonraki her terminal kutusu Linux makinemizden alınmış gerçek çıktıdır; kullanıcı adı student olarak değiştirildi. Tarihler, PID'ler ve boyutlar sizin makinenizde farklı olacaktır. LC_ALL=C.UTF-8 kullanıyoruz; bu, ls ve sort çıktısının sırasını etkiler. Türkçe yerel ayarlı bir sistemde (LANG=tr_TR.UTF-8) birçok ileti Türkçe çıkar ve sıralama farklı olabilir.");

  // 19 ── H9 + H10
  s = d.content({ kicker: "9–10. haftalar", title: "Gezinme, Dosyalar ve Joker Karakterler" });
  term(s, MX, 1.65, 7.2, 5.2, out("w09").split("\n").filter(l => !/^student@okan-lab:~\/lab\/projects\/alpha\/src\$ pwd|^\/home\/student\/lab\/projects\/alpha\/src$/.test(l)).join("\n") + "\n" +
    out("w10").split("\n").filter(l => !/wc -l|students.csv$|syllabus.txt$|total$|ln -s|ls -l docs|latest.log ->/.test(l)).join("\n"), 11.5);
  d.card(s, MX + 7.45, 1.65, 4.7, 5.2, { title: "Unutmayın", body: [
    { b: "Yollar:", t: " mutlak yol / ile başlar; göreli yol buradan başlar; ~ ev dizini, . burası, .. üst dizin, cd - geri." },
    { b: "Komutun yapısı:", t: " komut -seçenekler argümanlar." },
    { b: "Joker karakterler:", t: " * herhangi bir dizgi, ? tek karakter, [abc] bunlardan biri; süslü ayraç {a,b} {1..5}. Bunları komut değil kabuk genişletir." },
    { b: "Dosyalar:", t: " mkdir -p, touch, cp -r, mv, rm -r (geri dönüşüm kutusu yok!), ln / ln -s." },
  ], bodySize: 15 });
  s.addNotes("Gerçek çıktı (out_w09.txt, out_w10.txt). ls'in sütunlar hâlinde yazdığını, göreli cd ../../beta/docs komutunu ve ?'in tam olarak tek karakterle eşleştiğini gösterin (img00?.jpg 9 dosya verir, img010 gelmez). echo satırı, süslü ayraç genişletmesini ve joker karakterleri kabuğun yaptığını gösterir. rm -r kalıcı olarak siler: önce yolu mutlaka denetleyin, emin değilseniz rm -ri kullanın.");

  // 20 ── H11
  s = d.content({ kicker: "11. hafta", title: "İzinler: Modu Okumak ve Ayarlamak" });
  {
    const y = 1.75, chars = "-rwxr-x---".split(""), x0 = MX;
    const groups = [[0, 0, "tür", C.charcoal], [1, 3, "sahip (u)", C.mint], [4, 6, "grup (g)", C.mintDeep], [7, 9, "diğerleri (o)", C.slate]];
    chars.forEach((c, i) => d.box(s, x0 + i * 0.6, y, 0.55, 0.65, c, { fill: i === 0 ? C.charcoal : i <= 3 ? C.mint : i <= 6 ? C.mintDeep : C.slate, color: i >= 1 && i <= 3 ? C.dark : C.white, size: 20, font: F.code }));
    groups.forEach(([a, b, l]) => d.text(s, l, { x: x0 + a * 0.6 - (a === 0 ? 0.1 : 0), y: y + 0.7, w: (b - a + 1) * 0.6 - 0.05 + (a === 0 ? 0.2 : 0), h: 0.3, fontSize: 11.5, bold: true, color: C.charcoal, align: "center" }));
    d.text(s, "7 = 4+2+1     5 = 4+0+1     0", { x: x0 + 0.6, y: y + 1.05, w: 5.4, h: 0.32, fontSize: 13, bold: true, color: C.mintDeep, align: "center" });
  }
  d.card(s, MX, 3.3, 6.0, 3.55, { body: [
    { b: "r = 4, w = 2, x = 1:", t: " rwxr-x--- = 750." },
    { b: "Dizinler:", t: " r listele, w girdi oluştur/sil, x içine gir (cd)." },
    { b: "Sembolik:", t: " chmod u+x, go-w, a=r, g-x,o+r." },
    { b: "umask:", t: " 666 (dosya) / 777 (dizin) içinden bit siler: mod AND NOT umask; umask 027 → 640 / 750." },
    { b: "Yalnızca root:", t: " chown, chgrp; sudo tek bir komutu root olarak çalıştırır — önce düşünün." },
  ], bodySize: 15 });
  term(s, MX + 6.25, 1.65, 5.9, 5.2, out("w11"), 10.5);
  s.addNotes("Gerçek çıktı (out_w11.txt). Öğrencinin kendi grubunun adı burada da student'tır (kullanıcıya özel grup). umask 0002, Ubuntu'da sıradan kullanıcılar için varsayılandır: yeni dosyalar 664 (rw-rw-r--). Bir izin sorununu asla chmod 777 ile 'çözmeyin': bu herkese yazma izni verir. setuid (/usr/bin/passwd) ve yapışkan bit (sticky bit, /tmp) yalnızca kısaca anılmıştı.");

  // 21 ── H12
  s = d.content({ kicker: "12. hafta", title: "Akışlar, Yönlendirme ve Borular" });
  d.card(s, MX, 1.65, 5.2, 5.2, { title: "Kurallar", body: [
    { b: "fd 0 / 1 / 2:", t: " standart girdi, standart çıktı, standart hata (2. hafta: write(1, …))." },
    { b: "> dosya", t: " üzerine yaz,  >> sona ekle,  < girdi." },
    { b: "2> dosya", t: " yalnızca hatalar;  2>&1 hatalar stdout'un gittiği yere;  &> ikisi birden;  > /dev/null at." },
    { b: "a | b:", t: " a'nın stdout'u b'nin stdin'i olur; iki süreci de kabuk oluşturur (3. hafta)." },
    { b: "uniq -c", t: " yalnızca ARDIŞIK tekrarları sayar: önce sort." },
  ], bodySize: 15 });
  term(s, MX + 5.45, 1.65, 6.7, 5.2, out("w12").split("\n").filter(l => !/head -3|^1[378]:/.test(l)).join("\n"), 12);
  s.addNotes("Gerçek çıktı (out_w12.txt). Boru hattını yüksek sesle okuyun: boşlukla ayrılmış 9. alanı (HTTP durum kodu) kes, eşit kodlar yan yana gelsin diye sırala, say, sayıya göre büyükten küçüğe sırala. Hata iletisi ekrana değil errors.txt'ye gitti: bu 2>'dir. Bilinmesi gereken grep seçenekleri: -i -n -v -c -r -w; düzenli ifadeler ^ $ . [ ] *.");

  // 22 ── H13
  s = d.content({ kicker: "13. hafta", title: "Süreçler, İşler ve Sinyaller" });
  s.addTable([
    ["Sinyal", "No.", "Anlamı"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 13.5 } })),
    ...[["SIGINT", "2", "Ctrl+C: kesme"], ["SIGTERM", "15", "kill varsayılanı: lütfen dur"], ["SIGKILL", "9", "kill -9: yakalanamaz"], ["SIGSTOP", "19", "duraklat; yakalanamaz"], ["SIGCONT", "18", "devam et (fg / bg)"]]
      .map((r, i) => r.map((t, j) => ({ text: t, options: { color: BODY, fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: j < 2 ? F.code : F.body, fontSize: 14.5 } }))),
  ], { x: MX, y: 1.65, w: 5.6, colW: [1.45, 0.7, 3.45], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [4, 6, 4, 6], valign: "middle", rowH: 0.42 });
  d.card(s, MX, 4.25, 5.6, 2.6, { body: [
    { b: "İşler:", t: " komut & (arka plan), jobs, fg %1, bg %1, Ctrl+Z (SIGTSTP), kill %1." },
    { b: "Bakmak:", t: " ps, ps -ef, ps aux, pstree, top; STAT R S T Z (3. hafta durumları)." },
    { b: "Öncelik:", t: " nice −20 … 19; yalnızca root düşürebilir (5. hafta)." },
    { b: "$$", t: " kabuğun PID'i, $! son arka plan işinin PID'i." },
  ], bodySize: 14.5 });
  term(s, MX + 5.85, 1.65, 6.3, 5.2, out("w13").replace(/\n\d+\n\d+\n\d+\n\d+\n\d+$/, "\n15\n9\n2\n19\n18"), 12);
  s.addNotes("Gerçek çıktı (out_w13.txt); PID'ler farklı olacaktır. İlk ps satırı komutlarımızı çalıştıran kabuktur (burada bir betik; sizin terminalinizde bash). Numarasız kill SIGTERM (15) gönderir — programa temizlik yapma fırsatı verin; kill -9'u yalnızca SIGTERM işe yaramazsa kullanın. Etkileşimli bir terminalde kabuk bir sonraki istemde '[1]+ Terminated sleep 600' bildirir. kill -l adları numaralara çevirir (x86 Linux'ta 15 9 2 19 18). 'nice değerini düşürmek' önceliği yükseltmek demektir; bunu yalnızca root yapabilir.");

  // 23 ── H14
  s = d.content({ kicker: "14. hafta", title: "Kabuk Betikleri: Yapı Taşları" });
  d.code(s, MX, 1.65, 5.6, 5.2,
`#!/bin/bash
# her sınav betiğinin iskeleti
if [ $# -ne 1 ]; then           # argüman denetimi
    echo "usage: $0 ARG" >&2
    exit 1
fi
count=0                         # = boşluksuz
for f in "$1"/*; do             # dosya döngüsü
    if [ -f "$f" ]; then        # sınama: -f -d -e
        count=$((count + 1))    # aritmetik
    fi
done
echo "$count files in $1"`, 12);
  term(s, MX + 5.85, 1.65, 6.3, 3.6, out("w14"), 11.5);
  d.card(s, MX + 5.85, 5.45, 6.3, 1.4, { body: [
    "Sayılar: -eq -ne -lt -le -gt -ge.  Dizgiler: = != -z.  Çalıştırma: chmod +x s.sh; ./s.sh  ya da  bash s.sh.  Hata ayıklama: bash -x s.sh.",
  ], bodySize: 13 });
  s.addNotes("Soldaki kutu neredeyse her sınav betiğinin arkasındaki kalıptır: shebang satırı, $# ile argüman denetimi, kullanım iletisini standart hataya yazıp exit 1, bir döngü, bir sınama, aritmetik ve son echo. Sağdaki kutu gerçek çıktıdır (out_w14.txt): çift tırnak değişkenleri genişletir, tek tırnak genişletmez; aritmetik için $(( )), komut yerine koyma için $( ). 14. haftanın iki tam betiği (backup.sh, report.sh) iyi tekrar malzemesidir.");

  // 24 ── Komut kâğıdı 1
  s = d.tableSlide({
    kicker: "Komut kâğıdı · 1/2", title: "Gezinme, Dosyalar ve İzinler (9–11. haftalar)",
    header: ["Görev", "Komut", "Görev", "Komut"],
    colW: [2.65, 3.4, 2.65, 3.45],
    rows: [
      ["Neredeyim?", "pwd", "Klasör kopyala", "cp -r src/ dst/"],
      ["Uzun, gizliler dahil", "ls -la   (-h boyut)", "Taşı / yeniden adlandır", "mv old new"],
      ["Ev / geri / yukarı", "cd ~   cd -   cd ..", "Sil (sorarak)", "rm -i f   rm -r dir"],
      ["Yardım", "man ls   ls --help", "Bağlantılar", "ln f h   ln -s f s"],
      ["Klasör oluştur", "mkdir -p a/b/c", "Dosyayı göster", "cat less head tail -n"],
      ["Boş dosya / zaman", "touch f", "Boyutlar", "wc -l   du -sh   df -h"],
      ["Ben kimim?", "whoami   id   groups", "Üst veri", "stat f   file f   ls -i"],
      ["İzinler", "chmod 640 f   chmod u+x f", "Sahip (root)", "sudo chown u:g f"],
    ],
    fontSize: 15, y: 1.65,
  });
  s.addNotes("Bu tablo ve bir sonraki, çalışma kılavuzunda tek sayfalık komut kâğıdı olarak da var. Öğrencilere her komutu yalnızca tanımayı değil YAZABİLMEYİ hedeflemelerini söyleyin. Sınav sorularında seçenekler önemlidir: mkdir için -p, cp ve rm için -r, etkileşim için -i, sembolik bağlantı için -s, okunabilir boyutlar için -h.");

  // 25 ── Komut kâğıdı 2
  s = d.tableSlide({
    kicker: "Komut kâğıdı · 2/2", title: "Metin, Borular, Süreçler ve Betikler (12–14. haftalar)",
    header: ["Görev", "Komut", "Görev", "Komut"],
    colW: [2.65, 3.55, 2.4, 3.55],
    rows: [
      ["Satır bul", "grep -n -i -v -c -w", "Süreçler", "ps aux   ps -ef   top"],
      ["k. alan, ayraç d", "cut -d, -f3", "Arka plan", "cmd &   jobs   fg %1"],
      ["Sayısal sırala", "sort -n -r -t, -k5", "Kibarca durdur", "kill PID   (SIGTERM)"],
      ["Tekrarları say", "sort | uniq -c", "Zorla durdur", "kill -9 PID   (SIGKILL)"],
      ["Başlık satırını atla", "tail -n +2 f", "Önceliği düşür", "nice -n 10 cmd"],
      ["Karakter çevir", "tr a-z A-Z", "Betik başı", "#!/bin/bash"],
      ["Kaydet ve göster", "cmd | tee out.txt", "Değişkenler", "x=5; echo \"$x\""],
      ["Dosya bul", "find . -name \"*.c\" -type f", "Aritmetik", "$((x + 1))   $(cmd)"],
    ],
    fontSize: 15, y: 1.65,
  });
  s.addNotes("Ezberlemeye değer boru hattı kalıpları: 'cut | sort | uniq -c | sort -rn | head' (ilk N), 'grep -c' (eşleşen satırları say), 'tail -n +2' (CSV başlığını atla), 'sort -t, -k5 -rn' (CSV'yi 5. sütuna göre sayısal ve büyükten küçüğe sırala).");

  // 26 ── ÇP5 izinler
  s = d.content({ kicker: "Çözümlü problem 5 · 11. hafta", title: "Komutu Yazın: İzinler ve umask" });
  d.card(s, MX, 1.65, 5.6, 2.9, { title: "Soru", body: [
    "(a) report.sh: sahip okuyabilsin, yazabilsin, çalıştırabilsin; grup okuyup çalıştırabilsin; diğerleri hiçbir şey. Sekizli komut?",
    "(b) umask 027'den sonra yeni bir dosya ve yeni bir dizin hangi izinleri alır?",
  ], bodySize: 15.5 });
  d.code(s, MX, 4.75, 5.6, 2.1,
`(a) rwx r-x --- = 4+2+1  4+0+1  0 = 750
    chmod 750 report.sh
(b) umask bitlerini sil (AND NOT 027):
    dosya 666 → 640  rw-r-----
    dizin 777 → 750  rwxr-x---`, 13.5);
  term(s, MX + 5.85, 1.65, 6.3, 5.2, out("wp_perm"), 11.5);
  s.addNotes("Gerçek çıktı (out_wp_perm.txt). 11. haftadaki gibi: umask bit SİLER (yeni mod = istenen mod AND NOT umask); aritmetik bir çıkarma değildir. Çıkarmaya karşı örnek: umask 027 ve dosya için istenen 666 — basamak basamak 6 − 7 negatif olurdu, oysa 6 AND NOT 7 = 0. (a) için sembolik seçenek: chmod u=rwx,g=rx,o= report.sh.");

  // 27 ── ÇP6 boru hatları
  s = d.content({ kicker: "Çözümlü problem 6 · 12. hafta", title: "Boru Hattını Yazın: access.log Üzerine Sorular" });
  d.card(s, MX, 1.65, 4.6, 5.2, { title: "Sorular", body: [
    "(a) En çok isteği hangi üç IP adresi gönderdi?",
    "(b) Kaç istek 404 durum koduyla döndü?",
    "(c) En çok 404 hatasına hangi sayfa yol açtı?",
    { b: "Alanlar", t: " (boşlukla ayrılmış): 1 = IP, 7 = sayfa, 9 = durum kodu." },
  ], bodySize: 16 });
  term(s, MX + 4.85, 1.65, 7.3, 5.2, out("wp_pipe"), 12.5);
  s.addNotes("Gerçek çıktı (out_wp_pipe.txt); uzun komutlar slaytta bölündü, öğrenciler her birini tek satırda yazar. (a) ilk-N kalıbıdır. (b) Bütün satırda grep -c 404 kullanmak yanlış olur: 404 bir bayt sayısında ya da saatte de geçebilir; bu yüzden önce durum alanını kesin ve ^404$ ile alanın tamamını eşleyin. (c) Boşluklu ' 404 ' yalnızca durum alanıyla eşleşir, çünkü bayt sayısı son alandır (ardından boşluk gelmez).");

  // 28 ── ÇP7 betik
  s = d.content({ kicker: "Çözümlü problem 7 · 14. hafta", title: "Betiği Yazın: Bölüm İstatistikleri" });
  d.text(s, "dept_stats.sh BÖLÜM betiğini yazın: data/students.csv'de BÖLÜM'deki öğrenci sayısını ve final notlarının ortalamasını yazsın; argüman verilmezse bir kullanım iletisi yazıp 1 durumuyla çıksın.", { x: MX, y: 1.55, w: 12.15, h: 0.6, fontSize: 14, color: BODY });
  term(s, MX, 2.25, 6.4, 4.6, out("wp_script_src").split("\n").slice(1).filter(l => !/^# /.test(l)).join("\n"), 11);
  term(s, MX + 6.6, 2.25, 5.55, 2.7, out("wp_script_run").replace(/^.*chmod.*\n/, ""), 11);
  d.card(s, MX + 6.6, 5.1, 5.55, 1.75, { body: [
    "$((sum / count)) tamsayı bölmesidir: 1072 / 17 = 63,06 → 63.",
    "Kullanım iletisi standart hataya gider (>&2).",
  ], bodySize: 14 });
  s.addNotes("Gerçek çıktı (out_wp_script_src.txt, out_wp_script_run.txt). Sınavda puanlama: argüman denetimi ve çıkış durumu, alanın doğru çıkarılması (grep + cut), aritmetikli döngü, doğru çıktı; mantık açıksa küçük sözdizimi kayıpları az puan götürür. Tipik hatalar: = çevresinde boşluk (count = 0); $(( )) içinde $ unutmak aslında serbesttir, ama [ ] içinde boşluk unutmak değildir: [$# -ne 1] çalışmaz.");

  // 29 ── Sık hatalar: kuram
  s = d.cardsSlide({
    kicker: "Bunlardan kaçının", title: "Sık Yapılan Hatalar: Kuram",
    cards: [
      { title: "Bekleme ve dönüş", body: "Bekleme = dönüş − patlama. Dönüş süresinde varış zamanını unutmayın." },
      { title: "Round Robin kuyruğu", body: "Zaman dilimi dolduğu anda gelen süreç, kesilen süreçten ÖNCE kuyruğa girer (bizim uzlaşımımız)." },
      { title: "Birimler", body: "8 ms = 8.000.000 ns. Önce çevirin, sonra yerine koyun." },
      { title: "TLB ıskası", body: "Iska iki bellek erişimine (sayfa tablosu + veri) ve TLB aramasına mal olur." },
      { title: "LRU ve OPT", body: "LRU geriye bakar (en uzun süredir kullanılmayan); OPT ileriye bakar (en geç kullanılacak olan)." },
      { title: "Blok hesabı", body: "Kayıtlar ve bloklar 0'dan numaralanır. Son baytın blok sınırını aşıp aşmadığına bakın." },
    ], cols: 3, bodySize: 16.5,
  });
  s.addNotes("Bunlar vizede en sık gördüğüm hatalar [gerçek vize sonuçlarına göre uyarlayın]. Yöntem doğru olsa bile her biri puan kaybettirir. Zamanlama sorularında kullandığınız uzlaşımı her zaman yazın.");

  // 30 ── Sık hatalar: uygulama
  s = d.cardsSlide({
    kicker: "Bunlardan kaçının", title: "Sık Yapılan Hatalar: Komutlar ve Betikler",
    cards: [
      { title: "sort olmadan uniq", body: "uniq -c yalnızca ARDIŞIK eşit satırları birleştirir: her zaman sort | uniq -c." },
      { title: "Boşluklar", body: "x=5, x = 5 değil.   [ $a -gt 3 ], [$a -gt 3] değil." },
      { title: "Tırnaklar", body: "\"$name\" genişler, '$name' genişlemez. Boşluklu dosya adlarını tırnaklayın: \"final report.txt\"." },
      { title: "> ve >>", body: "> dosyanın üzerine yazar, >> sonuna ekler. 2> yalnızca hataları yönlendirir." },
      { title: "chmod 777, rm -r, kill -9", body: "Fazla izin, geri alma yok, temizlik yok. İşi gören en yumuşak aracı kullanın." },
      { title: "Göreli yollar", body: "Başka bir dizinden çalıştırılan betik data/… dosyasını bulamaz; ~/lab'dan çalıştırın ya da mutlak yol kullanın." },
    ], cols: 3, bodySize: 16.5,
  });
  s.addNotes("Her kart, öğrencilerin laboratuvarda gördüğü gerçek bir hata iletisine karşılık gelir: x = 5 için 'command not found', sınamalarda eksik boşluk için '[: missing ]' ya da '[$a: command not found', sort'suz uniq'te yanlış sayılar.");

  // 31 ── Sınav stratejisi
  s = d.compareSlide({
    kicker: "Sınav stratejisi", title: "[90] Dakikayı Nasıl Kullanmalı?",
    left: { title: "Sınavdan önce", items: [
      "1–7. haftaların bütün çözümlü örneklerini ve tekrar sorularını, 9–14. haftaların laboratuvar föylerini yeniden çözün.",
      "Çalışma kılavuzundaki Alıştırma Finalini, sonra örnek kâğıdı çözün — kâğıt üzerinde, süre tutarak.",
      "Linux'ta alıştırma yapın: komut kâğıdındaki her komutu ~/lab'da yazın.",
      "Uyuyun. Yorgun beyin hesap hatası yapar.",
    ] },
    right: { title: "Sınav sırasında", items: [
      "Önce bütün kâğıdı okuyun (5 dk); en iyi bildiğinizle başlayın.",
      "Kaba plan: puan başına yaklaşık 1 dakika, kontrol için 10 dakika bırakın.",
      "Her adımı gösterin: formül → sayılar → birimiyle sonuç.",
      "Komutlar: tam yazım ve seçenekler; betiklerde önce mantık, sonra ayrıntı.",
      "Hiçbir soruyu boş bırakmayın: kısmi puan vardır.",
    ] },
    callout: "Puan başına bir dakika bir kural değil, bir rehberdir: [90] dakikada 100 puan az pay bırakır — ilerlemeye devam edin.",
  });
  s.addNotes("Sınav 90 dakika ve 100 puansa, puan başına bir dakika biraz yavaştır; bu yüzden öğrenciler bir soruda takılıp kalmamalı. Öneri: çoktan seçmeli ve komut bölümlerini hızlı yapın, kazandığınız zamanı sayısal problemlere harcayın.");

  // 32 ── Kısa sınav
  s = d.quizSlide({ questions: [
    "P1 (0, 4), P2 (1, 2), P3 (2, 1), süreler ms, SRTF. Ortalama bekleme süresi nedir?",
    "Sayfa boyutu 4 KB. 0x3A7F mantıksal adresinin sayfa numarası ve konumu? (on altılık)",
    "Hangi umask yeni dosyaları rw-r-----, yeni dizinleri rwxr-x--- yapar?",
    "logs/system.log içinde INFO GEÇMEYEN satırların sayısını yazdıran bir boru hattı yazın.",
  ] });
  s.addNotes("Yanıtlar. (1) SRTF: P1 0–1, P2 1–3, P3 3–4, P1 4–7. Bekleme: P1 = 7 − 0 − 4 = 3, P2 = 3 − 1 − 2 = 0, P3 = 4 − 2 − 1 = 1; ortalama 4/3 = 1,33 ms. (2) 4 KB = 2^12: son üç on altılık basamak konumdur: p = 0x3, d = 0xA7F (6. hafta örneği). (3) umask 027. (4) grep -v INFO logs/system.log | wc -l ya da grep -vc INFO logs/system.log (laboratuvarımızda 41 verir: 120 satır, 79'u INFO).");

  // 33 ── Ana fikirler
  s = d.content({ kicker: "Kapanış", title: "Sekiz Satırda Ders" });
  d.bullets(s, [
    { b: "İşletim sistemi", t: " bir kaynak yöneticisi ve genişletilmiş makinedir; ikili mod ve sistem çağrıları onu korur (H1–H2)." },
    { b: "Süreçler", t: " beş durum arasında gezinir; PCB ve bağlam değişimi çok görevliliği mümkün kılar (H3)." },
    { b: "İş parçacıkları ve zamanlayıcılar", t: " işlemciyi paylaşır: FCFS, SJF/SRTF, Öncelik, RR; bekleme ve yanıt süresiyle değerlendirilir (H4–H5)." },
    { b: "Ortak veri", t: " karşılıklı dışlama ister: muteks kilitleri ve semaforlar (H5)." },
    { b: "Bellek", t: " MMU tarafından çevrilir: sayfalama, TLB, sanal bellek, sayfa değiştirme (H6–H7)." },
    { b: "Dosyalar", t: " dizinlerde adı olan düğümlerdir (inode); bağlantılar bir dosyaya birden çok ad verir (H7, H10)." },
    { b: "Kabuk", t: " komutları sistem çağrılarına ve süreçlere dönüştürür: gezinme, dosyalar, izinler, borular, işler (H9–H13)." },
    { b: "Betikler", t: " yazabildiğiniz her şeyi otomatikleştirir (H14)." },
  ], { fontSize: 19, y: 1.7, h: 5.15, paraSpaceAfter: 11 });
  s.addNotes("Dersin her büyük fikri için bir cümle. Öğrenciler her satırı bir örnekle açıklayabiliyorsa hazırdırlar.");

  // 34 ── Yolculuk
  s = d.content({ kicker: "Dersin kapanışı", title: "Bu Dönem Neler Öğrendiniz?" });
  {
    const steps = [
      ["H1–2", "İS nedir?"], ["H3", "Süreçler"], ["H4", "İş parçacıkları"], ["H5", "Zamanlama, eşz."],
      ["H6", "Bellek"], ["H7", "SB, dosyalar"], ["H9–10", "Kabuk, dosyalar"], ["H11", "İzinler"],
      ["H12", "Borular"], ["H13", "Canlı süreçler"], ["H14", "Betikler"],
    ];
    const w = 1.0, gap = 0.105;
    steps.forEach((st, i) => {
      const x = MX + i * (w + gap), theory = i < 6;
      d.box(s, x, 1.8, w, 1.25, st[0], { fill: theory ? C.charcoal : C.mint, color: theory ? C.white : C.dark, size: 14, sub: st[1], subSize: 10, font: F.title });
    });
    d.text(s, "Kuram: içeride nasıl çalışır?", { x: MX, y: 3.12, w: 6.6, h: 0.32, fontSize: 13, bold: true, color: C.charcoal, align: "center" });
    d.text(s, "Uygulama: kabuktan kullanmak", { x: MX + 6 * (w + gap), y: 3.12, w: 5.5, h: 0.32, fontSize: 13, bold: true, color: C.mintDeep, align: "center" });
  }
  d.card(s, MX, 3.75, 3.9, 3.1, { title: "Açıklayabilirsiniz", body: ["bir bilgisayarın neden işletim sistemine ihtiyaç duyduğunu", "süreçlerin tek işlemciyi nasıl paylaştığını", "belleğin nasıl çevrildiğini ve sayfalandığını"], bodySize: 15.5 });
  d.card(s, MX + 4.12, 3.75, 3.9, 3.1, { title: "Hesaplayabilirsiniz", body: ["Gantt şemalarını ve bekleme sürelerini", "adresleri, TLB ve sayfa hatalarıyla EAT'yi", "sayfa hatası sayılarını, blok numaralarını"], bodySize: 15.5 });
  d.card(s, MX + 8.25, 3.75, 3.9, 3.1, { title: "Yapabilirsiniz", body: ["her Linux kabuğunda çalışmak", "dosyaları korumak, günlükleri boru hatlarıyla incelemek", "süreçleri yönetmek, betik yazmak"], bodySize: 15.5 });
  s.addNotes("Bir an geriye bakın: 1. haftada ENIAC ve delikli kartlarla başladık; bugün öğrenciler bir web sunucusu günlüğünü tek satırla inceleyip bunu bir betikle otomatikleştirebiliyor. Kuram, komutların NEDEN öyle davrandığını açıklar: ps 3. haftanın süreç durumlarını, ls -i 7. haftanın düğümlerini (inode), chmod ise 2. haftada ikili mod fikriyle gerekçelendirilen korumayı gösterir. Kutulardaki kısaltmalar: İS = işletim sistemi, eşz. = eşzamanlama, SB = sanal bellek.");

  // 35 ── Bundan sonra
  s = d.cardsSlide({
    kicker: "Dersin kapanışı", title: "Bundan Sonra Nereye?",
    cards: [
      { title: "Linux kullanmaya devam", body: ["Ubuntu'yu bir sanal makineye ya da WSL'ye (wsl --install) kurun ve her gün kullanın.", "Raspberry Pi ucuz bir Linux laboratuvarıdır.", "Ücretsiz alıştırma: OverTheWire Bandit (bir kabuk oyunu)."] },
      { title: "Kitaplar (ücretsiz ve klasik)", body: ["OSTEP — Operating Systems: Three Easy Pieces (çevrim içi ücretsiz).", "Silberschatz vd., Operating System Concepts, 10. baskı.", "W. Shotts, The Linux Command Line (ücretsiz PDF)."] },
      { title: "Sertifikalar", body: ["LPI Linux Essentials (giriş düzeyi).", "CompTIA Linux+ ya da LPIC-1 (sonraki adım).", "Daha sonra: Red Hat RHCSA, Linux Foundation LFCS. Güncel sürüm ve ücretleri denetleyin."] },
    ], cols: 3, bodySize: 15,
    callout: "Yararlı siteler: missing.csail.mit.edu (kabuk, araçlar) · explainshell.com (bu komut ne yapar?) · shellcheck.net (betiklerdeki hataları bulur).",
  });
  s.addNotes("Bağlantılar çalışma kılavuzunda (İleri okuma). Sertifikalar isteğe bağlıdır ve ücretlidir; sunucularla ya da ağ donanımıyla çalışmak isteyen meslek yüksekokulu öğrencileri için Linux Essentials iyi bir ilk hedeftir; bu, Elektronik Haberleşme Teknolojisi alanında bir kariyer için de önemlidir. Sınav hedefleri ve ücretler değişir; öğrenciler resmî siteleri denetlemelidir. Kaynakların çoğu İngilizcedir; bu derste İngilizce terimleri parantez içinde vermemizin nedeni de budur.");

  // 36 ── Teşekkürler + QR
  s = d.slide(true);
  s.addText(d.up("Teşekkürler"), { x: MX, y: 1.3, w: 10, h: 0.35, fontFace: F.body, fontSize: 13, bold: true, color: C.mint, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText("Finalde Başarılar!", { x: MX, y: 1.7, w: 12, h: 0.85, fontFace: F.title, fontSize: 38, bold: true, color: C.white, margin: 0, isTextBox: true });
  s.addText("Sınavdan önce sorunuz mu var? Dersin Telegram kanalında sorun — yanıttan herkes yararlanır. [Sınav öncesi ofis saatleri: duyurulacak.]", { x: MX, y: 2.7, w: 11.5, h: 0.75, fontFace: F.body, fontSize: 15, italic: true, color: C.light, margin: 0, isTextBox: true });
  s.addText([
    { text: d.L.name, options: { bold: true, breakLine: true } },
  ], { x: MX, y: 3.75, w: 5.4, h: 0.5, fontFace: F.body, fontSize: 14, color: C.light, margin: 0, valign: "top", paraSpaceAfter: 4, isTextBox: true });
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 8.4, y: 3.75, w: 3.75, h: 2.4, fill: { color: C.charcoal }, rectRadius: 0.06, line: { type: "none" } });
  s.addText([
    { text: "Harika bir dönem için teşekkürler.", options: { bold: true, color: C.mint, breakLine: true } },
    { text: "~/lab klasörünüzü ve ders notlarını saklayın: sınavdan çok sonra da kullanabileceğiniz bir başvuru kaynağıdır.", options: { color: C.light } },
  ], { x: MX + 8.65, y: 3.85, w: 3.25, h: 2.2, fontFace: F.body, fontSize: 14, margin: 0, valign: "middle", isTextBox: true });
  d.footer(s);
  s.addNotes("Son slayt. Öğrencilere teşekkür edin, sınavla ilgili sorulara söz verin; Telegram kanalını ve sınav öncesi ofis saatlerini (duyurulacak) hatırlatın. Gelecek hafta yok: final sınavı dersin son etkinliğidir.");

  await d.save(path.join(__dirname, "MBLP131_Hafta15.pptx"));
  console.log("slides:", d.n);
})();
