# MBLP131 İşletim Sistemleri Temelleri

*Fundamentals of Operating Systems (Turkish edition) — lecture slides, course notes, code examples and lab material.*

Bilgisayar Programcılığı Programı, Meslek Yüksekokulu, İstanbul Okan Üniversitesi. Dil: Türkçe.

## İçerik / Contents

| Yol | Açıklama |
|---|---|
| `Hafta_01` ... `Hafta_15` | Her hafta için: ders slaytları (`.pptx`, `.pdf`), ders notları (`notes/`, LaTeX kaynağı ve PDF), kod örnekleri (`code/`) |
| `Hafta_08/exam`, `Hafta_15/exam` | Örnek vize ve final soruları ile cevap anahtarları |
| `lab_resources/` | Windows'ta WSL 2 üzerinde Ubuntu laboratuvarı kurulum betikleri ve Docker ortamı |
| `vm/` | VirtualBox laboratuvar sanal makinesi için derleme ve dağıtım betikleri (imaj dosyaları depoda yoktur) |
| `_build/` | Slaytları ve notları yeniden üreten betikler (Node.js + pptxgenjs, XeLaTeX) |

## Haftalık konular

1. Genel bakış ve bilişimin tarihi
2. İşletim sistemlerine giriş: tanım, hedefler, bileşenler ve yapılar
3. İşletim sistemi hizmetleri, sistem çağrıları ve süreçler
4. İş parçacıkları ve işlemci zamanlamasının temelleri
5. İşlemci zamanlama algoritmaları ve süreç eşzamanlaması
6. Bellek yönetimi: bitişik tahsis, sayfalama ve bölütleme
7. Sanal bellek ve dosya sistemleri
8. Ara sınav tekrarı ve alıştırma (1-7. haftalar)
9. Linux kabuğuna giriş ve dosya sisteminde gezinme
10. Dosya ve dizin işlemleri
11. İzinler, sahiplik ve kullanıcılar
12. Metin işleme, yönlendirme ve boru hatları
13. Süreçler ve iş denetimi
14. Kabuk betiklerine giriş
15. Final sınavı tekrarı ve alıştırma

## Derleme

```bash
# Ders notları (XeLaTeX, iki kez çalıştırın)
cd Hafta_09/notes && xelatex MBLP131_Hafta9_Notlar.tex

# Kod örnekleri (Linux)
cd Hafta_02/code && make
```

Slayt oluşturma betikleri `_build/` ve `Hafta_08` ... `Hafta_15/_src/` altındadır.

## Gizlilik

İletişim bilgileri (e-posta, ofis, mesajlaşma grubu bağlantısı ve QR kodu) bu depodan bilinçli olarak çıkarılmıştır. Depoda öğrenci verisi bulunmaz.

## Lisans

Ders materyali olarak MIT lisansıyla paylaşılır; öğrenciler kendi projelerinde serbestçe kullanabilir. Bu materyaller, her ne şekilde olursa olsun hiçbir garanti verilmeksizin "olduğu gibi" sunulmaktadır; yazar, bunların kullanımından doğabilecek hiçbir sorumluluğu kabul etmez.
