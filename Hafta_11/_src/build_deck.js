// Hafta 11 sunumu (MBLP131, Türkçe): İzinler, Sahiplik ve Kullanıcılar (uygulamalı Linux, 6 haftanın 3.'sü)
// İngilizce referans: ../week11/build_deck.js (aynı slayt sırası, aynı diyagramlar, aynı gerçek çıktılar)
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("../lib/deck");
const d = new Deck({ week: 11, lang: "tr", assets: path.join(__dirname, "../lib") });
const code = f => fs.readFileSync(path.join(__dirname, "code", f), "utf8");
const P = d.pres;
const PALE = "D7E9E6", GREY = "E4E8E9", ERR = "F4A79D", REDPALE = "F3D9D6";

// ---------- yakalanmış terminal oturumları (code/out_*.txt, code/capture_all.sh ile üretildi) ----------
// Bir döküm {p: istem, c: komut, o: [çıktı satırları]} bloklarının listesidir.
function T(f) {
  const out = [];
  for (const ln of code(f).replace(/\n+$/, "").split("\n")) {
    if (ln.startsWith("### ")) continue;
    const m = ln.match(/^(student@okan-lab:[^$]*\$ )(.*)$/);
    if (m) out.push({ p: m[1], c: m[2], o: [] });
    else if (out.length) out[out.length - 1].o.push(ln);
  }
  return out;
}
const J = bs => bs.map(b => [b.p + b.c, ...b.o].join("\n")).join("\n");
const find = (bs, cmd) => { const b = bs.find(x => x.c === cmd); if (!b) throw new Error("komut bulunamadı: " + cmd); return b; };
const pick = (bs, cmds) => cmds.map(c => typeof c === "string" ? find(bs, c) : c);

// Terminal kutusu: istem nane yeşili, komut beyaz, hatalar açık kırmızı, "..." soluk.
// Yazı boyutu, hiçbir satır kaymayacak şekilde kendiliğinden küçülür (eş aralıklı karakter ≈ 0,6 em).
function term(s, x, y, w, h, text, maxSize = 13) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.dark }, rectRadius: 0.05, line: { type: "none" } });
  const lines = text.replace(/\n$/, "").split("\n");
  const maxLen = Math.max(...lines.map(l => l.length));
  let size = Math.min(maxSize, (w - 0.4) * 72 / (0.6 * maxLen), (h - 0.24) * 72 / (1.22 * lines.length));
  size = Math.max(8, Math.floor(size * 2) / 2);
  const runs = [];
  lines.forEach((ln, i) => {
    const br = i < lines.length - 1;
    const m = ln.match(/^(student@okan-lab:[^$]*\$ )(.*)$/);
    if (m) {
      runs.push({ text: m[1], options: { color: C.mint } });
      runs.push({ text: m[2] || " ", options: { color: C.white, bold: true, breakLine: br } });
    } else {
      const err = /Permission denied|not permitted|invalid mode|not in the sudoers|command not found|cannot /.test(ln);
      const muted = ln.trim() === "..." || ln.startsWith("#");
      runs.push({ text: ln.length ? ln : " ", options: { color: err ? ERR : muted ? C.mutedOnDark : C.light, breakLine: br } });
    }
  });
  s.addText(runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: h - 0.24, fontFace: F.code, fontSize: size, valign: "top", margin: 0, lineSpacingMultiple: 1.0, isTextBox: true });
  return size;
}

function line(s, x1, y1, x2, y2, o = {}) {
  s.addShape(P.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 0.0001, h: Math.abs(y2 - y1) || 0.0001,
    flipH: x2 < x1, flipV: y2 < y1, line: Object.assign({ color: C.slate, width: 1.25 }, o) });
}
function numDot(s, x, y, n, fill = C.mint) {
  s.addShape(P.shapes.OVAL, { x, y, w: 0.36, h: 0.36, fill: { color: fill }, line: { type: "none" } });
  d.text(s, String(n), { x, y, w: 0.36, h: 0.36, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle" });
}
function warn(s, x, y, w, h, text, size = 13.5) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: REDPALE }, rectRadius: 0.06, line: { color: C.red, width: 1 } });
  d.text(s, [{ text: "Dikkat:  ", options: { bold: true, color: C.red } }, { text, options: { color: "5A2A25" } }],
    { x: x + 0.2, y, w: w - 0.4, h, fontSize: size, valign: "middle" });
}
// tek bir izin biti kutusu: harf, sınıf renginin üzerinde; "-" gri
const CLS = { u: C.mint, g: "7FB8C2", o: "BFD3D7" };
function bitBox(s, x, y, w, h, ch, cls, size = 26) {
  const on = ch !== "-";
  d.box(s, x, y, w, h, ch, { fill: on ? CLS[cls] : GREY, color: on ? C.dark : "9AA5A8", size, font: F.code });
}

// ---------- dökümlerden alınan veriler ----------
const USERS = T("out_users.txt"), LS = T("out_ls.txt"), SYM = T("out_chmod_sym.txt"), OCT = T("out_chmod_oct.txt");
const SCR = T("out_script.txt"), UM = T("out_umask.txt"), DIR = T("out_dirperm.txt"), OWN = T("out_owner.txt");
const ORD = T("out_order.txt"), SPEC = T("out_special.txt"), SUDO0 = T("out_sudo_denied.txt"), SUDO = T("out_sudo.txt"), GRP = T("out_group.txt");
const passwdLine = find(USERS, 'grep "^$USER:" /etc/passwd').o[0];          // student:x:1011:1013::/home/student:/bin/bash
const groupLine = find(USERS, "getent group students").o[0];                 // students:x:1010:
const sylLine = find(LS, "ls -l docs").o.find(l => l.endsWith("syllabus.txt")); // -rw-rw-r-- 1 student student 578 ...

(async () => {
  // 1 ── Başlık
  let s = d.titleSlide({
    kicker: "MBLP131  ·  HAFTA 11",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 11  ·  İzinler, Sahiplik ve Kullanıcılar",
    tagline: "Dosyalarınızı kim okuyabilir, değiştirebilir, çalıştırabilir — ve Linux buna nasıl karar verir?",
  });
  s.addNotes("11. haftaya hoş geldiniz; bu, uygulamalı Linux haftalarının üçüncüsü. Bugün: kullanıcılar ve gruplar, 9. haftadan beri ls -l çıktısında gördüğünüz 10 karakterlik izin dizgesi, sembolik ve sekizli biçimde chmod, varsayılan izinler (umask), sahiplik, root ve sudo, ve iki özel bit. Herkesin bir terminali açık olmalı: laboratuvar bilgisayarı, WSL ya da Ubuntu sanal makinesi. Günün ilk komutu: bash mcmp117_lab_setup.sh; böylece temiz bir ~/lab klasörü elde edersiniz.");

  // 2 ── Geçen hafta
  s = d.cardsSlide({
    kicker: "Geçen hafta", title: "Dört Fikirde 10. Hafta",
    cardH: 2.6, cards: [
      { title: "Oluştur, kopyala, taşı", body: "mkdir -p, touch, cp -r, mv, rm -r, rmdir. rm'nin geri dönüşüm kutusu yoktur." },
      { title: "Joker karakterler", body: "* ? [abc] ve {a,b}: komut çalışmadan önce kabuk tarafından genişletilir." },
      { title: "İçine bakmak", body: "cat, less, head, tail -f, wc, file, du -sh, df -h." },
      { title: "Düğümler ve bağlantılar", body: "stat düğümü (inode) gösterir; ln yeni bir ad ekler, ln -s bir yol saklar." },
    ], cols: 4, bodySize: 16,
    callout: "stat şu satırı yazdırmıştı:  Access: (0664/-rw-rw-r--)  — bugün bu satırın iki yarısını okumayı ve değiştirmeyi öğreniyoruz.",
  });
  s.addNotes("İki dakikalık tekrar. Sorun: *.jpg ifadesini kim genişletir, kabuk mu ls mi? (Kabuk.) Düğüm numarasını hangi komut gösterir? (ls -i, stat.) 7. haftada 'koruma' (protection) bilgisini düğümde saklanan dosya özniteliklerinden biri olarak saydığımızı hatırlatın: bugünün konusu tam olarak bu.");

  // 3 ── Gündem
  s = d.content({ kicker: "Hafta 11", title: "Bugünün Gündemi" });
  [
    ["1", "Neden ve kimin için?", "Koruma (2. ve 7. haftalar), kullanıcılar, gruplar, /etc/passwd ve /etc/group."],
    ["2", "İzinleri okumak", "10 karakterlik mod dizgesi; dosyalarda ve dizinlerde r, w, x."],
    ["3", "İzinleri değiştirmek", "Sembolik (u+x) ve sekizli (754) chmod; bir betiği çalıştırılabilir yapmak."],
    ["4", "Varsayılanlar ve dizinler", "umask ve r, w, x'in bir dizin için gerçekte ne anlama geldiği."],
    ["5", "Sahiplik ve root", "chown, chgrp, bir grupla paylaşım, sudo, setuid ve yapışkan bit."],
    ["6", "Laboratuvar", "Bir proje klasörünü güvenli hâle getirin; notlarda 16 puanlı alıştırma."],
  ].forEach((a, i) => {
    const y = 1.65 + i * 0.86;
    d.box(s, MX, y, 0.72, 0.72, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 0.9, y, w: 11.25, h: 0.72, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "   ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.2, y, w: 10.8, h: 0.72, valign: "middle" });
  });
  s.addNotes("1–3. bölümler moladan önce (canlı gösterimlerle yaklaşık 50 dakika), 4–5. bölümler moladan sonra; ardından 30–40 dakikalık laboratuvar çalışması. Slaytlardaki tüm terminal çıktıları, bir Linux makinesinde student adlı sıradan bir kullanıcıyla yakalanmış gerçek çıktılardır; kendi makinenizde tarihler, boyutlar, kullanıcı ve grup numaraları farklı olacaktır.");

  // ───────────────────────── BÖLÜM 1
  s = d.sectionSlide({ kicker: "Bölüm 1", title: "Kullanıcılar, Gruplar ve Koruma", subtitle: "Her dosyanın bir sahibi vardır; her süreç birinin adına çalışır." });
  s.addNotes("Geçiş: Linux çok kullanıcılı bir sistemdir. Dizüstü bilgisayarınızda bile onlarca kullanıcı vardır (çoğu sistem hizmetleri içindir). Kimin neyi yapabileceğine izinler (permissions) karar verir.");

  // 5 ── Neden izinler?
  s = d.content({ kicker: "Neden izinler?", title: "Çekirdek Her open() Çağrısını Denetler — Atlanamaz" });
  {
    const y = 1.95;
    d.box(s, MX, y, 2.85, 1.3, "Süreç (kullanıcı modu)", { sub: "cat, nano, bash …\nstudent olarak çalışıyor (UID 1011)", fill: C.light, size: 15, subSize: 12 });
    d.box(s, MX + 4.35, y, 3.0, 1.3, "Çekirdek (çekirdek modu)", { sub: "sürecin UID / GID'lerini\ndüğümdekilerle karşılaştırır", fill: C.charcoal, size: 15, subSize: 12 });
    d.box(s, MX + 8.85, y, 3.3, 1.3, "notes.txt dosyasının düğümü", { sub: "sahip root · grup root\nmod -rw-r--r--", fill: PALE, size: 15, subSize: 12, color: C.dark });
    d.arrow(s, MX + 2.87, y + 0.65, MX + 4.33, y + 0.65, { color: C.mintDeep, w: 2.25 });
    d.text(s, "sistem çağrısı\nopen(\"notes.txt\", O_WRONLY)", { x: MX + 2.75, y: y - 0.62, w: 1.75, h: 0.6, fontSize: 10.5, color: C.mintDeep, align: "center", valign: "bottom", fontFace: F.code });
    d.arrow(s, MX + 8.83, y + 0.65, MX + 7.37, y + 0.65, { color: C.slate, w: 2.25 });
    d.text(s, "sahip, grup, mod", { x: MX + 7.35, y: y + 0.2, w: 1.5, h: 0.4, fontSize: 11, italic: true, color: C.slate, align: "center", valign: "bottom" });
    d.box(s, MX + 2.6, y + 1.95, 3.0, 0.75, "izin var → dosya tanımlayıcısı 3", { fill: C.mint, color: C.dark, size: 13.5 });
    d.box(s, MX + 6.1, y + 1.95, 3.6, 0.75, "izin yok → EACCES hatası", { sub: "kabuk \"Permission denied\" yazdırır", fill: REDPALE, color: C.red, size: 14, subSize: 11.5 });
    d.arrow(s, MX + 5.3, y + 1.32, MX + 4.4, y + 1.93, { color: C.mintDeep, w: 1.75 });
    d.arrow(s, MX + 6.4, y + 1.32, MX + 7.6, y + 1.93, { color: C.red, w: 1.75 });
  }
  const yc = 5.0, cw = (12.15 - 0.5) / 3;
  d.card(s, MX, yc, cw, 1.85, { title: "2. hafta: ikili mod", body: "Diske yalnızca çekirdek dokunabilir. Program bir sistem çağrısıyla istemek zorundadır; bu yüzden denetim atlanamaz.", bodySize: 13 });
  d.card(s, MX + cw + 0.25, yc, cw, 1.85, { title: "7. hafta: dosya öznitelikleri", body: "\"Koruma\", düğümde sahip, grup, boyut ve zaman damgalarının yanında duran bir özniteliktir.", bodySize: 13 });
  d.card(s, MX + 2 * (cw + 0.25), yc, cw, 1.85, { title: "Bugün: Linux kuralı", body: "Üç sınıf (sahip, grup, diğerleri) × üç hak (okuma, yazma, çalıştırma) = 9 bit.", bodySize: 13 });
  s.addNotes("Bu slayt kuram haftalarına köprüdür. 2. hafta: donanımdaki ikili mod, kullanıcı programlarının G/Ç'yi kendilerinin yapamayacağı anlamına gelir; bir sistem çağrısı yapmak zorundadırlar ve kapıyı tutan çekirdektir. 7. hafta: koruma özniteliği düğümde (inode) durur. Denetim open() içinde yapılır (ayrıca exec, unlink, chdir… içinde). Başarısız olursa sistem çağrısı -1 döndürür, errno = EACCES olur ve program 'Permission denied' yazdırır. Not: denetim açma anında yapılır; dosyayı zaten açmış olan bir süreç, sonradan chmod yapılsa bile erişimini korur.");

  // 6 ── Kullanıcılar ve gruplar
  s = d.content({ kicker: "Kullanıcılar ve gruplar", title: "Ben Kimim? Kullanıcılar, Gruplar ve Numaraları" });
  d.card(s, MX, 1.65, 6.2, 1.62, { title: "Kullanıcı (user)", body: "Bir oturum adı ve bir numara, yani UID. Çekirdek yalnızca numarayı saklar ve karşılaştırır. root (UID 0) süper kullanıcıdır; sistem kullanıcıları hizmetleri çalıştırır.", bodySize: 13 });
  d.card(s, MX, 3.45, 6.2, 1.62, { title: "Grup (group)", body: "Numarası (GID) olan, adlandırılmış bir kullanıcı kümesi. Her kullanıcının bir birincil grubu vardır, ek gruplara da üye olabilir. Ubuntu her kullanıcıya aynı adlı özel bir grup verir.", bodySize: 13 });
  d.card(s, MX, 5.25, 6.2, 1.6, { title: "Bir sürecin kimlik bilgileri", body: "Her süreç, onu başlatan kişinin UID ve GID'lerini taşır. Yeni bir dosya sizin UID'nizi ve birincil GID'nizi alır.", bodySize: 13.5 });
  term(s, MX + 6.45, 1.65, 5.7, 3.0, J(pick(USERS, ["whoami", "id", "groups"])), 13);
  d.card(s, MX + 6.45, 4.85, 5.7, 2.0, { title: "id çıktısını okumak", body: [
    { b: "uid=1011(student):", t: " numaram ve adım." },
    { b: "gid=1013(student):", t: " birincil grubum." },
    { b: "groups=…:", t: " üyesi olduğum bütün gruplar." },
  ], bodySize: 13.5 });
  s.addNotes("whoami, id ve groups yazın. Yeni kurulmuş bir Ubuntu'da ilk kullanıcının UID'si 1000'dir; laboratuvar makinemizde birkaç hesap olduğu için bu öğrencinin numarası 1011 — sizin numaralarınız farklı olacaktır. Vurgulayın: adlar insanlar için, numaralar çekirdek içindir; ls -l numaraları yeniden adlara çevirir. 'students' (sonunda s ile) ayrı bir gruptur; onu ileride paylaşım için kullanacağız.");

  // 7 ── /etc/passwd ve /etc/group
  s = d.content({ kicker: "Hesap dosyaları", title: "/etc/passwd ve /etc/group: Her Hesaba Bir Satır" });
  function fieldRow(y, title, fields, labels, widths) {
    d.text(s, title, { x: MX, y: y - 0.42, w: 9, h: 0.36, fontSize: 14, bold: true, color: C.mintDeep });
    let x = MX;
    fields.forEach((f, i) => {
      d.box(s, x, y, widths[i], 0.55, f === "" ? "(boş)" : f, { fill: i === 0 ? C.charcoal : PALE, color: i === 0 ? C.white : f === "" ? C.mutedOnLight : C.dark, size: 15, font: F.code, bold: f !== "" });
      d.text(s, labels[i], { x: x - 0.05, y: y + 0.6, w: widths[i] + 0.1, h: 0.55, fontSize: 11, color: "3A464C", align: "center", valign: "top" });
      x += widths[i];
      if (i < fields.length - 1) { d.text(s, ":", { x, y, w: 0.22, h: 0.55, fontSize: 20, bold: true, color: C.red, align: "center", valign: "middle", fontFace: F.code }); x += 0.22; }
    });
  }
  const pf = passwdLine.split(":");
  fieldRow(2.15, "/etc/passwd  —  iki nokta üst üste ile ayrılmış 7 alan", pf,
    ["1 kullanıcı adı", "2 parola: x = /etc/shadow'da", "3 UID", "4 GID (birincil grup)", "5 açıklama (tam ad)", "6 ev dizini", "7 oturum kabuğu"],
    [1.55, 1.3, 1.2, 1.3, 1.3, 2.3, 1.75]);
  const gf = groupLine.split(":");
  fieldRow(3.95, "/etc/group  —  4 alan", gf, ["1 grup adı", "2 parola (kullanılmaz)", "3 GID", "4 üyeler, virgülle ayrılmış"], [1.75, 1.45, 1.2, 2.6]);
  term(s, MX, 5.2, 7.6, 1.65, J(pick(USERS, ["ls -l /etc/passwd /etc/group /etc/shadow", "cat /etc/shadow"])), 12);
  d.card(s, MX + 7.85, 3.55, 4.3, 3.3, { title: "Neden iki dosya?", body: [
    "/etc/passwd dosyasını herkes okuyabilmelidir (ls, UID'leri adlara çevirmek için ona ihtiyaç duyar).",
    "Parola özetleri /etc/shadow'da tutulur: yalnızca root ve shadow grubu okuyabilir.",
  ], bodySize: 13.5 });
  s.addNotes("grep \"^$USER:\" /etc/passwd ve getent group students komutlarını çalıştırın. Yedi alanı tek tek gezin. Öğrencimizde 5. alan boştur (normalde tam adı tutar). Kabuk alanı, bazı sistem kullanıcılarında neden /usr/sbin/nologin göründüğünü açıklar: bu kullanıcılarla kimse oturum açamaz. 'students' grubunun henüz üyesi yoktur (4. alan boş); ileride yönetici öğrencimizi bu gruba ekleyecek. Bu dosyalar asla elle düzenlenmez; yöneticiler useradd, usermod, passwd kullanır. /etc/shadow'un kendi modunun -rw-r----- olduğuna dikkat çekin; bunu birazdan çözeceğiz.");

  // 8 ── ls -l anatomisi
  s = d.content({ kicker: "ls -l çıktısını okumak", title: "ls -l Çıktısının Yedi Sütunu", lead: "Laboratuvar klasörümüzde  ls -l docs  çıktısından bir satır:" });
  {
    const m = sylLine.match(/^(\S+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(\w+\s+\d+\s+[\d:]+)\s+(.*)$/);
    const fields = m.slice(1, 8);
    const ws = [2.35, 0.65, 1.65, 1.65, 0.9, 2.35, 2.2], labels = ["tür + izinler", "bağlantı", "sahip", "grup", "boyut (bayt)", "son değişiklik", "ad"];
    let x = MX + 0.05;
    fields.forEach((f, i) => {
      d.box(s, x, 2.3, ws[i] - 0.08, 0.8, f, { fill: i === 0 ? C.charcoal : C.light, color: i === 0 ? C.mint : C.dark, size: 20, font: F.code });
      numDot(s, x + (ws[i] - 0.08) / 2 - 0.18, 3.25, i + 1, i === 0 ? C.mintDeep : C.slate);
      d.text(s, labels[i], { x: x - 0.1, y: 3.65, w: ws[i] + 0.12, h: 0.35, fontSize: 12, bold: true, color: C.charcoal, align: "center" });
      x += ws[i];
    });
  }
  d.card(s, MX, 4.3, 5.95, 2.55, { title: "1–2. sütunlar", body: [
    { b: "1 Mod:", t: " dosya türü + 9 izin biti — bir sonraki slayt." },
    { b: "2 Bağlantı sayısı:", t: " sabit bağlantı sayısı (7. ve 10. haftalar)." },
  ], bodySize: 14.5 });
  d.card(s, MX + 6.2, 4.3, 5.95, 2.55, { title: "3–7. sütunlar", body: [
    { b: "3, 4 Sahip ve grup:", t: " düğüm numaraları saklar; ls adları gösterir." },
    { b: "5–6:", t: " bayt cinsinden boyut ve değişiklik zamanı (mtime)." },
    { b: "7 Ad:", t: " düğümden değil, dizin girdisinden gelir." },
  ], bodySize: 14.5 });
  s.addNotes("Ad dışındaki her şey düğümden gelir (7. hafta). Sorun: /etc/passwd'de adı olmayan bir UID için ls -l ne gösterir? (Çıplak numarayı.) Bugün bizi 1., 3. ve 4. sütunlar ilgilendiriyor: mod, sahip ve grup.");

  // 9 ── Mod dizgesini çözmek
  s = d.content({ kicker: "Mod dizgesi", title: "-rwxr-x---  Dizgesini Karakter Karakter Çözmek" });
  {
    const mode = "-rwxr-x---", bw = 0.92, gap = 0.32, y = 2.25, bh = 0.85;
    const xs = []; let x = MX + 0.1;
    xs.push(x); x += bw + 0.55;
    for (let k = 0; k < 9; k++) { xs.push(x); x += bw + (k % 3 === 2 ? gap : 0.05); }
    d.box(s, xs[0], y, bw, bh, mode[0], { fill: C.charcoal, color: C.white, size: 26, font: F.code });
    const cls = ["u", "u", "u", "g", "g", "g", "o", "o", "o"];
    for (let k = 0; k < 9; k++) bitBox(s, xs[k + 1], y, bw, bh, mode[k + 1], cls[k]);
    const heads = [["tür", 0, 0], ["kullanıcı (u) = sahip", 1, 3], ["grup (g)", 4, 6], ["diğerleri (o) = geri kalan herkes", 7, 9]];
    heads.forEach(([t, a, b]) => {
      const x0 = xs[a], x1 = xs[b] + bw;
      d.text(s, t, { x: x0 - 0.3, y: 1.62, w: x1 - x0 + 0.6, h: 0.35, fontSize: 14, bold: true, color: C.charcoal, align: "center" });
      if (b > a) { line(s, x0, 2.07, x1, 2.07, { color: C.mintDeep, width: 2 }); line(s, x0, 2.07, x0, 2.18, { color: C.mintDeep, width: 2 }); line(s, x1, 2.07, x1, 2.18, { color: C.mintDeep, width: 2 }); }
    });
    const wts = [4, 2, 1];
    for (let k = 0; k < 9; k++) {
      const on = mode[k + 1] !== "-";
      d.text(s, "×" + wts[k % 3], { x: xs[k + 1], y: y + bh + 0.05, w: bw, h: 0.32, fontSize: 13, color: C.mutedOnLight, align: "center", bold: true });
      d.box(s, xs[k + 1] + 0.16, y + bh + 0.42, bw - 0.32, 0.42, on ? "1" : "0", { fill: on ? C.charcoal : C.light, color: on ? C.white : "9AA5A8", size: 15, font: F.code });
    }
    d.text(s, "ağırlık", { x: xs[0] - 0.15, y: y + bh + 0.05, w: bw + 0.3, h: 0.32, fontSize: 12, italic: true, color: C.mutedOnLight, align: "center" });
    d.text(s, "bit", { x: xs[0] - 0.15, y: y + bh + 0.47, w: bw + 0.3, h: 0.32, fontSize: 12, italic: true, color: C.mutedOnLight, align: "center" });
    const sums = [["4 + 2 + 1 = 7", 1], ["4 + 0 + 1 = 5", 4], ["0 + 0 + 0 = 0", 7]];
    sums.forEach(([t, a]) => {
      const x0 = xs[a], x1 = xs[a + 2] + bw;
      d.box(s, x0, y + bh + 1.0, x1 - x0, 0.55, t, { fill: PALE, color: C.dark, size: 16, font: F.code });
    });
    d.text(s, "sekizli", { x: xs[0] - 0.15, y: y + bh + 1.05, w: bw + 0.3, h: 0.45, fontSize: 12, italic: true, color: C.mutedOnLight, align: "center", valign: "middle" });
  }
  d.callout(s, MX, 4.85, 12.15, 0.75, "-rwxr-x---  =  750:   sahip okuyabilir, yazabilir, çalıştırabilir  ·  grup okuyup çalıştırabilir  ·  diğerleri: hiçbir şey", 15);
  d.card(s, MX, 5.8, 5.95, 1.05, { body: [{ b: "Tür harfi:", t: "  -  normal dosya   d  dizin   l  sembolik bağlantı   c / b  aygıt" }], bodySize: 13.5 });
  d.card(s, MX + 6.2, 5.8, 5.95, 1.05, { body: [{ b: "Sayalım:", t: "  sınıf başına 3 bit → 2³ = 8 olasılık → tam olarak bir sekizli (octal) basamak (0–7)." }], bodySize: 13.5 });
  s.addNotes("Günün anahtar slaydı. İlk karakter dosya türüdür. Ardından üç üçlü gelir; her zaman r, w, x sırasıyla ve her zaman kullanıcı, grup, diğerleri için. Harf bitin kurulu olduğunu, tire kurulu olmadığını gösterir. Her konumun bir ağırlığı vardır: r = 4, w = 2, x = 1; dolayısıyla her üçlü 0 ile 7 arasında bir sayıdır, yani tek bir sekizli basamak. 750, chmod 750 yazarken kullandığınız sayıdır. Sorun: ---------- nedir? (000). -rw-r--r-- nedir? (644).");

  // 10 ── r w x: dosya ve dizin
  s = d.tableSlide({
    kicker: "r, w, x", title: "Aynı Üç Harf, Farklı Anlamlar",
    header: ["Bit", "Normal bir dosyada", "Bir dizinde"],
    colW: [1.0, 5.2, 5.95],
    rows: [
      ["r  (4)", "içeriği okumak: cat, less, cp", "içindeki adları listelemek: ls"],
      ["w  (2)", "içeriği değiştirmek: nano, echo >>", "girdi oluşturmak, silmek, yeniden adlandırmak (x de gerekir)"],
      ["x  (1)", "program ya da betik olarak çalıştırmak: ./hello.sh", "içine girmek ve içindekilere ulaşmak: cd, cat dizin/dosya"],
    ],
    fontSize: 15.5, y: 1.75,
    callout: "Bir dosyayı silmek, dosyanın değil DİZİNİNİN değişmesidir: dizinde w + x gerekir — dosyanın kendi w biti önemli değildir.",
  });
  d.card(s, MX, 4.05, 12.15, 1.7, { title: "Dizindeki x biti kapının anahtarıdır", body: "Bir dizinde x yoksa, tam adını bilseniz ve dosyanın kendisi okunabilir olsa bile, o dizine cd ile giremez, altındaki hiçbir şeyi açamazsınız. r yoksa dizini listeleyemezsiniz; ama x varsa adını bildiğiniz bir dosyayı yine de açabilirsiniz.", bodySize: 14 });
  s.addNotes("7. haftayı hatırlayın: bir dizin (ad, düğüm) çiftlerinden oluşan bir tablodur. r = bu tabloyu okumak (adları listelemek). w = tabloyu değiştirmek (girdi eklemek, silmek, yeniden adlandırmak). x = bir yolu izlemek için tabloda arama yapmak. Salt okunur bir dosyayı silmenin, dizinde w varsa serbest olmasının şaşırtıcı nedeni budur — bunu moladan sonra göstereceğiz. Tipik öğrenci hatası: bir dizine chmod 644 uygulamak (x kalkar) ve ardından cd'nin başarısız olması.");

  // 11 ── Hangi sınıf uygulanır?
  s = d.content({ kicker: "Erişim denetimi", title: "Tek Sınıf Geçerli: Sahip, Yoksa Grup, Yoksa Diğerleri" });
  {
    const x = MX, w = 3.5, h = 0.72, ys = [1.75, 2.85, 3.95, 5.05];
    const q = ["Süreç root mu (UID 0)?", "UID'si dosyanın sahibi mi?", "Dosyanın grubu, sürecin gruplarından biri mi?", "Hiçbiri değilse …"];
    const a = ["izin var (neredeyse her zaman)", "sahip bitleri  rwx------", "grup bitleri  ---rwx---", "diğerleri bitleri  ------rwx"];
    ys.forEach((y, i) => {
      d.box(s, x, y, w, h, q[i], { fill: i === 3 ? C.light : C.charcoal, color: i === 3 ? C.charcoal : C.white, size: 13 });
      d.box(s, x + w + 0.9, y, 3.3, h, a[i], { fill: i === 0 ? GREY : PALE, color: C.dark, size: 12, font: i ? F.code : F.body, bold: !i });
      if (i < 3) d.arrow(s, x + w + 0.02, y + h / 2, x + w + 0.88, y + h / 2, { color: C.mintDeep, w: 2 });
      if (i < 3) d.text(s, "evet", { x: x + w + 0.1, y: y + 0.02, w: 0.8, h: 0.3, fontSize: 11, bold: true, color: C.mintDeep, align: "center" });
      if (i < 3) { d.arrow(s, x + w / 2, y + h + 0.02, x + w / 2, ys[i + 1] - 0.02, { color: C.slate, w: 2 }); d.text(s, "hayır", { x: x + w / 2 + 0.1, y: y + h + 0.05, w: 0.7, h: 0.3, fontSize: 11, bold: true, color: C.slate }); }
      if (i === 3) d.arrow(s, x + w + 0.02, y + h / 2, x + w + 0.88, y + h / 2, { color: C.mintDeep, w: 2 });
    });
    d.text(s, "Arama ilk eşleşmede durur.", { x, y: 6.0, w: 7.6, h: 0.4, fontSize: 13.5, italic: true, color: C.mutedOnLight });
  }
  term(s, MX + 7.85, 1.75, 4.3, 2.75, J(ORD), 12);
  d.card(s, MX + 7.85, 4.7, 4.3, 2.15, { title: "Sürpriz", titleColor: C.red, body: "Sahip bitleri --- olduğu için, geri kalan herkes okuyabildiği hâlde sahip reddedilir. Çekirdek hiçbir zaman öbür sınıflara \"düşmez\".", bodySize: 13 });
  s.addNotes("Bu, klasik bir sınav tuzağıdır. Mod 074 = ----rwxr--: sahibe hiçbir şey, gruba her şey, diğerlerine okuma. Sahip (student) 'Permission denied' alır, çünkü sahip için yalnızca sahip üçlüsüne bakılır. root okuma/yazma denetimlerini atlar; çalıştırma için ise root'un bile en az bir yerde bir x biti görmesi gerekir. Sahip dosyayı her zaman chmod ile düzeltebilir (izinleri değiştirmek için r ya da w değil, sahiplik gerekir) — son iki komut bunu gösteriyor.");

  // 12 ── Gösterim: ls -l ve stat
  s = d.content({ kicker: "Canlı gösterim", title: "İzinleri ls -l, ls -ld ve stat ile Okumak" });
  {
    const st = find(LS, "stat docs/syllabus.txt");
    const stShort = { p: st.p, c: st.c, o: st.o.slice(0, 4).concat(["..."]) };
    const lsDocs = find(LS, "ls -l docs");
    term(s, MX, 1.65, 8.3, 5.2, J([lsDocs, find(LS, "ls -ld docs"), stShort, find(LS, "stat -c '%A  %a  %U  %G  %n' docs/syllabus.txt docs src/hello.c")]), 12);
  }
  d.card(s, MX + 8.55, 1.65, 3.6, 5.2, { title: "Nelere dikkat edin?", body: [
    "ls -l docs İÇİNDEKİ dosyaları listeler; ls -ld docs dizinin kendisini gösterir.",
    "stat modu iki kez yazdırır: 0664 ve -rw-rw-r--.",
    "%A %a %U %G %n ile stat -c yalnızca gerekeni yazdırır.",
    "Yeni dosyalar 664, yeni dizinler 775 — neden? Bkz. umask, 4. bölüm.",
  ], bodySize: 12.5 });
  s.addNotes("Çalıştırın: ls -l docs, ls -ld docs, stat docs/syllabus.txt, ardından stat -c '%A  %a  %U  %G  %n' docs/syllabus.txt docs src/hello.c. ls'nin 'final report.txt' adını boşluk içerdiği için tırnak içine aldığını gösterin (10. hafta). 0664'teki baştaki 0, özel bitler (setuid, setgid, yapışkan bit) için dördüncü sekizli basamaktır; burada hepsi sıfır. stat -c, laboratuvarda yanıtlarınızı denetlemek için çok kullanışlıdır.");

  // ───────────────────────── BÖLÜM 2
  s = d.sectionSlide({ kicker: "Bölüm 2", title: "İzinleri Değiştirmek: chmod", subtitle: "Aynı şeyi söylemenin iki yolu: harflerle (u+x) ya da sayılarla (754)." });
  s.addNotes("chmod = change mode, yani modu değiştir. Bir dosyanın modunu yalnızca sahibi (ya da root) değiştirebilir.");

  // 14 ── chmod sembolik sözdizimi
  s = d.content({ kicker: "chmod · sembolik", title: "chmod  kim  işleç  izinler  dosya …" });
  {
    const cols = [
      ["kim", [["u", "kullanıcı = sahip"], ["g", "grup"], ["o", "diğerleri"], ["a", "hepsi (= ugo)"]]],
      ["işleç", [["+", "ekle"], ["-", "kaldır"], ["=", "tam olarak ata"]]],
      ["izinler", [["r", "okuma"], ["w", "yazma"], ["x", "çalıştırma"]]],
    ];
    cols.forEach(([t, items], k) => {
      const x = MX + k * 2.15;
      d.text(s, t, { x, y: 1.65, w: 1.95, h: 0.35, fontSize: 14, bold: true, color: C.mintDeep, align: "center" });
      items.forEach(([sym, m], i) => {
        d.box(s, x, 2.05 + i * 0.72, 0.62, 0.6, sym, { fill: C.charcoal, color: C.mint, size: 20, font: F.code });
        d.text(s, m, { x: x + 0.7, y: 2.05 + i * 0.72, w: 1.4, h: 0.6, fontSize: 13, color: "3A464C", valign: "middle" });
      });
    });
    d.text(s, "Virgülle, boşluksuz birleştirin:  u=rw,g=r,o=", { x: MX, y: 5.05, w: 6.4, h: 0.35, fontSize: 13.5, italic: true, color: C.charcoal, fontFace: F.body });
  }
  {
    const pairs = [["chmod u+x", "rw-rw-r--", "rwxrw-r--"], ["chmod go-w", "rwxrw-r--", "rwxr--r--"], ["chmod a=r", "rwxr--r--", "r--r--r--"], ["chmod u=rw,g=r,o=", "r--r--r--", "rw-r-----"], ["chmod u+rwx,g+w", "rw-r-----", "rwxrw----"]];
    // gerçek dökümle karşılaştır
    const after = SYM.filter(b => b.c.startsWith("ls -l")).map(b => b.o[0].slice(1, 10));
    pairs.forEach((p, i) => { if (p[1] !== after[i] || p[2] !== after[i + 1]) throw new Error("chmod tablosu uyuşmuyor " + p); });
    const hdr = ["Komut (syllabus.txt)", "Önce", "Sonra"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 13.5 } }));
    const rows = pairs.map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, fontFace: F.code, fontSize: 13.5, bold: j === 2 } })));
    s.addTable([hdr, ...rows], { x: MX + 6.55, y: 1.65, w: 5.6, colW: [2.6, 1.5, 1.5], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [5, 6, 5, 6], valign: "middle" });
  }
  d.callout(s, MX, 5.55, 12.15, 1.3, "+ ve − yalnızca adını verdiğiniz bitleri değiştirir; = bütün üçlüyü yeniden yazar (ardından hiçbir şey gelmeyen o=, \"diğerlerine hiçbir hak yok\" demektir). Sembolik mod küçük değişiklikler için en iyisidir: \"grup da yazabilsin\" → chmod g+w.", 14);
  s.addNotes("Her satırı bir cümle olarak yüksek sesle okuyun: u+x 'kullanıcıya çalıştırma ver', go-w 'gruptan ve diğerlerinden yazmayı al', a=r 'herkese tam olarak okuma', u=rw,g=r,o= 'kullanıcıya tam olarak okuma-yazma, gruba tam olarak okuma, diğerlerine hiçbir şey'. Tablo, bir sonraki slayttaki gerçek oturumdan üretilmiştir. Tipik hatalar: virgülden sonra boşluk bırakmak (chmod u=rw, g=r file) ve kimi unutmak (chmod rw file 'invalid mode' hatası verir).");

  // 15 ── Gösterim: sembolik chmod
  s = d.content({ kicker: "Canlı gösterim", title: "Sembolik Modda chmod" });
  term(s, MX, 1.65, 7.6, 5.2, J(SYM), 13);
  d.card(s, MX + 7.85, 1.65, 4.3, 5.2, { title: "Nelere dikkat edin?", body: [
    "chmod başarılı olduğunda hiçbir şey yazdırmaz — ls -l ile denetleyin.",
    "u+x ve go-w diğer bütün bitlere dokunmaz.",
    "a=r her şeyin üzerine yazdı: sahip bile w hakkını kaybetti.",
    "Sahip, salt okunur bir dosyanın modunu yine de değiştirebilir: bunun için w değil, sahiplik gerekir.",
  ], bodySize: 13.5 });
  s.addNotes("Öğrencilerle birlikte yazın: cd docs, ardından her chmod'dan sonra ls -l syllabus.txt. 'Haber olmaması iyi haberdir' Unix geleneğidir: sessizlik başarı demektir. a=r'den sonra sorun: sahip dosyanın modunu hâlâ değiştirebilir mi? (Evet — mod düğümdeki bir üst veridir ve yalnızca sahiplik önemlidir.)");

  // 16 ── Sekizli tablo
  s = d.content({ kicker: "chmod · sekizli", title: "Sekizli: Sınıf Başına Bir Basamak, r = 4, w = 2, x = 1" });
  {
    const hdr = ["Sekizli", "İkili r w x", "Sembolik", "Tipik anlamı"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 14 } }));
    const mean = ["erişim yok", "yalnızca çalıştırma", "yalnızca yazma (nadir)", "yazma + çalıştırma (nadir)", "yalnızca okuma", "okuma + çalıştırma", "okuma + yazma", "her şey"];
    const rows = [];
    for (let n = 0; n < 8; n++) {
      const b = n.toString(2).padStart(3, "0");
      const sym = (n & 4 ? "r" : "-") + (n & 2 ? "w" : "-") + (n & 1 ? "x" : "-");
      rows.push([String(n), b.split("").join(" "), sym, mean[n]].map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: n % 2 ? C.white : C.light }, fontFace: j < 3 ? F.code : F.body, fontSize: 14, bold: j === 0 || j === 2 } })));
    }
    s.addTable([hdr, ...rows], { x: MX, y: 1.65, w: 7.3, colW: [1.0, 1.9, 1.6, 2.8], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [4, 8, 4, 8], valign: "middle", rowH: 0.47 });
  }
  d.card(s, MX + 7.6, 1.65, 4.55, 2.45, { title: "Neden sekizli?", body: [
    "Her sınıfın 3 biti var → 2³ = 8 değer → tam olarak bir sekizli basamak.",
    "Dokuz bit = üç basamak: kullanıcı, grup, diğerleri.",
  ], bodySize: 14 });
  d.code(s, MX + 7.6, 4.3, 4.55, 2.55,
`# sembolik → sekizli
rw-  r--  ---
110  100  000
 6    4    0    → 640

# sekizli → sembolik: 5 = 4 + 1
5 → r-x`, 13.5);
  s.addNotes("Üç ağırlığı ezberleyin: r = 4, w = 2, x = 1. 0–7 arasındaki her basamak bunların tek bir biçimde toplamıdır, çünkü bunlar ikinin kuvvetleridir — tıpkı ikili sayılardaki gibi. Gerçekte kullanacağınız satırlar 4–7'dir: 4 okuma, 5 okuma+çalıştırma, 6 okuma+yazma, 7 hepsi. Sayılar code/perm_check.py ile doğrulandı.");

  // 17 ── Çözümlü dönüşümler
  s = d.content({ kicker: "Çözümlü örnekler", title: "İki Yönde Dönüştürmek" });
  d.card(s, MX, 1.65, 5.95, 0.95, { title: "Sembolik → sekizli: her üçlüde ağırlıkları toplayın", titleSize: 15 });
  d.code(s, MX, 2.7, 5.95, 2.85,
`rwxr-xr--
rwx = 4 + 2 + 1 = 7
r-x = 4 + 0 + 1 = 5
r-- = 4 + 0 + 0 = 4      → 754

rw-rw-r--  = 6 6 4       → 664`, 15);
  d.card(s, MX + 6.2, 1.65, 5.95, 0.95, { title: "Sekizli → sembolik: her basamağı 4, 2, 1'e ayırın", titleSize: 15 });
  d.code(s, MX + 6.2, 2.7, 5.95, 2.85,
`711
7 = 4 + 2 + 1 → rwx
1 =         1 → --x
1 =         1 → --x      → rwx--x--x

640 → rw- r-- ---        → rw-r-----`, 15);
  d.callout(s, MX, 5.75, 12.15, 1.1, "Hızlı denetim: tek bir basamak her zaman x içerir, 4 ya da daha büyük bir basamak her zaman r içerir. Böylece 7 5 0 → rwx r-x --- hiç hesap yapmadan bulunur.", 15);
  s.addNotes("Tahtada sınıfla birlikte iki tane daha yapın: 600 (rw-------), 755 (rwxr-xr-x), r--r----- (440). 711, paylaşılan sunucularda ev dizinleri için tipik bir moddur: diğerleri herkese açık bir alt klasöre geçebilir ama ev dizinini listeleyemez. Tüm dönüşümler code/perm_check.py ile denetlendi.");

  // 18 ── Sık görülen modlar
  s = d.tableSlide({
    kicker: "chmod · sekizli", title: "Tekrar Tekrar Karşılaşacağınız Modlar",
    header: ["Sekizli", "Sembolik", "Tipik kullanım"],
    colW: [1.3, 2.9, 7.95],
    rows: [
      ["644", "rw-r--r--", "sıradan dosyalar: herkes okuyabilir, yalnızca sahip yazar"],
      ["755", "rwxr-xr-x", "başkalarının da kullanabileceği programlar, betikler ve dizinler"],
      ["600", "rw-------", "özel dosyalar: parolalar, SSH anahtarları (ssh başkalarının okuyabildiği anahtarı reddeder)"],
      ["700", "rwx------", "özel dizinler (ev dizininiz, ~/.ssh)"],
      ["640 / 750", "rw-r----- / rwxr-x---", "grupla paylaşılan, geri kalan herkesten gizlenen"],
      ["777", "rwxrwxrwx", "herkes değiştirebilir ya da silebilir — neredeyse hiçbir zaman doğru değildir"],
    ],
    fontSize: 14.5, y: 1.7,
  });
  warn(s, MX, 5.65, 12.15, 1.2, "chmod 777, bir \"Permission denied\" hatasını makinedeki her kullanıcıya yazma hakkı vererek \"düzeltir\": artık herhangi bir kullanıcı ya da ele geçirilmiş bir program dosyayı değiştirebilir. Eksik olan tek biti bulun ve yalnızca onu ekleyin (ör. chmod u+x).", 13);
  s.addNotes("Bu altı satır gerçek hayatın %95'ini kapsar. 777 uyarısı önemlidir: forumlarda bir hatayı yok etmek için chmod -R 777 önerilir; bu, anahtar takıldı diye kapınızı açık bırakmaya benzer. Bir web sunucusunda, ele geçirilmiş herhangi bir sürecin sayfalarınızı değiştirmesine izin verir. Kural: en az ayrıcalık ilkesi (principle of least privilege) — işin yapılması için gereken en az hakkı verin.");

  // 19 ── Gösterim: sekizli chmod
  s = d.content({ kicker: "Canlı gösterim", title: "Sekizli Modda chmod — ve İki Tipik Hata" });
  term(s, MX, 1.65, 8.2, 5.2, J(OCT), 13);
  d.card(s, MX + 8.45, 1.65, 3.7, 5.2, { title: "Nelere dikkat edin?", body: [
    "754 → rwxr-xr--: basamaklar üçlülere karşılık gelir.",
    "Tek bir chmod birden çok dosya alabilir.",
    "Bir dizinde 700: başka kimse içine giremez bile.",
    "8 ve 9 sekizli basamak değildir.",
    "\"rw\" kim/işleç içermez: u+rw ya da bir sayı yazın.",
  ], bodySize: 13 });
  s.addNotes("code/demo_chmod_oct.sh içindeki komutları çalıştırın. İki hata iletisini gösterin: chmod, 854'ü (8 sekizli bir basamak değildir) ve rw'yi (geçerli bir sembolik mod değildir) reddeder. Sekizli mod her zaman dokuz bitin hepsini birden ayarlar; sembolik mod tek bir biti değiştirip kalanları koruyabilir. Not: hata iletisinde modun çevresindeki tırnaklar, UTF-8 yerel ayarımızdaki tipografik tırnaklardır.");

  // 20 ── Betiği çalıştırılabilir yapmak
  s = d.content({ kicker: "Canlı gösterim", title: "Bir Betiği Çalıştırılabilir Yapmak" });
  term(s, MX, 1.65, 7.9, 5.2, J(SCR), 13);
  d.card(s, MX + 8.15, 1.65, 4.0, 3.3, { title: "Nelere dikkat edin?", body: [
    "./hello.sh için x gerekir; bash hello.sh için r yeter (dosyayı bash okur).",
    "Yalnızca hello.sh bulunamaz: çalışma dizini PATH'te değildir, ./ yazın.",
    "gcc x bitini kendisi koyar: 775 = 777 eksi umask 002.",
  ], bodySize: 12.5 });
  d.card(s, MX + 8.15, 5.15, 4.0, 1.7, { title: "14. haftaya bakış", body: "#!/bin/bash satırı (\"shebang\"), dosyayı hangi yorumlayıcının çalıştıracağını çekirdeğe söyler.", bodySize: 12.5 });
  s.addNotes("Öğrencilerin en sık karşılaştığı izin sorunu budur. Bir düzenleyiciyle ya da echo ile oluşturulan dosya 664 olur (x yok), çünkü programlar normal dosyalar için 666 ister. chmod u+x yalnızca sahibe çalıştırma ekler; chmod +x ise umask'ın izin verdiği bütün sınıflara ekler. ./hello.sh çalıştırdığınızda çekirdeğin exec sistem çağrısı x bitini denetler ve #! satırını okur. gcc çıktısını 777 & ~umask = 775 moduyla oluşturur, çünkü bağlayıcı bir program ürettiğini bilir. 14. hafta bunun üzerine kurulacak.");

  // 21 ── Kopya kâğıdı
  s = d.tableSlide({
    kicker: "Kopya kâğıdı", title: "Şimdiye Kadarki Komutlar",
    header: ["Komut", "Ne yapar?", "Örnek"],
    colW: [2.3, 5.25, 4.6],
    rows: [
      ["whoami, id, groups", "ben kimim, UID/GID'im, gruplarım", "id"],
      ["ls -l  /  ls -ld dir", "dosyaların / dizinin kendisinin modu, sahibi, grubu", "ls -ld ~/lab/docs"],
      ["stat -c '%a %A %n'", "sekizli ve sembolik mod, ad", "stat -c '%a %A %n' *"],
      ["chmod who±=perm", "sembolik değişiklik", "chmod u+x,go-w run.sh"],
      ["chmod NNN", "sekizli: dokuz bitin hepsini ayarla", "chmod 640 report.txt"],
      ["chmod -R", "özyinelemeli: bütün bir ağaç (dikkat!)", "chmod -R go-rwx project"],
      ["./script.sh", "çalışma dizinindeki bir dosyayı çalıştır", "./hello.sh"],
    ],
    fontSize: 14.5, y: 1.7,
    callout: "chmod -R aynı modu dosyalara VE dizinlere uygular: chmod -R 644 dir her alt dizinden x'i kaldırır ve sizi dışarıda bırakır. -R ile sembolik mod (go-rwx) kullanın.",
  });
  s.addNotes("Öğrenciler bu slaytın fotoğrafını çekebilir. Kutu, özyinelemeli sekizli modların neden tehlikeli olduğunu açıklıyor: dizinlerin x'e ihtiyacı vardır, dosyaların ise genellikle olmamalıdır. Güvenli bir özyinelemeli kalıp semboliktir: chmod -R go-rwx project (yalnızca hak kaldırır) ya da chmod -R u+rwX (büyük X = yalnızca dizinlere ve zaten x biti olan dosyalara çalıştırma).");

  // 22 ── Mola
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Mola", subtitle: "Sırada: varsayılan izinler (umask), dizinler, sahiplik, root ve sudo." });
  s.addNotes("On dakika. Mola sırasında deneyin: sahibi olduğunuz bir dosyaya chmod 000 uygulayın, sonra haklarınızı geri alın.");

  // ───────────────────────── BÖLÜM 3
  s = d.sectionSlide({ kicker: "Bölüm 3", title: "Varsayılanlar, Dizinler, Sahipler ve root", subtitle: "664 nereden geliyor ve sahibi kim değiştirebilir?" });
  s.addNotes("Moladan önce her yeni dosya 664, her yeni dizin 775 olarak göründü. Bu sayılar nereden geliyor?");

  // 24 ── umask fikri
  s = d.content({ kicker: "Varsayılan izinler", title: "umask: Yeni Dosyalardan Alınacak Bitler", lead: "Programlar 666 (dosyalar) ya da 777 (dizinler) ister. Çekirdek, sürecin umask değerinde kurulu olan her biti temizler." });
  {
    const rows = [["istenen", "666", "rw-rw-rw-", "110110110"], ["umask", "022", "----w--w-", "000010010"], ["sonuç", "644", "rw-r--r--", "110100100"]];
    const x0 = MX + 3.1, bw = 0.5, y0 = 2.55;
    rows.forEach((r, i) => {
      const y = y0 + i * 0.78;
      d.text(s, r[0], { x: MX, y, w: 1.5, h: 0.6, fontSize: 15, bold: true, color: C.charcoal, valign: "middle" });
      d.box(s, MX + 1.55, y, 1.25, 0.6, r[1], { fill: i === 2 ? C.mint : i === 1 ? REDPALE : C.light, color: i === 1 ? C.red : C.dark, size: 18, font: F.code });
      for (let k = 0; k < 9; k++) {
        const x = x0 + k * (bw + 0.04) + Math.floor(k / 3) * 0.16;
        const bit = r[3][k] === "1";
        const fill = i === 1 ? (bit ? C.red : GREY) : (bit ? C.charcoal : GREY);
        d.box(s, x, y, bw, 0.6, i === 1 ? (bit ? "1" : "0") : r[2][k], { fill, color: bit ? C.white : "9AA5A8", size: 16, font: F.code });
      }
    });
    d.text(s, "grubun ve diğerlerinin w bitleri temizlenir", { x: x0, y: y0 + 2.35, w: 5.2, h: 0.35, fontSize: 12, italic: true, color: C.red, align: "center" });
  }
  d.card(s, MX + 8.7, 2.3, 3.45, 3.15, { title: "Sözcüklerle", body: [
    "umask = varsayılan olarak hiç verilmeyen bitlerin \"maskesi\".",
    "Süreç başına bir ayardır; çocuk süreçlere aktarılır.",
    "Yalnızca bit kaldırabilir, asla ekleyemez.",
  ], bodySize: 13 });
  d.callout(s, MX, 5.7, 12.15, 1.15, "Kural: yeni mod = istenen AND (NOT umask). Dosyalar 666 olarak istenir — asla x ile değil — bu yüzden siz chmod yapana kadar hiçbir yeni dosya çalıştırılabilir değildir. Tipik değerler: Ubuntu kullanıcıları için 002 (→ 664 / 775), root ve birçok sunucu için 022 (→ 644 / 755).", 13.5);
  s.addNotes("Birçok ders kitabı 'varsayılan = 666 eksi umask' der. Bu, alışılmış 002 ve 022 değerleri için çalışır, ama gerçek işlem bit düzeyindedir: umask bitleri temizlenir (tümleyeniyle AND). Bir sonraki slayt, çıkarmanın yanlış sonuç verdiği bir durumu gösteriyor. umask, kabuktan başlattığınız her programa aktarılır; bu yüzden oturum açılırken bir kez ayarlanır (Ubuntu'da pam_umask modülüyle; kullanıcı bunu ~/.bashrc içinde değiştirebilir).");

  // 25 ── umask tablosu
  s = d.content({ kicker: "Varsayılan izinler", title: "umask Değerleri — ve Çıkarma Neden Yanlış Olabilir?" });
  {
    const hdr = ["umask", "Yeni dosya (666)", "Yeni dizin (777)", "Kullanım"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 14 } }));
    const R = [["002", "664  rw-rw-r--", "775  rwxrwxr-x", "Ubuntu kullanıcıları (özel gruplar)"], ["022", "644  rw-r--r--", "755  rwxr-xr-x", "root, birçok sunucu"], ["027", "640  rw-r-----", "750  rwxr-x---", "grup okur, diğerleri hiçbir şey"], ["077", "600  rw-------", "700  rwx------", "tamamen özel"], ["033", "644  rw-r--r--", "744  rwxr--r--", "çıkarma tuzağı →"]];
    const rows = R.map((r, i) => r.map((t, j) => ({ text: t, options: { color: i === 4 && j === 1 ? C.red : "3A464C", fill: { color: i === 4 ? REDPALE : i % 2 ? C.white : C.light }, fontFace: j < 3 ? F.code : F.body, fontSize: 13.5, bold: j === 0 || (i === 4 && j === 1) } })));
    s.addTable([hdr, ...rows], { x: MX, y: 1.65, w: 7.5, colW: [0.95, 2.05, 2.25, 2.25], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [5, 6, 5, 6], valign: "middle" });
  }
  d.code(s, MX + 7.75, 1.65, 4.4, 3.6,
`# bir dosyada umask 033
  666 = 110 110 110
  033 = 000 011 011
 ~033 = 111 100 100
  AND = 110 100 100
      = 644  rw-r--r--

# 666 − 033 = 633  ✗
# 633 = rw--wx-wx`, 13);
  d.callout(s, MX, 5.5, 12.15, 1.35, "Çıkarma yalnızca umask'ın her biti 666 ya da 777'de de kuruluysa doğru sonuç verir. Dosyalarda 666'nın x biti yoktur; bu yüzden x bitleri içeren bir umask (033, 027, 077 …) çıkarmayla yanlış sonuç verir: 666 − 033 = 633, \"okuma yok ama yazma ve çalıştırma var\" demek olurdu. Çekirdek yalnızca bitleri temizler: 644.", 13.5);
  s.addNotes("İkili gösterimi tahtada adım adım yapın. 3 basamağı = 011 = w ve x. Dosyanın isteği olan 6 = 110'da temizlenecek x yoktur; bu yüzden yalnızca w temizlenir: 6 AND NOT 3 = 110 AND 100 = 100 = 4. 6 - 3 = 3 çıkarması, hiç var olmamış bir x bitini 'ödünç alır'. Dizinlerde 777'nin her biti kurulu olduğundan 777 - umask her zaman doğrudur. Tüm satırlar code/perm_check.py ile denetlendi ve bir sonraki slayttaki gerçek umask gösterimiyle doğrulandı.");

  // 26 ── Gösterim: umask
  s = d.content({ kicker: "Canlı gösterim", title: "umask İş Başında" });
  {
    const b = UM;
    const shown = [find(b, "umask"), find(b, "umask -S"), { p: b[4].p, c: "touch f_002; mkdir d_002   # … 022, 077, 033 için de", o: [] }, find(b, "stat -c '%a  %A  %n' f_* d_*")];
    term(s, MX, 1.65, 7.6, 4.15, J(shown), 13.5);
  }
  d.card(s, MX + 7.85, 1.65, 4.3, 4.15, { title: "Nelere dikkat edin?", body: [
    "umask -S, İZİN VERİLENİ gösterir: u=rwx,g=rwx,o=rx.",
    "Dosyalar varsayılan olarak hiçbir zaman x almaz.",
    "033 → dosya 633 değil 644; dizin 744.",
    "umask 077 → yeni dosyaları yalnızca siz görebilirsiniz.",
  ], bodySize: 13.5 });
  d.callout(s, MX, 6.0, 12.15, 0.85, "umask yalnızca geçerli kabuğu (ve ondan başlatılan programları) etkiler. Kalıcı yapmak için ~/.bashrc dosyasına  umask 027  ekleyin. Var olan dosyalar etkilenmez.", 14);
  s.addNotes("Gerçek oturum (code/demo_umask.sh) her umask için bir dosya ve bir dizin oluşturur; ortadaki satır benzer sekiz komutu özetliyor. umask bir kabuk yerleşik komutudur: tıpkı cd gibi, kabuğun kendi sürecini değiştirmesi gerekir. Sorun: umask 077 ise grubunuzdaki bir arkadaşınız oluşturduğunuz bir dosyayı okuyabilir mi? (Hayır: 600.)");

  // 27 ── Gösterim: dizin izinleri 1
  s = d.content({ kicker: "Canlı gösterim", title: "x'i ya da r'si Olmayan Dizinler" });
  term(s, MX, 1.65, 7.6, 5.2, J(DIR.slice(0, 13)), 13);
  d.card(s, MX + 7.85, 1.65, 4.3, 5.2, { title: "Nelere dikkat edin?", body: [
    { b: "r var, x yok:", t: " ls adları gösterir, ama ls -l düğümleri okuyamaz (??????); cd ve cat başarısız olur." },
    { b: "x var, r yok:", t: " dizin listelenemez, ama adını bildiğiniz bir dosya açılabilir." },
    "Dizinlerde olağan çiftler: r-x ya da rwx — r ve x birlikte gider.",
  ], bodySize: 13.5 });
  s.addNotes("code/demo_dirperm.sh'yi adım adım çalıştırın. r olup x olmadığında ls ad listesini (dizin 'dosyasını') okuyabilir ama onun üzerinden hiçbir düğüme bakamaz: ls -l bu yüzden soru işaretleri yazdırır. x olup r olmadığında, her odanın anahtarı olan ama odaların listesi olmayan bir binaya benzer: bir odaya ancak adını biliyorsanız girebilirsiniz. Web sunucuları ev dizinleri için tam da bu nedenle yalnızca x kullanır.");

  // 28 ── Gösterim: dizin izinleri 2
  s = d.content({ kicker: "Canlı gösterim", title: "Salt Okunur Bir Dosyayı Silmek: Karar Dizindeki w'nindir" });
  term(s, MX, 1.65, 7.6, 5.2, J(DIR.slice(13)), 13);
  d.card(s, MX + 7.85, 1.65, 4.3, 3.3, { title: "Nelere dikkat edin?", body: [
    "444 dosyaya yazmayı durdurur …",
    "… ama rm yalnızca bir soru sorar ve sonra dosyayı siler: dizin (755) yazılabilir.",
    "Dizin 555: hiçbir şey eklenemez ya da silinemez.",
  ], bodySize: 13.5 });
  warn(s, MX + 7.85, 5.15, 4.3, 1.7, "rm -f bu soruyu atlar, rm -r'nin de geri dönüşüm kutusu yoktur. Salt okunur bir dosya silinmeye karşı korunmuş DEĞİLDİR.", 12.5);
  s.addNotes("Bu neredeyse herkesi şaşırtır. Silmek, DİZİNDEN bir (ad, düğüm) girdisini kaldırmaktır; bu yüzden önemli olan dizinin w bitidir. rm yalnızca kibarlık ediyor ve dosya yazmaya karşı korumalı olduğu için soruyor. 7. ve 10. haftaları hatırlayın: rm, unlink() çağırır. Dosyaları silinmeye karşı korumak için son komutlardaki gibi dizinden w'yi kaldırın (chmod 555). /tmp bunun için özel bir kurala ihtiyaç duyar — birkaç slayt sonra yapışkan bit.");

  // 29 ── Sahiplik
  s = d.content({ kicker: "Sahiplik", title: "chown ve chgrp: Sahibi Kim Değiştirebilir?" });
  d.card(s, MX, 1.65, 6.0, 2.45, { title: "Komutlar", body: [
    { b: "chown user file", t: " — sahibi değiştirir (chown user:group file de olur)." },
    { b: "chgrp group file", t: " — grubu değiştirir." },
    "İkisi de bütün bir ağaç için -R kabul eder.",
  ], bodySize: 14 });
  d.card(s, MX, 4.3, 6.0, 2.55, { title: "Linux'taki kurallar", body: [
    { b: "chown:", t: " yalnızca root. Yoksa disk kotasından kaçmak için dosyalarınızı başkasına devredebilir ya da birine hiç oluşturmadığı bir dosyayı verebilirdiniz." },
    { b: "chgrp:", t: " sahip, grubu yalnızca üyesi olduğu bir gruba değiştirebilir." },
  ], bodySize: 13.5 });
  term(s, MX + 6.25, 1.65, 5.9, 3.0, J(OWN), 12);
  d.card(s, MX + 6.25, 4.85, 5.9, 2.0, { title: "Hataları okumak", body: [
    "Operation not permitted (EPERM): bir r/w/x biti değil, ayrıcalık eksik.",
    "chgrp başarısız: student (henüz) students grubunda değil.",
  ], bodySize: 13.5 });
  s.addNotes("İki hata iletisini birbirinden ayırın: 'Permission denied' (EACCES) bir izin bitinin eksik olduğunu; 'Operation not permitted' (EPERM) ise işlemin, bitler ne derse desin, ayrıcalık gerektirdiğini söyler. Dosyayı kendinize chown etmek serbesttir (hiçbir şey değişmez). Bir sonraki slaytta yönetici öğrencimizi 'students' grubuna eklemiştir ve chgrp çalışır.");

  // 30 ── Grupla paylaşım
  s = d.content({ kicker: "Sahiplik", title: "Bir Klasörü Bir Grupla Paylaşmak" });
  term(s, MX, 1.65, 7.6, 4.0, J(GRP), 13);
  d.card(s, MX + 7.85, 1.65, 4.3, 4.0, { title: "Nelere dikkat edin?", body: [
    "Yönetici  sudo usermod -aG students student  komutunu çalıştırdıktan ve student yeniden oturum açtıktan sonra id yeni grubu listeler.",
    "Artık chgrp çalışıyor.",
    "2770: fazladan 2, dizindeki setgid bitidir — yeni dosyalar students grubunu devralır (s olarak görünür).",
  ], bodySize: 12.5 });
  d.callout(s, MX, 5.85, 12.15, 1.0, "Ekip klasörü tarifi: üyeleri tek bir gruba koyun, klasörü chgrp ile bu gruba verin, chmod 2770 yapın (sahip + grup her şey, diğerleri hiçbir şey, setgid sayesinde yeni dosyalar grupta kalır).", 14);
  s.addNotes("Bu gösterimden önce yöneticinin (root) yaptığı hazırlık: usermod -aG students student. -a 'ekle' (append) demektir; -a olmadan kullanıcı diğer bütün ek gruplardan ÇIKARILIR — klasik bir yönetici hatası. Grup üyeliği oturum açılırken okunur; bu yüzden kullanıcının oturumu kapatıp yeniden açması (ya da newgrp kullanması) gerekir. Dizinde setgid: yeni dosyalar, oluşturanın birincil grubu yerine dizinin grubunu alır. student'ın birincil grubu student olduğu hâlde plan.txt students grubundadır.");

  // 31 ── root ve sudo
  s = d.content({ kicker: "root ve sudo", title: "root ve sudo: Süper Kullanıcı Gücünü Ödünç Almak" });
  d.card(s, MX, 1.65, 4.15, 3.35, { title: "root", body: [
    "UID 0: okuma ve yazma izin denetimleri uygulanmaz.",
    "Ubuntu'da varsayılan olarak root parolası yoktur; yöneticiler sudo kullanır.",
  ], bodySize: 13.5 });
  d.card(s, MX + 4.4, 1.65, 3.3, 3.35, { title: "sudo komut", body: [
    "TEK bir komutu root olarak çalıştırır.",
    "root'un değil, SİZİN parolanızı sorar.",
    "Yalnızca /etc/sudoers'ta izin verilen kullanıcılar (Ubuntu: sudo grubu).",
    "Günlüğe kaydedilir.",
  ], bodySize: 13 });
  term(s, MX + 7.95, 1.65, 4.2, 1.3, J(SUDO0), 12);
  d.text(s, "student bir yönetici değil", { x: MX + 7.95, y: 2.98, w: 4.2, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "center" });
  term(s, MX + 7.95, 3.35, 4.2, 3.5, J(pick(SUDO, ["groups", "sudo whoami", "chown root docs/notes_02.txt", "sudo chown root:root docs/notes_02.txt", "ls -l docs/notes_02.txt", 'echo "more" >> docs/notes_02.txt'])), 12);
  warn(s, MX, 5.2, 7.7, 1.65, "Bir sudo komutunu Enter'a basmadan önce iki kez okuyun: root olarak tek bir yazım hatası, örneğin  sudo rm -r / home/x  (boşluğa dikkat), bütün sistemi siler. İnternetten kopyaladığınız, anlamadığınız komutları asla sudo ile çalıştırmayın.", 12.5);
  s.addNotes("İki farklı durumda gerçek çıktı. Üstte: öğrencimiz yönetici yapılmadan önce — sudo parolayı sorar, sonra reddeder ('student is not in the sudoers file'). Altta: yönetici student'ı sudo grubuna ekledikten sonra (root'un bir kez yaptığı hazırlık adımı). Parola yazılır ama ekranda görünmez. sudo parolayı terminal başına yaklaşık 15 dakika hatırlar; sudo -k unutturur. sudo chown root:root'tan sonra mod hâlâ 664'tür, ama student artık yalnızca r hakkı olan 'diğerleri' sınıfındadır — bu yüzden echo >> başarısız olur. Bugün root yetkisiyle üretilmiş çıktının gösterildiği tek yer burasıdır ve öyle olduğu açıkça belirtilmiştir.");

  // 32 ── setuid
  s = d.content({ kicker: "Özel bitler", title: "setuid: passwd /etc/shadow'a Nasıl Yazabilir?" });
  {
    const y = 2.0;
    d.box(s, MX, y, 2.6, 1.15, "student yazar", { sub: "passwd", fill: C.light, size: 14, subSize: 14 });
    d.arrow(s, MX + 2.62, y + 0.58, MX + 3.38, y + 0.58, { color: C.mintDeep, w: 2 });
    d.box(s, MX + 3.4, y - 0.1, 3.0, 1.35, "passwd süreci", { sub: "gerçek UID = student\netkin UID = root", fill: C.charcoal, size: 14, subSize: 12 });
    d.arrow(s, MX + 6.42, y + 0.58, MX + 7.18, y + 0.58, { color: C.mintDeep, w: 2 });
    d.box(s, MX + 7.2, y, 2.4, 1.15, "/etc/shadow", { sub: "rw-r-----  root", fill: PALE, size: 14, subSize: 12, color: C.dark, font: F.body });
    d.text(s, "rwsr-xr-x içindeki s: DOSYA SAHİBİNİN (root) haklarıyla çalış", { x: MX + 1.6, y: y + 1.35, w: 6.8, h: 0.35, fontSize: 12, italic: true, color: C.mintDeep, align: "center" });
  }
  term(s, MX, 3.85, 7.8, 1.75, J(pick(SPEC, ["ls -l /usr/bin/passwd /etc/shadow", "stat -c '%a  %A  %n' /usr/bin/passwd /tmp"])), 12.5);
  d.card(s, MX + 9.85, 1.65, 2.3, 3.95, { title: "Sekizli", body: ["setuid = 4000", "setgid = 2000", "yapışkan = 1000", "4755 → rwsr-xr-x"], bodySize: 13 });
  d.callout(s, MX, 5.8, 12.15, 1.05, "passwd yalnızca SİZİN satırınızı değiştiren güvenilir bir koddur. Hatalı bir setuid-root programı saldırgana root yetkisi verir; bu yüzden çok azdırlar (passwd, su, sudo …) ve kendi betiklerinizi asla setuid yapmamalısınız.", 14);
  s.addNotes("Sorun: kullanıcılar kendi parolalarını değiştirebilmeli, ama /etc/shadow'a yalnızca root yazabilir. Çözüm: passwd program dosyasının sahibi root'tur ve setuid biti kuruludur (sahibin x konumunda s, dördüncü sekizli basamakta 4). Kim çalıştırırsa çalıştırsın, sürecin ETKİN UID'si dosyanın sahibi (root) olur; gerçek UID ise student olarak kalır, böylece passwd kimin parolasını değiştireceğini bilir. Bu, çekirdek üzerinden denetimli bir ayrıcalık yükseltmesidir — yine 2. haftanın fikri: ayrıcalığı yalnızca güvenilir kod alır. Yalnızca kısaca değinilir; sınavda s ve t'yi tanımanın ötesinde soru yoktur.");

  // 33 ── Yapışkan bit
  s = d.content({ kicker: "Özel bitler", title: "Yapışkan Bit: /tmp'de Başkalarının Dosyaları Neden Silinemez?" });
  term(s, MX, 1.65, 7.8, 3.9, J(pick(SPEC, ["ls -ld /tmp", "ls -l /tmp/w11_admin.txt", "rm /tmp/w11_admin.txt", 'echo "my notes" > /tmp/w11_mine.txt', "ls -l /tmp/w11_mine.txt", "rm /tmp/w11_mine.txt"])), 13);
  d.card(s, MX + 8.05, 1.65, 4.1, 3.9, { title: "Nelere dikkat edin?", body: [
    "/tmp rwxrwxrwt = 1777: herkes dosya oluşturabilir.",
    "t (yapışkan bit, sticky bit): bir dosyayı yalnızca sahibi (ya da root) silebilir ya da yeniden adlandırabilir.",
    "Herkese yazılabilir (rw-rw-rw-) bir dosya bile başkaları tarafından silinemez.",
  ], bodySize: 12.5 });
  d.callout(s, MX, 5.75, 12.15, 1.1, "Yapışkan bit olmasaydı, /tmp'deki w her kullanıcının herkesin dosyasını silmesine izin verirdi (28. slayt). t, diğerleri üçlüsünde x'in yerini alır; büyük T, x olmadan yapışkan bit demektir.", 14);
  s.addNotes("Gösterimden önce root'un yaptığı hazırlık: sahibi root olan, herkese yazılabilir bir /tmp/w11_admin.txt dosyası. Öğrencimiz onu silemez — 'Operation not permitted' — ama kendi dosyasını oluşturup silebilir. Yapışkan bit dördüncü sekizli basamakta 1'dir: chmod 1777 dir. Tarihsel olarak 'sticky' (yapışkan), 'program metnini takas alanında tut' anlamına geliyordu; adın bugün anlamsız görünmesinin nedeni budur.");

  // ───────────────────────── BÖLÜM 4: LABORATUVAR
  s = d.sectionSlide({ kicker: "Bölüm 4", title: "Laboratuvar: Proje Klasörünü Korumak", subtitle: "30–40 dakika. 16 puanlı alıştırma içeren tam laboratuvar föyü ders notlarında." });
  s.addNotes("Öğrenciler tek başına ya da ikili çalışır. Sınıfta dolaşın; sorunların çoğu bir dizinde eksik x ya da betik adından önce unutulmuş ./ olacaktır. Önce laboratuvarı yeniden oluşturun: bash mcmp117_lab_setup.sh.");

  // 35 ── Laboratuvar 1
  s = d.cardsSlide({
    kicker: "Laboratuvar · A ve B bölümleri", title: "1–9. Alıştırmalar: Okumak, Çözmek, chmod",
    cards: [
      { title: "A · Ben kimim? (1–4)", body: ["whoami, id, groups: UID'nizi ve gruplarınızı not edin.", "/etc/passwd'deki satırınız: 7 alanı adlandırın.", "ls -l docs/syllabus.txt çıktısını sekizliye çevirin.", "Kâğıt üzerinde: rwxr-x---, rw-r--r--, 640, 711, 775."] },
      { title: "B · chmod (5–7)", body: ["scripts/hello.sh oluşturun, yalnızca sahip için çalıştırılabilir yapın, çalıştırın.", "notes_01.txt → rw-r-----, yalnızca sembolik modla.", "notes_02.txt → yalnızca sahip okuyup yazabilsin, sekizli modla."] },
      { title: "B · Projeleri koruyun (8–9)", body: ["projects/alpha: yalnızca siz girebilir, listeleyebilir, değiştirebilirsiniz.", "projects/beta: grup okuyup girebilir, diğerleri hiçbir şey; README.md → 640.", "Hepsini stat -c '%a %A %n' ile denetleyin."] },
    ], cols: 3, bodySize: 13.5,
    callout: "Puanlar: A bölümü 20, B bölümü 48, C bölümü 32 — toplam 100. Kullandığınız komutu VE işe yaradığını kanıtlayan ls -l / stat satırını yazın.",
  });
  s.addNotes("Alıştırma numaraları notlardaki laboratuvar föyüyle aynıdır; gerçek çıktılı tam çözümler notların sonundadır (denemeden bakmayın!). Tipik yanıtlar: chmod g-w,o-r docs/notes_01.txt; chmod 600 docs/notes_02.txt; chmod 700 projects/alpha; chmod 750 projects/beta.");

  // 36 ── Laboratuvar 2
  s = d.cardsSlide({
    kicker: "Laboratuvar · B ve C bölümleri", title: "10–16. Alıştırmalar: umask, Dizinler, Sahipler",
    cards: [
      { title: "B · Varsayılanlar (10–12)", body: ["umask 027 ile yeni bir dosyanın ve dizinin modunu önce tahmin edin, sonra doğrulayın.", "Aynısını umask 033 ile yapın: neden 633 değil?", "Kendi dizininizden x'i kaldırın: hangi komutlar başarısız olur?"] },
      { title: "C · Zorlu (13–15)", body: ["Dizininizdeki salt okunur bir dosyayı silin. Sonra dizini 555 yapıp yeniden deneyin.", "chown ve chgrp deneyin: iki hatayı da açıklayın.", "passwd ve /tmp: s'yi ve t'yi bulun, açıklayın."] },
      { title: "C · Ekip klasörü (16)", body: ["projects/team: dizin 750, deploy.sh 750, notes.txt 640, secret.txt 600.", "./projects/team/deploy.sh çalıştırın.", "Dört modu da tek bir stat komutuyla yazdırın."] },
    ], cols: 3, bodySize: 13.5,
    callout: "Erken mi bitirdiniz? Yeni bir terminalde umask 077 yapın, bir dosya oluşturun ve sonucu 666 ile 077'nin ikili gösterimini kullanarak yanınızdakine açıklayın.",
  });
  s.addNotes("16. alıştırma, ders planındaki 'bir proje klasörünü güvenli hâle getir' görevidir. Beklenen stat çıktısı: 750 drwxr-x--- projects/team; 750 -rwxr-x--- deploy.sh; 640 -rw-r----- notes.txt; 600 -rw------- secret.txt. Öğrencilere 10. ve 11. alıştırmalardan sonra umask 002'ye geri dönmelerini (ya da yeni bir terminal açmalarını) hatırlatın.");

  // 37 ── Sık yapılan hatalar
  s = d.tableSlide({
    kicker: "Sık yapılan hatalar", title: "Hata İletileri ve Anlamları",
    header: ["Gördüğünüz", "Nedeni", "Çözüm"],
    colW: [4.45, 4.1, 3.6],
    rows: [
      ["bash: ./hello.sh: Permission denied", "dosyanın x biti yok", "chmod u+x hello.sh"],
      ["bash: hello.sh: command not found", ". PATH içinde değil", "./hello.sh yazın"],
      ["bash: cd: box: Permission denied", "x'i olmayan dizin", "chmod u+x box"],
      ["ls: cannot open directory 'box'", "r'si olmayan dizin", "chmod u+r box"],
      ["chown: … Operation not permitted", "sahibi yalnızca root değiştirebilir", "yöneticiye sorun / sudo chown"],
      ["chmod: invalid mode: '854'", "8 ve 9 sekizli basamak değildir", "yalnızca 0–7 basamakları"],
      ["student is not in the sudoers file.", "yönetici değilsiniz", "yöneticiye başvurun"],
    ],
    fontSize: 14.5, y: 1.65,
  });
  s.addNotes("Bu slayttaki her ileti bugünkü gerçek gösterimlerde ortaya çıktı. Öğrencilere hata iletilerini sözcük sözcük okutun: 'Permission denied' = bir bit eksik (EACCES); 'Operation not permitted' = ayrıcalık eksik (EPERM); 'command not found' = izin değil, PATH sorunu. Ve bir kez daha: chmod 777 asla doğru çözüm değildir. Türkçe yerel ayarlı (LANG=tr_TR.UTF-8) bir sistemde bu iletilerin çoğu Türkçe görünür (ör. 'Erişim engellendi'); ders çıktıları LC_ALL=C.UTF-8 ile üretildi.");

  // 38 ── Kısa sınav
  s = d.quizSlide({ questions: [
    "-rwxr-x--- neye izin verir ve sekizli karşılığı nedir?",
    "report.txt dosyasını sahip için okuma/yazma, grup için salt okunur, diğerleri için erişimsiz yapın — sekizli ve sembolik biçimde.",
    "umask 027 ile yeni bir dosyanın ve yeni bir dizinin modu nedir? Bir dosyada umask 033 neden 633 değil de 644 verir?",
    "Dizininizdeki bir dosyanın modu r--r--r--. Onu silebilir misiniz? Sahibi olduğunuz ----rwx--- modlu bir dosyayı okuyabilir misiniz?",
  ] });
  s.addNotes("Yanıtlar. (1) Sahip rwx, grup r-x, diğerleri hiçbir şey: 750. (2) chmod 640 report.txt ya da chmod u=rw,g=r,o= report.txt. (3) 666 AND NOT 027 = 640, 777 AND NOT 027 = 750; 033 grubun ve diğerlerinin w ve x bitlerini temizler, ama dosyada hiç x yoktu, bu yüzden yalnızca w temizlenir: 644 (çıkarma yanlışlıkla 633 verirdi). (4) Dizinde w ve x hakkınız varsa evet (rm onay ister); hayır, çünkü sahip olarak yalnızca sahip üçlüsü --- uygulanır (ama chmod ile geri alabilirsiniz).");

  // 39 ── Akılda kalanlar
  s = d.content({ kicker: "Toparlama", title: "11. Hafta: Akılda Kalması Gerekenler" });
  d.bullets(s, [
    { b: "Koruma:", t: " her open() çekirdekten geçer (2. hafta); çekirdek sürecin UID/GID'lerini düğümdeki sahip, grup ve modla karşılaştırır (7. hafta)." },
    { b: "Mod dizgesi:", t: " tür + r w x'ten oluşan üç üçlü (kullanıcı, grup, diğerleri); 4 2 1 ağırlıkları sınıf başına bir sekizli basamak verir: 750 = rwxr‑x‑‑‑." },
    { b: "Yalnızca bir sınıf uygulanır:", t: " sahip, değilse grup, değilse diğerleri." },
    { b: "Dizinler:", t: " r = listele, w = girdi oluştur/sil, x = gir. Silmek için dizinde w gerekir." },
    { b: "chmod:", t: " sembolik (u+x, go-w, a=r) ya da sekizli (644, 755, 600). Asla 777." },
    { b: "umask:", t: " 666/777'den bit temizler: 002 → 664/775, 022 → 644/755, 033 → 644 (çıkarma değil, bit işlemi)." },
    { b: "Sahipler ve root:", t: " chown root ister; sudo tek bir komutu root olarak çalıştırır; setuid (passwd) ve yapışkan bit (/tmp) özel bitlerdir." },
  ], { fontSize: 17.5, y: 1.75, h: 5.1, paraSpaceAfter: 11 });
  s.addNotes("Hızlıca okuyun; her satır notlardaki bir bölüme ve laboratuvar alıştırmalarına karşılık gelir.");

  // 40–41 ── Kapanış
  d.closing({ nextWeek: "Metin İşleme, Yönlendirme ve Borular", nextItems: [
    "stdin, stdout, stderr = 0, 1, 2 numaralı dosya tanımlayıcıları (2–3. haftalar)",
    "Yönlendirme (redirection): >  >>  <  2>  2>&1  /dev/null",
    "Borular (pipes): | kabuğun oluşturduğu süreçleri birbirine bağlar",
    "grep, sort, uniq, cut, wc, tr, tee, find",
    "logs/access.log ve data/students.csv üzerinde gerçek çözümlemeler",
  ] });
  d.pres.slides[d.n - 2].addNotes("Gelecek hafta komutları birleştiriyoruz. Bir komutun çıktısı 1 numaralı dosya tanımlayıcısına gider; bunu dosyalara yönlendirecek ve borularla başka komutlara aktaracağız; böylece ~/lab/logs içindeki web sunucusu günlüğünden 'en çok 404 hatası veren sayfa hangisi?' gibi soruları yanıtlayacağız. İzinler kısaca geri dönecek: yazamadığınız bir dosyaya yönlendirme yapmak, bugün gördüğümüz 'Permission denied' hatasının aynısını verir.");
  d.pres.slides[d.n - 1].addNotes("Sözü sorulara bırakın. Çözümlü laboratuvar föyünün notlarda olduğunu ve Telegram kanalında sorulan soruların herkese yardımcı olduğunu hatırlatın.");

  await d.save(path.join(__dirname, "MBLP131_Hafta11.pptx"));
  console.log("slides:", d.n);
})();
