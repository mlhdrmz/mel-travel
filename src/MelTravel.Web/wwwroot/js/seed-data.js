// ============================================================================
// MelTravel - Melih Kişisel Profil & Başlangıç Uçuş/Seyahat Verisi
// ============================================================================

window.DEFAULT_MELIH_STATE = {
  version: 2,
  profile: {
    name: "Melih Durmaz",
    shortName: "Melih",
    handle: "@melih",
    title: "Gezgin & Havacılık Tutkunu",
    homePlate: 34,
    homeCity: "İstanbul",
    favoriteSeat: "20A (Sol Cam Kenarı)",
    favoriteAircraft: "Airbus A321 / A321neo",
    bio: "Türkiye'de gezdiğim şehirlerin haritası, karayolu/havayolu seyahat rotalarım ve bindiğim uçakların FlightRadar & teknik arşivi."
  },

  // Plaka Kodu -> Durum: "home" | "visited" | "passed" | "wishlist"
  provinceStatuses: {
    34: "home",
    38: "visited"
  },

  // Şehir bazlı kişisel anılar, notlar ve kullanıcı fotoğrafları
  cityMemories: {
    34: {
      visitedDate: "Merkez / Yaşadığı Şehir",
      rating: 5,
      notes: "Sabiha Gökçen (SAW) ve İstanbul Havalimanı (IST) çıkışlı tüm yurt içi seyahatlerimin başlangıç noktası.",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=80",
          caption: "İstanbul Boğazı ve Tarihi Yarımada"
        }
      ]
    },
    38: {
      visitedDate: "08 Kasım 2026, Pazar",
      rating: 5,
      notes: "08 Kasım 2026 Pazar günü sabah 05:30 Pegasus PC2730 (Airbus A321 - Koltuk 20A) ile Sabiha Gökçen'den Kayseri Erkilet Havalimanı'na (ASR) gidiş; akşam 21:25 AJet VF3181 (Airbus A321neo - Koltuk 20A, Kapı 206) ile İstanbul'a dönüş.",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=900&q=80",
          caption: "Erciyes Dağı Manzarası - Kayseri"
        }
      ]
    }
  },

  // Uçuş Kayıtları (FlightRadar & Biniş Kartı Detaylı)
  flights: [
    {
      id: "FL-PC2730-20261108",
      tripId: "TRIP-KAYSERI-20261108",
      direction: "outbound",
      directionLabel: "Gidiş Uçuşu",
      airline: "Pegasus Airlines",
      airlineCode: "PC",
      airlineTheme: "pegasus",
      flightNumber: "PC2730",
      date: "2026-11-08",
      dateFormatted: "08 Kasım 2026, Pazar",
      issueDate: "30/10/2026",
      fromIata: "SAW",
      fromCity: "İstanbul Sabiha Gökçen",
      fromPlate: 34,
      toIata: "ASR",
      toCity: "Kayseri Erkilet",
      toPlate: 38,
      departureTime: "05:30",
      arrivalTime: "06:45",
      durationMinutes: 75,
      distanceKm: 579,
      aircraftId: "A321",
      aircraftName: "Airbus A321",
      tailNumber: "TC-RBC",
      seat: "20A",
      seatType: "Cam Kenarı (Sol - Kanat Arkası)",
      departureTerminal: "Ana Terminal",
      arrivalTerminal: "Ana Terminal",
      gate: "-",
      boardingTime: "04:50",
      boardingZone: "Genel",
      sequenceNo: "-",
      baggage: "15 Kg Kayıtlı + 55x40x23 cm Kabin",
      maskedPnr: "****P9",
      maskedTicketNo: "6242******558",
      status: "F (Uçuldu)",
      cruiseAltitudeFt: 35000,
      cruiseSpeedKmh: 838,
      routeColor: "#f59e0b",
      ticketImage: "assets/tickets/pegasus-pc2730.png",
      notes: "Sabah 05:30 İstanbul Sabiha Gökçen (SAW) Ana Terminal kalkışlı, 06:45 Kayseri (ASR) varışlı Pegasus Airbus A321 uçuşu. Koltuk 20A, 15 kg bagaj + kabin bagajı."
    },
    {
      id: "FL-VF3181-20261108",
      tripId: "TRIP-KAYSERI-20261108",
      direction: "inbound",
      directionLabel: "Dönüş Uçuşu",
      airline: "AJet",
      airlineCode: "VF",
      airlineTheme: "ajet",
      flightNumber: "VF3181",
      date: "2026-11-08",
      dateFormatted: "08 Kasım 2026, Pazar",
      issueDate: "08/11/2026",
      fromIata: "ASR",
      fromCity: "Kayseri Erkilet",
      fromPlate: 38,
      toIata: "SAW",
      toCity: "İstanbul Sabiha Gökçen",
      toPlate: 34,
      departureTime: "21:25",
      arrivalTime: "23:00",
      durationMinutes: 95,
      distanceKm: 579,
      aircraftId: "A321NEO",
      aircraftName: "Airbus A321neo",
      tailNumber: "TC-LAJ",
      seat: "20A",
      seatType: "Cam Kenarı (Sol - Kanat Arkası)",
      departureTerminal: "-",
      arrivalTerminal: "Ana Terminal",
      gate: "206",
      boardingTime: "20:40",
      boardingZone: "C",
      sequenceNo: "9",
      baggage: "8 Kg Kabin Bagajı",
      maskedPnr: "****Y4",
      maskedTicketNo: "2042******768",
      status: "Uçuldu",
      cruiseAltitudeFt: 36000,
      cruiseSpeedKmh: 842,
      routeColor: "#38bdf8",
      ticketImage: "assets/tickets/ajet-vf3181.jpg",
      notes: "Akşam 21:25 Kayseri (ASR) Kapı 206 kalkışlı, 23:00 İstanbul Sabiha Gökçen (SAW) varışlı AJet Airbus A321neo uçuşu. Biniş 20:40, Bölge C, Seq No 9, Koltuk 20A."
    }
  ],

  // Seyahatler (Uçak, Araba, Otobüs, Tren, Gemi)
  trips: [
    {
      id: "TRIP-KAYSERI-20261108",
      title: "İstanbul ⇄ Kayseri Günübirlik Hava Seyahati",
      fromPlate: 34,
      toPlate: 38,
      transportType: "plane",
      transportLabel: "Uçak (Gidiş: Pegasus A321 • Dönüş: AJet A321neo)",
      startDate: "2026-11-08",
      endDate: "2026-11-08",
      dateDisplay: "08 Kasım 2026, Pazar",
      isRoundTrip: true,
      flightIds: ["FL-PC2730-20261108", "FL-VF3181-20261108"],
      distanceTotalKm: 1158,
      durationTotalMinutes: 170,
      companions: "Kişisel Seyahat (Melih)",
      summary: "Sabah 05:30'da Pegasus PC2730 (Airbus A321, Koltuk 20A) ile Sabiha Gökçen'den Kayseri'ye gidiş; akşam 21:25'te AJet VF3181 (Airbus A321neo, Koltuk 20A, Kapı 206) ile Kayseri'den İstanbul'a dönüş.",
      tags: ["Gidiş-Dönüş Uçuş", "Airbus A321", "Airbus A321neo", "Koltuk 20A", "SAW ⇄ ASR"]
    }
  ]
};
