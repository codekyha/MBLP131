// Hafta 10 sunumu (MBLP131, Türkçe): Dosya ve Dizin İşlemleri (ikinci uygulamalı Linux haftası)
// İngilizce referans: ../week10/build_deck.js (aynı slayt sırası, aynı diyagramlar, aynı gerçek çıktılar)
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("../lib/deck");
const d = new Deck({ week: 10, lang: "tr", assets: path.join(__dirname, "../lib") });
const code = f => fs.readFileSync(path.join(__dirname, "code", f), "utf8");
const P = d.pres;
const PALE = "D7E9E6";
const AMBERPALE = "F6E7CC";

// ---------- gerçek terminal çıktısı (code/out_*.txt, demo_*.sh betikleriyle yakalandı; İngilizce haftayla aynı) ----------
// Bir çıktıyı bloklara ayır: { prompt, cmd, out: [satırlar] }
function blocks(f) {
  const B = [];
  for (const l of code(f).replace(/\n$/, "").split("\n")) {
    const m = l.match(/^(student@okan-lab:[^$]*\$ )(.*)$/);
    if (m) B.push({ prompt: m[1], cmd: m[2], out: [] });
    else if (B.length) B[B.length - 1].out.push(l);
  }
  return B;
}
// Komutu cmds'den birine eşit olan blokların metni (bu sırayla). {cmd, max} çıktıyı kısaltır.
function sel(f, ...cmds) {
  const B = blocks(f);
  return cmds.map(c => {
    const want = typeof c === "string" ? { cmd: c } : c;
    const b = B.find(x => x.cmd === want.cmd);
    if (!b) throw new Error(`${f}: komut bulunamadı: ${want.cmd}`);
    let o = b.out.slice();
    if (want.max !== undefined && o.length > want.max) o = o.slice(0, want.max).concat(["..."]);
    if (want.skip) o = o.filter(l => !want.skip.test(l));
    return [b.prompt + b.cmd, ...o].join("\n");
  }).join("\n");
}
// Terminal kutusu: istem nane, yazılan komut kalın beyaz, çıktı açık gri.
function term(s, x, y, w, h, text, size = 11) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.dark }, rectRadius: 0.05, line: { type: "none" } });
  const maxCh = Math.floor((w - 0.4) * 72 / (size * 0.61));
  const lines = text.replace(/\n$/, "").split("\n");
  const runs = [];
  lines.forEach((ln, i) => {
    const br = i < lines.length - 1;
    if (ln.length > maxCh) ln = ln.slice(0, maxCh - 1) + "…";
    const m = ln.match(/^(student@okan-lab:[^$]*\$ )(.*)$/);
    if (m) {
      runs.push({ text: m[1], options: { color: C.mint } });
      runs.push({ text: m[2] || " ", options: { color: C.white, bold: true, breakLine: br } });
    } else {
      const muted = ln === "..." || ln.startsWith("# ") || ln === "^C";
      runs.push({ text: ln.length ? ln : " ", options: { color: muted ? C.mutedOnDark : C.light, breakLine: br } });
    }
  });
  s.addText(runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: h - 0.24, fontFace: F.code, fontSize: size, valign: "top", margin: 0, lineSpacingMultiple: 1.0, isTextBox: true });
}
// Canlı gösterim slaytı: solda terminal, sağda "neye bakmalı" kartı.
function demoSlide({ kicker = "Canlı gösterim", title, lead, text, size = 11.5, termW = 7.6, sideTitle = "Neye dikkat edin", side, sideSize = 13.5, notes }) {
  const s = d.content({ kicker, title, lead });
  const y0 = lead ? 2.25 : 1.65, h = 6.85 - y0;
  term(s, MX, y0, termW, h, text, size);
  d.card(s, MX + termW + 0.3, y0, 12.15 - termW - 0.3, h, { title: sideTitle, body: side, bodySize: sideSize });
  s.addNotes(notes);
  return s;
}
function table(s, header, rows, { x = MX, y, w = 12.15, colW, fontSize = 13, hdrSize } = {}) {
  const hdr = header.map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: hdrSize || fontSize + 1 } }));
  const body = rows.map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: j === 0 ? F.code : F.body, fontSize } })));
  s.addTable([hdr, ...body], { x, y, w, colW, border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [4, 7, 4, 7], valign: "middle" });
}

// bağlantı gösteriminden düğüm numaraları (diyagram gerçek ls -li çıktısıyla örtüşsün)
const L = {};
for (const l of code("out_links.txt").split("\n")) {
  const t = l.trim().split(/\s+/);
  if (/^\d+$/.test(t[0]) && t[3] === "student" && t.length >= 10 && !(t[9] in L)) L[t[9]] = { ino: t[0], links: t[2], size: t[5] };
}

(async () => {
  // 1 ── Başlık
  let s = d.titleSlide({
    kicker: "MBLP131  ·  HAFTA 10",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 10  ·  Dosya ve Dizin İşlemleri",
    tagline: "Dosya oluşturun, kopyalayın, taşıyın, silin, görüntüleyin, bağlayın — ve her seferinde çekirdeğin ne yaptığını bilin.",
  });
  s.addNotes("10. haftaya hoş geldiniz; bu, ikinci uygulamalı Linux haftamız. Geçen hafta dosya sisteminde dolaşmayı öğrendik; bugün onu değiştiriyoruz: dosya oluşturacak, kopyalayacak, taşıyacak, yeniden adlandıracak, silecek, görüntüleyecek ve bağlayacağız. Her öğrencinin önünde açık bir terminal olmalı (laboratuvar bilgisayarı, WSL ya da sanal makine); kurulum betiğini şimdi çalıştırsınlar: bash ~/mcmp117_lab_setup.sh, ardından cd ~/lab. Slaytlardaki her çıktı, tam olarak bu klasörde student kullanıcısıyla yakalanmış gerçek çıktıdır.");

  // 2 ── Geçen hafta
  s = d.cardsSlide({
    kicker: "Geçen hafta", title: "Dört Fikirde 9. Hafta",
    cards: [
      { title: "Terminal, kabuk, çekirdek", body: "Kabuk (bash) komutunuzu okuyan ve başka programları başlatan bir programdır; onlar da çekirdekten sistem çağrılarıyla iş ister (2. hafta)." },
      { title: "Komutun yapısı", body: "komut  -seçenekler  argümanlar\nls  -l  /etc\nSeçenek nasıl, argüman neyi söyler." },
      { title: "Yollar", body: "Mutlak: /home/student/lab\nGöreli: docs, ../data\nKısayollar: ~  .  ..  -  (cd - geri döner)" },
      { title: "Ağaç ve yardım", body: "/home /etc /usr /var /tmp /dev /proc (FHS). Yardım: --help, man, Tab tamamlama, history ve !!." },
    ], cols: 4, bodySize: 15.5,
    callout: "Geçen hafta pwd, ls ve cd ile ağaçta dolaştık. Bugün onu değiştiriyoruz: bugünkü her komut bir ad, bir düğüm ya da veri oluşturur, taşır veya siler.",
  });
  s.addNotes("Sorularla iki dakikalık tekrar. Sorun: /home/student/lab/docs ile docs arasındaki fark nedir? (mutlak ve göreli yol.) .. ne demektir? Yapılandırma dosyaları nerede durur? (/etc.) Tab ne yapar? Hatırlatın: bugün Tab tamamlama, özellikle adında boşluk bulunan dosyalarda, yazım hatalarının çoğundan sizi kurtaracak.");

  // 3 ── Gündem
  s = d.content({ kicker: "Hafta 10", title: "Bugünün Gündemi" });
  [
    ["1", "Adlar, düğümler, sistem çağrıları", "Dosyalarla çalışırken diskte gerçekte ne değişir (7. hafta tekrarı)."],
    ["2", "Oluştur, kopyala, taşı, sil", "mkdir, touch, cp, mv, rm, rmdir — ve rm neden geri alınamaz."],
    ["3", "Joker karakterler ve süslü parantez", "*  ?  [ ]  { } — ve onları kim genişletir: komut değil, kabuk."],
    ["4", "Boşluklu adlar", "\" \", ' ' ve \\ ile tırnaklama."],
    ["5", "Dosyaların içine bakmak", "cat, less, head, tail -f, wc, file, stat, du, df."],
    ["6", "Bağlantılar ve laboratuvar", "Yeniden ln ve ln -s; ardından 35 dakikalık notlu uygulama."],
  ].forEach((a, i) => {
    const y = 1.65 + i * 0.86;
    d.box(s, MX, y, 0.72, 0.72, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 0.9, y, w: 11.25, h: 0.72, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "   ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.2, y, w: 10.8, h: 0.72, valign: "middle" });
  });
  s.addNotes("1. ve 2. bölümler moladan önce; joker karakterler, tırnaklama, görüntüleme ve bağlantılar moladan sonra; ardından yaklaşık 35 dakika boyunca laboratuvar föyü (ders notlarında). Öğrenciler her gösterimde komutları birlikte yazar.");

  // ───────────────────────── BÖLÜM 1
  s = d.sectionSlide({ kicker: "Bölüm 1", title: "Adlar, Düğümler ve Sistem Çağrıları", subtitle: "7. haftanın kuramı, komut satırından bakınca." });
  s.addNotes("Komut yazmaya başlamadan önce beş dakikalık kuram; böylece bugünkü her komut anlam kazanır.");

  // 5 ── Gerçekte ne değişir
  s = d.content({ kicker: "Tekrar · 7. hafta", title: "Gerçekte Ne Değişir: Adlar, Düğümler, Veri" });
  {
    const y0 = 2.15, rh = 0.55;
    d.text(s, "docs/ dizini  (ad → düğüm)", { x: MX, y: 1.65, w: 3.2, h: 0.4, fontSize: 12.5, bold: true, color: C.charcoal, valign: "bottom" });
    const rows = [["syllabus.txt", L["syllabus.txt"].ino], ["plan.txt", L["plan.txt"].ino], ["copy.txt", L["copy.txt"].ino], ["shortcut.txt", L["shortcut.txt"].ino]];
    rows.forEach((r, i) => {
      d.box(s, MX, y0 + i * rh, 1.75, rh - 0.08, r[0], { fill: C.light, size: 12, bold: false, font: F.code });
      d.box(s, MX + 1.8, y0 + i * rh, 1.0, rh - 0.08, r[1], { fill: PALE, size: 12, bold: false, font: F.code, color: C.dark });
    });
    const ix = MX + 3.35, iw = 2.05;
    const ino = [
      [2.05, `düğüm ${L["plan.txt"].ino}`, `normal · ${L["syllabus.txt"].links} bağlantı · ${L["syllabus.txt"].size} B`],
      [3.25, `düğüm ${L["copy.txt"].ino}`, `normal · 1 bağlantı · ${L["copy.txt"].size} B`],
      [4.45, `düğüm ${L["shortcut.txt"].ino}`, `sembolik · ${L["shortcut.txt"].size} B`],
    ];
    ino.forEach(([y, t, sub]) => d.box(s, ix, y, iw, 0.95, t, { sub, fill: C.charcoal, size: 13, subSize: 11 }));
    const dx = ix + iw + 0.4;
    d.box(s, dx, 2.27, 1.3, 0.5, "Week 1 …", { fill: C.mint, size: 11.5, color: C.dark, font: F.code, bold: false });
    d.box(s, dx, 3.47, 1.3, 0.5, "Week 1 …", { fill: PALE, size: 11.5, color: C.dark, font: F.code, bold: false });
    d.box(s, dx, 4.67, 1.3, 0.5, "\"syllabus.txt\"", { fill: AMBERPALE, size: 10, color: C.dark, font: F.code, bold: false });
    const ex = MX + 2.82;
    d.arrow(s, ex, y0 + 0 * rh + 0.23, ix - 0.02, 2.4, { color: C.mintDeep, w: 1.75 });
    d.arrow(s, ex, y0 + 1 * rh + 0.23, ix - 0.02, 2.65, { color: C.mintDeep, w: 1.75 });
    d.arrow(s, ex, y0 + 2 * rh + 0.23, ix - 0.02, 3.65, { color: C.mintDeep, w: 1.75 });
    d.arrow(s, ex, y0 + 3 * rh + 0.23, ix - 0.02, 4.85, { color: C.amber, w: 1.75 });
    [2.52, 3.72, 4.92].forEach(y => d.arrow(s, ix + iw + 0.02, y, dx - 0.02, y, { color: C.slate, w: 1.5 }));
    d.text(s, "veri blokları", { x: dx - 0.1, y: 5.22, w: 1.35, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "center" });
    d.callout(s, MX, 5.7, 6.95, 1.15, "ls -li'den gerçek düğüm numaraları (demo_links.sh): plan.txt bir sabit bağlantı, copy.txt bir kopya, shortcut.txt ise bir yol saklayan sembolik bağlantı.", 13);
  }
  table(s, ["Komut", "Ne değişir"], [
    ["touch new", "yeni ad + yeni (boş) düğüm"],
    ["cp a b", "yeni ad + yeni düğüm + verinin kopyası"],
    ["mv a b", "yalnızca ad; düğüm aynı, veriye dokunulmaz"],
    ["ln a b", "yeni ad → aynı düğüm; bağlantı sayısı + 1"],
    ["ln -s a b", "yeni ad + a yolunu saklayan küçük düğüm"],
    ["rm a", "ad silinir; bağlantı sayısı − 1; 0'da veri serbest"],
  ], { x: MX + 7.35, y: 1.7, w: 4.8, colW: [1.25, 3.55], fontSize: 12.5 });
  s.addNotes("Bu tek slayt bütün haftayı açıklıyor. 7. haftadan hatırlayın: dizin, (ad, düğüm numarası) çiftlerinden oluşan bir tablodur; düğüm (inode) adı dışındaki her şeyi tutar (tür, boyut, sahip, izinler, zamanlar, bağlantı sayısı, blok işaretçileri). Tabloyu adım adım anlatın: cp ikinci, bağımsız bir dosya oluşturur; mv yalnızca dizin girdilerini düzenler, bu yüzden 4 GB'lık bir filmi aynı disk içinde taşımak anında biter; ln aynı düğüme ikinci bir ad ekler; rm bir adı siler ve bloklar ancak bağlantı sayısı 0'a indiğinde (ve dosyayı açık tutan bir program yoksa) serbest bırakılır. Düğüm numaraları gerçektir: moladan sonraki bağlantı gösteriminde tam olarak bu durumu oluşturacağız. Veri kutularındaki 'Week 1 …' dosyanın gerçek içeriğidir (lab dosyaları İngilizcedir).");

  // 6 ── strace
  s = d.content({ kicker: "Tekrar · 2. ve 3. hafta", title: "Her Komut, Sistem Çağrısı Yapan Bir Programdır" });
  term(s, MX, 1.65, 8.0, 5.2, code("out_strace.txt"), 10.5);
  d.card(s, MX + 8.3, 1.65, 3.85, 5.2, { title: "Bir komut, bir çağrı", body: [
    { b: "mkdir", t: " → mkdir()" },
    { b: "mv", t: " → renameat2()" },
    { b: "ln", t: " → linkat()" },
    { b: "ln -s", t: " → symlinkat()" },
    { b: "rm", t: " → unlinkat()" },
    { b: "rmdir", t: " → rmdir()" },
    "Çekirdek silmeye \"unlink\" der: bir düğümün tek bir adını (bağlantısını) kaldırır.",
  ], bodySize: 14 });
  s.addNotes("strace (2. hafta) bir programın yaptığı sistem çağrılarını gösterir; -e trace=... listeyi ilginç olanlarla sınırlar. Çıktı student kullanıcısıyla alınmış gerçek çıktıdır. Gösterin: mv hiçbir şey kopyalamadı, tek bir renameat2() çağrısı yaptı (RENAME_NOREPLACE: coreutils önce sessizce üzerine yazmamayı dener). Üç adlı rm, üç unlinkat() çağrısıdır. 'at' sürümleri bir dizin dosya tanımlayıcısı alır; AT_FDCWD 'geçerli dizine göre' demektir (9. hafta). Her komut, kabuğun fork() ve exec() ile başlattığı (3. hafta) /usr/bin içindeki küçük bir programdır.");

  // ───────────────────────── BÖLÜM 2
  s = d.sectionSlide({ kicker: "Bölüm 2", title: "Oluştur, Kopyala, Taşı, Sil", subtitle: "mkdir · touch · cp · mv · rm · rmdir" });
  s.addNotes("Herkes: bash ~/mcmp117_lab_setup.sh ve cd ~/lab. Her gösterimi birlikte yazın.");

  // 8 ── mkdir
  demoSlide({
    title: "mkdir: Dizin Oluştur (-p ile Bütün Yol)",
    text: sel("out_mkdir_touch.txt", "mkdir test", "ls -ld test", "mkdir test", "mkdir trip/day1", "mkdir -p trip/day1", "mkdir -p work/2026/october", "tree work trip"),
    side: [
      "mkdir ad, boş bir dizin oluşturur.",
      { b: "File exists:", t: " ad zaten kullanılıyor." },
      { b: "No such file or directory:", t: " bir üst dizin (trip) yok." },
      { b: "-p:", t: " eksik bütün üst dizinleri oluşturur; dizin zaten varsa hata vermez." },
      "ls -ld içeriği değil, dizinin kendisini gösterir.",
    ],
    notes: "Yazın: mkdir test, ardından ls -ld test (-d olmadan ls boş içeriği listeler ve hiçbir şey yazmaz). Hatayı görmek için mkdir test komutunu yeniden çalıştırın. mkdir trip/day1 başarısız olur, çünkü trip yoktur; mkdir -p bütün yolu oluşturur. mkdir iletilerindeki ‘ ’ tırnakları cp ve rm'dekilerden farklı bir tırnak biçimidir, o kadar. tree yapıyı yazdırır; başlangıç dizinlerini de sayar (work, 2026, october, trip, day1 = 5). Sık hata: öğrenciler mkdir -p ile yolun içine boşluk koyar ve iki ayrı dizin elde eder. Türkçe yerel ayarlı (tr_TR.UTF-8) bir sistemde hata iletileri Türkçe çıkabilir; ders çıktıları LC_ALL=C.UTF-8 ile alınmıştır.",
  });

  // 9 ── touch
  demoSlide({
    title: "touch: Boş Dosya Oluştur, Zaman Damgasını Değiştir", size: 11, termW: 8.2,
    text: blocks("out_mkdir_touch.txt").slice(7, 12).map(b => [b.prompt + b.cmd, ...b.out].join("\n")).join("\n"),
    side: [
      { b: "Dosya yoksa:", t: " touch onu 0 baytlık olarak oluşturur." },
      { b: "Dosya varsa:", t: " touch yalnızca zamanlarını şimdiye ayarlar; içerik değişmez." },
      { b: "-d \"tarih\":", t: " seçilen bir zamanı ayarlar." },
      "ls -l, 6 aydan uzak tarihlerde saat yerine yılı gösterir.",
      "stat, düğümde tutulan bütün zamanları gösterir.",
    ],
    sideSize: 13,
    notes: "touch aslında bir dosyanın değişiklik zamanını güncellemek için icat edildi (örneğin 'make' bir şeyi yeniden derlesin diye), ama çoğunlukla boş dosya oluşturmak için kullanılır. touch -d'den sonra Access ve Modify 15 Ocak olur, Change (ctime) ise şimdidir: zamanları değiştirmek de düğümde bir değişikliktir. Birth oluşturulma zamanıdır; her dosya sistemi bunu kaydetmez. Test makinemizde zamanlar UTC (+0000) olarak görünür; Türkiye'deki bir bilgisayarda +0300 göreceksiniz. touch todo.txt komutunu bir kez daha çalıştırmak zamanları yeniden şimdiye ayarlar (betikteki son komut).",
  });

  // 10 ── zaman damgaları tablosu
  s = d.tableSlide({
    kicker: "Düğüm üst verisi", title: "Üç Zaman Damgası: Hangi İşlem Hangisini Değiştirir?",
    header: ["İşlem (örnek)", "atime (Access)", "mtime (Modify)", "ctime (Change)"],
    colW: [3.6, 2.85, 2.85, 2.85],
    rows: [
      ["veriyi oku:  cat f", "evet (gecikmeli)", "—", "—"],
      ["veriyi yaz:  echo x >> f", "—", "evet", "evet"],
      ["touch f", "evet", "evet", "evet"],
      ["yeniden adlandır:  mv f g", "—", "—", "evet"],
      ["ad ekle:  ln f h", "—", "—", "evet"],
      ["izinleri değiştir:  chmod (11. hafta)", "—", "—", "evet"],
    ],
    fontSize: 15, y: 1.7,
    callout: "ctime oluşturulma zamanı DEĞİLDİR: düğümün son değişikliğidir. Oluşturulma \"Birth\"tür. ls -l mtime'ı gösterir; cp -p özgün mtime'ı korur.",
  });
  s.addNotes("Test makinemizde (ext4, relatime ile bağlanmış) her işlemden sonra stat ile doğrulandı. Okuma: güncel Linux 'relatime' kullanır; atime yalnızca mtime'dan eskiyse ya da 24 saatten eskiyse güncellenir, böylece her okuma bir disk yazmasına yol açmaz. Her veri yazması mtime ve ctime'ı değiştirir. Yeniden adlandırma, bağlantı ve chmod yalnızca düğümü değiştirir, dolayısıyla yalnızca ctime değişir. Sınav tipi soru: bir dosyanın içeriğinin en son ne zaman değiştiğini hangi zaman söyler? (mtime.) Yedekleme programları neyi kopyalayacaklarına mtime'a bakarak karar verir.");

  // 11 ── cp
  demoSlide({
    title: "cp: Dosya Kopyala",
    text: sel("out_cp_mv.txt", "cp docs/syllabus.txt backup/", "cp docs/syllabus.txt backup/syllabus_copy.txt", "ls backup", "cp -v docs/notes_01.txt docs/notes_02.txt backup/", "cp -i docs/syllabus.txt backup/", "cp projects/alpha backup/"),
    side: [
      { b: "cp KAYNAK HEDEF:", t: " hedef bir dizinse ad korunur; değilse hedef yeni addır." },
      { b: "Birden çok kaynak:", t: " son argüman bir dizin olmalıdır." },
      { b: "-v:", t: " yapılanı söyler.  -i: üzerine yazmadan önce sorar." },
      { b: "Uyarı:", t: " -i olmadan cp var olan dosyanın üzerine sessizce yazar." },
      "Dizinler için -r gerekir.",
    ],
    sideSize: 13,
    notes: "Canlı: syllabus.txt'yi backup/ içine iki kez kopyalayın (bir kez adını koruyarak, bir kez yeni adla). Sonra iki kaynakla -v. cp -i için n yanıtını verdik; betikte yanıtı echo n yazar, derste n yazıp Enter'a basmanız yeterli. Son hata günün en sık hatasıdır: 'cp: -r not specified; omitting directory' (-r belirtilmedi; dizin atlanıyor). Öğrencilere sorun: ilk komutta backup/ var olmasaydı ne olurdu? (cp, backup adında bir DOSYA oluştururdu.)",
  });

  // 12 ── cp -r
  demoSlide({
    title: "cp -r: Bütün Bir Dizin Ağacını Kopyala",
    text: sel("out_cp_mv.txt", "cp -r projects/alpha backup/", "tree backup", "ls -i docs/syllabus.txt backup/syllabus.txt"),
    side: [
      { b: "-r (özyinelemeli, recursive):", t: " dizin ve altındaki her şey." },
      { b: "Kopya yeni bir dosyadır:", t: " yeni düğüm numarası, kendi veri blokları." },
      "Kopyayı değiştirin: özgün etkilenmez (tersi de geçerli).",
      { b: "cp -p:", t: " zamanları ve izinleri de korur; tam yedek için cp -a." },
    ],
    notes: "tree, kopyalanan alpha projesini backup içinde gösterir. Ardından ls -i: iki farklı düğüm numarası, yani iki bağımsız dosya — bunu daha sonra AYNI düğüm numarasına sahip sabit bağlantıyla karşılaştırın. Özyinelemeli şu demektir: dizini kopyala, sonra aynı işlemi içindeki her girdiye uygula, ve böyle devam et. cp -a (arşiv) = -r artı zamanları, izinleri ve bağlantıları korumak; yedekleme için istediğiniz budur.",
  });

  // 13 ── mv
  demoSlide({
    title: "mv: Yeniden Adlandır ve Taşı (Düğüm Aynı!)",
    text: sel("out_cp_mv.txt", "mv backup/syllabus.txt backup/syllabus_old.txt", "ls -i backup/syllabus_old.txt", "mv -v docs/notes_03.txt backup/", "mv backup/alpha backup/alpha_2026", "ls docs backup"),
    side: [
      { b: "Yeniden adlandırma:", t: " aynı dizinde mv eski yeni." },
      { b: "Taşıma:", t: " mv dosya dizin/ — ad başka bir dizine geçer." },
      { b: "Düğüm aynı", t: ` (${blocks("out_cp_mv.txt").find(b => b.cmd === "ls -i backup/syllabus_old.txt").out[0].split(" ")[0]}), önce ve sonra: yalnızca dizin girdisi değişti.` },
      "Dizinler için -r gerekmez. cp gibi mv de sessizce üzerine yazar: -i kullanın.",
    ],
    notes: "Tek bir dosya için ayrı bir yeniden adlandırma komutu yoktur: mv ikisini de yapar. backup/syllabus.txt'nin düğüm numarası yeniden adlandırmadan önce " + blocks("out_cp_mv.txt").find(b => b.cmd === "ls -i docs/syllabus.txt backup/syllabus.txt").out[0].split(" ")[0] + " idi (önceki slayt) ve sonra da aynıdır. Bu yüzden aynı dosya sistemi içinde mv, dosya boyutu ne olursa olsun anında biter. İki dosya sistemi arasında (örneğin bir USB belleğe) mv önce veriyi kopyalamak, sonra özgün dosyayı silmek zorundadır. Not: ls 'final report.txt' adını tırnak içinde gösterir, çünkü adda boşluk vardır — 3. bölüm.",
  });

  // 14 ── rm / rmdir
  demoSlide({
    title: "rm ve rmdir: Dosya ve Dizin Silmek",
    text: sel("out_rm.txt", "rm junk1.txt", "rm -i junk2.txt", "rm -v junk3.txt", "ls junk*", "rmdir empty_dir", "rmdir projects/beta", "rm projects/beta", "rm -rv beta_copy"),
    side: [
      "rm dosya: soru yok, ileti yok, geri dönüşüm kutusu yok.",
      { b: "-i:", t: " önce sorar.  -v: her silmeyi bildirir." },
      { b: "rmdir:", t: " yalnızca BOŞ dizinler — güvenli bir araç." },
      { b: "rm -r dizin:", t: " dizin ve içindeki her şey, özyinelemeli olarak." },
      { b: "Uyarı:", t: " -f (force, zorla) hiç sormaz ve hataları gizler." },
    ],
    notes: "Önce junk1-3'ü touch ile oluşturduk (betikte). rm junk1.txt: sessiz. rm -i 'remove regular empty file?' diye sorar; y yanıtını veriyoruz. ls junk* başarısız olur, çünkü artık hiçbir şey eşleşmez — kalıp olduğu gibi kalır (3. bölüm). rmdir projects/beta reddeder: dizin boş değil. -r olmadan rm dizinleri reddeder. Bir kopya üzerinde rm -rv sırayı gösterir: rm her dizini silebilmek için önce onu boşaltmak zorundadır, çünkü çekirdeğin rmdir() çağrısı yalnızca boş dizinlerde çalışır. Yalnızca bir kopyayı sildik: rm -r alıştırmasını asla özgün dosyalar üzerinde yapmayın.",
  });

  // 15 ── rm güvenliği
  s = d.cardsSlide({
    kicker: "Güvenlik", title: "rm Kalıcıdır: Güvenle Silin",
    cards: [
      { title: "Geri dönüşüm kutusu yok", titleColor: C.red, body: "rm, unlinkat() çağırır. Bağlantı sayısı 0 olunca bloklar serbest kalır ve kısa sürede yeniden kullanılır. Masaüstündeki Çöp Kutusu çekirdeğin değil, dosya yöneticisinin özelliğidir." },
      { title: "Silmeden önce bakın", body: "Aynı kalıbı önce ls (ya da echo) ile çalıştırın:\nls *.tmp   →   rm *.tmp\nNerede olduğunuzu pwd ile denetleyin." },
      { title: "Emin değilseniz sorsun", body: "rm -i, rm -ri, cp -i, mv -i her silme ya da üzerine yazmadan önce sorar. y ya da n yanıtını verin." },
      { title: "Bir boşluk fazla", titleColor: C.red, body: "rm -r ~/lab /old   (yazım hatası: boşluk)\n~/lab'ı siler VE /old'u dener.\nrm -rf hiç sormaz — sudo ile sistemi yok edebilir." },
    ], cols: 2, bodySize: 14.5,
    callout: "Güvenli alışkanlık: pwd → kalıbı ls ile dene → rm. Gerçek tek \"geri al\" yedektir.",
  });
  s.addNotes("rm -r için gereken somut uyarı. Bir öykü anlatın: bir öğrenci rm -r ~/lab/old yazmak istedi ama rm -r ~/lab /old yazdı. İlk argüman bütün lab klasörüdür. Öğrenciler için: lab klasörünü silerseniz kurulum betiğini yeniden çalıştırmanız yeter — betiğin var olma nedeni budur. Gerçek bir sunucuda böyle bir betik yoktur. -f ayrıca hata iletilerini ve soruları bastırır; -r ve sudo ile birleşince bir Linux sistemindeki en tehlikeli komut olur. sudo'yu 11. haftada göreceğiz.");

  // 16 ── Özet tablo 1
  s = d.tableSlide({
    kicker: "Özet tablo 1", title: "Oluşturma, Kopyalama, Taşıma, Silme",
    header: ["Komut", "Ne yapar", "Yararlı seçenekler"],
    colW: [2.7, 4.75, 4.7],
    rows: [
      ["mkdir dir", "dizin oluşturur", "-p  bütün yol, varsa hata yok"],
      ["touch file", "boş dosya oluşturur / zamanlarını günceller", "-d \"2026-01-15 09:30\"  zaman ayarla"],
      ["cp src dst", "dosya kopyalar (yeni düğüm)", "-r  dizinler   -i  sor   -v  ayrıntılı   -p  zamanları koru"],
      ["mv src dst", "yeniden adlandırır ya da taşır (düğüm aynı)", "-i  üzerine yazmadan sor   -v  ayrıntılı"],
      ["rm file", "adları siler — geri alma yok", "-i  sor   -r  özyinelemeli   -v  ayrıntılı   -f  zorla (!)"],
      ["rmdir dir", "boş bir dizini siler", "-p  boş üst dizinleri de"],
    ],
    fontSize: 15, y: 1.7,
    callout: "Dördünün ortak kalıbı: komut  -seçenekler  kaynaklar…  hedef. Birden çok kaynak varsa hedef var olan bir dizin olmalıdır.",
  });
  s.addNotes("Öğrenciler bu slaytın fotoğrafını çekebilir; aynı tablo ders notlarında da var (Komut başvuru tablosu). Sorun: boş olmayan bir dizini hangi komut silebilir? (rm -r.) Hangisi yalnızca adı değiştirir? (mv.)");

  // 17 ── Mola
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Mola", subtitle: "Sırada: joker karakterler ve süslü parantezler, boşluklu adlar, dosyaların içine bakmak, bağlantılar — ve laboratuvar." });
  s.addNotes("On dakika. Geride kalan öğrenciler: kurulum betiğini yeniden çalıştırıp cp ve mv gösterimlerini yetiştirin.");

  // ───────────────────────── BÖLÜM 3
  s = d.sectionSlide({ kicker: "Bölüm 3", title: "Joker Karakterler, Süslü Parantezler, Tırnaklama", subtitle: "Aynı anda çok sayıda dosyayla — ve zor adlarla — çalışmak." });
  s.addNotes("cd ~/lab/photos. photos klasöründe bu alıştırma için hazırlanmış 15 boş dosya var.");

  // 19 ── Kim genişletir?
  s = d.content({ kicker: "Glob genişletme", title: "* Karakterini Kim Genişletir? Komut Değil, Kabuk" });
  {
    const y = 1.75, w = 2.75, h = 1.35, gap = 0.38;
    const st = [
      ["Siz yazarsınız", "ls *.jpg", C.light],
      ["bash genişletir", "dizini okur, *.jpg yerine eşleşen adları koyar", PALE],
      ["ls şunu alır", "12 argüman:\nimg001.jpg … img012.jpg", C.light],
      ["çekirdek", "execve(\"/usr/bin/ls\", …) ls'yi bu argümanlarla başlatır", C.charcoal],
    ];
    st.forEach((b, i) => {
      const x = MX + i * (w + gap);
      d.box(s, x, y, w, h, b[0], { sub: b[1], fill: b[2], size: 14, subSize: 12.5 });
      if (i < st.length - 1) d.arrow(s, x + w + 0.02, y + h / 2, x + w + gap - 0.02, y + h / 2, { w: 2, color: C.mintDeep });
    });
    term(s, MX, 3.4, 5.9, 1.95, [sel("out_wildcards.txt", "echo *.png"), sel("out_wildcards.txt", "echo *.gif"), sel("out_rm.txt", "ls junk*")].join("\n"), 11.5);
  }
  d.card(s, MX + 6.2, 3.4, 5.95, 3.45, { title: "Sonuçları", body: [
    "echo, bir komutun neyi alacağını gösterir.",
    "Her komut joker karakterleri \"destekler\" — onları hiç görmez.",
    "Eşleşme yoksa bash kalıbı olduğu gibi bırakır; ls de adı tam olarak junk* olan bir dosya arar.",
    "Kalıplar içerikle değil adlarla eşleşir; * gizli adları (. ile başlayan) atlar.",
  ], bodySize: 13.5 });
  d.callout(s, MX, 5.55, 5.9, 1.3, "3. haftayla bağlantı: bash genişletir, sonra fork() + exec() ls'yi hazır argüman listesiyle başlatır.", 13.5);
  s.addNotes("3. bölümün en önemli fikri budur. *.jpg kalıbı ls'ye hiç ulaşmaz; bash dizini okur (opendir/readdir), eşleşen adları sıralar ve onları ayrı argümanlar olarak geçirir. Kanıt: echo *.png, img013.png yazdırır — echo dosyalar hakkında hiçbir şey bilmez. Hiçbir şey eşleşmezse bash kalıbı değiştirmeden geçirir ve ls, adı tam olarak 'junk*' olan bir dosyadan yakınır. Joker karakter (wildcard) eşleştirmenin resmî adı 'globbing'dir (glob adlı eski bir UNIX programından gelir).");

  // 20 ── Joker karakter tablosu
  s = d.tableSlide({
    kicker: "Glob genişletme", title: "Joker Karakter Kalıpları (~/lab/photos içinde)",
    header: ["Kalıp", "Eşleşir", "Örnek", "Sonuç (gerçek)"],
    colW: [1.4, 3.4, 2.4, 4.95],
    rows: [
      ["*", "herhangi bir dizgi, boş dizgi de", "*.jpg", "12 ad: img001.jpg … img012.jpg"],
      ["?", "tam olarak bir karakter", "img00?.jpg", "9 ad: img001.jpg … img009.jpg"],
      ["[0-2]", "bir aralıktan bir karakter", "img01[0-2].jpg", "img010.jpg  img011.jpg  img012.jpg"],
      ["[135]", "listelenen karakterlerden biri", "img00[135].jpg", "img001.jpg  img003.jpg  img005.jpg"],
      ["[jJ]", "bir harfin küçük ya da büyüğü", "*.[jJ][pP]*", "12 .jpg, holiday.jpeg, IMG_014.JPG"],
      ["[!0-9]", "kümede OLMAYAN bir karakter", "img0[!0]*", "img010.jpg … img013.png"],
    ],
    fontSize: 15, y: 1.7,
    callout: "Linux adları büyük/küçük harfe duyarlıdır: *.jpg, IMG_014.JPG ile eşleşmez. Baştaki . (gizli ad) açıkça yazılmalıdır: .*",
  });
  s.addNotes("1-5. satırların sonuçları demo_wildcards.sh'den (sonraki slayt). [!...] satırı: img0[!0]* şu demektir: 'img0', ardından 0 dışında herhangi bir karakter, ardından herhangi bir şey; yani img010'dan img013'e kadar — dördüncü karakteri 1 olan dört ad. (Bazı kabuklar [^...] biçimini de kabul eder.) Göstermeden önce öğrencilerden tahmin isteyin: img0?? kaç adla eşleşir? (Hiçbiriyle; ?? tam olarak iki karakterdir, adlar ise daha uzundur.)");

  // 21 ── joker karakter gösterimi
  demoSlide({
    title: "Joker Karakterler İş Başında",
    text: sel("out_wildcards.txt", "ls", "ls *.jpg", "ls img00?.jpg", "ls img01[0-2].jpg", "ls img00[135].jpg", "ls *.[jJ][pP]*").replace(/^/, sel("out_wildcards.txt", "cd photos") + "\n"),
    termW: 8.0, size: 11,
    side: [
      "Terminalde ls, ada göre sıralı sütunlar yazar.",
      "LC_ALL=C.UTF-8 ile büyük harfler önce gelir: IMG_014.JPG en üsttedir.",
      "img00?, img001 … img009 ile eşleşir ama img010 ile eşleşmez.",
      "Bir kalıbı rm ya da mv ile kullanmadan önce mutlaka ls ile deneyin.",
    ],
    sideSize: 13,
    notes: "~/lab/photos içinde birlikte yazın. Sıralama yerel ayara (locale) bağlıdır: Türkçe ya da İngilizce yerel ayarda ls, IMG_014.JPG'yi i'lerin arasına yerleştirebilir; herkes slaytlardakiyle aynı çıktıyı alsın diye C.UTF-8 kullandık. Sorun: yalnızca PNG dosyalarını hangi kalıp listeler? (*.png.) Yalnızca 004-006 resimlerini? (img00[4-6].jpg.)",
  });

  // 22 ── süslü parantezler
  demoSlide({
    title: "Eşleşme Yok, Tırnaklar ve Süslü Parantez Genişletmesi",
    text: sel("out_wildcards.txt", "echo *.gif", 'echo "*.jpg"', "echo {1..5}", "echo img{01..03}.jpg", "echo report_{draft,final}.txt", "mkdir -p ../trip/{day1,day2,day3}/{photos,notes}", "tree ../trip"),
    termW: 8.0, size: 11,
    side: [
      { b: "Tırnaklar", t: " genişletmeyi kapatır." },
      { b: "{a,b}:", t: " bir liste.  {1..5}: bir aralık." },
      { b: "{01..03}:", t: " başı sıfırla doldurulmuş sayılar." },
      { b: "Çarpım:", t: " {day1,day2,day3}/{photos,notes} 3 × 2 = 6 dizin verir; trip ve 3 günle tree 10 sayar." },
    ],
    notes: "Süslü parantez genişletmesini (brace expansion) de bash yapar, hem de glob genişletmeden önce. Joker karakterlerden farklı olarak diske hiç bakmaz: metin üretir; bu yüzden yeni adlar oluşturmak (mkdir, touch) için idealdir. Sayıyı öğrencilerle denetleyin: 1 (trip) + 3 (günler) + 3 × 2 (her günde photos ve notes) = 10 dizin; tree'nin bildirdiği tam olarak budur. Sık hata: virgülden sonra boşluk, {a, b}, genişletmeyi bozar.",
  });

  // 23 ── karşılaştırma
  s = d.compareSlide({
    kicker: "İki genişletme", title: "Joker Karakterler ve Süslü Parantezler",
    left: { title: "Joker karakterler  *  ?  [ ]", items: [
      "Bir dizinde zaten var olan adlarla eşleşir.",
      "Sonuçlar alfabetik sıralanır.",
      "Eşleşme yoksa kalıp değişmeden kalır.",
      "Tipik kullanım: çok sayıda var olan dosyada ls, cp, mv, rm.",
      "Örnek: mv *.png png/",
    ] },
    right: { title: "Süslü parantezler  { , }  {1..5}", items: [
      "Dizgi üretir — dosyaların var olması gerekmez.",
      "Sıra tam olarak yazıldığı gibi korunur.",
      "Birden çok parantez çarpılır: {a,b}{1,2} → a1 a2 b1 b2.",
      "Tipik kullanım: mkdir, touch, çok sayıda yeni ad oluşturmak.",
      "Örnek: mkdir -p week{01..14}",
    ] },
    callout: "İkisini de bash, komut başlamadan önce yapar — ve ikisi de tırnaklarla ('…' ya da \"…\") kapatılır.",
  });
  s.addNotes("Farkı birer cümleyle özetleyin: joker karakterler adları BULUR, süslü parantezler adları ÜRETİR. Sınav tipi soru: mkdir -p site/{css,js,img}/{v1,v2} kaç dizin oluşturur? (1 + 3 + 3 × 2 = 10.)");

  // 24 ── tırnaklama
  demoSlide({
    title: "Boşluklu Adlar: Tırnak ya da Kaçış",
    text: code("out_quoting.txt"),
    termW: 7.6, size: 12.5,
    side: [
      "Boşluk argümanları ayırır: cat İKİ ad aldı.",
      { b: "\"…\" ya da '…':", t: " tek argüman." },
      { b: "\\ (ters eğik çizgi):", t: " sonraki karakteri kaçışlar." },
      "Tab tamamlama ters eğik çizgiyi sizin için ekler.",
      "mkdir my photos, \"my\"yi oluşturdu, \"photos\"ta başarısız oldu.",
      { b: "İpucu:", t: " kendi adlarınızda boşluk yerine _ ya da - kullanın." },
    ],
    sideSize: 13,
    notes: "Windows kullanıcılarının boşluklu pek çok dosya adı vardır. Kabuk, cat başlamadan önce komut satırını boşluklardan böler; böylece cat, docs/final ve report.txt adlarını alır. Üç çözüm: çift tırnak, tek tırnak (farkı 14. haftada önemli olacak: değişkenler yalnızca çift tırnak içinde genişletilir) ya da ters eğik çizgi. ls bu tür adları tırnak içinde yazar ('final report.txt'), böylece onları kopyalayıp bir komuta geri yapıştırabilirsiniz; son listede 'my'nin önündeki boşluk yalnızca hizalama içindir. Öğrenciler için temizlik: rmdir my 'my photos'.",
  });

  // ───────────────────────── BÖLÜM 4
  s = d.sectionSlide({ kicker: "Bölüm 4", title: "Dosyaların İçine Bakmak", subtitle: "cat · less · head · tail · wc · file · stat · du · df" });
  s.addNotes("~/lab'a dönün. Bu komutlar yalnızca okur: denemek güvenlidir.");

  // 26 ── cat head tail
  demoSlide({
    title: "cat, head ve tail",
    text: sel("out_view.txt", "cat docs/linux_quotes.txt", "cat -n docs/notes_01.txt docs/notes_02.txt", "head -n 3 data/students.csv", "tail -n 3 logs/system.log"),
    termW: 8.3, size: 11.5,
    side: [
      { b: "cat:", t: " dosyaların tamamını yazar; birden çok dosyayı art arda ekler (concatenate)." },
      { b: "-n:", t: " satırları numaralar." },
      { b: "head / tail -n N:", t: " ilk / son N satır (varsayılan 10)." },
      "Uzun dosyalarda cat ekrandan kayar gider: less kullanın.",
    ],
    sideSize: 13,
    notes: "cat, concatenate (art arda eklemek) sözcüğünden gelir: cat a b önce a'yı, sonra b'yi yazar; -n ile numaralama dosyalar boyunca sürer. Bir CSV'nin sütun adlarını görmenin en hızlı yolu head -n 3'tür. tail, en yeni satırları sonda olan günlük (log) dosyaları için doğal araçtır. Sorun: syllabus dosyasının 1-5. satırlarını nasıl görürsünüz? (head -n 5 docs/syllabus.txt.)",
  });

  // 27 ── tail -f, less
  s = d.content({ kicker: "Canlı gösterim", title: "tail -f ile Günlük İzlemek; less ile Sayfalamak" });
  {
    const f = blocks("out_view.txt").find(b => b.cmd === "tail -n 2 -f logs/system.log");
    d.text(s, "Terminal 1", { x: MX, y: 1.62, w: 3, h: 0.32, fontSize: 12.5, bold: true, color: C.mintDeep });
    term(s, MX, 1.95, 7.6, 1.9, [f.prompt + f.cmd, ...f.out].join("\n"), 11);
    d.text(s, "Terminal 2 (bu sırada bir program bir satır ekler)", { x: MX, y: 4.0, w: 7.6, h: 0.32, fontSize: 12.5, bold: true, color: C.mintDeep });
    term(s, MX, 4.33, 7.6, 0.85, "student@okan-lab:~/lab$ echo \"2026-10-12 15:00:00 WARN  disk almost full\" >> logs/system.log", 9);
    d.callout(s, MX, 5.4, 7.6, 1.45, "tail -f dosyayı açık tutar ve her yeni satırı geldiği anda yazar — bir günlüğü izlemenin standart yolu. Ctrl+C ile durdurun.", 14);
  }
  table(s, ["less tuşu", "İşlem"], [
    ["Space / b", "sonraki / önceki sayfa"],
    ["↓ ↑", "bir satır"],
    ["/sözcük", "ileri doğru ara"],
    ["n  N", "sonraki / önceki eşleşme"],
    ["g  G", "dosyanın başı / sonu"],
    ["q", "çık"],
  ], { x: MX + 7.9, y: 1.65, w: 4.25, colW: [1.55, 2.7], fontSize: 13.5 });
  d.text(s, "less logs/access.log  ·  man sayfaları da aynı tuşları kullanır", { x: MX + 7.9, y: 5.25, w: 4.25, h: 0.55, fontSize: 12.5, italic: true, color: C.mutedOnLight });
  s.addNotes("İki terminal penceresiyle gösterin: birincide tail -n 2 -f logs/system.log, ikincide echo ... >> komutunu çalıştırın; yeni WARN satırı hemen birinci pencerede belirir. Durdurmak için Ctrl+C'ye basın (^C). Yakalanan çıktı demo_view.sh'den gelir; orada ikinci terminalin rolünü bir arka plan işi oynar. Sonra less logs/access.log'u canlı gösterin: boşluk, /404, n, q. less bir seferde yalnızca bir ekran okur, bu yüzden çok büyük dosyaları bile anında açar. 9. haftadaki man sayfaları da less ile görüntülenir.");

  // 28 ── wc ve file
  demoSlide({
    title: "wc Sayar, file Tanır",
    text: sel("out_view.txt", "wc docs/linux_quotes.txt", "wc -l data/*.csv data/*.txt", "file README.txt src/hello.c data/students.csv photos/img001.jpg projects /usr/bin/ls"),
    termW: 8.3, size: 11.5,
    side: [
      { b: "wc:", t: " satır, sözcük, bayt — burada 5, 50, 302." },
      { b: "-l -w -c:", t: " yalnızca satır, sözcük ya da bayt." },
      "students.csv: 41 satır = 1 başlık + 40 öğrenci.",
      { b: "file", t: " uzantıyı değil içeriği okur (sihirli sayı, 7. hafta): img001.jpg \"empty\"dir." },
    ],
    sideSize: 13,
    notes: "wc = word count (sözcük sayımı). Birden çok dosyada bir toplam satırı ekler. file adı yok sayar: laboratuvarımızdaki fotoğraflar .jpg adlı boş dosyalardır ve file 'empty' (boş) bildirir; gerçek bir JPEG FF D8 FF baytlarıyla başlar. /usr/bin/ls bir ELF yürütülebilir dosyasıdır (uzun satır … ile kesildi). Sorun: syllabus kaç satırdır? (wc -l docs/syllabus.txt → 15.)",
  });

  // 29 ── stat
  s = d.content({ kicker: "Tekrar · 7. hafta", title: "stat: Düğümü Okumak" });
  term(s, MX, 1.65, 8.3, 3.15, sel("out_stat_du_df.txt", "stat docs/syllabus.txt"), 11.5);
  term(s, MX, 5.0, 8.3, 1.85, sel("out_stat_du_df.txt", { cmd: 'stat -c "%n: %s bytes, inode %i, %h link(s)" docs/*.txt', max: 3 }), 11);
  d.card(s, MX + 8.6, 1.65, 3.55, 5.2, { title: "Nasıl okunur", body: [
    { b: "Size 578:", t: " verinin bayt sayısı." },
    { b: "Blocks 8:", t: " 8 × 512 B = 4096 B = bir adet 4 KiB blok." },
    { b: "Inode, Links:", t: " düğüm numarası ve bağlantı sayısı." },
    { b: "Access (0664/…):", t: " izinler → 11. hafta." },
    { b: "-c:", t: " yalnızca seçilen alanları yazar (%s %i %h …)." },
  ], bodySize: 13 });
  s.addNotes("Bu, 7. haftadaki düğümün alan alan yazdırılmış hâlidir. 578 baytlık bir dosya bile bütün bir 4096 baytlık bloğu kaplar: Blocks 512 baytlık birimleri sayar, yani 8 x 512 = 4096. -rw-rw-r-- izin dizgisi ve onun sekizli (octal) biçimi 0664 gelecek haftanın konusudur. Biçim dizgili stat -c betiklerde kullanışlıdır (14. hafta): %n ad, %s boyut, %i düğüm, %h sabit bağlantı sayısı. Altı dosyanın tam çıktısı code/out_stat_du_df.txt içindedir.");

  // 30 ── du df
  demoSlide({
    title: "du ve df: Ne Kadar Yer?",
    text: sel("out_stat_du_df.txt", "du -sh docs data logs photos", "du -h projects", "df -h ~"),
    termW: 7.0, size: 13,
    side: [
      { b: "du:", t: " dosyaların kullandığı disk alanı, tam bloklarla. -s argüman başına toplam, -h K/M/G." },
      { b: "photos 4.0K:", t: " 15 boş dosya 0 blok kullanır; yalnızca dizinin 4 KiB'lık bloğu sayılır." },
      { b: "logs 36K", t: " = 4 K (dizin) + 24 K + 8 K (iki günlük)." },
      { b: "df:", t: " dosya sistemi başına boyut, kullanılan ve boş alan. Use% = Used / (Used + Avail) ≈ 12 / 42 ≈ %29." },
    ],
    sideSize: 12.5,
    notes: "du ayrılmış blokları sayar, bu yüzden küçük dosyalar 4 KiB'a yuvarlanır: access.log 23.604 bayttır ve ceil(23604/4096) = 6 blok = 24 KiB gerektirir; system.log 5.207 bayttır, 2 blok = 8 KiB; artı dizin için 4 KiB = 36K. df dosya sistemi başına (bağlanmış her disk için) bildirir. Size, Used + Avail'e eşit değildir: alanın bir kısmı ayrılmıştır ve sıradan kullanıcılara açık değildir (sanal test makinemizde epey fazla; normal bir ext4 diskte root için %5). Sizin makinenizdeki sayılar farklı olacaktır.",
  });

  // 31 ── bağlantı gösterimi
  demoSlide({
    kicker: "Canlı gösterim · bağlantılar", title: "Sabit Bağlantı, Kopya ve Sembolik Bağlantı Yan Yana",
    text: sel("out_links.txt", "ln syllabus.txt plan.txt", "cp syllabus.txt copy.txt", "ln -s syllabus.txt shortcut.txt", "ls -li syllabus.txt plan.txt copy.txt shortcut.txt", 'echo "Week 16  Party" >> plan.txt', "tail -n 1 syllabus.txt copy.txt", "rm syllabus.txt", "ls -li plan.txt shortcut.txt", "cat shortcut.txt"),
    termW: 8.3, size: 11.5,
    side: [
      `plan.txt = aynı düğüm ${L["plan.txt"].ino}, bağlantı sayısı 2.`,
      "plan.txt üzerinden yapılan değişiklik syllabus.txt'de görünür, copy.txt'de görünmez.",
      `shortcut.txt: kendi düğümü, boyut ${L["shortcut.txt"].size} = "syllabus.txt" uzunluğu.`,
      "rm'den sonra: plan.txt veriyi korur (sayı 1); shortcut.txt askıda kalır.",
    ],
    sideSize: 12.5,
    notes: "~/lab/docs içinde çalıştırın (önce cd docs). Bu, 5. slayttaki durumdur. plan.txt üzerinden bir satır ekledikten sonra tail onu syllabus.txt'nin sonunda gösterir — ikisi tek bir dosyadır. Kopya hâlâ 'Week 15 Final exam' ile biter. Boyut 593 = 578 + 15 bayt ('Week 16  Party' ve satır sonu). rm syllabus.txt'den sonra veriye plan.txt adıyla hâlâ ulaşılabilir; sembolik bağlantı yalnızca artık var olmayan 'syllabus.txt' yolunu saklar, bu yüzden cat başarısız olur (askıda kalan bağlantı, dangling link).",
  });

  // 32 ── bağlantı tablosu + dizinler
  s = d.content({ kicker: "Bağlantılar", title: "Sabit Bağlantı, Sembolik Bağlantı ve Kopya" });
  table(s, ["", "Sabit bağlantı  ln", "Sembolik bağlantı  ln -s", "Kopya  cp"], [
    ["Düğüm", "hedefle aynı", "kendine ait (yol saklar)", "kendine ait"],
    ["Veri", "paylaşılır", "yol üzerinden ulaşılır", "çoğaltılır"],
    ["Hedef silinirse", "veri kalır (sayı − 1)", "bağlantı askıda kalır", "kopya etkilenmez"],
    ["Dizinler", "izin verilmez", "izin verilir", "-r ile"],
    ["Başka dosya sistemi", "olanaksız", "olanaklı", "olanaklı"],
  ], { y: 1.65, w: 12.15, colW: [2.4, 3.15, 3.45, 3.15], fontSize: 13.5 });
  term(s, MX, 4.45, 8.0, 2.4, sel("out_links.txt", "ln -s projects/alpha/docs alpha_docs", "ls -l alpha_docs", "ln projects alpha_hard", "ls -ld projects projects/alpha"), 10.5);
  d.card(s, MX + 8.3, 4.45, 3.85, 2.4, { title: "Dizinin bağlantı sayısı", body: "2 + alt dizin sayısı: üst dizindeki adı, kendi . girdisi ve her çocuğun .. girdisi. projects: 2 + 2 = 4.", bodySize: 13 });
  s.addNotes("Sembolik bağlantılar gündelik 'kısayol'dur: alpha_docs ağacın derinlerindeki bir dizini gösterir (ls -l'de baştaki l ve ok). Dizinlere sabit bağlantı yasaktır, çünkü döngüler oluşturabilirler (7. hafta, genel çizge dizinleri). Bir dizinin bağlantı sayısı '.' ve '..' girdilerini açıklar: projects'in ~/lab içinde 'projects' adı, kendi içinde '.' girdisi ve alpha ile beta'nın '..' girdileri vardır: 4.");

  // 33 ── fileops.c
  s = d.codeSlide({
    kicker: "Uygulama · C", title: "Aynı İşlemler, C'de Sistem Çağrısı Olarak",
    code: code("fileops_excerpt.c"), size: 11, codeW: 8.0, sideTitle: "Neye dikkat edin",
    side: [
      "link(): düğüm aynı, bağlantı 2.",
      "rename(): düğüm değişmez.",
      "box boş değilken rmdir() başarısız olur.",
    ],
    run: { h: 3.4, size: 10.5, text: sel("out_fileops.txt", "./fileops").replace(/^student@okan-lab:~\/lab\$ /, "$ ") },
  });
  s.addNotes("fileops.c (code klasöründe, gcc -Wall -O2 ile derlenir) sistem çağrılarını doğrudan yapar; bugünkü her kabuk komutu için bir çağrı. Bir çağrı başarısız olursa CHECK, nedenini perror() ile yazar; tıpkı komutların hata iletileri gibi. Gerçek çıktı: link()'ten sonra iki ad da 2 bağlantılı aynı düğümü gösterir; rename düğümü korur; unlink'ten sonra sayı yeniden 1'dir. Boş olmayan box üzerinde rmdir() 'Directory not empty' ile başarısız olur — kabukta rmdir'in yazdığı metnin aynısı, çünkü ileti çekirdeğin ENOTEMPTY hata kodundan gelir. İsteğe bağlı gösterim; zaman azsa atlayın.");

  // 34 ── Özet tablo 2
  s = d.tableSlide({
    kicker: "Özet tablo 2", title: "Görüntüleme, İnceleme ve Bağlama",
    header: ["Komut", "Ne yapar", "Yararlı seçenekler"],
    colW: [2.8, 5.0, 4.35],
    rows: [
      ["cat file…", "dosyaları yazar (art arda ekler)", "-n  satırları numarala"],
      ["less file", "dosyada sayfa sayfa gezinir", "Space  /sözcük  n  q"],
      ["head / tail file", "ilk / son satırlar", "-n N  kaç satır   tail -f  izle"],
      ["wc file", "satır, sözcük, bayt sayar", "-l  -w  -c"],
      ["file name", "içerik türünü tanır", "—"],
      ["stat file", "düğümü gösterir", "-c \"%n %s %i %h\"  seçilen alanlar"],
      ["du / df", "dosyaların kullandığı alan / dosya sistemi başına boş alan", "-s  özet   -h  okunabilir birimler"],
      ["ln / ln -s", "sabit bağlantı / sembolik bağlantı", "ls -li  düğüm ve sayıyı denetle"],
    ],
    fontSize: 14, y: 1.7,
  });
  s.addNotes("Başvuru tablosunun ikinci yarısı. Yine: daha çok seçenek içeren tam sürüm ders notlarında.");

  // 35–36 ── Laboratuvar
  s = d.content({ kicker: "Sınıf içi laboratuvar · 35 dakika", title: "Laboratuvar Föyü: A (Temel) ve B (Orta) Bölümleri", lead: "Temiz başlangıç: bash ~/mcmp117_lab_setup.sh && cd ~/lab — sonra alıştırmaları sırayla yapın. Tam metin ve puanlar ders notlarında." });
  d.card(s, MX, 2.3, 5.95, 4.55, { title: "A bölümü — 33 puan", body: [
    "1  mkdir -p practice/a/b/c",
    "2  tek touch ile üç boş dosya",
    "3  syllabus.txt'yi backup/ içine yeni adla kopyalayın",
    "4  yeniden adlandırın; düğümün aynı kaldığını kanıtlayın",
    "5  syllabus'un ilk 4 ve son 2 satırı",
    "6  satır/sözcük/bayt sayın; kaç öğrenci var?",
    "7  \"final report.txt\"yi iki yolla gösterin",
  ], bodySize: 15 });
  d.card(s, MX + 6.2, 2.3, 5.95, 4.55, { title: "B bölümü — 39 puan", body: [
    "8  fotoğrafları ? ve [ ] ile listeleyin",
    "9  photos/'u jpg/, png/, other/ içine ayırın",
    "10  docs/* neden .settings'i göstermez?",
    "11  docs/'u cp -r ile yedekleyin; du ile karşılaştırın",
    "12  dosya türleri ve disk kullanımı",
    "13  touch -d ile zaman ayarlayın; stat ile okuyun",
  ], bodySize: 15 });
  s.addNotes("Öğrenciler tek başına ya da ikili çalışır; aralarında dolaşın. 9. alıştırma asıl 'fotoğrafları düzenle' görevidir: IMG_014.JPG ve holiday.jpeg'in *.jpg ile eşleşmediğini unutan öğrencilere dikkat edin (büyük/küçük harf duyarlılığı, farklı uzantı). Kalıplı her mv ya da rm'den önce aynı kalıpla ls çalıştırmalarında ısrar edin.");

  s = d.content({ kicker: "Sınıf içi laboratuvar · devam", title: "Laboratuvar Föyü: C (Zor) Bölümü ve Notlandırma", lead: "C bölümü 7. haftanın kuramını gerektirir: düğümler, bağlantı sayıları, askıda kalan bağlantılar." });
  d.card(s, MX, 2.3, 7.4, 4.55, { title: "C bölümü — 28 puan", body: [
    "14  syllabus'a sabit bağlantı; özgünü silin; verinin yaşadığını gösterin",
    "15  alpha_docs sembolik bağlantısı; hedefini yeniden adlandırın; askıda kalan bağlantıyı onarın",
    "16  tek komut: course/week01 … week14, her birinde slides/ ve notes/ — kaç dizin?",
    "17  temizlik: rmdir practice neden başarısız olur? practice ve course'u güvenle silin",
  ], bodySize: 16 });
  d.card(s, MX + 7.65, 2.3, 4.5, 4.55, { title: "Nasıl notlandırılır", body: [
    "Toplam 100 puan (A 33, B 39, C 28).",
    "Komutları VE önemli çıktı satırlarını yazın.",
    "İstenen yerde bir cümleyle açıklayın (\"neden\").",
    "Beklenen çıktılarıyla çözümler: notların son bölümü.",
  ], bodySize: 15 });
  s.addNotes("16. alıştırmanın yanıtı: 1 + 14 + 14 × 2 = 43 dizin (course, 14 hafta, 28 alt dizin). 17. alıştırma: practice boş olmadığı için rmdir reddeder; rm -r practice course iki ağacı da siler — önce ls çalıştırın. Erken bitirenler: 9. alıştırmayı TEK mkdir ve üç mv komutuyla yeniden yapsın, sonra 15. alıştırmayı projects/ içinde göreli bir sembolik bağlantıyla denesin.");

  // 37 ── Sık yapılan hatalar
  s = d.tableSlide({
    kicker: "Sık yapılan hatalar", title: "Hata İletileri ve Anlamları",
    header: ["İleti (gerçek)", "Neden", "Çözüm"],
    colW: [5.3, 3.8, 3.05],
    rows: [
      ["cp: -r not specified; omitting directory", "bir dizini kopyalamak", "cp -r"],
      ["rm: cannot remove 'x': Is a directory", "-r olmadan rm", "rmdir (boşsa) ya da rm -r"],
      ["rmdir: failed to remove 'x': Directory not empty", "rmdir yalnızca boş dizinleri siler", "boşaltın ya da dikkatle rm -r"],
      ["mkdir: cannot create directory 'a/b': No such file or directory", "üst dizin a yok", "mkdir -p a/b"],
      ["cat: docs/final: No such file or directory", "addaki boşluk tırnaksız", "\"docs/final report.txt\""],
      ["ls: cannot access 'junk*': No such file or directory", "kalıp hiçbir şeyle eşleşmedi", "ls / echo ile denetleyin"],
      ["ln: projects: hard link not allowed for directory", "dizine sabit bağlantı", "ln -s"],
    ],
    fontSize: 15, y: 1.65,
  });
  s.addNotes("Bütün iletiler bugünkü gösterimlerin gerçek çıktılarıdır (mkdir adı ‘ ’ tırnaklarıyla yazar). Türkçe yerel ayarlı bir sistemde bu iletiler Türkçe görünebilir; anlamları aynıdır. Hepsinden kötüsü sessiz hatadır: cp ve mv var olan bir hedefin üzerine sormadan yazar; emin değilseniz -i kullanın. Bir başka sessiz hata: backup yokken cp file backup (eğik çizgisiz) yazmak, backup adında bir DOSYA oluşturur.");

  // 38 ── Kısa sınav
  s = d.quizSlide({ questions: [
    "~/lab/photos içinde echo img01?.* ne yazdırır?",
    "mv report.txt old/ mu, cp report.txt old/ mu: hangisi yeni bir düğüm oluşturur? 4 GB'lık bir dosyada hangisi anında biter?",
    "mkdir -p site/{css,js,img}/{v1,v2}, site dahil kaç dizin oluşturur?",
    "ln a.txt b.txt; ln -s a.txt c.txt; rm a.txt komutlarından sonra cat b.txt ve cat c.txt ne yazdırır?",
  ] });
  s.addNotes("Yanıtlar (hepsi lab klasöründe denetlendi). (1) img010.jpg img011.jpg img012.jpg img013.png — ? 0, 1, 2, 3 ile eşleşir; .* herhangi bir uzantıyla eşleşir. (2) cp yeni bir düğüm oluşturur; aynı dosya sistemi içinde mv yalnızca dizin girdisini değiştirir, bu yüzden anında biter. (3) 1 + 3 + 3 × 2 = 10. (4) cat b.txt içeriği yazdırır (bağlantı sayısı artık 1); cat c.txt 'No such file or directory' ile başarısız olur, çünkü sembolik bağlantı askıda kalmıştır.");

  // 39 ── Akılda kalacaklar
  s = d.content({ kicker: "Kapanış", title: "10. Hafta — Akılda Kalacaklar" });
  d.bullets(s, [
    { b: "Adlar ve düğümler:", t: " cp yeni düğüm oluşturur, mv yeniden adlandırır (düğüm aynı), ln ad ekler, rm ad siler — bağlantı sayısı 0 olunca veri serbest kalır." },
    { b: "Oluşturma:", t: " bütün yollar için mkdir -p; boş dosyalar ve zaman damgaları (atime, mtime, ctime) için touch." },
    { b: "Kopyalama, taşıma:", t: " dizinler için cp -r; cp ve mv sessizce üzerine yazar — -i kullanın." },
    { b: "Silme:", t: " rm'nin geri alması yoktur; rmdir yalnızca boş dizinleri siler; rm -r'den önce ls ile bakın." },
    { b: "Genişletme:", t: " kabuk * ? [ ] (var olan adlar) ve { } (üretilen metin) kalıplarını komut çalışmadan önce genişletir; echo sonucu gösterir." },
    { b: "Görüntüleme:", t: " cat, less, head, tail -f, wc, file, stat, du, df." },
    { b: "Her komut bir sistem çağrısıdır:", t: " mkdir(), renameat2(), linkat(), symlinkat(), unlinkat(), rmdir()." },
  ], { fontSize: 20, y: 1.7, h: 5.15, paraSpaceAfter: 14 });
  s.addNotes("Hızlıca okuyun. Laboratuvar föyünün notlandırıldığını ve Telegram'daki duyuruya göre teslim edileceğini hatırlatın.");

  // 40–41 ── Kapanış
  d.closing({ nextWeek: "İzinler, Sahiplik ve Kullanıcılar", nextItems: [
    "Neden koruma? İkili mod (2. hafta) ve dosya koruması (7. hafta) ile bağlantı",
    "Kullanıcılar ve gruplar: id, whoami, /etc/passwd, /etc/group",
    "-rw-rw-r-- okumak; sembolik (u+x) ve sekizli (754) chmod",
    "umask, chown/chgrp, sudo — ve student olarak Permission denied",
    "Laboratuvar: bir proje klasörünü güvenli hâle getirin, bir betiği çalıştırılabilir yapın",
  ] });
  d.pres.slides[d.n - 2].addNotes("Gelecek hafta bugün görmezden geldiğimiz ls -l'nin ilk sütununu, -rw-rw-r--'yi, ve stat'ın Access: (0664/...) satırını açıklayacağız. Bu bilgi, bütün gün kullandığımız aynı düğümde saklanır. Öğrencilerden ~/lab klasörlerini korumalarını isteyin; gelecek hafta kurulum betiğini zaten yeniden çalıştıracağız.");
  d.pres.slides[d.n - 1].addNotes("Sorular. Telegram kanalındaki soruların herkese yardımcı olduğunu ve bu haftanın her gösterim betiğinin ve gerçek çıktısının code klasöründe bulunduğunu hatırlatın.");

  await d.save(path.join(__dirname, "MBLP131_Hafta10.pptx"));
  console.log("slayt:", d.n);
})();
