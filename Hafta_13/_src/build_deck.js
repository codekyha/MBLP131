// Hafta 13 sunumu (MBLP131, Türkçe): Süreçler ve İş Denetimi (uygulamalı Linux; 3. ve 5. haftalarla bağlantılı)
// İngilizce referans: ../week13/build_deck.js (aynı slayt sırası, aynı diyagramlar, aynı sayılar, aynı çıktılar)
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("../lib/deck");
const d = new Deck({ week: 13, lang: "tr", assets: path.join(__dirname, "../lib") });
const P = d.pres;
const PALE = "D7E9E6", ROSE = "F6E3E0", SAND = "F5EBD7";

// ---------- yakalanmış çıktı yardımcıları ----------
const raw = f => fs.readFileSync(path.join(__dirname, "code", f), "utf8");
function expandTabs(l) {               // sekmeleri terminaldeki gibi 8 sütunluk duraklara aç
  let o = "";
  for (const ch of l) { if (ch === "\t") { do o += " "; while (o.length % 8); } else o += ch; }
  return o;
}
const outLines = f => raw(f).replace(/\n$/, "").split("\n").map(expandTabs);
// yakalanmış bir dosyanın a..b satırları (1'den başlar, b dahil)
const L = (f, a, b) => outLines(f).slice(a - 1, b).join("\n");
const cut = (t, n) => t.split("\n").map(l => (l.length > n ? l.slice(0, n - 1) + "…" : l)).join("\n");

// koyu terminal kutusu: istem nane renginde, yazılan komut kalın beyaz, çıktı açık gri,
// "# ..." açıklamaları (bizim kırpma notlarımız) soluk gri
function term(s, x, y, w, h, text, size = 11) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.dark }, rectRadius: 0.05, line: { type: "none" } });
  const lines = text.replace(/\n$/, "").split("\n"), runs = [];
  lines.forEach((ln, i) => {
    const br = i < lines.length - 1;
    const m = ln.match(/^(student@okan-lab:[^$]*\$ )(.*)$/);
    if (m) {
      runs.push({ text: m[1], options: { color: C.mint } });
      runs.push({ text: m[2] || " ", options: { color: C.white, bold: true, breakLine: br } });
    } else if (/^# /.test(ln)) {
      runs.push({ text: ln, options: { color: C.mutedOnDark, italic: true, breakLine: br } });
    } else {
      runs.push({ text: ln.length ? ln : " ", options: { color: "D9DEE0", breakLine: br } });
    }
  });
  s.addText(runs, { x: x + 0.18, y: y + 0.12, w: w - 0.36, h: h - 0.24, fontFace: F.code, fontSize: size, valign: "top", margin: 0, lineSpacingMultiple: 1.0, isTextBox: true });
}
function badge(s, x, y, t, fill = C.mint, w = 0.46) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.4, fill: { color: fill }, rectRadius: 0.2, line: { color: C.white, width: 1.5 } });
  d.text(s, t, { x, y, w, h: 0.4, fontSize: 13, bold: true, fontFace: F.code, color: fill === C.mint ? C.dark : C.white, align: "center", valign: "middle" });
}
function stateBox(s, x, y, w, h, label, fill, letter, lw) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: 0.18, line: { type: "none" } });
  const fg = [C.charcoal, C.slate, C.mintDeep].includes(fill) ? C.white : C.charcoal;
  d.text(s, label, { x, y, w, h, fontFace: F.title, fontSize: 16, bold: true, color: fg, align: "center", valign: "middle" });
  if (letter) badge(s, x + w - (lw || 0.46) + 0.12, y - 0.22, letter, C.mint, lw);
}
const lab = (s, t, x, y, w, h, o = {}) => d.text(s, t, Object.assign({ x, y, w, h, fontSize: 12.5, bold: true, color: C.mintDeep, valign: "middle" }, o));

(async () => {
  // 1 ── Başlık
  let s = d.titleSlide({
    kicker: "MBLP131  ·  HAFTA 13",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 13  ·  Süreçler ve İş Denetimi",
    tagline: "Yazdığınız her komut bir sürece dönüşür. Bugün onu izlemeyi, duraklatmayı, taşımayı ve durdurmayı öğreniyorsunuz.",
  });
  s.addNotes("13. haftaya hoş geldiniz. 3. haftada süreçleri kâğıt üzerinde incelemiştik: PID'ler, beş durum, PCB, fork ve exec. 5. haftada onları önceliğe göre zamanlamıştık. Bugün aynı fikirlerle Linux kabuğunda canlı olarak karşılaşıyoruz: süreçlere bakmak için ps, top ve /proc; onları denetlemek için &, Ctrl+Z, jobs, fg ve bg; durdurmak için sinyaller ve kill; önceliklerini değiştirmek için nice; ve sonunda Z durumunu GÖREBİLMEMİZ için bir zombi oluşturan minik bir C programı. Gösterilen her şey laboratuvar makinemizde student kullanıcısıyla yakalandı.");

  // 2 ── Geçen hafta
  s = d.cardsSlide({
    kicker: "Geçen hafta", title: "Dört Fikirde 12. Hafta",
    cards: [
      { title: "Üç akış", body: "Her süreç fd 0 (stdin), 1 (stdout) ve 2 (stderr) ile başlar." },
      { title: "Yönlendirme", body: "> >> < 2> 2>&1 &> /dev/null — bunu kabuk, fork() ile exec() arasında yapar." },
      { title: "Borular", body: "cmd1 | cmd2 iki süreci aynı anda çalıştırır; aralarında bir çekirdek tamponu vardır." },
      { title: "Süzgeçler", body: "grep, sort, uniq -c, cut, wc, tr, head, tail: boru hatlarında birleşen küçük araçlar." },
    ], cols: 4, bodySize: 18,
    callout: "Geçen hafta kabuk her boru hattı için sessizce süreçler oluşturdu. Bugün bu süreçlere doğrudan bakıyoruz ve denetimlerini elimize alıyoruz.",
  });
  s.addNotes("İki dakikalık tekrar. Sorun: 'grep ERROR logs/system.log | wc -l' kaç süreç oluşturur? (İki; aynı anda çalışırlar ve bir boruyla bağlıdırlar.) Onları kim oluşturur? (Kabuk, fork ve exec ile — 3. hafta.) Bugün bir 12. hafta boru hattını yeniden kullanacağız: süreçlerimizi durumlarına göre saymak için ps ... | cut | sort | uniq -c.");

  // 3 ── Gündem
  s = d.content({ kicker: "Hafta 13", title: "Bugünün Gündemi" });
  [
    ["1", "Süreçlere bakmak", "ps, pstree, top, /proc/<pid>/status — ve R S D T Z durum harfleri."],
    ["2", "İş denetimi", "Ön plan ve arka plan, &, Ctrl+Z, Ctrl+C, jobs, fg, bg."],
    ["3", "Sinyaller", "kill, kill -l, SIGTERM, SIGKILL ve SIGINT, SIGSTOP/SIGCONT, pkill, killall, nohup."],
    ["4", "Öncelik", "nice ve renice: 5. haftanın nice değerleri, ölçülmüş olarak."],
    ["5", "Zombiler", "Z durumunu görünür kılan küçük bir C programı."],
    ["6", "Laboratuvar", "İşleri başlatmak, incelemek, askıya almak, sürdürmek ve sonlandırmak (puanlı)."],
  ].forEach((a, i) => {
    const y = 1.65 + i * 0.86;
    d.box(s, MX, y, 0.72, 0.72, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 0.9, y, w: 11.25, h: 0.72, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "   ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.2, y, w: 10.8, h: 0.72, valign: "middle" });
  });
  s.addNotes("1. ve 2. bölümler moladan önce, 3–5. bölümler moladan sonra; ardından 30–40 dakika laboratuvar çalışması. Herkesten şimdi bir terminal açmasını ve laboratuvar kurulum betiğini çalıştırmasını isteyin: bash mcmp117_lab_setup.sh, sonra cd ~/lab. Bütün gösterimler zararsız deneme süreçleri kullanır: sleep (bekler ve hiçbir şey yapmaz) ve yes (sonsuza dek 'y' yazar; çıktısını /dev/null'a gönderiyoruz, böylece yalnızca işlemci harcar).");

  // ───────────────────────── BÖLÜM 1
  s = d.sectionSlide({ kicker: "Bölüm 1", title: "Süreçlere Bakmak", subtitle: "3. hafta kâğıt üzerindeydi — 13. hafta terminalde." });
  s.addNotes("Geçiş: 3. haftada bir süreç bir diyagramdaki kutuydu. Bugün yazabileceğiniz bir numarası var.");

  // 5 ── Kabuk süreç oluşturur
  s = d.content({ kicker: "3. haftayla bağlantı", title: "Her Komut Bir Süreçtir: fork, exec, wait", lead: "Süreç, yürütülmekte olan bir programdır; bir PID'si, bir ebeveyni (PPID) ve çekirdekte bir PCB'si vardır. Kabuk her komut için bir tane oluşturur." });
  {
    const y = 2.55;
    d.box(s, MX, y + 0.55, 2.0, 1.0, "bash", { sub: "PID 1913", fill: C.charcoal, size: 16 });
    d.box(s, MX + 3.0, y, 2.2, 0.8, "fork()", { sub: "bash'in kopyası", fill: PALE, size: 14 });
    d.box(s, MX + 6.1, y, 2.6, 0.8, "exec(\"sleep\")", { sub: "çocuk PID 1970", fill: PALE, size: 14, font: F.code });
    d.box(s, MX + 9.6, y, 2.55, 0.8, "sleep 300", { sub: "PID 1970, PPID 1913", fill: C.mint, color: C.dark, size: 15 });
    d.arrow(s, MX + 2.02, y + 0.85, MX + 2.98, y + 0.4, { color: C.mintDeep });
    d.arrow(s, MX + 5.22, y + 0.4, MX + 6.08, y + 0.4, { color: C.mintDeep });
    d.arrow(s, MX + 8.72, y + 0.4, MX + 9.58, y + 0.4, { color: C.mintDeep });
    d.box(s, MX + 3.0, y + 1.25, 5.7, 0.62, "ön plan: bash wait() çağırır; sleep bitene dek istem yok", { fill: C.light, size: 13, bold: false });
    d.box(s, MX + 3.0, y + 2.0, 5.7, 0.62, "arka plan (&): bash BEKLEMEZ — istem hemen geri gelir", { fill: SAND, size: 13, bold: false });
    d.arrow(s, MX + 2.02, y + 1.2, MX + 2.98, y + 1.56, { color: C.slate, w: 1.5 });
    d.arrow(s, MX + 2.02, y + 1.4, MX + 2.98, y + 2.3, { color: C.amber, w: 1.5 });
  }
  term(s, MX, 5.4, 6.0, 1.45, L("out_ps.txt", 7, 8) + "\n" + L("out_ps.txt", 29, 32), 11.5);
  d.card(s, MX + 6.25, 5.4, 5.9, 1.45, { body: "exec() öncesinde ve sonrasında PID aynıdır: çocuk numarasını korur ama yeni bir program çalıştırır. [1] iş numarası, 1970 PID'dir.", bodySize: 13.5 });
  s.addNotes("Bu, 3. haftanın fork/exec/wait resminin ta kendisi. PID'ler gerçek: kabuğumuz PID 1913'tü ve 'sleep 300 &' ebeveyni 1913 olan PID 1970 oldu; pstree bunu doğruluyor. & ile kabuk wait() çağrısını atlar ve istemi hemen yazdırır; ön plan ile arka plan arasındaki farkın tamamı budur. Sizin makinenizde PID'ler farklı olacak ve her çalıştırmada değişecek.");

  // 6 ── Durum diyagramı (haftanın anahtar diyagramı)
  s = d.content({ kicker: "3. haftayla bağlantı", title: "3. Hafta Durumları, ps STAT Harfleri ve Sizin Eylemleriniz" });
  {
    const bw = 2.0, bh = 0.7;
    const NEW = [0.6, 1.95], STP = [4.55, 1.95], TRM = [8.75, 1.95], GONE = [11.15, 1.95];
    const RDY = [2.0, 3.6], RUN = [7.1, 3.6], WT = [4.55, 5.25];
    stateBox(s, NEW[0], NEW[1], bw, bh, "yeni", C.light, "–");
    stateBox(s, RDY[0], RDY[1], bw, bh, "hazır", PALE, "R");
    stateBox(s, RUN[0], RUN[1], bw, bh, "çalışıyor", C.mint, "R");
    stateBox(s, WT[0], WT[1], bw, bh, "bekliyor", C.slate, "S D", 0.8);
    stateBox(s, TRM[0], TRM[1], bw, bh, "sonlandı", C.light, "Z");
    stateBox(s, STP[0], STP[1], bw, bh, "durdurulmuş", SAND, "T");
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: GONE[0], y: GONE[1], w: 1.55, h: bh, fill: { color: C.white }, rectRadius: 0.18, line: { color: C.slate, width: 1, dashType: "dash" } });
    d.text(s, "kaldırıldı", { x: GONE[0], y: GONE[1], w: 1.55, h: bh, fontSize: 14, italic: true, color: C.mutedOnLight, align: "center", valign: "middle" });
    const K = { color: C.slate, w: 1.75 }, J = { color: C.amber, w: 2.5 };
    // çekirdek geçişleri (3. hafta)
    d.arrow(s, 1.6, 2.67, 2.5, 3.58, K); lab(s, "kabul edildi", 0.35, 2.85, 1.4, 0.35, { color: C.slate });
    d.arrow(s, 4.02, 3.78, 7.08, 3.78, K); lab(s, "zamanlayıcı görevlendirir", 4.1, 3.43, 3.1, 0.33, { color: C.slate, align: "center" });
    d.arrow(s, 7.08, 4.12, 4.02, 4.12, K); lab(s, "zaman dilimi doldu", 4.4, 4.14, 2.5, 0.33, { color: C.slate, align: "center" });
    d.arrow(s, 7.7, 4.32, 6.57, 5.4, K); lab(s, "G/Ç, sleep, wait()", 7.35, 4.75, 2.2, 0.33, { color: C.slate });
    d.arrow(s, 4.53, 5.4, 3.4, 4.32, K); lab(s, "olay gerçekleşti", 1.95, 4.75, 1.8, 0.33, { color: C.slate });
    // iş denetimi / sinyaller (siz)
    d.arrow(s, 7.6, 3.58, 6.4, 2.67, J); lab(s, "Ctrl+Z\nkill -STOP", 7.05, 2.55, 1.5, 0.6, { color: C.amber });
    d.arrow(s, 4.7, 2.67, 3.5, 3.58, J); lab(s, "fg · bg\nkill -CONT", 2.05, 2.5, 1.5, 0.6, { color: C.amber, align: "right" });
    d.arrow(s, 8.6, 3.58, 9.3, 2.67, J); lab(s, "exit()  ·  Ctrl+C\nkill  ·  kill -9", 9.25, 2.85, 2.6, 0.6, { color: C.amber });
    d.arrow(s, 10.77, 2.3, 11.13, 2.3, K);
    lab(s, "ebeveynin wait() çağrısı toplar", 9.75, 1.45, 3.0, 0.4, { color: C.slate, align: "right", fontSize: 11.5 });
  }
  d.card(s, MX + 6.95, 5.2, 5.2, 1.65, { body: [
    "Rozet = ps'in STAT sütununda yazdığı harf.",
    { b: "Turuncu oklar:", t: " sizin eylemleriniz (tuşlar, kill)." },
    { b: "Gri oklar:", t: " çekirdek ve zamanlayıcı (3. hafta)." },
  ], bodySize: 13.5, titleSize: 14 });
  d.text(s, "Linux durdurulmuş (T) durumunu ekler. R = hazır YA DA çalışıyor.", { x: MX, y: 6.4, w: 6.5, h: 0.4, fontSize: 13, italic: true, color: C.mutedOnLight });
  s.addNotes("Haftanın EN önemli slaytı bu; 3. haftayı bugüne bağlıyor. Beş durum tam olarak 3. haftanın diyagramındaki gibi: yeni, hazır, çalışıyor, bekliyor, sonlandı. Linux her biri için bir harf yazar: hem hazır hem çalışıyor için R (ikisini ayırmaz), bekliyor için S (kesilebilir uyku) ya da D (kesilemez uyku, genellikle disk G/Ç'si), ebeveyninin henüz beklemediği sonlanmış bir süreç (zombi) için Z. Linux, 3. haftada olmayan bir durum ekler: durdurulmuş, harfi T; Ctrl+Z ya da kill -STOP ile girilir, fg, bg ya da kill -CONT ile çıkılır. 'yeni' durumunun harfi yoktur: mikrosaniyeler sürer. Turuncu oklar bugün alıştıracağınız eylemlerdir. Not: kill bekleyen (S) bir sürece de etki eder — sleep bütün ömrünü S'de geçirir ve onu sürekli sonlandırıyoruz; ok, resim okunaklı kalsın diye yalnızca çalışıyor durumundan çizildi.");

  // 7 ── STAT harfleri tablosu
  s = d.tableSlide({
    kicker: "ps STAT sütunu", title: "STAT Harfleri ve Ek Bayrakları",
    header: ["Harf", "Anlamı", "3. hafta durumu", "Bugün nerede"],
    colW: [1.0, 4.75, 2.6, 3.8],
    rows: [
      ["R", "çalışıyor ya da çalıştırılabilir (işlemcide ya da hazır kuyruğunda)", "çalışıyor / hazır", "yes > /dev/null"],
      ["S", "kesilebilir uyku: bir olayı bekliyor", "bekliyor", "sleep 300, bash"],
      ["D", "kesilemez uyku, genellikle disk G/Ç'si", "bekliyor", "(seyrek, kısa süreli)"],
      ["T", "Ctrl+Z ya da SIGSTOP ile durdurulmuş", "— (Linux eki)", "Ctrl+Z'den sonra"],
      ["Z", "zombi: bitti, henüz toplanmadı", "sonlandı", "./zombie (5. bölüm)"],
    ],
    fontSize: 15.5, y: 1.75,
    callout: "Harften sonraki ek bayraklar: s = oturum lideri (giriş kabuğunuz: Ss), + = ön plan grubunda (R+), N = düşük öncelik (nice uygulanmış: RN), < = yüksek öncelik, l = çok iş parçacıklı.",
  });
  s.addNotes("İlk harf durumdur; ardından gelen karakterler bayraklardır. Yakalamalarımızda: bash Ss gösterir (uyuyor, oturum lideri — sizin yazmanızı bekler), ps'in kendisi R+ gösterir (anlık görüntüyü alırken çalışan ön plan sürecidir), nice uygulanmış bir yes RN gösterir. Sorun: ps neden hep R? (Liste oluşturulurken çalışan süreç odur.)");

  // 8 ── ps ve ps -f
  s = d.content({ kicker: "Uygulama · ps", title: "ps: Süreçlerinizin Anlık Görüntüsü" });
  term(s, MX, 1.65, 7.55, 5.2, L("out_ps.txt", 1, 22), 11.5);
  d.card(s, MX + 7.8, 1.65, 4.35, 5.2, { title: "Neye dikkat etmeli?", body: [
    "echo $$ kabuğun kendi PID'sini yazdırır: 1913.",
    "Yalın ps: yalnızca bu terminalin süreçleri (TTY pts/0).",
    "ps kendi listesinde yer alır — o da bir süreçtir.",
    "ps -f (tam biçim): UID, PPID, başlama zamanı ve komut satırının tamamı.",
    "sleep ve yes'in PPID'si = 1913: ebeveynleri kabuktur.",
  ], bodySize: 14.5 });
  s.addNotes("Birlikte yazın. Giriş kabuğu '-bash' olarak görünür: baştaki tire bir giriş kabuğunu (login shell) belirtir. yes'in C sütununu gösterin: 96 — yüzde olarak işlemci kullanımı, çünkü yes hiç durmadan çalışır. PID numaraları artar; 1913'ten 1969'a olan boşluk, bu arada aynı makinedeki başka kullanıcıların oluşturduğu süreçlerdir.");

  // 9 ── ps -o ve pstree
  s = d.content({ kicker: "Uygulama · ps -o · pstree", title: "Sütunlarınızı Seçin, Ağacı Çizin" });
  term(s, MX, 1.65, 7.55, 2.75, L("out_ps.txt", 23, 32), 11.5);
  term(s, MX, 4.6, 7.55, 1.3, L("out_ps.txt", 52, 55), 11.5);
  d.card(s, MX + 7.8, 1.65, 4.35, 5.2, { title: "Neye dikkat etmeli?", body: [
    "-o tam olarak istediğiniz sütunları listeler: burada durum (STAT), nice değeri (NI), %CPU ve %MEM.",
    "yes: R ve ≈ %97 işlemci. sleep: S ve %0.",
    "pstree -p, 3. haftanın ebeveyn–çocuk ağacını gerçek PID'lerle çizer.",
    "kill %1 %2 iki işi de bitirir; bash bir sonraki istemde \"Terminated\" bildirir.",
  ], bodySize: 14.5 });
  s.addNotes("-o, ps'in en yararlı seçeneğidir: ps -o pid,ppid,stat,cmd bütün gün kullandığımız görünümdür. pstree -p $$ ağacı kabuğumuzdan başlatır. 3. haftadaki fork_count ağacıyla karşılaştırın. kill %1 %2 satırı iş denetimine bir ön bakıştır: %1 'PID 1' değil, '1 numaralı iş' demektir.");

  // 10 ── sütunlar tablosu
  s = d.tableSlide({
    kicker: "ps çıktısını okumak", title: "Sütunlar Ne Anlama Gelir?",
    header: ["Sütun", "Anlamı", "Örnek"],
    colW: [1.75, 7.0, 3.4],
    rows: [
      ["PID / PPID", "süreç kimliği / ebeveynin süreç kimliği (3. hafta)", "1970 / 1913"],
      ["UID, USER", "sürecin sahibi (11. hafta)", "student"],
      ["STAT", "durum harfi + bayraklar (önceki slaytlar)", "S, R+, Ss"],
      ["%CPU", "işlemci zamanı ÷ başlangıçtan beri geçen süre, yüzde", "99.0 (yes)"],
      ["%MEM", "yerleşik bellek ÷ toplam RAM, yüzde", "0.0"],
      ["VSZ / RSS", "sanal boyut / yerleşik küme (RAM'de), KiB (6–7. haftalar)", "3132 / 1884"],
      ["TTY", "sürecin ait olduğu terminal; ? = yok (daemon)", "pts/0"],
      ["TIME", "şimdiye dek kullanılan toplam işlemci zamanı", "0:02"],
      ["CMD, COMMAND", "komut satırı", "sleep 300"],
    ],
    fontSize: 14.5, y: 1.65,
    callout: "Çok iş parçacıklı bir süreçte %CPU 100'ü aşabilir: %200 = iki çekirdek tamamen dolu (4. hafta, iş parçacıkları).",
  });
  s.addNotes("Değerler ps aux yakalamamızdan (sonraki slayt). VSZ ve RSS 6–7. haftalara bağlanır: VSZ sanal adres alanının boyutu, RSS ise şu an RAM'de olan kısmıdır; yes için 3132 KiB sanal ama yalnızca 1884 KiB yerleşik — iş başındaki isteğe bağlı sayfalama. ps'teki %CPU sürecin bütün ömrü boyunca bir ortalamadır; top ise son birkaç saniyeyi ölçer.");

  // 11 ── ps -ef / aux
  s = d.content({ kicker: "Uygulama · tüm süreçler", title: "Herkesin Süreçleri: ps -ef ve ps aux" });
  {
    const ef = L("out_ps.txt", 33, 37).split("\n");
    ef[2] = ef[2].replace(/(\/process_api --firecracker-init).*/, "$1 …");
    const t = ef.join("\n") + "\n# ... ps -f -u student: yalnızca student kullanıcısı\n" + L("out_ps.txt", 38, 51);
    term(s, MX, 1.65, 8.25, 5.2, cut(t, 82), 10.5);
  }
  d.card(s, MX + 8.5, 1.65, 3.65, 5.2, { title: "İki stil, aynı veri", body: [
    { b: "-ef:", t: " her süreç, tam biçim (System V stili)." },
    { b: "aux:", t: " her süreç; %CPU, %MEM, VSZ, RSS ile (BSD stili, tiresiz)." },
    { b: "-u student:", t: " yalnızca bir kullanıcı." },
    "PID 1 ilk süreçtir; çekirdek iş parçacıkları [köşeli parantez] içinde görünür.",
    "grep kendini bulur!",
  ], bodySize: 13.5 });
  s.addNotes("Laboratuvar makinemizde tam listeler root'a ve başka kullanıcılara ait yaklaşık 70 süreç içerir; ps -ef'in ilk satırlarını, ardından yalnızca student'ın süreçlerini gösteriyoruz (PID 1'in uzun komut satırını '…' ile kırptık). Bu laboratuvar makinesinde PID 1, process_api adlı küçük bir konteyner başlatma programıdır; normal bir Ubuntu kurulumunda PID 1 systemd'dir. PID 2, kthreadd, tüm çekirdek iş parçacıklarının (adları köşeli parantez içinde) ebeveynidir. ps aux | grep'in son satırı grep'in kendisidir — klasik bir sürpriz; pgrep (ileride) bunu önler.");

  // 12 ── /proc
  s = d.content({ kicker: "3. haftayla bağlantı · PCB", title: "/proc/<pid>/status: PCB'yi Okumak" });
  term(s, MX, 1.65, 7.55, 5.2, cut(L("out_proc.txt", 1, 20), 76), 11);
  d.card(s, MX + 7.8, 1.65, 4.35, 5.2, { title: "3. haftanın PCB alanları", body: [
    { b: "State:", t: " S (sleeping) = bekliyor." },
    { b: "Pid, PPid:", t: " kimlik ve ebeveyn." },
    { b: "Uid:", t: " sahip (11. hafta)." },
    { b: "VmRSS:", t: " bellek bilgisi." },
    { b: "ctxt_switches:", t: " hesap bilgisi — voluntary = işlemciyi kendisi bıraktı, nonvoluntary = elinden alındı." },
    { b: "cwd, exe:", t: " çalışma dizini ve program dosyası." },
  ], bodySize: 13.5 });
  s.addNotes("$! en son arka plan işinin PID'sidir. /proc hiçbir diskte değildir: bu dosyaları siz okurken çekirdek üretir (3. hafta, 9. hafta FHS). /proc/<pid>/status dosyası, çekirdeğin task_struct yapısının, yani Linux'un PCB'sinin metin görünümüdür. Uid 1013 laboratuvar kullanıcımızın numarasıdır; sizinki farklı olacaktır (genellikle 1000). ls -l satırları slaytta sağ kenarda kesildi: -> /home/student/lab ve -> /usr/bin/sleep ile biterler.");

  // 13 ── top
  s = d.content({ kicker: "Uygulama · top", title: "top: Birkaç Saniyede Bir Yenilenen Canlı Görünüm" });
  term(s, MX, 1.65, 12.15, 3.35, L("out_top.txt", 9, 21), 12);
  {
    const cards = [
      ["1. satır", "çalışma süresi ve yük ortalaması: işlemci kullanan ya da işlemci bekleyen süreç sayısının 1, 5 ve 15 dakikalık ortalamaları."],
      ["2–3. satırlar", "Durumlarına göre görevler (STAT'tan); BÜTÜN makinenin %Cpu(s) değeri: us = kullanıcı modu, sy = çekirdek modu (2. hafta), id = boşta."],
      ["Süreç listesi", "PR = 20 + NI (5. hafta önceliği), S = durum, son aralıktaki %CPU: yes bir çekirdeğin %100'ünü kullanıyor."],
    ];
    cards.forEach((c, i) => d.card(s, MX + i * 4.13, 5.2, 3.9, 1.65, { title: c[0], body: c[1], bodySize: 12.5, titleSize: 14 }));
  }
  s.addNotes("Slayta sığsın diye top -b -n 1 (toplu kip) ile tek bir anlık görüntü yakaladık; -u student yalnızca bizim süreçlerimizi gösterir, ama başlık satırları her zaman bütün makine içindir (tüm kullanıcıların 71 görevi). top içindeki etkileşimli tuşlar: q çıkış, P işlemciye göre sırala, M belleğe göre sırala, k sonlandır (bir PID sorar), r renice, u kullanıcıya göre süz, 1 her işlemciyi ayrı göster. htop daha kullanıcı dostu, renkli bir sürümdür: seçmek için ok tuşları, sonlandırmak için F9, nice değeri için F7/F8, çıkmak için F10. '0 user' görünür, çünkü laboratuvar makinemizin konsolunda kimse oturum açmamıştır; sizin bilgisayarınızda 1 ya da daha fazla kullanıcı göreceksiniz.");

  // 14 ── yük ortalaması çözümlü örneği
  s = d.content({ kicker: "Çözümlü örnek", title: "Yük Ortalamasını Okumak", lead: "Yük = çalışan ya da hazır (R) süreçlerin, artı disk bekleyen (D) süreçlerin ortalama sayısı. İşlemci çekirdeği sayısıyla karşılaştırın." });
  term(s, MX, 2.35, 5.4, 1.75, L("out_top.txt", 5, 8) + "\n" + L("out_top.txt", 22, 23).replace(/load average/, "\n           load average"), 11);
  d.code(s, MX + 5.65, 2.35, 6.5, 3.4,
`çekirdek c = 2  (nproc)

yük 0.59 → 0.59 / 2 = kapasitenin %29.5'i
yük 2.00 → 2.00 / 2 = %100: her çekirdek dolu
yük 3.00 → %150: ortalama 3 − 2 = 1 süreç
            hazır kuyruğunda bekler

# 1 dk > 15 dk: yük artıyor
# 1 dk < 15 dk: yük azalıyor`, 13);
  d.callout(s, MX, 4.35, 5.4, 1.4, "Bir yes bir çekirdek ister: top onun için %100 gösterir, ama 2 çekirdeğin ortalaması olan %Cpu(s) içinde yalnızca yaklaşık %50.", 13.5);
  d.callout(s, MX, 5.95, 12.15, 0.9, "4. haftayla bağlantı: yük > çekirdek sayısı ise süreçler hazır kuyruğunda zaman geçirir — bekleme süreleri uzar.", 14);
  s.addNotes("Sayılar code/check_numbers.py ile denetlendi. Anlık görüntümüz yes başladıktan 30 s sonra alındı; bu yüzden 1 dakikalık ortalama (0,59) henüz 1'e tırmanmamıştı: bunlar anlık sayımlar değil, üstel olarak sönümlenen ortalamalardır. /proc/loadavg'ın 4. alanındaki 3/98, şu anda toplam 98 varlıktan 3'ünün çalıştırılabilir olduğu anlamına gelir; son sayı en son atanan PID'dir. Linux'ta yük D durumundaki süreçleri de sayar; bu yüzden yavaş bir diski bekleyen bir makine, işlemcisi boştayken bile yüksek yük gösterebilir.");

  // 15 ── Kopya kâğıdı 1
  s = d.tableSlide({
    kicker: "Kopya kâğıdı", title: "Süreçleri İncelemek: Bir Bakışta",
    header: ["Komut", "Ne gösterir?"],
    colW: [4.6, 7.55],
    rows: [
      ["ps   ·   ps -f", "bu terminalin süreçleri (kısa / tam biçim)"],
      ["ps -ef   ·   ps aux", "bütün kullanıcıların bütün süreçleri"],
      ["ps -u student", "bir kullanıcının bütün süreçleri"],
      ["ps -o pid,ppid,stat,ni,%cpu,cmd", "tam olarak seçtiğiniz sütunlar"],
      ["ps ... --sort=-%cpu", "sıralı, en yüksek işlemci kullanımı önce"],
      ["pgrep -l name   ·   pgrep -c name", "eşleşen süreçlerin PID'leri (ve adları) / sayısı"],
      ["pstree -p   ·   pstree -p $$", "PID'leriyle süreç ağacı"],
      ["top   ·   htop", "canlı görünüm; q ile çıkılır"],
      ["cat /proc/<pid>/status", "metin olarak PCB"],
      ["echo $$   ·   echo $!", "bu kabuğun / son arka plan işinin PID'si"],
    ],
    fontSize: 15, y: 1.65,
  });
  s.addNotes("Öğrenciler bu slaytın fotoğrafını çekebilir; ders notlarında daha uzun bir komut başvuru tablosu var. Sorun: firefox adlı bir programın PID'sini bulmak için hangi komutu kullanırdınız? (pgrep firefox ya da ps aux | grep firefox.)");

  // ───────────────────────── BÖLÜM 2
  s = d.sectionSlide({ kicker: "Bölüm 2", title: "İş Denetimi", subtitle: "Bir terminal, birçok iş: ön plan, arka plan, durdurulmuş." });
  s.addNotes("İş (job), kabuğun başlattığı bir komut satırıdır — tek bir süreç ya da borularla bağlı birkaç süreç. Kabuk onları numaralandırır: [1], [2], …");

  // 17 ── ön plan ve arka plan
  s = d.compareSlide({
    kicker: "İş denetimi", title: "Ön Plan ve Arka Plan İşleri",
    lead: "Klavyeye yalnızca BİR iş sahip olur: ön plan işi. Ctrl+C ve Ctrl+Z ona iletilir.",
    left: { title: "Ön plan:  komut", items: [
      "Kabuk bekler (3. haftanın wait() çağrısı) — iş bitene dek istem yok.",
      "İş klavyenizi okur.",
      "Ctrl+C SIGINT gönderir: genellikle işi sonlandırır.",
      "Ctrl+Z SIGTSTP gönderir: işi durdurur (T durumu), istemi geri verir.",
      "Kısa komutlar ve etkileşimli her şey için (nano, less, top).",
    ] },
    right: { title: "Arka plan:  komut &", color: C.amber, items: [
      "Kabuk [iş] PID ve istemi hemen yazdırır.",
      "İş çalışırken siz çalışmaya devam edersiniz.",
      "Ctrl+C ona ulaşmaz: kill %n kullanın.",
      "Çıktısı yine ekranınıza gelir — yönlendirin (> dosya, 12. hafta).",
      "Uzun, etkileşimsiz işler için: derleme, kopyalama, indirme.",
    ] },
    callout: "jobs BU kabuğun işlerini listeler.  fg %n: ön plana getir.  bg %n: durdurulmuş bir işi arka planda sürdür.",
  });
  s.addNotes("Terminalin aynı anda tek bir ön plan süreç grubuna ait olduğu fikrini açıklayın; klavye sinyalleri o gruba gider. Arka plan işlerinin tipik kullanımı: uzun bir derleme, bir indirme, denemekte olduğunuz bir sunucu. Tipik öğrenci hatası: bir düzenleyiciyi (nano) & ile başlatmak — arka plandaki bir iş terminalden okuyamadığı için hemen durdurulur (T durumu, 'Stopped (tty input)').");

  // 18 ── Ctrl+Z, jobs, bg
  s = d.content({ kicker: "Uygulama · iş denetimi", title: "Ctrl+Z, jobs ve bg" });
  term(s, MX, 1.65, 7.0, 5.2, L("out_jobs.txt", 1, 19), 12);
  d.card(s, MX + 7.25, 1.65, 4.9, 5.2, { title: "Adım adım", body: [
    { b: "sleep 100:", t: " ön planda — istem yok." },
    { b: "Ctrl+Z (^Z):", t: " durduruldu; istem geri geldi." },
    { b: "ps:", t: " STAT T — durdurulmuş durumu." },
    { b: "bg:", t: " arka planda sürdür; kabuk & ekler." },
    { b: "jobs -l:", t: " artık Running, PID'siyle birlikte." },
    { b: "ps:", t: " yeniden STAT S — sleep zamanlayıcısını bekliyor, takılmadı." },
  ], bodySize: 14.5 });
  s.addNotes("Canlı yapın: sleep 100 yazın, Ctrl+Z'ye basın, sonra jobs, ps -o pid,stat,cmd, bg, jobs -l ve yeniden ps. [1]+ içindeki + 'geçerli' işi (argümansız fg ve bg'nin varsayılanı), - ise bir öncekini gösterir. Durdurulmuş bir iş bütün belleğini ve açık dosyalarını korur, yalnızca işlemci zamanı almaz — 3. hafta terimleriyle ne hazır ne de bekliyor durumundadır; Linux'un ek T durumuna bu yüzden ihtiyacı vardır.");

  // 19 ── &, fg, Ctrl+C, kill %n
  s = d.content({ kicker: "Uygulama · iş denetimi", title: "& ile Başlatmak, fg, Ctrl+C ve kill %n" });
  term(s, MX, 1.65, 7.0, 5.2, L("out_jobs.txt", 20, 38), 12);
  d.card(s, MX + 7.25, 1.65, 4.9, 5.2, { title: "Adım adım", body: [
    { b: "&:", t: " [2] 2404 = 2 numaralı iş, PID 2404." },
    { b: "jobs:", t: " + geçerli iş, - bir önceki." },
    { b: "fg %3:", t: " yes ön plana gelir; kabuk komutunu yazdırır." },
    { b: "Ctrl+C (^C):", t: " SIGINT onu bitirir." },
    { b: "kill %1 %2:", t: " % iş numarası demektir." },
    "Terminated bir kez, bir sonraki istemden hemen önce bildirilir.",
  ], bodySize: 14.5 });
  s.addNotes("Sık hata: kill %1 yerine kill 1. % olmadan sayı bir PID'dir: 'kill 1' PID 1'e sinyal göndermeye çalışır ve 'Operation not permitted' hatasıyla başarısız olur (laboratuvar çözümlerinde gösteriyoruz). İş numaralarının kabuğa özgü olduğuna dikkat edin: başka bir terminalin kendi [1]'i vardır.");

  // 20 ── İş belirteçleri
  s = d.tableSlide({
    kicker: "İş denetimi", title: "İşleri ve Süreçleri Adlandırmak",
    header: ["Yazdığınız", "Anlamı", "Örnek"],
    colW: [2.4, 6.3, 3.45],
    rows: [
      ["%1, %2 …", "bu kabuğun n numaralı işi", "fg %2, kill %1"],
      ["%+  ya da  %%", "geçerli iş (+ ile işaretli); argümansız fg/bg de bunu kullanır", "fg"],
      ["%-", "bir önceki iş (- ile işaretli)", "bg %-"],
      ["%sleep", "komutu sleep ile başlayan iş", "kill %sleep"],
      ["1970", "bir PID — her terminalde, her araçla geçerli", "kill 1970"],
      ["$$", "geçerli kabuğun PID'si", "echo $$ → 1913"],
      ["$!", "en son arka plan işinin PID'si", "kill $!"],
    ],
    fontSize: 16, y: 1.65,
    callout: "İş numaraları (%n) yalnızca işleri başlatan kabuğun içinde vardır. PID'ler geneldir: başka bir terminaldeki ps, top ve kill de onları görür.",
  });
  s.addNotes("$$ ve $! kabuk değişkenleridir; gelecek hafta (14. hafta) betiklerde kullanacağız; örneğin bir arka plan işinin PID'sini hatırlayıp daha sonra onu beklemek ya da sonlandırmak için.");

  // 21 ── Mola
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Mola", subtitle: "Sırada: sinyaller — kill gerçekte nasıl çalışır — ardından öncelikler ve zombiler." });
  s.addNotes("On dakika. Çıkmadan önce öğrenciler şunu deneyebilir: sleep 1000, Ctrl+Z, bg, jobs. Moladan sonra: tuşlarla yaptığımız her şey aslında sinyallerle yapılıyor.");

  // ───────────────────────── BÖLÜM 3
  s = d.sectionSlide({ kicker: "Bölüm 3", title: "Sinyaller", subtitle: "Çekirdeğin bir sürece ilettiği küçük, numaralı iletiler." });
  s.addNotes("Ctrl+C, Ctrl+Z, kill, terminali kapatmak: bunların hepsi sinyal gönderir.");

  // 23 ── Sinyal nedir
  s = d.content({ kicker: "Sinyaller", title: "Sinyal, Bir Süreç İçin Yazılımsal Bir Kesmedir", lead: "2. hafta: donanım kesmesi işlemciyi durdurur ve bir işleyici çalıştırır. Sinyal aynısını tek bir süreç için yapar." });
  {
    const y = 2.55;
    d.box(s, MX, y, 2.3, 1.0, "Gönderen", { sub: "siz (Ctrl+C), kill, çekirdek", fill: C.light, size: 15, subSize: 11 });
    d.box(s, MX + 3.2, y, 2.3, 1.0, "Çekirdek", { sub: "sinyali bekleyen olarak işaretler", fill: C.charcoal, size: 15, subSize: 11 });
    d.box(s, MX + 6.4, y, 2.3, 1.0, "Süreç", { sub: "PID 1970", fill: C.mint, color: C.dark, size: 15, subSize: 11 });
    d.arrow(s, MX + 2.32, y + 0.5, MX + 3.18, y + 0.5, { color: C.mintDeep });
    d.arrow(s, MX + 5.52, y + 0.5, MX + 6.38, y + 0.5, { color: C.mintDeep });
    d.text(s, "kill -15 1970", { x: MX + 1.6, y: y + 1.05, w: 2.6, h: 0.3, fontSize: 12, fontFace: F.code, color: C.mintDeep, align: "center" });
  }
  d.card(s, MX, 4.2, 8.7, 2.65, { title: "Süreç sinyalle ne yapar?", body: [
    { b: "Varsayılan eylem:", t: " sonlan, dur, sürdür ya da yok say — her sinyal için sabittir." },
    { b: "Yakala:", t: " kendi işleyici fonksiyonunu çalıştır (örneğin işi kaydet, sonra çık)." },
    { b: "Yok say:", t: " sinyalin hiçbir etkisi olmaz." },
    { b: "İstisnalar:", t: " SIGKILL (9) ve SIGSTOP (19) yakalanamaz ve yok sayılamaz." },
  ], bodySize: 14 });
  d.card(s, MX + 8.95, 1.65, 3.2, 5.2, { title: "Kurallar", body: [
    "Bir kullanıcı yalnızca KENDİ süreçlerine sinyal gönderebilir (root: herkesinkine).",
    "kill her zaman öldürmez: bir sinyal gönderir. Varsayılan sinyal 15'tir, SIGTERM.",
    "Sinyallerin adları ve numaraları vardır: kill -l.",
  ], bodySize: 13.5 });
  s.addNotes("Sinyaller bir süreçler arası iletişim (IPC) mekanizmasıdır (3. haftada IPC'den söz etmiştik) ve kesmelerin (2. hafta) kullanıcı alanındaki karşılığıdır. Sahiplik kuralı bir koruma kuralıdır (11. hafta): bir öğrenci başka bir kullanıcının süreçlerini sonlandıramaz — denerseniz pkill 'Operation not permitted' bildirir. Numaralar x86 ve ARM üzerindeki Linux'unkilerdir; birkaçı başka UNIX sistemlerinde farklıdır, bu yüzden adlar numaralardan daha güvenlidir (her yerde aynı olan 9 ve 15 dışında).");

  // 24 ── Sinyal tablosu
  s = d.tableSlide({
    kicker: "Sinyaller", title: "Bilmeniz Gereken Sinyaller",
    header: ["No.", "Ad", "Gönderen", "Varsayılan eylem", "Yakalanır mı?"],
    colW: [0.8, 1.9, 4.05, 3.3, 2.1],
    rows: [
      ["1", "SIGHUP", "terminali kapatmak (\"hang up\")", "sonlan", "evet"],
      ["2", "SIGINT", "Ctrl+C", "sonlan", "evet"],
      ["9", "SIGKILL", "kill -9 — son çare", "hemen sonlan", "HAYIR"],
      ["15", "SIGTERM", "kill (varsayılan)", "sonlan", "evet"],
      ["17", "SIGCHLD", "çekirdek, bir çocuk bittiğinde", "yok say", "evet"],
      ["18", "SIGCONT", "fg, bg, kill -CONT", "durmuşsa sürdür", "evet"],
      ["19", "SIGSTOP", "kill -STOP", "dur", "HAYIR"],
      ["20", "SIGTSTP", "Ctrl+Z", "dur", "evet"],
    ],
    fontSize: 15.5, y: 1.65,
    callout: "Ctrl+\\ SIGQUIT (3) gönderir: SIGINT gibidir ama bir bellek dökümü (core dump) da yazabilir. SIGSEGV (11), çekirdeğin geçersiz bir bellek erişimine yanıtıdır (7. hafta).",
  });
  s.addNotes("Numaralar Linux makinemizdeki kill -l çıktısından. SIGTSTP (Ctrl+Z) kibar durdurmadır: düzenleyici gibi bir program onu yakalayıp önce terminali eski hâline getirebilir; SIGSTOP ise reddedilemez. SIGCHLD, çekirdeğin bir ebeveyne çocuğunun sonlandığını bildirme yoludur — ebeveyn bunun üzerine wait() çağırmalıdır; çağırmazsa çocuk zombi olarak kalır (5. bölüm). Bilmeye değer: SIGSEGV (11) = segmentation fault; çekirdek geçersiz bir bellek erişiminden sonra gönderir (7. haftadaki sayfa hatasının 2. adımı).");

  // 25 ── TERM / KILL / INT çıkış kodları
  s = d.content({ kicker: "Uygulama · kill", title: "kill -l, SIGTERM, SIGKILL, SIGINT — ve Çıkış Durumu" });
  term(s, MX, 1.65, 7.3, 5.2, L("out_signals.txt", 1, 4) + "\n# ... toplam 64 sinyal\n" + L("out_signals.txt", 19, 39), 10.5);
  d.card(s, MX + 7.55, 1.65, 4.6, 3.1, { title: "Neye dikkat etmeli?", body: [
    "kill -l bütün sinyalleri listeler; kill -l 15 TERM, kill -l KILL 9 yazdırır.",
    "wait $! işi bekler ve nasıl bittiğini bildirir: Terminated, Killed, Interrupt.",
    "$? = son komutun çıkış durumu.",
  ], bodySize: 13.5 });
  d.code(s, MX + 7.55, 4.95, 4.6, 1.9,
`n sinyaliyle öldü → $? = 128 + n
SIGTERM: 128 + 15 = 143
SIGKILL: 128 +  9 = 137
SIGINT : 128 +  2 = 130`, 13);
  s.addNotes("128 + n kuralı bir kabuk geleneğidir: 128'in üstündeki bir çıkış durumu '(durum − 128) numaralı sinyalle öldürüldü' demektir. check_numbers.py ile yakalanan 143, 137 ve 130 değerlerine karşı doğrulandı. 14. hafta $? değerini if deyimlerinde kullanır. Güvenlik: kill -9, programa veri kaydetme ya da geçici dosyaları silme fırsatı vermez — önce her zaman yalın kill (SIGTERM) deneyin ve birkaç saniye bekleyin.");

  // 26 ── STOP/CONT + pkill/killall
  s = d.content({ kicker: "Uygulama · kill, pkill, killall", title: "Duraklat ve Sürdür; Süreçlere Adlarıyla Sinyal Gönder" });
  term(s, MX, 1.65, 6.45, 5.2, L("out_signals.txt", 40, 52), 11.5);
  term(s, MX + 6.65, 1.65, 5.5, 3.65, L("out_signals.txt", 53, 71).split("\n").filter((l, i) => i < 15).join("\n"), 10.5);
  d.card(s, MX + 6.65, 5.5, 5.5, 1.35, { body: "pgrep / pkill / killall süreçleri ADLARINA göre seçer. Her zaman -u student ekleyin: yoksa başka kullanıcıların süreçlerini de denerler.", bodySize: 13 });
  s.addNotes("Sol: SIGSTOP sleep'i dondurur (STAT T — Ctrl+Z sonrasındaki durumun aynısı, bu yüzden bash onu Stopped olarak bildirir), SIGCONT sürmesini sağlar (yeniden S). Sağ: pgrep eşleşen PID'leri listeler; pkill hepsine SIGTERM gönderir; killall aynısını tam adla yapar. Son pgrep hiçbir şey bulamaz, bu yüzden çıkış durumu 1'dir. Güvenlik: pkill ve killall HER eşleşmeye etki eder — 'pkill -u student bash' bütün terminallerinizi kapatırdı. Kalıbı önce pgrep ile deneyin.");

  // 27 ── catch.c
  s = d.content({ kicker: "Uygulama · C", title: "Sinyalleri Yakalayan Bir Program: catch.c" });
  d.code(s, MX, 1.65, 5.75, 3.75, raw("catch_excerpt.c"), 10.5);
  term(s, MX + 5.95, 1.65, 6.2, 5.2, cut(L("out_catch.txt", 3, 24), 73), 9.5);
  d.card(s, MX, 5.55, 5.75, 1.3, { body: "SIGINT yakalanır (yalnızca bir ileti); SIGTERM temiz bir çıkış sağlar (Done); SIGKILL işleyicisi reddedilir ve kill -9 her zaman işe yarar.", bodySize: 13 });
  s.addNotes("gcc -Wall -O2 -o catch catch.c ile derleyin (tam dosya code/catch.c). Arka plan işinin iletileri imleç neredeyse oraya — istemin hemen arkasına — basılır; bu yüzden yazılan sonraki komut yeni bir satırda başlar: bu normaldir. İyi yazılmış sunucuların SIGTERM'i işlemesinin nedeni budur: çıkmadan önce dosyalarını kapatır ve durumlarını kaydederler; SIGKILL ise onlara bu fırsatı vermez.");

  // 28 ── kill -9 merdiveni
  s = d.content({ kicker: "İyi uygulama", title: "Bir Süreci Güvenle Durdurmak: Önce Rica Et, En Son Zorla" });
  {
    const steps = [
      ["1", "Ctrl+C", "ön plandaysa (SIGINT)", C.mint],
      ["2", "kill PID", "SIGTERM: \"lütfen bitir\"; 5–10 s bekle", C.mint],
      ["3", "ps -p PID", "hâlâ orada mı? STAT'ına bak", PALE],
      ["4", "kill -9 PID", "SIGKILL: temizlik yok, kayıt yok", C.red],
    ];
    steps.forEach((st, i) => {
      const x = MX + i * 3.08;
      d.box(s, x, 1.85, 2.85, 1.1, st[1], { sub: st[2], fill: st[3], color: st[3] === C.red ? C.white : C.dark, size: 17, subSize: 12, font: F.code });
      if (i < 3) d.arrow(s, x + 2.87, 2.4, x + 3.06, 2.4, { w: 2 });
    });
  }
  d.card(s, MX, 3.25, 5.95, 3.6, { title: "Neden her zaman kill -9 değil?", titleColor: C.red, fill: ROSE, body: [
    "Program açık belgeleri kaydedemez, tamponlarını boşaltamaz.",
    "Geçici dosyalar ve kilit dosyaları geride kalır; bir veritabanı onarım isteyebilir.",
    "Çocuklarına haber verilmez; yetim kalırlar.",
  ], bodySize: 16 });
  d.card(s, MX + 6.2, 3.25, 5.95, 3.6, { title: "kill -9'un İŞE YARAMADIĞI durumlar", body: [
    { b: "Z (zombi):", t: " zaten ölü — onu yalnızca ebeveynin wait() çağrısı kaldırır." },
    { b: "D (disk bekleme):", t: " sinyal G/Ç bittiğinde iletilir." },
    { b: "Başkasının süreci:", t: " Operation not permitted (root'a başvurun)." },
  ], bodySize: 16 });
  s.addNotes("Uygulamalı haftalar için zorunlu güvenlik slaytı: kill -9 ilk değil, son çaredir. Sağ sütun 5. bölüme bir ön bakış: bir zombiye kill -9 göndereceğiz ve hiçbir şey olmadığını izleyeceğiz.");

  // 29 ── nohup
  s = d.content({ kicker: "Uygulama · SIGHUP, nohup", title: "Kapanan Bir Terminalden Sağ Çıkmak: nohup" });
  term(s, MX, 1.65, 7.75, 5.2, cut(L("out_nohup.txt", 1, 23), 80), 10.5);
  d.card(s, MX + 8.0, 1.65, 4.15, 5.2, { title: "Neye dikkat etmeli?", body: [
    "$$ = kabuk, $! = son arka plan işi.",
    "Terminali kapatmak işlerine SIGHUP (1) gönderir; bunu kill -HUP ile taklit ediyoruz.",
    "Yalın sleep 500: Hangup — gitti.",
    "nohup işleri SIGHUP'ı yok sayar: hâlâ Running.",
    "Yönlendirmezseniz nohup'ın çıktısı nohup.out dosyasına gider.",
  ], bodySize: 13.5 });
  s.addNotes("'nohup: ignoring input…' iletisini arka plandaki nohup, istem çoktan göründükten sonra yazdırdı; bu yüzden sonraki komut yeni bir satırda başlıyor. Kullanım örneği: SSH üzerinden uzak bir sunucuda uzun bir iş başlatın, oturumu kapatın, sonra geri gelin. Bunun için daha iyi araçlar (screen, tmux, systemd hizmetleri) bu dersin kapsamı dışındadır. disown, zaten çalışmakta olan bir iş için benzer etkiye sahip bir bash yerleşik komutudur.");

  // ───────────────────────── BÖLÜM 4 + 5
  s = d.sectionSlide({ kicker: "Bölüm 4 ve 5", title: "Öncelikler ve Zombiler", subtitle: "5. haftanın zamanlaması ve 3. haftanın sonlandırması, ölçülmüş olarak." });
  s.addNotes("İki kısa bölüm: nice değerleri (5. hafta) ve zombi süreçler (3. hafta).");

  // 31 ── nice kavramı
  s = d.content({ kicker: "5. haftayla bağlantı", title: "nice Değerleri: Öteki Süreçlere Nazik Davranmak" });
  {
    const x0 = MX + 0.2, w = 11.7, y = 2.25, n = 40;
    for (let i = 0; i < n; i++) {
      const v = i - 20, fill = v < 0 ? C.amber : v === 0 ? C.charcoal : C.mint;
      s.addShape(P.shapes.RECTANGLE, { x: x0 + i * w / n, y, w: w / n - 0.02, h: 0.45, fill: { color: fill, transparency: v === 0 ? 0 : 45 - Math.abs(v) * 1.5 }, line: { type: "none" } });
    }
    [[-20, "−20"], [-10, "−10"], [0, "0 (varsayılan)"], [10, "10"], [19, "19"]].forEach(([v, t]) =>
      d.text(s, t, { x: x0 + (v + 20) * w / n - 0.6, y: y + 0.5, w: 1.5, h: 0.3, fontSize: 12, bold: true, color: C.charcoal, align: "center" }));
    d.text(s, "← daha çok işlemci (0'ın altına yalnızca root inebilir)", { x: x0, y: y - 0.42, w: 6.0, h: 0.35, fontSize: 13, bold: true, color: C.amber });
    d.text(s, "daha az işlemci (her kullanıcı yükseltebilir) →", { x: x0 + w - 5.5, y: y - 0.42, w: 5.5, h: 0.35, fontSize: 13, bold: true, color: C.mintDeep, align: "right" });
  }
  d.card(s, MX, 3.45, 5.95, 3.4, { title: "5. hafta tekrarı", body: [
    "Küçük sayı = yüksek öncelik, 5. haftadaki gibi.",
    "Linux işlemciyi ağırlığa göre paylaştırır: nice 0 → 1024, nice 10 → 110; her adım ≈ × 1,25.",
    "top PR = 20 + NI gösterir.",
  ], bodySize: 16 });
  d.code(s, MX + 6.2, 3.45, 5.95, 3.4,
`# TEK çekirdekte işlemci yoğun iki iş
pay(nice 0)  = 1024 / (1024 + 110)
             = %90.3
pay(nice 10) =  110 / (1024 + 110)
             =  %9.7
oran         = 1024 / 110 = 9.31
denetim: 1.25^10 = 9.31`, 13);
  s.addNotes("Bu, 5. hafta notlarındaki deneyin cpu_hog yerine yes ile tekrarıdır. Ağırlıklar çekirdeğin sched_prio_to_weight tablosundan; sayılar check_numbers.py ile denetlendi. 'nice' adı gerçek anlamıyla kullanılır: nice değeri yüksek bir süreç ötekilere karşı daha 'nazik'tir. Sıradan kullanıcılar süreçlerini yalnızca daha nazik yapabilir (değeri yükseltebilir), asla düşüremez — yoksa herkes −20 ayarlardı.");

  // 32 ── nice gösterimi
  s = d.content({ kicker: "Uygulama · nice, renice", title: "Uygulamada nice ve renice" });
  term(s, MX, 1.65, 7.75, 5.2, cut(L("out_nice.txt", 1, 28), 80), 10.5);
  d.card(s, MX + 8.0, 1.65, 4.15, 5.2, { title: "Neye dikkat etmeli?", body: [
    "Tek başına nice geçerli değeri yazdırır: 0.",
    "nice -n 10: NI 10, STAT RN (N = nice uygulanmış).",
    "renice yukarı (10 → 15): izinli. Aşağı (15 → 5): Permission denied.",
    "Tek çekirdekte iki yes (taskset -c 1): %89,3 ve %9,6, oran 9,30 — öngörülen 9,31.",
  ], bodySize: 13.5 });
  s.addNotes("renice iletisinde nice değerine 'priority' diyor — aynı şey. 'nice -n -5 sleep 1' bir uyarı yazdırır ama sleep'i yine de nice 0 ile çalıştırır. taskset -c 1 bir süreci 1 numaralı işlemci çekirdeğine bağlar; o olmasaydı iki yes sürecinin her biri kendi çekirdeğini alır ve ikisi de yaklaşık %100 gösterirdi. Ölçülen oran 89,3/9,6 = 9,30 (check_numbers.py) — 5. haftanın formülü gerçek bir çekirdekte çalışıyor. sudo renice -n -5 root olarak işe yarardı (11. hafta); paylaşılan makinelerde yapmayın.");

  // 33 ── zombi kodu
  s = d.codeSlide({
    kicker: "3. haftayla bağlantı · zombiler", title: "zombie.c: Kimsenin Beklemediği Bir Çocuk",
    code: raw("zombie_excerpt.c"), size: 11, codeW: 7.75, sideTitle: "Plan",
    side: [
      "fork(): ebeveyn ve çocuk (3. hafta).",
      "Çocuk hemen 7 durumuyla çıkar.",
      "Ebeveyn wait() ÇAĞIRMADAN 25 s uyur: bu sırada çocuk bir zombidir.",
      "Sonra waitpid() 7 durumunu toplar: zombi kaldırılır.",
    ],
  });
  s.addNotes("Açıklamalar ve #include satırlarıyla tam program code/zombie.c dosyasında; gcc -Wall -O2 -o zombie zombie.c (ya da make) ile derleyin. Uyarısız derlenir. 3. haftadaki tanımı hatırlayın: zombi, sonlanmış ama çıkış durumu ebeveyni tarafından henüz toplanmamış bir süreçtir. Bellek ya da işlemci kullanmaz ama bir süreç tablosu girdisini ve PID'sini işgal eder.");

  // 34 ── zombi çalıştırması
  s = d.content({ kicker: "Uygulama · Z durumu", title: "Z Durumunu Görmek — ve Onu Öldürememek" });
  term(s, MX, 1.65, 7.75, 5.2, cut(L("out_zombie.txt", 2, 28), 80), 10.5);
  d.card(s, MX + 8.0, 1.65, 4.15, 5.2, { title: "Neye dikkat etmeli?", body: [
    "PID 3120: STAT Z, [zombie] <defunct>, PPID 3119.",
    "/proc da aynısını söyler: State Z (zombie).",
    "kill -9 hiçbir şey yapmaz: süreç zaten ölü.",
    "Ebeveynin waitpid() çağrısından sonra: çıkış durumu 7 ve zombi gitti.",
  ], bodySize: 14 });
  s.addNotes("Zombilerin gerçek çaresi EBEVEYNİ düzeltmek ya da sonlandırmaktır. Ebeveyn öldürülürse zombi yetim kalır, PID 1 (ya da bir subreaper) tarafından evlat edinilir ve hemen toplanır — 3. hafta. Birkaç zombi zararsızdır; binlercesi süreç tablosunu doldurabilir (makinemizde pid_max 32768'dir, yani en büyük PID 32767). Gösterimdeki yerleşik 'wait' komutu yalnızca arka plan işi ./zombie'nin bitmesini bekler.");

  // 35 ── Kopya kâğıdı 2
  s = d.tableSlide({
    kicker: "Kopya kâğıdı", title: "İşleri ve Süreçleri Denetlemek: Bir Bakışta",
    header: ["Komut / tuş", "Etkisi"],
    colW: [4.6, 7.55],
    rows: [
      ["command &", "arka planda başlat; [iş] PID yazdırır"],
      ["Ctrl+C   ·   Ctrl+Z", "ön plan işine SIGINT   ·   SIGTSTP: durdur"],
      ["jobs   ·   jobs -l", "bu kabuğun işlerini listele (PID'lerle)"],
      ["fg %n   ·   bg %n", "ön plana getir   ·   arka planda sürdür"],
      ["kill PID   ·   kill %n", "bir sürece / bir işe SIGTERM (15)"],
      ["kill -9   ·   -STOP   ·   -CONT", "SIGKILL (son çare)   ·   duraklat   ·   sürdür"],
      ["pkill -u student name   ·   killall", "süreçlere adlarıyla sinyal gönder"],
      ["nohup command > log 2>&1 &", "terminal kapandıktan sonra da çalışsın"],
      ["nice -n 10 cmd   ·   renice -n 15 -p PID", "nice değeriyle başlat / değiştir (kullanıcı: yalnızca yukarı)"],
    ],
    fontSize: 14.5, y: 1.65,
  });
  s.addNotes("Kopya kâğıdının ikinci yarısı. Ders notlarında iki tablo ve tam sinyal tablosu birlikte yer alıyor.");

  // 36–37 ── Laboratuvar alıştırmaları
  s = d.cardsSlide({
    kicker: "Derste laboratuvar · 30–40 dk", title: "Laboratuvar Alıştırmaları (1/2): İnceleme ve Denetim",
    cards: [
      { title: "A · İnceleme (1–5)", body: ["echo $$ ve onu ps içinde bulun", "ps -f: ps'in ebeveyni kim?", "sleep 1000 &: /proc/$!/status'tan State ve PPid", "iki sleep ile pstree -p $$", "R ve S: yes ve sleep yan yana"] },
      { title: "B · İş denetimi (6–9)", body: ["sleep 500, Ctrl+Z, jobs, STAT T", "bg; jobs -l ve ps ile denetleyin", "üç iş; fg %2, sonra Ctrl+C", "kill %1 ve kill 1: açıklayın"] },
    ], cols: 2, bodySize: 16.5,
    callout: "~/lab içinde çalışın (önce bash mcmp117_lab_setup.sh). Her komutu ve çıktısını yazın: ders notlarındaki Laboratuvar Föyü 17 alıştırmanın tümünü ve puanlarını içerir.",
  });
  s.addNotes("Öğrencilere iki slayt için toplam 30–40 dakika verin. Sınıfta dolaşın: en sık sorunlar kill %1 yerine kill 1 yazmak, & koymayı unutup istemi kaybetmek (Ctrl+C ya da Ctrl+Z'ye basın) ve -u olmadan pkill kullanmaktır. Çözümler ders notlarının sonunda.");
  s = d.cardsSlide({
    kicker: "Derste laboratuvar · 30–40 dk", title: "Laboratuvar Alıştırmaları (2/2): Sinyal, Öncelik, Zombi",
    cards: [
      { title: "C · Sinyaller (10–13)", body: ["SIGTERM, SIGKILL, SIGINT sonrası $?: 128 + n'yi açıklayın", "STOP ve CONT: STAT'ı izleyin", "pgrep -c, pkill -u student", "nohup ve yalın iş: ikisine de kill -HUP"] },
      { title: "D · Öncelik, zombiler, meydan okuma (14–17)", body: ["nice -n 15, renice ile 19'a, sonra 0'a", "./zombie 30 &: Z'yi bulun, kill -9 deneyin", "%CPU'ya göre ilk 3 süreç (--sort)", "bir 12. hafta boru hattıyla süreçlerinizi duruma göre sayın"] },
    ], cols: 2, bodySize: 16.5,
    callout: "Bitirince temizleyin: jobs boş olmalı ve pgrep -u student -l sleep hiçbir şey yazdırmamalı.",
  });
  s.addNotes("17. alıştırma 12. haftaya bağlanır: ps -u student -o stat= | cut -c1 | sort | uniq -c. Erken bitiren öğrenciler htop'u keşfedebilir.");

  // 38 ── Sık yapılan hatalar
  s = d.tableSlide({
    kicker: "Sık yapılan hatalar", title: "Hata İletileri ve Anlamları",
    header: ["Gördüğünüz", "Neden?", "Çözüm"],
    colW: [4.6, 4.0, 3.55],
    rows: [
      ["-bash: kill: (1) - Operation not permitted", "kill 1, PID 1 demektir (sistem!)", "1. iş için kill %1"],
      ["-bash: kill: %6: no such job", "iş numaraları kabuğa özgüdür", "önce jobs ile bakın"],
      ["renice: … Permission denied", "kullanıcılar nice'ı düşüremez", "yalnızca yükseltin (ya da root)"],
      ["nice: cannot set niceness: Permission denied", "kullanıcı olarak negatif nice", "yine de nice 0 ile çalışır"],
      ["istem geri gelmiyor", "bir ön plan işi çalışıyor", "Ctrl+C ya da Ctrl+Z, sonra bg"],
      ["[1]+ Stopped … (tty input)", "arka plan işi klavyeyi istiyor", "fg %1"],
      ["Z <defunct> kill -9'dan sağ çıkıyor", "zombiler zaten ölüdür", "ebeveyni bitirin ya da düzeltin"],
    ],
    fontSize: 14.5, y: 1.65,
    callout: "Yeniden yazmadan önce iletiyi okuyun: bash, kill, renice ve nice hangi kuralı çiğnediğinizi size tam olarak söyler.",
  });
  s.addNotes("kill 1, renice, nice ve zombi iletileri yakaladığımız çıktılarda yer alıyor (out_lab.txt, out_nice.txt, out_zombie.txt); ötekiler standart bash iletileri. 'Stopped (tty input)' durumu: 'nano &' ya da 'cat &' çalıştırıp görün. Türkçe yerel ayarlı (LANG=tr_TR.UTF-8) bir sistemde bu iletilerin bir kısmı Türkçe görünebilir; ders çıktıları LC_ALL=C.UTF-8 kullanır.");

  // 39 ── Kısa sınav
  s = d.quizSlide({ questions: [
    "ps sürecinizin STAT değerini T gösteriyor. Buna en yakın 3. hafta durumu hangisi; onu hangi iki komut geri getirir?",
    "Bir iş bitti ve echo $? 137 yazdırıyor. Ona ne oldu? 143 ne anlama gelirdi?",
    "Tek çekirdekte işlemci yoğun iki sürecin nice değerleri 0 ve 10. Her biri yaklaşık hangi işlemci payını alır?",
    "kill -9 bir zombiyi neden kaldıramaz? Onu ne kaldırır?",
  ] });
  s.addNotes("Yanıtlar. (1) T = durdurulmuş; 3. haftada böyle bir durum yoktur — ne hazır ne de bekliyor durumundadır; fg ya da bg (ikisi de SIGCONT gönderir) ya da kill -CONT. (2) 137 = 128 + 9: SIGKILL ile öldürüldü; 143 = 128 + 15: SIGTERM. (3) Yaklaşık %90,3 ve %9,7 (ağırlıklar 1024 ve 110); biz %89,3 ve %9,6 ölçtük. (4) Zombi zaten sonlanmıştır; yalnızca ebeveyninin çıkış durumunu wait() ile toplamasını bekler. Ebeveyni sonlandırmak, PID 1'in onu evlat edinip toplamasını sağlar.");

  // 40 ── Akılda kalanlar
  s = d.content({ kicker: "Toparlama", title: "13. Hafta: Akılda Kalması Gerekenler" });
  d.bullets(s, [
    { b: "Süreçler:", t: " her komut, kabuğun fork + exec ile oluşturduğu, PID'si ve PPID'si olan bir süreçtir (3. hafta)." },
    { b: "Bakmak:", t: " ps (-f, -ef, aux, -o), pstree, top/htop, /proc/<pid>/status (PCB)." },
    { b: "STAT:", t: " R = hazır/çalışıyor, S/D = bekliyor, T = durdurulmuş, Z = sonlandı ama toplanmadı." },
    { b: "İş denetimi:", t: " & arka planda başlatır; Ctrl+Z durdurur; jobs, fg, bg; %n bir iş, yalın sayı bir PID'dir." },
    { b: "Sinyaller:", t: " kill varsayılan olarak SIGTERM (15) gönderir; Ctrl+C = SIGINT (2); kill -9 = SIGKILL, son çare; $? = 128 + n." },
    { b: "Öncelik:", t: " nice −20…19, kullanıcılar yalnızca yükseltebilir; nice 10'a karşı 0 ≈ işlemcinin 1 : 9,3'ü (5. hafta)." },
    { b: "Zombiler:", t: " onları yalnızca ebeveynin wait() çağrısı kaldırır." },
  ], { fontSize: 17, y: 1.7, h: 5.15, paraSpaceAfter: 10 });
  s.addNotes("Hızlıca okuyun; her satır final sınavı (15. hafta) için olası bir sorudur.");

  // 41–42 ── Kapanış
  d.closing({ nextWeek: "Kabuk Betiklerine Giriş", nextItems: [
    "Neden betik: bugün yazdıklarınızı otomatikleştirin",
    "Shebang, chmod +x, değişkenler, tırnaklama, $( ) ve $(( ))",
    "$0 $1 $# $@, read, çıkış durumu $? ve exit",
    "test / [ ], if, for, while, fonksiyonlar, bash -x",
    "İki gerçek betik: ~/lab/scripts içinde backup.sh ve report.sh",
  ] });
  d.pres.slides[d.n - 2].addNotes("Gelecek hafta komutları dosyalara koyup onları programa dönüştürüyoruz. Bugünkü her şey geri dönecek: arka plan işleri için $$ ve $!, if deyimlerinde $? ve 128 + n kuralı, görevleri paralel çalıştırmak için & ve wait. 15. hafta final sınavı tekrarı.");
  d.pres.slides[d.n - 1].addNotes("Sözü sorulara bırakın. Laboratuvar föyünün ve çözümlerinin ders notlarında olduğunu, Telegram kanalında sorulan soruların herkese yardımcı olduğunu hatırlatın.");

  await d.save(path.join(__dirname, "MBLP131_Hafta13.pptx"));
  console.log("slides:", d.n);
})();
