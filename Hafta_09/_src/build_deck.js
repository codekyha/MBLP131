// Hafta 9 sunumu (MBLP131, Türkçe): Linux Kabuğuna Giriş ve Dosya Sisteminde Gezinme (ilk uygulamalı Linux haftası)
// İngilizce referans: ../week09/build_deck.js (aynı slayt sırası, aynı diyagramlar, aynı sayılar, aynı çıktılar)
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("../lib/deck");
const d = new Deck({ week: 9, lang: "tr", assets: path.join(__dirname, "../lib") });
const P = d.pres;
const PALE = "D7E9E6";
const raw = f => fs.readFileSync(path.join(__dirname, "code", f), "utf8");

// ---------- terminal kayıtları (code/out_*.txt; İngilizce haftadan değiştirilmeden alındı) ----------
const PROMPT = /^student@okan-lab:[^$]*\$ /;
function session(file) {
  const out = [];
  raw(file).replace(/\n$/, "").split("\n").forEach(l => {
    if (PROMPT.test(l)) out.push({ cmd: l, out: [] });
    else if (out.length) out[out.length - 1].out.push(l);
  });
  return out;
}
// pick(dosya, [i, [j, n], ...]): i. komut tüm çıktısıyla ya da j. komut ilk n çıktı satırı + "..." ile
function pick(file, sel) {
  const S = session(file);
  return sel.map(x => {
    const [i, n] = Array.isArray(x) ? x : [x, undefined];
    const e = S[i];
    const o = n === undefined ? e.out : e.out.slice(0, n).concat(e.out.length > n ? ["..."] : []);
    return [e.cmd, ...o].join("\n");
  }).join("\n");
}

// Terminal kutusu: istem nane renginde, yazılan komut beyaz kalın, çıktı açık renkte, "..." / "#" soluk.
function term(s, x, y, w, h, text, size = 12) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.dark }, rectRadius: 0.05, line: { type: "none" } });
  const lines = text.replace(/\n$/, "").split("\n");
  const runs = [];
  lines.forEach((ln, i) => {
    const br = i < lines.length - 1;
    const m = ln.match(PROMPT) || ln.match(/^(PS [^>]*> )/);
    if (m) {
      runs.push({ text: m[0], options: { color: C.mint } });
      runs.push({ text: ln.slice(m[0].length) || " ", options: { color: C.white, bold: true, breakLine: br } });
    } else {
      const t = ln.trim();
      const muted = t === "..." || t.startsWith("# ");
      runs.push({ text: ln.length ? ln : " ", options: { color: muted ? C.mutedOnDark : C.light, breakLine: br } });
    }
  });
  s.addText(runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: h - 0.24, fontFace: F.code, fontSize: size, valign: "top", margin: 0, lineSpacingMultiple: 1.0, isTextBox: true });
}

function numDot(s, x, y, n, fill = C.mint, r = 0.4) {
  s.addShape(P.shapes.OVAL, { x, y, w: r, h: r, fill: { color: fill }, line: { type: "none" } });
  d.text(s, String(n), { x, y, w: r, h: r, fontSize: 13, bold: true, color: C.white, align: "center", valign: "middle" });
}
function line(s, x1, y1, x2, y2, o = {}) {
  s.addShape(P.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 0.0001, h: Math.abs(y2 - y1) || 0.0001,
    flipH: x2 < x1, flipV: y2 < y1, line: Object.assign({ color: C.slate, width: 1.25 }, o) });
}

(async () => {
  // 1 ── Başlık
  let s = d.titleSlide({
    kicker: "MBLP131  ·  HAFTA 9",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 9  ·  Linux Kabuğuna Giriş ve Dosya Sisteminde Gezinme",
    tagline: "Kuramdan terminale: neredeyim, burada ne var ve nasıl hareket ederim?",
  });
  s.addNotes("Vizeden sonra tekrar hoş geldiniz. Bugün dersin uygulamalı yarısı başlıyor: altı hafta boyunca Linux kabuğunda çalışacağız (9–14. haftalar). Plan: önce herkesin bir Linux terminali açabildiğinden (laboratuvar bilgisayarı, WSL ya da sanal makine) ve laboratuvar klasörüne sahip olduğundan emin oluyoruz. Ardından: kabuk nedir, ilk komutlar, pwd ve ls, dizin ağacı ve cd, yardım alma ve laboratuvar klasöründe bir gezinme hazine avı. Öğrencilerden slaytların yanında bir terminal açık tutmalarını ve komutları birlikte yazmalarını isteyin.");

  // 2 ── Tekrar
  s = d.cardsSlide({
    kicker: "1–7. haftalar · vizeden önce", title: "Dört Fikirde Kuramsal Yarı",
    cards: [
      { title: "İşletim sistemi", body: "Bir kaynak yöneticisi ve genişletilmiş makine. Çekirdek, çekirdek modunda; geri kalan her şey kullanıcı modunda çalışır (1–2. hf.)." },
      { title: "Sistem çağrıları", body: "Bir programın çekirdeğe açılan tek kapısı: open, read, write, fork, exec … (2–3. hf.)." },
      { title: "Süreçler", body: "Çalışmakta olan program: PID, durum, PCB, fork() + exec(); işlemci zamanlayıcısı sıralar (3–5. hf.)." },
      { title: "Bellek ve dosyalar", body: "Sayfalama ve sanal bellek (6–7. hf.); öznitelikleri düğümde (inode) tutulan dosyalar; yollarla gezilen bir dizin ağacı (7. hf.)." },
    ], cols: 4, bodySize: 14,
    callout: "Vize bu fikirleri kâğıt üzerinde ölçtü. Bugünden itibaren onları iş başında göreceksiniz: yazdığınız her komut bir süreç olur, listelediğiniz her dosya 7. haftadaki dizin ağacının bir düğümüdür.",
  });
  s.addNotes("İki dakika. Vizeyi yeniden anlatmayın; yalnızca bağlantı kurun. Sorun: işletim sisteminin hangi parçası çekirdek modunda çalışır? (Çekirdek.) Bir kullanıcı programı çekirdekten nasıl hizmet ister? (Sistem çağrısıyla.) Kabuk bir programı başlatmak için hangi iki çağrıyı kullanır? (fork ve exec, 3. hafta.) Sonra motivasyon verin: bundan sonra her hafta bu fikirleri gerçek bir Linux sisteminde göreceğiz: bugün bir sistem programı olarak kabuk ve dizin ağacı, 11. haftada izinler (koruma), 13. haftada süreçler ve sinyaller.");

  // 3 ── Gündem
  s = d.content({ kicker: "Hafta 9", title: "Bugünün Gündemi" });
  [
    ["1", "Linux terminaline ulaşmak", "Laboratuvar bilgisayarları, Windows'ta WSL ya da VirtualBox sanal makinesi — ve lab klasörü."],
    ["2", "Terminal, kabuk, çekirdek", "Bir komut yazdığınızda kim ne yapar; komutlar sistem çağrısına dönüşür."],
    ["3", "İlk komutlar", "İstem, komutun anatomisi, whoami, date, echo, uname."],
    ["4", "Etrafa bakmak", "pwd ve ls; ls -l çıktısını satır satır okumak."],
    ["5", "Dolaşmak", "Linux dizin ağacı (FHS), cd, mutlak ve göreli yollar."],
    ["6", "Akıllı çalışma + lab", "Yardım, sekme tamamlama, geçmiş, kısayollar — ardından hazine avı."],
  ].forEach((a, i) => {
    const y = 1.65 + i * 0.86;
    d.box(s, MX, y, 0.72, 0.72, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 0.9, y, w: 11.25, h: 0.72, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "   ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.2, y, w: 10.8, h: 0.72, valign: "middle" });
  });
  s.addNotes("1–4. bölümler moladan önce, 5 ve 6 moladan sonra. Son 30–40 dakika derste yapılacak laboratuvar çalışması (hazine avı) içindir. Bugün yazacağımız her şey bu haftanın code/ klasöründe gerçek çıktılarıyla birlikte duruyor (demo_*.sh betikleri ve out_*.txt çıktıları).");

  // ───────────────────────── BÖLÜM 1: LINUX'A ULAŞMAK
  s = d.sectionSlide({ kicker: "Bölüm 1", title: "Linux Terminaline Ulaşmak", subtitle: "Önünüzde bir Linux kabuğu olmasının üç yolu — bugün birini seçin." });
  s.addNotes("Her şeyden önce her öğrencinin çalışan bir terminale ihtiyacı var. Kimde zaten WSL ya da sanal makine olduğunu sorun. Dizüstü bilgisayarı olmayan öğrencileri bilgisayarı olan biriyle eşleştirin ya da laboratuvar bilgisayarlarını kullanın.");

  // 5 ── Üç yol
  s = d.cardsSlide({
    kicker: "Linux'a ulaşmak", title: "Bir Linux Kabuğuna Ulaşmanın Üç Yolu",
    cards: [
      { title: "1 · Laboratuvar bilgisayarları", body: [
        "Kurulu hâlde gelir: oturum açın ve Terminal'i başlatın.",
        "[Derslik, oturum bilgisi ve sistem: öğretim üyesi tarafından teyit edilecek]",
        "Kurulum gerekmez — ama dosyalarınız o bilgisayarda kalır.",
      ] },
      { title: "2 · WSL (Windows 10/11)", body: [
        "Linux için Windows Alt Sistemi: Windows içinde gerçek bir Linux çekirdeği ve Ubuntu.",
        "Tek komut: wsl --install",
        "Windows dizüstüleri için önerilir: hızlı, hafif, geçiş için yeniden başlatma yok.",
      ] },
      { title: "3 · VirtualBox + Ubuntu", body: [
        "Bir pencerede çalışan, masaüstüyle birlikte eksiksiz bir Ubuntu bilgisayar.",
        "Sanal makine için yaklaşık 4 GB RAM ve 25 GB disk gerekir.",
        "Windows'ta ve Intel Mac'lerde çalışır; kurulumu da öğrenirsiniz.",
      ] },
    ], bodySize: 14,
    callout: "Üçü de olur: komutlar aynıdır. Sizin makinenizdeki çıktılar (tarihler, boyutlar, kullanıcı adları, PID'ler) slaytlardakinden farklı olacaktır.",
  });
  s.addNotes("Slaytlardaki çıktılar Ubuntu 24.04 LTS üzerinde, 'student' kullanıcısıyla ve 'okan-lab' bilgisayar adıyla alındı. Türkçe yerel ayarlı (LANG=tr_TR.UTF-8) bir sistemde birçok mesaj Türkçe çıkar ve ls'nin sıralaması biraz farklı olabilir; derste gösterilen çıktılar LC_ALL=C.UTF-8 ile, yani İngilizce mesajlarla alındı. Mac'te yerleşik Terminal (macOS'ta zsh) bugünkü komutların çoğunu anlar ama bazı seçenekler farklıdır; önümüzdeki haftalar için bir Linux sanal makinesi daha iyidir (Apple Silicon Mac'lerde UTM ücretsiz bir seçenektir). Köşeli parantez içindeki yer tutucu: dersten önce laboratuvar dersliğini, oturum bilgisini ve işletim sistemini teyit edin.");

  // 6 ── WSL
  s = d.content({ kicker: "Linux'a ulaşmak · WSL", title: "WSL: Dört Adımda Windows İçinde Ubuntu" });
  term(s, MX, 1.65, 6.6, 3.0,
`# 1. PowerShell'i "Yönetici olarak çalıştır"
PS C:\\Windows\\system32> wsl --install
# ... WSL'yi ve Ubuntu'yu indirir, sonra
#     Windows'u yeniden başlatmanızı ister

# yeniden başlattıktan sonra: neler kurulu?
PS C:\\Users\\ayse> wsl -l -v`, 13);
  d.card(s, MX, 4.85, 6.6, 2.0, { title: "Gereksinimler ve sorunlar", body: [
    "Windows 10 sürüm 2004 (derleme 19041) ya da daha yenisi veya Windows 11.",
    "Sanallaştırma hatası mı? BIOS/UEFI'de açın (Intel VT-x / AMD-V).",
  ], bodySize: 13.5 });
  d.card(s, MX + 6.85, 1.65, 5.3, 5.2, { title: "Adım adım", body: [
    { b: "1 · Kurun:", t: " Başlat'a sağ tıklayın → Terminal (Yönetici) ya da PowerShell (Yönetici); wsl --install yazın." },
    { b: "2 · Yeniden başlatın:", t: " Windows isteyince." },
    { b: "3 · İlk açılış:", t: " Başlat menüsünden \"Ubuntu\"yu açın; bir Linux kullanıcı adı ve parola seçin. Parola yazılırken ekranda görünmez — bu normaldir." },
    { b: "4 · Kullanın:", t: " kabuğa ihtiyaç duyduğunuzda Ubuntu'yu açın (ya da wsl yazın)." },
    { b: "İpucu:", t: " Windows C: sürücünüz Linux içinde /mnt/c'dir." },
  ], bodySize: 13.5 });
  s.addNotes("wsl --install gerekli Windows özelliklerini etkinleştirir, WSL 2'yi ve varsayılan dağıtım olan Ubuntu'yu kurar. Koyu kutuda # ile başlayan satırlar komut değil, açıklamadır. wsl -l -v (list, verbose) kurulu dağıtımları ve WSL 2 kullanıp kullanmadıklarını gösterir. Belirli bir sürüm wsl --install -d Ubuntu-24.04 ile istenebilir. İlk açılışta oluşturulan Linux kullanıcısı o Ubuntu'nun yöneticisidir (sudo kullanabilir). Tipik sorunlar: eski Windows derlemesi (Windows Update çalıştırın), donanım yazılımında kapalı sanallaştırma ya da bunu engelleyen kurum bilgisayarları — o durumda laboratuvar bilgisayarını kullanın.");

  // 7 ── VirtualBox
  s = d.content({ kicker: "Linux'a ulaşmak · sanal makine", title: "VirtualBox + Ubuntu: Bir Pencerede Bütün Bir Linux PC" });
  {
    const steps = [
      ["İndirin", "VirtualBox (virtualbox.org) ve Ubuntu Desktop 24.04 LTS ISO kalıbı (ubuntu.com/download/desktop)."],
      ["Makineyi oluşturun", "New (Yeni) → ad \"Ubuntu\", ISO'yu seçin, tür Linux / Ubuntu (64-bit)."],
      ["Kaynaklar", "Bellek 4096 MB, 2 işlemci, sanal disk 25 GB (dinamik olarak ayrılan)."],
      ["Kurun", "Makineyi başlatın, \"Install Ubuntu\"yu izleyin. \"Erase disk\" yalnızca sanal disk dosyasını siler."],
      ["Terminal açın", "Oturum açın, Ctrl+Alt+T'ye basın (ya da Etkinlikler → Terminal)."],
    ];
    const w = 2.25, gap = 0.22;
    steps.forEach((st, i) => {
      const x = MX + i * (w + gap);
      numDot(s, x + w / 2 - 0.2, 1.7, i + 1);
      d.card(s, x, 2.25, w, 2.75, { title: st[0], body: st[1], bodySize: 13, titleSize: 15, fill: i === 4 ? PALE : C.light });
      if (i < steps.length - 1) d.arrow(s, x + w + 0.01, 3.6, x + w + gap - 0.01, 3.6, { w: 1.5 });
    });
  }
  d.callout(s, MX, 5.3, 12.15, 1.55, "Sanal makine (virtual machine), işletim sistemindeki sanallaştırma fikrinin bütün bir bilgisayara uygulanmasıdır: VirtualBox (bir hipervizör) Ubuntu'ya sanal işlemciler, bellek ve disk verir; Ubuntu makinenin sahibi olduğunu sanır. Sanal makinenin içinde bozduğunuz hiçbir şey Windows'a zarar veremez — alıştırma için mükemmel bir yer.", 14);
  s.addNotes("4 GB / 25 GB değerleri Ubuntu'nun kendi masaüstü önerilerine dayanır; ana makinede 8 GB RAM varsa sanal makineye 4 GB vermek sorun değildir; 4 GB'lık bir dizüstünde WSL'yi tercih edin. VirtualBox 7, kullanıcı adını ve parolayı sizin yerinize dolduran bir 'gözetimsiz kurulum' (unattended installation) yapabilir; iki yol da olur. Öğrencileri rahatlatın: sanal makinenin içindeki 'Erase disk and install Ubuntu' yalnızca sanal disk dosyasına (kullanıcı klasöründeki bir .vdi dosyası) dokunur. Sanal makine açılmıyorsa büyük olasılıkla BIOS/UEFI'de sanallaştırma (VT-x/AMD-V) kapalıdır.");

  // 8 ── Lab klasörü
  s = d.content({ kicker: "Linux'a ulaşmak · lab klasörü", title: "Laboratuvar Kurulum Betiğini Bir Kez Çalıştırın" });
  term(s, MX, 1.65, 7.6, 3.55, pick("out_setup.txt", [1, 2, 3, 4, 5]), 11);
  d.card(s, MX + 7.85, 1.65, 4.3, 3.55, { title: "Betiği edinmek", body: [
    "mcmp117_lab_setup.sh dosyasını dersin Telegram kanalından indirin [bağlantı: teyit edilecek].",
    "Ev dizininize koyun ya da bulunduğu yerden çalıştırın (her zaman ~/lab'ı kurar).",
    "WSL: Windows'taki İndirilenler = /mnt/c/Users/<siz>/Downloads",
  ], bodySize: 13 });
  term(s, MX, 5.4, 12.15, 1.45,
`# doğrudan indirme klasöründen çalıştırın (sanal makine / Ubuntu):
student@okan-lab:~$ bash ~/Downloads/mcmp117_lab_setup.sh
# ... ya da Windows'taki indirme klasöründen (WSL):
student@okan-lab:~$ bash /mnt/c/Users/ayse/Downloads/mcmp117_lab_setup.sh`, 11);
  s.addNotes("Gerçek çıktı. Betik ~/lab altında belgeler, veri dosyaları, günlükler, küçük bir C programı, 'photos' klasörü ve küçük bir proje ağacı oluşturur. İçinde rastgelelik yoktur; böylece herkes slaytlardakiyle tıpatıp aynı dosyaları elde eder. Yeniden çalıştırmak güvenlidir: YALNIZCA lab klasörünü silip yeniden oluşturur — bu yüzden kendi çalışmalarınızı ~/lab içinde tutmayın. 'bash dosya.sh' betiği bash ile çalıştırır; şimdilik onu çalıştırılabilir yapmamız gerekmiyor (11. hafta, chmod). 'ayse' yerine kendi Windows kullanıcı adınızı yazın. Dosya Not Defteri'nde açılıp kaydedildiyse Windows satır sonlarını almış olabilir ve \"$'\\r': command not found\" hatası verir — yeniden indirin.");

  // ───────────────────────── BÖLÜM 2: TERMİNAL, KABUK, ÇEKİRDEK
  s = d.sectionSlide({ kicker: "Bölüm 2", title: "Terminal, Kabuk, Çekirdek", subtitle: "Sıkça karıştırılan üç ayrı program." });
  s.addNotes("Öğrenciler 'terminal', 'kabuk', 'komut satırı' ve 'Linux' sözcüklerini çoğu zaman aynı şeymiş gibi kullanır. Bugün 2. haftadaki katman resmini kullanarak onları birbirinden ayırıyoruz.");

  // 10 ── Katmanlar
  s = d.content({ kicker: "Kim ne yapar", title: "Terminal ≠ Kabuk ≠ Çekirdek" });
  {
    const x = MX, w = 6.4;
    const L = [
      ["Siz", "klavye ve ekran", C.light, C.dark],
      ["Terminal (öykünücü)", "bir pencere: tuşlarınızı gönderir, karakterleri çizer  ·  GNOME Terminal, Windows Terminal", PALE, C.dark],
      ["Kabuk: bash", "satırı okur, yorumlar, programları başlatır  ·  kullanıcı modu, bir sistem programı (2. hafta)", C.mint, C.dark],
      ["Çekirdek: Linux", "dosyalar, süreçler, bellek, aygıtlar  ·  çekirdek modu, yalnızca sistem çağrılarıyla erişilir", C.charcoal, C.white],
      ["Donanım", "işlemci, RAM, disk, ağ", C.slate, C.white],
    ];
    L.forEach((r, i) => {
      const y = 1.7 + i * 1.02;
      d.box(s, x, y, w, 0.82, r[0], { sub: r[1], fill: r[2], color: r[3], size: 15, subSize: 11 });
      if (i < L.length - 1) d.arrow(s, x + w / 2, y + 0.83, x + w / 2, y + 1.01, { color: C.slate, w: 1.5, both: true });
    });
    line(s, x - 0.1, 1.7 + 3 * 1.02 - 0.1, x + w + 0.1, 1.7 + 3 * 1.02 - 0.1, { color: C.red, width: 1.5, dashType: "dash" });
  }
  d.card(s, MX + 6.75, 1.65, 5.4, 5.2, { title: "Birbirinden ayırın", body: [
    { b: "Terminal:", t: " yalnızca girdi ve çıktı. Komutları anlamaz." },
    { b: "Kabuk (shell):", t: " komut yorumlayıcısı (3. hafta). Linux'ta birkaç tane vardır: bash (Ubuntu'da varsayılan), zsh, sh, fish." },
    { b: "Çekirdek:", t: " her komut için asıl işi sistem çağrıları aracılığıyla yapar (kırmızı kesikli çizgi = sistem çağrısı sınırı)." },
    { b: "\"Linux\"", t: " aslında yalnızca çekirdektir; Ubuntu = Linux çekirdeği + GNU araçları + çok daha fazlası (2. hafta)." },
  ], bodySize: 13.5 });
  s.addNotes("2. hafta: çekirdek her zaman çalışan tek programdır; kabuk, ls ve cp gibi sistem programları kullanıcı modunda çalışır. 3. hafta: komut yorumlayıcısı çekirdeğin parçası değil, kullanıcı düzeyinde bir sistem programıdır. Kırmızı kesikli çizgiyi vurgulayın: kabuk diske ya da ekran donanımına doğrudan dokunamaz; o da başlattığı her komut da sistem çağrılarını kullanmak zorundadır. Tarihsel olarak 'terminal' fiziksel bir aygıttı (bir teleks makinesi ya da VT100 gibi bir video terminali); bugün onu taklit eden bir programdır.");

  // 11 ── ls yazınca ne olur
  s = d.content({ kicker: "3. haftayla bağlantı", title: "ls Yazıp Enter'a Bastığınızda Ne Olur?" });
  {
    const y = 1.85;
    d.box(s, MX, y, 2.35, 1.0, "bash", { sub: "kabuk (ebeveyn)", fill: C.mint, color: C.dark, size: 16 });
    d.box(s, MX + 3.25, y, 2.35, 1.0, "bash (kopya)", { sub: "fork() sonrası çocuk", fill: PALE, color: C.dark, size: 15 });
    d.box(s, MX + 6.5, y, 2.35, 1.0, "ls", { sub: "exec() sonrası çocuk", fill: C.charcoal, size: 16 });
    d.arrow(s, MX + 2.37, y + 0.5, MX + 3.23, y + 0.5, { color: C.mintDeep, w: 2 });
    d.arrow(s, MX + 5.62, y + 0.5, MX + 6.48, y + 0.5, { color: C.mintDeep, w: 2 });
    d.text(s, "fork()", { x: MX + 2.35, y: y + 0.05, w: 0.9, h: 0.35, fontSize: 12, bold: true, color: C.mintDeep, align: "center" });
    d.text(s, "exec()", { x: MX + 5.6, y: y + 0.05, w: 0.9, h: 0.35, fontSize: 12, bold: true, color: C.mintDeep, align: "center" });
    line(s, MX + 7.68, y + 1.02, MX + 7.68, y + 1.55, { color: C.slate, width: 1.75 });
    line(s, MX + 7.68, y + 1.55, MX + 1.17, y + 1.55, { color: C.slate, width: 1.75 });
    d.arrow(s, MX + 1.17, y + 1.55, MX + 1.17, y + 1.03, { color: C.slate, w: 1.75 });
    d.text(s, "ls exit() çağırır; bekleyen kabuğun wait() çağrısı döner → yeni istem", { x: MX + 1.4, y: y + 1.6, w: 6.6, h: 0.35, fontSize: 12, italic: true, color: C.slate });
  }
  d.card(s, MX, 4.05, 8.85, 2.8, { title: "Beş adım", body: [
    { b: "1 Oku:", t: " bash terminalden \"ls\" satırını okur." },
    { b: "2 Bul:", t: " ls yerleşik değildir; bash $PATH içindeki dizinleri arar ve /usr/bin/ls'yi bulur." },
    { b: "3 fork():", t: " bash bir çocuk süreç, yani kendinin bir kopyasını oluşturur." },
    { b: "4 exec():", t: " çocuk kendi programını /usr/bin/ls ile değiştirir; ls çalışır, yazar, çıkar." },
    { b: "5 wait():", t: " ebeveyn kabuk bekler, sonra yeni istemi yazar." },
  ], bodySize: 13.5 });
  d.callout(s, MX + 9.1, 4.05, 3.05, 2.8, "Bu, 3. haftadaki fork–exec–wait kalıbının ta kendisidir. Yazdığınız her harici komut kendi PID'si olan yeni bir süreçtir.", 14);
  s.addNotes("3. haftadaki fork_exec_wait.c programını hatırlatın: ebeveyn çatallanır (fork), çocuk bir programı exec ile yükler, ebeveyn bekler. Kabuk, bu programın bir döngü içindeki hâlidir: bir satır oku, fork, exec, wait, tekrarla. Bazı komutlar 'yerleşik' (builtin) komutlardır; bash onları yeni bir süreç oluşturmadan kendisi çalıştırır — cd, pwd, echo, history; cd'nin neden yerleşik OLMAK ZORUNDA olduğunu bugün ileride göreceğiz. 'type ls' bir komutun hangi türden olduğunu söyler.");

  // 12 ── strace
  s = d.content({ kicker: "2. haftayla bağlantı", title: "Komutlar Sistem Çağrısına Dönüşür: strace ls" });
  term(s, MX, 1.65, 12.15, 2.55, pick("out_syscalls.txt", [1]), 12);
  d.card(s, MX, 4.4, 6.0, 2.45, { title: "İzi okumak", body: [
    { b: "execve:", t: " çocuk, [\"ls\", \"docs\"] argümanlarıyla /usr/bin/ls'ye dönüşür." },
    { b: "getdents64:", t: " \"dizin girdilerini al\" — dizini okur: 9 girdi (6 dosya, .settings, . ve ..)." },
    { b: "write(1, …):", t: " 1 numaralı dosya tanımlayıcısına (standart çıktı) 86 bayt yazar." },
  ], bodySize: 13 });
  d.card(s, MX + 6.25, 4.4, 5.9, 2.45, { title: "Bu neden önemli?", body: [
    "ls diski kendisi okuyamaz: her program gibi çekirdekten ister (ikili mod, 2. hafta).",
    "Dizin, (ad, düğüm) çiftlerini tutan bir dosyadır (7. hafta); getdents64 bu çiftleri okur.",
    "> /dev/null, ls'nin kendi çıktısını gizler (12. hafta); yalnızca strace'in raporu kalır.",
  ], bodySize: 13 });
  s.addNotes("Gerçek çıktı; -e trace=... ile üç sistem çağrısına süzüldü. Süzgeç olmadan ls birkaç düzine çağrı yapar (bellek eşleme, kitaplıkları açma, yerel ayar dosyaları). 2. haftada strace'i bir C programı üzerinde kullanmıştık; burada aynı araç, basit bir komutun bile bir sistem çağrıları dizisinden ibaret olduğunu gösteriyor. 1 numaralı dosya tanımlayıcısı (file descriptor) standart çıktıdır — 12. haftanın konusu. strace kurulu olmayabilir: sudo apt install strace.");

  // 13 ── İstem ve anatomi
  s = d.content({ kicker: "Ekranı okumak", title: "İstem ve Bir Komutun Anatomisi" });
  {
    const parts = [["student", "kullanıcı", 1.35], ["@", "", 0.35], ["okan-lab", "bilgisayar", 1.6], [":", "", 0.35], ["~/lab", "geçerli dizin", 1.35], ["$", "normal kullanıcı", 1.1]];
    let x = MX + 0.1; const y = 1.75;
    parts.forEach(p => {
      d.box(s, x, y, p[2] - 0.06, 0.62, p[0], { fill: p[1] ? C.charcoal : C.light, color: p[1] ? C.mint : C.dark, size: 18, font: F.code });
      if (p[1]) d.text(s, p[1], { x: x - 0.1, y: y + 0.66, w: p[2] + 0.14, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "center" });
      x += p[2];
    });
    d.text(s, "~ = ev dizininiz /home/student  ·  $ yerine # görürseniz: root (yönetici)", { x: MX + 0.1, y: y + 1.0, w: 5.7, h: 0.6, fontSize: 12, color: C.mutedOnLight });
    const a = [["ls", "komut", 0.9, C.mint], ["-l -a", "seçenekler", 1.5, PALE], ["docs  /etc", "argümanlar", 2.6, C.light]];
    let ax = MX + 0.1; const ay = 3.75;
    d.text(s, "komut  -seçenekler  argümanlar", { x: MX + 0.1, y: ay - 0.5, w: 5.8, h: 0.4, fontSize: 15, bold: true, color: C.mintDeep });
    a.forEach(p => {
      d.box(s, ax, ay, p[2] - 0.08, 0.62, p[0], { fill: p[3], color: C.dark, size: 18, font: F.code });
      d.text(s, p[1], { x: ax, y: ay + 0.66, w: p[2] - 0.08, h: 0.3, fontSize: 11.5, italic: true, color: C.mutedOnLight, align: "center" });
      ax += p[2];
    });
    d.text(s, "boşluklarla ayrılır · büyük-küçük harf önemlidir: ls ≠ LS", { x: MX + 0.1, y: ay + 1.05, w: 5.8, h: 0.35, fontSize: 12, color: C.mutedOnLight });
  }
  s.addTable([
    ["Örnek", "Komut", "Seçenekler", "Argümanlar"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 13 } })),
    ...[["pwd", "pwd", "—", "—"], ["ls -la docs", "ls", "-l -a (birleşik)", "docs"], ["ls --all docs", "ls", "--all (uzun biçim)", "docs"], ["cd ../src", "cd", "—", "../src"], ["uname -r", "uname", "-r", "—"], ["head -n 4 file", "head", "-n, değeri 4", "file"]]
      .map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, fontFace: j === 0 ? F.code : F.body, fontSize: 12.5 } }))),
  ], { x: MX + 6.3, y: 1.7, w: 5.85, colW: [1.75, 1.0, 1.75, 1.35], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [4, 6, 4, 6], valign: "middle" });
  d.callout(s, MX + 6.3, 5.55, 5.85, 1.3, "Seçenekler (options) bir komutun NASIL çalışacağını değiştirir (genellikle - ya da -- ile başlar); argümanlar NE üzerinde çalışacağını söyler (dosyalar, dizinler, metin).", 13);
  s.addNotes("İstemin parçalarını gerçek bir terminal üzerinde gösterin. Öğrenciler cd yaptıkça istemin değiştiğini görecek. Ubuntu'da varsayılan istem kullanıcı@bilgisayar:dizin$ biçimindedir ve bash ev dizinini ~ ile gösterir. Tek harfli seçenekler birleştirilebilir: ls -l -a = ls -la = ls -al. Uzun seçenekler iki tireyle başlar (--all, --help) ve birleştirilemez. Bir seçenek değer alabilir: head -n 4. Tipik hata: boşluğu unutmak, örneğin 'ls-l' (command not found) ya da 'cd..' (bazı sistemlerde bir takma ad sayesinde çalışır, düz bash'te çalışmaz).");

  // 14 ── İlk komutlar
  s = d.content({ kicker: "Canlı gösterim", title: "İlk Komutlar: Kim, Nerede, Ne Zaman, Ne" });
  term(s, MX, 1.65, 12.15, 3.7, pick("out_first.txt", [0, 1, 2, 3, 4, 5, 6, 7]), 12);
  d.callout(s, MX, 5.55, 12.15, 1.3, "whoami: kullanıcı adınız  ·  hostname: bilgisayarın adı  ·  date: tarih ve saat  ·  echo: argümanlarını yazar (kabuk, echo çalışmadan önce $SHELL ve ~ yerine değerlerini koydu)  ·  uname -r / -a: çekirdek sürümü / her şey  ·  clear ya da Ctrl+L: ekranı temizler", 13.5);
  s.addNotes("Ubuntu 24.04 test makinemizden gerçek çıktı. Seçeneksiz uname yalnızca çekirdeğin adını, Linux, yazar. uname -r çekirdek sürümünü yazar; normal bir Ubuntu 24.04 bilgisayarda 6.8.0-xx-generic gibi bir şey, WSL'de microsoft-standard-WSL2 ile biten bir sürüm görürsünüz. Makinemizdeki saat UTC'dir; sizinki yerel saati (İstanbul'da +03) gösterir. Sonraki haftalar için önemli ayrıntı: 'echo My shell is $SHELL and my home is ~' komutunda echo '$SHELL' ya da '~' görmez — kabuk onları önce genişletir. Türkçe yerel ayarlı bir sistemde date çıktısı Türkçe olabilir (ör. 'Pzt Eki 12 ...'). Öğrencilerden her komutu kendilerinin yazmasını isteyin.");

  // ───────────────────────── BÖLÜM 3: ETRAFA BAKMAK
  s = d.sectionSlide({ kicker: "Bölüm 3", title: "Neredeyim? Burada Ne Var?", subtitle: "pwd ağaçtaki konumunuzu yazar; ls orada ne olduğunu listeler." });
  s.addNotes("Her kabuğun (aslında her sürecin) bir geçerli çalışma dizini vardır. Göreli yollar bu dizinden başlayarak çözülür. pwd onu gösterir; ls içeriğini listeler.");

  // 16 ── pwd ve ls
  s = d.content({ kicker: "Canlı gösterim", title: "Lab Klasöründe pwd ve ls" });
  term(s, MX, 1.65, 7.6, 5.2, pick("out_ls.txt", [0, 1, 2, 3, 4, 5]), 11);
  d.card(s, MX + 7.9, 1.65, 4.25, 5.2, { title: "Nelere dikkat edin", body: [
    { b: "pwd", t: " = print working directory (çalışma dizinini yaz): mutlak bir yol." },
    { b: "ls", t: " geçerli dizini listeler; ls docs başka bir dizini." },
    { b: "-F", t: " dizinleri / ile işaretler." },
    { b: "-a", t: " nokta ile başlayan gizli adları da gösterir: .settings, . ve .." },
    { b: "Tırnaklar:", t: " ls 'final report.txt' adını tırnak içinde gösterir, çünkü adda boşluk var." },
  ], bodySize: 13 });
  s.addNotes("Ubuntu'da ls, 'ls --color=auto' için bir takma addır (~/.bashrc içinde tanımlı); bu yüzden öğrenciler dizinleri mavi görür — bizim kaydettiğimiz çıktı renksizdir. Gizli dosya, adı nokta ile başlayan sıradan bir dosyadır; genellikle yapılandırma dosyalarıdır (~/.bashrc). Her dizin . (kendisi) ve .. (üst dizini) girdilerini içerir — 7. haftada çizdiğimiz girdilerin aynısı. ' ' ile tırnaklama, GNU ls'nin adda boşluk bulunduğunu gösterme yoludur; tırnaklar adın parçası DEĞİLDİR.");

  // 17 ── ls -l okumak
  s = d.content({ kicker: "ls -l", title: "ls -l Çıktısının Bir Satırını Okumak" });
  {
    const fields = [
      ["-rw-rw-r--", 2.05, "tür + izinler", "- dosya, d dizin, l bağlantı; sahip, grup, diğerleri için rwx → 11. hafta"],
      ["1", 1.0, "bağlantı", "sabit bağlantı sayısı (7. hafta)"],
      ["student", 1.45, "sahip", "dosyanın sahibi olan kullanıcı"],
      ["student", 1.45, "grup", "dosyanın grubu"],
      ["578", 1.0, "boyut", "bayt cinsinden"],
      ["Oct 12 08:49", 2.25, "değiştirilme", "içeriğin son değişimi (mtime)"],
      ["syllabus.txt", 2.4, "ad", "düğümde değil, dizinde tutulur"],
    ];
    let x = MX + 0.1; const y = 1.85;
    fields.forEach((f, i) => {
      d.box(s, x, y, f[1] - 0.08, 0.7, f[0], { fill: C.dark, color: C.mint, size: 17, font: F.code, bold: false });
      line(s, x + (f[1] - 0.08) / 2, y + 0.72, x + (f[1] - 0.08) / 2, y + 0.98, { color: C.mintDeep, width: 1.5 });
      d.box(s, x, y + 1.0, f[1] - 0.08, 0.5, f[2], { fill: PALE, color: C.dark, size: 12.5 });
      d.text(s, f[3], { x, y: y + 1.55, w: f[1] - 0.08, h: 1.15, fontSize: 11.5, color: "3A464C", align: "center" });
      x += f[1];
    });
  }
  d.card(s, MX, 4.75, 5.95, 2.1, { title: "Dizinler şöyle görünür", body: [
    "drwxrwxr-x 4 student student 4096 … projects",
    "d = dizin; 4096 boyutu = bir blokluk girdi; bağlantı sayısı 4 = 2 + 2 alt dizini.",
  ], bodySize: 13 });
  d.card(s, MX + 6.2, 4.75, 5.95, 2.1, { title: "Neredeyse hepsi düğümdür (inode)", body: [
    "Tür, izinler, bağlantılar, sahip, grup, boyut ve zamanlar düğüm alanlarıdır (7. hafta).",
    "Yalnızca ad dizin girdisinden gelir. stat düğümün tamamını gösterir (10. hafta).",
  ], bodySize: 13 });
  s.addNotes("'Etrafa bakmak' bölümünün en önemli slaytı budur: öğrenciler finale kadar her hafta ls -l satırları okuyacak. Bugün yalnızca her sütunun anlamı; izin dizgesini 11. hafta ayrıntılı açıklar. Bir dizinin bağlantı sayısı: üst dizindeki girdisi, kendi '.' girdisi ve her alt dizinindeki '..'. projects'in alpha ve beta alt dizinleri var, dolayısıyla 2 + 2 = 4 (code/check_numbers.py ile doğrulandı). Dosyalarda 1'den büyük bağlantı sayısı sabit bağlantılar (hard link) demektir (7. hafta, ln).");

  // 18 ── ls -l ve -h
  s = d.content({ kicker: "Canlı gösterim", title: "ls -l ve ls -lh: İnsanın Okuyabileceği Boyutlar" });
  term(s, MX, 1.65, 7.6, 5.2, pick("out_ls.txt", [7, 8]), 12);
  d.card(s, MX + 7.9, 1.65, 4.25, 2.95, { title: "-h = insan tarafından okunabilir", body: [
    "K, M, G 1024'ün kuvvetleridir: 1K = 2¹⁰ bayt.",
    "access.log: 23.604 B ÷ 1024 ≈ 23,05 → 24K olarak gösterilir (ls yukarı yuvarlar).",
    "system.log: 5.207 B ÷ 1024 ≈ 5,09 → 5.1K.",
  ], bodySize: 13 });
  d.card(s, MX + 7.9, 4.8, 4.25, 2.05, { title: "\"total\" satırı", body: [
    "Listelenen dosyaların kullandığı disk alanı, 1K'lık bloklar cinsinden. Her küçük dosya koca bir 4K blok kaplar: 6 × 4 = 24.",
  ], bodySize: 13 });
  s.addNotes("Gerçek çıktı. Sayılar code/check_numbers.py ile doğrulandı: 23604/1024 = 23,05, YUKARI yuvarlanarak 24K; 5207/1024 = 5,085 → 5.1K; 1208/1024 = 1,18 → 1.2K. 1024 bayttan küçük dosyalar bayt olarak gösterilir. 16 baytlık bir dosya neden 4K kullanır? Dosya sistemi bütün bloklar ayırır (7. hafta, blok hesabı). ls -l docs, tırnaksız adların önüne bir boşluk koyar; böylece bütün adlar tırnaklı adla aynı hizaya gelir.");

  // 19 ── ls -R ve tree
  s = d.content({ kicker: "Canlı gösterim", title: "Bütün Alt Ağaçlar: ls -R ve tree" });
  term(s, MX, 1.65, 5.0, 5.2, pick("out_tree.txt", [1]).split("\n").slice(0, 22).join("\n"), 11.5);
  term(s, MX + 5.25, 1.65, 4.0, 5.2, pick("out_tree.txt", [2]), 11.5);
  d.card(s, MX + 9.5, 1.65, 2.65, 5.2, { title: "Karşılaştırın", body: [
    { b: "ls -R:", t: " özyinelemeli (recursive); her dizin için bir blok." },
    { b: "tree:", t: " aynı bilgi resim olarak — 7. haftanın ağacı." },
    "Kurulum: sudo apt install tree",
    "Dikkat: ls -R / bütün diski listeler. Ctrl+C durdurur.",
  ], bodySize: 12.5 });
  s.addNotes("Gerçek çıktı. tree her zaman kurulu değildir: 'sudo apt install tree'. sudo tek bir komutu yönetici (root) olarak çalıştırır ve SİZİN parolanızı sorar; bu derste onu yalnızca yazılım kurmak için kullanın — bir komut başarısız oldu diye asla başına sudo yazmayın (11. hafta). '7 directories, 6 files' — tree projects dizininin kendisini de sayar. Bir komut durmadan yazıyorsa Ctrl+C onu keser.");

  // 20 ── ls kopya kâğıdı
  s = d.tableSlide({
    kicker: "Kopya kâğıdı", title: "Dönem Boyunca Kullanacağınız ls Seçenekleri",
    header: ["Seçenek", "Anlamı", "Örnek"],
    colW: [1.6, 6.2, 4.35],
    rows: [
      ["-l", "uzun liste: tür, izinler, bağlantılar, sahip, grup, boyut, zaman, ad", "ls -l docs"],
      ["-a / -A", "tümü, nokta ile başlayan gizli dosyalar dâhil (-A: . ve .. olmadan)", "ls -a ~"],
      ["-h", "insan tarafından okunabilir boyutlar (-l ile)", "ls -lh logs"],
      ["-R", "özyinelemeli: her alt dizini de listele", "ls -R projects"],
      ["-F", "dizinlere / ekle (çalıştırılabilirlere *, bağlantılara @)", "ls -F"],
      ["-d", "içeriği değil, dizinin kendisi", "ls -ld projects"],
      ["-S / -t / -r", "boyuta göre / zamana göre (en yeni önce) sırala / sırayı ters çevir", "ls -lS docs"],
      ["-1 / -i", "her satırda bir ad / düğüm numaralarını göster (7. hafta)", "ls -1 photos"],
    ],
    fontSize: 13.5, y: 1.7,
  });
  s.addNotes("Seçenekler birleşir: ls -lah, ls -ltr (en eskiler önce — en yeni dosyayı en altta bulmak için kullanışlı), ls -lS. Ubuntu'nun ~/.bashrc dosyası ayrıca ll = ls -alF, la = ls -A ve l = ls -CF takma adlarını tanımlar. Ezberlemeyin; 'ls --help' komutunun hepsini listelediğini bilin.");

  // 21 ── Mola
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Mola", subtitle: "Sırada: Linux dizin ağacı, cd, yollar, yardım alma — ardından laboratuvar." });
  s.addNotes("On dakika. Terminali çalışmayan öğrenciler: laboratuvardan önce WSL/sanal makine sorunlarını çözebilmemiz için molada öne gelin.");

  // ───────────────────────── BÖLÜM 4: AĞAÇTA DOLAŞMAK
  s = d.sectionSlide({ kicker: "Bölüm 4", title: "Ağaçta Dolaşmak", subtitle: "Tek ağaç, tek kök: /. Sürücü harfi yok." });
  s.addNotes("7. hafta ağaç yapılı dizinleri ve mutlak/göreli yolları kuramsal olarak tanıttı. Şimdi gerçek ağaçta yürüyoruz.");

  // 23 ── FHS diyagramı
  s = d.content({ kicker: "Dosya Sistemi Hiyerarşi Standardı", title: "Linux Dizin Ağacı" });
  {
    const top = 1.75;
    d.box(s, MX + 5.55, top, 1.05, 0.55, "/", { fill: C.charcoal, size: 20, font: F.code });
    const dirs = [
      ["bin", "→ usr/bin"], ["etc", "ayarlar"], ["home", "kullanıcılar"], ["tmp", "geçici"], ["usr", "programlar"],
      ["var", "değişen veri"], ["dev", "aygıtlar"], ["proc", "çekirdek bilgisi"], ["root", "root'un evi"],
    ];
    const w = 1.27, gap = 0.08, y1 = top + 1.0;
    dirs.forEach((dd, i) => {
      const x = MX + i * (w + gap);
      line(s, MX + 6.075, top + 0.55, x + w / 2, y1, { color: C.slate });
      const special = dd[0] === "dev" || dd[0] === "proc";
      d.box(s, x, y1, w, 0.85, dd[0], { sub: dd[1], fill: dd[0] === "home" ? C.mint : special ? "E4E8E9" : PALE, color: C.dark, size: 15, subSize: 10, font: F.code });
    });
    const xh = MX + 2 * (w + gap), y2 = y1 + 1.35;
    line(s, xh + w / 2, y1 + 0.85, xh + w / 2, y2, { color: C.slate });
    d.box(s, xh, y2, w, 0.5, "student", { fill: C.mint, color: C.dark, size: 13, font: F.code });
    line(s, xh + w / 2, y2 + 0.5, xh + w / 2, y2 + 0.85, { color: C.slate });
    d.box(s, xh, y2 + 0.85, w, 0.5, "lab", { fill: C.mint, color: C.dark, size: 13, font: F.code });
    const xu = MX + 4 * (w + gap);
    [["bin", 0], ["lib", 1], ["share", 2]].forEach(([n, k]) => {
      line(s, xu + w / 2, y1 + 0.85, xu - 0.55 + k * 0.9 + 0.4, y2, { color: C.slate });
      d.box(s, xu - 0.55 + k * 0.9, y2, 0.8, 0.5, n, { fill: PALE, color: C.dark, size: 11.5, font: F.code });
    });
    const xv = MX + 5 * (w + gap);
    line(s, xv + w / 2 + 0.3, y1 + 0.85, xv + w / 2 + 0.6, y2, { color: C.slate });
    d.box(s, xv + w / 2 + 0.2, y2, 0.8, 0.5, "log", { fill: PALE, color: C.dark, size: 11.5, font: F.code });
    d.text(s, "/home/student/lab  =  ~/lab", { x: MX, y: y2 + 1.45, w: 4.2, h: 0.35, fontSize: 13, bold: true, color: C.mintDeep });
    d.text(s, "gri = sanal: diskte saklanmaz, çekirdek üretir", { x: MX + 6.6, y: y2 + 0.85, w: 5.5, h: 0.35, fontSize: 12, italic: true, color: C.mutedOnLight, align: "right" });
  }
  d.callout(s, MX, 6.05, 12.15, 0.8, "Her şey — diskler, USB bellekler, hatta aygıtlar ve çekirdek verileri — tek kök / altında bir yerde görünür. Windows'ta her sürücünün ayrı bir ağacı vardır (C:\\, D:\\).", 14);
  s.addNotes("Dosya Sistemi Hiyerarşi Standardı (Filesystem Hierarchy Standard, FHS) hangi dizinin neyi tuttuğunu belirler; böylece bütün dağıtımlar birbirine benzer. Ek diskler ve USB bellekler ağaca 'bağlanır' (mount; genellikle /media ya da /mnt altına) — sürücü harfi yoktur. Ubuntu 24.04'te /bin, /usr/bin'e bir sembolik bağlantıdır ('birleşik /usr'), dolayısıyla iki ad da aynı programlara ulaşır. /root yöneticinin ev dizinidir; / (kök dizin) ile karıştırılmamalıdır.");

  // 24 ── FHS turu
  s = d.content({ kicker: "Canlı gösterim", title: "Ağaçta Bir Tur: /, /bin, /etc, /var, /tmp" });
  term(s, MX, 1.65, 8.45, 5.2, pick("out_fhs.txt", [0, 1, 2, 3, 4, 5, 6, 7]), 10);
  d.card(s, MX + 8.7, 1.65, 3.45, 5.2, { title: "Nelere dikkat edin", body: [
    { b: "/bin -> usr/bin:", t: " bir sembolik bağlantı (l); programlar aslında /usr/bin'de." },
    { b: "/usr/bin/ls:", t: " ls programı sıradan bir dosyadır (142.312 bayt)." },
    { b: "/etc:", t: " metin yapılandırma dosyaları — os-release dağıtımın adını verir." },
    { b: "/var:", t: " büyüyen veriler: log, cache, spool." },
    { b: "/tmp:", t: " herkes yazabilir (t: yapışkan bit, 11. hafta)." },
  ], bodySize: 12.5 });
  s.addNotes("Gerçek çıktı; / listesinden yalnızca test makinemizde bulunan iki girdiyi çıkardık. *.usr-is-merged dizinleri Ubuntu'nun birleşik /usr'ye geçişinden kalmadır — önemsemeyin. 'type ls' yanıtı: ls, /usr/bin içindeki bir program dosyasıdır. Sorun: /etc neden düz metin dosyalarıyla dolu? (Çünkü UNIX yapılandırmayı düzenlenebilir metin olarak tutar — 11. hafta /etc/passwd dosyasını okuyacak.) /tmp içindeki dosyalar yeniden başlatmada silinebilir.");

  // 25 ── /dev ve /proc
  s = d.content({ kicker: "Canlı gösterim · 2. ve 3. haftalarla bağlantı", title: "/dev ve /proc: Dosya Olarak Aygıtlar ve Çekirdek" });
  term(s, MX, 1.65, 7.0, 5.2, pick("out_fhs.txt", [8, 9, 10, 11]), 12);
  d.card(s, MX + 7.25, 1.65, 4.9, 2.4, { title: "/dev: aygıt dosyaları", body: [
    "c = karakter aygıtı; \"1, 3\" boyut değil, sürücü numaralarıdır.",
    "/dev/null kendisine yazılan her şeyi yutar (12. hafta).",
  ], bodySize: 13 });
  d.card(s, MX + 7.25, 4.25, 4.9, 2.6, { title: "/proc: çekirdeğe açılan pencere", body: [
    "Diskte değildir: siz okurken metni çekirdek yazar.",
    "$$ = bu kabuğun PID'si. /proc/<PID>/status, PCB'sinin bir kısmını gösterir: ad, durum S (uyuyor), PID, ebeveyn PID (3. hafta).",
  ], bodySize: 13 });
  s.addNotes("UNIX'te 'her şey bir dosyadır': aygıtlara dosyalarla aynı open/read/write sistem çağrılarıyla erişilir (2. hafta, G/Ç). /dev/null 'kara delik'tir; /dev/zero sıfır baytları üretir; /dev/tty terminalinizdir. /proc/meminfo: test makinemizde yaklaşık 8 GB RAM var (MemTotal 8.222.320 kB). Kabuk S (uyuyor) durumundadır çünkü bekliyor — head'in bitmesini. 13. hafta /proc'a ve ps'ye geri dönecek. Sizin makinenizdeki PID farklı olacaktır.");

  // 26 ── Yollar
  s = d.content({ kicker: "Yollar", title: "~/lab İçinde Mutlak ve Göreli Yollar" });
  {
    const node = (x, y, label, opt = {}) => d.box(s, x, y, opt.w || 1.3, 0.46, label, Object.assign({ fill: PALE, size: 12.5, color: C.dark, font: F.code }, opt));
    const ed = (x1, y1, x2, y2, o) => line(s, x1, y1, x2, y2, o || { color: C.slate });
    const X = MX + 0.2, Y = [1.75, 2.55, 3.35, 4.15, 4.95];
    node(X + 2.4, Y[0], "/home/student", { w: 2.0, fill: C.charcoal, color: C.white });
    node(X + 2.75, Y[1], "lab");
    ed(X + 3.4, Y[0] + 0.46, X + 3.4, Y[1]);
    node(X + 0.6, Y[2], "docs"); node(X + 4.8, Y[2], "projects");
    ed(X + 3.4, Y[1] + 0.46, X + 1.25, Y[2]); ed(X + 3.4, Y[1] + 0.46, X + 5.45, Y[2]);
    node(X + 3.4, Y[3], "alpha"); node(X + 6.1, Y[3], "beta");
    ed(X + 5.45, Y[2] + 0.46, X + 4.05, Y[3]); ed(X + 5.45, Y[2] + 0.46, X + 6.75, Y[3]);
    node(X + 2.65, Y[4], "src", { fill: C.mint }); node(X + 4.15, Y[4], "docs");
    node(X + 5.35, Y[4], "src"); node(X + 6.85, Y[4], "docs", { fill: C.mint });
    ed(X + 4.05, Y[3] + 0.46, X + 3.3, Y[4]); ed(X + 4.05, Y[3] + 0.46, X + 4.8, Y[4]);
    ed(X + 6.75, Y[3] + 0.46, X + 6.0, Y[4]); ed(X + 6.75, Y[3] + 0.46, X + 7.5, Y[4]);
    d.arrow(s, X + 3.0, Y[4] - 0.02, X + 3.6, Y[3] + 0.5, { color: C.red, w: 2.25 });
    d.arrow(s, X + 4.3, Y[3] - 0.02, X + 5.0, Y[2] + 0.5, { color: C.red, w: 2.25 });
    d.arrow(s, X + 5.95, Y[2] + 0.5, X + 6.55, Y[3] - 0.02, { color: C.red, w: 2.25 });
    d.arrow(s, X + 7.05, Y[3] + 0.5, X + 7.35, Y[4] - 0.02, { color: C.red, w: 2.25 });
    d.text(s, "..", { x: X + 2.75, y: Y[3] + 0.3, w: 0.5, h: 0.3, fontSize: 14, bold: true, color: C.red, font: F.code });
    d.text(s, "..", { x: X + 4.05, y: Y[2] + 0.3, w: 0.5, h: 0.3, fontSize: 14, bold: true, color: C.red });
    d.text(s, "beta", { x: X + 6.4, y: Y[2] + 0.45, w: 0.7, h: 0.3, fontSize: 12, bold: true, color: C.red });
    d.text(s, "docs", { x: X + 7.4, y: Y[3] + 0.55, w: 0.7, h: 0.3, fontSize: 12, bold: true, color: C.red });
    d.text(s, "projects/alpha/src'den projects/beta/docs'a:  ../../beta/docs", { x: MX, y: 5.65, w: 8.2, h: 0.35, fontSize: 13, bold: true, color: C.red });
  }
  d.card(s, MX + 8.45, 1.65, 3.7, 2.55, { title: "Mutlak (absolute)", body: [
    "/ (ya da ~) ile başlar.",
    "Her yerden aynı anlama gelir.",
    "/home/student/lab/projects/beta/docs",
  ], bodySize: 13 });
  d.card(s, MX + 8.45, 4.4, 3.7, 2.45, { title: "Göreli (relative)", body: [
    "Başında / yok: geçerli dizinden başlar.",
    ".. = bir düzey yukarı.",
    "Kısadır ama nerede olduğunuza bağlıdır.",
  ], bodySize: 13 });
  d.callout(s, MX, 6.1, 8.2, 0.75, "7. haftadaki fikrin aynısı: mutlak yol kökten, göreli yol geçerli dizinden yürür.", 13);
  s.addNotes("Öğrencilere rotayı yüksek sesle söyletin: alpha/src'den alpha'ya çık (..), projects'e çık (..), beta'ya in, docs'a in: ../../beta/docs. Hedefin mutlak yolu /home/student/lab/projects/beta/docs'tur; ~/lab/projects/beta/docs aynı yolun ~ kısayoluyla yazılmış hâlidir (kabuk ~ yerine /home/student koyar). Sorun: 'lab/docs' mutlak mı göreli mi? (Göreli — yalnızca /home/student içindeyken çalışır.)");

  // 27 ── cd gösterimi
  s = d.content({ kicker: "Canlı gösterim", title: "cd: Dizin Değiştirmek" });
  term(s, MX, 1.65, 7.75, 5.2, pick("out_cd.txt", [2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 16, 17, 18]), 10.5);
  d.card(s, MX + 8.0, 1.65, 4.15, 5.2, { title: "Nelere dikkat edin", body: [
    "Her cd'den sonra istem nerede olduğunuzu gösterir.",
    "cd .. bir düzey yukarı çıkar; ../../docs iki kez çıkar, sonra iner.",
    "Mutlak yol her yerden çalışır.",
    "cd - bir önceki dizine döner ve onu yazar.",
    "Yalnız cd sizi eve, cd / köke götürür.",
    "cd başarılı olunca hiçbir şey yazmaz.",
  ], bodySize: 13 });
  s.addNotes("Gerçek çıktı (birkaç pwd satırı atlandı; kaydın tamamı code/out_cd.txt içinde). UNIX kuralı 'haber yoksa iyi haber': cd başarılı olduğunda hiçbir şey yazmaz; yalnızca cd - gittiği dizini yazar. Alıştırma: ~/lab/projects/alpha/docs'tan beta/src'ye nasıl gidersiniz? (../../beta/src — kaydın son satırları.)");

  // 28 ── Özel adlar
  s = d.tableSlide({
    kicker: "Kısayollar", title: "Dizinler İçin Beş Özel Ad",
    header: ["Ad", "Anlamı", "Örnek", "Sonuç (~/lab/projects/alpha'dan)"],
    colW: [1.2, 3.6, 3.0, 4.35],
    rows: [
      ["/", "bütün ağacın kökü", "cd /", "/"],
      ["~", "ev dizininiz", "cd ~/lab", "/home/student/lab"],
      [".", "geçerli dizin", "ls .", "alpha'yı listeler (ls ile aynı)"],
      ["..", "üst dizin", "cd ../beta", "/home/student/lab/projects/beta"],
      ["-", "bir önceki dizin (yalnızca cd)", "cd -", "önceki yerinize döner"],
    ],
    fontSize: 17, y: 1.8,
    callout: "Argümansız cd = cd ~. Kökün \"..\" girdisi yine / dizinidir: kökün üstüne çıkamazsınız.",
  });
  s.addNotes(". ve .. gerçek dizin girdileridir (ls -a gösterir); ~ ve - kabuk kısayollarıdır — kabuk komutu çalıştırmadan önce ~ yerine $HOME değerini koyar, cd - ise $OLDPWD değişkenini kullanır (help cd bunu söyler). '.' 11. ve 14. haftalarda önem kazanacak: ./betik.sh geçerli dizindeki bir betiği çalıştırır.");

  // 29 ── cd neden yerleşik
  s = d.content({ kicker: "3. haftayla bağlantı", title: "cd Neden Kabuğun İçinde Yerleşik Olmalı?" });
  term(s, MX, 1.65, 7.3, 3.05, pick("out_syscalls.txt", [2, 3, 4, 5]), 12);
  d.card(s, MX + 7.55, 1.65, 4.6, 3.05, { title: "Deney", body: [
    "/bin/pwd ayrı bir programdır: çekirdeğe getcwd() ile sorar.",
    "Bir çocuk bash cd /tmp çalıştırır: çekirdeğin chdir(\"/tmp\") çağrısı başarılı olur …",
    "… ama bizim kabuğumuz hâlâ ~/lab içindedir.",
  ], bodySize: 13 });
  d.callout(s, MX, 4.95, 12.15, 1.9, "Geçerli dizin, her sürecin durumunun bir parçasıdır (çekirdek onu PCB'nin yanında tutar, 3. hafta). Bir çocuk yalnızca kendi dizinini değiştirebilir, ebeveyninkini asla. cd /usr/bin içinde bir program olsaydı hemen sonlanan bir çocuk sürecin dizinini değiştirirdi — ve hiçbir şey olmazdı. Bu yüzden cd yerleşiktir: bash chdir() çağrısını kendi üzerinde yapar. type cd bunu doğrular.", 14);
  s.addNotes("Gerçek çıktı. Güzel bir sınav tipi akıl yürütme sorusudur. Aynı gerekçe, 'exit', 'export' ve kabuğun kendi durumunu değiştiren diğer komutların neden yerleşik olmak zorunda olduğunu da açıklar. pwd hem yerleşik olarak (hızlı, kabuğun kendi kaydını kullanır) hem de /bin/pwd programı olarak bulunur.");

  // ───────────────────────── BÖLÜM 5: AKILLI ÇALIŞMA
  s = d.sectionSlide({ kicker: "Bölüm 5", title: "Akıllı Çalışma", subtitle: "Kimse her seçeneği hatırlamaz: nereye bakacağınızı bilin ve yazmayı kabuğa bırakın." });
  s.addNotes("En çok zaman kazandıran üç beceri: yardımı okumak, sekme tamamlama ve komut geçmişi.");

  // 31 ── Yardım
  s = d.content({ kicker: "Yardım almak", title: "Yardım Almanın Dört Yolu" });
  term(s, MX, 1.65, 7.3, 5.2, pick("out_help.txt", [[0, 7], 1, 2]), 10);
  d.card(s, MX + 7.55, 1.65, 4.6, 5.2, { body: [
    { b: "komut --help:", t: " seçeneklerin kısa özeti (çoğu program)." },
    { b: "man komut:", t: " tam kılavuz sayfası — NAME, SYNOPSIS, DESCRIPTION bölümleri. Boşluk = sonraki sayfa, /sözcük = ara, q = çık." },
    { b: "help komut:", t: " kabuk yerleşikleri için (cd, pwd, history) — program dosyaları yoktur." },
    { b: "type komut:", t: " yerleşik mi, program dosyası mı?" },
    { b: "whatis / apropos:", t: " tek satırlık açıklama / kılavuzlarda anahtar sözcükle arama: apropos directory." },
    { b: "tldr komut", t: " (isteğe bağlı, sudo apt install tldr): kısa örnekler." },
  ], bodySize: 12.5 });
  s.addNotes("--help, type ve help komutlarının gerçek çıktısı (kısaltılmış). Test makinemiz kılavuz sayfaları olmayan küçültülmüş (minimised) bir Ubuntu olduğu için burada man çıktısı göstermiyoruz; laboratuvar bilgisayarlarında, WSL'de ve sanal makinede 'man ls' çalışır — mümkünse canlı gösterin. SYNOPSIS içinde [ ] isteğe bağlı, ... ise 'tekrarlanabilir' demektir: ls [OPTION]... [FILE]... herhangi sayıda seçenek ve dosya, hepsi isteğe bağlı demektir. man 'bu sistem küçültülmüştür' derse 'sudo unminimize' kılavuzları geri yükler (biraz sürer). Türkçe yerel ayarlı sistemlerde --help çıktısı da Türkçe olabilir.");

  // 32 ── Sekme ve geçmiş
  s = d.content({ kicker: "Canlı gösterim", title: "Sekme Tamamlama, Geçmiş ve Klavye Kısayolları" });
  term(s, MX, 1.65, 6.6, 5.2, pick("out_keys.txt", [0, 1, 2, 3, 4, 5, 6, 7, 8]), 11);
  s.addTable([
    ["Tuş / komut", "Ne yapar"].map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.charcoal }, fontFace: F.title, fontSize: 13 } })),
    ...[["Tab", "komut, dosya ya da dizin adını tamamlar"], ["Tab Tab", "olası bütün tamamlamaları listeler"], ["↑ / ↓", "geçmişteki önceki / sonraki komut"], ["history", "komutlarınızın numaralı listesi"], ["!!  ·  !n", "son komutu tekrarla  ·  n numaralı komutu"], ["Ctrl+C", "çalışan komutu keser (durdurur)"], ["Ctrl+L", "ekranı temizler (clear gibi)"], ["Ctrl+A / Ctrl+E", "satırın başına / sonuna atlar"]]
      .map((r, i) => r.map((t, j) => ({ text: t, options: { color: "3A464C", fill: { color: i % 2 ? C.white : C.light }, bold: j === 0, fontFace: F.body, fontSize: 12.5 } }))),
  ], { x: MX + 6.85, y: 1.65, w: 5.3, colW: [1.75, 3.55], border: { type: "solid", pt: 0.5, color: "DADFE1" }, margin: [4, 6, 4, 6], valign: "middle" });
  s.addNotes("Gerçek oturum. Yazılanlar: 'cd pro' Tab 'al' Tab — kabuk bunu 'cd projects/alpha/' olarak tamamladı; 'ls ~/lab/docs/sy' Tab, syllabus.txt adını tamamladı (ve bir boşluk ekledi). Tab bir şey yapmıyorsa başlangıç birden çok ada uyuyordur: adayları görmek için Tab'a iki kez basın. !! son komutu yeniden çalıştırır ve önce onu yazar; !5 geçmişteki 5 numaralı girdiyi yeniden çalıştırır. Ctrl+C çalışan sürece SIGINT kesme sinyalini gönderir (13. hafta). İpucu: Ctrl+R geçmişte geriye doğru arar. Sekme tamamlama uzun adlarda yazım hatalarını da önler.");

  // 33 ── Komut başvurusu
  s = d.tableSlide({
    kicker: "Kopya kâğıdı", title: "9. Hafta Komut Başvurusu",
    header: ["Komut", "Amaç", "Komut", "Amaç"],
    colW: [1.85, 4.2, 1.95, 4.15],
    rows: [
      ["whoami", "kullanıcı adınızı yazar", "pwd", "çalışma dizinini yazar"],
      ["hostname", "bilgisayarın adını yazar", "ls [-laRhF] [dizin]", "bir dizini listeler"],
      ["date", "tarih ve saati yazar", "cd [dizin]", "dizin değiştirir (~ . .. - /)"],
      ["echo metin", "metni yazar", "tree [dizin]", "dizin ağacını çizer"],
      ["uname -a", "çekirdek adı, sürümü, makine", "cat dosya", "bir dosyayı yazar (10. hafta)"],
      ["clear", "ekranı temizler (Ctrl+L)", "type komut", "yerleşik mi, program mı?"],
      ["history", "önceki komutları listeler", "komut --help", "kısa yardım"],
      ["!!  !n", "bir komutu tekrarlar", "man · help komut", "kılavuz · yerleşik yardımı"],
    ],
    fontSize: 13, y: 1.7,
  });
  s.addNotes("Bu tablo notlarda da var (daha ayrıntılı). Laboratuvar sırasında açık tutun. cat bugün yalnızca hazine avında küçük dosyaları okumak için tanıtılıyor; cat, less, head ve tail'i 10. hafta düzgünce işleyecek.");

  // 34 ── Lab A: hazine avı
  s = d.content({ kicker: "Derste laboratuvar · 30–40 dakika", title: "Laboratuvar A Bölümü: ~/lab'da Hazine Avı" });
  d.card(s, MX, 1.65, 7.3, 5.2, { title: "İpuçlarını izleyin — yalnızca cd, ls, pwd, cat", body: [
    { b: "Başlangıç:", t: " lab'ı yeniden oluşturun (bash mcmp117_lab_setup.sh), sonra cd ~/lab." },
    { b: "İpucu 1:", t: " README.txt'yi okuyun. \"a small C program\" hangi dizinde? Oraya gidin." },
    { b: "İpucu 2:", t: " dizini listeleyin ve C dosyasını okuyun. Program ne yazar?" },
    { b: "İpucu 3:", t: " TEK bir göreli cd ile kısa metin belgelerinin dizinine geçin. Komutu yazın." },
    { b: "İpucu 4:", t: " oradaki bir dosyanın adında boşluk var. Okuyun: son satırı paroladır." },
    { b: "İpucu 5:", t: " orada gizli bir dosya da var. Hangi düzenleyiciyi ayarlıyor?" },
    { b: "Bitiş:", t: " tek bir göreli cd ile projects/beta/src'ye gidin, pwd çalıştırın." },
  ], bodySize: 13.5 });
  d.card(s, MX + 7.55, 1.65, 4.6, 5.2, { title: "Teslim (kâğıtta ya da Telegram'da)", fill: PALE, body: [
    "Her ipucu için kullandığınız komut.",
    "2., 4. ve 5. ipuçlarının yanıtları.",
    "Son pwd çıktısı.",
    "Boşluklu adlar tırnak ister: cat \"final report.txt\"",
    "Takıldınız mı? ls -a, pwd ve Tab dostunuzdur.",
  ], bodySize: 13.5 });
  s.addNotes("Çözümler (laboratuvar sırasında göstermeyin): İpucu 1: src/ ('a small C program'), cd src. İpucu 2: hello.c 'Hello from the lab!' yazar. İpucu 3: cd ../docs. İpucu 4: cat \"final report.txt\" → son satır 'This file name contains a space.' İpucu 5: ls -a .settings'i gösterir; cat .settings → editor=nano. Bitiş: docs'tan cd ../projects/beta/src → pwd /home/student/lab/projects/beta/src yazar. Bütün çıktılar code/out_lab.txt içinde ve notlardaki Laboratuvar Föyü çözümlerinde. Sınıfta dolaşın; istenen yerlerde göreli yol kullanıldığını kontrol edin.");

  // 35 ── Lab B
  s = d.cardsSlide({
    kicker: "Derste laboratuvar", title: "Laboratuvar B Bölümü: Bak, Say, Açıkla",
    cards: [
      { title: "B1 · Sayın", body: "~/lab'da ls kaç girdi gösteriyor? Kaçı dizin? (ls -F ya da ls -l kullanın.)" },
      { title: "B2 · En büyük dosya", body: "docs içindeki en büyük dosya hangisi, kaç bayt? ls -lS docs ile doğrulayın." },
      { title: "B3 · İnsan boyutları", body: "ls -l logs ve ls -lh logs: access.log'un iki boyutunu yazın ve K'yi açıklayın." },
      { title: "B4 · Tahmin edin", body: "~/lab/projects'ten: cd alpha; cd ../beta/src; cd ..; cd -   Şimdi neredesiniz? Önce tahmin edin, sonra kontrol edin." },
      { title: "B5 · Sistem", body: "ls programı nerede? /bin aslında nedir? Hangi Ubuntu sürümü kurulu?" },
      { title: "B6 · Zorlu soru", body: "ls -ld ~/lab bağlantı sayısı 10, docs ise 2 gösteriyor. İki sayıyı da açıklayın." },
    ], cols: 3, bodySize: 13.5,
    callout: "Laboratuvar Föyünün tamamı (18 puanlı alıştırma, 100 puan) ve çözümleri bu haftanın ders notlarında.",
  });
  s.addNotes("Yanıtlar: B1: 9 girdi, 8 dizin + README.txt. B2: syllabus.txt, 578 bayt. B3: 23.604 bayt = 24K (23604/1024 = 23,05, yukarı yuvarlanır). B4: /home/student/lab/projects/beta/src (cd - onu yazar). B5: type ls → /usr/bin/ls; ls -ld /bin → usr/bin'e sembolik bağlantı; head -n 2 /etc/os-release → makinemizde Ubuntu 24.04.4 LTS. B6: bir dizinin bağlantı sayısı = 2 + alt dizin sayısı: lab'ın 8 alt dizini var → 10; docs'un hiç yok → 2 (code/check_numbers.py ile doğrulandı).");

  // 36 ── Sık hatalar
  s = d.content({ kicker: "Sık yapılan hatalar", title: "Hata Mesajları ve Anlamları" });
  term(s, MX, 1.65, 7.4, 5.2, pick("out_errors.txt", [1, 3, 4, 5, 6, 7, 8, 10, 11]), 10.5);
  d.card(s, MX + 7.65, 1.65, 4.5, 5.2, { body: [
    { b: "command not found:", t: " yazım hatası, yanlış harf büyüklüğü (LS) ya da program kurulu değil." },
    { b: "invalid option:", t: " komut --help'e bakın." },
    { b: "No such file or directory:", t: " ad/harf büyüklüğü yanlış ya da başka bir dizindesiniz — pwd ve ls çalıştırın." },
    { b: "Not a directory:", t: " cd dosyalarla değil, dizinlerle çalışır." },
    { b: "Adda boşluk:", t: " kabuk adı iki argümana böler → tırnak \"…\" ya da kaçış \\ kullanın." },
    { b: "Permission denied:", t: " sizin dizininiz değil (/root) — 11. hafta." },
  ], bodySize: 12.5 });
  s.addNotes("Gerçek hata mesajları (LC_ALL=C.UTF-8 ile İngilizce; Türkçe yerel ayarlı bir sistemde örneğin 'No such file or directory' yerine 'Böyle bir dosya ya da dizin yok' görebilirsiniz). Linux büyük-küçük harfe duyarlıdır: Docs ve docs farklı adlardır. Normal bir Ubuntu'da yanlış yazılmış bir komut (sl) \"Command 'sl' not found, but can be installed with: sudo apt install sl\" gibi bir öneri de yazar — bizim küçük test kabuğumuzda bu yardımcı yok. 'Permission denied' mesajına sudo ile karşılık VERMEYİN: bu, koruma sisteminin tasarlandığı gibi çalışmasıdır (11. hafta). Betikteki \"$'\\r': command not found\" hatası Windows satır sonları demektir — dosyayı yeniden indirin.");

  // 37 ── Kısa sınav
  s = d.quizSlide({ questions: [
    "/home/student/lab/projects/alpha içindesiniz. cd ../beta/src komutundan sonra nerede olursunuz? Ya cd - komutundan sonra?",
    "ls -lh /var/log komutunda hangi kısım komut, hangileri seçenek, hangisi argümandır?",
    "Bir dosya 23.604 bayttır. ls -lh hangi boyutu gösterir ve neden?",
    "cd neden /usr/bin içinde bir program değil de kabuk yerleşiğidir? Hangi 3. hafta fikri bunu açıklar?",
  ] });
  s.addNotes("Yanıtlar. (1) /home/student/lab/projects/beta/src; cd - /home/student/lab/projects/alpha dizinine döner ve onu yazar. (2) Komut ls; seçenekler -l ve -h (-lh olarak birleşik); argüman /var/log. (3) 24K: 23604 / 1024 ≈ 23,05 KiB ve ls -h yukarı yuvarlar. (4) Geçerli dizin her sürece aittir; bir çocuk süreç (bir program) yalnızca kendi dizinini değiştirip sonlanabilir, kabuk değişmeden kalır. Bu yüzden chdir() çağrısını kabuğun kendisi yapmalıdır.");

  // 38 ── Akılda kalanlar
  s = d.content({ kicker: "Kapanış", title: "9. Hafta — Akılda Kalması Gerekenler" });
  d.bullets(s, [
    { b: "Linux'a ulaşmak:", t: " laboratuvar bilgisayarları, WSL (wsl --install) ya da VirtualBox sanal makinesi; ~/lab'ı mcmp117_lab_setup.sh oluşturur." },
    { b: "Terminal ≠ kabuk ≠ çekirdek:", t: " terminal metni gösterir, bash komutları yorumlar, çekirdek işi sistem çağrılarıyla yapar." },
    { b: "Komutlar süreçtir:", t: " bash fork yapar, çocuk /usr/bin/ls'yi exec eder, kabuk bekler (3. hafta); cd gibi yerleşikler bash içinde çalışır." },
    { b: "Anatomi:", t: " komut -seçenekler argümanlar; sözcükleri boşluklar ayırır; harf büyüklüğü önemlidir." },
    { b: "Etrafa bakmak:", t: " pwd, ls -l -a -h -R; ls -l 7. haftadaki düğüm (inode) alanlarını gösterir." },
    { b: "Dolaşmak:", t: " /'den başlayan tek ağaç; mutlak ve göreli yollar; cd ile ~ . .. -" },
    { b: "Akıllı çalışma:", t: " --help, man, help, type; Tab, geçmiş, !!, Ctrl+C, Ctrl+L." },
  ], { fontSize: 18, y: 1.75, h: 5.1, paraSpaceAfter: 14 });
  s.addNotes("Hızlıca okuyun. Ödev: notlardaki Laboratuvar Föyünü bitirin; gelecek hafta dosya sistemini DEĞİŞTİRMEYE başlıyoruz, bu yüzden kendi bilgisayarınızda ~/lab klasörünün bulunduğundan emin olun.");

  // 39–40 ── Kapanış
  d.closing({ nextWeek: "Dosya ve Dizin İşlemleri", nextItems: [
    "mkdir, touch, cp, mv, rm, rmdir — ve rm'nin neden geri dönüşüm kutusu olmadığı",
    "Joker karakterler * ? [ ] ve küme parantezi genişletmesi { } — kabuk genişletir",
    "Dosya görüntüleme: cat, less, head, tail, wc, file, stat, du, df",
    "ln ve ln -s ile sabit ve sembolik bağlantılar (7. haftadaki düğümler)",
    "Lab: photos/ ve docs/ klasörlerini joker karakterlerle düzenlemek, yedek almak",
  ] });
  d.pres.slides[d.n - 2].addNotes("Gelecek hafta yalnızca bakmayı bırakıp bir şeyleri değiştirmeye başlıyoruz: ~/lab içinde dosya ve dizin oluşturmak, kopyalamak, taşımak ve silmek. Çalışan bir terminal getirin (WSL, sanal makine ya da laboratuvar bilgisayarı) — dersin tamamı uygulamalı. Lab klasörü karışırsa kurulum betiğini yeniden çalıştırmanız yeter.");
  d.pres.slides[d.n - 1].addNotes("Özellikle kurulum sorunları için soruları alın. Öğrencilere hafta içindeki WSL/VirtualBox sorularının yerinin Telegram kanalı olduğunu hatırlatın; hata mesajlarının ekran görüntüleri yardımcı olur.");

  await d.save(path.join(__dirname, "MBLP131_Hafta9.pptx"));
  console.log("slides:", d.n);
})();
