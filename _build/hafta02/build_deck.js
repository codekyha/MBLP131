// Hafta 2 sunumu (MBLP131, Türkçe): Tanımlar, Hedefler, Bileşenler, İşletim Sistemi Yapıları
// İngilizce referans: ../week02/build_deck.js (aynı slayt sırası ve diyagramlar)
const fs = require("fs");
const path = require("path");
const { Deck, C, F, MX } = require("../lib/deck");
const d = new Deck({ week: 2, lang: "tr", assets: path.join(__dirname, "../lib") });
const code = f => fs.readFileSync(path.join(__dirname, "code", f), "utf8");
const P = d.pres;

// lib/deck.js üst başlıkları (kicker) String.toUpperCase() ile büyütür; bu "i" harfini
// "I" yapar. Türkçe büyük harf (i -> İ) için başlığı önceden tr-TR yerel ayarıyla büyütüyoruz.
const TR = t => (t ? t.toLocaleUpperCase("tr-TR") : t);
{
  const h = d.header.bind(d), sec = d.sectionSlide.bind(d);
  d.header = (s, kicker, title, opts) => h(s, TR(kicker), title, opts);
  d.sectionSlide = o => sec(Object.assign({}, o, { kicker: TR(o.kicker) }));
}

// yardımcı: yapı slaydı = solda diyagram, sağda avantaj/dezavantaj
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
    kicker: "MBLP131  ·  HAFTA 2",
    title: "İşletim Sistemleri\nTemelleri",
    subtitle: "Hafta 2  ·  Tanımlar, Hedefler, Bileşenler ve İşletim Sistemi Yapıları",
    tagline: "İşletim sistemi tam olarak nedir, ne işe yarar ve nasıl inşa edilir?",
  });
  s.addNotes("Tekrar hoş geldiniz. Geçen hafta işin hikâyesini anlattık; bu hafta anatomisine bakıyoruz. İki saatlik dersin ilk saatinde tanımlar ve hedefler, ikinci saatinde donanımın temelleri ve işletim sistemi yapıları var; arada kısa bir mola vereceğiz.");

  // 2 ── Geçen hafta
  s = d.cardsSlide({
    kicker: "Geçen hafta", title: "Dört Fikirde 1. Hafta",
    cards: [
      { title: "Bilgisayar komut izler", body: "Girdi → işlem → çıktı; program, verinin yanında bellekte saklanır." },
      { title: "İlk o başlar", body: "İşletim sistemi ilk başlar ve diğer programlar çalışabilsin diye her şeyi yönetir." },
      { title: "Boş işlemci israftır", body: "Toplu işleme, çoklu programlama ve zaman paylaşımı, işlemciyi meşgul tutmak için icat edildi." },
      { title: "UNIX 1969, Linux 1991", body: "Küçük, birleştirilebilir araçlar; 9. haftadan itibaren uygulamalı olarak Linux kullanacağız." },
    ], cols: 4,
    callout: "Bugün gayriresmî tanımın yerine kesin bir tanım koyuyor ve işletim sistemlerinin gerçekte nasıl inşa edildiğine bakıyoruz.",
  });

  // 3 ── Gündem
  s = d.content({ kicker: "Hafta 2", title: "Bugünün Gündemi" });
  const agenda = [
    ["1", "Tanımlar", "İşletim sistemi tam olarak nedir? İki klasik bakış açısı."],
    ["2", "Hedefler", "Kullanım kolaylığı, verimlilik, gelişebilirlik ve aralarındaki ödünleşimler."],
    ["3", "Bileşenler", "Donanım, işletim sistemi, uygulamalar, kullanıcılar; kesmeler, bellek, ikili mod."],
    ["4", "Yapılar", "Basit, monolitik, katmanlı, mikroçekirdek, modüler, hibrit."],
    ["5", "Uygulama", "Gerçek C kodu ve strace ile sistem çağrılarını izlemek."],
  ];
  agenda.forEach((a, i) => {
    const y = 1.7 + i * 1.0;
    d.box(s, MX, y, 0.8, 0.8, a[0], { fill: C.mint, size: 20, font: F.title });
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x: MX + 1.0, y, w: 11.15, h: 0.8, fill: { color: C.light }, rectRadius: 0.05, line: { type: "none" } });
    d.text(s, [{ text: a[1] + "   ", options: { bold: true, fontFace: F.title, color: C.charcoal, fontSize: 17 } }, { text: a[2], options: { fontSize: 15 } }], { x: MX + 1.3, y, w: 10.7, h: 0.8, valign: "middle" });
  });

  // ───────────────────────── BÖLÜM 1: TANIMLAR
  d.sectionSlide({ kicker: "Bölüm 1", title: "İşletim Sistemi Tam Olarak Nedir?", subtitle: "Gayriresmî bir tariften kesin bir tanıma." });

  s = d.content({ kicker: "Tanımlar", title: "Karşınıza Çıkacak Üç Tanım" });
  const defs = [
    ["Aracı", "Bilgisayarın kullanıcısı ile bilgisayar donanımı arasında aracılık eden (intermediary) bir program.", "— Silberschatz, Galvin ve Gagne"],
    ["Çekirdek", "Bilgisayarda her an çalışan tek program: çekirdek (kernel). Geri kalan her şey ya bir sistem programı ya da bir uygulama programıdır.", "— Silberschatz, Galvin ve Gagne"],
    ["Yönetici", "Programların yürütülmesini denetleyen ve bilgisayarın kaynaklarını (işlemci, bellek, dosyalar, aygıtlar) yöneten yazılım.", "— Stallings (özetle)"],
  ];
  defs.forEach((df, i) => {
    const x = MX + i * 4.12;
    d.card(s, x, 1.7, 3.9, 3.7, { title: df[0], body: df[1], bodySize: 15 });
    d.text(s, df[2], { x: x + 0.25, y: 4.85, w: 3.4, h: 0.4, fontSize: 11, italic: true, color: C.mutedOnLight });
  });
  d.callout(s, MX, 5.7, 12.15, 1.15, "Bu dersteki çalışma tanımımız: işletim sistemi, donanımı yöneten ve programlara üzerinde çalışabilecekleri daha basit, daha güvenli bir makine sunan yazılım katmanıdır. Bellekte sürekli bulunan özüne çekirdek (kernel) denir.", 14.5);
  s.addNotes("Üç bakış açısını vurgulayın: konum (kullanıcı ile donanım arasında), süreklilik (her an çalışan program: çekirdek) ve işlev (kaynakları yönetmek). Hiçbiri yanlış değildir; her biri farklı bir yönü öne çıkarır.");

  s = d.compareSlide({
    kicker: "İki klasik bakış", title: "Genişletilmiş Makine ve Kaynak Yöneticisi",
    lead: "Andrew Tanenbaum işletim sistemini iki yönden anlatır: yukarıdan aşağıya ve aşağıdan yukarıya.",
    left: { title: "Yukarıdan aşağıya: genişletilmiş makine", items: [
      "Karmaşık donanımı temiz soyutlamaların (abstraction) arkasına gizler.",
      "Disk sektörlerini ve manyetik izleri değil, dosyaları görürsünüz.",
      "Kesme hatlarını ve yazmaçları değil, süreçleri görürsünüz.",
      "Hedef: bilgisayarı programlamayı ve kullanmayı kolaylaştırmak.",
    ] },
    right: { title: "Aşağıdan yukarıya: kaynak yöneticisi", items: [
      "Birçok program ve kullanıcı tek bir makine için yarışır.",
      { b: "Zaman çoğullama (time multiplexing):", t: " sırayla kullanım (işlemci, yazıcı)." },
      { b: "Alan çoğullama (space multiplexing):", t: " parçalara bölerek paylaşım (bellek, disk alanı)." },
      "Hedef: kaynakları adil, verimli ve güvenli biçimde dağıtmak.",
    ] },
    callout: "İki bakış da aynı yazılımı anlatır. Bu dersin 3–7. haftaları çoğunlukla kaynak yöneticisi bakışıdır: süreçler, işlemci, bellek, dosyalar.",
  });

  s = d.content({ kicker: "Tanımlar", title: "Çekirdek, Sistem Programları ve Uygulamalar", lead: "İşletim sistemiyle birlikte gelen her şey \"çekirdek\" değildir." });
  {
    const x = MX, y = 2.35, w = 6.6;
    d.box(s, x, y, w, 0.85, "Uygulama programları", { sub: "tarayıcı, kelime işlemci, oyun, kendi C programınız", fill: C.light });
    d.box(s, x, y + 0.95, w, 0.85, "Sistem programları", { sub: "kabuk, dosya yöneticisi, derleyici, ls, cp, Görev Yöneticisi", fill: "D7E9E6" });
    d.box(s, x, y + 1.9, w, 0.85, "Çekirdek (kernel)", { sub: "süreç, bellek, dosya ve aygıt yönetimi", fill: C.mint, color: C.dark });
    d.box(s, x, y + 2.85, w, 0.85, "Donanım", { sub: "işlemci, bellek, diskler, ağ kartı, ekran", fill: C.charcoal });
    d.text(s, "Her katman yalnızca altındaki katmanın hizmetlerini kullanır.", { x, y: y + 3.85, w, h: 0.4, fontSize: 12, italic: true, color: C.mutedOnLight });
  }
  d.card(s, MX + 6.9, 2.35, 5.25, 4.5, { title: "Kim kimdir?", body: [
    { b: "Çekirdek:", t: " her zaman bellektedir, ayrıcalıklı bir modda çalışır, donanımla doğrudan konuşur." },
    { b: "Sistem programları:", t: " işletim sistemiyle gelir ama normal program olarak çalışır; sistemi kullanılabilir kılar." },
    { b: "Uygulamalar:", t: " asıl işinizi yapmak için kurduğunuz her şey." },
    "Linux, tam anlamıyla yalnızca çekirdektir; bir \"Linux dağıtımı\" buna (çoğu GNU'dan gelen) sistem programlarını ekler.",
  ], bodySize: 13.5 });

  s = d.cardsSlide({
    kicker: "Tartışma", title: "Bu, İşletim Sisteminin Parçası mı?",
    lead: "Tek bir resmî yanıt yok; asıl mesele de bu. Önce oylayın, sonra tartışın.",
    cards: [
      { title: "Web tarayıcısı?", body: "1998'de ABD hükümeti Microsoft'a, kısmen Internet Explorer'ı Windows'a gömdüğü için dava açtı. Tarayıcı \"Windows'un parçası\" mı? Avukatlar bunu yıllarca tartıştı." },
      { title: "Grafik masaüstü?", body: "Windows'ta sisteme sıkıca bütünleşiktir. Linux'ta ise çekirdeğin üzerinde çalışan, değiştirilebilir bir programdır (GNOME, KDE, …)." },
      { title: "Uygulama mağazası?", body: "Telefonda çoğu kullanıcı uygulama mağazasını \"sistemin kendisi\" sanır. Teknik olarak özel izinlere sahip bir uygulamadır." },
    ],
    callout: "Kullanışlı bir kural: çekirdek kesinlikle işletim sistemidir. Çekirdeğin ötesinde \"işletim sistemi\", üreticinin standart sistem olarak sunduğu her şeydir.",
    bodySize: 14.5,
  });

  // ───────────────────────── BÖLÜM 2: HEDEFLER
  d.sectionSlide({ kicker: "Bölüm 2", title: "İşletim Sistemi Ne İşe Yarar?", subtitle: "Üç tasarım hedefi ve bu hedeflerin neden farklı yönlere çektiği." });

  s = d.cardsSlide({
    kicker: "Tasarım hedefleri", title: "Her İşletim Sisteminin Üç Hedefi",
    lead: "William Stallings bir işletim sisteminin amaçlarını üç kelimeyle özetler.",
    cards: [
      { title: "1. Kullanım kolaylığı", body: ["Bilgisayarı kullanmayı ve programlamayı kolaylaştırır.", "Dosyalar, pencereler, kabuk, basit sistem çağrıları.", "Kullanıcıların donanımı bilmesi gerekmez."] },
      { title: "2. Verimlilik", body: ["Donanımı iyi kullanır: işlemci meşgul, bellek yararlı işle dolu, diskler beklemiyor.", "Düşük ek yük (overhead): işletim sisteminin kendisi az kaynak tüketmeli."] },
      { title: "3. Gelişebilirlik", body: ["Yeni donanım (SSD, GPU, 5G modem) ve yeni hizmetler eklenebilmeli…", "…mevcut programlar bozulmadan.", "İşletim sistemi yapısının seçimini belirler (Bölüm 4)."] },
    ],
    callout: "İleride ele alacağımız her yapı, bu üç hedef arasında farklı bir uzlaşmadır.",
  });

  s = d.tableSlide({
    kicker: "Ödünleşimler", title: "Hangi Hedef Daha Önemli? Makineye Bağlı",
    header: ["Sistem türü", "Ana öncelik", "Neden"],
    colW: [2.8, 2.7, 6.65],
    rows: [
      ["Kişisel bilgisayar", "Kullanım kolaylığı", "Her şeyin \"öylece çalışmasını\" isteyen tek bir kullanıcı; işlemci zaten çoğu zaman boştadır."],
      ["Sunucu / bulut", "Verimlilik", "Binlerce kullanıcı; %1 daha fazla iş hacmi, yüzlerce makine daha az demek olabilir."],
      ["Akıllı telefon", "Verimlilik (enerji)", "Pil ömrü: işletim sistemi uygulamaları ve işlemciyi agresif biçimde uyutur."],
      ["Gömülü / IoT", "Verimlilik (boyut, maliyet)", "Bir çamaşır makinesi denetleyicisinin birkaç kilobaytlık belleği olabilir; hiç işletim sistemi olmayabilir."],
      ["Gerçek zamanlı (araç frenleri, dronlar)", "Öngörülebilirlik", "Geç gelen yanıt yanlış yanıttır: son tarihler (deadline) her zaman karşılanmalıdır."],
    ],
    fontSize: 14.5,
  });

  s = d.content({ kicker: "Ödünleşimler", title: "Kolaylık ve Verimlilik: Çözümlü Örnek" });
  d.card(s, MX, 1.65, 6.6, 5.2, { bodySize: 16, title: "Durum", body: [
    "Bir program bir dosyadan 1 milyon sayı okumalıdır.",
    { b: "Kolay yol:", t: " işletim sisteminden her seferinde bir sayı istemek → 1 milyon sistem çağrısı." },
    { b: "Verimli yol:", t: " 4096 baytlık bloklar istemek (her biri ≈ 1000 sayı) → yaklaşık 1000 sistem çağrısı." },
    "Bir sistem çağrısının saf ek yükü yaklaşık 0,1 µs ise (bunu bugün ölçeceğiz):",
  ], bodySize: 16 });
  d.code(s, MX + 6.9, 1.65, 5.25, 3.0,
`teker teker:
  1 000 000 × 0.1 µs = 100 ms

1000'lik bloklarla:
      1 000 × 0.1 µs = 0.1 ms

=> 1000 kat daha az ek yük`, 14);
  d.callout(s, MX + 6.9, 4.9, 5.25, 1.95, "C'nin stdio gibi kütüphaneleri ikisini birden verir: fgetc() fonksiyonunu karakter karakter çağırırsınız, ama kütüphane arka planda büyük bloklar okur.", 14);

  // ───────────────────────── BÖLÜM 3: BİLEŞENLER
  d.sectionSlide({ kicker: "Bölüm 3", title: "Bilgisayar Sisteminin Bileşenleri", subtitle: "Donanım, işletim sistemi, uygulama programları ve kullanıcılar." });

  s = d.content({ kicker: "Bileşenler", title: "Bilgisayar Sisteminin Dört Bileşeni" });
  {
    const x = MX, y = 1.7, w = 7.4;
    const users = ["Kullanıcı 1", "Kullanıcı 2", "Kullanıcı 3", "…"];
    users.forEach((u, i) => d.box(s, x + i * 1.9, y, 1.7, 0.6, u, { fill: C.light, size: 12 }));
    const apps = ["Derleyici", "Tarayıcı", "Metin düzenleyici", "Veritabanı"];
    apps.forEach((u, i) => d.box(s, x + i * 1.9, y + 1.05, 1.7, 0.75, u, { fill: "D7E9E6", size: 12 }));
    d.box(s, x, y + 2.25, w, 0.9, "İşletim sistemi", { fill: C.mint, color: C.dark, size: 16 });
    d.box(s, x, y + 3.6, w, 0.9, "Bilgisayar donanımı", { sub: "işlemci · bellek · G/Ç aygıtları", fill: C.charcoal, size: 16 });
    [0, 1, 2, 3].forEach(i => d.arrow(s, x + 0.85 + i * 1.9, y + 0.62, x + 0.85 + i * 1.9, y + 1.03, { w: 1.5 }));
    [0, 1, 2, 3].forEach(i => d.arrow(s, x + 0.85 + i * 1.9, y + 1.82, x + 0.85 + i * 1.9, y + 2.23, { w: 1.5 }));
    d.arrow(s, x + w / 2, y + 3.17, x + w / 2, y + 3.58, { w: 1.5, both: true });
  }
  d.card(s, MX + 7.7, 1.7, 4.45, 5.15, { title: "Roller", body: [
    { b: "Donanım", t: " temel hesaplama kaynaklarını sağlar." },
    { b: "Uygulama programları", t: " bu kaynakları kullanıcıların sorunlarını çözmek için kullanır." },
    { b: "Kullanıcılar:", t: " insanlar, ama aynı zamanda başka makineler ve programlar." },
    { b: "İşletim sistemi", t: " donanımı denetler ve onun uygulamalar ile kullanıcılar arasında kullanımını eşgüdümler." },
  ], bodySize: 14 });

  s = d.content({ kicker: "Donanım görünümü", title: "Kasanın İçi: Yol Üzerinde İşlemci, Bellek ve Aygıtlar" });
  {
    const by = 1.85; // üstte sistem yolu
    s.addShape(P.shapes.RECTANGLE, { x: MX, y: by, w: 12.15, h: 0.22, fill: { color: C.slate }, line: { type: "none" } });
    d.text(s, "sistem yolu (system bus): veri, adres ve denetim sinyallerini taşır", { x: MX, y: by - 0.32, w: 8, h: 0.3, fontSize: 11, italic: true, color: C.slate });
    const y = by + 0.65;
    const top = [["İşlemci", "getir–çöz–yürüt", C.mint, C.dark], ["Ana bellek", "RAM", C.charcoal, C.white]];
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
  d.callout(s, MX, 5.9, 12.15, 0.95, "Her aygıt denetleyicisinin küçük bir yerel tamponu vardır ve işlemciyle paralel çalışır. İşletim sistemi her denetleyici için bir aygıt sürücüsü (device driver) içerir: sürücü denetleyicinin dilini konuşur, böylece işletim sisteminin geri kalanının bunu bilmesi gerekmez.", 13);

  s = d.content({ kicker: "Donanım görünümü", title: "Kesmeler: Aygıt İşlemcinin Dikkatini Nasıl Çeker?", lead: "İşlemci klavyeye sürekli \"yeni bir şey var mı?\" diye sormaz; klavye işlemciye haber verir." });
  {
    const steps = [
      ["1. Aygıt bitirir", "Disk denetleyicisi veriyi kendi tamponuna kopyalamıştır."],
      ["2. Sinyal", "İşlemcinin bir kesme (interrupt) hattını etkinleştirir."],
      ["3. Kaydet ve atla", "İşlemci yaptığı işi kaydeder ve kesme vektöründe yazılı işleyiciye atlar."],
      ["4. İşle", "İşletim sisteminin kesme işleyicisi (sürücünün parçası) olayı işler."],
      ["5. Devam et", "Kaydedilen durum geri yüklenir; kesilen program hiçbir şey olmamış gibi sürer."],
    ];
    const w = 2.25, gap = 0.22;
    steps.forEach((st, i) => {
      const x = MX + i * (w + gap);
      d.card(s, x, 2.35, w, 2.75, { title: st[0], body: st[1], bodySize: 14, titleSize: 14.5 });
      if (i < steps.length - 1) d.arrow(s, x + w + 0.01, 3.7, x + w + gap - 0.01, 3.7, { w: 1.5 });
    });
  }
  d.callout(s, MX, 5.4, 12.15, 1.45, "Modern işletim sistemleri kesme güdümlüdür (interrupt-driven): çalışan bir program yoksa ve hiçbir aygıt ilgi beklemiyorsa işletim sistemi yalnızca bekler. Her tuş vuruşu, her ağ paketi ve biten her disk okuması bir kesme olarak gelir; saniyede binlerce kez.", 14);

  s = d.tableSlide({
    kicker: "Donanım görünümü", title: "Bellek Hiyerarşisi: Hızlı ve Küçük, Yavaş ve Büyük",
    header: ["Düzey", "Tipik boyut", "Tipik erişim süresi", "Yazmaç erişimi 1 saniye sürseydi…"],
    colW: [2.6, 2.4, 2.9, 4.25],
    rows: [
      ["İşlemci yazmaçları", "< 1 KB", "≈ 0,3 ns", "1 saniye"],
      ["Önbellek (L1–L3)", "birkaç MB", "1 – 40 ns", "3 saniye – 2 dakika"],
      ["Ana bellek (RAM)", "8 – 64 GB", "≈ 100 ns", "≈ 5 dakika"],
      ["SSD", "0,5 – 4 TB", "≈ 50 µs", "≈ 2 gün"],
      ["Sabit disk (HDD)", "1 – 20 TB", "≈ 5 ms", "≈ 6 ay"],
    ],
    fontSize: 16,
    callout: "Yazmaçlar, önbellek ve RAM uçucudur (güç kesilince silinir); SSD ve diskler kalıcıdır. İşletim sistemi verileri düzeyler arasında sürekli taşır; bu, 6. ve 7. haftaların konusudur.",
  });
  s.addNotes("Ölçekleme sütunu: her süre 1/(0,3 ns) ≈ 3,3 × 10^9 ile çarpılır. RAM: 100 ns × 3,3e9 ≈ 330 s ≈ 5,5 dk; SSD 50 µs → 1,7e5 s ≈ 2 gün; HDD 5 ms → 1,7e7 s ≈ 190 gün. Değerler büyüklük mertebesidir ve günümüz donanımı için tipiktir.");

  s = d.content({ kicker: "Koruma", title: "İkili Mod: Kullanıcı Modu ve Çekirdek Modu", lead: "Kimin neyi yapabileceğini, işlemcinin içindeki bir mod biti (mode bit) ile donanımın kendisi denetler." });
  {
    const x = MX, y = 2.35;
    d.box(s, x, y, 6.6, 1.2, "Kullanıcı modu   (mod biti = 1)", { sub: "sizin programlarınız: yalnızca kısıtlı komutlar", fill: C.light, size: 16 });
    d.box(s, x, y + 2.55, 6.6, 1.2, "Çekirdek modu   (mod biti = 0)", { sub: "işletim sistemi çekirdeği: her komut serbest", fill: C.charcoal, size: 16 });
    d.arrow(s, x + 1.6, y + 1.25, x + 1.6, y + 2.5, { color: C.mint, w: 2.5 });
    d.arrow(s, x + 5.0, y + 2.5, x + 5.0, y + 1.25, { color: C.mint, w: 2.5 });
    d.text(s, "sistem çağrısı / kesme\n(tuzak: biti 0 yap)", { x: x + 1.75, y: y + 1.45, w: 2.4, h: 0.8, fontSize: 12, color: C.mintDeep, bold: true });
    d.text(s, "kullanıcıya dönüş\n(biti 1 yap)", { x: x + 5.15, y: y + 1.45, w: 1.6, h: 0.8, fontSize: 12, color: C.mintDeep, bold: true });
  }
  d.card(s, MX + 6.9, 2.35, 5.25, 4.5, { title: "Neden önemli?", body: [
    { b: "Ayrıcalıklı komutlar", t: " (aygıtla konuşmak, bellek korumasını değiştirmek, işlemciyi durdurmak) yalnızca çekirdek modunda çalışır." },
    "Bir kullanıcı programı bunlardan birini denerse donanım işletim sistemine tuzak (trap) üretir; sistem genellikle programı sonlandırır.",
    "Böylece hatalı ya da kötü niyetli bir uygulama makineyi ele geçiremez.",
    "x86 işlemcilerde modlara halka (ring) denir: Linux ve Windows halka 0 (çekirdek) ile halka 3'ü (kullanıcı) kullanır.",
  ], bodySize: 13 });

  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 1: Çekirdeği Çağıran Bir Program",
    code: code("hello_syscall.c"), size: 11.5, codeW: 7.1, sideTitle: "Ne oluyor?",
    side: [
      "printf() bir kütüphane fonksiyonudur: metni kullanıcı modunda biçimlendirir.",
      "write() bir sistem çağrısıdır: çekirdek moduna geçer ve baytları ekrana çekirdek gönderir.",
      "strace, bir programın yaptığı tüm sistem çağrılarını gösterir:",
    ],
    run: { h: 1.75, size: 10.5, text:
`$ strace ./hello_syscall
write(1, "Hello from printf!\\n", 19) = 19
write(1, "Hello from write()!\\n", 20) = 20
exit_group(0)                    = ?` },
  });
  s.addNotes("strace'ten çıkan temel gözlem: printf de sonunda bir write() sistem çağrısına dönüşür. Kütüphane fonksiyonları kolaylık sağlayan sarmalayıcılardır; çekirdeğe yalnızca sistem çağrıları geçer. Öğrenciler bunu 9. haftada laboratuvar bilgisayarlarında ya da WSL'de deneyebilir.");

  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 2: Çekirdeğe Bir Gidiş Ne Kadar Pahalı?",
    code: code("syscall_cost_excerpt.c"), size: 12, codeW: 7.1, sideTitle: "Deney",
    side: [
      "Sıradan bir fonksiyonu bir milyon kez çağır.",
      "Sonra bir milyon küçük sistem çağrısı (getpid) yap.",
      "Çağrı başına ortalama süreleri karşılaştır.",
      "Kesin sayılar makinenize bağlıdır; asıl ders orandadır.",
    ],
    run: { h: 1.5, size: 10.5, text:
`$ ./syscall_cost
ordinary function call :   1.5 ns
system call (getpid)   : 116.1 ns
system call is about 76 times slower` },
  });
  s.addNotes("Bu değerler derleme ortamımızda (bir sanal makinede) ölçüldü. Doğrudan donanım üzerinde çalışan Linux'ta bir getpid sistem çağrısı çoğunlukla 50–150 ns sürer. Mod geçişleri bedava değildir; bu tek gerçek, Bölüm 4'ün büyük kısmını (mikroçekirdeklerin neden daha yavaş olduğunu) açıklar.");

  // ── Mola
  s = d.sectionSlide({ kicker: "Ara", title: "10 Dakika Mola", subtitle: "Sırada: işletim sistemleri nasıl inşa edilir? MS-DOS'tan mikroçekirdeklere." });

  // ───────────────────────── BÖLÜM 4: YAPILAR
  d.sectionSlide({ kicker: "Bölüm 4", title: "İşletim Sistemi Yapıları", subtitle: "Aynı hedefler, çok farklı binalar." });

  s = d.content({ kicker: "Yapılar", title: "Yapı Neden Önemli?", lead: "Linux çekirdeği 30 milyonu aşkın kod satırından oluşur. Bu kadar büyük bir şeyi nasıl düzenlersiniz?" });
  [
    ["Basit", "Neredeyse hiç yapı yok (MS-DOS)."],
    ["Monolitik", "Tek büyük bir çekirdek programı (UNIX, Linux)."],
    ["Katmanlı", "Katı katmanlar; her biri yalnızca altındakini kullanır (THE)."],
    ["Mikroçekirdek", "Küçücük bir çekirdek; hizmetler kullanıcı programı olarak çalışır (Mach, MINIX 3, QNX)."],
    ["Modüler", "Bir temel çekirdek ve yüklenebilir modüller (Linux)."],
    ["Hibrit", "Gerçek sistemler bunları karıştırır (Windows, macOS, Android)."],
  ].forEach((r, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    d.card(s, MX + col * 4.13, 2.35 + row * 2.3, 3.9, 2.1, { title: r[0], body: r[1], bodySize: 15, titleSize: 18 });
  });

  structureSlide({
    kicker: "Yapı 1", title: "Basit Yapı: MS-DOS",
    lead: "1981'deki IBM PC'nin çok küçük belleğine sığmak için yazıldı; hiçbir zaman gerçekten katmanlı tasarlanmadı.",
    draw: (s, x, y, w, h) => {
      const rows = [["Uygulama programı", C.light], ["Bellekte kalıcı sistem programı", "D7E9E6"], ["MS-DOS aygıt sürücüleri", C.mint], ["ROM BIOS aygıt sürücüleri", C.charcoal]];
      const bh = 0.8, bw = 4.4;
      rows.forEach((r, i) => d.box(s, x, y + 0.2 + i * 1.05, bw, bh, r[0], { fill: r[1], color: r[1] === C.mint ? C.dark : undefined, size: 13 }));
      // atlama okları: uygulamadan doğrudan BIOS'a / donanıma
      d.arrow(s, x + bw + 0.15, y + 0.6, x + bw + 0.15, y + 3.55, { color: C.red, w: 2 });
      d.arrow(s, x + bw + 0.55, y + 0.6, x + bw + 0.55, y + 2.5, { color: C.red, w: 2 });
      d.text(s, "Uygulamalar katmanları atlayıp donanıma doğrudan erişebiliyordu.", { x, y: y + 4.45, w: w - 0.2, h: 0.6, fontSize: 12, italic: true, color: C.red });
    },
    pros: ["Çok küçük ve hızlı.", "Sınırlı donanım için yazması kolay."],
    cons: ["Koruma yok: tek hatalı program tüm sistemi çökertebilirdi.", "Intel 8088'de ikili mod yoktu; işletim sistemi buna engel olamazdı."],
    examples: "Ders: koruma, donanım desteği (ikili mod) ve bunu kullanan bir işletim sistemi gerektirir.",
  });

  structureSlide({
    kicker: "Yapı 2", title: "Monolitik Çekirdek: UNIX ve Linux",
    lead: "Tüm işletim sistemi hizmetleri, çekirdek modunda tek bir adres uzayında çalışan büyük bir programdadır.",
    draw: (s, x, y, w, h) => {
      const apps = ["kabuk", "tarayıcı", "derleyici", "uygulamanız"];
      apps.forEach((a, i) => d.box(s, x + i * 1.55, y + 0.1, 1.4, 0.6, a, { fill: C.light, size: 12 }));
      d.text(s, "kullanıcı modu", { x: x + 6.2 - 1.6, y: y + 0.8, w: 1.6, h: 0.3, fontSize: 10, italic: true, color: C.mutedOnLight, align: "right" });
      s.addShape(P.shapes.LINE, { x, y: y + 1.12, w: 6.15, h: 0, line: { color: C.slate, width: 1, dashType: "dash" } });
      d.text(s, "sistem çağrısı arayüzü", { x, y: y + 1.17, w: 3, h: 0.3, fontSize: 10, italic: true, color: C.slate });
      s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y: y + 1.5, w: 6.15, h: 2.45, fill: { color: C.charcoal }, rectRadius: 0.05, line: { type: "none" } });
      d.text(s, "TEK ÇEKİRDEK — çekirdek modu", { x: x + 0.2, y: y + 1.58, w: 5, h: 0.35, fontSize: 12, bold: true, color: C.mint });
      const parts = ["zamanlayıcı", "bellek yöneticisi", "dosya sistemleri", "ağ yığını", "aygıt sürücüleri", "sinyaller, IPC"];
      parts.forEach((p, i) => d.box(s, x + 0.2 + (i % 3) * 1.95, y + 2.05 + Math.floor(i / 3) * 0.9, 1.8, 0.75, p, { fill: C.slate, size: 12 }));
      d.box(s, x, y + 4.1, 6.15, 0.6, "Donanım", { fill: C.dark, size: 13 });
    },
    pros: ["Hızlı: hizmetler birbirini sıradan fonksiyon çağrıları gibi doğrudan çağırır.", "Sistem çağrısı başına yalnızca iki mod geçişi."],
    cons: ["Devasa ve bakımı zor.", "Herhangi bir sürücüdeki hata bütün çekirdeği çökertebilir (\"çekirdek paniği\", kernel panic)."],
    examples: "Örnekler: özgün UNIX (1970'ler), Linux, geleneksel BSD.",
  });

  structureSlide({
    kicker: "Yapı 3", title: "Katmanlı Yaklaşım",
    lead: "İşletim sistemi katmanlara bölünür; N. katman yalnızca altındaki katmanları kullanabilir. 0. katman donanımdır.",
    draw: (s, x, y, w, h) => {
      const L = [["5", "Kullanıcı programları / operatör"], ["4", "G/Ç aygıtları için tamponlama"], ["3", "Operatör konsolu sürücüsü"], ["2", "Bellek yönetimi"], ["1", "İşlemci zamanlaması"], ["0", "Donanım"]];
      L.forEach((l, i) => {
        const inset = i * 0.18;
        d.box(s, x + inset, y + 0.05 + i * 0.75, 6.1 - 2 * inset, 0.65, `Katman ${l[0]}:  ${l[1]}`, { fill: i === 5 ? C.charcoal : i === 0 ? C.light : i % 2 ? "D7E9E6" : C.mint, color: i === 5 ? C.white : C.dark, size: 13 });
      });
      d.text(s, "Dijkstra'nın THE sistemine (1968) gevşek biçimde dayanır.", { x, y: y + 4.6, w: 6, h: 0.35, fontSize: 12, italic: true, color: C.mutedOnLight });
    },
    pros: ["Katman katman inşa etmek ve hata ayıklamak kolay.", "Her katman ayrı ayrı doğrulanabilir."],
    cons: ["Sırayı belirlemek zor (bellek mi zamanlayıcıya muhtaç, yoksa tersi mi?).", "Her istek birçok katmandan geçer → yavaş."],
    examples: "Saf katmanlı yapı bugün nadirdir, ama fikir her işletim sisteminin içinde yaşar (ör. ağ yığını katmanlıdır).",
  });

  structureSlide({
    kicker: "Yapı 4", title: "Mikroçekirdek: Çekirdeği Küçücük Tut",
    lead: "Çekirdek modunda yalnızca asgari olan kalır; geri kalan her şey sıradan kullanıcı modu sunucuları olarak çalışır.",
    draw: (s, x, y, w, h) => {
      const srv = [["Uygulama", C.light], ["Dosya sunucusu", "D7E9E6"], ["Aygıt sürücüsü", "D7E9E6"], ["Ağ sunucusu", "D7E9E6"]];
      srv.forEach((r, i) => d.box(s, x + i * 1.55, y + 0.3, 1.42, 1.0, r[0], { fill: r[1], size: 12 }));
      d.text(s, "kullanıcı modu", { x: x + 4.55, y: y + 1.35, w: 1.6, h: 0.3, fontSize: 10, italic: true, color: C.mutedOnLight, align: "right" });
      s.addShape(P.shapes.LINE, { x, y: y + 1.7, w: 6.15, h: 0, line: { color: C.slate, width: 1, dashType: "dash" } });
      d.box(s, x, y + 2.75, 6.15, 0.95, "Mikroçekirdek", { sub: "mesaj aktarımı · temel zamanlama · temel bellek", fill: C.mint, color: C.dark, size: 15 });
      d.arrow(s, x + 0.55, y + 1.32, x + 0.55, y + 2.72, { color: C.mintDeep, w: 2 });
      d.arrow(s, x + 2.0, y + 2.72, x + 2.0, y + 1.32, { color: C.mintDeep, w: 2 });
      d.text(s, "① istek", { x: x + 0.62, y: y + 1.85, w: 1.2, h: 0.3, fontSize: 11, bold: true, color: C.mintDeep });
      d.text(s, "② iletilir", { x: x + 2.07, y: y + 2.25, w: 1.4, h: 0.3, fontSize: 11, bold: true, color: C.mintDeep });
      d.box(s, x, y + 3.9, 6.15, 0.6, "Donanım", { fill: C.charcoal, size: 13 });
      d.text(s, "Uygulama dosya sunucusunu hiçbir zaman doğrudan çağırmaz: mesajlar çekirdek üzerinden gider.", { x, y: y + 4.6, w: 6.15, h: 0.4, fontSize: 10.5, italic: true, color: C.mutedOnLight });
    },
    pros: ["Güvenilir: çöken sürücü yalnızca çöken bir programdır; yeniden başlatılır.", "Güvenli, kolay genişletilir; küçük çekirdek kolay doğrulanır."],
    cons: ["Daha yavaş: her hizmet isteği ek mesajlar ve mod geçişleri gerektirir."],
    examples: "Örnekler: Mach (1980'ler), MINIX 3, QNX (otomobiller, tıbbi cihazlar), seL4 (matematiksel olarak doğrulanmış).",
  });

  s = d.content({ kicker: "Yapı 4", title: "Çözümlü Örnek: Mikroçekirdeğin Bedeli" });
  d.card(s, MX, 1.65, 6.0, 5.2, { title: "Tek bir dosya okumasında mod geçişlerini sayalım", body: [
    { b: "Monolitik:", t: " uygulama → çekirdek → uygulama.  2 geçiş." },
    { b: "Mikroçekirdek:", t: " uygulama → çekirdek → dosya sunucusu → çekirdek → uygulama.  4 geçiş ve 2 mesaj kopyası." },
    "Varsayalım (temsilî sayılar): bir geçiş = 0,1 µs, bir mesaj kopyası = 0,15 µs, yararlı iş = 1 µs.",
  ], bodySize: 16, titleSize: 15 });
  d.code(s, MX + 6.3, 1.65, 5.85, 3.2,
`Monolitik:
  T = 2(0.1) + 1.0          = 1.2 µs

Mikroçekirdek:
  T = 4(0.1) + 2(0.15) + 1.0 = 1.7 µs

Yavaşlama: 1.7 / 1.2 ≈ 1.42  (%42)`, 13.5);
  d.callout(s, MX + 6.3, 5.1, 5.85, 1.75, "Kısa ve sık işlemlerde ek yük baskındır. Uzun işlemlerde (büyük bir dosyayı okumak) pek fark etmez. L4 gibi modern mikroçekirdekler mesajları ucuzlatmak için çok çalışır.", 13.5);

  structureSlide({
    kicker: "Yapı 5", title: "Modüler Çekirdek: Yüklenebilir Çekirdek Modülleri",
    lead: "Bir temel çekirdek ve sistem çalışırken eklenip çıkarılabilen modüller.",
    draw: (s, x, y, w, h) => {
      const cx = x + 3.1, cy = y + 2.25, rx = 2.35, ry = 1.75;
      const mods = ["Dosya sistemleri", "Aygıt sürücüleri", "Zamanlama sınıfları", "Ağ protokolleri", "Yürütülebilir biçimler", "Güvenlik modülleri", "USB / Bluetooth"];
      const pts = mods.map((m, i) => { const t = -Math.PI / 2 + i * 2 * Math.PI / mods.length; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]; });
      pts.forEach(p => s.addShape(P.shapes.LINE, { x: Math.min(p[0], cx), y: Math.min(p[1], cy), w: Math.abs(p[0] - cx) || 0.001, h: Math.abs(p[1] - cy) || 0.001, flipH: p[0] < cx !== p[1] < cy ? true : false, line: { color: C.slate, width: 1.25, dashType: "dash" } }));
      d.box(s, cx - 1.15, cy - 0.5, 2.3, 1.0, "Temel çekirdek", { fill: C.mint, color: C.dark, size: 16 });
      pts.forEach((p, i) => d.box(s, p[0] - 0.8, p[1] - 0.33, 1.6, 0.66, mods[i], { fill: C.light, size: 11 }));
      d.text(s, "Modüller gerektiğinde yüklenir ve çalışan çekirdeğe bağlanır.", { x, y: y + 4.45, w: 6.2, h: 0.4, fontSize: 11, italic: true, color: C.mutedOnLight });
    },
    pros: ["Monolitik gibi: modüller çekirdek modunda; çağrılar hızlı.", "Mikroçekirdek gibi esnek: sürücü gerektiğinde yüklenir."],
    cons: ["Hatalı bir modül yine çekirdek modunda çalışır ve sistemi çökertebilir."],
    examples: "Örnekler: Linux (lsmod, insmod, rmmod), Solaris, modern BSD'ler. Günümüzün en yaygın tasarımı.",
  });

  s = d.codeSlide({
    kicker: "Uygulama", title: "Örnek 3: C ile Yüklenebilir Bir Çekirdek Modülü",
    code: code("hello_module.c").split("\n").slice(7).join("\n"), size: 11, codeW: 7.1, sideTitle: "Nasıl kullanılır? (Linux)",
    side: [
      "Çekirdeğin kendi derleme sistemiyle derlenir (code klasöründeki Makefile).",
      "pr_info() ekrana değil, çekirdek günlüğüne yazar.",
      "Bunu yalnızca bir sanal makinede deneyin.",
    ],
    run: { h: 2.05, size: 10.5, text:
`$ make
$ sudo insmod hello_module.ko
$ lsmod | grep hello
$ sudo dmesg | tail -1
hello_module: loaded into the kernel
$ sudo rmmod hello_module` },
  });
  s.addNotes("Bu bir gösterim slaydıdır; öğrencilerin çekirdek modülü yazması gerekmez. Vurgulayın: main() yoktur, onun yerine init/exit fonksiyonları vardır; kod çekirdek modunda çalışır; çıktı çekirdek günlüğüne (dmesg) gider.");

  s = d.cardsSlide({
    kicker: "Yapı 6", title: "Hibrit Sistemler: Gerçek İşletim Sistemleri Ne Yapar?",
    lead: "Saf tasarımlar nadirdir. Gerçek sistemler başarım, güvenlik ve kolaylık için birkaç yapıdan ödünç alır.",
    cards: [
      { title: "Windows (NT ailesi)", body: ["Mikroçekirdek fikirleriyle (ayrı alt sistemler) tasarlandı.", "Hız için hizmetlerin çoğu (grafik dahil) çekirdek modunda çalışır.", "Modüller gibi yüklenebilir sürücüler."] },
      { title: "macOS ve iOS", body: ["\"XNU\" çekirdeği = Mach mikroçekirdeği + BSD UNIX parçaları, tek çekirdek olarak derlenmiş.", "Sürücüler yüklenebilir çekirdek uzantıları olarak."] },
      { title: "Android", body: ["Değiştirilmiş bir Linux çekirdeği (monolitik + modüller).", "Üstünde: donanım soyutlama katmanı, yerel kütüphaneler ve uygulamalar için Android çalışma zamanı."] },
    ],
    callout: "1992: Andrew Tanenbaum (MINIX, mikroçekirdek), monolitik olduğu için Linus Torvalds'a \"Linux eskimiştir\" dedi. Otuz yıl sonra iki tasarım da her gün kullanılıyor.",
    bodySize: 14.5,
  });

  s = d.tableSlide({
    kicker: "Özet", title: "Yapılar Yan Yana",
    header: ["Yapı", "Çekirdek modunda", "Hız", "Güvenilirlik", "Örnek"],
    colW: [2.2, 3.3, 1.5, 2.25, 2.9],
    rows: [
      ["Basit", "her şey (koruma yok)", "yüksek", "çok düşük", "MS-DOS"],
      ["Monolitik", "tüm sistem hizmetleri", "yüksek", "orta", "UNIX, Linux"],
      ["Katmanlı", "tüm katmanlar", "düşük", "yüksek", "THE (1968)"],
      ["Mikroçekirdek", "yalnızca küçük çekirdek", "daha düşük", "yüksek", "MINIX 3, QNX, seL4"],
      ["Modüler", "temel + yüklenen modüller", "yüksek", "orta", "Linux, Solaris"],
      ["Hibrit", "değişir", "yüksek", "orta–yüksek", "Windows, macOS, Android"],
    ],
    fontSize: 14,
    callout: "Tekrarlanan ödünleşim: eklediğiniz her sınır (katman, mesaj, mod geçişi) güvenilirlik kazandırır, hızdan götürür.",
  });

  s = d.content({ kicker: "Kendiniz deneyin", title: "Kendi İşletim Sisteminizin İçine Bakın" });
  d.code(s, MX, 1.65, 6.6, 5.2,
`# Linux (laboratuvar, WSL ya da sanal makine)
$ uname -r          # çekirdek sürümü nedir?
$ lsmod | head      # hangi modüller yüklü?
$ strace -c ls      # ls'in sistem çağrılarını say

# Windows
> winver            # hangi Windows derlemesi?
> driverquery       # kurulu sürücüleri listele
# Görev Yöneticisi > Performans: işlemci
# süresinin "kullanıcı" ve "çekirdek" payı`, 13);
  d.card(s, MX + 6.9, 1.65, 5.25, 5.2, { title: "Yanıtlanacak sorular", body: [
    "Makinenizde kaç çekirdek modülü yüklü?",
    "ls en sık hangi sistem çağrısını kullanıyor?",
    "ls gibi basit bir komut kabaca kaç sistem çağrısı yapar? (Test makinemizde: 76.)",
    "Görev Yöneticisi'ni açın ve çekirdek modunda çok zaman geçiren bir program bulun. Bunun nedeni ne olabilir?",
  ], bodySize: 14 });

  s = d.content({ kicker: "Kapanış", title: "2. Hafta: Temel Çıkarımlar" });
  d.bullets(s, [
    { b: "Tanım:", t: " işletim sistemi donanımı yönetir ve programlara daha basit, daha güvenli bir makine sunar; bellekte sürekli bulunan özüne çekirdek denir." },
    { b: "İki bakış:", t: " genişletilmiş makine (soyutlama, yukarıdan aşağıya) ve kaynak yöneticisi (çoğullama, aşağıdan yukarıya)." },
    { b: "Üç hedef:", t: " kullanım kolaylığı, verimlilik, gelişebilirlik; kişisel bilgisayar, sunucu, telefon ve gömülü sistemlerde farklı ağırlıklarla." },
    { b: "Dört bileşen:", t: " donanım, işletim sistemi, uygulama programları, kullanıcılar." },
    { b: "Koruma donanım ister:", t: " ikili mod (kullanıcı/çekirdek) ve kesmeler; bir sistem çağrısı bir fonksiyon çağrısından çok daha pahalıdır." },
    { b: "Yapılar:", t: " basit, monolitik, katmanlı, mikroçekirdek, modüler, hibrit; her biri hız ile güvenilirlik arasında farklı bir uzlaşma." },
  ], { fontSize: 17, y: 1.7, h: 5.1 });

  d.quizSlide({ questions: [
    "İşletim sisteminin yaptığı bir zaman çoğullama ve bir alan çoğullama örneği verin.",
    "MS-DOS'ta bir programdaki hata neden bütün bilgisayarı çökertebiliyordu da Linux'ta çökertemiyor?",
    "Bir sistem çağrısı 100 ns, bir fonksiyon çağrısı 1,5 ns sürüyor. 10⁶ sistem çağrısı, 10⁶ fonksiyon çağrısına göre ne kadar ek yük getirir?",
    "Mikroçekirdeğin monolitik çekirdeğe göre bir avantajını ve bir dezavantajını söyleyin.",
  ] });

  d.closing({ nextWeek: "Hizmetler, Sistem Çağrıları ve Süreçler", nextItems: [
    "İşletim sisteminin sunduğu hizmetler",
    "Ayrıntılı sistem çağrıları: türleri, parametreleri, sistem çağrısı tablosu",
    "Süreç (process) kavramı: yürütülmekte olan program",
    "Süreç durumları: yeni, hazır, çalışıyor, bekliyor, sonlandı",
  ] });

  await d.save(path.join(__dirname, "MBLP131_Hafta2.pptx"));
  console.log("slides:", d.n);
})();
