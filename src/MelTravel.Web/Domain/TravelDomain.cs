using System;
using System.Collections.Generic;
using System.Linq;

namespace MelTravel.Web.Domain;

public record ProvinceInfo(
    int PlateCode,
    string CodeString,
    string Name,
    string Region,
    double Latitude,
    double Longitude,
    string? AirportCode,
    string Highlights,
    string FamousFood
);

public record AirportInfo(
    string Iata,
    string Icao,
    string Name,
    string City,
    int PlateCode,
    double Latitude,
    double Longitude
);

public record AircraftModelInfo(
    string Id,
    string Manufacturer,
    string Model,
    string FullName,
    string IcaoCode,
    string Category,
    string Engines,
    int MaxPassengers,
    int RangeKm,
    int CruiseSpeedKmh,
    string WingspanM,
    string LengthM,
    int FirstFlightYear,
    string SeatLayout,
    string Description
);

public record FlightRecord(
    string Id,
    string Airline,
    string AirlineCode,
    string FlightNumber,
    string Date,
    string FromIata,
    string ToIata,
    string DepartureTime,
    string ArrivalTime,
    string AircraftId,
    string AircraftName,
    string Seat,
    string SeatType,
    string Terminal,
    string Gate,
    string BoardingTime,
    string BoardingZone,
    string SequenceNo,
    string Baggage,
    string MaskedPnr,
    string Status,
    int DistanceKm,
    int DurationMinutes,
    string DirectionLabel,
    string? TicketImageUrl,
    string Notes
);

public record TripRecord(
    string Id,
    string Title,
    int FromPlate,
    int ToPlate,
    string TransportType, // "plane", "car", "bus", "train", "ship"
    string StartDate,
    string EndDate,
    bool IsRoundTrip,
    List<string> FlightIds,
    string Summary,
    List<string> Highlights
);

public record UserProfileState(
    string Name,
    string Handle,
    string Bio,
    int HomePlateCode,
    Dictionary<int, string> ProvinceStatuses, // PlateCode -> "visited" | "passed" | "wishlist" | "home"
    List<FlightRecord> Flights,
    List<TripRecord> Trips
);

public static class TravelCatalog
{
    public static readonly IReadOnlyList<ProvinceInfo> Provinces = new List<ProvinceInfo>
    {
        new(1, "01", "Adana", "Akdeniz", 37.0000, 35.3213, "ADA", "Taşköprü, Sabancı Merkez Camii, Seyhan Gölü", "Adana Kebap, Şalgam, Bici Bici"),
        new(2, "02", "Adıyaman", "Güneydoğu Anadolu", 37.7648, 38.2786, "ADF", "Nemrut Dağı, Cendere Köprüsü, Perre Antik Kenti", "Çiğ Köfte, Adıyaman Tavası"),
        new(3, "03", "Afyonkarahisar", "Ege", 38.7507, 30.5567, null, "Afyon Kalesi, Frig Vadisi, Termal Kaplıcalar", "Kaymak, Sucuk, Afyon Lokumu"),
        new(4, "04", "Ağrı", "Doğu Anadolu", 39.7191, 43.0503, "AJI", "Ağrı Dağı, İshak Paşa Sarayı, Meteor Çukuru", "Abdigör Köftesi, Halise"),
        new(5, "05", "Amasya", "Karadeniz", 40.6499, 35.8353, "MZH", "Kral Kaya Mezarları, Yalıboyu Evleri, Ferhat Su Kanalı", "Amasya Elması, Keşkek, Toyga Çorbası"),
        new(6, "06", "Ankara", "İç Anadolu", 39.9334, 32.8597, "ESB", "Anıtkabir, Ankara Kalesi, Anadolu Medeniyetleri Müzesi", "Ankara Tava, Beypazarı Kurusu, Simit"),
        new(7, "07", "Antalya", "Akdeniz", 36.8969, 30.7133, "AYT", "Kaleiçi, Düden Şelalesi, Aspendos, Olympos, Kaş", "Antalya Piyazı, Yanık Dondurma, Kabak Tatlısı"),
        new(8, "08", "Artvin", "Karadeniz", 41.1828, 41.8183, "RZV", "Karagöl, Macahel, Mençuna Şelalesi", "Cağ Kebabı, Kuymak, Laz Böreği"),
        new(9, "09", "Aydın", "Ege", 37.8560, 27.8416, "ADB", "Kuşadası, Didim Apollon Tapınağı, Afrodisias", "İncir, Çöp Şiş, Keşkek"),
        new(10, "10", "Balıkesir", "Marmara", 39.6484, 27.8826, "EDO", "Ayvalık Cunda Adası, Kazdağları, Avşa Adası", "Höşmerim, Ayvalık Tostu, Zeytinyağlılar"),
        new(11, "11", "Bilecik", "Marmara", 40.1451, 29.9799, null, "Şeyh Edebali Türbesi, Söğüt, Harmankaya Kanyonu", "Büzme Tatlısı, Bıldırcın Kebabı"),
        new(12, "12", "Bingöl", "Doğu Anadolu", 38.8854, 40.4966, "BGG", "Yüzen Adalar, Hesarek Kayak Merkezi", "Bingöl Balı, Mastuva"),
        new(13, "13", "Bitlis", "Doğu Anadolu", 38.4006, 42.1095, "MSR", "Ahlat Selçuklu Mezarlığı, Nemrut Krater Gölü", "Büryan Kebabı, İçli Köfte"),
        new(14, "14", "Bolu", "Karadeniz", 40.7392, 31.6089, null, "Abant Gölü, Yedigöller, Gölcük Tabiat Parkı", "Mengen Pilavı, Bolu Çikolatası"),
        new(15, "15", "Burdur", "Akdeniz", 37.7203, 30.2906, "ISE", "Salda Gölü, Sagalassos Antik Kenti, İnsuyu Mağarası", "Burdur Şiş, Ceviz Ezmesi"),
        new(16, "16", "Bursa", "Marmara", 40.1885, 29.0610, "YEI", "Uludağ, Cumalıkızık, Ulu Cami, Gölyazı", "İskender Kebap, Kestane Şekeri, İnegöl Köfte"),
        new(17, "17", "Çanakkale", "Marmara", 40.1553, 26.4142, "CKZ", "Gelibolu Şehitliği, Troya Antik Kenti, Bozcaada, Assos", "Peynir Helvası, Sardalya, Ezine Peyniri"),
        new(18, "18", "Çankırı", "İç Anadolu", 40.6013, 33.6134, null, "Tuz Mağarası, Ilgaz Dağı", "Yaren Güveci, Çankırı Küpecik Peyniri"),
        new(19, "19", "Çorum", "Karadeniz", 40.5506, 34.9556, "MZH", "Hattuşa Antik Kenti, Alacahöyük, İncesu Kanyonu", "Çorum Leblebisi, İskilip Dolması"),
        new(20, "20", "Denizli", "Ege", 37.7765, 29.0864, "DNZ", "Pamukkale Travertenleri, Hierapolis, Laodikeia", "Denizli Kebabı, Zafer Gazozu"),
        new(21, "21", "Diyarbakır", "Güneydoğu Anadolu", 37.9144, 40.2306, "DIY", "Diyarbakır Surları, Hevsel Bahçeleri, On Gözlü Köprü", "Ciğer Kebabı, Kaburga Dolması, Burma Kadayıf"),
        new(22, "22", "Edirne", "Marmara", 41.6771, 26.5557, null, "Selimiye Camii, Meriç Köprüsü, Karaağaç", "Edirne Tava Ciğeri, Badem Ezmesi"),
        new(23, "23", "Elazığ", "Doğu Anadolu", 38.6810, 39.2264, "EZS", "Harput Kalesi, Hazar Gölü, Keban", "Harput Köftesi, Orcik"),
        new(24, "24", "Erzincan", "Doğu Anadolu", 39.7500, 39.5000, "ERC", "Kemaliye Karanlık Kanyon, Girlevik Şelalesi", "Erzincan Tulum Peyniri, Döner"),
        new(25, "25", "Erzurum", "Doğu Anadolu", 39.9043, 41.2679, "ERZ", "Palandöken, Çifte Minareli Medrese, Tortum Şelalesi", "Cağ Kebabı, Kadayıf Dolması"),
        new(26, "26", "Eskişehir", "İç Anadolu", 39.7767, 30.5206, "AOE", "Odunpazarı Evleri, Porsuk Çayı, Sazova Parkı", "Çibörek, Balaban Köfte, Met Helvası"),
        new(27, "27", "Gaziantep", "Güneydoğu Anadolu", 37.0662, 37.3833, "GZT", "Zeugma Mozaik Müzesi, Bakırcılar Çarşısı, Rumkale", "Baklava, Beyran, Ali Nazik, Katmer"),
        new(28, "28", "Giresun", "Karadeniz", 40.9128, 38.3895, "OGU", "Giresun Adası, Kümbet Yaylası, Kuzalan Şelalesi", "Giresun Fındığı, Karalahana Çorbası, Pide"),
        new(29, "29", "Gümüşhane", "Karadeniz", 40.4386, 39.5086, "TZX", "Karaca Mağarası, Santa Harabeleri, Zigana", "Pestil, Köme, Siron"),
        new(30, "30", "Hakkari", "Doğu Anadolu", 37.5833, 43.7333, "YKO", "Cilo ve Sat Dağları, Buzul Gölleri", "Doğaba, Kıris"),
        new(31, "31", "Hatay", "Akdeniz", 36.2021, 36.1606, "HTY", "Titus Tüneli, St. Pierre Kilisesi, Uzun Çarşı", "Künefe, Tepsi Kebabı, Humus"),
        new(32, "32", "Isparta", "Akdeniz", 37.7648, 30.5566, "ISE", "Eğirdir Gölü, Lavanta Bahçeleri, Yazılı Kanyon", "Isparta Kebabı, Gül Lokumu"),
        new(33, "33", "Mersin", "Akdeniz", 36.8121, 34.6415, "COV", "Kızkalesi, Cennet-Cehennem Obrukları, Tarsus", "Tantuni, Cezerye, Kerebiç"),
        new(34, "34", "İstanbul", "Marmara", 41.0082, 28.9784, "SAW", "Ayasofya, Topkapı Sarayı, Boğaz, Kız Kulesi, Galata", "Balık Ekmek, Islak Hamburger, Boza"),
        new(35, "35", "İzmir", "Ege", 38.4237, 27.1428, "ADB", "Saat Kulesi, Efes Antik Kenti, Çeşme, Alaçatı, Foça", "Boyoz, Kumru, İzmir Bombası, Şambali"),
        new(36, "36", "Kars", "Doğu Anadolu", 40.6013, 43.0975, "KSY", "Ani Harabeleri, Çıldır Gölü, Sarıkamış", "Kars Kazı, Kars Kaşarı, Gravyer"),
        new(37, "37", "Kastamonu", "Karadeniz", 41.3887, 33.7827, "KFS", "Valla Kanyonu, Ilgaz, Saat Kulesi", "Etli Ekmek, Çekme Helva, Taşköprü Sarımsağı"),
        new(38, "38", "Kayseri", "İç Anadolu", 38.7312, 35.4787, "ASR", "Erciyes Dağı, Kapuzbaşı Şelaleleri, Hunat Hatun Külliyesi, Talas", "Kayseri Mantısı, Pastırma, Sucuk, Yağlama"),
        new(39, "39", "Kırklareli", "Marmara", 41.7333, 27.2167, null, "İğneada Longoz Ormanları, Dupnisa Mağarası", "Kırklareli Köftesi, Hardaliye"),
        new(40, "40", "Kırşehir", "İç Anadolu", 39.1425, 34.1709, "NVV", "Cacabey Medresesi, Seyfe Gölü, Ahi Evran Külliyesi", "Çullama, Tandırda Çömlek Paça"),
        new(41, "41", "Kocaeli", "Marmara", 40.8533, 29.8815, "CNO", "Kartepe, Maşukiye, Ormanya, Kefken", "Pişmaniye, Kandıra Yoğurdu"),
        new(42, "42", "Konya", "İç Anadolu", 37.8746, 32.4932, "KYA", "Mevlana Müzesi, Çatalhöyük, Sille, Beyşehir Gölü", "Etli Ekmek, Fırın Kebabı, Bamya Çorbası"),
        new(43, "43", "Kütahya", "Ege", 39.4167, 29.9833, "KZR", "Aizanoi Antik Kenti, Kütahya Kalesi, Çini Müzesi", "Cimcik, Sıkıcık Çorbası"),
        new(44, "44", "Malatya", "Doğu Anadolu", 38.3552, 38.3095, "MLX", "Aslantepe Höyüğü, Levent Vadisi, Darende Somuncu Baba", "Malatya Kayısısı, Kağıt Kebabı"),
        new(45, "45", "Manisa", "Ege", 38.6191, 27.4289, "ADB", "Sardes Antik Kenti, Spil Dağı, Kula Peribacaları", "Manisa Kebabı, Mesir Macunu"),
        new(46, "46", "Kahramanmaraş", "Akdeniz", 37.5858, 36.9371, "KCM", "Başkonuş Yaylası, Germanicia Mozaikleri, Kapalı Çarşı", "Maraş Dondurması, Eli Böğründe, Tarhana"),
        new(47, "47", "Mardin", "Güneydoğu Anadolu", 37.3212, 40.7245, "MQM", "Dara Antik Kenti, Deyrulzafaran Manastırı, Eski Mardin Taş Evleri", "Kaburga Dolması, Sembusek, Mırra"),
        new(48, "48", "Muğla", "Ege", 37.2153, 28.3636, "DLM", "Bodrum, Fethiye Ölüdeniz, Marmaris, Datça, Kelebekler Vadisi", "Çökertme Kebabı, Kabak Çiçeği Dolması"),
        new(49, "49", "Muş", "Doğu Anadolu", 38.9462, 41.7539, "MSR", "Muş Ovası, Malazgirt Kalesi, Murat Köprüsü", "Muş Köftesi, Çorti"),
        new(50, "50", "Nevşehir", "İç Anadolu", 38.6939, 34.6857, "NVV", "Kapadokya Peribacaları, Göreme Açık Hava Müzesi, Derinkuyu Yeraltı Şehri", "Testi Kebabı, Çömlek Fasulyesi"),
        new(51, "51", "Niğde", "İç Anadolu", 37.9667, 34.6833, null, "Aladağlar, Gümüşler Manastırı, Tyana Su Kemerleri", "Niğde Tavası, Niğde Gazozu"),
        new(52, "52", "Ordu", "Karadeniz", 40.9839, 37.8764, "OGU", "Boztepe, Perşembe Yaylası, Yason Burnu", "Ordu Tostu, Fındık, Melocan Kavurması"),
        new(53, "53", "Rize", "Karadeniz", 41.0201, 40.5234, "RZV", "Ayder Yaylası, Pokut Yaylası, Zilkale, Fırtına Deresi", "Rize Çayı, Muhlama, Rize Kavurması"),
        new(54, "54", "Sakarya", "Marmara", 40.7569, 30.3783, null, "Sapanca Gölü, Acarlar Longozu, Taraklı", "Islama Köfte, Kabak Tatlısı"),
        new(55, "55", "Samsun", "Karadeniz", 41.2867, 36.3300, "SZF", "Bandırma Vapuru, Şahinkaya Kanyonu, Amisos Tepesi", "Bafra Pidesi, Terme Pidesi, Nokul"),
        new(56, "56", "Siirt", "Güneydoğu Anadolu", 37.9333, 41.9500, "SXZ", "Botan Vadisi, Tillo Kalesi Cam Teras", "Büryan Kebabı, Perde Pilavı"),
        new(57, "57", "Sinop", "Karadeniz", 42.0231, 35.1531, "NOP", "Sinop Cezaevi, İnceburun, Hamsilos Koyu, Erfelek Şelaleleri", "Sinop Mantısı, Nokul"),
        new(58, "58", "Sivas", "İç Anadolu", 39.7477, 37.0179, "VAS", "Divriği Ulu Camii, Çifte Minareli Medrese, Gökpınar Gölü", "Sivas Köftesi, Madımak, Katmer"),
        new(59, "59", "Tekirdağ", "Marmara", 40.9833, 27.5167, "TEQ", "Uçmakdere, Şarköy, Rakoczi Müzesi", "Tekirdağ Köftesi, Hayrabolu Tatlısı"),
        new(60, "60", "Tokat", "Karadeniz", 40.3167, 36.5500, "TJK", "Ballıca Mağarası, Tokat Kalesi, Taşhan", "Tokat Kebabı, Yaprak Sarması, Çemen"),
        new(61, "61", "Trabzon", "Karadeniz", 41.0027, 39.7168, "TZX", "Sümela Manastırı, Uzungöl, Atatürk Köşkü", "Akçaabat Köftesi, Kuymak, Hamsiköy Sütlacı"),
        new(62, "62", "Tunceli", "Doğu Anadolu", 39.1079, 39.5401, "EZS", "Munzur Vadisi, Ovacık Gözeleri", "Gülik, Babuko"),
        new(63, "63", "Şanlıurfa", "Güneydoğu Anadolu", 37.1591, 38.7969, "SFQ", "Göbeklitepe, Balıklıgöl, Halfeti, Harran", "Urfa Kebap, Çiğ Köfte, Şıllık Tatlısı"),
        new(64, "64", "Uşak", "Ege", 38.6823, 29.4082, "USQ", "Ulubey Kanyonu, Blaundus Antik Kenti, Clandras Köprüsü", "Uşak Tarhanası, Döndürme"),
        new(65, "65", "Van", "Doğu Anadolu", 38.4891, 43.4089, "VAN", "Akdamar Adası, Van Gölü, Hoşap Kalesi, Muradiye Şelalesi", "Van Kahvaltısı, Otlu Peynir, Keledoş"),
        new(66, "66", "Yozgat", "İç Anadolu", 39.8181, 34.8147, null, "Çamlık Milli Parkı, Basilica Therma (Sarıkaya Roma Hamamı)", "Testi Kebabı, Arabaşı"),
        new(67, "67", "Zonguldak", "Karadeniz", 41.4564, 31.7987, "ONQ", "Gökgöl Mağarası, Amasra/Ereğli Kıyıları, Maden Müzesi", "Ereğli Pidesi, Devrek Simidi"),
        new(68, "68", "Aksaray", "İç Anadolu", 38.3687, 34.0370, null, "Ihlara Vadisi, Sultanhanı Kervansarayı, Hasan Dağı", "Aksaray Tava, Şerbetli Pide"),
        new(69, "69", "Bayburt", "Karadeniz", 40.2552, 40.2249, null, "Baksı Müzesi, Bayburt Kalesi, Aydıntepe Yeraltı Şehri", "Galacoş, Lor Dolması"),
        new(70, "70", "Karaman", "İç Anadolu", 37.1759, 33.2287, null, "Taşkale Tahıl Ambarları, Manazan Mağaraları", "Batırık, Calla"),
        new(71, "71", "Kırıkkale", "İç Anadolu", 39.8468, 33.5153, null, "Çeşnigir Köprüsü, Silah Müzesi", "Keskin Tava"),
        new(72, "72", "Batman", "Güneydoğu Anadolu", 37.8812, 41.1351, "BAL", "Hasankeyf, Malabadi Köprüsü", "Şam Böreği, Perde Pilavı"),
        new(73, "73", "Şırnak", "Güneydoğu Anadolu", 37.5164, 42.4611, "NKT", "Cizre Mem u Zin Türbesi, Kasrik Boğazı", "Suryaz, Kutlık"),
        new(74, "74", "Bartın", "Karadeniz", 41.6344, 32.3375, "ONQ", "Amasra, İnkumu, Güzelcehisar Lav Sütunları", "Amasra Salatası, Pum Pum Çorbası"),
        new(75, "75", "Ardahan", "Doğu Anadolu", 41.1105, 42.7022, "KSY", "Çıldır Gölü, Şeytan Kalesi, Yalnızçam", "Kaz Eti, Evelik Çorbası"),
        new(76, "76", "Iğdır", "Doğu Anadolu", 39.9167, 44.0333, "IGD", "Tuzluca Tuz Mağaraları, Ağrı Dağı Manzarası", "Bozbaş, Kayısı"),
        new(77, "77", "Yalova", "Marmara", 40.6500, 29.2667, null, "Yürüyen Köşk, Termal Kaplıcalar, Sudüşen Şelalesi", "Yalova Sütlüsü, Termal Çorbası"),
        new(78, "78", "Karabük", "Karadeniz", 41.2061, 32.6204, null, "Safranbolu Evleri, Kristal Teras, Yenice Ormanları", "Safranbolu Lokumu, Peruhi"),
        new(79, "79", "Kilis", "Güneydoğu Anadolu", 36.7184, 37.1212, "GZT", "Ravanda Kalesi, Oylum Höyük", "Kilis Tava, Cennet Çamuru"),
        new(80, "80", "Osmaniye", "Akdeniz", 37.0742, 36.2478, "ADA", "Karatepe-Aslantaş Açık Hava Müzesi, Kastabala", "Yer Fıstığı, Kömbe"),
        new(81, "81", "Düzce", "Karadeniz", 40.8438, 31.1565, null, "Samandere Şelalesi, Akçakoca, Efteni Gölü", "Çerkez Tavuğu, Melengüçceği Tatlısı")
    };

    public static readonly IReadOnlyList<AirportInfo> Airports = new List<AirportInfo>
    {
        new("SAW", "LTFJ", "İstanbul Sabiha Gökçen Havalimanı", "İstanbul", 34, 40.8986, 29.3092),
        new("IST", "LTFM", "İstanbul Havalimanı", "İstanbul", 34, 41.2753, 28.7519),
        new("ASR", "LTAU", "Kayseri Erkilet Havalimanı", "Kayseri", 38, 38.7704, 35.4954),
        new("ESB", "LTAC", "Ankara Esenboğa Havalimanı", "Ankara", 6, 40.1281, 32.9951),
        new("AYT", "LTAI", "Antalya Havalimanı", "Antalya", 7, 36.8987, 30.8005),
        new("ADB", "LTBJ", "İzmir Adnan Menderes Havalimanı", "İzmir", 35, 38.2924, 27.1570),
        new("TZX", "LTCG", "Trabzon Havalimanı", "Trabzon", 61, 40.9951, 39.7897),
        new("ADA", "LTAF", "Adana Şakirpaşa / Çukurova Havalimanı", "Adana", 1, 36.9822, 35.2804),
        new("GZT", "LTAJ", "Gaziantep Havalimanı", "Gaziantep", 27, 36.9472, 37.4787),
        new("DLM", "LTBS", "Muğla Dalaman Havalimanı", "Muğla", 48, 36.7131, 28.7925),
        new("BJV", "LTFE", "Milas-Bodrum Havalimanı", "Muğla", 48, 37.2506, 27.6643),
        new("VAN", "LTCI", "Van Ferit Melen Havalimanı", "Van", 65, 38.4682, 43.3323),
        new("ERZ", "LTCE", "Erzurum Havalimanı", "Erzurum", 25, 39.9565, 41.1702),
        new("DIY", "LTCC", "Diyarbakır Havalimanı", "Diyarbakır", 21, 37.8939, 40.2010),
        new("SZF", "LTFH", "Samsun Çarşamba Havalimanı", "Samsun", 55, 41.2545, 36.5671),
        new("KYA", "LTAN", "Konya Havalimanı", "Konya", 42, 37.9790, 32.5619),
        new("NVV", "LTAZ", "Kapadokya Havalimanı", "Nevşehir", 50, 38.7719, 34.5345),
        new("HTY", "LTDA", "Hatay Havalimanı", "Hatay", 31, 36.3628, 36.2822),
        new("MLX", "LTAT", "Malatya Erhaç Havalimanı", "Malatya", 44, 38.4353, 38.0910),
        new("RZV", "LTFO", "Rize-Artvin Havalimanı", "Rize", 53, 41.1692, 40.8289),
        new("OGU", "LTCB", "Ordu-Giresun Havalimanı", "Ordu", 52, 40.9670, 38.0800),
        new("KSY", "LTCF", "Kars Harakani Havalimanı", "Kars", 36, 40.5622, 43.1150),
        new("MQM", "LTCR", "Mardin Prof. Dr. Aziz Sancar Havalimanı", "Mardin", 47, 37.2233, 40.6317),
        new("SFQ", "LTCS", "Şanlıurfa GAP Havalimanı", "Şanlıurfa", 63, 37.4456, 38.8956),
        new("DNZ", "LTAY", "Denizli Çardak Havalimanı", "Denizli", 20, 37.7856, 29.7013),
        new("EDO", "LTFD", "Balıkesir Koca Seyit Havalimanı", "Balıkesir", 10, 39.5546, 27.0138),
        new("VAS", "LTAR", "Sivas Nuri Demirağ Havalimanı", "Sivas", 58, 39.8138, 36.9035)
    };

    public static readonly IReadOnlyList<AircraftModelInfo> AircraftModels = new List<AircraftModelInfo>
    {
        new(
            "A321",
            "Airbus",
            "A321-200",
            "Airbus A321",
            "A321",
            "Dar Gövde (Narrow-body)",
            "2x IAE V2533-A5 / CFM56-5B3",
            220,
            5950,
            840,
            "35.8 m",
            "44.51 m",
            1993,
            "3-3 (Tek Koridor)",
            "Airbus A320 ailesinin uzatılmış gövdeli üyesi. Yüksek kapasiteli iç hat ve orta menzil uçuşlarında Türkiye'de Pegasus ve THY tarafından yoğun olarak kullanılır."
        ),
        new(
            "A321NEO",
            "Airbus",
            "A321neo",
            "Airbus A321neo",
            "A21N",
            "Yeni Nesil Dar Gövde (Narrow-body)",
            "2x CFM International LEAP-1A / PW1133G",
            240,
            7400,
            840,
            "35.8 m (Sharklets)",
            "44.51 m",
            2016,
            "3-3 (Tek Koridor)",
            "New Engine Option (neo) teknolojisi ve Sharklet kanat uçları sayesinde %20 daha az yakıt tüketimi ve %50 daha sessiz kabin sunan modern yolcu uçağı. AJet, Pegasus ve THY filosunun amiral gemisi dar gövdelerindendir."
        ),
        new(
            "B738",
            "Boeing",
            "737-800",
            "Boeing 737-800 NG",
            "B738",
            "Dar Gövde (Narrow-body)",
            "2x CFM56-7B26",
            189,
            5436,
            842,
            "35.79 m",
            "39.5 m",
            1997,
            "3-3 (Tek Koridor)",
            "Dünya sivil havacılık tarihinin en çok üretilen Next Generation (NG) dar gövde uçağı. Türkiye semalarında en sık görülen modellerden biridir."
        ),
        new(
            "A320NEO",
            "Airbus",
            "A320neo",
            "Airbus A320neo",
            "A20N",
            "Yeni Nesil Dar Gövde (Narrow-body)",
            "2x CFM LEAP-1A",
            186,
            6300,
            840,
            "35.8 m",
            "37.57 m",
            2014,
            "3-3 (Tek Koridor)",
            "Kısa ve orta menzilli rotalarda yüksek verimlilik sunan yeni nesil tek koridorlu yolcu uçağı."
        ),
        new(
            "B38M",
            "Boeing",
            "737 MAX 8",
            "Boeing 737 MAX 8",
            "B38M",
            "Yeni Nesil Dar Gövde (Narrow-body)",
            "2x CFM LEAP-1B",
            189,
            6570,
            839,
            "35.9 m",
            "39.52 m",
            2016,
            "3-3 (Tek Koridor)",
            "Çift katmanlı Advanced Technology (AT) kanat uçları ve LEAP-1B motorlarıyla öne çıkan modern dar gövde yolcu uçağı."
        ),
        new(
            "A333",
            "Airbus",
            "A330-300",
            "Airbus A330-300",
            "A333",
            "Geniş Gövde (Wide-body)",
            "2x Rolls-Royce Trent 700 / GE CF6",
            289,
            11750,
            871,
            "60.3 m",
            "63.66 m",
            1992,
            "2-4-2 (Çift Koridor)",
            "Yoğun iç hat (İstanbul-Antalya, İstanbul-İzmir) ve kıtalararası uçuşlarda yüksek konfor sunan çift koridorlu geniş gövde uçak."
        ),
        new(
            "B77W",
            "Boeing",
            "777-300ER",
            "Boeing 777-300ER",
            "B77W",
            "Geniş Gövde (Wide-body)",
            "2x GE90-115B",
            349,
            13650,
            892,
            "64.8 m",
            "73.9 m",
            2003,
            "3-3-3 (Çift Koridor)",
            "Dünyanın en güçlü ticari jet motorları olan GE90-115B ile donatılmış uzun menzil amiral gemisi."
        ),
        new(
            "B789",
            "Boeing",
            "787-9 Dreamliner",
            "Boeing 787-9 Dreamliner",
            "B789",
            "Yeni Nesil Geniş Gövde",
            "2x GEnx-1B",
            300,
            14140,
            903,
            "60.12 m",
            "62.81 m",
            2013,
            "3-3-3 (Çift Koridor)",
            "Kompozit gövde yapısı, elektronik karartmalı büyük pencereleri ve düşük kabin basıncı ile yorgunluğu azaltan uzun menzil uçağı."
        ),
        new(
            "A359",
            "Airbus",
            "A350-900",
            "Airbus A350-900 XWB",
            "A359",
            "Yeni Nesil Geniş Gövde",
            "2x Rolls-Royce Trent XWB",
            329,
            15000,
            903,
            "64.75 m",
            "66.8 m",
            2013,
            "3-3-3 (Çift Koridor)",
            "Karbon fiber ekstra geniş gövdesi (XWB) ve ikonik kokpit camı maskesiyle modern havacılığın zirvesi."
        )
    };

    public static double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371.0; // Earth radius km
        double dLat = ToRadians(lat2 - lat1);
        double dLon = ToRadians(lon2 - lon1);
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return Math.Round(R * c, 1);
    }

    public static int CalculateDistanceBetweenAirports(string fromIata, string toIata)
    {
        var from = Airports.FirstOrDefault(a => string.Equals(a.Iata, fromIata, StringComparison.OrdinalIgnoreCase));
        var to = Airports.FirstOrDefault(a => string.Equals(a.Iata, toIata, StringComparison.OrdinalIgnoreCase));
        if (from is null || to is null) return 0;
        return (int)Math.Round(CalculateDistanceKm(from.Latitude, from.Longitude, to.Latitude, to.Longitude));
    }

    private static double ToRadians(double deg) => deg * (Math.PI / 180.0);

    public static IReadOnlyList<int> FindHighwayTransitPlates(int fromPlate, int toPlate)
    {
        if (fromPlate == 34 && toPlate == 38)
            return new[] { 41, 54, 81, 14, 6, 71, 40 };
        if (fromPlate == 34 && toPlate == 7)
            return new[] { 41, 54, 11, 43, 3, 15 };
        if (fromPlate == 34 && toPlate == 35)
            return new[] { 41, 77, 16, 10, 45 };

        var fromP = Provinces.FirstOrDefault(p => p.PlateCode == fromPlate);
        var toP = Provinces.FirstOrDefault(p => p.PlateCode == toPlate);
        if (fromP is null || toP is null || fromPlate == toPlate)
            return Array.Empty<int>();

        double ax = fromP.Longitude, ay = fromP.Latitude;
        double bx = toP.Longitude, by = toP.Latitude;
        double dx = bx - ax, dy = by - ay;
        double lenSq = dx * dx + dy * dy;
        if (lenSq < 0.01) return Array.Empty<int>();

        return Provinces
            .Where(p => p.PlateCode != fromPlate && p.PlateCode != toPlate)
            .Select(p =>
            {
                double t = ((p.Longitude - ax) * dx + (p.Latitude - ay) * dy) / lenSq;
                double projLon = ax + t * dx;
                double projLat = ay + t * dy;
                double dist = Math.Sqrt(Math.Pow(p.Longitude - projLon, 2) + Math.Pow((p.Latitude - projLat) * 1.25, 2));
                return (p.PlateCode, t, dist);
            })
            .Where(x => x.t > 0.06 && x.t < 0.94 && x.dist <= 0.58)
            .OrderBy(x => x.t)
            .Select(x => x.PlateCode)
            .ToList();
    }

    public static UserProfileState CreateDefaultMelihProfile()
    {
        int sawAsrDistance = CalculateDistanceBetweenAirports("SAW", "ASR");

        var flights = new List<FlightRecord>
        {
            new(
                Id: "FL-PC2730-20261108",
                Airline: "Pegasus Airlines",
                AirlineCode: "PC",
                FlightNumber: "PC2730",
                Date: "2026-11-08",
                FromIata: "SAW",
                ToIata: "ASR",
                DepartureTime: "05:30",
                ArrivalTime: "06:45",
                AircraftId: "A321",
                AircraftName: "Airbus A321",
                Seat: "20A",
                SeatType: "Cam Kenarı (Sol)",
                Terminal: "Ana Terminal",
                Gate: "-",
                BoardingTime: "04:50",
                BoardingZone: "Genel",
                SequenceNo: "-",
                Baggage: "15 Kg + Kabin (55x40x23 cm)",
                MaskedPnr: "****P9",
                Status: "F (Uçuldu)",
                DistanceKm: sawAsrDistance,
                DurationMinutes: 75,
                DirectionLabel: "Gidiş (SAW → ASR)",
                TicketImageUrl: "assets/tickets/pegasus-pc2730.png",
                Notes: "Sabah erken uçuşu ile İstanbul Sabiha Gökçen'den Kayseri Erkilet Havalimanı'na gidiş. Koltuk 20A cam kenarı."
            ),
            new(
                Id: "FL-VF3181-20261108",
                Airline: "AJet",
                AirlineCode: "VF",
                FlightNumber: "VF3181",
                Date: "2026-11-08",
                FromIata: "ASR",
                ToIata: "SAW",
                DepartureTime: "21:25",
                ArrivalTime: "23:00",
                AircraftId: "A321NEO",
                AircraftName: "Airbus A321neo",
                Seat: "20A",
                SeatType: "Cam Kenarı (Sol)",
                Terminal: "-",
                Gate: "206",
                BoardingTime: "20:40",
                BoardingZone: "C",
                SequenceNo: "9",
                Baggage: "8 Kg Kabin Bagajı",
                MaskedPnr: "****Y4",
                Status: "Uçuldu",
                DistanceKm: sawAsrDistance,
                DurationMinutes: 95,
                DirectionLabel: "Dönüş (ASR → SAW)",
                TicketImageUrl: "assets/tickets/ajet-vf3181.jpg",
                Notes: "AJet Airbus A321neo ile Kayseri'den İstanbul Sabiha Gökçen'e akşam dönüş uçuşu. Kapı 206, Bölge C, Seq No 9, Koltuk 20A."
            )
        };

        var trips = new List<TripRecord>
        {
            new(
                Id: "TRIP-KAYSERI-20261108",
                Title: "İstanbul ⇄ Kayseri Günübirlik Hava Seyahati",
                FromPlate: 34,
                ToPlate: 38,
                TransportType: "plane",
                StartDate: "2026-11-08",
                EndDate: "2026-11-08",
                IsRoundTrip: true,
                FlightIds: new List<string> { "FL-PC2730-20261108", "FL-VF3181-20261108" },
                Summary: "Sabah 05:30 Pegasus PC2730 (Airbus A321) ile İstanbul SAW'dan Kayseri ASR'ye gidiş, akşam 21:25 AJet VF3181 (Airbus A321neo) ile dönüş.",
                Highlights: new List<string>
                {
                    "Gidiş: Pegasus PC2730 • SAW → ASR • Airbus A321 • Koltuk 20A",
                    "Dönüş: AJet VF3181 • ASR → SAW • Airbus A321neo • Koltuk 20A (Kapı 206)",
                    "Toplam 1.132 km uçuş mesafesi ve 2 sa 50 dk havada kalış süresi"
                }
            )
        };

        var statuses = new Dictionary<int, string>
        {
            [34] = "home",
            [38] = "visited"
        };

        return new UserProfileState(
            Name: "Melih Durmaz",
            Handle: "@melih",
            Bio: "Türkiye Seyahat Haritam & Kişisel Havacılık / Uçuş Günlüğüm",
            HomePlateCode: 34,
            ProvinceStatuses: statuses,
            Flights: flights,
            Trips: trips
        );
    }
}
