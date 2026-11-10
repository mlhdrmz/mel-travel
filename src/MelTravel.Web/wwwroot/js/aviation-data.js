// ============================================================================
// MelTravel - Havacılık, Havalimanları, Uçak Ansiklopedisi ve FlightRadar Verisi
// ============================================================================
window.TURKEY_AIRPORTS = [
{ iata: "SAW", icao: "LTFJ", name: "İstanbul Sabiha Gökçen Havalimanı", city: "İstanbul", plate: 34, lat: 40.8986, lon: 29.3092, runway: "06L/24R (3000m) & 06R/24L (3500m)", elevationFt: 312, hubFor: ["Pegasus Airlines", "AJet"] },
{ iata: "IST", icao: "LTFM", name: "İstanbul Havalimanı", city: "İstanbul", plate: 34, lat: 41.2753, lon: 28.7519, runway: "16L/34R, 17L/35R, 18/36 (4100m)", elevationFt: 325, hubFor: ["Türk Hava Yolları"] },
{ iata: "ASR", icao: "LTAU", name: "Kayseri Erkilet Havalimanı", city: "Kayseri", plate: 38, lat: 38.7704, lon: 35.4954, runway: "07/25 (3000m Beton/Asfalt)", elevationFt: 3462, hubFor: ["Bölgesel / İç & Dış Hat"] },
{ iata: "ESB", icao: "LTAC", name: "Ankara Esenboğa Havalimanı", city: "Ankara", plate: 6, lat: 40.1281, lon: 32.9951, runway: "03L/21R & 03R/21L (3750m)", elevationFt: 3125, hubFor: ["AJet", "Türk Hava Yolları"] },
{ iata: "AYT", icao: "LTAI", name: "Antalya Havalimanı", city: "Antalya", plate: 7, lat: 36.8987, lon: 30.8005, runway: "18L/36R & 18C/36C (3400m)", elevationFt: 177, hubFor: ["SunExpress", "Pegasus", "Corendon"] },
{ iata: "ADB", icao: "LTBJ", name: "İzmir Adnan Menderes Havalimanı", city: "İzmir", plate: 35, lat: 38.2924, lon: 27.1570, runway: "16L/34R & 16R/34L (3240m)", elevationFt: 412, hubFor: ["SunExpress", "Pegasus"] },
{ iata: "TZX", icao: "LTCG", name: "Trabzon Havalimanı", city: "Trabzon", plate: 61, lat: 40.9951, lon: 39.7897, runway: "11/29 (2640m)", elevationFt: 104, hubFor: ["Karadeniz Bölgesel"] },
{ iata: "ADA", icao: "LTAF", name: "Adana / Çukurova Havalimanı", city: "Adana", plate: 1, lat: 36.9822, lon: 35.2804, runway: "05/23 (3500m)", elevationFt: 65, hubFor: ["Çukurova Bölgesel"] },
{ iata: "GZT", icao: "LTAJ", name: "Gaziantep Havalimanı", city: "Gaziantep", plate: 27, lat: 36.9472, lon: 37.4787, runway: "09/27 (3000m)", elevationFt: 2315, hubFor: ["Güneydoğu Bölgesel"] },
{ iata: "DLM", icao: "LTBS", name: "Muğla Dalaman Havalimanı", city: "Muğla", plate: 48, lat: 36.7131, lon: 28.7925, runway: "01/19 (3000m)", elevationFt: 20, hubFor: ["Turizm Sezonluk"] },
{ iata: "BJV", icao: "LTFE", name: "Milas-Bodrum Havalimanı", city: "Muğla", plate: 48, lat: 37.2506, lon: 27.6643, runway: "10/28 (3000m)", elevationFt: 21, hubFor: ["Turizm Sezonluk"] },
{ iata: "VAN", icao: "LTCI", name: "Van Ferit Melen Havalimanı", city: "Van", plate: 65, lat: 38.4682, lon: 43.3323, runway: "03/21 (2750m)", elevationFt: 5480, hubFor: ["Doğu Anadolu"] },
{ iata: "ERZ", icao: "LTCE", name: "Erzurum Havalimanı", city: "Erzurum", plate: 25, lat: 39.9565, lon: 41.1702, runway: "08L/26R (3810m)", elevationFt: 5763, hubFor: ["Doğu Anadolu"] },
{ iata: "DIY", icao: "LTCC", name: "Diyarbakır Havalimanı", city: "Diyarbakır", plate: 21, lat: 37.8939, lon: 40.2010, runway: "16/34 (3549m)", elevationFt: 2251, hubFor: ["Güneydoğu"] },
{ iata: "SZF", icao: "LTFH", name: "Samsun Çarşamba Havalimanı", city: "Samsun", plate: 55, lat: 41.2545, lon: 36.5671, runway: "13/31 (3000m)", elevationFt: 18, hubFor: ["Orta Karadeniz"] },
{ iata: "KYA", icao: "LTAN", name: "Konya Havalimanı", city: "Konya", plate: 42, lat: 37.9790, lon: 32.5619, runway: "01L/19R (3350m)", elevationFt: 3380, hubFor: ["İç Anadolu"] },
{ iata: "NVV", icao: "LTAZ", name: "Nevşehir Kapadokya Havalimanı", city: "Nevşehir", plate: 50, lat: 38.7719, lon: 34.5345, runway: "11/29 (3000m)", elevationFt: 3100, hubFor: ["Kapadokya"] },
{ iata: "HTY", icao: "LTDA", name: "Hatay Havalimanı", city: "Hatay", plate: 31, lat: 36.3628, lon: 36.2822, runway: "04/22 (3000m)", elevationFt: 266, hubFor: ["Doğu Akdeniz"] },
{ iata: "MLX", icao: "LTAT", name: "Malatya Erhaç Havalimanı", city: "Malatya", plate: 44, lat: 38.4353, lon: 38.0910, runway: "03/21 (3350m)", elevationFt: 2828, hubFor: ["Doğu Anadolu"] },
{ iata: "RZV", icao: "LTFO", name: "Rize-Artvin Havalimanı", city: "Rize", plate: 53, lat: 41.1692, lon: 40.8289, runway: "06/24 (3000m Deniz Dolgusu)", elevationFt: 10, hubFor: ["Doğu Karadeniz"] },
{ iata: "OGU", icao: "LTCB", name: "Ordu-Giresun Havalimanı", city: "Ordu", plate: 52, lat: 40.9670, lon: 38.0800, runway: "10/28 (3000m Deniz Dolgusu)", elevationFt: 10, hubFor: ["Doğu Karadeniz"] },
{ iata: "KSY", icao: "LTCF", name: "Kars Harakani Havalimanı", city: "Kars", plate: 36, lat: 40.5622, lon: 43.1150, runway: "06/24 (3500m)", elevationFt: 5889, hubFor: ["Kuzeydoğu Anadolu"] },
{ iata: "MQM", icao: "LTCR", name: "Mardin Prof. Dr. Aziz Sancar Havalimanı", city: "Mardin", plate: 47, lat: 37.2233, lon: 40.6317, runway: "03/21 (3000m)", elevationFt: 1715, hubFor: ["Mezopotamya"] },
{ iata: "SFQ", icao: "LTCS", name: "Şanlıurfa GAP Havalimanı", city: "Şanlıurfa", plate: 63, lat: 37.4456, lon: 38.8956, runway: "04/22 (4000m Türkiye'nin En Uzunlarından)", elevationFt: 2700, hubFor: ["Güneydoğu"] },
{ iata: "DNZ", icao: "LTAY", name: "Denizli Çardak Havalimanı", city: "Denizli", plate: 20, lat: 37.7856, lon: 29.7013, runway: "06/24 (3000m)", elevationFt: 2795, hubFor: ["Pamukkale"] },
{ iata: "EDO", icao: "LTFD", name: "Balıkesir Koca Seyit Havalimanı", city: "Balıkesir", plate: 10, lat: 39.5546, lon: 27.0138, runway: "05/23 (3000m)", elevationFt: 185, hubFor: ["Kuzey Ege"] },
{ iata: "VAS", icao: "LTAR", name: "Sivas Nuri Demirağ Havalimanı", city: "Sivas", plate: 58, lat: 39.8138, lon: 36.9035, runway: "01/19 (3811m)", elevationFt: 5236, hubFor: ["İç Anadolu"] }
];
window.AIRCRAFT_CATALOG = [
{
id: "A321",
manufacturer: "Airbus",
model: "A321-200",
fullName: "Airbus A321",
icao: "A321",
category: "Dar Gövde (Narrow-body Twinjet)",
engines: "2× IAE V2533-A5 / CFM56-5B3 Turbofan",
maxPassengers: 220,
rangeKm: 5950,
cruiseSpeedKmh: 840,
mach: "Mach 0.78",
ceilingFt: "39,800 ft",
wingspan: "35.80 m",
length: "44.51 m",
height: "11.76 m",
firstFlight: 1993,
seatLayout: "3-3 (A-B-C | Koridor | D-E-F)",
totalRows: 36,
operatorsTr: ["Pegasus Airlines", "Türk Hava Yolları", "Freebird", "Tailwind"],
badgeColor: "#f59e0b",
photoUrl: "https://images.unsplash.com/photo-1556388158-158ea5ccacbd?auto=format&fit=crop&w=1000&q=80",
cockpitNote: "Fly-by-wire yan lövye (sidestick) kontrol sistemi ve çift motorlu yüksek verimli dar gövde mimarisi.",
description: "Airbus A320 ailesinin uzatılmış gövdeli üyesi olan A321, 44.51 metrelik uzunluğuyla dar gövde sınıfında en yüksek yolcu kapasitesini sunar. Melih'in 08 Kasım 2026 sabahı PC2730 (SAW → ASR) uçuşunda 20A cam kenarı koltuğunda uçtuğu modeldir.",
highlights: [
"Tek koridorlu (3-3) kabin düzeninde 220 yolcuya kadar kapasite",
"Kanat arkası 20A koltuğundan etkileyici kanat ve flap manzarası",
"Kısa ve orta menzilli yoğun rotaların en güvenilir iş gücü"
]
},
{
id: "A321NEO",
manufacturer: "Airbus",
model: "A321neo",
fullName: "Airbus A321neo (New Engine Option)",
icao: "A21N",
category: "Yeni Nesil Dar Gövde (Next-Gen Narrow-body)",
engines: "2× CFM International LEAP-1A / Pratt & Whitney PW1133G-JM",
maxPassengers: 240,
rangeKm: 7400,
cruiseSpeedKmh: 840,
mach: "Mach 0.78",
ceilingFt: "39,800 ft",
wingspan: "35.80 m (2.4m Sharklet Kanat Ucu)",
length: "44.51 m",
height: "11.76 m",
firstFlight: 2016,
seatLayout: "3-3 (A-B-C | Koridor | D-E-F)",
totalRows: 40,
operatorsTr: ["AJet", "Pegasus Airlines", "Türk Hava Yolları", "SunExpress"],
badgeColor: "#0ea5e9",
photoUrl: "https://images.unsplash.com/photo-1540339832862-474599807836?auto=format&fit=crop&w=1000&q=80",
cockpitNote: "Yeni nesil yüksek bypass oranlı motorlar, 2.4 metrelik kıvrık Sharklet kanat uçları ve Airspace kabin aydınlatması.",
description: "Airbus'ın 'New Engine Option' (neo) teknolojisiyle donatılan A321neo, önceki nesle göre %20 daha az yakıt tüketimi, %50 daha düşük gürültü ayak izi ve 7.400 km'ye varan menzil sunar. Melih'in 08 Kasım 2026 akşamı AJet VF3181 (ASR → SAW) dönüş uçuşunda 20A koltuğunda deneyimlediği modern uçaktır.",
highlights: [
"2.4 metre yüksekliğindeki aerodinamik Sharklet kanat uçları",
"Devasa fan çapına sahip ultra sessiz LEAP-1A / GTF motorlar",
"AJet ve Pegasus'un en genç ve modern filo omurgası"
]
},
{
id: "B738",
manufacturer: "Boeing",
model: "737-800 NG",
fullName: "Boeing 737-800 Next Generation",
icao: "B738",
category: "Dar Gövde (Narrow-body Twinjet)",
engines: "2× CFM56-7B26 Turbofan",
maxPassengers: 189,
rangeKm: 5436,
cruiseSpeedKmh: 842,
mach: "Mach 0.785",
ceilingFt: "41,000 ft",
wingspan: "35.79 m (Blended Winglets)",
length: "39.47 m",
height: "12.55 m",
firstFlight: 1997,
seatLayout: "3-3 (A-B-C | Koridor | D-E-F)",
totalRows: 32,
operatorsTr: ["AJet", "Pegasus Airlines", "SunExpress", "Türk Hava Yolları", "Corendon"],
badgeColor: "#10b981",
photoUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1000&q=80",
cockpitNote: "Klasik Boeing boyunduruk (yoke) lövye sistemi ve kıvrık Blended Winglet kanat uçları.",
description: "Sivil havacılık tarihinin en çok üretilen ve Türkiye'de iç hatlarda yıllarca en çok uçan Next Generation yolcu uçağı.",
highlights: [
"41.000 feet servis tavanı ile kendi sınıfının yüksek irtifa lideri",
"Alttan basık (hamster pouch) karakteristik CFM56 motor kaportası",
"Türkiye'deki tüm büyük havayollarının filosunda yer alan efsane"
]
},
{
id: "A320NEO",
manufacturer: "Airbus",
model: "A320neo",
fullName: "Airbus A320neo",
icao: "A20N",
category: "Yeni Nesil Dar Gövde",
engines: "2× CFM LEAP-1A / PW1127G",
maxPassengers: 186,
rangeKm: 6300,
cruiseSpeedKmh: 840,
mach: "Mach 0.78",
ceilingFt: "39,800 ft",
wingspan: "35.80 m",
length: "37.57 m",
height: "11.76 m",
firstFlight: 2014,
seatLayout: "3-3 (A-B-C | Koridor | D-E-F)",
totalRows: 31,
operatorsTr: ["Pegasus Airlines", "AJet", "Türk Hava Yolları"],
badgeColor: "#6366f1",
photoUrl: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1000&q=80",
cockpitNote: "A321neo ile aynı kokpit tip sertifikasını paylaşan çevik dar gövde.",
description: "Kısa ve orta menzilli rotalarda yüksek yakıt tasarrufu ve sessiz kabin konforu sunan yeni nesil tek koridorlu uçak.",
highlights: [
"Geniş kabin kesiti ile omuz hizasında ferah yolculuk",
"Sharklet kanat uçları ve düşük karbon emisyonu"
]
},
{
id: "B38M",
manufacturer: "Boeing",
model: "737 MAX 8",
fullName: "Boeing 737 MAX 8",
icao: "B38M",
category: "Yeni Nesil Dar Gövde",
engines: "2× CFM International LEAP-1B",
maxPassengers: 189,
rangeKm: 6570,
cruiseSpeedKmh: 839,
mach: "Mach 0.79",
ceilingFt: "41,000 ft",
wingspan: "35.92 m (Split-Tip Winglet)",
length: "39.52 m",
height: "12.30 m",
firstFlight: 2016,
seatLayout: "3-3 (A-B-C | Koridor | D-E-F)",
totalRows: 32,
operatorsTr: ["Türk Hava Yolları", "AJet", "SunExpress", "Corendon"],
badgeColor: "#8b5cf6",
photoUrl: "https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&w=1000&q=80",
cockpitNote: "Geniş ekranlı 15 inçlik Boeing 787 tarzı dijital kokpit ekranları ve çift çatallı AT kanat uçları.",
description: "Hem yukarı hem aşağı uzanan ikonik Split-Tip Winglet kanat uçları ve testere dişli (chevron) motor çıkışlarıyla hemen tanınan modern dar gövde.",
highlights: [
"Boeing Sky Interior LED tavan aydınlatması",
"Arka kısmı tırtıklı (Chevron nozzle) LEAP-1B motor tasarımı"
]
},
{
id: "A333",
manufacturer: "Airbus",
model: "A330-300",
fullName: "Airbus A330-300",
icao: "A333",
category: "Geniş Gövde (Wide-body Twinjet)",
engines: "2× Rolls-Royce Trent 772B / GE CF6-80E1",
maxPassengers: 289,
rangeKm: 11750,
cruiseSpeedKmh: 871,
mach: "Mach 0.82",
ceilingFt: "41,450 ft",
wingspan: "60.30 m",
length: "63.66 m",
height: "16.83 m",
firstFlight: 1992,
seatLayout: "2-4-2 (A-C | D-E-F-G | H-K)",
totalRows: 42,
operatorsTr: ["Türk Hava Yolları"],
badgeColor: "#ec4899",
photoUrl: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1000&q=80",
cockpitNote: "Çift koridorlu uzun menzil konforu ve 2-4-2 cam kenarı ikili koltuk avantajı.",
description: "Yoğun iç hat rotalarında (İstanbul-Antalya, İstanbul-İzmir) ve uluslararası uçuşlarda geniş gövde konforu sunan efsanevi çift koridorlu uçak.",
highlights: [
"Cam kenarlarında 2'li koltuk dizilimi (2-4-2) sayesinde yüksek konfor",
"60.3 metrelik devasa kanat açıklığı ve süzülüş performansı"
]
},
{
id: "B77W",
manufacturer: "Boeing",
model: "777-300ER",
fullName: "Boeing 777-300ER (Triple Seven)",
icao: "B77W",
category: "Geniş Gövde (Wide-body Long-Haul)",
engines: "2× General Electric GE90-115B",
maxPassengers: 349,
rangeKm: 13650,
cruiseSpeedKmh: 892,
mach: "Mach 0.84",
ceilingFt: "43,100 ft",
wingspan: "64.80 m",
length: "73.86 m",
height: "18.50 m",
firstFlight: 2003,
seatLayout: "3-3-3 (Çift Koridor)",
totalRows: 52,
operatorsTr: ["Türk Hava Yolları"],
badgeColor: "#ef4444",
photoUrl: "https://images.unsplash.com/photo-1583202075376-837d5ff6bf0f?auto=format&fit=crop&w=1000&q=80",
cockpitNote: "Bir Boeing 737 gövdesi kadar geniş olan GE90-115B motorlarıyla dünyanın en güçlü çift motorlu yolcu uçağı.",
description: "73.86 metre uzunluğu, 6 tekerlekli ana iniş takımı boji yapısı ve gürleyen GE90 motorlarıyla havacılık tutkunlarının favori dev uçağı.",
highlights: [
"Guinness rekorlu GE90-115B jet motorları",
"13.650 km kesintisiz kıtalararası uçuş menzili"
]
},
{
id: "B789",
manufacturer: "Boeing",
model: "787-9 Dreamliner",
fullName: "Boeing 787-9 Dreamliner",
icao: "B789",
category: "Yeni Nesil Geniş Gövde",
engines: "2× GEnx-1B",
maxPassengers: 300,
rangeKm: 14140,
cruiseSpeedKmh: 903,
mach: "Mach 0.85",
ceilingFt: "43,100 ft",
wingspan: "60.12 m",
length: "62.81 m",
height: "17.02 m",
firstFlight: 2013,
seatLayout: "3-3-3 (Çift Koridor)",
totalRows: 44,
operatorsTr: ["Türk Hava Yolları"],
badgeColor: "#14b8a6",
photoUrl: "https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?auto=format&fit=crop&w=1000&q=80",
cockpitNote: "HUD (Head-Up Display) baş üstü göstergeleri ve esnek karbon kompozit kanat yapısı.",
description: "Yüzde 50 karbon kompozit gövdesi, güneşlik yerine düğmeyle kararan dev pencereleri ve daha yüksek kabin nem oranıyla uzun uçuş yorgunluğunu azaltan teknoloji harikası.",
highlights: [
"Elektrokromik düğmeli kararan büyük yolcu pencereleri",
"Uçuşta yukarı doğru zarifçe esneyen raked-wingtip kanatlar"
]
},
{
id: "A359",
manufacturer: "Airbus",
model: "A350-900",
fullName: "Airbus A350-900 XWB",
icao: "A359",
category: "Yeni Nesil Geniş Gövde",
engines: "2× Rolls-Royce Trent XWB",
maxPassengers: 329,
rangeKm: 15000,
cruiseSpeedKmh: 903,
mach: "Mach 0.85",
ceilingFt: "43,100 ft",
wingspan: "64.75 m",
length: "66.80 m",
height: "17.05 m",
firstFlight: 2013,
seatLayout: "3-3-3 (Çift Koridor)",
totalRows: 45,
operatorsTr: ["Türk Hava Yolları"],
badgeColor: "#3b82f6",
photoUrl: "https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?auto=format&fit=crop&w=1000&q=80",
cockpitNote: "İkonik siyah kokpit camı çerçevesi ('Zorro maskesi') ve kıvrımlı karbon kanat uçları.",
description: "Extra Wide Body (XWB) karbon fiber gövdesi ve ultra sessiz Trent XWB motorlarıyla modern uzun menzil havacılığının zirve noktalarından biri.",
highlights: [
"Kokpit camlarında karakteristik siyah 'Zorro' maskesi",
"Kuyruk kamerası ile yolcu ekranından canlı dış görünüm"
]
}
];
// Yerleşik Türk Tescil (Tail Number) Veritabanı + Canlı API Desteği
window.TURKISH_TAIL_REGISTRY = {
"TC-RBA": { reg: "TC-RBA", aircraftId: "A321NEO", type: "Airbus A321-251NX (A321neo)", airline: "Pegasus Airlines", delivered: "2019", msn: "8934", engines: "2x CFM LEAP-1A32", base: "SAW (Sabiha Gökçen)", note: "Pegasus filosunun ilk Airbus A321neo uçaklarından." },
"TC-RBB": { reg: "TC-RBB", aircraftId: "A321NEO", type: "Airbus A321-251NX (A321neo)", airline: "Pegasus Airlines", delivered: "2019", msn: "9042", engines: "2x CFM LEAP-1A32", base: "SAW (Sabiha Gökçen)", note: "Yüksek yoğunluklu 239 koltuklu ACF kabin konfigürasyonu." },
"TC-RBC": { reg: "TC-RBC", aircraftId: "A321", type: "Airbus A321", airline: "Pegasus Airlines", delivered: "2020", msn: "9115", engines: "2x CFM LEAP-1A32", base: "SAW (Sabiha Gökçen)", note: "İç hat ve Avrupa rotalarında aktif görevde." },
"TC-LAJ": { reg: "TC-LAJ", aircraftId: "A321NEO", type: "Airbus A321-271NX (A321neo)", airline: "AJet", delivered: "2023", msn: "11240", engines: "2x PW1133G-JM", base: "SAW / ESB", note: "AJet yeni kurumsal boyamasıyla iç ve dış hatlarda uçan A321neo." },
"TC-LAK": { reg: "TC-LAK", aircraftId: "A321NEO", type: "Airbus A321-271NX (A321neo)", airline: "AJet", delivered: "2023", msn: "11312", engines: "2x PW1133G-JM", base: "SAW (Sabiha Gökçen)", note: "AJet filosunun yeni nesil dar gövde üyesi." },
"TC-JRO": { reg: "TC-JRO", aircraftId: "A321", type: "Airbus A321-231", airline: "Türk Hava Yolları", delivered: "2011", msn: "4682", engines: "2x IAE V2533-A5", base: "IST (İstanbul Havalimanı)", note: "Star Alliance / THY iç ve orta menzil filosu." },
"TC-JFV": { reg: "TC-JFV", aircraftId: "B738", type: "Boeing 737-8F2", airline: "AJet", delivered: "2000", msn: "29784", engines: "2x CFM56-7B26", base: "SAW / ESB", note: "AnadoluJet / AJet filosunun deneyimli 737-800 üyesi." },
"TC-JJN": { reg: "TC-JJN", aircraftId: "B77W", type: "Boeing 777-3F2ER", airline: "Türk Hava Yolları", delivered: "2011", msn: "40793", engines: "2x GE90-115B", base: "IST", note: "Kıtalararası uzun menzil amiral gemisi." },
"TC-LLB": { reg: "TC-LLB", aircraftId: "B789", type: "Boeing 787-9 Dreamliner", airline: "Türk Hava Yolları", delivered: "2019", msn: "65802", engines: "2x GEnx-1B", base: "IST", note: "Yeni nesil kompozit gövdeli Dreamliner." },
"TC-LGA": { reg: "TC-LGA", aircraftId: "A359", type: "Airbus A350-941", airline: "Türk Hava Yolları", delivered: "2020", msn: "354", engines: "2x RR Trent XWB", base: "IST", note: "THY filosunun ilk Airbus A350-900 uçağı." }
};
window.AviationUtils = {
getAirport(iata) {
return window.TURKEY_AIRPORTS.find(a => a.iata.toUpperCase() === (iata || "").toUpperCase()) || null;
},
getAircraft(id) {
return window.AIRCRAFT_CATALOG.find(a => a.id.toUpperCase() === (id || "").toUpperCase()) || window.AIRCRAFT_CATALOG[0];
},
calculateDistanceKm(lat1, lon1, lat2, lon2) {
const R = 6371;
const toRad = d => (d * Math.PI) / 180;
const dLat = toRad(lat2 - lat1);
const dLon = toRad(lon2 - lon1);
const a =
Math.sin(dLat / 2) ** 2 +
Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
},
calculateBearing(lat1, lon1, lat2, lon2) {
const toRad = d => (d * Math.PI) / 180;
const toDeg = r => (r * 180) / Math.PI;
const dLon = toRad(lon2 - lon1);
const y = Math.sin(dLon) * Math.cos(toRad(lat2));
const x =
Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
return Math.round((toDeg(Math.atan2(y, x)) + 360) % 360);
},
formatDuration(minutes) {
const h = Math.floor(minutes / 60);
const m = minutes % 60;
return h > 0 ? `${h} sa ${m} dk` : `${m} dk`;
}
};
// ============================================================================
// Akıllı Karayolu Güzergâh & Geçiş İlleri Hesaplayıcı (HighwayCorridorEngine)
// ============================================================================
window.HighwayCorridorEngine = {
// Türkiye ana otoyol koridorları (Plaka dizileri)
knownCorridors: {
"34-38": [41, 54, 81, 14, 6, 71, 40], // İstanbul -> Kayseri (O-4 & D-200/D-750)
"34-6":  [41, 54, 81, 14],             // İstanbul -> Ankara (O-4 Anadolu Otoyolu)
"34-7":  [41, 54, 11, 43, 3, 15],      // İstanbul -> Antalya (D-650)
"34-35": [41, 77, 16, 10, 45],         // İstanbul -> İzmir (O-5 Osmangazi & Ege)
"34-48": [41, 77, 16, 10, 45, 35, 9],  // İstanbul -> Muğla
"34-61": [41, 54, 81, 14, 18, 19, 5, 55, 52, 28], // İstanbul -> Trabzon
"34-55": [41, 54, 81, 14, 18, 19, 5],  // İstanbul -> Samsun
"34-1":  [41, 54, 81, 14, 6, 68, 51],  // İstanbul -> Adana (O-21)
"34-27": [41, 54, 81, 14, 6, 68, 51, 1, 80], // İstanbul -> Gaziantep
"6-38":  [71, 40],                     // Ankara -> Kayseri
"6-7":   [42],                         // Ankara -> Antalya
"6-35":  [26, 3, 64, 45]               // Ankara -> İzmir
},
findTransitProvinces(fromPlate, toPlate) {
fromPlate = Number(fromPlate);
toPlate = Number(toPlate);
if (!fromPlate || !toPlate || fromPlate === toPlate) return [];
const directKey = `${fromPlate}-${toPlate}`;
const reverseKey = `${toPlate}-${fromPlate}`;
if (this.knownCorridors[directKey]) {
return this.knownCorridors[directKey].map(pl => window.TURKEY_PROVINCES.find(p => p.plate === pl)).filter(Boolean);
}
if (this.knownCorridors[reverseKey]) {
return this.knownCorridors[reverseKey].slice().reverse().map(pl => window.TURKEY_PROVINCES.find(p => p.plate === pl)).filter(Boolean);
}
// Genel Coğrafi Koridor Hesaplayıcı (Herhangi iki il arasındaki hat üzerinde kalan iller)
const fromP = window.TURKEY_PROVINCES.find(p => p.plate === fromPlate);
const toP = window.TURKEY_PROVINCES.find(p => p.plate === toPlate);
if (!fromP || !toP) return [];
const ax = fromP.lon, ay = fromP.lat;
const bx = toP.lon, by = toP.lat;
const dx = bx - ax, dy = by - ay;
const lenSq = dx * dx + dy * dy;
if (lenSq < 0.01) return [];
const candidates = [];
window.TURKEY_PROVINCES.forEach(p => {
if (p.plate === fromPlate || p.plate === toPlate) return;
const t = ((p.lon - ax) * dx + (p.lat - ay) * dy) / lenSq;
if (t <= 0.06 || t >= 0.94) return;
const projLon = ax + t * dx;
const projLat = ay + t * dy;
const distDeg = Math.hypot(p.lon - projLon, (p.lat - projLat) * 1.25);
if (distDeg <= 0.58) {
candidates.push({ prov: p, t });
}
});
candidates.sort((a, b) => a.t - b.t);
return candidates.map(c => c.prov);
}
};
// ============================================================================
// Bilet Fotoğrafından & Metninden Otomatik Uçuş Okuyucu (SmartTicketScanner)
// ============================================================================
window.SmartTicketScanner = {
parseTicketText(rawText, fileName = "") {
const text = `${rawText || ""} ${fileName || ""}`;
const upper = text.toUpperCase();
// 1. Havayolu ve Uçuş Numarası
let airline = "Pegasus Airlines";
let flightNo = "PC2730";
const fnMatch = upper.match(/\b(PC|VF|TK|XQ)\s?(\d{3,4})\b/);
if (fnMatch) {
const code = fnMatch[1];
flightNo = `${code}${fnMatch[2]}`;
if (code === "PC") airline = "Pegasus Airlines";
else if (code === "VF") airline = "AJet";
else if (code === "TK") airline = "Türk Hava Yolları";
else if (code === "XQ") airline = "SunExpress";
} else if (upper.includes("AJET") || upper.includes("VF")) {
airline = "AJet";
flightNo = "VF3181";
} else if (upper.includes("THY") || upper.includes("TURKISH")) {
airline = "Türk Hava Yolları";
flightNo = "TK2014";
}
// 2. Kalkış & Varış Havalimanı / Şehir
const foundAirports = [];
window.TURKEY_AIRPORTS.forEach(ap => {
const idx = upper.indexOf(ap.iata);
if (idx !== -1) foundAirports.push({ ap, idx });
});
foundAirports.sort((a, b) => a.idx - b.idx);
let fromPlate = 34;
let toPlate = 38;
if (foundAirports.length >= 2) {
fromPlate = foundAirports[0].ap.plate;
toPlate = foundAirports[1].ap.plate;
}
// 3. Saatler (HH:MM)
const timeMatches = [...text.matchAll(/\b([01]\d|2[0-3]):([0-5]\d)\b/g)].map(m => m[0]);
const depTime = timeMatches[0] || "05:30";
const arrTime = timeMatches[1] || "06:45";
// 4. Koltuk No (örn: 20A, 14F, 12C)
const seatMatch = upper.match(/\b([1-3]?\d[A-F])\b/);
const seat = seatMatch ? seatMatch[1] : "20A";
// 5. Kapı No
const gateMatch = upper.match(/KAPI\s*:?\s*(\d{1,3}[A-Z]?)/) || upper.match(/GATE\s*:?\s*(\d{1,3}[A-Z]?)/);
const gate = gateMatch ? gateMatch[1] : "-";
// 6. Uçak Modeli
let aircraftId = "A321";
if (upper.includes("321NEO") || upper.includes("A21N")) aircraftId = "A321NEO";
else if (upper.includes("320NEO")) aircraftId = "A320NEO";
else if (upper.includes("737 MAX") || upper.includes("B38M")) aircraftId = "B38M";
else if (upper.includes("737") || upper.includes("B738")) aircraftId = "B738";
else if (upper.includes("A330")) aircraftId = "A333";
else if (upper.includes("777")) aircraftId = "B77W";
else if (upper.includes("787")) aircraftId = "B789";
else if (upper.includes("350")) aircraftId = "A359";
else if (airline === "AJet") aircraftId = "A321NEO";
// 7. Tarih (GG.AA.YYYY veya YYYY-AA-GG)
let dateStr = "2026-11-08";
const dMatch = text.match(/(\d{2})[./-](\d{2})[./-](20\d{2})/);
if (dMatch) {
dateStr = `${dMatch[3]}-${dMatch[2]}-${dMatch[1]}`;
}
return {
airline,
flightNo,
fromPlate,
toPlate,
depTime,
arrTime,
seat,
gate,
aircraftId,
date: dateStr
};
}
};