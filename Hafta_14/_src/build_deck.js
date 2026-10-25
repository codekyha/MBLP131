// Hafta 14 sunumu (MBLP131, Türkçe): Kabuk Betiklerine Giriş (15. haftadaki final sınavından önceki son ders)
// İngilizce referans: ../week14/build_deck.js (aynı slayt sırası, aynı diyagramlar, aynı sayılar, aynı çıktılar)
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("../lib/deck");
const d = new Deck({ week: 14, lang: "tr", assets: path.join(__dirname, "../lib") });
const P = d.pres;
const code = f => fs.readFileSync(path.join(__dirname, "code", f), "utf8");
const PALE = "D7E9E6";
const PROMPT = "student@okan-lab:~/lab/scripts$ ";

// ---------- dökümler: yakalanmış out_*.txt dosyasını {cmd, out[]} bloklarına böl ----------
function blocks(file) {
  const res = [];
  code(file).replace(/\n$/, "").split("\n").forEach(l => {
    if (l.startsWith(PROMPT)) res.push({ cmd: l.slice(PROMPT.length), out: [] });
    else res[res.length - 1].out.push(l);
  });
  return res;
}
// blokları komut metnine (birebir) ya da sıra numarasına göre seç; opts.max uzun çıktıyı "..." ile kısaltır
function show(bl, sel, opts = {}) {
  const chosen = sel.map(k => typeof k === "number" ? bl[k] : bl.find(b => b.cmd === k));
  return chosen.map(b => {
    if (!b) throw new Error("missing block " + JSON.stringify(sel));
    let out = b.out;
    if (opts.max && out.length > opts.max) out = out.slice(0, opts.max).concat(["..."]);
    return [PROMPT + b.cmd].concat(out).join("\n");
  }).join("\n");
}

// ---------- kod kutuları ----------
// n satırı, en çok m karakterle w x h inçe sığdıran yazı boyutu (Consolas ≈ 0,55 em genişlik)
function fit(text, w, h, max = 13, min = 8.5) {
  const lines = text.replace(/\n$/, "").split("\n");
  const m = Math.max(...lines.map(l => l.length));
  const byH = (h - 0.26) * 72 / (lines.length * 1.3);
  const byW = (w - 0.42) * 72 / (m * 0.62);
  const s = Math.min(max, byH, byW);
  if (s < min) console.warn(`WARNING: text too large for box (${s.toFixed(1)} pt): ${lines[0]}`);
  return Math.floor(Math.max(s, min) * 2) / 2;
}
function box(s, x, y, w, h) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.dark }, rectRadius: 0.05, line: { type: "none" } });
}
// terminal dökümü: istem nane yeşili, komut beyaz, çıktı açık gri
function term(s, x, y, w, h, text, max = 13) {
  box(s, x, y, w, h);
  const size = fit(text, w, h, max);
  const lines = text.replace(/\n$/, "").split("\n");
  const runs = [];
  lines.forEach((ln, i) => {
    const br = i < lines.length - 1;
    if (ln.startsWith(PROMPT)) {
      runs.push({ text: PROMPT, options: { color: C.mint } });
      runs.push({ text: ln.slice(PROMPT.length) || " ", options: { color: C.white, bold: true, breakLine: br } });
    } else runs.push({ text: ln.length ? ln : " ", options: { color: "C9D1D3", breakLine: br } });
  });
  s.addText(runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: h - 0.24, fontFace: F.code, fontSize: size, valign: "top", margin: 0, lineSpacingMultiple: 1.0, isTextBox: true });
}
// betik listesi: yorumlar soluk (tam satır ve satır sonu), kod açık renk
function script(s, x, y, w, h, text, max = 13) {
  box(s, x, y, w, h);
  const size = fit(text, w, h, max);
  const lines = text.replace(/\n$/, "").split("\n");
  const runs = [];
  lines.forEach((ln, i) => {
    const br = i < lines.length - 1;
    const t = ln.trim();
    if (t.startsWith("#")) { runs.push({ text: ln, options: { color: C.mutedOnDark, breakLine: br } }); return; }
    const m = ln.match(/^(.*?\S)(\s{2,}#\s.*)$/);
    if (m) {
      runs.push({ text: m[1], options: { color: C.light } });
      runs.push({ text: m[2], options: { color: C.mutedOnDark, breakLine: br } });
    } else runs.push({ text: ln.length ? ln : " ", options: { color: C.light, breakLine: br } });
  });
  s.addText(runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: h - 0.24, fontFace: F.code, fontSize: size, valign: "top", margin: 0, lineSpacingMultiple: 1.0, isTextBox: true });
}
const strip = (t, n = 0) => t.replace(/\n$/, "").split("\n").slice(n).join("\n");   // ilk n satırı at

function label(s, text, x, y, w, color = C.mintDeep) {
  d.text(s, text, { x, y, w, h: 0.32, fontSize: 12.5, bold: true, color });
}
function numDot(s, x, y, n, fill = C.mint) {
  s.addShape(P.shapes.OVAL, { x, y, w: 0.36, h: 0.36, fill: { color: fill }, line: { type: "none" } });
  d.text(s, String(n), { x, y, w: 0.36, h: 0.36, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle" });
}

const B = {
  first: blocks("out_first.txt"), vars: blocks("out_variables.txt"), args: blocks("out_args.txt"),
  status: blocks("out_status.txt"), grade: blocks("out_grade.txt"), loops: blocks("out_loops.txt"),
  backup: blocks("out_backup.txt"), report: blocks("out_report.txt"), errors: blocks("out_errors.txt"),
};

(async () => {
  // 1 ── Başlık
  let s = d.titleSlide({
    kicker: "MBLP131  ·  HAFTA 14",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 14  ·  Kabuk Betiklerine Giriş",
    tagline: "Bir kez yazın, kaydedin, bin kez çalıştırın.",
  });
  s.addNotes("14. haftaya hoş geldiniz; bu, final sınavından önceki son dersimiz. Beş haftadır komutları tek tek yazdık. Bugün komutları dosyalara koyuyoruz ve onları kabuğun bizim yerimize çalıştırmasını sağlıyoruz: kabuk betikleri (shell scripts). Adım adım ilerleyip ~/lab/scripts içinde iki gerçek otomasyon betiğiyle bitireceğiz: backup.sh ve report.sh. İkinci saat büyük ölçüde uygulamalı: 3-4 küçük betiği kendiniz yazacaksınız ve bunlar notlandırılacak.");

  // 2 ── 13. hafta özeti
  s = d.cardsSlide({
    kicker: "Geçen hafta", title: "Dört Fikirde 13. Hafta",
    cards: [
      { title: "Süreçler", body: "Her komut, PID'si ve ebeveyni (PPID) olan bir süreç olarak çalışır. ps, pstree ve top bunları gösterir; STAT sütunu R, S, T, Z durumlarını verir." },
      { title: "İş denetimi", body: "komut & arka planda çalışır; Ctrl+Z bir işi durdurur; jobs, fg ve bg işleri ön plan ile arka plan arasında taşır." },
      { title: "Sinyaller", body: "kill bir sinyal gönderir: SIGTERM (15) kibarca ister, SIGKILL (9) reddedilemez, Ctrl+C SIGINT (2) gönderir." },
      { title: "Öncelik", body: "nice ve renice nice değerini (−20 … 19) ayarlar; değeri yalnızca root düşürebilir (yani önceliği yükseltebilir)." },
    ], cols: 4, bodySize: 16,
    callout: "Bugün: betik de yalnızca bir programdır. Onu çalıştırdığınızda kabuk onun için yeni bir süreç oluşturur — 13. haftada gördüğümüz her şey burada da geçerlidir.",
  });
  s.addNotes("İki dakikalık tekrar. Sorun: SIGTERM ile SIGKILL arasındaki fark nedir? (15 yakalanıp ele alınabilir, 9 alınamaz.) Ctrl+Z ne yapar? (SIGTSTP gönderir; iş durdurulur, durum T.) Çocuk süreç fikrini aklınızda tutun: ./hello.sh çalıştırdığımızda kabuk, tıpkı ls ya da sleep için yaptığı gibi bir çocuk süreç çatallar (fork).");

  // 3 ── Gündem
  s = d.content({ kicker: "Hafta 14", title: "Bugünün Gündemi" });
  [
    ["1", "İlk betiğiniz", "Neden otomasyon; shebang satırı; chmod +x; ./script.sh ile bash script.sh farkı."],
    ["2", "Değişkenler ve girdi", "ad=değer, tırnaklar, $( ), $(( )), $1 $# $@, read."],
    ["3", "Kararlar", "Çıkış durumu $?, test ve [ ], if / elif / else, bash -x ile hata ayıklama."],
    ["4", "Döngüler ve fonksiyonlar", "for (listeler, {1..5}, dosyalar), while, fonksiyonlar."],
    ["5", "İki gerçek betik", "backup.sh (zaman damgalı tar.gz) ve report.sh (günlük ve not özeti)."],
    ["6", "Laboratuvar", "Sık yapılan hatalar, ardından notlandırılan 3–4 betiği siz yazıyorsunuz."],
  ].forEach((a, i) => {
    const y = 1.65 + i * 0.86;
    d.box(s, MX, y, 0.72, 0.72, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 0.9, y, w: 11.25, h: 0.72, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "   ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.2, y, w: 10.8, h: 0.72, valign: "middle" });
  });
  s.addNotes("1. ve 2. bölümler moladan önce, 3-5. bölümler moladan sonra; ardından sık yapılan hatalar ve notlandırılan laboratuvar (30-40 dakika). Başlamadan önce: herkes temiz bir ~/lab için 'bash ~/mcmp117_lab_setup.sh' komutunu, sonra 'cd ~/lab/scripts' komutunu çalıştırsın. Bugünkü örnek betiklerin hepsi hafta14/code klasöründe; bunları ~/lab/scripts içine kopyalayın.");

  // ───────────────────────── BÖLÜM 1
  s = d.sectionSlide({ kicker: "Bölüm 1", title: "İlk Betiğiniz", subtitle: "Kabuk betiği, içi komutlarla dolu bir metin dosyasıdır." });
  s.addNotes("Geçiş: 9-13. haftalarda yazdığınız her şey bir dosyaya konabilir.");

  // 5 ── Neden betik
  s = d.compareSlide({
    kicker: "Otomasyon", title: "Neden Betik Yazarız?",
    lead: "Kabuk betiği (shell script), kabuk komutları içeren düz bir metin dosyasıdır. Kabuk dosyayı okur ve komutları birbiri ardına çalıştırır.",
    left: { title: "Komutları elle yazmak", color: C.red, items: [
      "Her sabah: yedekleme ve günlük denetimi için 6 komut.",
      "Bir adımı unutmak ya da bir yolu yanlış yazmak kolay.",
      "Bir iş arkadaşınıza tam olarak ne yaptığınızı anlatmak zor.",
      "Siz uyurken saat 03.00'te çalışamaz.",
    ] },
    right: { title: "Komutları bir betiğe koymak", items: [
      "Tek komut: ./backup.sh — her seferinde aynı adımlar.",
      "Bir hatayı bir kez düzeltirsiniz; düzeltilmiş kalır.",
      "Betik, yordamın belgesidir (yorumlar!).",
      "Bir zamanlayıcı (cron) onu kendiliğinden başlatabilir.",
    ] },
    callout: "Pratik kural: aynı komut dizisini üçüncü kez yazıyorsanız bir betik yazın. Sistem yöneticileri, DevOps ve gömülü Linux mühendisleri bunu her gün yapar.",
  });
  s.addNotes("Gerçek örnekler: yedeklemeler, günlük dosyalarının döndürülmesi (log rotation), 30 laboratuvar bilgisayarına yazılım kurmak, bir donanım yazılımı (firmware) görüntüsü derlemek, bir cihazdan her dakika ölçüm verisi toplamak. Linux'un kendisi de açılırken birçok kabuk betiği çalıştırır. cron, bir betiği belirli saatlerde başlatabilen Linux zamanlayıcısıdır; yalnızca adını anıyoruz, sınav konusu değildir.");

  // 6 ── ./hello.sh yazınca ne olur
  s = d.content({ kicker: "Perde arkası", title: "./hello.sh Yazdığınızda Ne Olur?" });
  {
    const y = 1.85, bw = 2.45, bh = 1.05, gap = 0.55;
    const xs = [MX, MX + bw + gap, MX + 2 * (bw + gap), MX + 3 * (bw + gap)];
    d.box(s, xs[0], y, bw, bh, "Kabuğunuz (bash)", { sub: "komut satırını okur", fill: C.charcoal, size: 14 });
    d.box(s, xs[1], y, bw, bh, "fork()", { sub: "çocuk süreç oluşturur (3. ve 13. hafta)", fill: C.light, size: 15, font: F.code });
    d.box(s, xs[2], y, bw, bh, "exec(\"./hello.sh\")", { sub: "çekirdek x bitini denetler (11. hafta)", fill: C.light, size: 13, font: F.code });
    d.box(s, xs[3], y, bw, bh, "#!/bin/bash", { sub: "çekirdek ilk satırı okur", fill: C.mint, color: C.dark, size: 15, font: F.code });
    for (let i = 0; i < 3; i++) d.arrow(s, xs[i] + bw + 0.04, y + bh / 2, xs[i + 1] - 0.04, y + bh / 2, { color: C.mintDeep, w: 2 });
    d.arrow(s, xs[3] + bw / 2, y + bh + 0.05, xs[3] + bw / 2, y + 1.75, { color: C.mintDeep, w: 2 });
    d.box(s, xs[2], y + 1.8, 2 * bw + gap, 0.95, "/bin/bash ./hello.sh", { sub: "YENİ bir bash süreci dosyayı satır satır çalıştırır", fill: C.charcoal, size: 15, font: F.code });
    d.arrow(s, xs[2] - 0.04, y + 2.27, xs[0] + bw + 0.04, y + 2.27, { color: C.slate, w: 2 });
    d.text(s, "betik biter: çıkış durumu ebeveyn kabuğa döner ($?)", { x: xs[0] + bw + 0.12, y: y + 1.78, w: 3.3, h: 0.45, fontSize: 11.5, italic: true, color: C.mutedOnLight });
    d.box(s, xs[0], y + 1.8, bw, 0.95, "İstem geri gelir", { sub: "ebeveyn bekledi (wait())", fill: C.light, size: 14 });
  }
  d.card(s, MX, 4.85, 5.95, 2.0, { title: "Sonuçları", body: [
    "Betik bir çocuk süreçte çalışır: betiğin içindeki bir cd ya da değişken ataması terminalinizi değiştirmez.",
    "x izni yoksa → exec başarısız olur → \"Permission denied\".",
  ], bodySize: 13.5 });
  d.card(s, MX + 6.2, 4.85, 5.95, 2.0, { title: "Shebang satırı #!", body: [
    "Dosyanın en ilk satırı olmalıdır: #! + yorumlayıcının mutlak yolu.",
    "#!/bin/bash bash içindir; #!/usr/bin/python3 aynı yolla Python çalıştırırdı.",
  ], bodySize: 13.5 });
  s.addNotes("3. ve 13. haftalarla bağlantı kurun. Kabuk fork yapar; çocuk ./hello.sh üzerinde execve() çağırır. Metin dosyası makine kodu değildir; bu yüzden çekirdek ilk iki bayta bakar: '#!' şu demektir: 'bu satırda adı verilen programı başlat ve betiği ona argüman olarak ver'. Yani çekirdek aslında '/bin/bash ./hello.sh' komutunu başlatır. Ebeveyn kabuk çocuğu bekler (wait), sonra istemi yeniden yazar. Betik ayrı bir süreçte çalıştığı için betiğin içindeki 'cd /tmp' terminalinizi taşımaz — çok yaygın bir şaşkınlık. (Bir dosyayı GEÇERLİ kabukta çalıştırmak için 'source dosya' ya da '. dosya' kullanılır; yalnızca anıyoruz.)");

  // 7 ── hello.sh'nin anatomisi
  s = d.content({ kicker: "İlk betik", title: "hello.sh'nin Anatomisi" });
  script(s, MX, 1.65, 7.4, 2.35, code("hello.sh"), 14);
  [["1", "Shebang: bu dosyayı hangi program çalıştırır"], ["2", "Yorumlar: bash yok sayar, insanlar okur"], ["3", "Komutlar: tam olarak istemde yazacağınız gibi"]].forEach((t, i) => {
    numDot(s, MX + 7.65, 1.75 + i * 0.75, t[0]);
    d.text(s, t[1], { x: MX + 8.15, y: 1.72 + i * 0.75, w: 4.0, h: 0.45, fontSize: 13.5, valign: "middle" });
  });
  d.card(s, MX, 4.25, 12.15, 2.6, { title: "Bir metin düzenleyiciyle oluşturun", body: [
    { b: "nano hello.sh", t: " — satırları yazın, Ctrl+O ve Enter ile kaydedin, Ctrl+X ile çıkın. (Her düzenleyici olur: vim, gedit, VS Code.)" },
    { b: "$(whoami)", t: " komut yerine koymadır (command substitution): bash whoami komutunu çalıştırır ve çıktısını metnin içine yerleştirir (2. bölüm)." },
    { b: "Ad:", t: " .sh uzantısı yalnızca insanlar için bir alışkanlıktır; Linux uzantıya değil, x bitine ve shebang satırına bakarak karar verir (7. hafta: dosya türleri)." },
  ], bodySize: 14 });
  s.addNotes("Herkes nano'yu açsın ve hello.sh dosyasını kopyalamak yerine kendisi yazsın — sözdizimi yazarak yerleşir. # ile başlayan satırlar yorumdur; yalnızca en ilk satırdaki #! özeldir, o da sadece 1. satırda. Betiklerdeki yorumlar İngilizcedir; Linux belgelerinin dili de İngilizce olduğundan bu bilinçli bir tercih, kendi kopyalarınızda Türkçe yorum yazabilirsiniz. Linux'un uzantıyla ilgilenmediğini hatırlatın: .sh olmadan 'backup' adını taşıyan bir betik de aynı şekilde çalışır.");

  // 8 ── hello.sh'yi çalıştırmak (gerçek döküm)
  s = d.content({ kicker: "Canlı gösterim", title: "Çalıştırma: bash hello.sh ile ./hello.sh" });
  term(s, MX, 1.65, 7.6, 5.2, show(B.first, [1, 2, 3, 4, 5, 6, 7, 8]), 13);
  d.card(s, MX + 7.85, 1.65, 4.3, 5.2, { title: "Nelere dikkat edin", body: [
    { b: "bash hello.sh", t: " x izni olmadan da çalışır: bash dosyayı yalnızca okur." },
    { b: "./hello.sh", t: " x bitine ihtiyaç duyar: Permission denied, çıkış durumu 126." },
    { b: "chmod +x", t: " kullanıcı, grup ve diğerlerine x ekler (11. hafta): rw- → rwx." },
    { b: "hello.sh", t: " tek başına: bulunamaz, çünkü geçerli dizin $PATH içinde değildir. Bu yüzden ./" },
  ], bodySize: 13.5 });
  s.addNotes("Gerçek çıktı; ~/lab/scripts içinde student kullanıcısıyla yakalandı. Dosya, laboratuvar kullanıcısının varsayılan umask değeri 002 nedeniyle 664 kipinde (-rw-rw-r--) oluşturuldu (11. hafta). chmod +x sonrası kip 775'tir. 'hello.sh' neden başarısız? Kabuk komutları yalnızca $PATH içindeki dizinlerde arar (echo $PATH); geçerli dizin güvenlik nedeniyle bilerek bu listede yoktur, bu yüzden ./ (bu dizin) demeniz gerekir. Çıkış durumu 126 'bulundu ama çalıştırılamıyor', 127 ise 'komut bulunamadı' demektir. Türkçe yerel ayarlı (LANG=tr_TR.UTF-8) bir sistemde bu iletilerin bir kısmı Türkçe görünebilir; ders çıktıları LC_ALL=C.UTF-8 ile alınmıştır.");

  // 9 ── Betik çalıştırmanın yolları
  s = d.tableSlide({
    kicker: "Betik çalıştırma", title: "Bir Betiği Çalıştırmanın Dört Yolu",
    header: ["Komut", "Gerekenler", "Nerede çalışır", "Tipik kullanım"],
    rows: [
      ["bash hello.sh", "r izni", "yeni bir bash süreci", "hızlı deneme; x biti olmayan betik"],
      ["./hello.sh", "r + x, shebang satırı", "yeni süreç (yorumlayıcı #! satırından)", "kendi betiğinizi çalıştırmanın olağan yolu"],
      ["hello.sh", "r + x, dizin $PATH içinde", "yeni süreç", "kurulu araçlar, ör. ~/bin içinde"],
      ["source hello.sh  (ya da  . hello.sh)", "r izni", "GEÇERLİ kabuk", "değişken ayarlayan dosyalar, ör. ~/.bashrc"],
    ],
    colW: [3.3, 2.7, 3.2, 2.95], fontSize: 15.5,
    callout: "Bu derste ./script.sh kullanın. bash -n script.sh hiçbir şey çalıştırmadan sözdizimini denetler; bash -x script.sh her komutu çalışırken gösterir (3. bölüm).",
  });
  s.addNotes("Yalnızca son satır geçerli kabukta çalışır: 'source ~/.bashrc' ile yapılan değişikliklerin terminalinizde kalmasının nedeni budur; ./ ile başlatılan bir betik ise geçerli dizininizi ya da değişkenlerinizi değiştiremez. PATH değişkeni, iki nokta üst üste ile ayrılmış bir dizin listesidir; echo $PATH ile görebilirsiniz. Birçok kullanıcı ~/bin dizinini oluşturup betiklerini oraya koyar; Ubuntu'da ~/bin varsa ~/.profile onu PATH'e kendiliğinden ekler.");

  // ───────────────────────── BÖLÜM 2
  s = d.sectionSlide({ kicker: "Bölüm 2", title: "Değişkenler, Tırnaklar ve Girdi", subtitle: "Değer saklamak, metin oluşturmak, argümanları ve klavye girdisini okumak." });
  s.addNotes("Geçiş: her zaman tam olarak aynı şeyi yapan bir betik de yararlıdır, ama değişkenleri ve argümanları olan bir betik çok daha yararlıdır.");

  // 11 ── Değişkenler
  s = d.content({ kicker: "Değişkenler", title: "Değişkenler: ad=değer, Boşluk Yok!" });
  term(s, MX, 1.65, 6.9, 3.0, show(B.vars, [0, 1, 2, 3]), 14);
  d.card(s, MX + 7.15, 1.65, 5.0, 5.2, { title: "Kurallar", body: [
    { b: "Atama:", t: " ad=değer — = işaretinin çevresinde boşluk yok." },
    { b: "Kullanım:", t: " $ad ya da ${ad}; tanımsız bir değişken yalnızca boştur." },
    { b: "Adlar:", t: " harf, rakam, _; rakamla başlamaz; büyük/küçük harfe duyarlıdır (name ≠ NAME)." },
    { b: "Her şey metindir:", t: " count=5, \"5\" metnini saklar; aritmetik için $(( )) gerekir." },
    { b: "Gelenek:", t: " ortam değişkenleri BÜYÜK harfle (HOME, USER, PATH); kendi değişkenleriniz küçük harfle." },
  ], bodySize: 13.5 });
  d.callout(s, MX, 4.9, 6.9, 1.95, "name = Ayse şöyle okunur: name komutunu = ve Ayse argümanlarıyla çalıştır. Bu yüzden \"name: command not found\". Bash'te boşluk süs değildir — sözcükleri ayırır.", 14);
  s.addNotes("Gerçek çıktı. Bu hata iletisi, haftanın en sık yapılan yeni başlayan hatasıdır. Ubuntu'da ileti daha uzun olabilir ('Command 'name' not found, did you mean ...'), çünkü Ubuntu bir command-not-found yardımcısı kurar; anlamı aynıdır. Değişkenin hemen ardından harf geliyorsa ${name} gerekir: echo \"${name}s\" ile echo \"$names\" karşılaştırması. Ortam değişkenlerine örnek olarak echo $HOME, echo $USER, echo $PATH gösterin.");

  // 12 ── Komut yerine koyma ve aritmetik
  s = d.content({ kicker: "Değişkenler", title: "Komut Yerine Koyma $( ) ve Aritmetik $(( ))" });
  script(s, MX, 1.65, 7.6, 3.65, strip(code("variables.sh"), 2), 13);
  term(s, MX, 5.5, 7.6, 1.35, show(B.vars, ["./variables.sh"]), 12);
  d.card(s, MX + 7.85, 1.65, 4.3, 5.2, { title: "İki genişletme", body: [
    { b: "$(komut)", t: " → komutun çıktısıyla değiştirilir (sondaki satır sonu atılır). Eski biçim: `komut`." },
    { b: "$((ifade))", t: " → tamsayı aritmetiği: + − * / % ve ( ). İçeride adların önündeki $ isteğe bağlıdır." },
    { b: "Yalnızca tamsayı:", t: " 7 / 2 = 3, kalan 7 % 2 = 1. Ondalık için awk (report.sh) ya da bc kullanın." },
  ], bodySize: 13.5 });
  s.addNotes("Gerçek çıktı; 12 Ekim 2026'da çalıştırıldı. Sizin çıktınızdaki tarih farklı olacaktır. Betikte ders kodu olarak İngilizce şubenin kodu MCMP117 geçiyor; kendi kopyanızda MBLP131 yazabilirsiniz. wc -l < dosya kullanımına dikkat çekin: girdi yönlendirmesiyle (12. hafta) wc dosya adı olmadan yalnızca sayıyı yazar — $( ) içinde tam istediğimiz şey. $(( )) içinde $((15 - week)) ya da $((15 - $week)) yazabilirsiniz; ikisi de çalışır. Bash aritmetiği 64 bitlik tamsayı aritmetiğidir: 7/2 kesilerek 3 olur.");

  // 13 ── Tırnaklar
  s = d.content({ kicker: "Tırnaklar", title: "Çift Tırnak, Tek Tırnak, Tırnaksız" });
  script(s, MX, 1.65, 7.6, 2.95, strip(code("quotes.sh"), 2), 13);
  term(s, MX, 4.8, 7.6, 2.05, show(B.vars, ["./quotes.sh"]), 13);
  d.card(s, MX + 7.85, 1.65, 4.3, 5.2, { title: "Tırnaklar ne yapar?", body: [
    { b: "\"çift\":", t: " boşlukları korur; $değişken ve $( ) yine genişletilir. Neredeyse her zaman bunu kullanın." },
    { b: "'tek':", t: " her şey olduğu gibi kalır, hiçbir genişletme yok." },
    { b: "\\ (ters eğik çizgi):", t: " tek bir karakteri olduğu gibi bırakır: \\$, \\\"." },
    { b: "Tırnaksız:", t: " değer boşluklardan bölünür (ve * genişletilir). \"final report.txt\" iki argüman olur — iki hata." },
  ], bodySize: 13.5 });
  s.addNotes("Gerçek çıktı. Son satırdaki bilinçli hata, gerçek betiklerdeki en yaygın hatadır: içinde boşluklu bir dosya adı bulunan tırnaksız bir değişken. Yeni başlayanlar için kural: bir nedeniniz yoksa her $değişkenin ve her $( ) ifadesinin çevresine çift tırnak koyun. '# shellcheck disable' satırları ShellCheck (shellcheck.net) adlı ücretsiz bir denetim aracı içindir; araç tam da bu sorunlar için uyarır, bu iki satır ise ona hataların bilerek yapıldığını söyler.");

  // 14 ── Konumsal parametreler
  s = d.content({ kicker: "Argümanlar", title: "Konumsal Parametreler: $0, $1 … $9, $#, $@" });
  script(s, MX, 1.65, 6.2, 3.1, strip(code("args.sh"), 2), 13);
  term(s, MX, 4.95, 6.2, 1.9, show(B.args, [0]), 12);
  {
    const rows = [["$0", "betiğin, yazıldığı biçimdeki adı"], ["$1 … $9", "1. … 9. argüman (10. için ${10})"], ["$#", "argüman sayısı"], ["\"$@\"", "tüm argümanlar, her biri ayrı bir sözcük"], ["$?", "son komutun çıkış durumu (3. bölüm)"], ["$$", "bu kabuğun PID'si (13. hafta)"]];
    const hdr = ["Değişken", "Anlamı"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 14 } }));
    const body = rows.map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: j === 0 ? F.code : F.body, fontSize: 13.5 } })));
    s.addTable([hdr, ...body], { x: MX + 6.45, y: 1.65, w: 5.7, colW: [1.45, 4.25], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [5, 8, 5, 8], valign: "middle" });
  }
  d.callout(s, MX + 6.45, 5.75, 5.7, 1.1, "Kabuk, betik başlamadan önce komut satırını sözcüklere ayırır: tırnaklar sayesinde \"green tea\" TEK argümandır.", 13.5);
  s.addNotes("./args.sh apple \"green tea\" 42 komutunun gerçek çıktısı. Çalıştırmadan önce sınıftan $# değerini tahmin etmesini isteyin (yanıt 4 değil, 3). Argüman yoksa $1 boştur ve $# 0'dır — gerçek betiklerin önce $# değerini denetlemesinin nedeni budur (biraz sonra check.sh). Çift tırnak içindeki \"$@\" her argümanı bozmadan korur; $* ise hepsini tek bir dizgide birleştirir. Yazdırırken ikisi aynı görünür; döngülerde her zaman \"$@\" kullanın.");

  // 15 ── read
  s = d.content({ kicker: "Girdi", title: "read ile Klavyeden Girdi Okuma" });
  script(s, MX, 1.65, 7.6, 1.7, strip(code("greet.sh"), 2), 13.5);
  term(s, MX, 3.55, 7.6, 1.3, show(B.args, ["./greet.sh"]), 13.5);
  d.card(s, MX + 7.85, 1.65, 4.3, 3.2, { title: "Tek satırda read", body: [
    { b: "read -r var", t: " bir satır bekler ve onu var içinde saklar." },
    { b: "-p \"metin\"", t: " önce bir istem gösterir." },
    { b: "-r", t: " ters eğik çizgileri yazıldığı gibi tutar (her zaman kullanın)." },
  ], bodySize: 13.5 });
  d.callout(s, MX, 5.1, 12.15, 1.75, "Argümanlar ($1) mı, read mi? Otomasyon için argümanlar daha iyidir: ./grade.sh 72, klavye başında kimse yokken başka bir betikten ya da cron'dan çalışabilir. read ise etkileşimli araçlar içindir, ör. bir menü ya da oyun (Lab alıştırması 14).", 14.5);
  s.addNotes("Gerçek oturum: kullanıcı Ayse ve 2006 yazdı (terminal yazdıklarınızı ekrana yansıttığı için dökümde görünüyor). Yaş, $(( )) ile geçerli yıl eksi doğum yılı olarak hesaplanır; bu yüzden 'yaklaşık' yaştır. Birden çok değişken adıyla read satırı boşluklardan böler: read -r first last. 14. alıştırmada bir tahmin oyunu için read'i bir while döngüsünün içinde kullanıyoruz.");

  // 16 ── Özet tablo 1
  s = d.tableSlide({
    kicker: "Özet tablo", title: "Şimdiye Kadarki Sözdizimi",
    header: ["Siz yazarsınız", "Bash şunu yapar", "Örnek (gerçek çıktı)"],
    rows: [
      ["#!/bin/bash", "ilk satır: yorumlayıcıyı seçer", "./hello.sh, /bin/bash ile çalışır"],
      ["name=value", "atama (boşluk yok!)", "week=14"],
      ["\"$name\"   '$name'", "genişletir  /  olduğu gibi bırakır", "Hello Ayse  /  Hello $name"],
      ["$(command)", "bir komutun çıktısını yerleştirir", "$(date +%Y-%m-%d) → 2026-10-12"],
      ["$((expression))", "tamsayı aritmetiği", "$((3 + 4 * 2)) → 11"],
      ["$1  $#  \"$@\"", "argümanlar, sayıları, hepsi", "./args.sh a b → $# = 2"],
      ["read -r -p \"? \" x", "klavyeden bir satır okur", "x=Ayse"],
    ],
    colW: [3.4, 4.2, 4.55], fontSize: 16,
  });
  s.addNotes("Burada durun ve öğrencilerin bu tabloyu not almasına izin verin. $((3 + 4 * 2)) ifadesinin sonucu 14 değil 11'dir: matematikteki gibi önce çarpma yapılır (ders notlarındaki gerçek dökümde görülür).");

  // 17 ── Mola
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Mola", subtitle: "Sırada: kararlar, döngüler, fonksiyonlar — ve iki gerçek otomasyon betiği." });
  s.addNotes("On dakika. Mola sırasında hello.sh, variables.sh ve args.sh betiklerinin her öğrencinin makinesinde (laboratuvar bilgisayarı, WSL ya da sanal makine) çalıştığından emin olun.");

  // ───────────────────────── BÖLÜM 3
  s = d.sectionSlide({ kicker: "Bölüm 3", title: "Karar Verme", subtitle: "Her komut bir evet/hayır sorusunu yanıtlar: çıkış durumu." });
  s.addNotes("Geçiş: karar verebilmek için bir betiğin bir koşula ihtiyacı vardır. Bash'te koşullar komutlardır ve yanıt çıkış durumudur.");

  // 19 ── Çıkış durumu
  s = d.content({ kicker: "Çıkış durumu", title: "Her Komut Bir Çıkış Durumu Döndürür: $?" });
  term(s, MX, 1.65, 7.2, 5.2, show(B.status, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 13);
  {
    const rows = [["0", "başarı (\"doğru\")"], ["1", "genel hata / \"yanlış\""], ["2", "yanlış kullanım (ls, grep: hata)"], ["126", "bulundu ama çalıştırılamıyor"], ["127", "komut bulunamadı"]];
    const hdr = ["$?", "Anlamı"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 14 } }));
    const body = rows.map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: j === 0 ? F.code : F.body, fontSize: 13.5 } })));
    s.addTable([hdr, ...body], { x: MX + 7.45, y: 1.65, w: 4.7, colW: [0.9, 3.8], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [5, 8, 5, 8], valign: "middle" });
  }
  d.callout(s, MX + 7.45, 4.75, 4.7, 2.1, "0 başarı demektir — 0'ın yanlış olduğu C'nin tam tersi! Bir program bunu exit(n) ya da main'den return n ile ayarlar (3. hafta); bir betik exit n ile. Aralık 0–255.", 13.5);
  s.addNotes("Gerçek çıktı. $? her zaman SON komutu gösterir; bu yüzden hemen yazdırın, çünkü echo'nun kendisi $? değerini yeniden 0 yapar. grep -q hiçbir şey yazdırmaz, yalnızca çıkış durumuyla yanıt verir: 0 = bulundu, 1 = bulunamadı (2, örneğin olmayan bir dosya gibi bir hata olurdu). grep'in if deyimlerinde bu kadar yararlı olmasının nedeni budur. Çıkış durumu, ebeveyn sürecin wait() ile topladığı değerdir — 3. ve 13. haftalar.");

  // 20 ── test ve [ ]
  s = d.content({ kicker: "Koşullar", title: "test ve [ ]: Karşılaştırma Yapan Bir Komut" });
  term(s, MX, 1.65, 6.1, 2.05, show(B.status, [10, 11, 12, 13, 14]), 13);
  d.card(s, MX, 3.95, 6.1, 2.9, { title: "[ bir komuttur: boşluklar önemli", body: [
    "[ 5 -gt 3 ], test 5 -gt 3 ile aynıdır. Son argüman ] olmalıdır.",
    "Her parça ayrı bir sözcüktür: [ \"$n\" -gt 3 ]. Boşluk olmazsa [$n bir komut adına dönüşür: \"[5: command not found\".",
    "[ ] içinde değişkenleri tırnaklayın: boş bir $x kaybolur ve testi bozar.",
  ], bodySize: 13 });
  {
    const rows = [
      ["Sayılar", "-eq -ne -lt -le -gt -ge", "[ \"$n\" -ge 50 ]"],
      ["Dizgiler", "= != -z(boş) -n(dolu)", "[ \"$ans\" = yes ]"],
      ["Dosyalar", "-e var -f dosya -d dizin", "[ -d ~/lab/backup ]"],
      ["", "-r -w -x (r/w/x izni)", "[ -x backup.sh ]"],
      ["Mantık", "! (değil)   &&  ||", "[ -f a ] && [ -f b ]"],
    ];
    const hdr = ["Tür", "İşleçler", "Örnek"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 13.5 } }));
    const body = rows.map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: [0, 2, 4].includes(i) ? C.light : (i === 3 ? C.light : C.white) }, bold: j === 0, fontFace: j === 0 ? F.body : F.code, fontSize: j === 0 ? 12.5 : 11.5 } })));
    s.addTable([hdr, ...body], { x: MX + 6.35, y: 1.65, w: 5.8, colW: [0.9, 2.6, 2.3], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [5, 6, 5, 6], valign: "middle" });
  }
  d.callout(s, MX + 6.35, 5.35, 5.8, 1.5, "Sayılar: -lt, -gt … (harfler!).  Dizgiler: = ve !=.  [ ] içinde < ve > karşılaştırma değil, yönlendirmedir (12. hafta).", 13.5);
  s.addNotes("Gerçek çıktı: 'type [' komutu, [ işaretinin kabuğa gömülü (builtin) bir komut olduğunu gösterir (diğer kabuklar için bir /usr/bin/[ programı da vardır). Bu, tüm boşluk kurallarını açıklar: '[', '5', '-gt', '3', ']' beş ayrı argümandır. Bash'te ayrıca [[ ... ]] vardır; daha hoşgörülü bir anahtar sözcüktür (sözcük bölme yapmaz, dizgiler için < > ve örüntü eşleme destekler); bu derste taşınabilir [ ] kullanıyoruz. -eq sayıları karşılaştırır: [ 05 -eq 5 ] doğrudur; = metni karşılaştırır: [ 05 = 5 ] yanlıştır.");

  // 21 ── if/elif/else + check.sh
  s = d.content({ kicker: "if / elif / else", title: "if: Komutları Yalnızca Test Başarılıysa Çalıştırmak" });
  script(s, MX, 1.65, 7.3, 5.2, strip(code("check.sh"), 2), 13);
  d.card(s, MX + 7.55, 1.65, 4.6, 2.75, { title: "Yapı", body: [
    "if TEST; then … elif TEST; then … else … fi",
    "TEST herhangi bir komut olabilir: [ ], grep -q, mkdir …",
    "fi (tersten if) bloğu bitirir. Gövdeyi 4 boşluk içeri alın.",
  ], bodySize: 13.5 });
  d.card(s, MX + 7.55, 4.6, 4.6, 2.25, { title: "Buradaki iyi alışkanlıklar", body: [
    "Önce $# denetlenir; bir Usage satırı basılır.",
    "Hatalar stderr'e gider: >&2 (12. hafta).",
    "Ayrı çıkış kodları: 0 tamam, 1 hata, 2 kullanım.",
  ], bodySize: 13.5 });
  s.addNotes("check.sh'yi yukarıdan aşağıya okuyun. then'den önceki noktalı virgül gereklidir, çünkü then yeni bir komut başlatmalıdır; then'i bir sonraki satıra yazmak da olur. Çift tırnaklı bir dizgi içindeki $( ) içinde yer alan wc -l < \"$path\" ifadesine dikkat edin — tırnaklar $( ) içinde doğru biçimde iç içe geçer. Gerçek çalıştırmalar bir sonraki slaytta.");

  // 22 ── check.sh gösterimi
  s = d.content({ kicker: "Canlı gösterim", title: "check.sh: Dört Tür Yol, Üç Çıkış Kodu" });
  term(s, MX, 1.65, 7.6, 5.2, show(B.status, [15, 16, 17, 18, 19, 20, 21]), 14);
  d.card(s, MX + 7.85, 1.65, 4.3, 5.2, { title: "Nelere dikkat edin", body: [
    "syllabus.txt: -f doğrudur, bu yüzden ilk dal çalışır.",
    "../logs: -f yanlış, -d doğru: elif dalı.",
    "/dev/null: vardır (-e), ama bir aygıt dosyasıdır (9. hafta: /dev); bu yüzden zincir üçüncü dala ulaşır.",
    "Olmayan dosya: exit 1. Argüman yok: Usage ve exit 2.",
  ], bodySize: 13.5 });
  s.addNotes("Gerçek çıktı. Hata iletileri >&2 ile standart hataya (stderr) yazılır: çıktıyı yönlendirseniz bile, ./check.sh nothing.txt > out.txt, hata yine ekranda görünür ve out.txt boş kalır. Sorun: ./check.sh ../logs hangi çıkış durumunu döndürür? (0, sondaki 'exit 0' satırından.)");

  // 23 ── grade.sh
  s = d.content({ kicker: "Sayısal testler", title: "grade.sh: Sayılarla if / elif / else" });
  script(s, MX, 1.65, 6.5, 5.2, strip(code("grade.sh"), 3), 12.5);
  term(s, MX + 6.7, 1.65, 5.45, 3.3, show(B.grade, [0, 1, 2, 3, 4]), 12.5);
  d.card(s, MX + 6.7, 5.1, 5.45, 1.75, { title: "Bir merdiven gibi okuyun", body: [
    "bash testleri yukarıdan aşağıya dener ve yalnızca testi doğru olan İLK dalı çalıştırır.",
    "|| = veya: ikinci test yalnızca ilki yanlışsa çalışır.",
  ], bodySize: 13 });
  s.addNotes("Gerçek çıktı. Ölçek (85'ten itibaren A, 70'ten itibaren B, 50'den itibaren C) yalnızca bir örnektir, üniversitenin resmî not ölçeği değildir. elif testlerinin sırası önemlidir: önce -ge 50 testini yapsaydık 92 bir C alırdı. Bir sonraki slaytta bash -x bunu bizim için izlemeden önce, öğrencilerden 72 değerini elle izlemelerini isteyin.");

  // 24 ── Hata ayıklama
  s = d.content({ kicker: "Hata ayıklama", title: "Hata Ayıklama: bash -n, bash -x ve Hatalı Girdi" });
  term(s, MX, 1.65, 6.0, 3.25, show(B.grade, ["bash -x grade.sh 72"]), 13);
  term(s, MX + 6.25, 1.65, 5.9, 3.25, show(B.grade, ["./grade.sh abc"]).replace(/\.\/grade\.sh: line/g, "./grade.sh: line"), 13);
  d.card(s, MX, 5.1, 12.15, 1.75, { title: "Üç araç", body: [
    { b: "bash -n script.sh:", t: " yalnızca sözdizimi denetimi; hiçbir şey çalışmaz.    " },
    { b: "bash -x script.sh:", t: " her komutu çalıştırmadan önce (+ işaretiyle ve değerler yerine konmuş olarak) yazdırır. Betik içinde: izlemek istediğiniz kısmı set -x … set +x arasına alın." },
    { b: "Girdiyi doğrulayın:", t: " grade.sh abc hatalar basar ama yine de grade F der — bir hata (bug). Önce girdiyi denetleyin (lab alıştırması fikri)." },
  ], bodySize: 12.5 });
  s.addNotes("Gerçek çıktı. -x ile + ile başlayan satırlar komutu genişletmeden SONRAKİ hâliyle gösterir: $score değerinin 72 olduğunu ve hangi testlerin çalıştığını görürsünüz — -ge 85 testi başarısız oldu, -ge 70 testi başarılı oldu, ardından letter=B. Sağda 'abc' bir tamsayı değildir: her sayısal test 'integer expression expected' yazar ve yanlış sayılır; bu yüzden betik else dalına düşer ve grade F yazar. 9. satır iki kez görünür, çünkü || ile bağlanan iki test de denenir. Sorun: bunu nasıl düzeltirsiniz? (ör. testlerden önce grep -qx '[0-9]*' ile ya da bir case örüntüsüyle denetleyerek.)");

  // ───────────────────────── BÖLÜM 4
  s = d.sectionSlide({ kicker: "Bölüm 4", title: "Döngüler ve Fonksiyonlar", subtitle: "Her öğe için ya da bir koşul sürdükçe bir şey yapmak." });
  s.addNotes("Geçiş: kararlar bir betiğin seçim yapmasını sağlar; döngüler ise tekrarlamasını — otomasyonun asıl gücü budur.");

  // 26 ── for döngüleri
  s = d.content({ kicker: "for döngüleri", title: "for: Listedeki Her Öğe İçin Bir Kez" });
  script(s, MX, 1.65, 7.0, 5.2, strip(code("loops.sh"), 2), 13);
  term(s, MX + 7.25, 1.65, 4.9, 2.75, show(B.loops, ["./loops.sh"]).replace("1 squared is 1; 2 squared is 4; 3 squared is 9; 4 squared is 16; 5 squared is 25; ", "1 squared is 1; 2 squared is 4; ..."), 12);
  d.card(s, MX + 7.25, 4.6, 4.9, 2.25, { title: "for x in LİSTE; do … done", body: [
    { b: "Sözcük listesi:", t: " tek tek yazılır ya da \"$@\"." },
    { b: "{1..5}:", t: " küme parantezi genişletmesi → 1 2 3 4 5 (10. hafta)." },
    { b: "*.txt:", t: " kabuk joker karakteri eşleşen dosya adlarına genişletir — \"$f\" yazarsanız boşluklu adlarda bile güvenlidir." },
    { b: "Ayrıca:", t: " liste olarak $(komut), ör. for u in $(cut -d, -f3 file)." },
  ], bodySize: 12.5 });
  s.addNotes("Gerçek çıktı; uzun kareler satırı slaytta '...' ile kısaltıldı (5 squared is 25'e kadar sürer). Çıktıda 'final report.txt: 2 lines' görünüyor — döngü değişkeni her yerde tırnaklı olduğu için boşluklu dosya adı tek parça kaldı. '1 lines' çıktısına da dikkat edin: betik tam olarak ona söyleneni yazar; '1 line' demesi için bir if gerekirdi. Küme parantezi genişletmesi {1..5} değişken kullanamaz ({1..$n} çalışmaz); bunun için $(seq 1 \"$n\") ya da bir while döngüsü kullanın.");

  // 27 ── while döngüleri
  s = d.content({ kicker: "while döngüleri", title: "while: Test Başarılı Olduğu Sürece Tekrarla" });
  script(s, MX, 1.65, 7.6, 3.6, strip(code("while.sh"), 2), 13);
  term(s, MX, 5.45, 7.6, 1.4, show(B.loops, ["./while.sh"]), 11.5);
  d.card(s, MX + 7.85, 1.65, 4.3, 5.2, { title: "İki klasik kalıp", body: [
    { b: "Sayaç:", t: " değişkeni döngünün içinde değiştirin — n=$((n - 1)) satırını unutursanız döngü hiç bitmez (Ctrl+C, 13. hafta)." },
    { b: "Dosya okuma:", t: " while read -r line; do … done < file her turda bir satır okur; dosya sonunda read başarısız olur ve döngü durur." },
    { b: "Sağlama:", t: " 11325 / 20 = 566,25; bash 566 yazar." },
  ], bodySize: 13.5 });
  s.addNotes("Gerçek çıktı. done'dan sonraki '< file', döngünün TAMAMININ girdisini yönlendirir; bu yüzden her read bir sonraki satırı alır. 11325 toplamı ve 566,25 ortalaması kısa bir Python betiğiyle denetlendi; bash 566'ya keser. Testi hiçbir zaman yanlış olmayan bir while döngüsü sonsuz döngüdür — Ctrl+C (SIGINT, 13. hafta) ile durdurun. Ayrıca 'until TEST; do ... done' vardır; test BAŞARISIZ olduğu sürece döner.");

  // 28 ── fonksiyonlar
  s = d.content({ kicker: "Fonksiyonlar", title: "Fonksiyonlar: Bir Komut Bloğuna Ad Vermek" });
  script(s, MX, 1.65, 6.75, 5.2, strip(code("functions.sh"), 2), 12.5);
  term(s, MX + 7.0, 1.65, 5.15, 2.2, show(B.loops, ["./functions.sh"]).replace(/-{36}/g, "--------------------------"), 11.5);
  d.card(s, MX + 7.0, 4.05, 5.15, 2.8, { title: "Nasıl çalışırlar?", body: [
    "Kullanmadan önce tanımlayın: ad() { … }",
    "Bir komut gibi çağırın: count_word WARN file. İçeride $1 $2 fonksiyonun kendi argümanlarıdır.",
    "local bir değişkeni fonksiyona özel tutar. Son komutun çıkış durumu fonksiyonun yanıtıdır.",
  ], bodySize: 13 });
  s.addNotes("Gerçek çıktı (kesikli çizgi slaytta kısaltıldı). is_even güzel bir fikri gösteriyor: fonksiyonun çıkış durumu sonucun kendisidir, bu yüzden doğrudan if içinde kullanılabilir. Bir fonksiyon 'return' ile metin döndüremez (return yalnızca 0-255 arası çıkış durumunu ayarlar); metin döndürmek için onu echo ile yazdırın ve $( ) ile yakalayın. Neden 'local n' ayrı bir satırda ve ardından n=$(...)? 'local n=$(grep ...)' yazmak grep'in çıkış durumunu gizlerdi — ShellCheck bu konuda uyarır.");

  // 29 ── Sözdizimi başvuru tablosu
  s = d.tableSlide({
    kicker: "Özet tablo", title: "Bir Bakışta Denetim Yapıları",
    header: ["Yapı", "Sözdizimi (tek satır)", "Bitiş"],
    rows: [
      ["if", "if [ \"$n\" -gt 0 ]; then …; elif …; then …; else …; fi", "fi"],
      ["for (liste)", "for f in *.txt; do echo \"$f\"; done", "done"],
      ["for (aralık)", "for i in {1..5}; do echo \"$i\"; done", "done"],
      ["while", "while [ \"$n\" -gt 0 ]; do n=$((n - 1)); done", "done"],
      ["dosya okuma", "while read -r line; do …; done < file.txt", "done"],
      ["fonksiyon", "name() { local x=$1; echo \"$x\"; }", "}"],
      ["ve / veya", "mkdir -p dir && echo ok;   [ -f f ] || exit 1", "—"],
    ],
    colW: [2.1, 8.2, 1.85], fontSize: 16.5,
  });
  s.addNotes("Başvuru slaytı; ders notlarında tüm test işleçlerini de içeren daha kapsamlı bir sürüm var. && ikinci komutu yalnızca ilki başarılı olursa, || yalnızca ilki başarısız olursa çalıştırır. Bu iki işleç çoğu zaman kısa if deyimleri olarak kullanılır: [ -d \"$dir\" ] || mkdir \"$dir\".");

  // ───────────────────────── BÖLÜM 5
  s = d.sectionSlide({ kicker: "Bölüm 5", title: "İki Gerçek Otomasyon Betiği", subtitle: "~/lab/scripts içinde backup.sh ve report.sh" });
  s.addNotes("Geçiş: şimdi her şeyi — değişkenleri, $( ), testleri, if'i, 12. haftanın boru hatlarını — gerçekten kullanabileceğiniz iki betikte birleştiriyoruz.");

  // 31 ── backup.sh kodu
  s = d.content({ kicker: "Otomasyon 1", title: "backup.sh: docs/ Klasörünün Zaman Damgalı Arşivi" });
  script(s, MX, 1.65, 7.9, 5.2, strip(code("backup.sh"), 3), 12.5);
  d.card(s, MX + 8.15, 1.65, 4.0, 5.2, { title: "Satır satır", body: [
    { b: "date +%Y%m%d_%H%M%S", t: " benzersiz ve sıralanabilir bir ad verir." },
    { b: "[ ! -d … ]:", t: " kaynak yoksa erkenden durur." },
    { b: "tar -czf A -C dir docs:", t: " gzip ile sıkıştırılmış (z) bir arşiv dosyası (f) oluşturur (c); -C = önce ~/lab'a geç, böylece yollar docs/ ile başlar." },
    { b: "if tar …:", t: " tar'ın kendi çıkış durumunu test eder." },
  ], bodySize: 13 });
  s.addNotes("backup.sh'yi adım adım anlatın. Tırnak içinde ~ yerine $HOME: ~ çift tırnak içinde genişletilMEZ, $HOME genişletilir. mkdir -p dizini gerekirse oluşturur, zaten varsa sessiz kalır. tar -tzf bir arşivi listeler (t); grep -vc '/$' / ile bitmeyen satırları (klasörleri değil dosyaları) sayar. du -h | cut -f1 yalnızca boyut sütununu tutar (12. hafta).");

  // 32 ── backup.sh çalıştırma
  s = d.content({ kicker: "Canlı gösterim", title: "backup.sh İş Başında" });
  term(s, MX, 1.65, 7.6, 5.2, show(B.backup, [0, 1, 2, 4, 5]), 13);
  d.card(s, MX + 7.85, 1.65, 4.3, 5.2, { title: "Nelere dikkat edin", body: [
    "Her çalıştırma yeni bir dosya oluşturur: zaman damgası adın parçasıdır, hiçbir şeyin üzerine yazılmaz.",
    "Files: 7 — altı görünür belge ve gizli .settings (tar gizli dosyaları da alır).",
    "\"final report.txt\" doğru arşivlenir: betik her değişkeni tırnaklar.",
    "Tarih yıl önce yazıldığı için adlar zamana göre sıralanır.",
  ], bodySize: 13.5 });
  s.addNotes("Gerçek çıktı; sizin zaman damgalarınız farklı olacaktır (ikinci çalıştırma, gösterilmeyen sleep 2 nedeniyle 2 saniye sonradır). Hiçbir şeyin üzerine yazmadan içine bakmak için geri yükleme: tar -xzf ../backup/docs_<damga>.tar.gz -C /tmp. 13. lab alıştırması bu betiği yalnızca en yeni 3 arşivi tutacak biçimde genişletir. Ek bilgi: cron ile '0 18 * * * $HOME/lab/scripts/backup.sh' satırı betiği her gün 18.00'de çalıştırırdı.");

  // 33 ── report.sh kodu
  s = d.content({ kicker: "Otomasyon 2", title: "report.sh: Bir Günlük Dosyasını ve CSV'yi Özetlemek" });
  script(s, MX, 1.65, 12.15, 5.2, strip(code("report.sh"), 2), 12);
  s.addNotes("report.sh, 12. haftanın boru hatlarını yeniden kullanır: awk bir alanı yazdırır, sort | uniq -c | sort -rn sayar ve sıralar, tail -n +2 CSV'nin başlık satırını atlar, cut -d, -f3 bölümü alır. Yeni olan kısım awk'ın ondalık aritmetik yapmasıdır: m += $4 vize sütununu toplar, END sonda bir kez çalışır ve printf %.1f tek ondalık basamak yazar. Bir awk örüntüsü olarak kullanılan 0.4*$4 + 0.6*$5 >= 50 yalnızca geçen satırları yazdırır; wc -l bunları sayar. 40/60 ağırlıklandırması yalnızca bir örnektir.");

  // 34 ── report.sh çıktısı
  s = d.content({ kicker: "Canlı gösterim", title: "report.sh: Gerçek Çıktı, Sağlanmış" });
  term(s, MX, 1.65, 7.3, 5.2, show(B.report, [0]), 13);
  d.card(s, MX + 7.55, 1.65, 4.6, 5.2, { title: "Sayılar doğrulandı (Python)", body: [
    { b: "Hatalar:", t: " 300 isteğin 98'inin durum kodu ≥ 400; 100·98/300 = 32,67, bash tamsayı aritmetiği 32 yazar." },
    { b: "Eşitlik:", t: " /index.html ve /images/logo.png 33'er istek aldı; sırayı sort belirler." },
    { b: "Bölümler:", t: " 17 + 11 + 10 + 2 = 40." },
    { b: "Ortalamalar:", t: " vize 66,95 → 67.0 yazılır; final 65,6." },
    { b: "Geçenler:", t: " 40 öğrencinin 35'i için 0,4m + 0,6f ≥ 50." },
  ], bodySize: 13 });
  s.addNotes("Gerçek çıktı; tarih satırı sizde farklı olacaktır. Her sayı aynı dosyalardan Python ile bağımsız olarak yeniden hesaplandı. İki tür aritmetiğe dikkat çekin: tamsayı yüzdesi için bash $(( )), ondalıklı ortalamalar için awk. Bu, bir teknisyenin her sabah bir sunucu günlüğü üzerinde çalıştırabileceği türden bir betiktir.");

  // 35 ── Sık yapılan hatalar 1
  s = d.content({ kicker: "Sık yapılan hatalar", title: "Yapacağınız Hatalar (Herkes Yapar)" });
  {
    const w = 3.9, g = 0.225;
    const items = [
      { t: "= çevresinde boşluk", b: show(B.errors, ["cat bad_space.sh", "./bad_space.sh"]).split("\n").slice(2).join("\n"), fix: "Düzeltme: name=\"Ayse\"" },
      { t: "[ ] içinde boşluk yok", b: show(B.errors, ["cat bad_test.sh", "./bad_test.sh"]).split("\n").slice(2).join("\n"), fix: "Düzeltme: if [ \"$n\" -gt 3 ]; then" },
      { t: "Eksik tırnaklar", b: show(B.errors, ["cat bad_quotes.sh", "./bad_quotes.sh"]).split("\n").slice(2).join("\n"), fix: "Düzeltme: [ \"$answer\" = yes ]" },
    ];
    items.forEach((it, i) => {
      const x = MX + i * (w + g);
      label(s, it.t, x, 1.65, w, C.red);
      const txt = it.b.replace(PROMPT, "$ ");
      box(s, x, 2.05, w, 2.75);
      const lines = txt.split("\n");
      const runs = lines.map((ln, k) => ({ text: ln || " ", options: { color: ln.startsWith("$ ") ? C.mint : (ln.includes(": line") ? "F2A49A" : C.light), breakLine: k < lines.length - 1 } }));
      d.text(s, runs, { x: x + 0.15, y: 2.18, w: w - 0.3, h: 2.55, fontFace: F.code, fontSize: 11.5 });
      d.box(s, x, 5.0, w, 0.65, it.fix, { fill: PALE, color: C.dark, size: 12, font: F.code, bold: false });
    });
  }
  d.text(s, "Hata iletisini okuyun: betiğin adını, satır numarasını ve bash'in anlayamadığı sözcüğü söyler.", { x: MX, y: 5.95, w: 12.15, h: 0.8, fontSize: 16, italic: true, color: C.mutedOnLight });
  s.addNotes("Bilerek bozulmuş beş betiğin gerçek çıktısı (code/demo_errors.sh ile oluşturuldu). (1) name = \"Ayse\" name adlı bir komut çalıştırır; ardından $name boştur, bu yüzden betik 'Hello ' yazar — betik hatada DURMADI, devam etti. (2) [$n tek bir sözcük olan [5'e dönüşür; bu bir komut değildir. (3) Boş ve tırnaksız bir $answer ile test [ = yes ] hâline gelir; sol tarafı yoktur: 'unary operator expected'. Tırnaklarla [ \"\" = yes ] olur ve yalnızca yanlıştır.");

  // 36 ── Sık yapılan hatalar 2
  s = d.content({ kicker: "Sık yapılan hatalar", title: "Windows Satır Sonları, Eksik fi, Eksik chmod" });
  term(s, MX, 1.65, 7.9, 3.75, show(B.errors, ["./win.sh", "bash win.sh", "cat -A win.sh", "sed -i 's/\\r$//' win.sh"]).concat("\n" + show(B.errors, [B.errors.length - 1])), 12.5);
  term(s, MX, 5.6, 7.9, 1.25, show(B.errors, ["bash -n bad_if.sh"]), 12.5);
  d.card(s, MX + 8.15, 1.65, 4.0, 5.2, { title: "CRLF: görünmez hata", body: [
    "Windows düzenleyicileri satırları \\r\\n ile bitirir; Linux \\n bekler. \\r (^M olarak görünür) sözcüklere yapışır: çekirdek \"/bin/bash\\r\" adlı bir yorumlayıcı arar.",
    "Yeni bash: \"cannot execute: required file not found\"; eski bash (ör. Ubuntu 22.04): \"/bin/bash^M: bad interpreter\".",
    "Düzeltme: sed -i 's/\\r$//' file ya da dos2unix file; VS Code'da LF seçin.",
    "chmod +x unutulursa → Permission denied (slayt 8).",
  ], bodySize: 12 });
  s.addNotes("bash 5.2'den gerçek çıktı. 'bad interpreter: No such file or directory' iletisi bash 5.1 ve öncesinin (Ubuntu 22.04, eski kurulumlardaki Git Bash) yazdığı iletidir; ikisi de aynı anlama gelir. 'file win.sh' komutu 'with CRLF line terminators' der — hızlı bir tanı. bash -n eksik fi'yi hiçbir şey çalıştırmadan bulur: 'unexpected end of file', bir bloğun (if, for, while, tırnak) açılıp hiç kapatılmadığı anlamına gelir. Betiklerini Windows'ta yazıp Linux'a kopyalayan öğrenciler bu sorunla MUTLAKA karşılaşacaktır.");

  // 37 ── Sınıf içi lab
  s = d.content({ kicker: "Lab · notlu", title: "Sınıf İçi Lab: Dört Betik Yazın (35 Dakika)" });
  [
    ["1", "power.sh N", "N, N² ve N³ değerlerini yazdırın. Argüman yoksa: bir Usage satırı ve exit 2.", "Alış. 2"],
    ["2", "what.sh YOL…", "Her argüman için dosya (satır sayısıyla), dizin ya da yok yazın; biri yoksa exit 1.", "Alış. 6"],
    ["3", "levels.sh", "~/lab/logs/system.log içindeki INFO, WARN ve ERROR satırlarını bir for döngüsü ve grep -c ile sayın.", "Alış. 11"],
    ["4", "backup_keep.sh", "Zorlu: backup.sh'yi yalnızca en yeni 3 arşiv kalacak biçimde genişletin.", "Alış. 13"],
  ].forEach((a, i) => {
    const y = 1.65 + i * 0.98;
    d.box(s, MX, y, 0.8, 0.82, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 0.95, y, w: 11.2, h: 0.82, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, a[1], { x: MX + 1.15, y, w: 2.65, h: 0.82, fontFace: F.code, fontSize: 15, bold: true, color: C.charcoal, valign: "middle" });
    d.text(s, a[2], { x: MX + 3.85, y, w: 7.1, h: 0.82, fontSize: 14, valign: "middle" });
    d.text(s, a[3], { x: MX + 10.95, y, w: 1.05, h: 0.82, fontSize: 12.5, italic: true, color: C.mutedOnLight, valign: "middle", align: "right" });
  });
  d.callout(s, MX, 5.7, 12.15, 1.15, "Notlandırma: hatasız çalışma (%40), doğru çıktı (%30), hatalı girdiyi ele alma (%15), yorumlar + tırnaklar + shebang (%15). Her betiği önce bash -n ile deneyin. Dört .sh dosyasını dersin Telegram kanalında duyurulan biçimde teslim edin.", 13.5);
  s.addNotes("35 dakika verin. Sınıfta dolaşın; en sık karşılaşılan sorunlar tam olarak önceki iki slayttakiler olacaktır. Çözümler ders notlarında (Lab Föyü, 2., 6., 11. ve 13. alıştırmalar) — öğrencilere denemeden bakmamalarını söyleyin. Teslim yöntemi ve son tarih öğretim üyesinin kararıdır: [duyurulacak]. Hızlı öğrenciler Lab Föyü'ndeki diğer alıştırmalarla devam edebilir (16 alıştırma, toplam 100 puan).");

  // 38 ── Kısa sınav
  s = d.quizSlide({ questions: [
    "./hello.sh neden \"Permission denied\" verirken bash hello.sh çalışır? Hangi çıkış durumunu alırsınız?",
    "x=7; y=2. echo \"$((x / y))\", echo '$x' ve echo \"$x$y\" ne yazdırır?",
    "report.txt dosyası var olduğunda VE n değişkeni 10'dan büyük olduğunda doğru olan bir test yazın.",
    "./args.sh one \"two three\" four — $# ve $2 nedir?",
  ] });
  s.addNotes("Yanıtlar. (1) ./hello.sh çalıştırma izni ister, çünkü çekirdeğin dosyayı exec etmesi gerekir; bash hello.sh yalnızca okuma izni ister, çünkü bash dosyayı veri olarak açar. Çıkış durumu 126. (2) 3 (tamsayı bölmesi), $x (tek tırnak, olduğu gibi), 72 (iki değer yan yana). (3) [ -f report.txt ] && [ \"$n\" -gt 10 ]. (4) $# = 3, $2 = 'two three'.");

  // 39 ── Akılda kalacaklar
  s = d.content({ kicker: "Toparlama", title: "14. Hafta: Akılda Kalması Gerekenler" });
  d.bullets(s, [
    { b: "Betik:", t: " komutlardan oluşan bir metin dosyası; 1. satırda #!/bin/bash, chmod +x, ./script.sh ile çalıştırma. Bir çocuk süreçte çalışır (fork + exec)." },
    { b: "Değişkenler:", t: " boşluksuz ad=değer; çift tırnak içinde \"$ad\"; $( ) komut çıktısını yerleştirir; $(( )) tamsayı aritmetiği yapar." },
    { b: "Girdi:", t: " argümanlar $1 … $9, $#, \"$@\"; klavye için read -r." },
    { b: "Kararlar:", t: " her komutun bir çıkış durumu vardır (0 = başarı); [ ] dosyaları (-f, -d, -e), sayıları (-lt) ve dizgileri (=, -z) test eder; if / elif / else / fi." },
    { b: "Döngüler ve fonksiyonlar:", t: " listeler, {1..5} ve *.txt üzerinde for; sayaçlı ya da dosya okuyan while; ad() { … }." },
    { b: "Hata ayıklama:", t: " bash -n (sözdizimi), bash -x (izleme); hatadaki satır numarasını okuyun; CRLF satır sonlarına dikkat." },
  ], { fontSize: 20, y: 1.7, h: 5.15, paraSpaceAfter: 14 });
  s.addNotes("Bunları birlikte okuyun; her satır, 'kısa bir betik yazın' soruları da dâhil olmak üzere olası bir final sınavı konusudur.");

  // 40–41 ── Kapanış
  d.closing({ nextWeek: "Final Sınavı Tekrarı (15. hafta)", nextItems: [
    "Dersin tamamı: kuram 1–7. haftalar ve Linux 9–14. haftalar",
    "Alıştırma soruları: zamanlama, bellek, sayfa değiştirme",
    "\"Komutu / boru hattını / betiği yazın\" soruları",
    "Cevap anahtarıyla birlikte örnek bir final sınav kâğıdı",
    "Sınav tarihi ve salonu: dersin Telegram kanalını takip edin",
  ] });
  d.pres.slides[d.n - 2].addNotes("Gelecek hafta final sınavı tekrarı var. Dersin tamamını kapsıyor: 1-7. haftaların kuramı (8. haftanın çalışma kılavuzunu kullanın) ve bugünkülere benzer kısa bir betik yazmak da dâhil olmak üzere 9-14. haftaların uygulamalı Linux konuları. Lab Föyü alıştırmalarını evde bitirin: betik sorularına en iyi hazırlık onlardır.");
  d.pres.slides[d.n - 1].addNotes("Sözü sorulara bırakın. Telegram kanalında sorulan soruların herkese yardımcı olduğunu hatırlatın.");

  await d.save(path.join(__dirname, "MBLP131_Hafta14.pptx"));
  console.log("slides:", d.n);
})();
