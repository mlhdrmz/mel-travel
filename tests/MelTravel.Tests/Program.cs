using System;
using System.IO;
using System.Linq;
using MelTravel.Web.Domain;

int passed = 0;
int failed = 0;

void Assert(bool condition, string testName, string details = "")
{
    if (condition)
    {
        passed++;
        Console.WriteLine($"[PASS] {testName}");
    }
    else
    {
        failed++;
        Console.WriteLine($"[FAIL] {testName} -> {details}");
    }
}

Console.WriteLine("=== MelTravel.Tests Otomatik Doğrulama Paketi ===");

// 1. 81 İl Kontrolü
var provinces = TravelCatalog.Provinces;
Assert(provinces.Count == 81, "Türkiye 81 İl Tam Liste Kontrolü", $"Beklenen: 81, Bulunan: {provinces.Count}");

var distinctPlates = provinces.Select(p => p.PlateCode).Distinct().OrderBy(x => x).ToList();
Assert(distinctPlates.Count == 81 && distinctPlates.First() == 1 && distinctPlates.Last() == 81,
    "Plaka Kodları 01-81 Eksiksiz Sıralama Kontrolü");

var istanbul = provinces.FirstOrDefault(p => p.PlateCode == 34);
var kayseri = provinces.FirstOrDefault(p => p.PlateCode == 38);
Assert(istanbul is not null && istanbul.Name == "İstanbul" && istanbul.AirportCode == "SAW",
    "34 İstanbul İl ve Havalimanı Verisi Kontrolü");
Assert(kayseri is not null && kayseri.Name == "Kayseri" && kayseri.AirportCode == "ASR",
    "38 Kayseri İl ve Havalimanı Verisi Kontrolü");

// 2. Havalimanı ve Mesafe Hesabı (SAW <-> ASR)
int sawAsrKm = TravelCatalog.CalculateDistanceBetweenAirports("SAW", "ASR");
Assert(sawAsrKm >= 530 && sawAsrKm <= 620,
    $"SAW <-> ASR Kuş Uçuşu Mesafe Hesabı ({sawAsrKm} km)",
    $"Beklenen: 530-620 km arası, Hesaplanan: {sawAsrKm} km");

// 3. Melih Profili ve 2 Uçuş Kaydı Kontrolü (PC2730 & VF3181)
var profile = TravelCatalog.CreateDefaultMelihProfile();
Assert(profile.Name.Contains("Melih"), "Melih Profil Adı Kontrolü");
Assert(profile.Flights.Count == 2, "Melih Profili Başlangıç Uçuş Sayısı (2 Uçuş: PC2730 ve VF3181)");

var outboundFlight = profile.Flights.FirstOrDefault(f => f.FlightNumber == "PC2730");
Assert(outboundFlight is not null
    && outboundFlight.Airline == "Pegasus Airlines"
    && outboundFlight.FromIata == "SAW"
    && outboundFlight.ToIata == "ASR"
    && outboundFlight.Date == "2026-11-08"
    && outboundFlight.DepartureTime == "05:30"
    && outboundFlight.ArrivalTime == "06:45"
    && outboundFlight.AircraftId == "A321"
    && outboundFlight.Seat == "20A",
    "Gidiş Uçuşu Doğrulaması (Pegasus PC2730 • SAW->ASR • 08.11.2026 • Airbus A321 • Koltuk 20A)");

var returnFlight = profile.Flights.FirstOrDefault(f => f.FlightNumber == "VF3181");
Assert(returnFlight is not null
    && returnFlight.Airline == "AJet"
    && returnFlight.FromIata == "ASR"
    && returnFlight.ToIata == "SAW"
    && returnFlight.Date == "2026-11-08"
    && returnFlight.DepartureTime == "21:25"
    && returnFlight.ArrivalTime == "23:00"
    && returnFlight.AircraftId == "A321NEO"
    && returnFlight.Seat == "20A"
    && returnFlight.Gate == "206",
    "Dönüş Uçuşu Doğrulaması (AJet VF3181 • ASR->SAW • 08.11.2026 • Airbus A321neo • Koltuk 20A • Kapı 206)");

// 4. Gizlilik Kuralı Kontrolü (Maskeli PNR)
Assert(profile.Flights.All(f => f.MaskedPnr.StartsWith("****")),
    "Gizlilik Kuralı: Kaynak Kodda PNR Bilgilerinin Maskelenmiş Olması");

// 5. Uçak Ansiklopedisi Kontrolü (Airbus A321 ve Airbus A321neo)
var a321 = TravelCatalog.AircraftModels.FirstOrDefault(a => a.Id == "A321");
var a321neo = TravelCatalog.AircraftModels.FirstOrDefault(a => a.Id == "A321NEO");
Assert(a321 is not null && a321neo is not null && TravelCatalog.AircraftModels.Count >= 8,
    "Uçak Ansiklopedisi Airbus A321 ve Airbus A321neo Modellerini İçeriyor");

// 6. Frontend Dosya Bütünlüğü ve İçerik Kontrolü
string rootDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
string wwwroot = Path.Combine(rootDir, "src", "MelTravel.Web", "wwwroot");
Assert(File.Exists(Path.Combine(wwwroot, "index.html")), "Frontend index.html Mevcut");
Assert(File.Exists(Path.Combine(wwwroot, "js", "turkey-provinces.js")), "Frontend turkey-provinces.js Mevcut");
Assert(File.Exists(Path.Combine(wwwroot, "js", "aviation-data.js")), "Frontend aviation-data.js Mevcut");
Assert(File.Exists(Path.Combine(wwwroot, "js", "seed-data.js")), "Frontend seed-data.js Mevcut");
Assert(File.Exists(Path.Combine(wwwroot, "js", "app.js")), "Frontend app.js Mevcut");

string seedJs = File.ReadAllText(Path.Combine(wwwroot, "js", "seed-data.js"));
Assert(seedJs.Contains("PC2730") && seedJs.Contains("VF3181") && seedJs.Contains("20A"),
    "Frontend Seed Verisinde PC2730, VF3181 ve Koltuk 20A Kayıtlı");

// 7. Yeni Özellikler: Karayolu Güzergâh Hesaplayıcı, Bilet OCR, Pasaport PNG ve Vercel Yapılandırması
var istToKayseriTransit = TravelCatalog.FindHighwayTransitPlates(34, 38);
Assert(istToKayseriTransit.Contains(41) && istToKayseriTransit.Contains(6),
    "Akıllı Karayolu Güzergâh Hesaplayıcı: İstanbul (34) -> Kayseri (38) Geçiş İlleri (Kocaeli, Ankara vb.)");

var istToAntalyaTransit = TravelCatalog.FindHighwayTransitPlates(34, 7);
Assert(istToAntalyaTransit.Contains(11) && istToAntalyaTransit.Contains(3) && istToAntalyaTransit.Contains(15),
    "Akıllı Karayolu Güzergâh Hesaplayıcı: İstanbul (34) -> Antalya (07) Geçiş İlleri (Bilecik, Afyon, Burdur)");

string aviationJs = File.ReadAllText(Path.Combine(wwwroot, "js", "aviation-data.js"));
Assert(aviationJs.Contains("HighwayCorridorEngine") && aviationJs.Contains("SmartTicketScanner"),
    "Frontend aviation-data.js İçinde HighwayCorridorEngine ve SmartTicketScanner Mevcut");

string appJs = File.ReadAllText(Path.Combine(wwwroot, "js", "app.js"));
Assert(appJs.Contains("openPassportModal") && appJs.Contains("downloadPassportPng") && appJs.Contains("handleTicketOcrUpload"),
    "Frontend app.js İçinde Pasaport PNG Üretici ve Akıllı Bilet OCR Fonksiyonları Mevcut");

Assert(File.Exists(Path.Combine(rootDir, "vercel.json")),
    "Vercel Dağıtım Yapılandırması (vercel.json) Mevcut");

// 8. PWA (Progressive Web App) Dosya Kontrolleri
Assert(File.Exists(Path.Combine(wwwroot, "manifest.json")), "PWA manifest.json Mevcut");
Assert(File.Exists(Path.Combine(wwwroot, "sw.js")), "PWA Service Worker (sw.js) Mevcut");
Assert(File.Exists(Path.Combine(wwwroot, "icon.svg")), "PWA Vektörel İkon (icon.svg) Mevcut");

Console.WriteLine($"=== Sonuç: {passed} Başarılı, {failed} Başarısız ===");
Environment.Exit(failed > 0 ? 1 : 0);
