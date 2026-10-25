// Hafta 3 sunumu (MBLP131, Türkçe): İşletim Sistemi Hizmetleri, Sistem Çağrıları ve Süreçler
// İngilizce referans: ../week03/build_deck.js (aynı slayt sırası, aynı diyagramlar, aynı sayılar)
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("../lib/deck");
const d = new Deck({ week: 3, lang: "tr", assets: path.join(__dirname, "../lib") });
const code = f => fs.readFileSync(path.join(__dirname, "code", f), "utf8");
// bir kod dosyasının a..b satırları (1'den başlar, b dahil)
const lines = (f, a, b) => code(f).split("\n").slice(a - 1, b).join("\n");
const P = d.pres;
const MINT_L = "D7E9E6";

// durum diyagramında kullanılan küçük durum "balonu" (yuvarlatılmış kutu)
function bubble(s, x, y, w, h, label, fill, color) {
  s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: 0.3, line: { type: "none" } });
  s.addText(label, { x, y, w, h, align: "center", valign: "middle", fontFace: F.title, fontSize: 16, bold: true, color, margin: 0, isTextBox: true });
}
// diyagram üzerinde küçük etiket
function label(s, t, x, y, w, h, o = {}) {
  d.text(s, t, Object.assign({ x, y, w, h, fontSize: 12, bold: true, color: C.mintDeep }, o));
}

(async () => {
  // 1 ── Başlık
  let s = d.titleSlide({
    kicker: "MBLP131  ·  HAFTA 3",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 3  ·  İşletim Sistemi Hizmetleri, Sistem Çağrıları ve Süreçler",
    tagline: "İşletim sistemi bir program için ne yapar ve çalışan bir program tam olarak nedir?",
  });
  s.addNotes("Tekrar hoş geldiniz. Geçen hafta işletim sistemini dışarıdan inşa ettik: tanımlar, hedefler, ikili mod ve yapılar. Bugün önce işletim sisteminin sunduğu arayüze (hizmetler ve sistem çağrıları, ilk saat), sonra da işletim sisteminin yönettiği en önemli şeye, sürece (ikinci saat) bakıyoruz. Her zamanki gibi ortada bir mola var.");

  // 2 ── Geçen hafta
  s = d.cardsSlide({
    kicker: "Geçen hafta", title: "Dört Fikirde 2. Hafta",
    cards: [
      { title: "İki bakış", body: "Genişletilmiş makine (temiz soyutlamalar) ve kaynak yöneticisi (donanımı paylaştırmak)." },
      { title: "İkili mod", body: "İşlemcide bir mod biti: kullanıcı modu kısıtlıdır, çekirdek modunda her şey yapılabilir." },
      { title: "İlk sistem çağrısı", body: "printf() sonunda write(1, …) oldu; strace çekirdeğe giden her isteği gösterdi." },
      { title: "Çağrılar pahalıdır", body: "Test makinemizde bir getpid() sistem çağrısı ≈ 116 ns sürdü; bir fonksiyon çağrısının yaklaşık 76 katı." },
    ], cols: 4, bodySize: 16,
    callout: "Bugün: sistem çağrısı kapısının ardında hangi hizmetler var, bir çağrı çekirdeğe gerçekte nasıl gider ve \"süreç\" nedir?",
  });
  s.addNotes("Yalnızca iki dakikalık bir tekrar. Sorun: strace printf için ne gösterdi, kim hatırlıyor? (bir write sistem çağrısı). Sorun: bir program diske neden kendisi doğrudan erişemez? (ikili mod: ayrıcalıklı komutlar tuzağa düşer). Bugün doğrudan bu iki olgunun üzerine inşa ediyoruz.");

  // 3 ── Gündem
  s = d.content({ kicker: "Hafta 3", title: "Bugünün Gündemi" });
  const agenda = [
    ["1", "Hizmetler", "İşletim sisteminin kullanıcılara, programlara ve kendisine sundukları."],
    ["2", "Sistem çağrıları", "API ve sistem çağrısı, sistem çağrısı tablosu, tuzak, parametre aktarımı."],
    ["3", "Süreçler", "Program ve süreç, bellek düzeni, beş durum, süreç denetim bloğu (PCB)."],
    ["4", "Bağlam değişimi", "Ne kaydedilir, neden saf ek yüktür ve maliyeti ne kadardır?"],
    ["5", "Uygulama", "C programları: çıplak sistem çağrısı, bellek haritası, fork / exec / wait, fork ağaçları."],
  ];
  agenda.forEach((a, i) => {
    const y = 1.7 + i * 1.0;
    d.box(s, MX, y, 0.8, 0.8, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 1.0, y, w: 11.15, h: 0.8, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "   ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.3, y, w: 10.7, h: 0.8, valign: "middle" });
  });
  s.addNotes("1. ve 2. bölümler moladan önce, 3.–5. bölümler moladan sonra. C programları birer gösterimdir; öğrencilerden C yazmaları beklenmez, yalnızca açıklamaları okuyup ne olduğunu anlamaları beklenir.");

  // ───────────────────────── BÖLÜM 1: HİZMETLER
  s = d.sectionSlide({ kicker: "Bölüm 1", title: "İşletim Sistemi Hizmetleri", subtitle: "İşletim sisteminin size, programlarınıza ve kendisine sağladıkları." });
  s.addNotes("Geçiş: bir işletim sistemi büyük ölçüde sunduğu hizmetlerle tanımlanır. Bu hizmetleri iki gruba ayırıyoruz.");

  s = d.content({ kicker: "Hizmetler", title: "İşletim Sistemi Hizmetlerine Genel Bakış" });
  {
    const x = MX, w = 7.7;
    d.box(s, x, 1.65, w, 0.5, "Kullanıcı ve diğer sistem programları", { fill: C.light, size: 13 });
    ["Grafik arayüz", "Dokunmatik ekran", "Komut satırı"].forEach((t, i) => d.box(s, x + i * 2.6, 2.3, 2.5, 0.5, t, { fill: MINT_L, size: 12 }));
    d.text(s, "kullanıcı arayüzleri", { x: x + 5.25, y: 2.82, w: 2.45, h: 0.25, fontSize: 10, italic: true, color: C.mutedOnLight, align: "right" });
    d.box(s, x, 3.12, w, 0.45, "Sistem çağrıları", { fill: C.slate, size: 13 });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y: 3.72, w, h: 2.45, fill: { color: C.charcoal }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, "İŞLETİM SİSTEMİ", { x: x + 0.2, y: 3.8, w: 4, h: 0.3, fontSize: 11, bold: true, color: C.mint });
    const top = ["Program yürütme", "G/Ç işlemleri", "Dosya sistemleri", "İletişim", "Hata algılama"];
    const bw = (w - 0.4 - 4 * 0.12) / 5;
    top.forEach((t, i) => d.box(s, x + 0.2 + i * (bw + 0.12), 4.15, bw, 0.8, t, { fill: C.mint, color: C.dark, size: 12 }));
    const bot = ["Kaynak tahsisi", "Hesap tutma", "Koruma ve güvenlik"];
    const bw2 = (w - 0.4 - 2 * 0.12) / 3;
    bot.forEach((t, i) => d.box(s, x + 0.2 + i * (bw2 + 0.12), 5.1, bw2, 0.8, t, { fill: C.slate, size: 12 }));
    d.box(s, x, 6.3, w, 0.5, "Donanım", { fill: C.dark, size: 13 });
  }
  d.card(s, MX + 8.0, 1.65, 4.15, 5.15, { title: "İki grup", body: [
    { b: "Nane yeşili sıra:", t: " kullanıcının ve programlarının işini görmesine yardım eden hizmetler." },
    { b: "Gri sıra:", t: " birçok kullanıcı ve program sistemi paylaşırken sistemin kendisini verimli ve güvenli tutan hizmetler." },
    "Programlar her hizmete aynı kapıdan ulaşır: sistem çağrıları.",
  ], bodySize: 14 });
  s.addNotes("Şekli yukarıdan aşağıya okuyun: insanlar ve programlar bir arayüz kullanır; her istek sistem çağrısı katmanından geçer; onun arkasında işletim sistemi, donanımın üzerinde hizmetlerini sunar. Bu, Silberschatz'ın 2. bölümündeki klasik şekildir. G/Ç: giriş/çıkış (I/O).");

  s = d.cardsSlide({
    kicker: "Hizmetler", title: "Kullanıcıya Yardım Eden Hizmetler",
    cards: [
      { title: "Kullanıcı arayüzü", body: "Komut satırı (bash, PowerShell), grafik masaüstü, dokunmatik ekran ya da komutlardan oluşan bir toplu iş dosyası." },
      { title: "Program yürütme", body: "Bir programı belleğe yüklemek, çalıştırmak ve sonlandırmak: normal biçimde ya da bir hata koduyla." },
      { title: "G/Ç işlemleri (I/O)", body: "Programlar aygıtları asla doğrudan sürmez; G/Ç'yi onlar adına işletim sistemi yapar (2. hafta: ikili mod)." },
      { title: "Dosya sistemi işlemleri", body: "Dosya ve dizin oluşturmak, silmek, okumak, yazmak, aramak; izinleri yönetmek." },
      { title: "İletişim", body: "Süreçler arasında veri alışverişi: aynı bilgisayarda (boru, paylaşımlı bellek) ya da ağ üzerinden (soket)." },
      { title: "Hata algılama", body: "Hataları fark edip ele almak: bir disk okuması başarısız olur, yazıcının kâğıdı biter, bir program sıfıra böler." },
    ], cols: 3, bodySize: 14,
  });
  s.addNotes("Her kart için öğrencilerin kendi deneyiminden somut bir örnek verin: çöken bir telefon uygulaması, hata algılama artı programın sonlandırılmasıdır; WhatsApp'ta mesaj göndermek soketler üzerinden iletişimdir; bir dosyayı kaydetmek dosya sistemi işlemidir.");

  s = d.content({ kicker: "Hizmetler", title: "Sistemin İyi Çalışmasını Sağlayan Hizmetler", lead: "Tek bir makinede çok sayıda kullanıcı ve program varken işletim sisteminin kendisi için de hizmetlere ihtiyacı vardır." });
  [
    ["Kaynak tahsisi", "İşlemciyi kim alacak, ne kadar bellek, hangi yazıcı? Bunu zamanlayıcılar ve ayırıcılar yapar (4–7. haftalar).", "Linux: ulimit -a süreç başına sınırları gösterir."],
    ["Hesap tutma ve günlük", "Kimin ne kadar işlemci zamanı, bellek ve disk kullandığını izlemek: faturalama, istatistik ve ayar için.", "Linux: ps, top, journalctl; Windows: Olay Görüntüleyicisi."],
    ["Koruma ve güvenlik", "Koruma: süreçler birbirinin belleğine dokunamaz. Güvenlik: kullanıcılar kimlik doğrular; saldırılar kaydedilir.", "Linux: dosya izinleri (11. hafta), parolalar."],
  ].forEach((c, i) => {
    const x = MX + i * 4.13;
    d.card(s, x, 2.3, 3.9, 3.35, { title: c[0], body: c[1], bodySize: 14.5 });
    d.text(s, c[2], { x: x + 0.25, y: 4.95, w: 3.4, h: 0.55, fontSize: 12, italic: true, color: C.mutedOnLight });
  });
  d.callout(s, MX, 5.9, 12.15, 0.95, "Zincir en zayıf halkası kadar güçlüdür: tahmin edilen tek bir parola, geçen hafta gördüğümüz bütün koruma donanımını boşa çıkarır.", 15);
  s.addNotes("Koruma (protection) içe dönüktür: süreçlerin kaynaklara erişimini denetler. Güvenlik (security) ise dışarıdan ve içeriden gelen saldırılara karşı savunmadır. İkisi de 2. haftadaki ikili mod donanımına dayanır.");

  s = d.content({ kicker: "Kullanıcı arayüzleri", title: "Komut Satırı ve Grafik Arayüz" });
  d.code(s, MX, 1.65, 6.3, 3.6,
`# bir komut satırı oturumu (Linux'ta bash)
$ ls -l report.txt      # dosya sistemi hizmeti
$ cp report.txt backup/ # dosya sistemi hizmeti
$ ./myprog &            # program yürütme
$ ps                    # durum bilgisi
$ kill 4242             # süreç denetimi

# her komut, kabuğun sizin için başlattığı
# ayrı bir programdır (3. bölüm: fork/exec)`, 13);
  d.callout(s, MX, 5.45, 6.3, 1.4, "Kabuk (shell) çekirdeğin parçası değildir: bir komut okuyup işletim sisteminden onu çalıştırmasını isteyen sıradan bir programdır.", 14);
  d.card(s, MX + 6.6, 1.65, 5.55, 5.2, { title: "Hangisi daha iyi?", body: [
    { b: "Komut satırı (CLI):", t: " uzmanlar için hızlı, betiklenebilir, yavaş bir ağ bağlantısında da çalışır; komutları hatırlamak gerekir." },
    { b: "Grafik arayüz (GUI):", t: " pencereler, simgeler, fare; öğrenmesi kolay, otomatikleştirmesi zor." },
    { b: "Dokunmatik ekran:", t: " fare yerine hareketler; telefonlar ve tabletler." },
    "Sistem yöneticilerinin çoğu ikisini de kullanır. 9. haftadan itibaren Linux kabuğunda çalışacağız.",
  ], bodySize: 14 });
  s.addNotes("Kabuk örnekleri: Linux ve macOS'ta bash ve zsh, Windows'ta cmd.exe ve PowerShell. Vurgulanacak nokta: kabuk bir sistem programıdır ve diğer her program gibi tam olarak aynı sistem çağrılarını kullanır. 9. hafta uygulamalı Linux bölümünü başlatır.");

  // ───────────────────────── BÖLÜM 2: SİSTEM ÇAĞRILARI
  s = d.sectionSlide({ kicker: "Bölüm 2", title: "Ayrıntılı Sistem Çağrıları", subtitle: "Bir kullanıcı programından çekirdeğe açılan tek kapı." });
  s.addNotes("Geçen hafta sistem çağrılarının var olduğunu ve pahalı olduklarını gördük. Şimdi: bir çağrı C kodunuzdan çekirdeğe tam olarak nasıl gider ve nasıl geri döner?");

  s = d.content({ kicker: "Sistem çağrıları", title: "API, Kütüphane Sarmalayıcısı ve Sistem Çağrısı", lead: "Programcılar neredeyse hiçbir zaman sistem çağrısını doğrudan yürütmez. printf() ile donanım arasında katmanlar vardır." });
  {
    const x = MX, w = 6.6, h = 0.72, g = 0.18;
    const rows = [
      ["Sizin programınız", "printf(\"x = %d\\n\", x);", C.light],
      ["C kütüphanesi (API fonksiyonu)", "printf metni bir tampona biçimlendirir", MINT_L],
      ["C kütüphanesi (sarmalayıcı)", "write(1, buf, n): numara → rax, argümanlar → yazmaçlar", MINT_L],
      ["Sistem çağrısı işleyicisi", "sistem çağrısı tablosunda 1 numaralı girişe bakar", C.charcoal],
      ["Çekirdek fonksiyonu", "sys_write() → terminal sürücüsü → ekran", C.charcoal],
    ];
    rows.forEach((r, i) => {
      const y = 2.3 + i * (h + g) + (i >= 3 ? 0.2 : 0);
      d.box(s, x, y, w, h, r[0], { sub: r[1], fill: r[2], size: 13, subSize: 12 });
      if (i < rows.length - 1) d.arrow(s, x + 0.5, y + h + 0.01, x + 0.5, y + h + g - 0.01 + (i === 2 ? 0.2 : 0), { w: 1.5 });
    });
    const ly = 2.3 + 3 * (h + g) + 0.04;
    s.addShape(P.shapes.LINE, { x, y: ly, w, h: 0, line: { color: C.red, width: 1.25, dashType: "dash" } });
    d.text(s, "syscall komutu: kullanıcı modu → çekirdek modu", { x: x + 1.0, y: ly - 0.24, w: 5.5, h: 0.22, fontSize: 11, italic: true, color: C.red, bold: true, align: "right" });
  }
  d.card(s, MX + 6.9, 2.3, 5.25, 4.55, { title: "Üç sözcük, üç anlam", body: [
    { b: "API", t: " (uygulama programlama arayüzü): programcının çağırdığı belgelenmiş fonksiyonlar; ör. POSIX ya da Windows API." },
    { b: "Sarmalayıcı (wrapper):", t: " sistem çağrısıyla aynı adı taşıyan minik kütüphane fonksiyonu; yalnızca yazmaçları doldurur ve tuzak kurar." },
    { b: "Sistem çağrısı:", t: " çekirdeğe asıl giriş." },
    "Her API fonksiyonu sistem çağrısı yapmaz: strlen() ve sqrt() hiç yapmaz; printf() yalnızca tamponu boşaltılınca yapar.",
  ], bodySize: 13 });
  s.addNotes("Yığını yukarıdan aşağıya izleyin. Kırmızı kesikli çizgi 2. haftadaki kullanıcı/çekirdek sınırıdır. Üstündeki her şey süreç içinde kullanıcı modunda, altındaki her şey çekirdek modunda çalışır. printf'in tamponladığını vurgulayın: on printf çağrısı tek bir write üretebilir.");

  s = d.cardsSlide({
    kicker: "Sistem çağrıları", title: "Neden Bir API'ye Göre Programlanır?",
    lead: "Yaygın üç API — her biri kendi platformunun gerçek sistem çağrılarını gizler.",
    cards: [
      { title: "POSIX API", body: ["Linux, macOS, BSD'ler.", "C kütüphanesi sağlar (glibc, musl, …).", "write(), fork(), open()…"] },
      { title: "Windows API", body: ["Windows.", "CreateProcess(), ReadFile()…", "İçeride ntdll.dll'i çağırır; asıl çekirdek çağrılarını o yapar (NtCreateUserProcess…)."] },
      { title: "Java API", body: ["Java Sanal Makinesi olan her işletim sistemi.", "Files.readAllBytes(), ProcessBuilder…", "JVM bunları ana işletim sisteminin sistem çağrılarına çevirir."] },
    ],
    callout: "Taşınabilirlik: write, 64 bit x86 Linux'ta 1, 32 bit x86 Linux'ta 4, ARM64 Linux'ta 64 numaralı sistem çağrısıdır. API adı write() ise her yerde aynıdır.",
  });
  s.addNotes("Ana argüman: sistem çağrısı numaraları ve ayrıntıları işletim sistemleri arasında, hatta aynı işletim sisteminin farklı işlemci mimarileri arasında bile değişir. API sabittir; kütüphane uyum sağlar. Numaralar Linux çekirdek başlık dosyalarından kontrol edildi (unistd_64.h, unistd_32.h, asm-generic/unistd.h).");

  s = d.content({ kicker: "Sistem çağrıları", title: "Her Sistem Çağrısının Bir Numarası Vardır", lead: "Çekirdek bir tablo tutar: sistem çağrısı numarası → işi yapan çekirdek fonksiyonunun adresi." });
  {
    const x = MX, y = 2.35;
    d.box(s, x, y + 1.55, 1.7, 0.8, "rax = 1", { fill: C.mint, color: C.dark, size: 16, font: F.code });
    d.text(s, "numarayı write() sarmalayıcısı koyar", { x, y: y + 2.42, w: 1.9, h: 0.6, fontSize: 11, italic: true, color: C.mutedOnLight });
    const tbl = [["0", "sys_read"], ["1", "sys_write"], ["2", "sys_open"], ["3", "sys_close"], ["…", "…"], ["39", "sys_getpid"], ["57", "sys_fork"], ["59", "sys_execve"], ["60", "sys_exit"], ["61", "sys_wait4"]];
    const tx = x + 2.4, rh = 0.42;
    tbl.forEach((r, i) => {
      const hl = i === 1;
      d.box(s, tx, y + i * rh, 0.7, rh - 0.04, r[0], { fill: hl ? C.mint : C.light, color: C.dark, size: 12, font: F.code });
      d.box(s, tx + 0.75, y + i * rh, 1.9, rh - 0.04, r[1], { fill: hl ? C.mint : C.light, color: C.dark, size: 12, font: F.code, bold: hl });
    });
    d.text(s, "sistem çağrısı tablosu (x86-64 Linux)", { x: tx, y: y + 10 * rh + 0.02, w: 3.2, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight });
    d.arrow(s, x + 1.72, y + 1.95, tx - 0.03, y + rh * 1.5, { color: C.mintDeep, w: 2 });
    d.box(s, tx + 3.15, y + 0.15, 1.75, 1.0, "sys_write()", { sub: "çekirdek kodu", fill: C.charcoal, size: 13, font: F.code });
    d.arrow(s, tx + 2.67, y + rh * 1.5, tx + 3.13, y + 0.65, { color: C.mintDeep, w: 2 });
  }
  d.card(s, MX + 7.55, 2.35, 4.6, 4.5, { title: "Neden bir tablo?", body: [
    "Kullanıcı programı çekirdeğe yalnızca tek bir sabit giriş noktasından girebilir; asla rastgele bir çekirdek adresine atlayamaz.",
    "Numara hizmeti seçer; çekirdek geçerli olup olmadığını denetler, sonra tablodaki fonksiyonu çağırır.",
    "x86-64 üzerinde Linux 6.8'de 0'dan 461'e numaralanmış yaklaşık 370 sistem çağrısı vardır.",
  ], bodySize: 14 });
  s.addNotes("Tablo, çekirdeğin içindeki bir fonksiyon işaretçisi dizisidir (sys_call_table). Geçersiz numaralar ENOSYS hatasını döndürür. Gösterilen numaralar unistd_64.h dosyasındaki gerçek x86-64 Linux numaralarıdır. 2. haftadaki kesme vektörüyle karşılaştırın: ikisi de bir numarayla indekslenen işleyici adresleri tablosudur.");

  s = d.content({ kicker: "Sistem çağrıları", title: "Bir write(): Çekirdeğe Yolculuk, Adım Adım" });
  {
    const steps = [
      ["1. Yazmaçları doldur", "Sarmalayıcı çağrı numarasını (1) rax'e, üç parametreyi rdi, rsi, rdx'e koyar."],
      ["2. Tuzak", "syscall komutu mod bitini çekirdeğe çevirir ve çekirdeğin tek giriş noktasına atlar."],
      ["3. Kaydet ve denetle", "Çekirdek kullanıcı yazmaçlarını kaydeder ve 1 numarasının geçerli bir giriş olduğunu denetler."],
      ["6. Dönüş", "sysret yazmaçları geri yükler, kullanıcı moduna geçer; sarmalayıcı programa 26 döndürür."],
      ["5. Sonuç", "Dönüş değeri (yazılan bayt sayısı ya da negatif bir hata kodu) rax'e konur."],
      ["4. Yönlendirme", "Çekirdek tablo üzerinden sys_write()'ı çağırır; o da tampon adresini denetleyip sürücüyle konuşur."],
    ];
    const w = 3.85, h = 2.0, gx = 0.3, y1 = 1.7, y2 = 4.25;
    steps.forEach((st, i) => {
      const row = i < 3 ? 0 : 1, col = i % 3;
      const x = MX + col * (w + gx), y = row ? y2 : y1;
      const kern = st[0][0] >= "2" && st[0][0] <= "5";
      d.card(s, x, y, w, h, { title: st[0], body: st[1], bodySize: 14, fill: kern ? C.charcoal : C.light });
    });
    d.arrow(s, MX + w + 0.02, y1 + h / 2, MX + w + gx - 0.02, y1 + h / 2, { w: 2 });
    d.arrow(s, MX + 2 * w + gx + 0.02, y1 + h / 2, MX + 2 * (w + gx) - 0.02, y1 + h / 2, { w: 2 });
    d.arrow(s, MX + 2 * (w + gx) + w / 2, y1 + h + 0.02, MX + 2 * (w + gx) + w / 2, y2 - 0.02, { w: 2 });
    d.arrow(s, MX + 2 * (w + gx) - 0.02, y2 + h / 2, MX + 2 * w + gx + 0.02, y2 + h / 2, { w: 2 });
    d.arrow(s, MX + w + gx - 0.02, y2 + h / 2, MX + w + 0.02, y2 + h / 2, { w: 2 });
    d.text(s, "açık = kullanıcı modu    koyu = çekirdek modu", { x: MX, y: 6.4, w: 6, h: 0.35, fontSize: 12, italic: true, color: C.mutedOnLight });
  }
  s.addNotes("Yılanı izleyin: üst sıra soldan sağa, sonra aşağı, sonra alt sıra sağdan sola. 2.–5. adımlar çekirdek modunda (koyu) çalışır. 4. adımda çekirdeğin tampon adresini denetlediği belirtiliyor: bir program, çekirdeği kendi adına çekirdek belleğini okumaya kandıramamalıdır. -4095 ile -1 arasındaki negatif dönüş değerleri hata demektir; sarmalayıcı hata kodunu errno'ya yazar ve -1 döndürür.");

  s = d.content({ kicker: "Parametreler", title: "İşletim Sistemine Parametre Aktarmanın Üç Yolu" });
  {
    const cw = 3.9, gx = 0.225, y = 1.65, h = 4.15;
    const xs = [0, 1, 2].map(i => MX + i * (cw + gx));
    const titles = ["1. Yazmaçlarda", "2. Bir bellek bloğunda", "3. Yığıtta"];
    xs.forEach((x, i) => {
      s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h, fill: { color: C.light }, rectRadius: 0.06, line: { type: "none" } });
      d.text(s, titles[i], { x: x + 0.25, y: y + 0.15, w: cw - 0.5, h: 0.4, fontFace: F.title, fontSize: 16, bold: true, color: C.mintDeep });
    });
    // 1: yazmaçlar
    let x = xs[0] + 0.3;
    [["rdi", "1"], ["rsi", "msg"], ["rdx", "26"]].forEach((r, i) => {
      d.box(s, x, y + 0.75 + i * 0.6, 0.8, 0.5, r[0], { fill: C.slate, size: 12, font: F.code });
      d.box(s, x + 0.9, y + 0.75 + i * 0.6, 1.0, 0.5, r[1], { fill: C.white, size: 12, font: F.code });
    });
    d.box(s, x + 2.3, y + 1.05, 1.0, 1.1, "çekirdek", { fill: C.charcoal, size: 12 });
    d.arrow(s, x + 1.93, y + 1.6, x + 2.28, y + 1.6, { w: 1.75 });
    d.text(s, "En hızlısı. Yazmaç sayısıyla sınırlıdır (x86-64 Linux'ta 6).", { x: xs[0] + 0.25, y: y + 2.75, w: cw - 0.5, h: 1.2, fontSize: 13.5, color: "3A464C" });
    // 2: blok
    x = xs[1] + 0.3;
    d.box(s, x, y + 0.85, 0.8, 0.5, "rdi", { fill: C.slate, size: 12, font: F.code });
    d.box(s, x + 0.9, y + 0.85, 1.0, 0.5, "adres X", { fill: C.white, size: 12, font: F.code });
    ["param 1", "param 2", "…", "param n"].forEach((p, i) => d.box(s, x + 2.2, y + 0.65 + i * 0.42, 1.1, 0.38, p, { fill: MINT_L, size: 11, bold: false }));
    d.text(s, "X'teki blok", { x: x + 2.2, y: y + 2.33, w: 1.1, h: 0.25, fontSize: 10, italic: true, color: C.mutedOnLight, align: "center" });
    d.arrow(s, x + 1.93, y + 1.1, x + 2.18, y + 0.84, { w: 1.75 });
    d.text(s, "İstenen sayıda parametre; yazmaçta yalnızca adres taşınır. Örnek: clone3() bir yapıya işaretçi alır.", { x: xs[1] + 0.25, y: y + 2.75, w: cw - 0.5, h: 1.3, fontSize: 13.5, color: "3A464C" });
    // 3: yığıt
    x = xs[2] + 0.3;
    ["param 3", "param 2", "param 1"].forEach((p, i) => d.box(s, x + 0.2, y + 0.75 + i * 0.45, 1.3, 0.4, p, { fill: MINT_L, size: 11, bold: false }));
    d.text(s, "program iter (push)", { x: x - 0.2, y: y + 2.15, w: 2.1, h: 0.25, fontSize: 10, italic: true, color: C.mutedOnLight, align: "center" });
    d.box(s, x + 2.3, y + 0.95, 1.0, 1.1, "çekirdek", { fill: C.charcoal, size: 12 });
    d.arrow(s, x + 1.55, y + 1.5, x + 2.28, y + 1.5, { w: 1.75 });
    d.text(s, "çeker (pop)", { x: x + 1.45, y: y + 1.58, w: 0.9, h: 0.25, fontSize: 10, italic: true, color: C.mutedOnLight, align: "center" });
    d.text(s, "Esnek, ama çekirdek kullanıcı belleğinden kopyalamalıdır. Örnek: x86 üzerinde 32 bit FreeBSD.", { x: xs[2] + 0.25, y: y + 2.75, w: cw - 0.5, h: 1.3, fontSize: 13.5, color: "3A464C" });
  }
  d.callout(s, MX, 6.0, 12.15, 0.85, "Linux 1. ve 2. yolu birleştirir: altı parametreye kadar yazmaçlarda; daha büyük veri (bir tampon, bir yapı) bir yazmaçta adres olarak aktarılır.", 14);
  s.addNotes("2. ve 3. yöntemlerin gizli bir maliyeti vardır: çekirdek parametreleri kullanıcı belleğinden kopyalamalı ve adreslerin gerçekten çağıran sürece ait olduğunu denetlemelidir. 1. yöntemde bile tamponun kendisi (26 bayt) kullanıcı belleğinde kalır; yazmaçta yalnızca adresi taşınır.");

  s = d.tableSlide({
    kicker: "Parametreler", title: "Somut Örnek: x86-64 Linux Yazmaç Kuralı",
    header: ["Yazmaç", "Sistem çağrısındaki rolü", "write(1, msg, 26) için"],
    colW: [1.9, 5.6, 4.65],
    rows: [
      ["rax", "sistem çağrısı numarası (giriş) · dönüş değeri (çıkış)", "1  →  26 (yazılan bayt)"],
      ["rdi", "1. parametre", "1  (dosya tanımlayıcısı: standart çıktı)"],
      ["rsi", "2. parametre", "msg'nin adresi"],
      ["rdx", "3. parametre", "26  (bayt sayısı)"],
      ["r10, r8, r9", "4., 5., 6. parametre", "— (write kullanmaz)"],
      ["rcx, r11", "syscall komutu bunların üzerine yazar", "işlemci dönüş adresini ve bayrakları buraya kaydeder"],
    ],
    fontSize: 15,
    callout: "−4095 ile −1 arasındaki bir dönüş değeri hata demektir: sarmalayıcı hata numarasını errno'ya yazar ve programınıza −1 döndürür.",
  });
  s.addNotes("Meraklısı için ayrıntı: sıradan C fonksiyon çağrıları 4. argüman için rcx'i kullanır; ama syscall komutu rcx'in (dönüş adresi) ve r11'in (bayraklar) üzerine yazdığı için çekirdek kuralı onun yerine r10'u kullanır. Bu, Linux x86-64 ABI'sinden gelir. Öğrencilerin yazmaçları ezberlemesi gerekmez; önemli olan parametrelerin yazmaçlarda taşındığıdır.");

  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 1: Aynı Mesaj, Üç Düzey Derinlikte",
    code: lines("raw_write.c", 10, 34), size: 10.5, codeW: 7.0, sideTitle: "Neye dikkat edin?",
    side: [
      "3. düzey, write() sarmalayıcısının yaptığını elle yapar: numara rax'e, parametreler rdi, rsi, rdx'e, sonra syscall.",
      "strace üç düzeyi birbirinden ayıramaz: çekirdek için hepsi aynıdır.",
    ],
    run: { h: 2.3, size: 9, text:
`$ strace ./raw_write
write(1, "1) printf  -> libc -> write\\n", 28) = 28
write(1, "2) write() -> libc wrapper\\n", 27) = 27
write(1, "3) syscall instruction!!!\\n", 26) = 26
write(1, "kernel returned 26 (bytes writte"..., 35) = 35
exit_group(0)                    = ?` },
  });
  s.addNotes("Test makinemizden gerçek çıktı. Satır içi assembly yalnızca gösterim içindir; pratikte kimse sistem çağrılarını böyle yazmaz. Son satır, bir sayı içeren printf'in de tek bir write'a dönüştüğünü gösterir. Yalnızca x86-64 Linux: ARM'da komut svc'dir ve yazmaçlar farklıdır.");

  s = d.tableSlide({
    kicker: "Türler", title: "Sistem Çağrılarının Altı Kategorisi",
    header: ["Kategori", "Tipik istekler", "Linux (POSIX)", "Windows API"],
    colW: [2.35, 3.05, 3.1, 3.65],
    rows: [
      ["Süreç denetimi", "oluştur, sonlandır, yükle, bekle", "fork(), execve(), exit(), wait4()", "CreateProcess(), ExitProcess(), WaitForSingleObject()"],
      ["Dosya yönetimi", "oluştur, aç, oku, yaz, kapat", "open(), read(), write(), close()", "CreateFile(), ReadFile(), WriteFile(), CloseHandle()"],
      ["Aygıt yönetimi", "iste, oku, yaz, yapılandır", "ioctl(), read(), write()", "SetConsoleMode(), ReadConsole(), WriteConsole()"],
      ["Bilgi bakımı", "saat, tarih, kimlikler, sistem verisi", "getpid(), uname(), clock_gettime()", "GetCurrentProcessId(), GetSystemTime()"],
      ["İletişim", "boru, paylaşımlı bellek, ağ", "pipe(), mmap(), socket()", "CreatePipe(), MapViewOfFile()"],
      ["Koruma", "izinler, sahiplik", "chmod(), chown(), umask()", "SetFileSecurity(), SetSecurityDescriptorGroup()"],
    ],
    fontSize: 12.5,
  });
  s.addNotes("Windows sütunu Windows API fonksiyonlarını listeler; her biri altta ntdll.dll'deki bir ya da daha fazla yerel Nt... sistem çağrısını çağırır. read() ve write() iki kez görünüyor: UNIX'te bir aygıt dosya gibi görünür, bu yüzden aynı çağrılar iki kategoriye de hizmet eder.");

  s = d.content({ kicker: "Çözümlü örnek", title: "Bir Dosyayı Kopyalamak Kaç Sistem Çağrısı Gerektirir?" });
  d.card(s, MX, 1.65, 5.9, 5.2, { title: "Klasik sıra", body: [
    "İki dosya adını iste (G/Ç).",
    "Girdi dosyasını aç; hata varsa bir mesaj yazdır ve çık (dosya yönetimi, süreç denetimi).",
    "Çıktı dosyasını oluştur.",
    "Döngü: bir blok oku, bir blok yaz; read() 0 döndürene kadar (dosya sonu).",
    "İki dosyayı da kapat, başarıyı bildir, çık.",
    "Her adım bir ya da daha fazla sistem çağrısıdır; programın kendisini yüklemek de öyle.",
  ], bodySize: 14.5 });
  d.code(s, MX + 6.2, 1.65, 5.95, 3.55,
`$ strace -c cp in.bin out.bin   # in.bin = 1 MiB
 calls  syscall            (kısaltıldı)
    26  mmap
    13  close
    11  openat
    10  fstat
     9  read
     2  copy_file_range
   102  total`, 12.5);
  d.callout(s, MX + 6.2, 5.4, 5.95, 1.45, "102 çağrının yalnızca 2'si veriyi taşır: modern cp, kopyalamayı çekirdeğin içinde yapmasını ister. Çağrıların çoğu programı ve kütüphanelerini yükler.", 13.5);
  s.addNotes("Test makinemizde GNU coreutils cp 9.4 ile gerçek ölçüm; çıktı yeniden biçimlendirildi ve en büyük sayılar ile copy_file_range dışındakiler kısaltıldı. Ders kitabındaki read/write döngüsü, daha eski bir cp'nin ya da sizin yazacağınız bir kopyalama programının yapacağı şeydir. copy_file_range, veriyi kullanıcı belleğinden geçirmeden kopyalayan daha yeni bir Linux sistem çağrısıdır.");

  s = d.cardsSlide({
    kicker: "Sistem programları", title: "Sistem Programları: Çoğu Kullanıcının Gördüğü İşletim Sistemi",
    lead: "İşletim sistemiyle birlikte gelen ve sizin adınıza sistem çağrısı yapan programlar. Kullanıcı modunda çalışırlar.",
    cards: [
      { title: "Dosya yönetimi", body: "ls, cp, mv, rm, mkdir; Dosya Gezgini, Finder." },
      { title: "Durum bilgisi", body: "date, df, free, ps, top; Görev Yöneticisi; sistem günlükleri." },
      { title: "Dosya düzenleme", body: "Metin düzenleyiciler (nano, vim, Not Defteri); arama araçları (grep, find)." },
      { title: "Programlama desteği", body: "Derleyiciler, çeviriciler, hata ayıklayıcılar, yorumlayıcılar: gcc, gdb, python." },
      { title: "Yükleme ve yürütme", body: "Programları ve kütüphaneleri belleğe yerleştiren yükleyiciler ve bağlayıcılar." },
      { title: "Arka plan hizmetleri", body: "Daemon'lar / hizmetler: sshd, cron, yazdırma kuyruğu. Açılışta başlar." },
    ], cols: 3, bodySize: 14,
  });
  s.addNotes("2. haftayı hatırlayın: çekirdek, sistem programları ve uygulamalar. Çoğu kullanıcı hiçbir zaman bir sistem çağrısı görmez; bu programları görür. Arka plan hizmetlerine UNIX'te daemon, Windows'ta service denir. Bunların çoğunu 9–14. haftalarda uygulamalı olarak kullanacağız.");

  // ── Mola
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Mola", subtitle: "Sırada: süreç — işletim sisteminin yönettiği iş birimi." });
  s.addNotes("On dakika. Molada düşünmek için isteğe bağlı bir soru: iki terminal penceresi açtığınızda bash'in kaç kopyası çalışır?");

  // ───────────────────────── BÖLÜM 3: SÜREÇLER
  s = d.sectionSlide({ kicker: "Bölüm 3", title: "Süreç Kavramı", subtitle: "Yürütülmekte olan bir program." });
  s.addNotes("Bundan sonra ara sınava kadar neredeyse her şey süreçlerle ilgili: nasıl temsil edildikleri, nasıl zamanlandıkları, nasıl eşzamanlandıkları ve onlara nasıl bellek verildiği.");

  s = d.content({ kicker: "Süreçler", title: "Program ve Süreç" });
  {
    const x = MX, y = 1.75;
    d.box(s, x, y + 1.3, 2.4, 1.3, "/usr/bin/bash", { sub: "program: diskteki bir dosya", fill: C.light, size: 14, font: F.code });
    ["PID 2210", "PID 2457"].forEach((p, i) => {
      const py = y + 0.2 + i * 2.3;
      d.box(s, x + 3.6, py, 2.9, 1.25, "bash   " + p, { sub: "süreç: bellekte, çalışıyor", fill: i ? C.mint : C.charcoal, color: i ? C.dark : C.white, size: 14 });
      d.arrow(s, x + 2.42, y + 1.95, x + 3.58, py + 0.62, { w: 1.75 });
    });
    d.text(s, "yükle ve çalıştır", { x, y: y + 0.95, w: 2.4, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "center" });
    d.text(s, "bir program, iki süreç (iki terminal penceresi)", { x, y: y + 3.75, w: 6.5, h: 0.35, fontSize: 12, italic: true, color: C.mutedOnLight });
  }
  d.card(s, MX + 6.9, 1.65, 5.25, 3.7, { title: "Tanımlar", body: [
    { b: "Program:", t: " edilgen; çalıştırılabilir bir dosyada saklanan komutlar." },
    { b: "Süreç (process):", t: " etkin; yürütülmekte olan program: kodu artı o anki etkinliği (program sayacı, yazmaçlar), belleği ve açık dosyaları." },
    "Program belleğe yüklendiğinde sürece dönüşür.",
  ], bodySize: 14 });
  d.callout(s, MX, 5.9, 12.15, 0.95, "Benzetme: yemek tarifi programdır; onu pişirmek süreçtir. İki aşçı aynı tarifi aynı anda, her biri kendi malzemesi ve kendi ilerlemesiyle uygulayabilir.", 15);
  s.addNotes("Buradaki PID'ler temsilîdir. Eski kitaplar aynı fikir için iş (job) sözcüğünü kullanır (toplu işlem sistemlerinden kalma); iki sözcük neredeyse birbirinin yerine kullanılır. Mola sorusunun yanıtı: iki terminal penceresi, tek bir program dosyasından iki bash süreci demektir.");

  s = d.content({ kicker: "Süreçler", title: "Bellekteki Bir Süreç: Beş Bölge" });
  {
    const x = MX + 0.9, w = 3.4;
    const reg = [
      ["stack (yığıt)", "yerel değişkenler, dönüş adresleri", C.charcoal, 0.95],
      ["", "", C.white, 0.95],
      ["heap (öbek)", "malloc() / new", C.slate, 0.8],
      ["bss", "ilk değersiz globaller", MINT_L, 0.55],
      ["data", "ilk değerli globaller", MINT_L, 0.55],
      ["text", "makine kodu", C.mint, 0.75],
    ];
    let y = 1.95;
    reg.forEach(r => {
      if (r[0]) d.box(s, x, y, w, r[3] - 0.04, r[0], { sub: r[1], fill: r[2], color: r[2] === C.mint || r[2] === MINT_L ? C.dark : undefined, size: 14, subSize: 11 });
      else {
        s.addShape(P.shapes.RECTANGLE, { x, y, w, h: r[3] - 0.04, fill: { color: C.white }, line: { color: C.slate, width: 1, dashType: "dash" } });
        d.text(s, "boş alan", { x, y, w, h: r[3] - 0.04, fontSize: 11, italic: true, color: C.mutedOnLight, align: "center", valign: "middle" });
      }
      y += r[3];
    });
    d.arrow(s, x + w + 0.25, 2.3, x + w + 0.25, 3.25, { color: C.mintDeep, w: 2 });
    d.text(s, "aşağı büyür", { x: x + w + 0.35, y: 2.55, w: 1.3, h: 0.3, fontSize: 11, bold: true, color: C.mintDeep });
    d.arrow(s, x + w + 0.25, 4.4, x + w + 0.25, 3.5, { color: C.mintDeep, w: 2 });
    d.text(s, "yukarı büyür", { x: x + w + 0.35, y: 3.8, w: 1.3, h: 0.3, fontSize: 11, bold: true, color: C.mintDeep });
    d.text(s, "yüksek", { x: MX - 0.1, y: 1.95, w: 0.9, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "right" });
    d.text(s, "adres 0", { x: MX - 0.1, y: y - 0.32, w: 0.9, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "right" });
    d.text(s, "yüklendikten sonra boyutu sabit: text, data, bss · çalışırken büyüyüp küçülür: heap, stack", { x: MX, y: y + 0.08, w: 5.6, h: 0.55, fontSize: 11, italic: true, color: C.mutedOnLight });
  }
  d.card(s, MX + 6.0, 1.65, 6.15, 5.2, { title: "Ne nerede durur (C'de)", body: [
    { b: "text:", t: " main() ve diğer tüm fonksiyonların derlenmiş kodu; salt okunur." },
    { b: "data:", t: " int initialised = 42;  (değeri olan global)" },
    { b: "bss:", t: " int uninitialised;  (değeri olmayan global; işletim sistemi sıfırla doldurur)" },
    { b: "heap (öbek):", t: " malloc() ile alınan bellek; free()'ye kadar yaşar." },
    { b: "stack (yığıt):", t: " bir fonksiyon içindeki int local = 7; her etkin çağrı için bir çerçeve, fonksiyon dönünce kaldırılır." },
    "Öbek ve yığıt, aradaki boş alanda birbirine doğru büyür.",
  ], bodySize: 14 });
  s.addNotes("bss eski bir assembler adıdır (block started by symbol); asıl nokta, çalıştırılabilir dosyanın sıfırları değil yalnızca boyutu saklamasının yeterli olmasıdır. Çok fazla büyüyen bir yığıt yığıt taşmasına (stack overflow) yol açar, ör. sonsuz özyineleme. 6. ve 7. haftalardaki bellek yönetimi bu resme geri dönecek.");

  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 2: Her Bölgenin Adresini Yazdırmak",
    code: lines("mem_layout.c", 7, 26), size: 11.5, codeW: 7.0, sideTitle: "Neye dikkat edin?",
    side: [
      "Sıra: text < data < bss < heap; yığıt çok daha yukarıda.",
      "İki kez çalıştırın: her adres değişir. Linux saldırıları zorlaştırmak için bölgeleri rastgele yerleştirir (ASLR).",
    ],
    run: { h: 2.25, size: 11, text:
`$ ./mem_layout
text  main()        0x555d9ba160c0
data  initialised   0x555d9ba19010
bss   uninitialised 0x555d9ba19018
heap  *dynamic      0x555db649d2a0
stack local         0x7ffe2b4f6ab4` },
  });
  s.addNotes("Gerçek çıktı. ASLR = adres alanı düzeninin rastgeleleştirilmesi (address space layout randomisation). data ve bss değişkenleri yalnızca 8 bayt uzaklıktadır: diyagramdaki gibi yan yana dururlar. Öbek ile yığıt arasındaki boşluk terabaytlarca sanal adres alanıdır; bunun neden hiçbir maliyeti olmadığını sanal bellek (7. hafta) açıklayacak.");

  s = d.content({ kicker: "Süreç durumları", title: "Beş Durumlu Süreç Modeli" });
  {
    const x = MX, y = 1.7, bw = 1.9, bh = 0.75;
    const pos = { New: [x + 0.1, y + 0.1], Ready: [x + 1.3, y + 2.1], Running: [x + 5.6, y + 2.1], Terminated: [x + 6.6, y + 0.1], Waiting: [x + 3.45, y + 4.0] };
    const name = { New: "yeni", Ready: "hazır", Running: "çalışıyor", Terminated: "sonlandı", Waiting: "bekliyor" };
    const fill = { New: C.light, Ready: MINT_L, Running: C.mint, Terminated: C.light, Waiting: C.slate };
    const col = { New: C.charcoal, Ready: C.dark, Running: C.dark, Terminated: C.charcoal, Waiting: C.white };
    Object.keys(pos).forEach(k => bubble(s, pos[k][0], pos[k][1], bw, bh, name[k], fill[k], col[k]));
    const [nx, ny] = pos.New, [rx, ry] = pos.Ready, [ux, uy] = pos.Running, [tx, ty] = pos.Terminated, [wx, wy] = pos.Waiting;
    const a = (x1, y1, x2, y2) => d.arrow(s, x1, y1, x2, y2, { color: C.charcoal, w: 2 });
    a(nx + 0.9, ny + bh, rx + 0.6, ry);                         // kabul
    label(s, "kabul edildi", nx - 0.55, ny + 1.1, 1.5, 0.3, { align: "right" });
    a(rx + bw, ry + 0.2, ux, uy + 0.2);                          // görevlendirme
    label(s, "zamanlayıcı görevlendirir", rx + bw + 0.1, ry - 0.25, 2.8, 0.3, { align: "center" });
    a(ux, uy + 0.55, rx + bw, ry + 0.55);                        // kesme
    label(s, "kesme (zaman dilimi bitti)", rx + bw + 0.05, ry + 0.8, 2.9, 0.3, { align: "center" });
    a(ux + bw - 0.6, uy, tx + 0.6, ty + bh);                     // çıkış
    label(s, "çıkış", ux + bw - 0.35, uy - 0.75, 0.7, 0.3);
    a(ux + 0.5, uy + bh, wx + bw - 0.2, wy);                     // G/Ç bekleme
    label(s, "G/Ç ya da olay bekleme", ux + 0.15, uy + 1.3, 2.4, 0.3);
    a(wx + 0.2, wy, rx + 0.9, ry + bh);                          // tamamlanma
    label(s, "G/Ç ya da olay tamamlandı", rx - 1.05, ry + 1.3, 2.6, 0.3, { align: "right" });
  }
  d.card(s, MX + 8.75, 1.65, 3.4, 5.2, { title: "Kurallar", body: [
    "İşlemci çekirdeği başına bir çalışan süreç.",
    "Aynı anda çok sayıda süreç hazır ya da bekliyor olabilir.",
    "Hazır ve bekleyen süreçler kuyruklarda durur: PCB'lerinin bağlı listeleri.",
    "Linux ps'te: R = çalışıyor ya da hazır, S = bekliyor (uyuyor), Z = zombi.",
  ], bodySize: 14.5 });
  s.addNotes("Bunu tahtaya da çizin; haftanın en önemli şeklidir ve klasik bir sınav sorusudur. Sorun: bir süreç bekliyor durumundan doğrudan çalışıyor durumuna geçebilir mi? Hayır: G/Ç'si tamamlanınca hazır kuyruğuna katılır ve zamanlayıcının onu görevlendirmesi (dispatch) gerekir. Linux ps hem çalışan hem çalışmaya hazır süreçler için R kullanır.");

  s = d.tableSlide({
    kicker: "Süreç durumları", title: "Her Geçişi Ne Tetikler?",
    header: ["Geçiş", "Tetikleyen", "Gündelik örnek"],
    colW: [2.9, 4.6, 4.65],
    rows: [
      ["yeni → hazır", "işletim sistemi PCB'yi oluşturdu ve programı yükledi", "./mem_layout yazıp Enter'a basarsınız"],
      ["hazır → çalışıyor", "zamanlayıcı süreci görevlendirir (dispatch)", "işlemci çekirdeği boşalır ve zamanlayıcı onu seçer"],
      ["çalışıyor → hazır", "bir kesme, genellikle zamanlayıcı saat (zaman dilimi doldu)", "başkaları çalışabilsin diye uzun bir hesap duraklatılır"],
      ["çalışıyor → bekliyor", "beklemesi gereken bir sistem çağrısı (G/Ç, çocuk, sleep)", "diskten read(); bir çocuk için wait()"],
      ["bekliyor → hazır", "beklenen olay gerçekleşir (çoğunlukla bir kesme)", "disk kesmesi verinin geldiğini bildirir"],
      ["çalışıyor → sonlandı", "exit() ya da ölümcül bir hata", "main() döner; program sıfıra böler"],
    ],
    fontSize: 13,
    callout: "Bekliyor → çalışıyor geçişi olanaksızdır: uyanan süreç önce hazır kuyruğuna katılır. Sırada kimin çalışacağını seçmek işlemci zamanlamasıdır (4–5. haftalar).",
  });
  s.addNotes("2. bölümle bağlantı: bir süreç bekliyor durumuna bir sistem çağrısı yaparak girer (read, wait, sleep). 2. haftayla bağlantı: diğer geçişlere zamanlayıcı saat kesmesi ve disk kesmesi yol açar. İşletim sistemi kesme güdümlüdür.");

  s = d.content({ kicker: "Çözümlü örnek", title: "İki Süreç, Tek İşlemci: Zaman İçinde Durumlar" });
  {
    const x0 = MX + 0.9, u = 0.78, y = 1.85, rh = 0.62;
    const segs = {
      A: [[0, 3, "running"], [3, 7, "waiting"], [7, 8, "ready"], [8, 10, "running"]],
      B: [[0, 3, "ready"], [3, 8, "running"], [8, 10, "ready"], [10, 12, "running"]],
    };
    const lbl = { running: "çalışıyor", ready: "hazır", waiting: "bekliyor (disk)" };
    const fills = { running: C.mint, ready: MINT_L, waiting: C.slate };
    Object.keys(segs).forEach((p, r) => {
      const yy = y + r * (rh + 0.15);
      d.text(s, p, { x: MX, y: yy, w: 0.7, h: rh, fontFace: F.title, fontSize: 16, bold: true, color: C.charcoal, valign: "middle" });
      segs[p].forEach(g => {
        const k = g[2];
        d.box(s, x0 + g[0] * u + 0.02, yy, (g[1] - g[0]) * u - 0.04, rh, lbl[k], { fill: fills[k], color: k === "waiting" ? C.white : C.dark, size: 12, bold: k === "running" });
      });
    });
    for (let t = 0; t <= 12; t++) d.text(s, String(t), { x: x0 + t * u - 0.2, y: y + 2 * rh + 0.2, w: 0.4, h: 0.25, fontSize: 11, color: C.mutedOnLight, align: "center" });
    d.text(s, "ms", { x: x0 + 12 * u + 0.2, y: y + 2 * rh + 0.2, w: 0.4, h: 0.25, fontSize: 11, color: C.mutedOnLight });
    d.text(s, "A 10'da, B 12'de çıkar", { x: x0 + 9.4 * u, y: y - 0.32, w: 2.9, h: 0.28, fontSize: 11, italic: true, color: C.mutedOnLight, align: "right" });
  }
  d.card(s, MX, 3.8, 6.4, 3.05, { title: "Olaylar", body: [
    { b: "t = 3:", t: " A read() çağırır → bekliyor; B görevlendirilir." },
    { b: "t = 7:", t: " disk kesmesi → A hazır olur (işlemci B'de kalır)." },
    { b: "t = 8:", t: " zamanlayıcı kesmesi B'nin 5 ms'lik dilimini bitirir → A çalışır." },
    { b: "t = 10:", t: " A çıkar → B 12'de çıkana kadar çalışır." },
  ], bodySize: 14.5 });
  d.code(s, MX + 6.7, 3.8, 5.45, 3.05,
`Gereken işlemci işi: A = 3+2 = 5 ms
                     B = 5+2 = 7 ms

Art arda (örtüşme yok):
  A 9 ms (işlemci 4 boşta) + B 7 ms = 16 ms
  İşlemci meşgul 12/16 = %75

İç içe (yukarıdaki gibi):
  12 ms, işlemci meşgul 12/12 = %100`, 12);
  s.addNotes("Bu, 1. haftadaki çoklu programlama argümanının durumlar cinsinden ifadesidir. A diski beklerken işlemciyi B kullanır. Sayılar doğrulandı: art arda çalıştırmada A için 3+4+2 = 9 ms, sonra B için 7 ms, toplam 16 ms; işlemci 16 ms'nin 12'sinde meşgul. Öğrencilerden her anda tam olarak bir sürecin çalıştığını kontrol etmelerini isteyin.");

  s = d.content({ kicker: "Süreç denetim bloğu", title: "PCB: İşletim Sisteminin Bir Süreç Hakkında Bildiği Her Şey" });
  {
    const x = MX, w = 4.6;
    const f = ["süreç durumu", "süreç kimliği (PID), ebeveyn PID", "program sayacı", "işlemci yazmaçları", "işlemci zamanlama bilgisi", "bellek yönetimi bilgisi", "hesap bilgisi", "G/Ç durumu: açık dosyalar, aygıtlar"];
    f.forEach((t, i) => d.box(s, x, 1.75 + i * 0.6, w, 0.54, t, { fill: i === 0 ? C.mint : i % 2 ? C.light : MINT_L, color: C.dark, size: 13, bold: i < 4 }));
    d.text(s, "her süreç için bir PCB, çekirdek belleğinde tutulur", { x, y: 1.75 + 8 * 0.6 + 0.02, w, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight, align: "center" });
  }
  d.card(s, MX + 4.9, 1.65, 7.25, 5.2, { title: "Alanlar ne işe yarar?", body: [
    { b: "Durum:", t: " yeni, hazır, çalışıyor, bekliyor ya da sonlandı." },
    { b: "Program sayacı ve yazmaçlar:", t: " süreç yeniden çalıştığında nereden devam edileceği ve geri yüklenecek değerler." },
    { b: "Zamanlama bilgisi:", t: " öncelik, zamanlama kuyruklarına işaretçiler." },
    { b: "Bellek bilgisi:", t: " sürecin bölgelerinin nerede olduğu (sayfa tabloları, sınırlar; 6–7. haftalar)." },
    { b: "Hesap bilgisi:", t: " kullanılan işlemci zamanı, zaman sınırları, süreç numaraları." },
    { b: "G/Ç durumu:", t: " açık dosyaların ve ayrılmış aygıtların listesi." },
    "Linux'ta PCB, yüzlerce alanı olan bir C yapısıdır: struct task_struct.",
  ], bodySize: 14 });
  s.addNotes("PCB'ye görev denetim bloğu (task control block) da denir. Bir süreç çalışmıyorken, işlemci açısından süreç PCB'sinin ta kendisidir: onu daha sonra sürdürmek için gereken her şey oradadır. task_struct, çekirdek kaynak kodunda include/linux/sched.h dosyasında tanımlıdır.");

  s = d.content({ kicker: "Süreç denetim bloğu", title: "Bir PCB'ye Göz Atmak: /proc/<pid>/status", lead: "Linux, her sürecin PCB'sinin bazı kısımlarını /proc dizininde bir metin dosyası olarak gösterir." });
  d.code(s, MX, 2.3, 6.3, 4.55,
`$ sleep 30 &
$ grep -E "^(Name|State|Pid|PPid|Uid|VmSize|VmRSS|
  Threads|voluntary)" /proc/$!/status
Name:   sleep
State:  S (sleeping)
Pid:    27271
PPid:   27265
Uid:    0       0       0       0
VmSize:     2724 kB
VmRSS:      1696 kB
Threads:        1
voluntary_ctxt_switches:        2
nonvoluntary_ctxt_switches:     0`, 12);
  {
    const map = [["State", "süreç durumu"], ["Pid, PPid", "kimlik"], ["Uid", "sahip (koruma)"], ["VmSize, VmRSS", "bellek yönetimi bilgisi"], ["Threads", "4. hafta!"], ["…ctxt_switches", "hesap bilgisi"]];
    const x = MX + 6.6;
    d.text(s, "alan  →  PCB girdisi", { x, y: 2.3, w: 5.5, h: 0.35, fontFace: F.body, fontSize: 15, bold: true, color: C.mintDeep });
    map.forEach((m, i) => {
      const y = 2.8 + i * 0.68;
      d.box(s, x, y, 2.3, 0.56, m[0], { fill: C.light, size: 12, font: F.code, bold: false });
      d.arrow(s, x + 2.33, y + 0.28, x + 2.75, y + 0.28, { w: 1.5 });
      d.box(s, x + 2.78, y, 2.77, 0.56, m[1], { fill: MINT_L, size: 13 });
    });
  }
  s.addNotes("Test makinemizden gerçek çıktı; grep deseni burada yer kazanmak için iki satıra bölündü (tek satırda yazın). $! son arka plan komutunun PID'sidir. sleep bekliyor durumundadır (S), çünkü çekirdekten kendisini 30 s sonra uyandırmasını istedi. /proc gerçek bir disk dizini değildir: çekirdek metni task_struct'tan anında üretir. Öğrenciler /proc'u 13. haftada yeniden kullanacak.");

  s = d.content({ kicker: "Bağlam değişimi", title: "Bağlam Değişimi: İşlemciyi Bir Süreçten Diğerine Geçirmek" });
  {
    const x0 = MX + 1.3, y = 1.95, rh = 0.62, u = 0.8;
    const rows = ["P0", "Çekirdek", "P1"];
    rows.forEach((r, i) => d.text(s, r, { x: MX, y: y + i * (rh + 0.3), w: 1.1, h: rh, fontFace: F.title, fontSize: 16, bold: true, color: C.charcoal, valign: "middle" }));
    const seg = (row, t0, t1, txt, fill, color) => d.box(s, x0 + t0 * u + 0.02, y + row * (rh + 0.3), (t1 - t0) * u - 0.04, rh, txt, { fill, color, size: 12 });
    const idle = (row, t0, t1) => {
      const yy = y + row * (rh + 0.3) + rh / 2;
      s.addShape(P.shapes.LINE, { x: x0 + t0 * u + 0.1, y: yy, w: (t1 - t0) * u - 0.2, h: 0, line: { color: C.slate, width: 1.25, dashType: "dash" } });
      d.text(s, "hazır (boşta)", { x: x0 + t0 * u, y: yy - 0.33, w: (t1 - t0) * u, h: 0.28, fontSize: 10, italic: true, color: C.mutedOnLight, align: "center" });
    };
    seg(0, 0, 3, "P0 yürütülüyor", C.mint, C.dark);
    seg(1, 3, 5.2, "P0 → PCB0 kaydet  ·  PCB1 yükle", C.charcoal, C.white);
    seg(2, 5.2, 8.2, "P1 yürütülüyor", C.mint, C.dark);
    seg(1, 8.2, 10.4, "P1 → PCB1 kaydet  ·  PCB0 yükle", C.charcoal, C.white);
    seg(0, 10.4, 13, "P0 yürütülüyor", C.mint, C.dark);
    idle(0, 3, 10.4); idle(2, 0, 5.2); idle(2, 8.2, 13);
    d.arrow(s, x0 + 3 * u, y + rh + 0.02, x0 + 3 * u, y + rh + 0.28, { color: C.red, w: 2 });
    d.arrow(s, x0 + 8.2 * u, y + 2 * (rh + 0.3) - 0.02, x0 + 8.2 * u, y + rh + 0.3 + rh + 0.02, { color: C.red, w: 2 });
    d.text(s, "kesme ya da sistem çağrısı", { x: x0 + 3 * u + 0.08, y: y + rh + 0.02, w: 2.6, h: 0.25, fontSize: 10, italic: true, color: C.red });
  }
  d.card(s, MX, 4.75, 7.3, 2.1, { title: "Ne kaydedilir ve geri yüklenir?", body: "Program sayacı, işlemci yazmaçları, yığıt işaretçisi, süreç durumu ve bellek yönetimi bilgisi (hangi sayfa tablosunun etkin olduğu). Hepsi PCB'de durur.", bodySize: 14 });
  d.callout(s, MX + 7.55, 4.75, 4.6, 2.1, "Koyu kutular süresince hiçbir süreç yararlı iş yapmaz: bağlam değişimi saf ek yüktür.", 15);
  s.addNotes("Klasik şekil (Silberschatz Şekil 3.6), yatay çizildi: zaman soldan sağa akar. Kırmızı oklar işlemcinin çekirdeğe girdiği anlardır. Gizli ek maliyet: bir geçişten sonra önbellekler ve TLB eski sürecin verileriyle doludur, bu yüzden yeni süreç bir süre yavaş çalışır.");

  s = d.content({ kicker: "Çözümlü örnek", title: "Bağlam Değişimi Ne Kadara Mal Olur?" });
  d.card(s, MX, 1.65, 5.6, 5.2, { title: "Model", body: [
    "Her süreç q zaman dilimi kadar çalışır, sonra işletim sisteminin geçiş için s süresine ihtiyacı olur.",
    "Kaybedilen işlemci zamanı oranı:",
    "     ek yük = s / (q + s)",
    "s = 5 µs varsayalım (temsilî; gerçek geçişler birkaç µs sürer, önbellekler yeniden dolarken daha fazla).",
    "Örnek: saniyede 1000 geçiş × 5 µs = saniyede 5 ms = %0,5.",
  ], bodySize: 14.5 });
  d.code(s, MX + 5.9, 1.65, 6.25, 3.6,
`  zaman dilimi q   ek yük s/(q+s)
  100   ms         %0.005
   10   ms         %0.05
    1   ms         %0.50
    0.1 ms         %4.76
    0.01 ms        %33.3
    0.005 ms       %50     (q = s)`, 13.5);
  d.callout(s, MX + 5.9, 5.45, 6.25, 1.4, "Kısa dilimler hızlı tepki verir ama işlemciyi harcar; uzun dilimler az harcar ama hantal hissettirir. q'yu seçmek bir Round-Robin sorusudur (5. hafta).", 14);
  s.addNotes("Tüm değerler kısa bir Python kontrolüyle hesaplandı: s = 5 mikrosaniye ile ek yük = s/(q+s). Ör. q = 1 ms: 5/1005 = %0,4975, yaklaşık %0,50. q = 0,1 ms için: 5/105 = %4,76. q, s'ye eşit olduğunda işlemcinin yarısı boşa gider.");

  s = d.content({ kicker: "Süreç oluşturma", title: "Süreç Oluşturmak: fork(), exec(), wait()" });
  {
    const x = MX, y = 2.1, h = 0.7;
    d.box(s, x, y + 1.0, 1.5, h, "ebeveyn", { sub: "PID 32268", fill: C.charcoal, size: 13 });
    d.box(s, x + 1.9, y + 1.0, 1.2, h, "fork()", { fill: C.mint, color: C.dark, size: 14, font: F.code });
    d.arrow(s, x + 1.52, y + 1.35, x + 1.88, y + 1.35, { w: 2 });
    // ebeveyn kolu (üst)
    d.arrow(s, x + 2.5, y + 0.98, x + 3.6, y + 0.35, { w: 2 });
    d.box(s, x + 3.62, y, 1.4, h, "wait()", { fill: C.mint, color: C.dark, size: 14, font: F.code });
    s.addShape(P.shapes.LINE, { x: x + 5.07, y: y + 0.35, w: 2.55, h: 0, line: { color: C.slate, width: 1.5, dashType: "dash" } });
    d.text(s, "ebeveyn bekler (durum: bekliyor)", { x: x + 4.85, y: y - 0.3, w: 3.1, h: 0.28, fontSize: 11, italic: true, color: C.mutedOnLight, align: "center" });
    d.box(s, x + 7.65, y, 1.5, h, "devam eder", { sub: "durumu yazar", fill: C.charcoal, size: 13 });
    // çocuk kolu (alt)
    d.arrow(s, x + 2.5, y + 1.72, x + 3.6, y + 2.35, { w: 2 });
    d.box(s, x + 3.62, y + 2.0, 1.4, h, "exec(\"ps\")", { fill: C.mint, color: C.dark, size: 13, font: F.code });
    d.box(s, x + 5.3, y + 2.0, 1.6, h, "ps çalışır", { sub: "aynı PID 32269", fill: C.light, size: 13 });
    d.arrow(s, x + 5.04, y + 2.35, x + 5.28, y + 2.35, { w: 2 });
    d.box(s, x + 7.2, y + 2.0, 1.1, h, "exit()", { fill: C.mint, color: C.dark, size: 13, font: F.code });
    d.arrow(s, x + 6.92, y + 2.35, x + 7.18, y + 2.35, { w: 2 });
    d.arrow(s, x + 8.0, y + 1.98, x + 8.3, y + 0.72, { color: C.red, w: 2 });
    d.text(s, "çıkış durumu", { x: x + 8.25, y: y + 1.15, w: 1.3, h: 0.3, fontSize: 11, bold: true, color: C.red });
    d.text(s, "çocuk (PID 32269)", { x: x + 2.1, y: y + 2.8, w: 1.8, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight });
  }
  d.card(s, MX, 5.15, 4.0, 1.7, { title: "fork()", body: "Çağıran süreci kopyalar. İki kez döner: çocukta 0, ebeveynde çocuğun PID'si (hatada −1).", bodySize: 13 });
  d.card(s, MX + 4.15, 5.15, 4.0, 1.7, { title: "exec()", body: "Süreçteki programı yenisiyle değiştirir. PID aynı kalır; başarılı olursa asla geri dönmez.", bodySize: 13 });
  d.card(s, MX + 8.3, 5.15, 3.85, 1.7, { title: "wait()", body: "Ebeveyn bir çocuk bitene kadar uyur, sonra çıkış durumunu toplar.", bodySize: 13 });
  d.callout(s, MX + 9.6, 1.65, 2.55, 3.25, "Windows iki adımı tek çağrıda yapar: CreateProcess().", 14);
  s.addNotes("Kabuğun yazdığınız her komut için yaptığı tam olarak budur: kendisinin bir kopyasını fork eder, kopya komutu exec eder, kabuk bekler. PID'ler bir sonraki slayttaki gerçek çalıştırmadan alındı. Neden iki adım? fork ile exec arasında çocuk kendi ortamını hazırlayabilir, örneğin çıktısını bir dosyaya yönlendirebilir (12. hafta, borular ve yönlendirme).");

  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 3: C ile fork, exec ve wait",
    code: code("fork_exec_wait_excerpt.c"), size: 10.5, codeW: 7.2, sideTitle: "Neye dikkat edin?",
    side: [
      "Aynı if testi, iki farklı yanıt: çocuk 0 görür, ebeveyn çocuğun PID'sini.",
      "ps, PID 32269'u \"ps\" olarak listeler: exec PID'yi korudu.",
    ],
    run: { h: 2.5, size: 10, text:
`$ ./fork_exec_wait
parent: my PID is 32268
child : PID 32269, my parent is 32268
  PID  PPID STAT COMMAND
32268 32251 S    fork_exec_wait
32269 32268 R    ps
parent: child 32269 finished,
        exit status 0` },
  });
  s.addNotes("Gerçek çıktı (PID'ler her çalıştırmada değişir; son satır yer kazanmak için bölündü). STAT sütunu: ebeveyn S'dir (uyuyor = wait() içinde bekliyor), çocuk R'dir (çalışıyor; listelemeyi yapan ps'in kendisidir). strace -f altında üç çağrı clone(...) = <çocuk PID>, execve(\"/usr/bin/ps\", ...) = 0 ve wait4(<çocuk PID>, ...) = <çocuk PID> olarak görünür: glibc, fork()'u clone sistem çağrısıyla gerçekler. fork'tan önceki fflush önemlidir: yoksa tampondaki metin çocuğa kopyalanır ve iki kez yazdırılır.");

  s = d.content({ kicker: "Süreç oluşturma", title: "Süreç Ağacı ve Süreç Kimlikleri" });
  {
    const x = MX, y = 1.75, bw = 1.9, bh = 0.6;
    const node = (t, xx, yy, f, c) => d.box(s, xx, yy, bw, bh, t, { fill: f, color: c, size: 12, font: F.code });
    node("systemd (1)", x + 2.4, y, C.charcoal, C.white);
    const kids = [["cron (640)", x], ["sshd (812)", x + 2.4], ["login (900)", x + 4.8]];
    kids.forEach(k => { node(k[0], k[1], y + 1.1, C.light); d.arrow(s, x + 3.35, y + bh + 0.02, k[1] + bw / 2, y + 1.08, { w: 1.5 }); });
    node("sshd (2201)", x + 2.4, y + 2.2, C.light);
    d.arrow(s, x + 3.35, y + 1.1 + bh + 0.02, x + 3.35, y + 2.18, { w: 1.5 });
    node("bash (2210)", x + 2.4, y + 3.3, MINT_L);
    d.arrow(s, x + 3.35, y + 2.2 + bh + 0.02, x + 3.35, y + 3.28, { w: 1.5 });
    node("vim (2275)", x + 1.2, y + 4.4, C.mint, C.dark);
    node("ps (2290)", x + 3.6, y + 4.4, C.mint, C.dark);
    d.arrow(s, x + 3.35, y + 3.3 + bh + 0.02, x + 2.15, y + 4.38, { w: 1.5 });
    d.arrow(s, x + 3.35, y + 3.3 + bh + 0.02, x + 4.55, y + 4.38, { w: 1.5 });
    d.text(s, "tipik bir Linux sunucusu (PID'ler temsilî)", { x, y: y + 5.05, w: 6.6, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight });
  }
  d.code(s, MX + 7.0, 1.65, 5.15, 1.75,
`$ bash -c 'sleep 5 & sleep 5 & pstree -p $$'
bash(6297)-+-pstree(6300)
           |-sleep(6298)
           \`-sleep(6299)`, 11);
  d.card(s, MX + 7.0, 3.6, 5.15, 3.25, { title: "Süreç kimlikleri", body: [
    "Her sürecin benzersiz bir PID'si vardır ve ebeveyninin PID'sini (PPID) bilir.",
    "PID 1'i (systemd ya da init) çekirdek açılışta başlatır: tüm kullanıcı süreçlerinin atası.",
    "PID'ler süreç bitince yeniden kullanılır; üst sınır /proc/sys/kernel/pid_max'tedir.",
  ], bodySize: 13.5 });
  s.addNotes("Sağda gerçek pstree çıktısı var (test makinemizde systemd yok, bu yüzden soldaki ağaç temsilî PID'lerle tipik bir örnektir). Kendi Linux'unuzda: pstree -p | less. Windows da ebeveyn süreci kaydeder, ama UNIX'teki gibi katı bir ağaç tutmaz.");

  s = d.content({ kicker: "Süreç sonlandırma", title: "Zombiler ve Yetimler", lead: "Bir süreç bittiğinde, PCB girdisi biri çıkış durumunu toplayana kadar yaşamaya devam etmelidir." });
  d.card(s, MX, 2.3, 5.95, 2.6, { title: "Zombi (zombie)", body: [
    "Çocuk sonlandı, ama ebeveyni henüz wait() çağırmadı.",
    "Bellek serbest bırakıldı; yalnızca PCB girdisi (PID, çıkış durumu) kalır.",
    "Çok sayıda zombi tüm PID'leri tüketebilir.",
  ], bodySize: 14 });
  d.card(s, MX + 6.2, 2.3, 5.95, 2.6, { title: "Yetim (orphan)", body: [
    "Çocuk hâlâ çalışırken ebeveyn önce sonlandı.",
    "Linux onu PID 1'e (ya da bir \"subreaper\"a) bağlar; o da onun için wait() çağırır.",
    "Bazı sistemler bunun yerine tüm çocukları öldürür (zincirleme sonlandırma).",
  ], bodySize: 14 });
  d.code(s, MX, 5.1, 7.4, 1.75,
`$ sh -c 'sleep 1 & exec sleep 4' &      # 2 s sonra:
$ ps -o pid,ppid,stat,cmd -p 6385 --ppid 6385
  PID  PPID STAT CMD
 6385  6384 S    sleep 4
 6387  6385 Z    [sleep] <defunct>`, 11);
  d.callout(s, MX + 7.65, 5.1, 4.5, 1.75, "sleep 4 hiç wait() çağırmaz; bu yüzden biten çocuğu zombi olarak kalır (durum Z).", 14);
  s.addNotes("Gerçek gösterim: sh -c 'sleep 1 & exec sleep 4', sleep 1'i arka planda başlatır ve sonra kabuğun yerine hiç wait() çağırmayan sleep 4'ü koyar. Bir saniye sonra ilk sleep bir zombidir (slayttaki gerçek yakalanmış çıktı). Dört saniye sonra ebeveyn de biter; zombi yetim kalır ve toplanır.");

  s = d.content({ kicker: "Alıştırma", title: "n Kez fork() Çağrısından Sonra Kaç Süreç Olur?" });
  {
    // ./fork_count 3'ün gerçek çalıştırmasından ikili ağaç
    const x = MX, y = 1.75, bw = 1.25, bh = 0.5;
    const N = {
      r: ["1937", x + 2.6, y],
      a: ["1938", x + 0.2, y + 1.15], b: ["1939", x + 2.6, y + 1.15], c: ["1940", x + 4.9, y + 1.15],
      d: ["1941", x - 0.0, y + 2.3], e: ["1943", x + 1.4, y + 2.3], f: ["1942", x + 2.6, y + 2.3],
      g: ["1944", x - 0.0, y + 3.45],
    };
    const edges = [["r", "a", 1], ["r", "b", 2], ["r", "c", 3], ["a", "d", 2], ["a", "e", 3], ["b", "f", 3], ["d", "g", 3]];
    edges.forEach(([p, q, k]) => {
      const P0 = N[p], Q = N[q];
      d.arrow(s, P0[1] + bw / 2, P0[2] + bh + 0.02, Q[1] + bw / 2, Q[2] - 0.02, { w: 1.25, color: k === 1 ? C.charcoal : k === 2 ? C.mintDeep : C.amber });
    });
    Object.keys(N).forEach(k => d.box(s, N[k][1], N[k][2], bw, bh, N[k][0], { fill: k === "r" ? C.charcoal : C.light, color: k === "r" ? C.white : C.dark, size: 12, font: F.code }));
    d.text(s, [
      { text: "ok rengi = çocuğu hangi fork yarattı:  ", options: { color: C.mutedOnLight } },
      { text: "1.  ", options: { color: C.charcoal, bold: true } },
      { text: "2.  ", options: { color: C.mintDeep, bold: true } },
      { text: "3.", options: { color: C.amber, bold: true } },
    ], { x, y: y + 4.15, w: 6.5, h: 0.3, fontSize: 11, italic: true });
    d.text(s, "./fork_count 3'ten gerçek PID'ler", { x, y: y + 4.5, w: 6.5, h: 0.3, fontSize: 11, italic: true, color: C.mutedOnLight });
  }
  d.code(s, MX + 6.6, 1.65, 5.55, 1.6,
`for (int i = 0; i < n; i++)
    fork();     /* herkes fork eder */
printf("PID %6d  parent %6d\\n",
       getpid(), getppid());`, 12.5);
  d.code(s, MX + 6.6, 3.45, 5.55, 1.2,
`$ for n in 1 2 3 4 5 10; do
>   ./fork_count $n | wc -l; done
2  4  8  16  32  1024      (süreç başına bir satır)`, 11);
  d.callout(s, MX + 6.6, 4.85, 5.55, 2.0, "Her fork'ta süreç sayısı ikiye katlanır: n fork'tan sonra toplam 2ⁿ süreç olur, bunların 2ⁿ − 1'i yeni yaratılmıştır. printf 2ⁿ kez çalışır.", 15);
  s.addNotes("./fork_count 3'ü canlı çalıştırın. Ağacı gerçek çıktıyla okuyun: 1937 asıl süreçtir; 1., 2. ve 3. fork'larda 1938, 1939 ve 1940'ı yarattı. Doğrulama döngüsünün çıktısı burada tek satıra konuldu; program her sayıyı ayrı bir satıra yazar. Sınav tipi soru: n = 4 için printf kaç kez çalışır? 16.");

  s = d.content({ kicker: "Kendiniz deneyin", title: "Kendi Makinenizdeki Süreçlere Bakın" });
  d.code(s, MX, 1.65, 6.6, 5.2,
`# Linux (laboratuvar, WSL ya da sanal makine)
$ ps -ef | head            # tüm süreçler, PPID ile
$ ps -o pid,ppid,stat,cmd  # süreçleriniz + durum
$ pstree -p | less         # süreç ağacı
$ cat /proc/$$/status      # kabuğunuzun PCB'si
$ strace -c ls             # türe göre sistem çağrıları
$ make && ./fork_count 4   # 3. hafta kod klasörü

# Windows
> tasklist                 # süreçleri listele
# Görev Yöneticisi > Ayrıntılar: PID sütunu`, 13);
  d.card(s, MX + 6.9, 1.65, 5.25, 5.2, { title: "Yanıtlanacak sorular", body: [
    "Kabuğunuzun PID'si nedir ve ebeveyni kimdir?",
    "Şu anda R durumunda kaç süreç var? Neden bu kadar az?",
    "Kabuğunuz şimdiye kadar kaç gönüllü bağlam değişimi yaptı?",
    "ls'in en çok altı sistem çağrısı kategorisinden hangisini kullandığını bulun.",
  ], bodySize: 14 });
  s.addNotes("$$ kabuğun kendi PID'sidir. İkinci sorunun beklenen yanıtı: genellikle yalnızca bir ya da iki R süreci vardır (ps'in kendisi), çünkü çoğu süreç zamanının çoğunu girdi bekleyerek geçirir. voluntary_ctxt_switches, sürecin bekleyerek işlemciyi kaç kez bıraktığını sayar.");

  s = d.content({ kicker: "Kapanış", title: "3. Hafta: Temel Çıkarımlar" });
  d.bullets(s, [
    { b: "Hizmetler:", t: " kullanıcıya dönük (arayüz, yürütme, G/Ç, dosyalar, iletişim, hatalar) ve sisteme dönük (tahsis, hesap tutma, koruma)." },
    { b: "Sistem çağrıları:", t: " bir API ve bir libc sarmalayıcısı üzerinden ulaşılır; sistem çağrısı tablosunda bir numarayla seçilir; bir tuzakla girilir." },
    { b: "Parametreler:", t: " yazmaçlar, bir bellek bloğu ya da yığıt; x86-64 Linux rax + en çok altı yazmaç kullanır." },
    { b: "Süreç:", t: " text, data, bss, heap ve stack bölgeleri olan, yürütülmekte olan program; PCB'siyle tanımlanır." },
    { b: "Durumlar:", t: " yeni, hazır, çalışıyor, bekliyor, sonlandı; geçişlere kesmeler ve sistem çağrıları yol açar." },
    { b: "Bağlam değişimi ve oluşturma:", t: " geçiş saf ek yüktür, s/(q+s); fork–exec–wait süreç ağacını kurar." },
  ], { fontSize: 18, y: 1.75, h: 5.1, paraSpaceAfter: 14 });
  s.addNotes("Akılda tutulacak altı cümle. Öğrencilerden her satır için hangi slayttan ya da gösterimden geldiğini söylemelerini isteyin.");

  s = d.quizSlide({ questions: [
    "printf() bir sistem çağrısı mıdır? printf() ile ekran arasında ne olduğunu açıklayın.",
    "İşletim sistemine parametre aktarmanın üç yolunu sayın. x86-64 Linux write() için hangisini kullanır?",
    "Bir süreç neden bekliyor durumundan doğrudan çalışıyor durumuna geçemez?",
    "Bir bağlam değişimi 10 µs, zaman dilimi 1 ms sürüyor. İşlemci zamanının yüzde kaçı ek yüktür?",
  ] });
  s.addNotes("Yanıtlar: 1) Hayır: bir kütüphane fonksiyonudur; metni bir tampona biçimlendirir, sonra write() sarmalayıcısı çekirdeğe tuzak kurar, sys_write baytları terminal sürücüsüne iletir. 2) Yazmaçlar, bellek bloğu, yığıt; yazmaçlar (rdi, rsi, rdx, numara rax'te). 3) Önce hazır kuyruğuna konmalı ve zamanlayıcı tarafından görevlendirilmelidir. 4) 10/(1000+10) = %0,99, yaklaşık %1.");

  d.closing({ nextWeek: "İş Parçacıkları ve İşlemci Zamanlamasının Temelleri", nextItems: [
    "İş parçacıkları (threads): tek süreç, birden çok yürütme akışı",
    "Kullanıcı iş parçacıkları, çekirdek iş parçacıkları ve çoklu iş parçacığı modelleri",
    "İşlemci zamanlaması: işlemci–G/Ç patlama döngüsü ve dağıtıcı (dispatcher)",
    "Zamanlama ölçütleri: işlemci kullanımı, iş hacmi, tamamlanma, bekleme ve yanıt süresi",
  ] });
  const all = P.slides;
  all[all.length - 2].addNotes("Gelecek hafta doğrudan bugünden devam ediyor: /proc/<pid>/status içindeki Threads satırı ve hazır süreçler arasından seçim yapan zamanlayıcı. Mümkünse dersten önce Silberschatz'ın 4. bölümünü ve 5.1 kısmını okuyun.");
  all[all.length - 1].addNotes("Sorular. Öğrencilere Telegram kanalını ve bugünün kodunun Makefile ile birlikte hafta03/code klasöründe olduğunu hatırlatın.");

  await d.save(path.join(__dirname, "MBLP131_Hafta3.pptx"));
  console.log("slides:", d.n);
})();
