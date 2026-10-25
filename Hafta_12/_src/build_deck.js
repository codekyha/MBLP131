// Hafta 12 sunumu (MBLP131, Türkçe): Metin İşleme, Yönlendirme ve Boru Hatları (uygulamalı Linux, 4. bölüm)
// İngilizce referans: ../week12/build_deck.js (aynı slayt sırası, aynı diyagramlar, aynı sayılar).
// Slaytlardaki her terminal oturumu code/out_*.txt dosyalarından okunur (gerçek çıktı; İngilizce
// haftadaki code/demo_*.sh betikleriyle sıradan bir kullanıcı olarak yakalanmış, değiştirilmeden kopyalanmıştır).
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("../lib/deck");
const d = new Deck({ week: 12, lang: "tr", assets: path.join(__dirname, "../lib") });
const code = f => fs.readFileSync(path.join(__dirname, "code", f), "utf8");
const P = d.pres;
const PALE = "D7E9E6";
const ROSE = "F3D9D6";
const PROMPT = "student@okan-lab:~/lab$ ";

// ---------- gerçek terminal çıktısı ----------
// out_X.txt bir bloklar dizisidir: bir istem satırı ve ardından komutun çıktısı.
function blocks(name) {
  const out = [];
  code(`out_${name}.txt`).replace(/\n$/, "").split("\n").forEach(l => {
    if (l.startsWith(PROMPT)) out.push({ cmd: l.slice(PROMPT.length), lines: [] });
    else out[out.length - 1].lines.push(l);
  });
  return out;
}
// sess("grep", [komut, enFazlaSatır?, ...]) -> istem + komut + (kısaltılmış) çıktı, yakalandığı gibi
function sess(name, picks) {
  const B = blocks(name), txt = [];
  let from = 0;   // komutlar tekrarlanabilir (cat notes.txt): sıradaki ilk geçişi al
  picks.forEach(p => {
    const [cmd, max] = Array.isArray(p) ? p : [p, undefined];
    let k = B.findIndex((x, i) => i >= from && x.cmd === cmd);
    if (k < 0) k = B.findIndex(x => x.cmd === cmd);
    const b = B[k]; from = k + 1;
    if (!b) throw new Error(`komut out_${name}.txt içinde bulunamadı: ${cmd}`);
    txt.push(PROMPT + b.cmd);
    let ls = b.lines;
    if (max !== undefined && ls.length > max) ls = ls.slice(0, max).concat(["..."]);
    txt.push(...ls);
  });
  return txt.join("\n");
}
// terminal kutusu: istem nane renginde, komut beyaz kalın, çıktı açık renk, "..." ve "# not" soluk
function term(s, x, y, w, h, text, size = 12) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.dark }, rectRadius: 0.05, line: { type: "none" } });
  const lines = text.replace(/\n$/, "").split("\n"), runs = [];
  lines.forEach((ln, i) => {
    const br = i < lines.length - 1;
    if (ln.startsWith(PROMPT)) {
      runs.push({ text: PROMPT.trimEnd() + " ", options: { color: C.mint } });
      runs.push({ text: ln.slice(PROMPT.length), options: { color: C.white, bold: true, breakLine: br } });
    } else if (ln === "..." || ln.startsWith("# ")) {
      runs.push({ text: ln, options: { color: C.mutedOnDark, italic: ln.startsWith("# "), breakLine: br } });
    } else {
      runs.push({ text: ln.length ? ln : " ", options: { color: "D0D6D8", breakLine: br } });
    }
  });
  s.addText(runs, { x: x + 0.18, y: y + 0.1, w: w - 0.36, h: h - 0.2, fontFace: F.code, fontSize: size, valign: "top", margin: 0, lineSpacingMultiple: 1.02, isTextBox: true });
}
function line(s, x1, y1, x2, y2, o = {}) {
  s.addShape(P.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 0.0001, h: Math.abs(y2 - y1) || 0.0001,
    flipH: x2 < x1, flipV: y2 < y1, line: Object.assign({ color: C.slate, width: 1.25 }, o) });
}
function numDot(s, x, y, n, fill = C.mint) {
  s.addShape(P.shapes.OVAL, { x, y, w: 0.36, h: 0.36, fill: { color: fill }, line: { type: "none" } });
  d.text(s, String(n), { x, y, w: 0.36, h: 0.36, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle" });
}
function label(s, t, x, y, w, o = {}) {
  d.text(s, t, Object.assign({ x, y, w, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "center" }, o));
}
function kernelBand(s, x, y, w, h, t = "çekirdek") {
  s.addShape(P.shapes.RECTANGLE, { x, y, w, h, fill: { color: "E9EEEF" }, line: { color: "C9D3D5", width: 0.75, dashType: "dash" } });
  d.text(s, t, { x: x + 0.1, y: y + 0.05, w: 3.5, h: 0.3, fontSize: 11, italic: true, bold: true, color: C.slate });
}

(async () => {
  // 1 ── Başlık
  let s = d.titleSlide({
    kicker: "MBLP131  ·  HAFTA 12",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 12  ·  Metin İşleme, Yönlendirme ve Boru Hatları",
    tagline: "Çekirdeğin birbirine bağladığı küçük programlar, gerçek veriler hakkındaki gerçek soruları yanıtlar.",
  });
  s.addNotes("12. haftaya hoş geldiniz; bu, dördüncü uygulamalı Linux haftamız. Bugünün planı: önce yönlendirmenin ve boruların arkasındaki kuram (standart akışlar = 0, 1, 2 numaralı dosya tanımlayıcıları; kabuk bunları exec'ten önce dup2 ile yeniden bağlar; boru, iki süreç arasındaki bir çekirdek tamponudur). Ardından klasik metin araçları: grep, sort, uniq, cut, wc, tr, head, tail, tee, find, xargs. En sonda ~/lab içindeki web sunucusu günlüğü ve öğrenci listesi hakkındaki gerçek soruları tek satırlık boru hatlarıyla yanıtlıyoruz. Öğrencilerin bir terminal açıp şunları çalıştırmış olması gerekir: bash mcmp117_lab_setup.sh, ardından cd ~/lab.");

  // 2 ── Geçen hafta
  s = d.cardsSlide({
    kicker: "Geçen hafta", title: "Dört Fikirde 11. Hafta",
    cards: [
      { title: "Kullanıcılar ve gruplar", body: "id, whoami, groups; her kullanıcının ve grubun bir numarası (UID, GID) vardır; /etc/passwd ve /etc/group içinde listelenir." },
      { title: "Kip dizgesi", body: "-rwxr-x--- : dosya türü, ardından sahip, grup ve diğerleri için rwx. Bir dizinde x, \"içine girebilir\" demektir." },
      { title: "chmod", body: "Sembolik (u+x, go-w) ya da sekizli, r = 4, w = 2, x = 1 ile: 754 = rwx r-x r--." },
      { title: "Kim değiştirebilir?", body: "umask varsayılanları belirler; chown root ister; sudo tek bir komutu root olarak çalıştırır — dikkatli kullanın." },
    ], cols: 4, bodySize: 14.5, cardH: 2.85, top: 2.0,
    callout: "Geçen hafta koruduğumuz dosyalar bugün veriye dönüşüyor: içeriklerini arıyor, kesiyor, sıralıyor ve sayıyoruz; programları da birbirine bağlıyoruz.",
  });
  s.addNotes("İki dakikalık tekrar. Sorun: chmod 640 report.txt neye izin verir? (sahip rw, grup r, diğerleri hiçbir şey: 6 = 4 + 2, 4 = r, 0 = yok.) Bir dizin neden x ister? (içine girmek ve içindeki dosyalara ulaşmak için.) 'Permission denied' iletisiyle bugün yine karşılaşacağız: standart hata (fd 2) üzerinden gelir ve onu başka bir yere göndermeyi öğreneceğiz.");

  // 3 ── Gündem
  s = d.content({ kicker: "Hafta 12", title: "Bugünün Gündemi" });
  [
    ["1", "Standart akışlar", "stdin, stdout, stderr = 0, 1, 2 numaralı dosya tanımlayıcıları (2–3. haftalar: write(1, …))."],
    ["2", "Yönlendirme", "> >> < 2> 2>&1 &> /dev/null — ve kabuğun bunu dup2() ile nasıl yaptığı."],
    ["3", "Borular", "komut1 | komut2: bir çekirdek tamponuyla bağlanan iki süreç."],
    ["4", "Filtreler", "grep (basit düzenli ifadelerle), sort, uniq, cut, wc, tr."],
    ["5", "Diğer araçlar", "Boru hatlarında head ve tail, tee, find, xargs."],
    ["6", "Gerçek analizler + lab", "Durum kodları, en çok istenen sayfalar, saat başına hatalar, notlar — her biri tek satır."],
  ].forEach((a, i) => {
    const y = 1.65 + i * 0.86;
    d.box(s, MX, y, 0.72, 0.72, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 0.9, y, w: 11.25, h: 0.72, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "   ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.2, y, w: 10.8, h: 0.72, valign: "middle" });
  });
  s.addNotes("1–4. bölümler moladan önce, 5. bölüm ve gerçek analizler moladan sonra; ardından 30–40 dakika lab çalışması. Slaytlardaki tüm çıktılar gerçektir ve sizdeki ~/lab klasörünün aynısında yakalanmıştır; sizin tarihleriniz ve süreç numaralarınız farklı olacaktır.");

  // ───────────────────────── BÖLÜM 1: AKIŞLAR VE YÖNLENDİRME
  s = d.sectionSlide({ kicker: "Bölüm 1", title: "Standart Akışlar ve Yönlendirme", subtitle: "Her süreç hayata üç açık dosyayla başlar." });
  s.addNotes("Geçiş: yeni komutları öğrenmeden önce, hepsini birbirine bağlanabilir kılan tek fikri öğreniyoruz.");

  // 5 ── Üç standart akış (diyagram)
  s = d.content({ kicker: "Standart akışlar", title: "Üç Akış, Üç Küçük Sayı" });
  {
    const y = 1.85;
    d.box(s, MX, y + 0.95, 1.9, 0.9, "Klavye", { sub: "(terminal girdisi)", fill: C.light, size: 15 });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: 4.0, y, w: 3.6, h: 2.95, fill: { color: C.charcoal }, rectRadius: 0.06, line: { type: "none" } });
    d.text(s, "Süreç  (ör. ls, grep, sort)", { x: 4.1, y: y + 0.1, w: 3.4, h: 0.4, fontSize: 14, bold: true, color: C.mint, align: "center" });
    d.text(s, "dosya tanımlayıcı tablosu", { x: 4.1, y: y + 0.48, w: 3.4, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnDark, align: "center" });
    const rows = [["0", "stdin", "standart girdi"], ["1", "stdout", "standart çıktı"], ["2", "stderr", "standart hata"]];
    rows.forEach((r, i) => {
      const yy = y + 0.9 + i * 0.66;
      d.box(s, 4.25, yy, 0.6, 0.52, r[0], { fill: i === 2 ? C.red : C.mint, size: 16, font: F.code, color: C.white });
      d.box(s, 4.92, yy, 2.45, 0.52, r[1], { sub: r[2], fill: C.light, size: 13, font: F.code, subSize: 10.5 });
    });
    d.box(s, 9.9, y + 0.55, 2.85, 1.85, "Terminal ekranı", { sub: "/dev/pts/1", fill: C.light, size: 15 });
    d.arrow(s, MX + 1.92, y + 1.4, 4.23, y + 1.16, { color: C.mintDeep, w: 2.25 });
    label(s, "read(0, …)", MX + 1.95, y + 0.85, 2.1, { color: C.mintDeep, bold: true });
    d.arrow(s, 7.62, y + 1.82, 9.88, y + 1.25, { color: C.mintDeep, w: 2.25 });
    label(s, "write(1, …)", 8.0, y + 1.15, 1.8, { color: C.mintDeep, bold: true });
    d.arrow(s, 7.62, y + 2.48, 9.88, y + 1.95, { color: C.red, w: 2.25 });
    label(s, "write(2, …)", 8.0, y + 2.3, 1.8, { color: C.red, bold: true });
  }
  const sc = [
    { title: "0 · stdin", body: "Programın girdisini okuduğu yer. Varsayılan: klavye." },
    { title: "1 · stdout", body: "Normal sonuçlar. Varsayılan: terminal ekranı." },
    { title: "2 · stderr", body: "Hata iletileri, ayrı bir kanalda — sonuçlar bir dosyaya gitse bile size ulaşırlar.", titleColor: C.red },
  ];
  sc.forEach((c, i) => d.card(s, MX + i * 4.13, 5.05, 3.9, 1.8, Object.assign({ bodySize: 14 }, c)));
  s.addNotes("Dosya tanımlayıcı (file descriptor, fd), sürecin açık dosyalar tablosunda bir sıra numarası olan küçük bir tamsayıdır (7. hafta: süreç başına açık dosya tablosu). Çekirdek fd 1'in arkasında ne olduğuyla ilgilenmez: bir terminal, bir dosya, bir boru ya da /dev/null. Program yalnızca write(1, ...) çağırır. Geleneksel olarak her süreç 0, 1, 2 zaten açık olarak başlatılır; bunları ebeveyninden, yani kabuktan miras alır. Kırmızı stderr okunu gösterin: aynı ekrana giden iki ayrı kanal. 2> yönlendirmesinin var olmasının tek nedeni bu ayrımdır.");

  // 6 ── yine write(1,...)
  s = d.content({ kicker: "Bağlantı: 2–3. haftalar", title: "Bunu Daha Önce Gördünüz: write(1, …)" });
  term(s, MX, 1.65, 7.6, 3.55, sess("strace", ["strace -o t1.txt -e trace=write ls data nosuch", "cat t1.txt"]), 11.5);
  d.card(s, MX + 7.85, 1.65, 4.3, 3.55, { title: "strace ne gösteriyor?", body: [
    "Hata iletisi write(2, …) ile çıkar: fd 2, stderr.",
    "Liste write(1, …) ile çıkar: fd 1, stdout.",
    "ls, 1 ve 2'nin nereye gittiğini hiç sormaz: bu, ls başlamadan önce belirlenmiştir.",
  ], bodySize: 14 });
  d.callout(s, MX, 5.45, 12.15, 1.4, "2. hafta: printf() sonunda write(1, \"Hello…\", n) olur. 3. hafta: sistem çağrısı çekirdeğe bir tuzaktır (trap) ve fd 1 standart çıktı demektir. Bugün: kabuk, ls başlamadan önce fd 1'i bir dosyaya yöneltirse her write(1, …) o dosyaya düşer. Yönlendirme budur.", 14);
  s.addNotes("Gerçek çıktı; strace izini t1.txt dosyasına yazar (-o), böylece ls'in kendi çıktısına karışmaz. ls hatayı dört küçük parça hâlinde yazdı (\"ls: \", ad, neden, satır sonu); hepsi fd 2 üzerinde. Sıraya dikkat edin: hata listeden önce görünür, çünkü ls önce tüm argümanları denetler. Ayrıca terminalde ls sütunlar hâlinde yazar, bir dosyada ise satır başına bir ad: ls, fd 1'in bir terminal olup olmadığını denetler (isatty) ve biçimini buna göre ayarlar.");

  // 7 ── /proc/self/fd
  s = d.content({ kicker: "Standart akışlar", title: "Tanımlayıcıları Görmek: ls -l /proc/self/fd" });
  term(s, MX, 1.65, 8.0, 5.2, sess("streams", ["ls -l /proc/self/fd", "ls -l /proc/self/fd > fd.txt", "cat fd.txt", "ls -l /proc/self/fd 2> /dev/null"]), 11);
  d.card(s, MX + 8.25, 1.65, 3.9, 5.2, { title: "Neye bakmalı?", body: [
    "/proc/self, bakan süreçtir — burada ls'in kendisi (3. hafta: /proc).",
    "Normalde 0, 1, 2'nin üçü de /dev/pts/1 terminalini gösterir.",
    "> fd.txt ile fd 1 dosyayı gösterir: ls kendi listesini dosyaya yazdı.",
    "2> /dev/null ile fd 2 \"kara delik\" aygıtını gösterir.",
    "fd 3, ls'in okuduğu dizindir.",
  ], bodySize: 13 });
  s.addNotes("Yönlendirmenin yalnızca dosya tanımlayıcı tablosundaki bir değişiklik olduğunun en doğrudan kanıtı budur. /proc/self, onu açan sürecin /proc/<PID> dizinine giden sembolik bir bağlantıdır. Terminal numarası (pts/1) ve tarihler sizin makinenizde farklı olacaktır. l-wx------ tanımlayıcının yalnızca yazma için açık olduğunu, lrwx------ ise okuma ve yazma için açık olduğunu gösterir.");

  // 8 ── > ve >>
  s = d.content({ kicker: "Yönlendirme", title: "Çıktı Yönlendirme: > Üzerine Yazar, >> Sona Ekler" });
  term(s, MX, 1.65, 6.9, 5.2, sess("redirect", ['echo "first line" > notes.txt', "cat notes.txt", 'echo "second line" >> notes.txt', "cat notes.txt", 'echo "oops" > notes.txt', "cat notes.txt"]), 12);
  d.card(s, MX + 7.15, 1.65, 5.0, 3.0, { title: "Kurallar", body: [
    { b: "komut > dosya", t: "  dosyayı oluşturur ya da önce boşaltır (truncate), sonra stdout'u içine yazar." },
    { b: "komut >> dosya", t: "  gerekirse oluşturur, sonra sonuna ekler." },
    "Ekranda hiçbir şey görünmez: stdout dosyaya gitti.",
  ], bodySize: 13.5 });
  d.card(s, MX + 7.15, 4.85, 5.0, 2.0, { title: "Dikkat", titleColor: C.red, fill: ROSE, body: "> dosyayı komut daha başlamadan boşaltır. Tek bir yanlış > bir dosyayı yok eder — geri alma da çöp kutusu da yoktur (10. hafta).", bodySize: 14 });
  s.addNotes("Canlı: bunları kendiniz yazın. Üçüncü echo iki satırın ikisinin de yerini aldı: > dosyayı kırptı. strace (iki slayt sonra) bunu yapan O_TRUNC bayrağını gösterir. Dikkatli olanlara ipucu: set -o noclobber, bash'in var olan bir dosyanın üzerine > ile yazmayı reddetmesini sağlar; >| zorlar.");

  // 9 ── < girdi
  s = d.content({ kicker: "Yönlendirme", title: "Girdi Yönlendirme: < Bir Dosyayı stdin'e Verir" });
  term(s, MX, 1.65, 7.6, 3.4, sess("redirect", ["wc -l logs/access.log", "wc -l < logs/access.log"]) + "\n" + sess("streams", ["ls -l /proc/self/fd < docs/syllabus.txt"]), 11.5);
  d.card(s, MX + 7.85, 1.65, 4.3, 3.4, { title: "Bir dosyayı okumanın iki yolu", body: [
    { b: "wc -l dosya:", t: " wc dosyayı kendisi açar ve adını bilir, bu yüzden adı yazar." },
    { b: "wc -l < dosya:", t: " dosyayı kabuk fd 0 olarak açar; wc yalnızca bir akış görür, ad yok." },
  ], bodySize: 14 });
  d.callout(s, MX, 5.3, 12.15, 1.55, "Metin araçlarının çoğu filtre (filter) geleneğine uyar: argüman olarak verilen dosyaları, hiç dosya yoksa stdin'i okur; sonucu stdout'a yazar. Borularla zincirlenebilmelerinin nedeni budur — bugünün ana konusu.", 15);
  s.addNotes("/proc/self/fd çıktısı bunu doğrular: < docs/syllabus.txt ile fd 0 dosyayı gösterir. <'nin pratik kullanımı: dosya adı olmadan çıplak bir sayı (300) elde etmek; betiklerde işe yarar (14. hafta). Tipik öğrenci hatası: wc -l > logs/access.log yazmak — bu, günlüğü BOŞALTIR! Okun yönü önemlidir: < okur, > yazar.");

  // 10 ── stderr
  s = d.content({ kicker: "Yönlendirme", title: "Hataları Yönlendirmek: 2>, 2>&1, &> ve /dev/null" });
  term(s, MX, 1.65, 6.9, 5.2, sess("redirect", ["ls data nosuch > out.txt", "ls data nosuch 2> err.txt", "cat err.txt", "ls data nosuch > all.txt 2>&1", "cat all.txt", "ls data nosuch 2> /dev/null"]), 11);
  s.addTable([
    ["Sözdizimi", "Anlamı"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 14 } })),
    ...[["> f   ya da  1> f", "stdout → f"], ["2> f", "stderr → f"], ["2>> f", "stderr'i f'nin sonuna ekle"], ["> f 2>&1", "ikisi de f'ye (fd 2 = fd 1'in kopyası)"], ["&> f", "ikisi de f'ye (bash kısaltması)"], ["2> /dev/null", "hataları at"]]
      .map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: j === 0 ? F.code : F.body, fontSize: 13 } }))),
  ], { x: MX + 7.15, y: 1.65, w: 5.0, colW: [2.1, 2.9], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [4, 6, 4, 6], valign: "middle" });
  d.card(s, MX + 7.15, 5.25, 5.0, 1.6, { body: "/dev/null bir aygıt dosyasıdır: ona yazılan her şey kaybolur; ondan okumak hemen dosya sonu verir.", bodySize: 14 });
  s.addNotes("İlk komut: > yalnızca stdout'u taşıdı, bu yüzden hata yine ekranda görünür — ayrı kanal iş başında. 2> err.txt: tersi. > all.txt 2>&1: ikisi de dosyada (önce hatalar, çünkü ls önce eksik adı bildirir). &> all.txt bash'te aynı işi yapar; 2>&1 biçimi diğer kabuklarda (sh, dash) da çalışır. /dev/null, find'ın 'Permission denied' satırlarını susturmanın klasik yoludur (bunu moladan sonra yapacağız).");

  // 11 ── Sıra önemlidir (fd tablosu diyagramı)
  s = d.content({ kicker: "Yönlendirme", title: "Sıra Önemlidir: Yönlendirmeler Soldan Sağa İşlenir" });
  function fdPanel(x, title, steps, result, good) {
    d.text(s, title, { x, y: 1.6, w: 5.95, h: 0.4, fontSize: 15, bold: true, color: C.charcoal, fontFace: F.code });
    steps.forEach((st, i) => {
      const y = 2.15 + i * 0.78;
      d.box(s, x, y, 1.85, 0.62, st[0], { fill: C.charcoal, size: 12, font: F.code });
      [1, 2].forEach((fd, k) => {
        const tgt = st[k + 1], isFile = tgt !== "terminal";
        d.box(s, x + 2.0 + k * 2.0, y, 1.9, 0.62, `fd ${fd} → ${tgt}`, { fill: isFile ? C.mint : C.light, size: 12, font: F.code, color: C.dark, bold: isFile });
      });
    });
    d.card(s, x, 4.6, 5.95, 0.95, { body: result, bodySize: 14, fill: good ? PALE : ROSE });
  }
  fdPanel(MX, "ls data nosuch > all.txt 2>&1", [["başlangıç", "terminal", "terminal"], ["> all.txt", "all.txt", "terminal"], ["2>&1", "all.txt", "all.txt"]], "İki akış da all.txt dosyasına gider.", true);
  fdPanel(MX + 6.2, "ls data nosuch 2>&1 > out2.txt", [["başlangıç", "terminal", "terminal"], ["2>&1", "terminal", "terminal"], ["> out2.txt", "out2.txt", "terminal"]], "Hata yine ekranda görünür!", false);
  term(s, MX, 5.75, 12.15, 1.1, sess("redirect", ["ls data nosuch 2>&1 > out2.txt"]) + "\n# 2>&1 şu demektir: fd 2'yi fd 1'in ŞU ANKİ hâlinin kopyası yap — fd 1'e kalıcı bir bağ değil", 12);
  s.addNotes("2>&1'i 'fd 2, fd 1'in o andaki hâlinin kopyası olur' diye okuyun — bu kelimenin tam anlamıyla dup2(1, 2) sistem çağrısıdır. İkinci komutta 2>&1 işlendiği anda fd 1 hâlâ terminali gösterir, bu yüzden fd 2 terminale kopyalanır; fd 1 ancak bundan sonra dosyaya taşınır. Gerçek çıktı: hata ekranda göründü, out2.txt yalnızca listeyi içerir. Sınavların gözdesi.");

  // 12 ── kabuk bunu nasıl yapar
  s = d.content({ kicker: "Bağlantı: 3. hafta", title: "Kabuk Bunu Nasıl Yapar: fork, open, dup2, exec" });
  term(s, MX, 1.65, 12.15, 1.55, sess("strace", ['strace -f -o t2.txt -e trace=openat,dup2,execve bash -c "ls data > list.txt"', 'grep -E "list.txt|dup2|execve" t2.txt']).replace(/0x[0-9a-f]+ \/\* 23 vars \*\//g, "…"), 10.5);
  {
    const steps = [
      ["1  fork (clone)", "bash bir çocuk oluşturur: aynı 0, 1, 2 tanımlayıcılarına sahip bir kopyası."],
      ["2  openat", "Çocuk list.txt'yi yazmak için açar (O_TRUNC = boşalt). Yeni fd: 3."],
      ["3  dup2(3, 1)", "fd 1, fd 3'ün kopyası olur: stdout artık list.txt'ye gider."],
      ["4  execve ls", "Çocuk ls'e dönüşür. fd tablosu exec'ten sağ çıkar — ls fd 1'e yazar."],
    ];
    const w = 2.86, gap = 0.24;
    steps.forEach((st, i) => {
      const x = MX + i * (w + gap);
      d.card(s, x, 3.45, w, 2.0, { title: st[0], body: st[1], bodySize: 13, titleSize: 15, fill: i === 2 ? PALE : C.light });
      if (i < steps.length - 1) d.arrow(s, x + w + 0.01, 4.45, x + w + gap - 0.01, 4.45, { w: 1.5 });
    });
  }
  d.callout(s, MX, 5.7, 12.15, 1.15, "3. hafta sordu: fork() ve exec() neden iki ayrı çağrı? Çünkü ikisinin arasında çocuk kendi dosya tanımlayıcılarını yeniden düzenleyebilir — ve sonra çalıştırdığı program bunu hiç bilmez. Linux fork() çağrısını clone() sistem çağrısıyla gerçekler.", 14);
  s.addNotes("Sıradan bir kullanıcı olarak alınmış gerçek strace çıktısı (süreç numaraları ve ortam adresleri farklı olacaktır; ortamın adresi … olarak kısaltıldı). İlk PID bash'tir, ikincisi onun çocuğu. Çocuk open ve dup2'yi yapar, sonra execve: ls programı çocuğun kodunun yerini alır, ama açık dosya tablosu korunur. close-on-exec'ten söz edin: kabuk normalde fd 3'ü de kapatır, böylece ls fazladan bir kopya miras almaz — çıktı kısa kalsın diye close çağrısını izlemedik.");

  // ───────────────────────── BÖLÜM 2: BORULAR
  s = d.sectionSlide({ kicker: "Bölüm 2", title: "Borular", subtitle: "Bir sürecin çıktısı bir sonrakinin girdisi olur." });
  s.addNotes("Yönlendirme bir süreci bir DOSYAYA bağlar. Boru (pipe) ise bir süreci başka bir SÜRECE bağlar.");

  // 14 ── boru hattı diyagramı
  s = d.content({ kicker: "Borular", title: "Boru Hattı: Borularla Bağlanmış Süreçler" });
  {
    const y = 1.75, ph = 0.95, ky = 3.45;
    kernelBand(s, MX, ky - 0.15, 12.15, 1.1, "çekirdek: boru tamponları");
    d.box(s, MX, y, 1.75, ph, "access.log", { sub: "dosya", fill: C.light, size: 13, font: F.code });
    const procs = [["cut -d\" \" -f9", 2.75, 2.45], ["sort", 6.3, 1.7], ["uniq -c", 9.15, 1.7]];
    procs.forEach(([t, x, w]) => d.box(s, x, y, w, ph, t, { sub: "süreç", fill: C.charcoal, size: 14, font: F.code }));
    d.box(s, 11.45, y, 1.3, ph, "Terminal", { fill: C.light, size: 13 });
    d.arrow(s, MX + 1.77, y + ph / 2, 2.73, y + ph / 2, { color: C.slate, w: 1.75 });
    const pipes = [[4.65, 1.5], [7.45, 1.5]];
    pipes.forEach(([px, pw]) => {
      d.box(s, px, ky + 0.2, pw, 0.55, "boru", { fill: C.mint, size: 13, color: C.dark });
    });
    // cut fd1 -> boru1 -> sort fd0
    d.arrow(s, 4.9, y + ph + 0.02, 5.0, ky + 0.18, { color: C.mintDeep, w: 2 });
    d.arrow(s, 6.0, ky + 0.18, 6.6, y + ph + 0.02, { color: C.mintDeep, w: 2 });
    d.arrow(s, 7.75, y + ph + 0.02, 7.85, ky + 0.18, { color: C.mintDeep, w: 2 });
    d.arrow(s, 8.8, ky + 0.18, 9.45, y + ph + 0.02, { color: C.mintDeep, w: 2 });
    d.arrow(s, 10.87, y + ph / 2, 11.43, y + ph / 2, { color: C.mintDeep, w: 2 });
    label(s, "fd 1", 4.05, y + ph + 0.12, 0.8, { color: C.mintDeep, bold: true, fontSize: 10.5 });
    label(s, "fd 0", 6.42, y + ph + 0.12, 0.7, { color: C.mintDeep, bold: true, fontSize: 10.5 });
    label(s, "fd 1", 7.0, y + ph + 0.12, 0.7, { color: C.mintDeep, bold: true, fontSize: 10.5 });
    label(s, "fd 0", 9.5, y + ph + 0.12, 0.7, { color: C.mintDeep, bold: true, fontSize: 10.5 });
    label(s, "fd 1", 10.8, y + 0.08, 0.7, { color: C.mintDeep, bold: true, fontSize: 10.5 });
  }
  term(s, MX, 4.75, 7.6, 2.1, sess("analysis", ['cut -d" " -f9 logs/access.log | sort | uniq -c']), 10.5);
  d.card(s, MX + 7.85, 4.75, 4.3, 2.1, { body: [
    "Üç süreç aynı anda çalışır; her boru çekirdek içinde bir tampondur.",
    "cut fd 1'e = boruya yazar; sort fd 0'dan = borudan okur.",
    "Her aşamanın stderr'i (fd 2) yine terminale gider.",
  ], bodySize: 13 });
  s.addNotes("Boru hattını yüksek sesle okuyun: cut her satırın 9. alanını (HTTP durum kodu) alır, sort eşit kodları bir araya getirir, uniq -c her grubu sayar. Geçici dosya yok: veri çekirdekteki bellek tamponlarından akar. Her kutu kendi PID'i olan ayrı bir süreçtir (3. hafta); üçünü de kabuk başlattı. Hatalar borudan aşağı gönderilmez — bir aşamanın hata iletileri doğrudan ekranda görünür.");

  // 15 ── bir borunun strace'i
  s = d.content({ kicker: "Bağlantı: 3. hafta", title: "Boru Kurmak: pipe2, clone, dup2, execve" });
  {
    const tr = code("out_strace.txt").split("\n");
    const pick = re => { const l = tr.find(x => re.test(x)); if (!l) throw new Error("strace satırı " + re); return l; };
    const sh = l => l.replace(/clone\(child_stack=NULL, flags=[^,]*(, child_tidptr=0x[0-9a-f]+)?\)/, "clone(…)").replace(/, 0x[0-9a-f]+ \/\* 23 vars \*\/\)/, ", …)").replace(/ +=/, " =");
    const t = [
      sess("strace", ['strace -f -o t3.txt -e trace=pipe2,clone,dup2,execve bash -c "grep ERROR logs/system.log | wc -l"']),
      PROMPT + "cat t3.txt",
      "...",
      ...blocks("strace").find(x => x.cmd === "cat t3.txt").lines.filter(l => /pipe2|clone|dup2|execve\("\/usr\/bin\/(grep|wc)/.test(l)).map(sh),
      "...",
    ].join("\n");
    term(s, MX, 1.65, 7.55, 3.75, t, 10.5);
  }
  d.card(s, MX + 7.8, 1.65, 4.35, 3.75, { title: "İzi okumak", body: [
    { b: "pipe2([3, 4]):", t: " kabuk bir boru alır: fd 3 = okuma ucu, fd 4 = yazma ucu." },
    { b: "clone × 2:", t: " iki çocuk (fork)." },
    { b: "grep çocuğu:", t: " dup2(4, 1) — stdout boruya." },
    { b: "wc çocuğu:", t: " dup2(3, 0) — stdin borudan." },
  ], bodySize: 13 });
  term(s, MX, 5.6, 12.15, 1.25, sess("pipes", ["ls -l /proc/self/fd | cat"]).split("\n").filter(l => / 1 -> |\$ /.test(l)).join("\n") + `\n# ls'in fd 1'i artık terminal değil: bir boru (çekirdekteki numarası ${code("out_pipes.txt").match(/pipe:\[(\d+)\]/)[1]})`, 11);
  s.addNotes("Gerçek iz; clone bayrakları ve ortam adresleri … ile kısaltıldı. Satırların başında PID vardır; çıkış ve SIGCHLD satırları atlandı (ham dosyanın tamamı code/out_strace.txt içindedir). İki süreç aynı anda çalıştığında strace bir çağrıyı '<unfinished ...>' ve 'resumed' diye iki yarıda yazabilir — sizin iziniz böyle görünürse şaşırmayın. İlk çocuk grep'tir: dup2(4, 1), sonra exec. İkinci çocuk wc'dir: dup2(3, 0), sonra exec. Yönlendirmeyle birlikte kabuğun ihtiyaç duyduğu HER ŞEY budur: pipe(), fork(), dup2(), exec(). Alttaki kutu: bir boru içinde çalışan ls, fd 1 -> pipe:[N] görür; N, borunun çekirdek içindeki kimliğidir.");

  // 16 ── sınırlı tampon
  s = d.content({ kicker: "Bağlantı: 5. hafta", title: "Boru, Çekirdeğin Yönettiği Sınırlı Bir Tampondur" });
  {
    const y = 1.85;
    d.box(s, MX, y, 1.9, 1.0, "yazan", { sub: "ör. grep", fill: C.charcoal, size: 15 });
    const bx = MX + 2.5;
    for (let i = 0; i < 10; i++) d.box(s, bx + i * 0.5, y + 0.2, 0.46, 0.6, "", { fill: i < 6 ? C.mint : C.light });
    label(s, "boru tamponu: Linux'ta 64 KiB (16 sayfa × 4 KiB)", bx - 0.2, y + 0.85, 5.4);
    d.box(s, MX + 7.85, y, 1.9, 1.0, "okuyan", { sub: "ör. wc", fill: C.charcoal, size: 15 });
    d.arrow(s, MX + 1.92, y + 0.5, bx - 0.04, y + 0.5, { color: C.mintDeep, w: 2 });
    d.arrow(s, bx + 5.0, y + 0.5, MX + 7.83, y + 0.5, { color: C.mintDeep, w: 2 });
    d.card(s, MX, 3.2, 9.75, 1.6, { body: [
      { b: "Tampon dolu:", t: " write() bloke olur — yazan bekler.   " },
      { b: "Tampon boş:", t: " read() bloke olur — okuyan bekler." },
      { b: "Yazan kapattı ve tampon boş:", t: " read() 0 döndürür = dosya sonu." },
    ], bodySize: 14 });
  }
  d.card(s, MX + 10.0, 1.85, 2.15, 2.95, { title: "5. hafta", body: "Üretici–tüketici problemi — sizin yerinize çekirdek çözüyor.", bodySize: 13.5 });
  term(s, MX, 5.0, 12.15, 1.85, sess("pipes", ["time (sleep 2 | sleep 2)", "yes | head -n 3"]).replace(/\n\n/, "\n"), 11);
  s.addNotes("Bu, 5. haftadaki sınırlı tampon (üretici–tüketici) problemidir; çekirdek içinde bloke etmeyle çözülür: zamanlayıcı (4. hafta) bekleyen süreci uyutur. İki gerçek deney: (1) sleep 2 | sleep 2 4 s değil 2,0 s sürer — aşamalar art arda değil eşzamanlı çalışır. (2) yes sonsuza kadar 'y' yazar, ama head 3 satır yazıp çıktığında borunun artık okuyanı kalmaz; yes'in bir sonraki write() çağrısı SIGPIPE sinyalini alır ve bu sinyal onu sonlandırır. Sinyaller 13. haftanın konusudur. 64 KiB'lık varsayılan (16 × 4096 = 65.536 bayt) her boru için fcntl(F_SETPIPE_SZ) ile değiştirilebilir.");

  // ───────────────────────── BÖLÜM 3: FİLTRELER
  s = d.sectionSlide({ kicker: "Bölüm 3", title: "Filtreler: grep, sort, uniq, cut, wc, tr", subtitle: "Her biri dosyalardan ya da stdin'den satır okur, stdout'a satır yazar." });
  s.addNotes("Unix felsefesi: her program tek bir işi iyi yapar ve programlar metin akışları üzerinden birlikte çalışır. Bu bölümdeki her araç bir filtredir.");

  // 18 ── grep temelleri  (komut adı içeren üst başlıklar büyük harfle verildi: Türkçe büyütme "find"ı "FİND" yapardı)
  s = d.content({ kicker: "grep", title: "grep: Bir Kalıpla Eşleşen Satırları Yazdırır" });
  term(s, MX, 1.65, 8.0, 5.2, sess("grep", ["grep ERROR logs/system.log | head -n 3", "grep -c ERROR logs/system.log", 'grep -i "TALK" docs/linux_quotes.txt', 'grep -n "backup" logs/system.log | head -n 4', "grep -v INFO logs/system.log | head -n 4", "grep -vc INFO logs/system.log"]), 11);
  s.addTable([
    ["Seçenek", "Anlamı"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 14 } })),
    ...[["-i", "büyük/küçük harf ayrımı yok"], ["-n", "satır numaralarını göster"], ["-v", "tersine çevir: eşleşMEYEN satırlar"], ["-c", "eşleşen satırları say"], ["-w", "yalnızca tam sözcük eşleşmesi"], ["-r", "dizinlerde özyinelemeli ara"]]
      .map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: j === 0 ? F.code : F.body, fontSize: 13 } }))),
  ], { x: MX + 8.25, y: 1.65, w: 3.9, colW: [1.05, 2.85], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [4, 6, 4, 6], valign: "middle" });
  d.card(s, MX + 8.25, 5.0, 3.9, 1.85, { body: "Biçim: grep [seçenekler] KALIP [dosyalar]. Boşluk ya da özel karakter içeren kalıbı tırnak içine alın.", bodySize: 13.5 });
  s.addNotes("grep = 'global regular expression print' (ed düzenleyicisinin g/re/p komutundan). -c eşleşme sayısını değil SATIRLARI sayar. Seçenekler birleştirilebilir: -vc = tersine çevir ve say: INFO olmayan 41 satır; 13 + 28 = 41 (ERROR + WARN), bunu ileride doğrulayacağız. system.log'daki dakikaların bir saat içinde sıralı olmadığına dikkat edin — bu üretilmiş deneme verisidir; gerçek günlükler zaman sırasındadır.");

  // 19 ── grep -w -r
  s = d.content({ kicker: "grep", title: "Tam Sözcükler (-w) ve Tüm Dizinler (-r)" });
  term(s, MX, 1.65, 7.6, 5.2, sess("grep", ['grep "Week 1" docs/syllabus.txt', 'grep -w "Week 1" docs/syllabus.txt', 'grep -r "Project" projects']), 12);
  d.card(s, MX + 7.85, 1.65, 4.3, 2.55, { title: "-w", body: "\"Week 1\", \"Week 10\" … \"Week 15\" içinde de eşleşir. -w ile eşleşme tam bir sözcük olmalıdır: önünde ya da arkasında harf, rakam veya _ olamaz.", bodySize: 13.5 });
  d.card(s, MX + 7.85, 4.4, 4.3, 2.45, { title: "-r", body: "Bir dizinin altındaki her dosyada arar ve her satırın önüne dosyanın adını yazar. Sıra alfabetik değil, dizindeki sıradır.", bodySize: 13.5 });
  s.addNotes("Çıktıyı göstermeden önce sorun: grep \"Week 1\" kaç satır yazdıracak? Pek çok öğrenci bir der. Bir projenin bütün ağacında bir işlev adını grep -rn ad src/ ile aramak, programcının gündelik işidir. grep birden çok dosyada aradığında dosya:satır yazar; -h ile adları gizler.");

  // 20 ── düzenli ifadeler
  s = d.content({ kicker: "grep", title: "Basit Düzenli İfadeler" });
  s.addTable([
    ["Simge", "Eşleştiği", "Örnek"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 14 } })),
    ...[["^", "satırın başı", "^Week"], ["$", "satırın sonu", "s$"], [".", "herhangi TEK bir karakter", "c.de → code"], ["[ ]", "bir kümeden tek karakter", "[0-9]  [aeiou]"], ["*", "önündeki öğe, 0 ya da daha çok kez", "[0-9]*"], ["\\.", "gerçek bir nokta", "5\\.38"]]
      .map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: j === 1 ? F.body : F.code, fontSize: 13.5 } }))),
  ], { x: MX, y: 1.65, w: 5.1, colW: [0.85, 2.45, 1.8], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [4, 6, 4, 6], valign: "middle" });
  d.callout(s, MX, 5.25, 5.1, 1.6, "Kalıbı her zaman tırnak içine alın: yoksa kabuk, grep görmeden önce * ve [ ] karakterlerini dosya adı joker karakterleri olarak genişletebilir (10. hafta).", 13.5);
  term(s, MX + 5.35, 1.65, 6.8, 5.2, sess("regex", [['grep "^Week [0-9] " docs/syllabus.txt', 3], 'grep "s$" docs/syllabus.txt', 'grep "c.de" docs/linux_quotes.txt', 'grep -c "5.38" logs/access.log', 'grep -c "5\\.38" logs/access.log', 'grep ",ECT,[0-9]*,9[0-9]$" data/students.csv']), 10.5);
  s.addNotes("Düzenli ifadeler (regular expressions) kabuk joker karakterleriyle AYNI şey değildir: düzenli ifadede * 'önceki öğeyi tekrarla', . ise 'herhangi bir karakter' demektir; kabukta * 'herhangi bir dizgi' demektir. 5.38 örneği gerçektir: 10.0.5.38 IP adresini kaçışsız noktayla saymak 37 yerine 39 verir, çünkü . 15:38 saatindeki ':' karakteriyle ve 5438 bayt sayısındaki rakamla da eşleşti (iki satır da out_regex.txt içinde). Son örnek, final notu 90–99 olan ECT öğrencilerini bulur: ',ECT,', ardından vize için rakamlar, bir virgül, sonra 9 ve satır sonunda tek bir rakam. grep -E (genişletilmiş düzenli ifadeler: + ? | ve gruplar) vardır — bu hafta gerekmiyor.");

  // 21 ── sort
  s = d.content({ kicker: "sort", title: "sort: Alfabetik, Sayısal, Sütuna Göre" });
  term(s, MX, 1.65, 7.9, 5.2, sess("sort_uniq", ["sort data/cities.txt | head -n 4", "tail -n +2 data/students.csv | cut -d, -f5 | sort | head -n 3", "tail -n +2 data/students.csv | cut -d, -f5 | sort -n | head -n 3", "sort -t, -k5 -nr data/students.csv | head -n 3"]), 10.5);
  d.card(s, MX + 8.15, 1.65, 4.0, 5.2, { title: "Seçenekler", body: [
    { b: "-n", t: "  sayısal: 35 < 100 (düz sort karakterleri karşılaştırır: '1' < '3' olduğundan \"100\" < \"35\")." },
    { b: "-r", t: "  ters sıra (en büyük önce)." },
    { b: "-t,", t: "  alan ayırıcı virgüldür." },
    { b: "-k5", t: "  5. alana göre sırala (burada: final notu)." },
    { b: "-u", t: "  benzersiz: tekrarlanan satırları at." },
  ], bodySize: 13.5 });
  s.addNotes("Bu slayttaki tuzak: -n olmadan '100', '35'ten ÖNCE gelir, çünkü sort karakter karakter karşılaştırır. İkinci tuzak, sık yapılan hatalar slaytında geliyor: 'id,name,...' başlık satırı da veridir — tail -n +2 2. satırdan başlar ve onu atlar. -k5 '5. alandan satır sonuna kadar' demektir; final son alan olduğundan sorun yok; genelde -k5,5 yazın. Sıralama yerel ayara (locale) da bağlıdır (labda LC_ALL=C.UTF-8 kullanıyoruz; Türkçe bir yerel ayar harfleri farklı sıralayabilir).");

  // 22 ── uniq
  s = d.content({ kicker: "UNIQ", title: "uniq: Bitişik Tekrarları Birleştirir — Önce Sıralayın!" });
  term(s, MX, 1.65, 6.3, 5.2, sess("sort_uniq", ["uniq -c data/cities.txt | head -n 4", "sort data/cities.txt | uniq -c", "sort data/cities.txt | uniq -c | sort -rn | head -n 3"]), 11.5);
  term(s, MX + 6.55, 1.65, 5.6, 1.9, sess("sort_uniq", ["cut -d, -f2 data/students.csv | sort | uniq -d"]), 10);
  d.card(s, MX + 6.55, 3.75, 5.6, 3.1, { title: "Unutmayın", body: [
    "uniq bir satırı yalnızca hemen önceki satırla karşılaştırır.",
    { b: "-c", t: " her grubu say;  " },
    { b: "-d", t: " yalnızca tekrarlanan satırları yaz (burada: iki kez geçen adlar)." },
    { b: "sort | uniq -c | sort -rn", t: " = \"her birinden kaç tane, en sık olan önce\" — günün en yararlı boru hattı." },
  ], bodySize: 13 });
  s.addNotes("Sıralanmamış dosyada uniq -c, Antalya 6 kez geçtiği hâlde '1 Antalya' bildirir: altı satır yan yana değildir. sort'tan sonra eşit satırlar bitişiktir ve sayılar doğrudur; 2 + 6 + 5 + 5 + 1 + 2 + 4 + 5 = 30 satır, bu da wc -l data/cities.txt ile tutar. Eşitlikler sabit bir sırada kalır: sort -rn ile eşit sayılar satırın geri kalanına göre ters sıralanır (Trabzon, Eskisehir'den önce). students.csv'de dört öğrenci adı iki kez geçer: aynı adı taşıyan farklı öğrenciler (farklı numaralar).");

  // 23 ── cut ve wc
  s = d.content({ kicker: "cut · wc", title: "cut Sütun Alır, wc Sayar" });
  term(s, MX, 1.65, 7.4, 5.2, sess("cut_tr_wc", ["head -n 3 data/students.csv | cut -d, -f2,5", 'head -n 2 logs/access.log | cut -d" " -f1,7,9', "head -n 3 logs/system.log | cut -c12-16", "wc logs/system.log", "wc -l data/*"]), 11.5);
  d.card(s, MX + 7.65, 1.65, 4.5, 3.05, { title: "cut", body: [
    { b: "-d','  -f2,5", t: "  virgülle ayrılmış 2. ve 5. alanlar." },
    { b: "-d\" \"  -f7", t: "  tek boşlukla ayrılmış 7. alan." },
    { b: "-c12-16", t: "  12–16. karakterler (sabit sütunlar)." },
  ], bodySize: 13.5 });
  d.card(s, MX + 7.65, 4.9, 4.5, 1.95, { title: "wc", body: "Satır, sözcük ve bayt sayısını yazar: 120 satır, 669 sözcük, 5207 bayt. Yalnızca biri için -l, -w, -c.", bodySize: 13.5 });
  s.addNotes("cut alanları 1'den sayar. -c için karakterler de 1'den sayılır: '2026-10-12 09:00:00 ...' içinde 12–16. karakterler saat ve dakikadır. Birden çok dosyayla wc bir 'total' satırı ekler. Sorun: syllabus.txt'nin yalnızca sözcüklerini nasıl sayarsınız? (wc -w docs/syllabus.txt.)");

  // 24 ── tr
  s = d.content({ kicker: "tr", title: "tr: Karakterleri Dönüştür, Sil ve Sıkıştır" });
  term(s, MX, 1.65, 7.4, 5.2, sess("cut_tr_wc", ["head -n 2 docs/linux_quotes.txt | tr a-z A-Z", 'head -n 2 data/students.csv | tr "," ";"', 'echo "Hello, World!" | tr -d ",!"', 'head -n 3 logs/system.log | cut -d" " -f4', 'head -n 3 logs/system.log | tr -s " " | cut -d" " -f4-']), 10.5);
  d.card(s, MX + 7.65, 1.65, 4.5, 2.6, { title: "Üç iş", body: [
    { b: "tr a-z A-Z", t: "  1. kümenin her karakterini 2. kümedeki karşılığıyla değiştirir." },
    { b: "tr -d küme", t: "  bu karakterleri siler." },
    { b: "tr -s \" \"", t: "  tekrarları teke indirir." },
  ], bodySize: 13 });
  d.card(s, MX + 7.65, 4.45, 4.5, 2.4, { title: "Boş satırlar neden?", titleColor: C.red, fill: ROSE, body: "\"INFO  network\" içinde İKİ boşluk var, bu yüzden cut boş bir 4. alan görür. tr -s \" \" önce onları sıkıştırır; -f4- 4. alandan sona kadar demektir.", bodySize: 13 });
  s.addNotes("tr yalnızca stdin'i okur — asla dosya adı almaz; bu yüzden < dosya ya da bir boru kullanın. system.log'da düzey 5 karaktere tamamlanmıştır (INFO ve WARN fazladan bir boşluk alır, ERROR almaz): tek boşluk ayırıcılı bir cut, iki boşluğu aralarında boş bir alan olarak görür. tr -s bunun standart çözümüdür. tr sözcüklerle değil tek tek karakterlerle (baytlarla) çalışır: tr \"cat\" \"dog\" her yerde c'yi d, a'yı o, t'yi g yapar.");

  // 25 ── özet tablo
  s = d.tableSlide({
    kicker: "Hızlı başvuru", title: "Bir Bakışta Yönlendirme ve Filtreler",
    header: ["Ne yapmak istiyorsunuz?", "Kullanın", "Bugünden örnek"],
    colW: [3.6, 2.6, 5.95],
    rows: [
      ["çıktıyı kaydet / ekle", "> f   >> f", "ls data > list.txt"],
      ["girdiyi dosyadan oku", "< f", "wc -l < logs/access.log"],
      ["hataları kaydet ya da gizle", "2> f   2> /dev/null", "find . -name \"*.md\" 2> /dev/null"],
      ["her şeyi tek dosyaya", "> f 2>&1   &> f", "ls data nosuch > all.txt 2>&1"],
      ["iki programı bağla", "kmt1 | kmt2", "grep ERROR logs/system.log | wc -l"],
      ["eşleşen satırları bul", "grep -i -n -v -c -w -r", "grep -c \" 404 \" logs/access.log"],
      ["satırları sırala", "sort -n -r -t, -k", "sort -t, -k5 -nr data/students.csv"],
      ["her değeri say", "sort | uniq -c", "sort data/cities.txt | uniq -c"],
      ["sütun al", "cut -d -f / -c", "cut -d, -f2,5 data/students.csv"],
      ["karakter değiştir", "tr   tr -d   tr -s", "tr a-z A-Z < docs/linux_quotes.txt"],
    ],
    fontSize: 14, y: 1.6,
  });
  s.addNotes("Öğrenciler bu slaytın fotoğrafını çekebilir; komutların tam başvuru tablosu ders notlarındadır ('Komut Başvuru Tablosu' bölümü). Boru satırının altındakilerin hepsi filtredir: dosyaları ya da stdin'i okur, stdout'a yazar.");

  // 26 ── Mola
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Mola", subtitle: "Sırada: head, tail, tee, find, xargs — ardından gerçek sorular, tek satırlık boru hatlarıyla." });
  s.addNotes("On dakika. Öğrencilerden mola sırasında bash mcmp117_lab_setup.sh komutunu yeniden çalıştırmalarını isteyin; böylece herkesin taze ve özdeş bir lab klasörü olur.");

  // ───────────────────────── BÖLÜM 4: DİĞER ARAÇLAR
  s = d.content({ kicker: "HEAD · TAIL · TEE", title: "Boru Hatlarında head, tail ve tee" });
  term(s, MX, 1.65, 7.6, 3.2, sess("head_tail_tee", ["tail -n +2 data/students.csv | head -n 2", "head -n 120 logs/access.log | tail -n 1", 'grep " 500 " logs/access.log | tee errors_500.txt | wc -l', "wc -l errors_500.txt"]), 10.5);
  {
    const y = 5.15;
    d.box(s, MX, y, 1.6, 0.8, "grep", { fill: C.charcoal, size: 14, font: F.code });
    d.box(s, MX + 2.4, y, 1.6, 0.8, "tee", { fill: C.mintDeep, size: 14, font: F.code });
    d.box(s, MX + 4.8, y, 1.6, 0.8, "wc -l", { fill: C.charcoal, size: 14, font: F.code });
    d.box(s, MX + 2.4, y + 1.0, 1.6, 0.65, "errors_500.txt", { fill: C.mint, size: 11, font: F.code, color: C.dark });
    d.arrow(s, MX + 1.62, y + 0.4, MX + 2.38, y + 0.4, { color: C.mintDeep, w: 2 });
    d.arrow(s, MX + 4.02, y + 0.4, MX + 4.78, y + 0.4, { color: C.mintDeep, w: 2 });
    d.arrow(s, MX + 3.2, y + 0.82, MX + 3.2, y + 0.98, { color: C.mintDeep, w: 2 });
    d.text(s, "tee = bir T bağlantısı: dosyaya kopyalar VE iletir", { x: MX + 4.4, y: y + 1.0, w: 3.2, h: 0.6, fontSize: 12, italic: true, color: C.mutedOnLight });
  }
  d.card(s, MX + 7.85, 1.65, 4.3, 5.2, { title: "Yararlı biçimler", body: [
    { b: "head -n 5", t: "  ilk 5 satır." },
    { b: "tail -n 5", t: "  son 5 satır." },
    { b: "tail -n +2", t: "  2. satırdan itibaren: başlığı atlar." },
    { b: "head -n 120 | tail -n 1", t: "  tam olarak 120. satır." },
    { b: "tail -f log", t: "  büyüyen bir dosyayı izle (durdurmak için Ctrl+C)." },
    { b: "tee -a f", t: "  üzerine yazmak yerine sona ekle." },
  ], bodySize: 13.5 });
  s.addNotes("tee, adını tesisatçıların kullandığı T biçimli boru parçasından alır. Bir boru hattının ara sonucunu kaydedip yine de devam etmenin yolu budur. Tipik bir yönetici kullanımı: root'a ait bir dosyaya yazmak için sudo tee (çünkü sudo komut > dosya yönlendirmesi SİZİN kabuğunuzda, root hakları olmadan uygulanır — 11. haftayla güzel bir bağlantı). tail -f, yöneticilerin günlükleri canlı izleme yoludur; vakit kalırsa bir terminalde tail -f logs/system.log, diğerinde echo test >> logs/system.log ile gösterin.");

  // 28 ── find
  s = d.content({ kicker: "FIND", title: "find: Dizin Ağacında Ad, Tür, Boyut ve Yaşa Göre Arama" });
  term(s, MX, 1.65, 7.0, 5.2, sess("find_xargs", ['find docs -name "*.txt"', "find . -type d -name src", "find . -size +10k", 'find photos -iname "*.jp*g" | wc -l', 'touch -d "2026-09-01" docs/notes_01.txt', "find docs -mtime +30"]), 11);
  s.addTable([
    ["Sınama", "Anlamı"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 14 } })),
    ...[["-name \"*.txt\"", "ad eşleşir (joker karakterler tırnakta)"], ["-iname", "aynısı, harf büyüklüğüne bakmadan"], ["-type f / d", "normal dosya / dizin"], ["-size +10k", "10 KiB'tan büyük (-10k: küçük)"], ["-mtime +30", "30 günden daha önce değiştirilmiş"], ["-mtime -1", "son 24 saatte değiştirilmiş"]]
      .map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: j === 0 ? F.code : F.body, fontSize: 12.5 } }))),
  ], { x: MX + 7.25, y: 1.65, w: 4.9, colW: [1.75, 3.15], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [4, 6, 4, 6], valign: "middle" });
  d.card(s, MX + 7.25, 5.15, 4.9, 1.7, { body: "Biçim: find NEREDE SINAMALAR. Birden çok sınama = hepsi sağlanmalı (VE). ls'in aksine find, NEREDE'nin altındaki bütün ağacı dolaşır.", bodySize: 13 });
  s.addNotes("\"*.txt\" çevresindeki tırnaklar şarttır: onlar olmadan kabuk, find başlamadan önce *.txt'yi ŞU ANKİ dizinde genişletir (10. hafta: joker karakterleri kabuk genişletir). -mtime +30'un bulacak bir şeyi olsun diye notes_01.txt'ye touch -d ile eski bir değiştirilme zamanı verdik. find'ın çıktı sırası dizindeki girdilerin sırasıdır, sıralı değildir (sıra gerekiyorsa sort'a boruyla verin). -size +10k: yalnızca access.log (23.604 bayt) 10 KiB = 10.240 bayttan büyüktür. 14 fotoğraf: 12 img0NN.jpg, IMG_014.JPG ve holiday.jpeg; img013.png eşleşmez.");

  // 29 ── -exec / xargs
  s = d.content({ kicker: "FIND · XARGS", title: "find'ın Bulduklarıyla İş Yapmak: -exec ve xargs" });
  term(s, MX, 1.65, 7.4, 5.2, sess("find_xargs", ['find . -name "*.c" -exec wc -l {} \\;', 'find . -name "*.c" | xargs wc -l', 'find docs -name "*.txt" | xargs wc -l', 'find docs -name "*.txt" -print0 | xargs -0 wc -l']), 10.5);
  d.card(s, MX + 7.65, 1.65, 4.5, 3.05, { title: "İki yol", body: [
    { b: "-exec kmt {} \\;", t: "  kmt'yi her dosya için bir kez çalıştırır; {} = dosya adı." },
    { b: "| xargs kmt", t: "  stdin satırlarını ARGÜMANLARA çevirir: tüm adlarla tek bir wc (toplama bakın)." },
    { b: "-print0 | xargs -0", t: "  boşluklu adlar için güvenli." },
  ], bodySize: 13 });
  d.card(s, MX + 7.65, 4.9, 4.5, 1.95, { title: "Güvenlik", titleColor: C.red, fill: ROSE, body: "find … -exec rm {} \\; ya da … | xargs rm demeden önce aynı satırı rm OLMADAN çalıştırıp listeyi okuyun. rm geri alınamaz.", bodySize: 13.5 });
  s.addNotes("stdin ile argümanlar arasındaki fark: wc stdin'i VERİ olarak okur, oysa biz dosya ADLARINI argüman olarak istiyoruz; bu dönüşümü xargs yapar. Üçüncü komut gerçek bir başarısızlıktır: 'final report.txt' bir boşluk içerir, xargs onu 'docs/final' ve 'report.txt' diye iki ada böldü ve wc yakındı (23 toplamında dosyanın 2 satırı eksik). -print0 adları bir dosya adında bulunamayacak sıfır baytıyla ayırır; xargs -0 yalnızca orada böler: toplam 25.");

  // 30 ── Bölüm 5
  s = d.sectionSlide({ kicker: "Bölüm 5", title: "Gerçek Veri, Tek Satırlık Yanıtlar", subtitle: "logs/access.log · logs/system.log · data/students.csv" });
  s.addNotes("Şimdi her şeyi birlikte kullanıyoruz. Yöntem komutlardan daha önemlidir: veriye bakın, sütunu bulun, sonra her seferinde bir aşama ekleyin.");

  // 31 ── veri anatomisi
  s = d.content({ kicker: "Verinizi tanıyın", title: "Hangi Alan Nerede?" });
  {
    const fields = ["10.0.1.10", "-", "-", "[12/Oct/2026:08:00:00", "+0300]", "\"GET", "/about.html", "HTTP/1.1\"", "404", "442"];
    const names = ["IP", "", "", "tarih ve saat", "dilim", "yöntem", "sayfa", "protokol", "durum", "bayt"];
    const cw = 0.112, pad = 0.2, total = fields.reduce((a, f) => a + f.length * cw + pad, 0);
    const scale = 12.15 / (total + 0.06 * 9);
    let x = MX;
    d.text(s, "logs/access.log  —  cut -d\" \" -fN", { x: MX, y: 1.6, w: 8, h: 0.35, fontSize: 14, bold: true, color: C.mintDeep });
    fields.forEach((f, i) => {
      const w = (f.length * cw + pad) * scale;
      label(s, `-f${i + 1}`, x, 1.98, w, { fontSize: 11, bold: true, color: C.mintDeep, italic: false });
      const hot = [0, 6, 8].includes(i);
      d.box(s, x, 2.3, w, 0.5, f, { fill: hot ? C.mint : C.light, size: 12, font: F.code, bold: hot, color: C.dark });
      if (names[i]) label(s, names[i], x - 0.1, 2.83, w + 0.2, { fontSize: 10.5 });
      x += w + 0.06 * scale;
    });
    // system.log
    d.text(s, "logs/system.log  —  sabit sütunlar: cut -cA-B", { x: MX, y: 3.35, w: 8, h: 0.35, fontSize: 14, bold: true, color: C.mintDeep });
    const sys = [["2026-10-12", "1-10", "tarih"], ["09:11:00", "12-19", "saat (saat: 12-13)"], ["WARN ", "21-25", "düzey"], ["high memory usage", "27-", "ileti"]];
    let sx = MX;
    sys.forEach(([t, r, n], i) => {
      const w = [1.6, 1.75, 1.15, 2.45][i];
      label(s, `-c${r}`, sx, 3.73, w, { fontSize: 11, bold: true, color: C.mintDeep, italic: false });
      d.box(s, sx, 4.05, w, 0.5, t, { fill: i === 3 || i === 2 ? C.mint : C.light, size: 12, font: F.code, color: C.dark });
      label(s, n, sx, 4.58, w, { fontSize: 10.5 });
      sx += w + 0.1;
    });
    // students.csv
    d.text(s, "data/students.csv  —  cut -d, -fN  (1. satır başlıktır!)", { x: MX, y: 5.05, w: 9, h: 0.35, fontSize: 14, bold: true, color: C.mintDeep });
    const st = [["2026001", "numara"], ["Elif Yilmaz", "ad"], ["ECT", "bölüm"], ["96", "vize"], ["99", "final"]];
    let cx = MX;
    st.forEach(([t, n], i) => {
      const w = [1.6, 2.2, 1.4, 1.4, 1.4][i];
      label(s, `-f${i + 1}`, cx, 5.43, w, { fontSize: 11, bold: true, color: C.mintDeep, italic: false });
      d.box(s, cx, 5.75, w, 0.5, t, { fill: i >= 2 ? C.mint : C.light, size: 12, font: F.code, color: C.dark });
      label(s, n, cx, 6.28, w, { fontSize: 10.5 });
      cx += w + 0.1;
    });
    d.card(s, MX + 8.6, 3.35, 3.55, 3.5, { title: "Her boru hattından önce", body: ["Dosyaya head -n 3 ile bakın.", "Ayırıcıyı bulun: boşluk, virgül, sabit sütunlar?", "Alanları 1'den sayın."], bodySize: 13.5 });
  }
  s.addNotes("Bu, access.log'un tek boşluklarda bölünmüş ilk satırıdır — 10 alan. 4. alan tarihi VE saati içerir; cut -d: -f2 saati verir (iki noktadan bölündüğünde 2. alan). system.log'un sütunları sabit genişliktedir (düzey 5 karaktere tamamlanmıştır), bu yüzden doğal araç cut -c'dir. students.csv virgülle ayrılmıştır ve bir başlık satırı vardır: tail -n +2'yi unutmayın.");

  // 32 ── adım adım
  s = d.content({ kicker: "Yöntem", title: "Boru Hattını Her Seferinde Bir Aşama Ekleyerek Kurun" });
  term(s, MX, 1.65, 7.7, 5.2, sess("analysis", [['cut -d" " -f9 logs/access.log | head -n 3'], ['cut -d" " -f9 logs/access.log | sort | head -n 3'], 'cut -d" " -f9 logs/access.log | sort | uniq -c | sort -rn']), 10.5);
  {
    const st = [["1", "Çıkar", "gereken sütunu cut ile alın; head ile denetleyin."], ["2", "Grupla", "sort eşit değerleri bir araya getirir."], ["3", "Say", "uniq -c her grubu sayar."], ["4", "Sırala", "sort -rn: en büyük sayı önce; ilk N için head -n N."]];
    st.forEach((r, i) => {
      const y = 1.65 + i * 1.32;
      d.box(s, MX + 7.95, y, 0.6, 1.12, r[0], { fill: C.mint, size: 20, font: F.title });
      d.card(s, MX + 8.65, y, 3.5, 1.12, { title: r[1], body: r[2], bodySize: 13, titleSize: 14 });
    });
  }
  s.addNotes("Gerçek çıktı. Yanıt: 300 isteğin 148'i (%49,3) 200 OK ile başarılı oldu; 57'si 404 Not Found; 24'ü 500 Internal Server Error. Denetim: 148 + 57 + 34 + 24 + 20 + 17 = 300 = wc -l. Alışkanlığı öğretin: 6 aşamalı bir boru hattını asla tek seferde yazmayın. Yukarı oka basın, bir aşama ekleyin, sonuca bakın, tekrarlayın. Durum kodları: 2xx başarı, 3xx yeniden yönlendirme (304 = değişmedi, önbellekteki kopyanızı kullanın), 4xx istemci hatası (403 yasak, 404 bulunamadı), 5xx sunucu hatası.");

  // 33 ── access.log analizleri
  s = d.content({ kicker: "Analiz · access.log", title: "En Çok İstenen Sayfalar, En Sık Ziyaretçiler, Kırık Bağlantılar" });
  term(s, MX, 1.65, 12.15, 5.2, sess("analysis", ['cut -d" " -f7 logs/access.log | sort | uniq -c | sort -rn | head -n 5', 'cut -d" " -f1 logs/access.log | sort | uniq -c | sort -rn | head -n 3', 'grep " 404 " logs/access.log | cut -d" " -f7 | sort | uniq -c | sort -rn | head -n 3']), 12);
  s.addNotes("Aynı 4 adımlı tarif, farklı sütun: 7. alan = sayfa, 1. alan = IP adresi. Üçüncü boru hattı önce SÜZER (404 satırlarını grep ile alır), sonra sayfayı çıkarır: en sık kırık bağlantı /images/logo.png, 9 kez. Kalıptaki 404'ün çevresindeki boşluklara dikkat: \" 404 \" — böylece 4042 gibi bir bayt sayısı eşleşemez. Eşitlikler: /index.html ve /images/logo.png'nin ikisi de 33 istek almış; head -n 5 ikisini de gösterir.");

  // 34 ── system.log + students
  s = d.content({ kicker: "Analiz · system.log ve students.csv", title: "Saat Başına Hatalar, Uyarılar, Bölümler, En İyi Finaller" });
  term(s, MX, 1.65, 12.15, 2.75, sess("analysis", ["grep -c ERROR logs/system.log", "grep ERROR logs/system.log | cut -c12-13 | uniq -c", "grep WARN logs/system.log | cut -c27- | sort | uniq -c"]), 11);
  term(s, MX, 4.6, 12.15, 2.25, sess("analysis", ["tail -n +2 data/students.csv | cut -d, -f3 | sort | uniq -c | sort -rn", "tail -n +2 data/students.csv | sort -t, -k5 -nr | head -n 3 | cut -d, -f2,3,5"]), 11);
  s.addNotes("Saat başına hatalar: burada uniq -c sort OLMADAN çalışır, çünkü günlük zaten saat sırasındadır — saatler bitişiktir. 11 ve 15'te hata yok, bu yüzden bu saatler yalnızca eksiktir (uniq orada olmayanı sayamaz). 3 + 4 + 1 + 3 + 2 = 13, grep -c ile tutar. WARN: 11 + 17 = 28. Bölümler: 17 + 11 + 10 + 2 = 40 öğrenci, başlık çıkarıldığında 41 satırla tutar. Son boru hattı BÜTÜN satırı 5. alana göre sıralar ve göstermek istediğimiz sütunları ancak ondan sonra keser.");

  // 35–36 ── Lab alıştırmaları
  function labSlide(kicker, title, items, notes) {
    const s = d.content({ kicker, title });
    items.forEach((it, i) => {
      const col = i % 2, row = Math.floor(i / 2), w = 5.95, h = 1.12;
      const x = MX + col * 6.2, y = 1.65 + row * (h + 0.2);
      s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
      d.box(s, x + 0.15, y + 0.22, 0.75, 0.68, it[0], { fill: C.mintDeep, size: 14, font: F.title });
      d.text(s, it[1], { x: x + 1.05, y, w: w - 1.2, h, fontSize: 13, valign: "middle" });
    });
    s.addNotes(notes);
    return s;
  }
  labSlide("Sınıf içi lab · 1 / 2", "Lab: Yönlendirme ve grep (A ve B bölümleri)", [
    ["A1", "data/ dizininin dosya listesini list.txt'ye kaydedin, sonra docs/ listesini ekleyin. Kaç satır?"],
    ["A2", "ls data nosuch komutunu, liste ok.txt'ye, hata err.txt'ye gidecek şekilde çalıştırın."],
    ["A3", "logs/system.log'un yalnızca satır sayısını yazdırın — dosya adı olmadan."],
    ["A5", "find . -name \"*.md\" okuyamadığınız bir klasör için yakınıyor. Yalnızca hataları gizleyin."],
    ["B2", "system.log'un INFO OLMAYAN ilk 3 satırını satır numaralarıyla gösterin."],
    ["B3", "access.log'daki kaç istek 404 durumunu aldı?"],
    ["B4", "Hangi öğrenciler EE bölümünde?"],
    ["B5", "10.0.5.38 adresinden kaç istek geldi? (Noktalara dikkat!)"],
  ], "Öğrenciler iki slayt üzerinde 30-40 dakika tek başına ya da ikili çalışır. Tam Lab Föyü (20 puanlanan alıştırma, A-D bölümleri, 100 puan) ve tam çözümleri ders notlarındadır; A4 ve B1 notlara bırakıldı. Sınıfta dolaşın: en sık sorunlar, boşluklu kalıpların tırnaklarını unutmak ve CSV başlığı için tail -n +2'yi unutmaktır. A5 için önce okunamayan klasörü find slaytındaki gibi oluşturun: mkdir secret && chmod 000 secret (sonra chmod 755 secret; rmdir secret ile kaldırın).");
  labSlide("Sınıf içi lab · 2 / 2", "Lab: Tek Satırlık Boru Hatları (C ve D bölümleri)", [
    ["C1", "Her bölümde kaç öğrenci var?"],
    ["C2", "Final notuna göre ilk 3 öğrencinin adları ve final notları."],
    ["C4", "Web sitesinin en çok istenen 3 sayfası."],
    ["C5", "En çok 404 hatasını hangi sayfa üretti?"],
    ["C6", "system.log her saatte kaç ERROR satırı içeriyor?"],
    ["D1", "students.csv'de hangi öğrenci adları birden çok kez geçiyor?"],
    ["D2", "Tüm 500 durumlu satırları errors_500.txt'ye kaydedin VE kaç tane olduklarını yazdırın — tek satırda."],
    ["D4", "Siteyi kaç farklı IP adresi ziyaret etti? En az isteği hangisi yaptı?"],
  ], "Yanıtlar (notlarla denetleyin): C1 CS 10, ECT 17, EE 2, ME 11. C2 Onur Dogan 100, Elif Yilmaz 99, Emre Dogan 98. C4 /courses/mcmp117 41, /about.html 37, /index.html 33 (/images/logo.png 33 ile eşit). C5 /images/logo.png (9). C6 09:3, 10:4, 12:1, 13:3, 14:2. D1 Elif Yilmaz, Mehmet Aydin, Onur Dogan, Selin Yildiz. D2 grep \" 500 \" logs/access.log | tee errors_500.txt | wc -l, sonuç 24. D4 6 adres; 37 istekle 10.0.5.38. Öğrencilerin çoğu denemeden yanıtları göstermeyin.");

  // 37 ── sık yapılan hatalar
  s = d.content({ kicker: "Sık yapılan hatalar", title: "Herkesin Bir Kez Yaptığı Altı Hata" });
  term(s, MX, 1.65, 5.6, 5.2, sess("mistakes", ["cp data/cities.txt c.txt", "sort c.txt > c.txt", "wc -l c.txt", ["grep user login logs/system.log", 2], "ls data > wc", "ls", "sort -t, -k5 -n data/students.csv | head -n 2"]), 10.5);
  {
    const m = [
      ["sort f > f", "Kabuk f'yi sort okumadan ÖNCE boşaltır: 0 satır. Yeni dosyaya yazın, sonra mv."],
      ["grep user login f", "Tırnaksız: grep \"user\"ı login adlı bir dosyada arar. \"user login\" yazın."],
      ["ls data > wc", "> | değildir. Bu, wc adlı bir dosya oluşturur. ls data | wc -l yazın."],
      ["Başlık satırı", "\"id,name,…\" -n ile 0 gibi sıralanır. Atlayın: tail -n +2."],
      ["sort'suz uniq", "Yalnızca bitişik tekrarları sayar. sort | uniq -c kullanın."],
      ["2>&1 > f", "Sıra soldan sağadır: hata ekranda kalır. > f 2>&1 yazın."],
    ];
    m.forEach((r, i) => {
      const col = i % 2, row = Math.floor(i / 2), w = 3.15, h = 1.6;
      d.card(s, MX + 5.85 + col * (w + 0.15), 1.65 + row * (h + 0.2), w, h, { title: r[0], body: r[1], bodySize: 12.5, titleSize: 13.5, titleColor: C.red });
    });
  }
  s.addNotes("Hepsi gerçek çıktı (code/demo_mistakes.sh). sort c.txt > c.txt: önce yönlendirme işlenir, c.txt'yi 0 bayta kırpar, sonra sort boş bir dosya okur. (sort -o c.txt c.txt güvenli tek yerinde biçimdir, çünkü sort çıktı dosyasını açmadan önce her şeyi okur.) grep user login: 'grep: login: No such file or directory' — ama yine de system.log'da aradı ve dosya adı önekiyle 15 satır yazdırdı. ls data > wc: hiç hata yok, yalnızca wc adında şaşırtıcı yeni bir dosya. find slaytındaki boşluklu adlarla xargs sorununu da hatırlatın.");

  // 38 ── kısa sınav
  s = d.quizSlide({ questions: [
    "kmt > out.txt 2>&1  ile  kmt 2>&1 > out.txt  arasındaki fark nedir?",
    "Antalya 6 kez geçtiği hâlde  uniq -c data/cities.txt  neden \"1 Antalya\" bildirir? Düzeltin.",
    "logs/access.log'da en çok istek yapan 3 IP adresini yazdıran bir boru hattı yazın.",
    "Kabuk  grep ERROR logs/system.log | wc -l  komutunu çalıştırmak için hangi sistem çağrılarını kullanır?",
  ] });
  s.addNotes("Yanıtlar. (1) İlki hem stdout'u hem stderr'i dosyaya gönderir; ikincisinde fd 2, fd 1 henüz terminalken ondan kopyalanır, bu yüzden hatalar ekranda kalır. (2) uniq yalnızca BİTİŞİK eşit satırları birleştirir; önce sıralayın: sort data/cities.txt | uniq -c. (3) cut -d\" \" -f1 logs/access.log | sort | uniq -c | sort -rn | head -n 3 (58 10.0.2.17, 56 10.0.4.31, 52 10.0.6.45). (4) pipe() (pipe2), iki kez fork() (clone), her çocukta dup2() (grep: dup2(4,1), wc: dup2(3,0)), her çocukta execve(), sonra ikisini de bekleme (wait).");

  // 39 ── akılda kalması gerekenler
  s = d.content({ kicker: "Toparlama", title: "12. Hafta: Akılda Kalması Gerekenler" });
  d.bullets(s, [
    { b: "Standart akışlar:", t: " her süreç fd 0 (stdin), 1 (stdout), 2 (stderr) ile başlar — 2–3. haftalarda izlediğimiz aynı write(1, …)." },
    { b: "Yönlendirme:", t: " > >> < 2> 2>&1 &> /dev/null. Kabuk dosyayı açar ve fork() ile exec() arasında dup2() kullanır; program bunu hiç bilmez." },
    { b: "Sıra:", t: " yönlendirmeler soldan sağa uygulanır: > f 2>&1 iki akışı da yakalar, 2>&1 > f yakalamaz." },
    { b: "Borular:", t: " kmt1 | kmt2 iki süreci eşzamanlı çalıştırır; aralarında bir çekirdek tamponu vardır (sınırlı tampon, 5. hafta)." },
    { b: "Filtreler:", t: " grep (-i -n -v -c -w -r, ^ $ . [ ] *), sort (-n -r -t -k), uniq (-c -d, sort'tan sonra), cut, wc, tr, head, tail, tee." },
    { b: "find + xargs:", t: " ağaçta ad, tür, boyut ve yaşa göre arama; boşluklu adlar için -print0 | xargs -0." },
    { b: "Yöntem:", t: " çıkar → sort → uniq -c → sort -rn → head; her seferinde bir aşama." },
  ], { fontSize: 19, y: 1.7, h: 5.15, paraSpaceAfter: 14 });
  s.addNotes("Bunları hızlıca okuyun. En önemli tek fikir: yönlendirme ve borular tek tek programların özellikleri değildir — program başlamadan önce kabuk tarafından, üç sistem çağrısıyla yapılır.");

  // 40–41 ── kapanış
  d.closing({ nextWeek: "Süreçler ve İş Denetimi (13. hafta)", nextItems: [
    "ps, pstree, top: süreçleri, PID'leri ve durumları izlemek (3. hafta)",
    "Ön plan ve arka plan: &, jobs, fg, bg, Ctrl+Z, Ctrl+C",
    "Sinyaller: kill, SIGTERM ile SIGKILL — ve yes | head neden durur?",
    "nice ve renice: süreç önceliği (5. hafta)",
    "Kendi gözünüzle görebileceğiniz bir zombi süreç",
  ] });
  d.pres.slides[d.n - 2].addNotes("Gelecek hafta bugün oluşturduğumuz süreçlere dışarıdan bakıyoruz: ps onları gösterir, sinyaller onları durdurur, kabuğun iş denetimi (job control) onları ön plan ile arka plan arasında taşır. Bugün yes'i durduran SIGPIPE de bu sinyallerden biridir. Gelecek haftaya kadar: notlardaki Lab Föyü'nü bitirin.");
  d.pres.slides[d.n - 1].addNotes("Soruları alın. Öğrencilere Telegram kanalındaki soruların herkese yardımcı olduğunu ve tüm gösterim betiklerinin ve gerçek çıktılarının haftanın code klasöründe bulunduğunu hatırlatın.");

  await d.save(path.join(__dirname, "MBLP131_Hafta12.pptx"));
  console.log("slides:", d.n);
})();
