# HANDOFF.md — Rotam Türkiye (`mel-travel`)

## Son Durum (14.11.2026, 23:55) — "Dergi" tasarımı YAYINDA
- **Geliştirici / Asistan:** Claude
- **Yayın:** Melih yeni tasarımı onayladı; `dergi-tasarim` dalı `main`'e birleştirildi (fast-forward, `d05d80b`) ve `https://rotam-turkiye.vercel.app` adresinde yayında. Canlı adres tarayıcıda açılıp kontrol edildi (kapak, 81 il, yazı tipleri, düzeltilmiş uçuş kayıtları).
- **Vercel:** `rotam-turkiye` projesi (`tilion` ekibi, `prj_O9G0zKnoW9J6vqX8ToJMEvURRHOC`), `mlhdrmz/mel-travel` deposuna bağlı. `main` → canlı adres. Eski projeler (`rotam-turkiye`, `mel-travel`) 10.11.2026'da silinmişti; bugün yalnızca `rotam-turkiye` yeniden kuruldu.
- **Deneme adresi kapatıldı:** `rotam-turkiye-git-dergi-tasarim-tilion.vercel.app` artık yalnızca "bu adres kapatıldı" sayfasını gösteriyor (eski çevrimdışı önbelleği temizleyip ana adrese yönlendiriyor). Vercel girişi olmayan biri bu adreste Vercel giriş ekranını görür. Girişsiz paylaşım bağlantısı iptal edildi.
- **Açık kalanlar:** GitHub'daki `dergi-tasarim` dalı silinemedi (bu oturumun GitHub erişimi dal silmeye izin vermiyor); dal tamamen `main`'e birleşti, Melih GitHub'dan silebilir. claude.ai'deki geçici önizleme sayfası duruyor (güncellenmiyor).
- **Tarayıcı notu:** Siteyi daha önce açmış tarayıcılarda eski çevrimdışı önbellek ilk açılışta eski tasarımı gösterebilir; sayfa bir kez yenilenince yeni tasarım gelir. Tarayıcıda kayıtlı eski uçuş bilgileri `applySeedCorrections()` ile kendiliğinden düzelir.
- **Kapsam kuralı:** İçerik ve işlevler aynı kaldı; yalnızca görünüm değişti ve 8 Kasım uçuş kayıtları düzeltildi. `window.App` dışa açık fonksiyonları, tüm `id` / `data-*` değerleri ve `localStorage` anahtarı (`mel_travel_state_v2`, `version: 2`) aynıdır.

### Bu sürümde yapılanlar
1. **Görünüm: "Dergi B2" (kapak fotoğraflı)**
   - Tailwind CDN kaldırıldı. Bütün stil `wwwroot/css/styles.css` içinde, CSS değişkenleriyle: zemin `#D3DAE0`, kâğıt `#EEF1F4`, mürekkep `#121B25`, kobalt `#1A45C4` (Gezdim), açık kobalt `#9DB2E6` (Geçtim), kehribar `#E8A20C` (Merkez). Yazı tipleri Newsreader (başlık) + Inter (metin).
   - `index.html` ve `app.js` içindeki HTML şablonları bu sınıflara göre yeniden yazıldı; arayüzdeki emojiler kaldırıldı, metinler korundu.
   - **Kapak:** Türkiye Haritası sekmesinin üstünde fotoğraf + "81 ilden N'si gezildi." başlığı. Fotoğraf `wwwroot/img/kapak-kayseri.jpg` (Ömer Haktan Bulut / Unsplash; Melih'in seçtiği kare). Kural: son gidilen şehre Melih'in kendi yüklediği fotoğraf varsa o, yoksa hazır kapak fotoğrafı gösterilir; şimdilik yalnızca Kayseri (38) için dosya var, başka şehir için aynı kare kullanılır (`app.js` → `renderCover`, `COVER_PHOTOS`).
   - **FlightRadar Modu** bilerek koyu kaldı (radar ekranı).
   - **Coğrafi Harita (Leaflet):** CARTO karoları (eski sürümdeki `dark_all` dahil) artık anahtar istiyor ve "API KEY REQUIRED" filigranı basıyor. Bu dalda OpenStreetMap'in kendi karolarına (`tile.openstreetmap.org`) geçildi. `main`'deki eski sürümde bu mod hâlâ bozuk.
   - **Pasaport PNG** (1080×1350) aynı içerikle Dergi paletinde çiziliyor.
   - `manifest.json` / `theme-color` `#D3DAE0`; `icon.svg` düz mürekkep zemin.
2. **Harita: gerçek il sınırları**
   - Yeni dosya `wwwroot/js/turkey-geo.js` (`window.TURKEY_GEO_PATHS`, 81 plaka). Kaynak: `cihadturhan/tr-geojson`; veri © OpenStreetMap katkıcıları, ODbL — sayfa altında atıf var, kaldırılmamalı.
   - Sınırlar sitenin kendi `TurkeyMapEngine.project()` projeksiyonuna çevrildi. `turkey-provinces.js` → `buildProvincePaths()` bu veri yüklüyse onu kullanır, yoksa eski Voronoi yaklaşımına düşer.
3. **Uçuş kayıtları düzeltildi (kaynak: Flightradar24 uçuş geçmişi, 13.11.2026'da bakıldı)**
   - **PC2730** (08.11.2026, SAW → ASR): uçak **TC-RDM, Airbus A321-251NX (A321neo, CFM LEAP-1A)**. Tarifeli 05:30–06:45; gerçekleşen kalkış 05:40, iniş 06:37; havada 57 dk. (Eski kayıt: "Airbus A321", TC-RBC, 75 dk — yanlıştı.)
   - **VF3181** (08.11.2026, ASR → SAW): uçak **TC-LTV, Airbus A321-271NX (A321neo, PW1100G)**. Tarifeli 21:25–23:00; gerçekleşen kalkış 21:33, iniş 22:40; havada 67 dk. (Eski kayıt: TC-LAJ, 95 dk — yanlıştı.)
   - Seyahat toplamı: 1.158 km, havada 2 sa 4 dk (124 dk). `durationMinutes` artık havada geçen süredir; tarifeli saatler bilette yazdığı gibi korunur, gerçekleşenler `actualDepartureTime` / `actualArrivalTime` alanlarındadır.
   - `seed-data.js`, `aviation-data.js` (kuyruk veritabanına TC-RDM ve TC-LTV eklendi, TC-RBC'nin tipi A321neo yapıldı), `TravelDomain.cs` ve test beklentisi (`AircraftId == "A321NEO"`) güncellendi.
   - **Kayıtlı veri geçişi:** Tarayıcıda eski varsayılanlar kayıtlıysa `app.js` → `applySeedCorrections()` yalnızca hâlâ eski varsayılana eşit olan alanları düzeltir (`window.LEGACY_SEED_VALUES`); kullanıcının kendi değiştirdiği alanlara dokunmaz.
4. **PWA:** `sw.js` önbellek adı `rotam-turkiye-pwa-v1.3`; listeye `js/turkey-geo.js` ve `img/kapak-kayseri.jpg` eklendi. Dosya eklendikçe bu liste ve sürüm adı güncellenmeli (önbellek cache-first).

### Doğrulama
- Yerelde statik sunucu + başsız Chrome ile denendi (1440 px ve 390 px): 4 sekme, 3 harita modu, il seçme/durum değiştirme (yenilemede kalıcı), il arama, bölge filtresi, araba ve uçak yolculuğu ekleme, bilet/koltuk/pasaport pencereleri, eski kayıtlı veriden geçiş. Sayfa hatası yok; yatay taşma yok.
- Önizleme adresi tarayıcıda açılıp denendi (14.11.2026): yazı tipleri, kapak, 81 il, şehir fotoğrafı ve OpenStreetMap karoları yükleniyor.
- **Çalıştırılamayanlar:** .NET derlemesi ve 25 test (bu ortamda `dotnet` yok) — `TravelDomain.cs` ve `tests/MelTravel.Tests/Program.cs` değişti, bir sonraki oturumda `dotnet run --project tests/MelTravel.Tests` ile doğrulanmalı.

### Bilinen eksikler / doğrulanmamış eski içerik (bu dalda dokunulmadı)
- İl kartı ve uçak kartı fotoğrafları eskisi gibi Unsplash bağlantılarıdır. 81 il için yalnızca 20 farklı fotoğraf bağlantısı var (çoğu il başka bir ille aynı fotoğrafı paylaşıyor); fotoğrafların o şehri/uçağı gösterdiği kontrol edilmedi. Boeing 777-300ER (`B77W`) kartının fotoğraf bağlantısı kırık (404).
- Kuyruk veritabanındaki eski satırların MSN / teslim yılı bilgileri doğrulanmadı. TC-RDM ve TC-LTV satırlarında yalnızca doğrulanan alanlar var.
- "Akıllı Bilet Okuyucu" gerçek OCR değildir; metni ve dosya adını ayrıştırır.
- Üst şeritteki "Uçuş (SAW ⇄ ASR)" ve "PC2730 (Gidiş) & VF3181 (Dönüş)" yazıları sabittir; yeni uçuş eklenince değişmez (eski davranış).
- Telefonda harita ekran genişliğine sığdığı için küçük kalır.

### Sıradaki adımlar
1. Melih canlı sitede geri bildirim verecek. Yeni değişiklikler artık doğrudan `main` yerine yine ayrı bir dalda hazırlanıp onaydan sonra birleştirilmeli.
2. Ayarlar `vercel.json` içinde (çıktı klasörü `src/MelTravel.Web/wwwroot`, derleme yok); `main`'e her gönderim canlıya çıkar.
3. Ayrı adım: bulut kaydı (Supabase). Hesabı Melih açacak; şu an veri yalnızca tarayıcıda (`localStorage`).
4. Sonraki fikirler: şehir başına kapak fotoğrafı, Melih'in kendi fotoğrafları, uçak tescil fotoğrafı.

---

## Önceki Durum (10.11.2026)
- **Geliştirici / Asistan:** Antigravity
- **Proje Dizini:** `C:\Users\Melih Durmaz\.gemini\antigravity\scratch\mel-travel`
- **Durum:** v1.2 tamamlandı (PWA `manifest.json`, `sw.js`, `icon.svg`, Git deposu kurulumu, Akıllı Bilet OCR Okuyucu, Karayolu Güzergâh & Geçiş İlleri Motoru, Paylaşılabilir Pasaport PNG Kartı ve `vercel.json`). Derleme ve 25 otomatik testin tamamı geçti (`25 Başarılı, 0 Başarısız`).

## Tamamlanan Özellikler
1. **81 İl Türkiye Haritası & Hibrit Görünüm (`turkey-provinces.js`, `app.js`):**
   - 81 ilin tamamı için plaka, bölge, koordinat, havalimanı kodu, gezilecek yerler ve meşhur lezzetler veri seti.
   - Kıyı ve sınır kırpmalı (Sutherland-Hodgman) su geçirmez 81 il SVG haritası + FlightRadar Koyu Radar Modu + Leaflet Coğrafi Harita geçişi.
2. **Melih Profili & Başlangıç Uçuşları (`seed-data.js`, `TravelDomain.cs`):**
   - **Gidiş Uçuşu (`PC2730`):** 08.11.2026 • Pegasus Airlines • `SAW (05:30) → ASR (06:45)` • `Airbus A321neo` (14.11.2026'da düzeltildi; ilk kayıtta `Airbus A321` yazıyordu) • Koltuk `20A` • 15 Kg + Kabin bagajı.
   - **Dönüş Uçuşu (`VF3181`):** 08.11.2026 • AJet • `ASR (21:25) → SAW (23:00)` • `Airbus A321neo` • Koltuk `20A` • Kapı `206` • Biniş `20:40` • Bölge `C` • Seq `9`.
   - Gizlilik kuralı gereği PNR ve bilet numaraları kaynak kodda maskelenmiştir (`****P9`, `****Y4`), yerel bilet görselleri `.gitignore` kapsamına alınmıştır.
3. **Uçak Hangarım & Ansiklopedi (`aviation-data.js`):**
   - Airbus A321 ve Airbus A321neo başta olmak üzere 9 uçak modeli, fotoğraflı teknik kartlar, `20A` kabin koltuk şeması ve `TC-...` kuyruk tescili sorgulama.
4. **v1.1 & v1.2 Modüller (`aviation-data.js`, `app.js`, `manifest.json`, `sw.js`, `vercel.json`):**
   - **Akıllı Bilet & Biniş Kartı Okuyucu (`SmartTicketScanner`):** Bilet fotoğrafı veya metninden havayolu, uçuş kodu, kalkış/varış havalimanı, saat, kapı, koltuk ve uçak modelini otomatik ayrıştırma.
   - **Akıllı Karayolu Güzergâh & Geçiş İlleri Hesaplayıcı (`HighwayCorridorEngine`):** Özel araba veya otobüs seçildiğinde kalkış ve varış ili arasındaki geçiş illerini otomatik bulup haritada *"İçinden Geçtim"* olarak işaretleme ve karayolu rotasını çizme.
   - **Paylaşılabilir Seyahat & Havacılık Pasaportu (PNG):** `1080×1350` yüksek çözünürlüklü Story/Özet kartı çizimi ve tek tıkla PNG indirme.
   - **PWA (Mobil/Masaüstü Uygulama Kurulumu):** `manifest.json`, çevrimdışı çalışan `sw.js` (Service Worker), `icon.svg` ve üst menüde `📲 Uygulamayı Kur` butonu.
   - **Git & Vercel Canlı Yayın (`READY`):**
     - **GitHub Deposu:** `https://github.com/mlhdrmz/mel-travel` (`main` dalı, Vercel ile otomatik bağlı)
     - **Canlı Production URL (10.11.2026 itibarıyla; proje aynı akşam silindi, yukarıdaki "Vercel durumu" notuna bakın):** `https://rotam-turkiye.vercel.app` (`tilion/rotam-turkiye`, Deployment ID: `dpl_FV6X1tb4fsMHmMCmktpb5GU6UrEk`)
     - **Vercel CLI & Node.js:** `Node.js v22.14.0` ve `Vercel CLI 65.14.0` (`melihdurmazzz91-8072`) kuruldu ve doğrulandı.
