# Rotam Türkiye • Kişisel Seyahat Haritası & FlightRadar Havacılık Günlüğü

**Rotam Türkiye (`mel-travel`)**, Türkiye'deki 81 il üzerinde gezdiğiniz şehirleri işaretlemenizi, şehir bazlı anı ve fotoğraf galerileri oluşturmanızı, bindiğiniz uçak modellerini (**Airbus A321**, **Airbus A321neo** vb.) fotoğraflı teknik kartlarla incelemenizi ve uçuşlarınızı **FlightRadar** tarzı animasyonlu gidiş-dönüş rotalarıyla harita üzerinde görüntülemenizi sağlayan hibrit web uygulamasıdır.

## Öne Çıkan Özellikler

1. **İnteraktif 81 İl Türkiye Haritası & 3 Görünüm Modu:**
   - **81 İl + Uçuş Rotaları (Hibrit SVG):** İlleri *Gezdim*, *İçinden Geçtim*, *Hedefim (Bucket List)* veya *Merkezim* olarak işaretleyin; aynı anda aktif uçuş yaylarını görün.
   - **FlightRadar Modu:** Koyu havacılık radarı temasında Türkiye havalimanları (`SAW`, `IST`, `ASR`, `ESB`, `AYT`, `ADB` vb.) ve rota üzerinde canlı hareket eden uçak simülasyonu.
   - **Coğrafi Harita (Leaflet):** Gerçek dünya/uydu haritası katmanı.
2. **Şehir Detay Paneli & Fotoğraf Galerisi:**
   - Herhangi bir şehre tıkladığınızda şehrin gezilecek yerleri, meşhur yemekleri, havalimanı bilgisi, o şehre yapılan uçuşlar ve kişisel fotoğraf/not galerisi açılır.
3. **Dijital Biniş Kartları (Boarding Pass) & Seyahat Günlüğü:**
   - **Pegasus (`PC2730`)** `SAW → ASR` (`Airbus A321`, Koltuk `20A`) ve **AJet (`VF3181`)** `ASR → SAW` (`Airbus A321neo`, Koltuk `20A`, Kapı `206`) başlangıç uçuşlarıyla hazır gelir.
   - Orijinal bilet görseli önizleme ve yeni seyahat/uçuş (Uçak, Araba, Otobüs, Tren) ekleme.
4. **Uçak Hangarım & İnteraktif Kabin Koltuk Haritası:**
   - Bindiğiniz uçakların fotoğraflı bilgi kartları, motor/menzil/seyir hızı verileri ve `20A` koltuğunu kanat hizasıyla gösteren interaktif kabin şeması.
   - Canlı `TC-...` kuyruk tescili sorgulama (Yerleşik veritabanı + Planespotters API).

## Çalıştırma

- **Hızlı Başlatma:** `Baslat.bat` dosyasına çift tıklayın veya doğrudan `src/MelTravel.Web/wwwroot/index.html` dosyasını tarayıcıda açın.
- **.NET 8 Sunucu ile Çalıştırma:**
  ```powershell
  dotnet run --project src/MelTravel.Web/MelTravel.Web.csproj --urls "http://localhost:5180"
  ```
- **Testleri Çalıştırma:**
  ```powershell
  dotnet build src/MelTravel.Web/MelTravel.Web.csproj
  dotnet build tests/MelTravel.Tests/MelTravel.Tests.csproj
  dotnet tests/MelTravel.Tests/bin/Debug/net8.0/MelTravel.Tests.dll
  ```
