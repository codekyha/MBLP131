// MBLP131 Hafta 2 sunumu: Tanımlar, İS hedefleri, bilgisayar sisteminin bileşenleri, İS yapıları
// MCMP117 week02_build_deck.js dosyasının Türkçe sürümüdür; yerleşim değerleri birebir aynıdır.
// Derleme: NODE_PATH=<pptxgenjs içeren node_modules> node hafta02_build_deck.js
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("./deck_tr");
const d = new Deck({ week: 2, assets: __dirname });
const WEEK_DIR = path.join(__dirname, "..", "Hafta_02");
const code = f => fs.readFileSync(path.join(WEEK_DIR, "code", f), "utf8");
const P = d.pres;

// yardımcı: yapı slaytı = solda diyagram, sağda avantaj/dezavantaj
function structureSlide({ kicker, title, lead, draw, pros, cons, examples, notes }) {
  const s = d.content({ kicker, title, lead });
  const y0 = lead ? 2.25 : 1.65;
  draw(s, MX, y0, 6.4, 6.85 - y0);
  const x = MX + 6.65, w = 5.5;
  const avail = 6.85 - y0, eh = examples ? 1.0 : 0, gap = 0.2;
  const hP = (avail - eh - (examples ? 2 : 1) * gap) / 2, hC = hP;
  d.card(s, x, y0, w, hP, { title: "Avantajlar", body: pros, bodySize: 14 });
  d.card(s, x, y0 + hP + gap, w, hC, { title: "Dezavantajlar", titleColor: C.red, body: cons, bodySize: 14 });
  const ey = y0 + hP + hC + 2 * gap;
  if (examples) d.callout(s, x, ey, w, 6.85 - ey, examples, 12.5);
  if (notes) s.addNotes(notes);
  return s;
}

(async () => {
  // 1 ── Başlık
  let s = d.titleSlide({
    kicker: "MBLP131 · HAFTA 2",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 2 · Tanımlar, Hedefler, Bileşenler ve İS Yapıları",
    tagline: "İşletim sistemi tam olarak nedir, ne işe yarar ve nasıl inşa edilir?",
  });
  s.addNotes("Tekrar hoş geldiniz. Geçen hafta hikâyeyi anlattık; bu hafta anatomiyi inceliyoruz. İki saat: ilk saatte tanımlar ve hedefler, ikinci saatte donanım temelleri ve işletim sistemi yapıları; arada kısa bir ara.");

  // 2 ── Tekrar
  s = d.cardsSlide({
    kicker: "Geçen hafta", title: "Dört Fikirde 1. Hafta",
    cards: [
      { title: "Bilgisayar komutları izler", body: "Girdi → işlem → çıktı; program, bellekte verinin hemen yanında durur." },
      { title: "İlk işletim sistemi başlar", body: "…ve diğer her şeyi yönetir; böylece öteki programlar çalışabilir." },
      { title: "Boşta duran CPU pahalıdır", body: "Toplu işleme, çoklu programlama ve zaman paylaşımı, işlemciyi meşgul tutmak için icat edildi." },
      { title: "UNIX 1969, Linux 1991", body: "Küçük, birleştirilebilir araçlar; Linux, 9. haftadan itibaren uygulamalı olarak kullanacağımız sistemdir." },
    ], cols: 4,
    callout: "Bugün bu gayriresmî tanımı kesin bir tanımla değiştiriyor ve işletim sistemlerinin gerçekte nasıl inşa edildiğine bakıyoruz.",
  });

  // 3 ── Gündem
  s = d.content({ kicker: "Hafta 2", title: "Bugünün Gündemi" });
  const agenda = [
    ["1", "Tanımlar", "İşletim sistemi tam olarak nedir? İki klasik bakış açısı."],
    ["2", "Hedefler", "Kolaylık, verimlilik, gelişebilirlik — ve aralarındaki ödünleşimler."],
    ["3", "Bileşenler", "Donanım, işletim sistemi, uygulamalar, kullanıcılar; kesmeler, depolama, çift mod."],
    ["4", "Yapılar", "Basit, monolitik, katmanlı, mikroçekirdek, modüler, hibrit."],
    ["5", "Uygulama", "Gerçek C kodu ve strace ile sistem çağrılarını izlemek."],
  ];
  agenda.forEach((a, i) => {
    const y = 1.7 + i * 1.0;
    d.box(s, MX, y, 0.8, 0.8, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 1.0, y, w: 11.15, h: 0.8, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "  ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.3, y, w: 10.7, h: 0.8, valign: "middle" });
  });

  // ───────────────────────── 1. BÖLÜM: TANIMLAR
  d.sectionSlide({ kicker: "1. Bölüm", title: "İşletim Sistemi Tam Olarak Nedir?", subtitle: "Gayriresmî bir betimlemeden kesin bir tanıma." });

  s = d.content({ kicker: "Tanımlar", title: "Karşılaşacağınız Üç Tanım" });
  const defs = [
    ["Aracı", "Bilgisayarın kullanıcısı ile bilgisayar donanımı arasında aracılık eden bir program.", "— Silberschatz, Galvin ve Gagne"],
    ["Çekirdek", "Bilgisayarda her zaman çalışan tek program. Geri kalan her şey ya bir sistem programı ya da bir uygulama programıdır.", "— Silberschatz, Galvin ve Gagne"],
    ["Yönetici", "Programların yürütülmesini denetleyen ve bilgisayarın kaynaklarını (işlemci, bellek, dosyalar, aygıtlar) yöneten yazılım.", "— Stallings (özetlenerek)"],
  ];
  defs.forEach((df, i) => {
    const x = MX + i * 4.12;
    d.card(s, x, 1.7, 3.9, 3.7, { title: df[0], body: df[1], bodySize: 15 });
    d.text(s, df[2], { x: x + 0.25, y: 4.85, w: 3.4, h: 0.4, fontSize: 11, italic: true, color: C.mutedOnLight });
  });
  d.callout(s, MX, 5.7, 12.15, 1.15, "Çalışma tanımımız: işletim sistemi (İS), donanımı yöneten ve programlara üzerinde çalışabilecekleri daha basit, daha güvenli bir makine sunan yazılım katmanıdır. Bellekte sürekli bulunan özüne çekirdek (kernel) denir.", 15);
  s.addNotes("Üç farklı açıyı vurgulayın: konum (kullanıcı ile donanım arasında), süreklilik (her zaman çalışır: çekirdek) ve işlev (kaynakları yönetir). Hiçbiri yanlış değildir; her biri farklı bir yönü öne çıkarır.");

  s = d.compareSlide({
    kicker: "İki klasik bakış", title: "Genişletilmiş Makine ve Kaynak Yöneticisi",
    lead: "Andrew Tanenbaum işletim sistemini iki yönden tanımlar: yukarıdan aşağıya ve aşağıdan yukarıya.",
    left: { title: "Yukarıdan aşağıya: genişletilmiş makine", items: [
      "Karmaşık donanımı temiz soyutlamaların arkasına gizler.",
      "Disk sektörlerini ve manyetik izleri değil, dosyaları görürsünüz.",
      "Kesme hatlarını ve yazmaçları değil, süreçleri görürsünüz.",
      "Amaç: bilgisayarı programlamayı ve kullanmayı kolaylaştırmak.",
    ] },
    right: { title: "Aşağıdan yukarıya: kaynak yöneticisi", items: [
      "Birçok program ve kullanıcı tek bir makine için yarışır.",
      { b: "Zamanda çoğullama:", t: " sırayla kullanmak (CPU, yazıcı)." },
      { b: "Alanda çoğullama:", t: " parçalara bölerek paylaşmak (bellek, disk alanı)." },
      "Amaç: kaynakları adil, verimli ve güvenli biçimde dağıtmak.",
    ] },
    callout: "İki bakış da aynı yazılımı anlatır. Bu dersin 3–7. haftaları büyük ölçüde kaynak yöneticisi bakışıdır: süreçler, CPU, bellek, dosyalar.",
  });

  s = d.content({ kicker: "Tanımlar", title: "Çekirdek, Sistem Programları ve Uygulamalar", lead: "İşletim sistemiyle birlikte gelen her şey \"çekirdek\" değildir." });
  {
    const x = MX, y = 2.35, w = 6.6;
    d.box(s, x, y, w, 0.85, "Uygulama programları", { sub: "tarayıcı, kelime işlemci, oyun, kendi yazdığınız C programı", fill: C.light });
    d.box(s, x, y + 0.95, w, 0.85, "Sistem programları", { sub: "kabuk (shell), dosya yöneticisi, derleyici, ls, cp, Görev Yöneticisi", fill: "D7E9E6" });
    d.box(s, x, y + 1.9, w, 0.85, "Çekirdek", { sub: "süreç, bellek, dosya ve aygıt yönetimi", fill: C.mint, color: C.dark });
    d.box(s, x, y + 2.85, w, 0.85, "Donanım", { sub: "CPU, bellek, diskler, ağ kartı, ekran", fill: C.charcoal });
    d.text(s, "Her katman yalnızca altındaki katmanın hizmetlerini kullanır.", { x, y: y + 3.85, w, h: 0.4, fontSize: 12, italic: true, color: C.mutedOnLight });
  }
  d.card(s, MX + 6.9, 2.35, 5.25, 4.5, { title: "Kim kimdir?", body: [
    { b: "Çekirdek:", t: " her zaman bellektedir, ayrıcalıklı bir modda çalışır, donanımla doğrudan konuşur." },
    { b: "Sistem programları:", t: " işletim sistemiyle birlikte gelir ama sıradan programlar gibi çalışır; sistemi kullanılabilir kılar." },
    { b: "Uygulamalar:", t: " asıl işinizi yapmak için yüklediğiniz her şey." },
    "Linux, tam anlamıyla yalnızca çekirdektir; bir \"Linux dağıtımı\" buna sistem programlarını (çoğunlukla GNU'dan) ekler.",
  ], bodySize: 14 });

  s = d.cardsSlide({
    kicker: "Tartışma", title: "İşletim Sisteminin Bir Parçası mı?",
    lead: "Tek bir resmî yanıt yok; asıl mesele de bu. Önce oylayın, sonra tartışın.",
    cards: [
      { title: "Web tarayıcısı?", body: "1998'de ABD hükümeti, kısmen Internet Explorer'ı Windows'la birlikte paketlediği için Microsoft'a dava açtı. Tarayıcı \"Windows'un bir parçası\" mı? Avukatlar bunu yıllarca tartıştı." },
      { title: "Grafik masaüstü?", body: "Windows'ta sisteme sıkı sıkıya bağlıdır. Linux'ta ise çekirdeğin üzerinde çalışan, değiştirilebilir bir programdır (GNOME, KDE, …)." },
      { title: "Uygulama mağazası?", body: "Telefonda çoğu kullanıcı uygulama mağazasını \"sistemin kendisi\" sayar. Teknik olarak özel izinlere sahip bir uygulamadır." },
    ],
    callout: "Kullanışlı bir kural: çekirdek kesinlikle işletim sistemidir. Çekirdeğin ötesinde \"işletim sistemi\", üreticinin standart sistem olarak sunduğu her şeydir.",
  });

  // ───────────────────────── 2. BÖLÜM: HEDEFLER
  d.sectionSlide({ kicker: "2. Bölüm", title: "İşletim Sistemi Ne İşe Yarar?", subtitle: "Üç tasarım hedefi ve bu hedeflerin neden farklı yönlere çektiği." });

  s = d.cardsSlide({
    kicker: "Tasarım hedefleri", title: "Her İşletim Sisteminin Üç Hedefi",
    lead: "William Stallings, bir işletim sisteminin amaçlarını üç kelimeyle özetler.",
    cards: [
      { title: "1. Kolaylık", body: ["Bilgisayarı kullanmayı ve programlamayı kolaylaştırır.", "Dosyalar, pencereler, kabuk, basit sistem çağrıları.", "Kullanıcıların donanımı bilmesi gerekmez."] },
      { title: "2. Verimlilik", body: ["Donanımı iyi kullanır: CPU meşgul, bellek faydalı işle dolu, diskler beklemiyor.", "Düşük ek yük: işletim sisteminin kendisi az kaynak kullanmalıdır."] },
      { title: "3. Gelişebilirlik", body: ["Yeni donanımlar (SSD, GPU, 5G modem) ve yeni hizmetler eklenebilmeli…", "…mevcut programları bozmadan.", "İşletim sistemi yapısının seçimini belirler (4. bölüm)."] },
    ],
    callout: "Daha sonra ele alacağımız her yapı, bu üç hedef arasında farklı bir uzlaşmadır.",
  });

  s = d.tableSlide({
    kicker: "Ödünleşimler", title: "Hangi Hedef Daha Önemli? Makineye Göre Değişir",
    header: ["Sistem türü", "Ana öncelik", "Neden"],
    colW: [2.8, 2.7, 6.65],
    rows: [
      ["Kişisel bilgisayar", "Kolaylık", "\"Sorunsuz çalışmasını\" isteyen tek bir kullanıcı; CPU zaten çoğu zaman boştadır."],
      ["Sunucu / bulut", "Verimlilik", "Binlerce kullanıcı; %1 daha fazla iş hacmi, yüzlerce makine daha az demek olabilir."],
      ["Akıllı telefon", "Verimlilik (enerji)", "Pil ömrü: işletim sistemi uygulamaları ve CPU'yu agresif biçimde uyku moduna alır."],
      ["Gömülü / IoT", "Verimlilik (boyut, maliyet)", "Bir çamaşır makinesi denetleyicisinin yalnızca birkaç kilobayt belleği olabilir; hiç işletim sistemi olmayabilir."],
      ["Gerçek zamanlı (araç frenleri, dronlar)", "Öngörülebilirlik", "Geç gelen yanıt yanlış yanıttır: süre sınırlarına her zaman uyulmalıdır."],
    ],
    fontSize: 15,
  });

  s = d.content({ kicker: "Ödünleşimler", title: "Kolaylık ve Verimlilik: Çözümlü Bir Örnek" });
  d.card(s, MX, 1.65, 6.6, 5.2, { bodySize: 16, title: "Durum", body: [
    "Bir program bir dosyadan 1.000.000 sayı okumalıdır.",
    { b: "Kolay yol:", t: " işletim sisteminden her seferinde bir sayı istemek → 1.000.000 sistem çağrısı." },
    { b: "Verimli yol:", t: " 4.096 baytlık bloklar istemek (her biri ≈ 1.000 sayı) → yaklaşık 1.000 sistem çağrısı." },
    "Bir sistem çağrısının salt ek yükü yaklaşık 0,1 µs ise (bunu bugün ölçeceğiz):",
  ], bodySize: 16 });
  d.code(s, MX + 6.9, 1.65, 5.25, 3.0,
`tek tek:
  1.000.000 × 0,1 µs = 100 ms

1.000'lik bloklar hâlinde:
  1.000 × 0,1 µs = 0,1 ms

=> 1000 kat daha az ek yük`, 14);
  d.callout(s, MX + 6.9, 4.9, 5.25, 1.95, "C'nin stdio gibi kütüphaneleri ikisini birden sunar: fgetc()'yi her seferinde tek bir karakter için çağırırsınız, ama kütüphane arka planda büyük bloklar okur.", 14);

  // ───────────────────────── 3. BÖLÜM: BİLEŞENLER
  d.sectionSlide({ kicker: "3. Bölüm", title: "Bir Bilgisayar Sisteminin Bileşenleri", subtitle: "Donanım, işletim sistemi, uygulama programları ve kullanıcılar." });

  s = d.content({ kicker: "Bileşenler", title: "Bir Bilgisayar Sisteminin Dört Bileşeni" });
  {
    const x = MX, y = 1.7, w = 7.4;
    const users = ["Kullanıcı 1", "Kullanıcı 2", "Kullanıcı 3", "…"];
    users.forEach((u, i) => d.box(s, x + i * 1.9, y, 1.7, 0.6, u, { fill: C.light, size: 12 }));
    const apps = ["Derleyici", "Tarayıcı", "Metin düzenleyici", "Veritabanı"];
    apps.forEach((u, i) => d.box(s, x + i * 1.9, y + 1.05, 1.7, 0.75, u, { fill: "D7E9E6", size: 12 }));
    d.box(s, x, y + 2.25, w, 0.9, "İşletim sistemi", { fill: C.mint, color: C.dark, size: 16 });
    d.box(s, x, y + 3.6, w, 0.9, "Bilgisayar donanımı", { sub: "CPU · bellek · G/Ç aygıtları", fill: C.charcoal, size: 16 });
    [0, 1, 2, 3].forEach(i => d.arrow(s, x + 0.85 + i * 1.9, y + 0.62, x + 0.85 + i * 1.9, y + 1.03, { w: 1.5 }));
    [0, 1, 2, 3].forEach(i => d.arrow(s, x + 0.85 + i * 1.9, y + 1.82, x + 0.85 + i * 1.9, y + 2.23, { w: 1.5 }));
    d.arrow(s, x + w / 2, y + 3.17, x + w / 2, y + 3.58, { w: 1.5, both: true });
  }
  d.card(s, MX + 7.7, 1.7, 4.45, 5.15, { title: "Roller", body: [
    { b: "Donanım", t: " temel hesaplama kaynaklarını sağlar." },
    { b: "Uygulama programları", t: " bu kaynakları kullanıcıların sorunlarını çözmek için kullanır." },
    { b: "Kullanıcılar:", t: " insanlar, ama aynı zamanda başka makineler ve programlar." },
    { b: "İşletim sistemi", t: " donanımı denetler ve onun uygulamalar ile kullanıcılar arasındaki kullanımını koordine eder." },
  ], bodySize: 14 });

  s = d.content({ kicker: "Donanım bakışı", title: "Kutunun İçi: Sistem Yolu, CPU, Bellek ve Aygıtlar" });
  {
    const by = 1.85; // sistem yolu en üstte
    s.addShape(P.shapes.RECTANGLE, { x: MX, y: by, w: 12.15, h: 0.22, fill: { color: C.slate }, line: { type: "none" } });
    d.text(s, "sistem yolu (bus): veri, adres ve denetim sinyallerini taşır", { x: MX, y: by - 0.32, w: 8, h: 0.3, fontSize: 11, italic: true, color: C.slate });
    const y = by + 0.65;
    const top = [["CPU", "getir–çöz–yürüt", C.mint, C.dark], ["Ana bellek", "RAM", C.charcoal, C.white]];
    top.forEach((t, i) => {
      const x = MX + i * 2.55;
      d.box(s, x, y, 2.3, 1.15, t[0], { sub: t[1], fill: t[2], color: t[3], size: 16 });
      d.arrow(s, x + 1.15, by + 0.24, x + 1.15, y - 0.02, { w: 1.25, both: true });
    });
    const ctl = [["Disk denetleyicisi", "SSD / HDD"], ["USB denetleyicisi", "klavye, fare"], ["Grafik bağdaştırıcısı", "monitör"], ["Ağ kartı", "Wi-Fi, Ethernet"]];
    ctl.forEach((c, i) => {
      const x = MX + 5.15 + i * 1.77;
      d.box(s, x, y, 1.62, 1.15, c[0], { fill: C.light, size: 12 });
      d.arrow(s, x + 0.81, by + 0.24, x + 0.81, y - 0.02, { w: 1.25, both: true });
      s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y: y + 1.75, w: 1.62, h: 0.75, fill: { color: C.white }, line: { color: C.slate, width: 1 }, rectRadius: 0.05 });
      d.text(s, c[1], { x, y: y + 1.75, w: 1.62, h: 0.75, fontSize: 12, align: "center", valign: "middle", color: C.charcoal });
      d.arrow(s, x + 0.81, y + 1.17, x + 0.81, y + 1.73, { w: 1.25, both: true });
    });
    d.text(s, "aygıtlar", { x: MX + 3.9, y: y + 1.95, w: 1.15, h: 0.35, fontSize: 11, italic: true, color: C.slate, align: "right" });
  }
  d.callout(s, MX, 5.9, 12.15, 0.95, "Her aygıt denetleyicisinin küçük bir yerel tamponu vardır ve CPU ile paralel çalışır. İşletim sistemi her denetleyici için bir aygıt sürücüsü içerir: sürücü denetleyicinin dilini konuşur, böylece işletim sisteminin geri kalanının bu dili bilmesi gerekmez.", 14);

  s = d.content({ kicker: "Donanım bakışı", title: "Kesmeler: Aygıt CPU'nun Dikkatini Nasıl Çeker?", lead: "CPU klavyeye sürekli \"yeni bir şey var mı?\" diye sormaz; klavye CPU'ya haber verir." });
  {
    const steps = [
      ["1. Aygıt bitirir", "Disk denetleyicisi veriyi kendi tamponuna kopyalamıştır."],
      ["2. Sinyal", "CPU üzerindeki bir kesme hattını etkinleştirir."],
      ["3. Kaydet, atla", "CPU o anki işini kaydeder ve kesme vektöründe yazılı işleyiciye atlar."],
      ["4. İşle", "İşletim sisteminin kesme işleyicisi (sürücünün parçası) olayı işler."],
      ["5. Devam et", "Kaydedilen durum geri yüklenir; kesilen program hiçbir şey olmamış gibi devam eder."],
    ];
    const w = 2.25, gap = 0.22;
    steps.forEach((st, i) => {
      const x = MX + i * (w + gap);
      d.card(s, x, 2.35, w, 2.75, { title: st[0], body: st[1], bodySize: 14, titleSize: 15 });
      if (i < steps.length - 1) d.arrow(s, x + w + 0.01, 3.7, x + w + gap - 0.01, 3.7, { w: 1.5 });
    });
  }
  d.callout(s, MX, 5.4, 12.15, 1.45, "Modern işletim sistemleri kesme güdümlüdür: çalışan program yoksa ve hiçbir aygıt ilgi beklemiyorsa işletim sistemi yalnızca bekler. Her tuş basımı, her ağ paketi ve biten her disk okuması bir kesme olarak gelir; saniyede binlercesi.", 14);

  s = d.tableSlide({
    kicker: "Donanım bakışı", title: "Depolama Hiyerarşisi: Hızlı ve Küçük, Yavaş ve Büyük",
    header: ["Düzey", "Tipik boyut", "Tipik erişim süresi", "Bir yazmaç erişimi 1 saniye sürseydi…"],
    colW: [2.6, 2.4, 2.9, 4.25],
    rows: [
      ["CPU yazmaçları", "< 1 KB", "≈ 0,3 ns", "1 saniye"],
      ["Önbellek (L1–L3)", "birkaç MB", "1 – 40 ns", "3 saniye – 2 dakika"],
      ["Ana bellek (RAM)", "8 – 64 GB", "≈ 100 ns", "≈ 5 dakika"],
      ["SSD", "0,5 – 4 TB", "≈ 50 µs", "≈ 2 gün"],
      ["Sabit disk (HDD)", "1 – 20 TB", "≈ 5 ms", "≈ 6 ay"],
    ],
    fontSize: 16,
    callout: "Yazmaçlar, önbellek ve RAM uçucudur (güç kesilince içerik kaybolur); SSD'ler ve diskler kalıcıdır. İşletim sistemi verileri bu düzeyler arasında sürekli taşır: 6. ve 7. haftaların konusu.",
  });
  s.addNotes("Ölçekleme sütunu: her süreyi 1/(0,3 ns) ≈ 3,3 × 10^9 ile çarpın. RAM: 100 ns × 3,3 × 10^9 ≈ 330 s ≈ 5,5 dk; SSD: 50 µs → 1,7 × 10^5 s ≈ 2 gün; HDD: 5 ms → 1,7 × 10^7 s ≈ 190 gün. Değerler büyüklük mertebesidir ve güncel donanım için tipiktir.");

  s = d.content({ kicker: "Koruma", title: "Çift Modlu Çalışma: Kullanıcı Modu ve Çekirdek Modu", lead: "Kimin neyi yapabileceğini donanımın kendisi, CPU içindeki bir mod biti ile denetler." });
  {
    const x = MX, y = 2.35;
    d.box(s, x, y, 6.6, 1.2, "Kullanıcı modu (mod biti = 1)", { sub: "programlarınız: yalnızca kısıtlı komutlar", fill: C.light, size: 16 });
    d.box(s, x, y + 2.55, 6.6, 1.2, "Çekirdek modu (mod biti = 0)", { sub: "işletim sistemi çekirdeği: tüm komutlara izin var", fill: C.charcoal, size: 16 });
    d.arrow(s, x + 1.6, y + 1.25, x + 1.6, y + 2.5, { color: C.mint, w: 2.5 });
    d.arrow(s, x + 5.0, y + 2.5, x + 5.0, y + 1.25, { color: C.mint, w: 2.5 });
    d.text(s, "sistem çağrısı / kesme\n(tuzak: biti 0 yap)", { x: x + 1.75, y: y + 1.45, w: 2.2, h: 0.8, fontSize: 12, color: C.mintDeep, bold: true });
    d.text(s, "kullanıcıya dön\n(biti 1 yap)", { x: x + 5.15, y: y + 1.45, w: 1.6, h: 0.8, fontSize: 12, color: C.mintDeep, bold: true });
  }
  d.card(s, MX + 6.9, 2.35, 5.25, 4.5, { title: "Neden önemli?", body: [
    { b: "Ayrıcalıklı komutlar", t: " (bir aygıtla konuşmak, bellek korumasını değiştirmek, CPU'yu durdurmak) yalnızca çekirdek modunda çalışır." },
    "Bir kullanıcı programı böyle bir komutu denerse donanım işletim sistemine bir tuzak (trap) üretir; işletim sistemi genellikle programı sonlandırır.",
    "Böylece hatalı ya da kötü niyetli bir uygulama makineyi ele geçiremez.",
    "x86 işlemcilerde modlara halka (ring) denir: Linux ve Windows halka 0'ı (çekirdek) ve halka 3'ü (kullanıcı) kullanır.",
  ], bodySize: 14 });

  s = d.codeSlide({
    kicker: "Uygulama", title: "1. Örnek: Çekirdeği Çağıran Bir Program",
    code: code("hello_syscall.c"), size: 11.5, codeW: 7.1, sideTitle: "Ne oluyor?",
    side: [
      "printf() bir kütüphane fonksiyonudur: metni kullanıcı modunda biçimlendirir.",
      "write() bir sistem çağrısıdır: çekirdek moduna geçilir ve baytları ekrana çekirdek gönderir.",
      "strace, bir programın yaptığı her sistem çağrısını gösterir:",
    ],
    run: { h: 1.75, size: 10.5, text:
`$ strace ./hello_syscall
write(1, "printf ile merhaba!\\n", 20)   = 20
write(1, "write() ile merhaba!\\n", 21)  = 21
exit_group(0)                           = ?` },
  });
  s.addNotes("strace'in gösterdiği önemli nokta: printf de sonunda bir write() sistem çağrısına dönüşür. Kütüphane fonksiyonları kolaylık sağlayan sarmalayıcılardır; çekirdeğe yalnızca sistem çağrıları geçer. Öğrenciler bunu 9. haftada laboratuvar bilgisayarlarında ya da WSL'de deneyebilir.");

  s = d.codeSlide({
    kicker: "Uygulama", title: "2. Örnek: Çekirdeğe Gidip Gelmek Ne Kadar Pahalı?",
    code: code("syscall_cost_excerpt.c"), size: 12, codeW: 7.1, sideTitle: "Deney",
    side: [
      "Sıradan bir fonksiyonu bir milyon kez çağırın.",
      "Ardından bir milyon küçük sistem çağrısı (getpid) yapın.",
      "Çağrı başına ortalama süreyi karşılaştırın.",
      "Kesin sayılar makinenize bağlıdır; asıl ders orandadır.",
    ],
    run: { h: 1.5, size: 10.5, text:
`$ ./syscall_cost
sıradan fonksiyon çağrısı :    1.5 ns
sistem çağrısı (getpid)   :  116.1 ns
sistem çağrısı yaklaşık 76 kat daha yavaş` },
  });
  s.addNotes("Derleme ortamımızda (bir sanal makine) ölçülmüştür. Sanallaştırılmamış bir Linux'ta getpid sistem çağrısı çoğunlukla 50–150 ns sürer. Mod geçişleri bedava değildir; bu tek gerçek, 4. bölümün büyük kısmını (mikroçekirdeklerin neden daha yavaş olduğunu) açıklar.");

  // ── Ara
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Ara", subtitle: "Sırada: işletim sistemleri nasıl inşa edilir? MS-DOS'tan mikroçekirdeklere." });

  // ───────────────────────── 4. BÖLÜM: YAPILAR
  d.sectionSlide({ kicker: "4. Bölüm", title: "İşletim Sistemi Yapıları", subtitle: "Aynı hedefler, çok farklı binalar." });

  s = d.content({ kicker: "Yapılar", title: "Yapı Neden Önemlidir?", lead: "Linux çekirdeği 30 milyondan fazla kod satırından oluşur. Bu kadar büyük bir şeyi nasıl düzenlersiniz?" });
  [
    ["Basit", "Neredeyse hiç yapı yok (MS-DOS)."],
    ["Monolitik", "Tek büyük bir çekirdek programı (UNIX, Linux)."],
    ["Katmanlı", "Katı katmanlar; her biri yalnızca altındakini kullanır (THE)."],
    ["Mikroçekirdek", "Küçücük çekirdek; hizmetler kullanıcı programıdır (Mach, MINIX 3, QNX)."],
    ["Modüler", "Ana çekirdek + yüklenebilir modüller (Linux)."],
    ["Hibrit", "Gerçek sistemler bunları karıştırır (Windows, macOS, Android)."],
  ].forEach((r, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    d.card(s, MX + col * 4.13, 2.35 + row * 2.3, 3.9, 2.1, { title: r[0], body: r[1], bodySize: 16, titleSize: 18 });
  });

  structureSlide({
    kicker: "1. Yapı", title: "Basit Yapı: MS-DOS",
    lead: "1981'deki IBM PC'nin çok küçük belleğine sığmak için yazıldı; hiçbir zaman gerçek anlamda katmanlı tasarlanmadı.",
    draw: (s, x, y, w, h) => {
      const rows = [["Uygulama programı", C.light], ["Bellekte yerleşik sistem programı", "D7E9E6"], ["MS-DOS aygıt sürücüleri", C.mint], ["ROM BIOS aygıt sürücüleri", C.charcoal]];
      const bh = 0.8, bw = 4.4;
      rows.forEach((r, i) => d.box(s, x, y + 0.2 + i * 1.05, bw, bh, r[0], { fill: r[1], color: r[1] === C.mint ? C.dark : undefined, size: 13 }));
      // atlama okları: uygulama doğrudan BIOS'a / donanıma
      d.arrow(s, x + bw + 0.15, y + 0.6, x + bw + 0.15, y + 3.55, { color: C.red, w: 2 });
      d.arrow(s, x + bw + 0.55, y + 0.6, x + bw + 0.55, y + 2.5, { color: C.red, w: 2 });
      d.text(s, "Uygulamalar katmanları atlayıp donanıma doğrudan erişebiliyordu.", { x, y: y + 4.45, w: w - 0.2, h: 0.6, fontSize: 12, italic: true, color: C.red });
    },
    pros: ["Çok küçük ve hızlıydı.", "Sınırlı donanım için yazması kolaydı."],
    cons: ["Koruma yok: tek hatalı program tüm sistemi çökertir.", "8088 işlemcide çift mod yoktu; İS bunu önleyemezdi."],
    examples: "Ders: koruma, donanım desteği (çift mod) ve onu kullanan bir işletim sistemi gerektirir.",
  });

  structureSlide({
    kicker: "2. Yapı", title: "Monolitik Çekirdek: UNIX ve Linux",
    lead: "Tüm işletim sistemi hizmetleri, çekirdek modunda ve tek bir adres alanında çalışan büyük bir programda bulunur.",
    draw: (s, x, y, w, h) => {
      const apps = ["kabuk", "tarayıcı", "derleyici", "uygulamanız"];
      apps.forEach((a, i) => d.box(s, x + i * 1.55, y + 0.1, 1.4, 0.6, a, { fill: C.light, size: 12 }));
      d.text(s, "kullanıcı modu", { x: x + 6.2 - 1.2, y: y + 0.8, w: 1.2, h: 0.3, fontSize: 10, italic: true, color: C.mutedOnLight, align: "right" });
      s.addShape(P.shapes.LINE, { x, y: y + 1.12, w: 6.15, h: 0, line: { color: C.slate, width: 1, dashType: "dash" } });
      d.text(s, "sistem çağrısı arayüzü", { x, y: y + 1.17, w: 3, h: 0.3, fontSize: 10, italic: true, color: C.slate });
      s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y: y + 1.5, w: 6.15, h: 2.45, fill: { color: C.charcoal }, rectRadius: 0.05, line: { type: "none" } });
      d.text(s, "TEK ÇEKİRDEK — çekirdek modu", { x: x + 0.2, y: y + 1.58, w: 5, h: 0.35, fontSize: 12, bold: true, color: C.mint });
      const parts = ["zamanlayıcı", "bellek yöneticisi", "dosya sistemleri", "ağ yığını", "aygıt sürücüleri", "sinyaller, IPC"];
      parts.forEach((p, i) => d.box(s, x + 0.2 + (i % 3) * 1.95, y + 2.05 + Math.floor(i / 3) * 0.9, 1.8, 0.75, p, { fill: C.slate, size: 12 }));
      d.box(s, x, y + 4.1, 6.15, 0.6, "Donanım", { fill: C.dark, size: 13 });
    },
    pros: ["Hızlı: hizmetler birbirini doğrudan çağırır.", "Sistem çağrısı başına yalnızca iki mod geçişi."],
    cons: ["Çok büyük ve bakımı zor.", "Tek bir sürücü hatası tüm çekirdeği çökertebilir (\"kernel panic\")."],
    examples: "Örnekler: ilk UNIX (1970'ler), Linux, geleneksel BSD.",
  });

  structureSlide({
    kicker: "3. Yapı", title: "Katmanlı Yaklaşım",
    lead: "İşletim sistemi katmanlara bölünür; N. katman yalnızca altındaki katmanları kullanabilir. 0. katman donanımdır.",
    draw: (s, x, y, w, h) => {
      const L = [["5", "Kullanıcı programları / operatör"], ["4", "G/Ç aygıtları için tamponlama"], ["3", "Operatör konsolu sürücüsü"], ["2", "Bellek yönetimi"], ["1", "CPU zamanlaması"], ["0", "Donanım"]];
      L.forEach((l, i) => {
        const inset = i * 0.18;
        d.box(s, x + inset, y + 0.05 + i * 0.75, 6.1 - 2 * inset, 0.65, `Katman ${l[0]}: ${l[1]}`, { fill: i === 5 ? C.charcoal : i === 0 ? C.light : i % 2 ? "D7E9E6" : C.mint, color: i === 5 ? C.white : C.dark, size: 13 });
      });
      d.text(s, "Dijkstra'nın THE sistemine (1968) gevşek biçimde dayanır.", { x, y: y + 4.6, w: 6, h: 0.35, fontSize: 12, italic: true, color: C.mutedOnLight });
    },
    pros: ["Katman katman inşa etmek ve hata ayıklamak kolaydır.", "Her katman ayrı ayrı doğrulanabilir."],
    cons: ["Sırayı belirlemek zordur (bellek zamanlayıcıya mı dayanır, tersi mi?).", "Her istek birçok katmandan geçer → yavaş."],
    examples: "Saf katmanlı yapı bugün nadirdir, ama fikir her işletim sisteminin içinde yaşar (örneğin ağ yığını katmanlıdır).",
  });

  structureSlide({
    kicker: "4. Yapı", title: "Mikroçekirdek: Çekirdeği Küçük Tut",
    lead: "Çekirdek modunda yalnızca en temel kısım kalır; geri kalan her şey kullanıcı modundaki sıradan sunucular olarak çalışır.",
    draw: (s, x, y, w, h) => {
      const srv = [["Uygulama", C.light], ["Dosya sunucusu", "D7E9E6"], ["Aygıt sürücüsü", "D7E9E6"], ["Ağ sunucusu", "D7E9E6"]];
      srv.forEach((r, i) => d.box(s, x + i * 1.55, y + 0.3, 1.42, 1.0, r[0], { fill: r[1], size: 12 }));
      d.text(s, "kullanıcı modu", { x: x + 4.9, y: y + 1.35, w: 1.25, h: 0.3, fontSize: 10, italic: true, color: C.mutedOnLight, align: "right" });
      s.addShape(P.shapes.LINE, { x, y: y + 1.7, w: 6.15, h: 0, line: { color: C.slate, width: 1, dashType: "dash" } });
      d.box(s, x, y + 2.75, 6.15, 0.95, "Mikroçekirdek", { sub: "mesaj iletimi · temel zamanlama · temel bellek", fill: C.mint, color: C.dark, size: 15 });
      d.arrow(s, x + 0.55, y + 1.32, x + 0.55, y + 2.72, { color: C.mintDeep, w: 2 });
      d.arrow(s, x + 2.0, y + 2.72, x + 2.0, y + 1.32, { color: C.mintDeep, w: 2 });
      d.text(s, "① istek", { x: x + 0.62, y: y + 1.85, w: 1.2, h: 0.3, fontSize: 11, bold: true, color: C.mintDeep });
      d.text(s, "② iletilir", { x: x + 2.07, y: y + 2.25, w: 1.4, h: 0.3, fontSize: 11, bold: true, color: C.mintDeep });
      d.box(s, x, y + 3.9, 6.15, 0.6, "Donanım", { fill: C.charcoal, size: 13 });
      d.text(s, "Uygulama dosya sunucusunu doğrudan çağırmaz: mesajlar çekirdek üzerinden gider.", { x, y: y + 4.6, w: 6.15, h: 0.4, fontSize: 11, italic: true, color: C.mutedOnLight });
    },
    pros: ["Güvenilir: çöken sürücü yeniden başlatılır.", "Güvenli, genişletilebilir; küçük çekirdek kolay doğrulanır."],
    cons: ["Daha yavaş: her hizmet isteği ek mesajlar ve mod geçişleri gerektirir."],
    examples: "Örnekler: Mach (1980'ler), MINIX 3, QNX (otomobiller, tıbbi cihazlar), seL4 (matematiksel olarak doğrulanmış).",
  });

  s = d.content({ kicker: "4. Yapı", title: "Çözümlü Örnek: Mikroçekirdeğin Bedeli" });
  d.card(s, MX, 1.65, 6.0, 5.2, { title: "Bir dosya okuması için mod geçişlerini sayalım", body: [
    { b: "Monolitik:", t: " uygulama → çekirdek → uygulama. 2 geçiş." },
    { b: "Mikroçekirdek:", t: " uygulama → çekirdek → dosya sunucusu → çekirdek → uygulama. 4 geçiş, artı 2 mesaj kopyası." },
    "Varsayalım (temsilî sayılar): bir geçiş = 0,1 µs, bir mesaj kopyası = 0,15 µs, faydalı iş = 1 µs.",
  ], bodySize: 16 });
  d.code(s, MX + 6.3, 1.65, 5.85, 3.2,
`Monolitik:
  T = 2 × 0,1 + 1,0 = 1,2 µs

Mikroçekirdek:
  T = 4 × 0,1 + 2 × 0,15 + 1,0 = 1,7 µs

Yavaşlama: 1,7 / 1,2 ≈ 1,42 (%42)`, 13.5);
  d.callout(s, MX + 6.3, 5.1, 5.85, 1.75, "Kısa ve sık işlemlerde ek yük baskın çıkar. Uzun işlemlerde (büyük bir dosyayı okumak) neredeyse önemsizdir. L4 gibi modern mikroçekirdekler mesajları ucuzlatmak için çok çalışır.", 13.5);

  structureSlide({
    kicker: "5. Yapı", title: "Modüler Çekirdek: Yüklenebilir Çekirdek Modülleri",
    lead: "Bir ana çekirdek ve sistem çalışırken eklenip çıkarılabilen modüller.",
    draw: (s, x, y, w, h) => {
      const cx = x + 3.1, cy = y + 2.25, rx = 2.35, ry = 1.75;
      const mods = ["Dosya sistemleri", "Aygıt sürücüleri", "Zamanlama sınıfları", "Ağ protokolleri", "Çalıştırılabilir biçimler", "Güvenlik modülleri", "USB / Bluetooth"];
      const pts = mods.map((m, i) => { const t = -Math.PI / 2 + i * 2 * Math.PI / mods.length; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]; });
      pts.forEach(p => s.addShape(P.shapes.LINE, { x: Math.min(p[0], cx), y: Math.min(p[1], cy), w: Math.abs(p[0] - cx) || 0.001, h: Math.abs(p[1] - cy) || 0.001, flipH: p[0] < cx !== p[1] < cy ? true : false, line: { color: C.slate, width: 1.25, dashType: "dash" } }));
      d.box(s, cx - 1.15, cy - 0.5, 2.3, 1.0, "Ana çekirdek", { fill: C.mint, color: C.dark, size: 16 });
      pts.forEach((p, i) => d.box(s, p[0] - 0.8, p[1] - 0.33, 1.6, 0.66, mods[i], { fill: C.light, size: 11 }));
      d.text(s, "Modüller gerektiğinde yüklenir ve çalışan çekirdeğe bağlanır.", { x, y: y + 4.45, w: 6.2, h: 0.4, fontSize: 11, italic: true, color: C.mutedOnLight });
    },
    pros: ["Monolitik gibi hızlı: modüller çekirdek modunda çalışır.", "Mikroçekirdek gibi esnek: sürücü gerektiğinde yüklenir."],
    cons: ["Hatalı bir modül de çekirdek modunda çalışır ve sistemi çökertebilir."],
    examples: "Örnekler: Linux (lsmod, insmod, rmmod), Solaris, modern BSD'ler. Bugün en yaygın tasarım.",
  });

  s = d.codeSlide({
    kicker: "Uygulama", title: "3. Örnek: C ile Yüklenebilir Bir Çekirdek Modülü",
    code: code("hello_module.c").split("\n").slice(7).join("\n"), size: 11, codeW: 7.1, sideTitle: "Nasıl kullanılır (Linux)",
    side: [
      "Çekirdeğin kendi derleme sistemiyle derleyin (code klasöründeki Makefile).",
      "pr_info() ekrana değil, çekirdek günlüğüne yazar.",
      "Yalnızca bir sanal makinede deneyin.",
    ],
    run: { h: 2.05, size: 10.5, text:
`$ make
$ sudo insmod hello_module.ko
$ lsmod | grep hello
$ sudo dmesg | tail -1
hello_module: loaded into the kernel
$ sudo rmmod hello_module` },
  });
  s.addNotes("Bu bir gösterim slaydıdır; öğrencilerin çekirdek modülü yazması gerekmez. Vurgulayın: main() yok, onun yerine init/exit fonksiyonları var; kod çekirdek modunda çalışır; çıktı ekrana değil çekirdek günlüğüne (dmesg) gider.");

  s = d.cardsSlide({
    kicker: "6. Yapı", title: "Hibrit Sistemler: Gerçek Sistemler Ne Yapar?",
    lead: "Saf tasarımlar nadirdir. Gerçek sistemler başarım, güvenlik ve kolaylık için birkaç yapıdan ödünç alır.",
    cards: [
      { title: "Windows (NT ailesi)", body: ["Mikroçekirdek fikirleriyle tasarlandı (ayrı alt sistemler).", "Hız için grafik dâhil çoğu hizmet çekirdek modunda çalışır.", "Modüller gibi yüklenebilir sürücüler."] },
      { title: "macOS ve iOS", body: ["Çekirdek \"XNU\" = Mach mikroçekirdeği + BSD UNIX parçaları, tek bir çekirdek olarak derlenir.", "Sürücüler yüklenebilir çekirdek uzantılarıdır."] },
      { title: "Android", body: ["Değiştirilmiş bir Linux çekirdeği (monolitik + modüller).", "Üstünde: donanım soyutlama katmanı, yerel kütüphaneler ve uygulamalar için Android çalışma ortamı."] },
    ],
    callout: "1992: Andrew Tanenbaum (MINIX, mikroçekirdek), monolitik olduğu için Linus Torvalds'a \"Linux artık eskidi\" dedi. Otuz yılı aşkın süre sonra iki tasarım da hâlâ her gün kullanılıyor.",
  });

  s = d.tableSlide({
    kicker: "Özet", title: "Yapılar Yan Yana",
    header: ["Yapı", "Çekirdek modunda", "Hız", "Güvenilirlik", "Örnek"],
    colW: [2.1, 3.2, 1.6, 2.35, 2.9],
    rows: [
      ["Basit", "her şey (koruma yok)", "yüksek", "çok düşük", "MS-DOS"],
      ["Monolitik", "tüm İS hizmetleri", "yüksek", "orta", "UNIX, Linux"],
      ["Katmanlı", "tüm katmanlar", "düşük", "yüksek", "THE (1968)"],
      ["Mikroçekirdek", "yalnızca küçük çekirdek", "daha düşük", "yüksek", "MINIX 3, QNX, seL4"],
      ["Modüler", "çekirdek + yüklenen modüller", "yüksek", "orta", "Linux, Solaris"],
      ["Hibrit", "değişir", "yüksek", "orta–yüksek", "Windows, macOS, Android"],
    ],
    fontSize: 14,
    callout: "Yinelenen ödünleşim: eklediğiniz her sınır (katman, mesaj, mod geçişi) güvenilirlik kazandırır, hızdan götürür.",
  });

  s = d.content({ kicker: "Kendiniz deneyin", title: "Kendi İşletim Sisteminizin İçine Bakın" });
  d.code(s, MX, 1.65, 6.6, 5.2,
`# Linux (laboratuvar PC'leri, WSL ya da sanal makine)
$ uname -r          # çekirdek sürümü nedir?
$ lsmod | head      # hangi modüller yüklü?
$ strace -c ls      # ls'nin sistem çağrılarını say

# Windows
> winver            # hangi Windows sürümü?
> driverquery       # yüklü sürücüleri listele
# Görev Yöneticisi > Performans: CPU süresi
# "kullanıcı" ve "çekirdek" süresine ayrılır`, 13);
  d.card(s, MX + 6.9, 1.65, 5.25, 5.2, { title: "Yanıtlanacak sorular", body: [
    "Makinenizde kaç çekirdek modülü yüklü?",
    "ls en sık hangi sistem çağrısını kullanıyor?",
    "ls gibi basit bir komut kabaca kaç sistem çağrısı yapar? (Test makinemizde: 76.)",
    "Görev Yöneticisi'ni açın ve çekirdek modunda çok zaman geçiren bir program bulun. Bunun nedeni ne olabilir?",
  ], bodySize: 14 });

  s = d.content({ kicker: "Kapanış", title: "2. Hafta — Temel Çıkarımlar" });
  d.bullets(s, [
    { b: "Tanım:", t: " işletim sistemi donanımı yönetir ve programlara daha basit, daha güvenli bir makine sunar; bellekte sürekli bulunan özü çekirdektir." },
    { b: "İki bakış:", t: " genişletilmiş makine (soyutlama, yukarıdan aşağıya) ve kaynak yöneticisi (çoğullama, aşağıdan yukarıya)." },
    { b: "Üç hedef:", t: " kolaylık, verimlilik, gelişebilirlik; PC'lerde, sunucularda, telefonlarda ve gömülü sistemlerde farklı ağırlıklarla." },
    { b: "Dört bileşen:", t: " donanım, işletim sistemi, uygulama programları, kullanıcılar." },
    { b: "Koruma donanım ister:", t: " çift mod (kullanıcı/çekirdek) ve kesmeler; bir sistem çağrısı, bir fonksiyon çağrısından çok daha pahalıdır." },
    { b: "Yapılar:", t: " basit, monolitik, katmanlı, mikroçekirdek, modüler, hibrit; her biri hız ile güvenilirlik arasında farklı bir uzlaşma." },
  ], { fontSize: 17, y: 1.7, h: 5.1 });

  d.quizSlide({ questions: [
    "İşletim sisteminin yaptığı zamanda çoğullamaya ve alanda çoğullamaya birer örnek verin.",
    "MS-DOS'taki bir programın hatası neden tüm bilgisayarı çökertebilirdi de Linux'taki bir programınki çökertemez?",
    "Bir sistem çağrısı 100 ns, bir fonksiyon çağrısı 1,5 ns sürüyor. 10⁶ sistem çağrısı, 10⁶ fonksiyon çağrısına göre ne kadar ek yük getirir?",
    "Mikroçekirdeğin monolitik çekirdeğe göre bir avantajını ve bir dezavantajını söyleyin.",
  ] });

  d.closing({ nextWeek: "Hizmetler, Sistem Çağrıları ve Süreçler", nextItems: [
    "İşletim sisteminin sunduğu hizmetler",
    "Ayrıntılı olarak sistem çağrıları: türleri, parametreleri, sistem çağrısı tablosu",
    "Süreç kavramı: yürütülmekte olan bir program",
    "Süreç durumları: yeni, hazır, çalışıyor, bekliyor, sonlandı",
  ] });

  const out = path.join(WEEK_DIR, "MBLP131_Hafta2.pptx");
  await d.save(out);
  console.log("slaytlar:", d.n, "->", out);
})();
