// ============================================================================
// Rotam Türkiye (MelTravel) - Ana Uygulama Motoru (Harita, FlightRadar, Hangar & Profil)
// Görünüm "Dergi" tasarımıdır: şablonlar css/styles.css içindeki sınıfları kullanır,
// Tailwind kullanılmaz. Veri ve iş mantığı v1.2 ile aynıdır.
// ============================================================================
window.App = (function () {
  const STORAGE_KEY = "mel_travel_state_v2";
  const SVG_NS = "http://www.w3.org/2000/svg";
  // Harita ve pasaport çizim renkleri (css/styles.css içindeki değişkenlerle aynı)
  const INK = "#121B25";
  const PAPER = "#EEF1F4";
  const GROUND = "#D3DAE0";
  const MUTED = "#3F4C59";
  const COBALT = "#1A45C4";
  const COBALT_SOFT = "#9DB2E6";
  const AMBER = "#E8A20C";
  // Haritada adı ve halkasıyla gösterilen ana havalimanları
  const PRIMARY_AIRPORTS = ["SAW", "ASR"];
  // Kapak fotoğrafları: plaka -> yerel dosya. Listede olmayan iller varsayılan kapağı kullanır.
  const COVER_PHOTOS = {
    38: { src: "img/kapak-kayseri.jpg", credit: "Fotoğraf: Ömer Haktan Bulut / Unsplash" }
  };
  const DEFAULT_COVER = COVER_PHOTOS[38];

  let state = loadState();
  let activeTab = "map";
  let mapMode = "hybrid"; // "hybrid" | "radar" | "leaflet"
  let selectedProvincePlate = 38; // Başlangıçta Kayseri (38) seçili
  let selectedRouteFilter = "all"; // "all" | flightId | "none"
  let selectedRegionFilter = "all";
  let searchQuery = "";
  let aircraftFilter = "all";
  let leafletMap = null;
  let leafletLayerGroup = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 2 && Array.isArray(parsed.flights)) {
          if (applySeedCorrections(parsed)) {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            } catch (e) {
              // Depolama dolu/kapalı olsa da düzeltilmiş veri bu oturumda kullanılır
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Yerel durum okunamadı, varsayılan Melih profili yükleniyor.", e);
    }
    return JSON.parse(JSON.stringify(window.DEFAULT_MELIH_STATE));
  }

  // Tarayıcıda daha önce kaydedilmiş veride, başlangıç uçuşlarının ESKİ varsayılan değerleri
  // (seed-data.js > LEGACY_SEED_VALUES) hâlâ duruyorsa doğrulanmış yeni değerlerle değiştirir.
  // Kullanıcının kendi değiştirdiği alanlara ve eklediği kayıtlara dokunmaz.
  function applySeedCorrections(saved) {
    const seed = window.DEFAULT_MELIH_STATE;
    const legacy = window.LEGACY_SEED_VALUES;
    if (!seed || !legacy) return false;
    let changed = false;
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const patch = (target, source, oldValues) => {
      if (!target || !source || !oldValues) return;
      Object.keys(oldValues).forEach(key => {
        if (source[key] !== undefined && same(target[key], oldValues[key]) && !same(target[key], source[key])) {
          target[key] = JSON.parse(JSON.stringify(source[key]));
          changed = true;
        }
      });
    };
    (saved.flights || []).forEach(f => {
      const oldValues = (legacy.flights || {})[f.id];
      const seedFlight = (seed.flights || []).find(x => x.id === f.id);
      if (!oldValues || !seedFlight) return;
      patch(f, seedFlight, oldValues);
      // Tescil düzeltildiyse o uçağa ait yeni alanları da ekle
      if (f.tailNumber === seedFlight.tailNumber) {
        ["actualDepartureTime", "actualArrivalTime", "aircraftVariant", "engines"].forEach(key => {
          if (f[key] === undefined && seedFlight[key] !== undefined) {
            f[key] = seedFlight[key];
            changed = true;
          }
        });
      }
    });
    (saved.trips || []).forEach(t => {
      patch(t, (seed.trips || []).find(x => x.id === t.id), (legacy.trips || {})[t.id]);
    });
    Object.keys(legacy.cityMemories || {}).forEach(plate => {
      patch(saved.cityMemories && saved.cityMemories[plate], seed.cityMemories && seed.cityMemories[plate], legacy.cityMemories[plate]);
    });
    return changed;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Yerel depolama güncellenemedi.", e);
    }
    // Eğer .NET yerel sunucusu üzerinden çalışıyorsa arka planda senkronize et
    if (window.location.protocol.startsWith("http")) {
      fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.profile.name,
          handle: state.profile.handle,
          bio: state.profile.bio,
          homePlateCode: state.profile.homePlate,
          provinceStatuses: state.provinceStatuses,
          flights: state.flights,
          trips: state.trips
        })
      }).catch(() => {});
    }
  }

  // --------------------------------------------------------------------------
  // Küçük yardımcılar
  // --------------------------------------------------------------------------
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(k => el.setAttribute(k, attrs[k]));
    return el;
  }
  // "Airbus A321neo (New Engine Option)" -> "A321neo"
  function shortAircraftName(name) {
    return String(name || "").replace("Airbus ", "").replace(/\s*\(.*\)\s*$/, "");
  }
  // Eski kayıtlardaki etiketlerin başındaki simgeleri (✈️, 🚗 ...) atar
  function plainLabel(text) {
    return String(text || "").replace(/^[^\p{L}\p{N}(]+/u, "");
  }
  // "2026-11-08" -> "08.11.2026"
  function formatDateTr(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? `${m[3]}.${m[2]}.${m[1]}` : String(iso || "");
  }
  function hasTail(f) {
    return !!(f && f.tailNumber && !f.tailNumber.includes("..."));
  }
  function visitedPlateList() {
    const statuses = state.provinceStatuses || {};
    return Object.keys(statuses).filter(k => statuses[k] === "visited" || statuses[k] === "home");
  }
  // Bindiğim modellerin adları: "Airbus A321neo"
  function flownModelNames() {
    const ids = [...new Set((state.flights || []).map(f => f.aircraftId))];
    return ids.map(id => {
      const ac = window.AviationUtils.getAircraft(id);
      return ac ? `${ac.manufacturer} ${ac.model}` : id;
    });
  }
  // Sayıdan sonra gelen iyelik eki: 2'si, 3'ü, 6'sı, 10'u ...
  function possessiveSuffix(n) {
    const ones = ["", "'i", "'si", "'ü", "'ü", "'i", "'sı", "'si", "'i", "'u"];
    const tens = ["", "'u", "'si", "'u", "'ı", "'si", "'ı", "'i", "'i", "'ı"];
    const o = n % 10;
    if (o !== 0) return ones[o];
    return tens[Math.floor(n / 10) % 10] || "'ü";
  }

  function init() {
    bindEvents();
    populateFormSelects();
    renderAll();
  }

  function bindEvents() {
    // Ana Sekmeler
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
    // Harita Mod Butonları
    document.querySelectorAll(".map-mode-btn").forEach(btn => {
      btn.addEventListener("click", () => setMapMode(btn.dataset.mapmode));
    });
    // Rota Filtresi
    const routeSelect = document.getElementById("routeFilterSelect");
    if (routeSelect) {
      routeSelect.addEventListener("change", e => {
        selectedRouteFilter = e.target.value;
        renderMapRoutesAndAirports();
        updateHudMetrics(selectedRouteFilter);
      });
    }
    // İl Arama
    const searchInput = document.getElementById("provinceSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", e => {
        searchQuery = (e.target.value || "").trim().toLowerCase();
        renderSvgProvinces();
      });
    }
    // Bölge Filtreleri
    document.querySelectorAll(".region-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedRegionFilter = btn.dataset.region;
        document.querySelectorAll(".region-btn").forEach(b => {
          b.classList.toggle("is-active", b.dataset.region === selectedRegionFilter);
        });
        renderSvgProvinces();
      });
    });
    // Uçak Filtreleri
    document.querySelectorAll(".ac-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        aircraftFilter = btn.dataset.acfilter;
        document.querySelectorAll(".ac-filter-btn").forEach(b => {
          b.classList.toggle("is-active", b.dataset.acfilter === aircraftFilter);
        });
        renderAircraftCatalog();
      });
    });
    // Yeni Seyahat Modalı Açma
    const btnAdd = document.getElementById("btnOpenAddModal");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => {
        document.getElementById("addTripModal").classList.remove("hidden");
      });
    }
  }

  function switchTab(tabId) {
    const tabChanged = tabId !== activeTab;
    activeTab = tabId;
    ["map", "trips", "aircraft", "profile"].forEach(t => {
      const el = document.getElementById(`tabContent-${t}`);
      if (el) el.classList.toggle("hidden", t !== tabId);
    });
    // Kapak yalnızca ana sayfada (Türkiye Haritası) görünür
    const cover = document.getElementById("coverSection");
    if (cover) cover.classList.toggle("hidden", tabId !== "map");
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      const isCurrent = btn.dataset.tab === tabId;
      btn.classList.toggle("is-active", isCurrent);
      if (isCurrent) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
    if (tabChanged) window.scrollTo(0, 0);
    if (tabId === "map" && mapMode === "leaflet" && leafletMap) {
      setTimeout(() => leafletMap.invalidateSize(), 120);
    }
  }

  function setMapMode(mode) {
    mapMode = mode;
    document.querySelectorAll(".map-mode-btn").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.mapmode === mode);
    });
    const viewport = document.getElementById("mapViewportContainer");
    const svgWrapper = document.getElementById("svgMapWrapper");
    const leafletWrapper = document.getElementById("leafletMapWrapper");
    const subtitle = document.getElementById("mapModeSubtitle");
    if (mode === "leaflet") {
      svgWrapper.classList.add("hidden");
      leafletWrapper.classList.remove("hidden");
      viewport.classList.remove("radar-mode");
      subtitle.textContent = "GERÇEK COĞRAFİ HARİTA (LEAFLET) & HAVALİMANI ROTALARI";
      initOrUpdateLeafletMap();
    } else {
      svgWrapper.classList.remove("hidden");
      leafletWrapper.classList.add("hidden");
      viewport.classList.toggle("radar-mode", mode === "radar");
      subtitle.textContent = mode === "radar"
        ? "FLIGHTRADAR24 KOYU HAVACILIK RADARI & CANLI TELEMETRİ"
        : "İNTERAKTİF TÜRKİYE 81 İL & FLIGHTRADAR ROTA SİMÜLASYONU";
      renderSvgProvinces();
      renderMapRoutesAndAirports();
    }
  }

  function renderAll() {
    renderCover();
    renderKpiStrip();
    renderSvgProvinces();
    renderMapRoutesAndAirports();
    renderSelectedCityPanel(selectedProvincePlate);
    renderBoardingPassesAndTrips();
    renderAircraftCatalog();
    renderProfileDashboard();
  }

  // ==========================================================================
  // 0. KAPAK (son gidilen şehrin fotoğrafı + gezilen il sayısı)
  // ==========================================================================
  function renderCover() {
    const count = visitedPlateList().length;
    const title = document.getElementById("coverTitle");
    if (title) {
      if (count === 0) title.innerHTML = "81 ilden henüz <em>hiçbiri</em> işaretlenmedi.";
      else if (count >= 81) title.innerHTML = "81 ilin <em>tamamı</em> gezildi.";
      else title.innerHTML = `81 ilden <em>${count}${possessiveSuffix(count)}</em> gezildi.`;
    }
    // En son seyahat: tarihçe en yeni kayıt
    const trips = (state.trips || []).filter(t => t && t.startDate);
    const latest = trips.slice().sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)))[0];
    let kicker = "TÜRKİYE • 81 İL";
    if (latest) {
      const d = new Date(`${String(latest.startDate).slice(0, 10)}T12:00:00`);
      if (!isNaN(d.getTime())) {
        const monthYear = d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
        kicker = `TÜRKİYE • ${monthYear.toLocaleUpperCase("tr-TR")}`;
      }
    }
    setText("coverKicker", kicker);
    // Fotoğraf kuralı: o şehre kendi yüklediğim fotoğraf varsa o, yoksa hazır kapak fotoğrafı
    const plate = latest ? Number(latest.toPlate) : null;
    const memory = plate && state.cityMemories ? state.cityMemories[plate] : null;
    const ownPhoto = memory && Array.isArray(memory.photos)
      ? memory.photos.find(ph => ph && typeof ph.url === "string" && ph.url.startsWith("data:"))
      : null;
    const photoEl = document.getElementById("coverPhoto");
    if (photoEl) {
      if (ownPhoto) {
        photoEl.style.backgroundImage = `url("${ownPhoto.url}")`;
        photoEl.style.backgroundPosition = "center";
        setText("coverCredit", `Fotoğraf: ${state.profile.name}`);
      } else {
        const stock = (plate && COVER_PHOTOS[plate]) || DEFAULT_COVER;
        photoEl.style.backgroundImage = `url("${stock.src}")`;
        photoEl.style.backgroundPosition = "";
        setText("coverCredit", stock.credit);
      }
    }
  }

  // ==========================================================================
  // 1. ÜST KPI ŞERİDİ
  // ==========================================================================
  function renderKpiStrip() {
    const statuses = state.provinceStatuses || {};
    const visitedPlates = visitedPlateList();
    const passedPlates = Object.keys(statuses).filter(k => statuses[k] === "passed");
    const count = visitedPlates.length;
    const pct = ((count / 81) * 100).toFixed(1);
    document.getElementById("kpiVisitedCount").textContent = count;
    document.getElementById("kpiVisitedPercent").textContent = `%${pct}`;
    const visitedNames = visitedPlates
      .map(p => window.TURKEY_PROVINCES.find(x => x.plate === Number(p)))
      .filter(Boolean)
      .slice(0, 4)
      .map(x => `${x.code} ${x.name}`)
      .join(" • ");
    document.getElementById("kpiVisitedSub").textContent =
      visitedNames + (passedPlates.length > 0 ? ` (+${passedPlates.length} geçildi)` : "");
    const flights = state.flights || [];
    document.getElementById("kpiFlightCount").textContent = flights.length;
    document.getElementById("navFlightBadge").textContent = flights.length;
    const uniqueAircraftIds = [...new Set(flights.map(f => f.aircraftId))];
    document.getElementById("kpiAircraftCount").textContent = uniqueAircraftIds.length;
    const aircraftNames = uniqueAircraftIds
      .map(id => window.AviationUtils.getAircraft(id)?.model || id)
      .join(" & ");
    document.getElementById("kpiAircraftSub").textContent = aircraftNames || "Henüz uçuş yok";
    const totalKm = flights.reduce((acc, f) => acc + (Number(f.distanceKm) || 0), 0);
    const totalMin = flights.reduce((acc, f) => acc + (Number(f.durationMinutes) || 0), 0);
    document.getElementById("kpiTotalKm").textContent = totalKm.toLocaleString("tr-TR");
    document.getElementById("kpiTotalHours").textContent = window.AviationUtils.formatDuration(totalMin);
    // Sayfadaki "bindiğim modeller" etiketleri uçuş kayıtlarından üretilir
    const flownLabel = flownModelNames().join(" & ") || "Henüz uçuş yok";
    setText("hangarFlownModels", flownLabel);
    setText("acFilterFlownLabel", flownLabel);
    setText("passportModelsLabel", flownLabel);
    if (document.getElementById("hudAircraft") && (selectedRouteFilter === "all" || selectedRouteFilter === "none")) {
      setText("hudAircraft", hudAircraftSummary());
    }
  }

  // ==========================================================================
  // 2. TÜRKİYE 81 İL SVG HARİTASI ÇİZİMİ
  // ==========================================================================
  function renderSvgProvinces() {
    const mapData = window.TurkeyMapEngine.buildProvincePaths();
    const provincesLayer = document.getElementById("svgProvincesLayer");
    const lakesLayer = document.getElementById("svgLakesLayer");
    const labelsLayer = document.getElementById("svgLabelsLayer");
    const tooltip = document.getElementById("mapTooltip");
    if (!provincesLayer) return;
    provincesLayer.innerHTML = "";
    lakesLayer.innerHTML = "";
    labelsLayer.innerHTML = "";
    // Gölleri Çiz (Van Gölü & Tuz Gölü) — renkleri css/styles.css > .lake belirler
    lakesLayer.appendChild(svgEl("path", { d: mapData.lakeVan, class: "lake" }));
    lakesLayer.appendChild(svgEl("path", { d: mapData.lakeTuz, class: "lake" }));
    // 81 İli Çiz
    window.TURKEY_PROVINCES.forEach(prov => {
      const pathStr = mapData.provinces[prov.plate];
      if (!pathStr) return;
      const status = state.provinceStatuses[prov.plate] || "none";
      const isSelected = prov.plate === selectedProvincePlate;
      const matchesRegion = selectedRegionFilter === "all" || prov.region === selectedRegionFilter;
      const matchesSearch =
        !searchQuery ||
        prov.name.toLowerCase().includes(searchQuery) ||
        prov.code.includes(searchQuery);
      const isDimmed = !(matchesRegion && matchesSearch);
      let cls = `province-path status-${status}`;
      if (isSelected) cls += " selected-province";
      if (isDimmed) cls += " dimmed";
      const pathEl = svgEl("path", { d: pathStr, "data-plate": prov.plate, class: cls });
      // Etkileşimler
      pathEl.addEventListener("mouseenter", e => {
        showProvinceTooltip(e, prov, status);
      });
      pathEl.addEventListener("mousemove", e => {
        moveProvinceTooltip(e);
      });
      pathEl.addEventListener("mouseleave", () => {
        tooltip.classList.add("hidden");
      });
      pathEl.addEventListener("click", () => {
        selectProvince(prov.plate);
      });
      provincesLayer.appendChild(pathEl);
      // İl Etiketi (Plaka + İsim)
      const [cx, cy] = window.TurkeyMapEngine.project(prov.lat, prov.lon);
      const isHighlighted = status !== "none" || isSelected;
      // Ana havalimanı (SAW, ASR) olan ilde il adı ve havalimanı kodu tek etikette birleşir;
      // etiket, havalimanı noktasının rotaların gelmediği tarafına (üstüne ya da altına) konur.
      let labelX = cx;
      let labelY = cy;
      let labelText = isHighlighted ? `${prov.code} ${prov.name}` : prov.code;
      const ap = isHighlighted && mapMode !== "radar" ? primaryAirportOfPlate(prov.plate) : null;
      if (ap) {
        const [ax, ay] = window.TurkeyMapEngine.project(ap.lat, ap.lon);
        labelX = ax;
        labelY = ay + (airportLabelSide(ap) < 0 ? -15 : 20);
        labelText = `${prov.code} ${prov.name} • ${ap.iata}`;
      }
      const textEl = svgEl("text", {
        x: labelX,
        y: labelY,
        class: `province-label${isHighlighted ? " highlight-label" : ""}${isDimmed ? " dimmed" : ""}`
      });
      textEl.textContent = labelText;
      labelsLayer.appendChild(textEl);
    });
    syncAirportTags();
  }

  function isProvinceHighlighted(plate) {
    return !!(state.provinceStatuses && state.provinceStatuses[plate]) || Number(plate) === selectedProvincePlate;
  }

  function primaryAirportOfPlate(plate) {
    return PRIMARY_AIRPORTS
      .map(code => window.AviationUtils.getAirport(code))
      .find(a => a && a.plate === Number(plate)) || null;
  }

  // -1: etiket noktanın üstünde, +1: altında. Rotalar güneye gidiyorsa üst taraf boştur.
  function airportLabelSide(ap) {
    const [, ay] = window.TurkeyMapEngine.project(ap.lat, ap.lon);
    const otherYs = (state.flights || [])
      .map(f => (f.fromIata === ap.iata ? f.toIata : f.toIata === ap.iata ? f.fromIata : null))
      .map(code => (code ? window.AviationUtils.getAirport(code) : null))
      .filter(Boolean)
      .map(other => window.TurkeyMapEngine.project(other.lat, other.lon)[1]);
    if (otherYs.length === 0) return -1;
    const avg = otherYs.reduce((a, b) => a + b, 0) / otherYs.length;
    return avg > ay ? -1 : 1;
  }

  // İl etiketi havalimanı kodunu zaten taşıyorsa ayrı havalimanı yazısını gizler (radar modu hariç)
  function syncAirportTags() {
    document.querySelectorAll("#svgAirportsLayer text[data-plate]").forEach(tag => {
      const merged = mapMode !== "radar" && isProvinceHighlighted(tag.getAttribute("data-plate"));
      tag.style.display = merged ? "none" : "";
    });
  }

  function showProvinceTooltip(e, prov, status) {
    const tooltip = document.getElementById("mapTooltip");
    const statusLabels = {
      home: "Merkez / Ev",
      visited: "Gezildi / Görüldü",
      passed: "İçinden Geçildi / Aktarma",
      wishlist: "Gitmek İstiyorum",
      none: "Henüz Gidilmedi"
    };
    const cityFlights = (state.flights || []).filter(
      f => f.fromPlate === prov.plate || f.toPlate === prov.plate
    );
    tooltip.innerHTML = `
      <div class="tooltip__head">
        <span class="tooltip__name">${prov.name}</span>
        <span class="muted num">${prov.code} • ${prov.region}</span>
      </div>
      <div>Durum: <b>${statusLabels[status] || statusLabels.none}</b></div>
      ${prov.airport ? `<div>Havalimanı: <b>${prov.airport}</b></div>` : ""}
      ${cityFlights.length > 0 ? `<div>${cityFlights.length} Kayıtlı Uçuş (${cityFlights.map(f => f.flightNumber).join(", ")})</div>` : ""}
      <div class="tooltip__hint">Detaylar ve fotoğraf galerisi için tıklayın</div>
    `;
    tooltip.classList.remove("hidden");
    moveProvinceTooltip(e);
  }

  function moveProvinceTooltip(e) {
    const tooltip = document.getElementById("mapTooltip");
    const x = Math.min(window.innerWidth - 280, e.clientX + 16);
    const y = Math.min(window.innerHeight - 140, e.clientY + 16);
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  }

  function selectProvince(plate) {
    selectedProvincePlate = Number(plate);
    renderSvgProvinces();
    renderSelectedCityPanel(selectedProvincePlate);
  }

  // ==========================================================================
  // 3. FLIGHTRADAR ROTALARI & ANİMASYONLU UÇAKLAR (SVG KATMANI)
  //    Dergi görünümünde rotalar mürekkep rengiyle (gidiş kesik çizgi, dönüş noktalı),
  //    koyu radar modunda kayıtlı rota renkleriyle çizilir.
  // ==========================================================================
  function renderMapRoutesAndAirports() {
    const routesLayer = document.getElementById("svgRoutesLayer");
    const airportsLayer = document.getElementById("svgAirportsLayer");
    if (!routesLayer || !airportsLayer) return;
    routesLayer.innerHTML = "";
    airportsLayer.innerHTML = "";
    if (selectedRouteFilter === "none") return;
    const isRadar = mapMode === "radar";
    const flightsToShow = (state.flights || []).filter(
      f => selectedRouteFilter === "all" || f.id === selectedRouteFilter
    );
    const activeAirportCodes = new Set();
    // Eğer FlightRadar modundaysak tüm ana havalimanlarını radar noktası olarak göster
    if (isRadar) {
      window.TURKEY_AIRPORTS.forEach(ap => activeAirportCodes.add(ap.iata));
    }
    flightsToShow.forEach(flight => {
      const fromAp = window.AviationUtils.getAirport(flight.fromIata);
      const toAp = window.AviationUtils.getAirport(flight.toIata);
      if (!fromAp || !toAp) return;
      activeAirportCodes.add(fromAp.iata);
      activeAirportCodes.add(toAp.iata);
      const [x1, y1] = window.TurkeyMapEngine.project(fromAp.lat, fromAp.lon);
      const [x2, y2] = window.TurkeyMapEngine.project(toAp.lat, toAp.lon);
      // Gidiş ve Dönüş yaylarının üst üste binmemesi için zıt kavis kontrol noktası
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      // Normal her zaman batı→doğu doğrultusuna göre alınır; böylece kavis tarafı uçuşun
      // yönünden bağımsızdır ve gidiş ile dönüş yayları üst üste binmez
      const side = dx >= 0 ? 1 : -1;
      const nx = (-dy / len) * side;
      const ny = (dx / len) * side;
      // Gidiş kuzeyden yay çizer, Dönüş güneyden yay çizer
      const inbound = flight.direction === "inbound";
      const curveOffset = inbound ? 46 : -48;
      const cx = midX + nx * curveOffset;
      const cy = midY + ny * curveOffset;
      const pathD = `M ${x1},${y1} Q ${cx.toFixed(1)},${cy.toFixed(1)} ${x2},${y2}`;
      const routeId = `flightArc_${flight.id}`;
      const color = isRadar ? (flight.routeColor || (inbound ? "#38bdf8" : "#f59e0b")) : INK;
      // 1. Zemin yayı: radar modunda parlama, dergi görünümünde okunurluk için açık kılıf
      routesLayer.appendChild(svgEl("path", {
        d: pathD,
        fill: "none",
        stroke: isRadar ? color : PAPER,
        "stroke-width": isRadar ? 5 : 5.5,
        opacity: isRadar ? 0.22 : 0.8
      }));
      // 2. Kesikli Animasyonlu FlightRadar Yayı
      const arcPath = svgEl("path", {
        id: routeId,
        d: pathD,
        fill: "none",
        stroke: color,
        "stroke-width": isRadar ? 2.6 : 2.4,
        class: `flight-arc-animated map-clickable${!isRadar && inbound ? " flight-arc--in" : ""}`
      });
      arcPath.addEventListener("click", () => openBoardingPassModal(flight.id));
      routesLayer.appendChild(arcPath);
      // 3. Yay Ortası Uçuş Bilgi Etiketi (PC2730 / VF3181)
      const labelX = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
      const labelY = 0.25 * y1 + 0.5 * cy + 0.25 * y2 + (inbound ? 19 : -18);
      const badgeLabel = `${flight.flightNumber} • ${shortAircraftName(flight.aircraftName)}`;
      const badgeW = Math.max(96, Math.round(badgeLabel.length * 6.2 + 20));
      const badgeGroup = svgEl("g", { class: "map-clickable" });
      badgeGroup.addEventListener("click", () => openBoardingPassModal(flight.id));
      badgeGroup.appendChild(svgEl("rect", {
        x: labelX - badgeW / 2,
        y: labelY - 10,
        width: badgeW,
        height: 20,
        rx: isRadar ? 6 : 10,
        fill: isRadar ? "#020617" : PAPER,
        stroke: color,
        "stroke-width": isRadar ? 1.2 : 1
      }));
      const badgeText = svgEl("text", {
        x: labelX,
        y: labelY + 3.5,
        "text-anchor": "middle",
        fill: color,
        "font-size": 9.5,
        "font-family": "Inter, system-ui, sans-serif",
        "font-weight": isRadar ? 700 : 600
      });
      badgeText.textContent = badgeLabel;
      badgeGroup.appendChild(badgeText);
      routesLayer.appendChild(badgeGroup);
      // 4. Rota Üzerinde Hareket Eden Uçak İkonu (<animateMotion>)
      const planeGroup = svgEl("g", {});
      // Uçak burun yönü +X eksenine bakacak şekilde SVG path
      const planeIcon = svgEl("path", {
        d: "M 10,0 L -6,-7 L -3,-1 L -10,-4 L -10,4 L -3,1 L -6,7 Z",
        fill: isRadar ? "#ffffff" : INK,
        stroke: isRadar ? color : PAPER,
        "stroke-width": isRadar ? 1.5 : 1.2
      });
      const animMotion = svgEl("animateMotion", {
        dur: inbound ? "7.5s" : "6.5s",
        repeatCount: "indefinite",
        rotate: "auto"
      });
      const mpath = svgEl("mpath", { href: `#${routeId}` });
      mpath.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#${routeId}`);
      animMotion.appendChild(mpath);
      planeGroup.appendChild(planeIcon);
      planeGroup.appendChild(animMotion);
      routesLayer.appendChild(planeGroup);
    });
    // Karayolu / Tren Seyahatlerinin Güzergâh Çizgileri
    (state.trips || [])
      .filter(t => t.transportType !== "plane" && Array.isArray(t.transitPlates) && t.transitPlates.length > 0)
      .forEach(roadTrip => {
        const allPlates = [roadTrip.fromPlate, ...roadTrip.transitPlates, roadTrip.toPlate];
        const pts = allPlates
          .map(pl => window.TURKEY_PROVINCES.find(p => p.plate === Number(pl)))
          .filter(Boolean)
          .map(p => window.TurkeyMapEngine.project(p.lat, p.lon));
        if (pts.length < 2) return;
        const d = "M " + pts.map(pt => `${pt[0]},${pt[1]}`).join(" L ");
        if (!isRadar) {
          routesLayer.appendChild(svgEl("path", { d, fill: "none", stroke: PAPER, "stroke-width": 4.6, opacity: 0.8 }));
        }
        routesLayer.appendChild(svgEl("path", {
          d,
          fill: "none",
          stroke: isRadar ? "#10b981" : INK,
          "stroke-width": isRadar ? 2.4 : 2,
          "stroke-dasharray": "5 4",
          opacity: isRadar ? 0.85 : 1
        }));
      });
    // Aktif Havalimanı İşaretçilerini Çiz
    activeAirportCodes.forEach(iata => {
      const ap = window.AviationUtils.getAirport(iata);
      if (!ap) return;
      const [ax, ay] = window.TurkeyMapEngine.project(ap.lat, ap.lon);
      const isPrimary = PRIMARY_AIRPORTS.includes(iata);
      const g = svgEl("g", { class: "map-clickable" });
      g.addEventListener("click", () => selectProvince(ap.plate));
      if (isPrimary) {
        g.appendChild(svgEl("circle", {
          cx: ax,
          cy: ay,
          r: 6,
          fill: "none",
          stroke: isRadar ? (iata === "SAW" ? "#38bdf8" : "#f59e0b") : INK,
          "stroke-width": isRadar ? 2 : 1.5,
          class: "airport-pulse-ring"
        }));
      }
      g.appendChild(svgEl("circle", {
        cx: ax,
        cy: ay,
        r: isPrimary ? 5.5 : 3.2,
        fill: isRadar ? (isPrimary ? "#ffffff" : "#10b981") : (isPrimary ? "#FFFFFF" : INK),
        stroke: isRadar ? (isPrimary ? "#0ea5e9" : "#052e16") : INK,
        "stroke-width": 2
      }));
      if (isPrimary || isRadar) {
        const tag = svgEl("text", {
          x: ax,
          y: isPrimary ? ay - 12 : ay - 8,
          "text-anchor": "middle",
          fill: isRadar ? (isPrimary ? "#fde68a" : "#6ee7b7") : INK,
          "font-size": isPrimary ? 11 : 8.5,
          "font-family": "Inter, system-ui, sans-serif",
          "font-weight": 700,
          stroke: isRadar ? "#020617" : PAPER,
          "stroke-width": 3,
          "paint-order": "stroke"
        });
        tag.textContent = isPrimary ? `${ap.iata} (${ap.city})` : ap.iata;
        if (isPrimary) tag.setAttribute("data-plate", ap.plate);
        g.appendChild(tag);
      }
      airportsLayer.appendChild(g);
    });
    syncAirportTags();
  }

  // Harita ekranın dışındaysa (ör. kapak fotoğrafının altında kaldıysa) görünür alana getirir
  function revealMap() {
    const el = document.getElementById("mapColumn");
    if (!el || activeTab !== "map") return;
    const rect = el.getBoundingClientRect();
    if (rect.top < 0 || rect.top > window.innerHeight * 0.45) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function focusFlightOnMap(flightIdOrAll) {
    selectedRouteFilter = flightIdOrAll;
    const sel = document.getElementById("routeFilterSelect");
    if (sel) sel.value = flightIdOrAll;
    renderMapRoutesAndAirports();
    updateHudMetrics(flightIdOrAll);
    if (mapMode === "leaflet") initOrUpdateLeafletMap();
    revealMap();
  }

  function hudAircraftSummary() {
    const names = [...new Set((state.flights || []).map(f => shortAircraftName(f.aircraftName)))].filter(Boolean);
    return names.join(" & ") || "—";
  }

  function updateHudMetrics(flightIdOrAll) {
    if (flightIdOrAll === "all" || flightIdOrAll === "none") {
      document.getElementById("hudAircraft").textContent = hudAircraftSummary();
      document.getElementById("hudSeat").textContent = "20A (Sol Cam)";
      document.getElementById("hudDistance").textContent = "1.158 km (Gidiş-Dönüş)";
      document.getElementById("hudAltitude").textContent = "35,000 - 36,000 ft";
      return;
    }
    const f = (state.flights || []).find(x => x.id === flightIdOrAll);
    if (!f) return;
    document.getElementById("hudAircraft").textContent = `${f.aircraftName} (${f.tailNumber || "TC"})`;
    document.getElementById("hudSeat").textContent = `${f.seat} (Kapı: ${f.gate})`;
    document.getElementById("hudDistance").textContent = `${f.distanceKm} km (${f.departureTime}→${f.arrivalTime})`;
    document.getElementById("hudAltitude").textContent = `${(f.cruiseAltitudeFt || 35000).toLocaleString()} ft @ ${f.cruiseSpeedKmh || 840} km/s`;
  }

  // ==========================================================================
  // 4. LEAFLET GERÇEK COĞRAFİ HARİTA DESTEĞİ
  // ==========================================================================
  function initOrUpdateLeafletMap() {
    if (typeof L === "undefined") return;
    if (!leafletMap) {
      leafletMap = L.map("leafletMapContainer").setView([39.2, 35.2], 6);
      // CARTO karoları (eski sürümdeki dark_all dahil) artık anahtar istiyor ve "API KEY REQUIRED"
      // filigranı basıyor; bu yüzden OpenStreetMap'in kendi karoları kullanılıyor.
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> katkıcıları',
        maxZoom: 18
      }).addTo(leafletMap);
      leafletLayerGroup = L.layerGroup().addTo(leafletMap);
    }
    leafletLayerGroup.clearLayers();
    // Gezilen İlleri Pinle
    window.TURKEY_PROVINCES.forEach(p => {
      const st = state.provinceStatuses[p.plate];
      if (!st) return;
      const color = st === "home" ? AMBER : st === "visited" ? COBALT : st === "passed" ? COBALT_SOFT : "#FFFFFF";
      const marker = L.circleMarker([p.lat, p.lon], {
        radius: 8,
        fillColor: color,
        color: st === "wishlist" ? COBALT : INK,
        weight: st === "wishlist" ? 2 : 1.5,
        dashArray: st === "wishlist" ? "3, 3" : null,
        fillOpacity: 0.95
      }).bindPopup(`<b>${p.code} ${p.name}</b><br/>${p.summary}`);
      marker.on("click", () => selectProvince(p.plate));
      leafletLayerGroup.addLayer(marker);
    });
    // Uçuş Rotalarını Çiz
    (state.flights || []).forEach(f => {
      const fromAp = window.AviationUtils.getAirport(f.fromIata);
      const toAp = window.AviationUtils.getAirport(f.toIata);
      if (!fromAp || !toAp) return;
      const poly = L.polyline(
        [
          [fromAp.lat, fromAp.lon],
          [toAp.lat, toAp.lon]
        ],
        {
          color: INK,
          weight: 3,
          dashArray: f.direction === "inbound" ? "2, 7" : "8, 6"
        }
      ).bindPopup(`<b>${f.airline} ${f.flightNumber}</b><br/>${f.fromIata} → ${f.toIata} (${f.aircraftName})`);
      leafletLayerGroup.addLayer(poly);
    });
    setTimeout(() => leafletMap.invalidateSize(), 100);
  }

  // ==========================================================================
  // 5. SEÇİLİ ŞEHİR DETAY PANELİ (SAĞ SÜTUN)
  // ==========================================================================
  function renderSelectedCityPanel(plate) {
    const prov = window.TURKEY_PROVINCES.find(p => p.plate === Number(plate)) || window.TURKEY_PROVINCES[37];
    const container = document.getElementById("selectedCityPanel");
    if (!container || !prov) return;
    const status = state.provinceStatuses[prov.plate] || "none";
    const memory = (state.cityMemories && state.cityMemories[prov.plate]) || {
      visitedDate: "",
      notes: "",
      photos: []
    };
    const cityFlights = (state.flights || []).filter(
      f => f.fromPlate === prov.plate || f.toPlate === prov.plate
    );
    const statusButtons = [
      { key: "visited", label: "Gezdim" },
      { key: "passed", label: "Geçtim" },
      { key: "wishlist", label: "Hedefim" },
      { key: "home", label: "Merkez" },
      { key: "none", label: "Temizle" }
    ];
    // Fotoğraf kuralı: bu şehre kendi yüklediğim fotoğraf varsa o, yoksa şehir kartının hazır fotoğrafı
    const ownPhoto = (memory.photos || []).find(ph => ph && typeof ph.url === "string" && ph.url.startsWith("data:"));
    const cityPhoto = ownPhoto ? ownPhoto.url : prov.photo;
    container.innerHTML = `
      <!-- Kapak Görseli -->
      <div class="city__photo">
        <img src="${cityPhoto}" alt="${prov.name}" onerror="this.style.display='none'" />
      </div>
      <div>
        <p class="kicker">${prov.code} • ${prov.region} Bölgesi${prov.airport ? ` • Havalimanı ${prov.airport}` : ""}</p>
        <h3 class="city__name">${prov.name}</h3>
        <p class="city__facts">Nüfus: ${prov.population} • Koordinat: ${prov.lat.toFixed(2)}°K, ${prov.lon.toFixed(2)}°D</p>
      </div>
      <!-- Ziyaret Durumu Değiştirici -->
      <div>
        <p class="kicker">Bu Şehirdeki Durumun (Tıkla & İşaretle)</p>
        <div class="status-row">
          ${statusButtons
            .map(
              b => `
            <button onclick="window.App.setProvinceStatus(${prov.plate}, '${b.key}')"
              class="status-btn is-${b.key}${status === b.key ? " is-active" : ""}"${status === b.key ? ' aria-pressed="true"' : ""}>
              ${b.label}
            </button>
          `
            )
            .join("")}
        </div>
      </div>
      <!-- Şehir Özeti -->
      <p class="city__summary">${prov.summary}</p>
      <!-- Gezilecek Yerler & Meşhur Lezzetler -->
      <div class="city__lists">
        <div>
          <p class="kicker">Gezilecek Yerler</p>
          <div class="taglist">
            ${prov.highlights.map(h => `<span class="tag">${h}</span>`).join("")}
          </div>
        </div>
        <div>
          <p class="kicker">Meşhur Lezzetler</p>
          <div class="taglist">
            ${prov.foods.map(f => `<span class="tag">${f}</span>`).join("")}
          </div>
        </div>
      </div>
      <!-- Bu Şehre Ait Uçuşlarım & FlightRadar Rotalarım -->
      <div class="subhead">
        <p class="kicker">${prov.name} Uçuş & Seyahat Kayıtlarım (${cityFlights.length})</p>
        ${
          cityFlights.length === 0
            ? `<p class="empty">
                Bu şehre henüz bir uçuş kaydı eklenmemiş. Üstteki <b>+ Seyahat / Uçuş Ekle</b> butonundan ekleyebilirsin.
              </p>`
            : cityFlights
                .map(
                  f => `
              <div class="mini-flight">
                <div class="mini-flight__top">
                  <b>${f.airline} • ${f.flightNumber}</b>
                  <span>${f.dateFormatted}</span>
                </div>
                <div class="mini-flight__route">
                  <span>${f.fromIata} <small>${f.departureTime}</small></span>
                  <small>${f.aircraftName}</small>
                  <span>${f.toIata} <small>${f.arrivalTime}</small></span>
                </div>
                <div class="mini-flight__foot">
                  <span>Koltuk: <b>${f.seat}</b> • Kapı: <b>${f.gate}</b></span>
                  <span class="hud__btns">
                    <button onclick="window.App.focusFlightOnMap('${f.id}')" class="linkbtn">Haritada Rota</button>
                    <button onclick="window.App.openBoardingPassModal('${f.id}')" class="linkbtn">Bilet & Foto</button>
                  </span>
                </div>
              </div>
            `
                )
                .join("")
        }
      </div>
      <!-- Kişisel Şehir Anılarım & Fotoğraf Ekleme -->
      <div class="subhead memory">
        <p class="kicker">${prov.name} Anılarım & Fotoğraflarım</p>
        <textarea id="cityNoteTextarea" rows="2" class="field" aria-label="${prov.name} notları" placeholder="${prov.name} seyahatinle ilgili kişisel notların...">${esc(memory.notes || "")}</textarea>
        <div class="memory__row">
          <label class="btn btn--quiet btn--small file-btn">
            <span>Fotoğraf Yükle</span>
            <input type="file" accept="image/*" onchange="window.App.handleCityPhotoUpload(event, ${prov.plate})" />
          </label>
          <button onclick="window.App.saveCityNote(${prov.plate})" class="btn btn--ink btn--small">Notu Kaydet</button>
        </div>
        ${
          memory.photos && memory.photos.length > 0
            ? `<div class="photo-grid">
                ${memory.photos
                  .map(
                    ph => `
                  <figure>
                    <img src="${ph.url}" alt="${esc(ph.caption || prov.name)}" onerror="this.parentNode.style.display='none'" />
                    <figcaption>${esc(ph.caption || prov.name)}</figcaption>
                  </figure>
                `
                  )
                  .join("")}
              </div>`
            : ""
        }
      </div>
    `;
  }

  function setProvinceStatus(plate, statusKey) {
    if (!state.provinceStatuses) state.provinceStatuses = {};
    if (statusKey === "none") {
      delete state.provinceStatuses[plate];
    } else {
      state.provinceStatuses[plate] = statusKey;
    }
    saveState();
    renderAll();
  }

  function saveCityNote(plate) {
    const textarea = document.getElementById("cityNoteTextarea");
    if (!textarea) return;
    if (!state.cityMemories) state.cityMemories = {};
    if (!state.cityMemories[plate]) {
      state.cityMemories[plate] = { visitedDate: "2026", notes: "", photos: [] };
    }
    state.cityMemories[plate].notes = textarea.value;
    saveState();
    renderSelectedCityPanel(plate);
  }

  function handleCityPhotoUpload(event, plate) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      if (!state.cityMemories) state.cityMemories = {};
      if (!state.cityMemories[plate]) {
        state.cityMemories[plate] = { visitedDate: "2026", notes: "", photos: [] };
      }
      state.cityMemories[plate].photos.unshift({
        url: e.target.result,
        caption: file.name.replace(/\.[^/.]+$/, "")
      });
      if (!state.provinceStatuses[plate]) {
        state.provinceStatuses[plate] = "visited";
      }
      saveState();
      renderAll();
    };
    reader.readAsDataURL(file);
  }

  // ==========================================================================
  // 6. SEYAHATLERİM & DİJİTAL BİNİŞ KARTLARI (PEGASUS PC2730 & AJET VF3181)
  // ==========================================================================
  function renderBoardingPassesAndTrips() {
    const grid = document.getElementById("boardingPassesGrid");
    const tripsList = document.getElementById("tripsListContainer");
    if (!grid || !tripsList) return;
    grid.innerHTML = (state.flights || []).map(f => buildBoardingPassCardHtml(f)).join("");
    tripsList.innerHTML = (state.trips || [])
      .map(
        t => `
      <article class="trip">
        <div class="trip__main">
          <div class="trip__meta">
            <b>${t.isRoundTrip ? "Gidiş - Dönüş Seyahat" : "Tek Yön Seyahat"}</b>
            <span>${esc(t.dateDisplay || t.startDate)}</span>
            <span>${esc(plainLabel(t.transportLabel))}</span>
          </div>
          <h4 class="trip__title">${esc(t.title)}</h4>
          <p class="muted">${esc(t.summary)}</p>
          <div class="taglist">
            ${(t.tags || []).map(tag => `<span class="tag">${esc(tag)}</span>`).join("")}
          </div>
        </div>
        <div class="trip__side">
          <div class="trip__km num">${t.distanceTotalKm} km</div>
          <div class="muted">Toplam Havada: ${window.AviationUtils.formatDuration(t.durationTotalMinutes)}</div>
          <button onclick="window.App.switchTab('map'); window.App.focusFlightOnMap('all');" class="btn btn--small">
            Haritada Gidiş-Dönüş Rotasını Göster
          </button>
        </div>
      </article>
    `
      )
      .join("");
  }

  function buildBoardingPassCardHtml(f) {
    // Kart şeridinin rengi havayolu koduna göre: PC (Pegasus) sarı, VF (AJet) lacivert, diğerleri mürekkep
    const themeCls = f.airlineCode === "PC" ? " pass--pegasus" : f.airlineCode === "VF" ? " pass--ajet" : "";
    const hasActual = f.actualDepartureTime && f.actualArrivalTime;
    return `
      <article class="pass${themeCls}${f.direction === "inbound" ? " pass--in" : ""}">
        <!-- Üst Şerit -->
        <div class="pass__head">
          <span>
            <span class="pass__airline">${f.airlineCode === "PC" ? "PEGASUS AIRLINES" : f.airline}</span>
            <span class="pass__dir">${f.directionLabel}</span>
          </span>
          <span class="pass__flight num">UÇUŞ: ${f.flightNumber}</span>
        </div>
        <div class="pass__body">
          <!-- Orta Rota & Saat Bilgisi -->
          <div class="pass__route">
            <div>
              <div class="pass__iata">${f.fromIata}</div>
              <div class="pass__city">${f.fromCity}</div>
              <div class="pass__time">${f.departureTime}</div>
            </div>
            <div class="pass__mid">
              <span>${f.aircraftName}</span>
              <span class="pass__line"></span>
              <span class="num">${f.distanceKm} km • ${window.AviationUtils.formatDuration(f.durationMinutes)}</span>
            </div>
            <div>
              <div class="pass__iata">${f.toIata}</div>
              <div class="pass__city">${f.toCity}</div>
              <div class="pass__time">${f.arrivalTime}</div>
            </div>
          </div>
          <!-- Biniş Kartı Detay Kutucukları (Koltuk, Kapı, Biniş Saati, Tarih) -->
          <div class="pass__grid">
            <div class="kv"><span class="k">Yolcu</span><span class="v">${(state.profile.name || "").toLocaleUpperCase("tr-TR")}</span></div>
            <div class="kv"><span class="k">Koltuk</span><span class="v">${f.seat}</span></div>
            <div class="kv"><span class="k">Kapı / Biniş</span><span class="v">${f.gate !== "-" ? `Kapı ${f.gate}` : f.departureTerminal} (${f.boardingTime})</span></div>
            <div class="kv"><span class="k">Tarih</span><span class="v">${formatDateTr(f.date)}</span></div>
          </div>
          <div class="pass__meta">
            <span>BAGAJ: <b>${f.baggage}</b></span>
            <span>BÖLGE/SEQ: <b>${f.boardingZone} / ${f.sequenceNo}</b></span>
            <span>PNR: <b>${f.maskedPnr}</b></span>
            ${hasTail(f) ? `<span>TESCİL: <b>${f.tailNumber}</b></span>` : ""}
            ${hasActual ? `<span>GERÇEKLEŞEN: <b>kalkış ${f.actualDepartureTime} • iniş ${f.actualArrivalTime}</b></span>` : ""}
          </div>
          <div class="pass__tear"></div>
          <!-- Alt Aksiyon Butonları -->
          <div class="pass__actions">
            <div>
              <button onclick="window.App.openBoardingPassModal('${f.id}')" class="btn btn--ink btn--small">
                Bilet Fotoğrafını & Detayı Gör
              </button>
              <button onclick="window.App.openSeatMapModal('${f.aircraftId}', '${f.seat}', '${f.flightNumber}')" class="btn btn--quiet btn--small">
                ${f.seat} Koltuk Şeması
              </button>
            </div>
            <button onclick="window.App.switchTab('map'); window.App.focusFlightOnMap('${f.id}');" class="btn btn--quiet btn--small">
              Haritada Göster
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function openBoardingPassModal(flightId) {
    const f = (state.flights || []).find(x => x.id === flightId) || state.flights[0];
    if (!f) return;
    const ac = window.AviationUtils.getAircraft(f.aircraftId);
    const modal = document.getElementById("ticketModal");
    const content = document.getElementById("ticketModalContent");
    const hasActual = f.actualDepartureTime && f.actualArrivalTime;
    const aircraftLine = [f.aircraftVariant || f.aircraftName, hasTail(f) ? f.tailNumber : ""].filter(Boolean).join(" • ");
    content.innerHTML = `
      <div class="modal__head">
        <div>
          <span class="kicker">${f.airline} • ${f.flightNumber} • ${f.dateFormatted}</span>
          <h3 class="modal__title">${f.fromCity} (${f.fromIata}) → ${f.toCity} (${f.toIata}) Biniş Kartı & Bilet Görseli</h3>
        </div>
        <button onclick="window.App.closeModal('ticketModal')" class="modal__close" aria-label="Kapat">✕</button>
      </div>
      <div class="modal__cols">
        <!-- Sol: Orijinal Bilet Görseli -->
        <div class="panel">
          <div class="block__head">
            <span class="kicker">Yüklenen Orijinal Bilet / Biniş Kartı Görseli</span>
            <span class="muted num">${f.flightNumber}</span>
          </div>
          ${
            f.ticketImage
              ? `<div class="ticket-img">
                  <img src="${f.ticketImage}" alt="${f.flightNumber} Bilet"
                    onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');" />
                  <div class="ticket-img__empty hidden">
                    <p><b>${f.airline} • ${f.flightNumber} Dijital Biniş Kartı</b></p>
                    <p>Gizlilik koruması nedeniyle kişisel bilet fotoğrafı yalnızca yerel cihazda görüntülenir (Maskeli PNR: <b>${f.maskedPnr}</b>).</p>
                  </div>
                </div>`
              : `<div class="ticket-img"><div class="ticket-img__empty">Bu uçuş için bilet görseli yüklenmedi.</div></div>`
          }
        </div>
        <!-- Sağ: Uçuş Detayları ve Uçak Özeti -->
        <div class="panel">
          <h4 class="panel__title">Uçuş & Biniş Detayları</h4>
          <div class="spec">
            <div class="kv"><span class="k">Havayolu & Uçuş</span><span class="v">${f.airline} (${f.flightNumber})</span></div>
            <div class="kv"><span class="k">Tarih</span><span class="v">${f.dateFormatted}</span></div>
            <div class="kv"><span class="k">Kalkış</span><span class="v">${f.fromIata} - ${f.departureTime} (${f.departureTerminal})</span></div>
            <div class="kv"><span class="k">Varış</span><span class="v">${f.toIata} - ${f.arrivalTime} (${f.arrivalTerminal})</span></div>
            ${hasActual ? `
            <div class="kv"><span class="k">Gerçekleşen Kalkış</span><span class="v">${f.actualDepartureTime}</span></div>
            <div class="kv"><span class="k">Gerçekleşen İniş</span><span class="v">${f.actualArrivalTime}</span></div>` : ""}
            <div class="kv"><span class="k">Koltuk Numarası</span><span class="v">${f.seat} (${f.seatType})</span></div>
            <div class="kv"><span class="k">Kapı / Biniş / Seq</span><span class="v">Kapı: ${f.gate} • Biniş: ${f.boardingTime} • Seq: ${f.sequenceNo}</span></div>
            <div class="kv"><span class="k">Bagaj Hakkı</span><span class="v">${f.baggage}</span></div>
            <div class="kv"><span class="k">Mesafe & Süre</span><span class="v">${f.distanceKm} km • ${window.AviationUtils.formatDuration(f.durationMinutes)}</span></div>
            <div class="kv"><span class="k">Uçak & Tescil</span><span class="v">${aircraftLine}</span></div>
          </div>
          <!-- Uçak Teknik Kartı -->
          <div class="block__head">
            <span class="kicker">Bindiğin Uçak Modeli</span>
            <span class="muted num">${ac.icao}</span>
          </div>
          <h5 class="panel__title">${ac.fullName}</h5>
          <p class="muted">${ac.description}</p>
          <div class="spec spec--3">
            <div class="kv"><span class="k">Motor</span><span class="v">${f.engines || ac.engines.split("/")[0]}</span></div>
            <div class="kv"><span class="k">Seyir Hızı</span><span class="v">${ac.cruiseSpeedKmh} km/s</span></div>
            <div class="kv"><span class="k">Kapasite</span><span class="v">${ac.maxPassengers} Yolcu</span></div>
          </div>
        </div>
      </div>
    `;
    modal.classList.remove("hidden");
  }

  // ==========================================================================
  // 7. UÇAK HANGARIM & 20A KOLTUK ŞEMASI + KUYRUK TESCİLİ SORGULAMA
  // ==========================================================================
  function renderAircraftCatalog() {
    const grid = document.getElementById("aircraftCatalogGrid");
    if (!grid) return;
    const flownAircraftIds = new Set((state.flights || []).map(f => f.aircraftId));
    const models = window.AIRCRAFT_CATALOG.filter(ac => {
      if (aircraftFilter === "flown") return flownAircraftIds.has(ac.id);
      if (aircraftFilter === "Airbus") return ac.manufacturer === "Airbus";
      if (aircraftFilter === "Boeing") return ac.manufacturer === "Boeing";
      return true;
    });
    grid.innerHTML = models
      .map(ac => {
        const isFlown = flownAircraftIds.has(ac.id);
        const myFlightsWithThis = (state.flights || []).filter(f => f.aircraftId === ac.id);
        return `
          <article class="ac-card${isFlown ? " is-flown" : ""}">
            <!-- Uçak Fotoğrafı -->
            <div class="ac-card__photo">
              <img src="${ac.photoUrl}" alt="${ac.fullName}" loading="lazy" onerror="this.style.display='none'" />
            </div>
            <div>
              <p class="kicker">${ac.manufacturer} • ${ac.icao} • ${ac.category}</p>
              <h3 class="ac-card__title">${ac.fullName}</h3>
              ${isFlown ? `<p class="ac-card__flown">Bindiğim Uçak (${myFlightsWithThis.length} Uçuş)</p>` : ""}
            </div>
            <!-- Teknik Özellikler -->
            <p class="ac-card__desc">${ac.description}</p>
            <div class="spec">
              <div class="kv"><span class="k">Motor</span><span class="v">${ac.engines.split("/")[0]}</span></div>
              <div class="kv"><span class="k">Seyir Hızı</span><span class="v">${ac.cruiseSpeedKmh} km/s (${ac.mach})</span></div>
              <div class="kv"><span class="k">Maks. Menzil</span><span class="v">${ac.rangeKm.toLocaleString()} km</span></div>
              <div class="kv"><span class="k">Kapasite / Düzen</span><span class="v">${ac.maxPassengers} Yolcu (${ac.seatLayout.split(" ")[0]})</span></div>
              <div class="kv"><span class="k">Kanat / Uzunluk</span><span class="v">${ac.wingspan.split(" ")[0]}m / ${ac.length}</span></div>
              <div class="kv"><span class="k">İlk Uçuş & Tavan</span><span class="v">${ac.firstFlight} • ${ac.ceilingFt}</span></div>
            </div>
            ${
              myFlightsWithThis.length > 0
                ? `<div class="ac-card__mine">
                    <p class="kicker">Bu Uçakla Yaptığım Uçuşlar:</p>
                    ${myFlightsWithThis
                      .map(
                        fl => `
                      <div>
                        <span>${fl.airline} <b>${fl.flightNumber}</b> (${fl.fromIata}→${fl.toIata})</span>
                        <b>${hasTail(fl) ? `${fl.tailNumber} • ` : ""}Koltuk ${fl.seat}</b>
                      </div>
                    `
                      )
                      .join("")}
                  </div>`
                : ""
            }
            <button onclick="window.App.openSeatMapModal('${ac.id}', '20A', '${myFlightsWithThis[0]?.flightNumber || ac.model}')" class="btn btn--quiet btn--block">
              Kabin & Koltuk Haritasını Aç (20A Cam Kenarı)
            </button>
          </article>
        `;
      })
      .join("");
  }

  function openSeatMapModal(aircraftId, highlightSeat = "20A", flightLabel = "") {
    const ac = window.AviationUtils.getAircraft(aircraftId);
    const modal = document.getElementById("seatMapModal");
    const content = document.getElementById("seatMapModalContent");
    const rowsToRender = [1, 2, 3, 10, 11, 12, 18, 19, 20, 21, 22, 23, 30, 35];
    const seatLetters = ["A", "B", "C", "D", "E", "F"];
    const seatCell = code => `<div class="seat-cell ${code === highlightSeat ? "seat-melih" : ""}" title="Koltuk ${code}">${code}</div>`;
    content.innerHTML = `
      <div class="modal__head">
        <div>
          <span class="kicker">${ac.fullName} • ${ac.seatLayout}</span>
          <h3 class="modal__title">Kabin İçi Koltuk Yerleşimi & ${highlightSeat} Koltuk Konumu</h3>
        </div>
        <button onclick="window.App.closeModal('seatMapModal')" class="modal__close" aria-label="Kapat">✕</button>
      </div>
      <p class="muted">
        <b>${highlightSeat}</b> koltuğu uçağın sol tarafında (iskele), kanat firar kenarının (arka kısmının) hemen arkasında yer alan <b>Cam Kenarı (Window)</b> koltuktur. Hem motor/kanat flap hareketlerini hem de aşağıda uzanan Anadolu coğrafyasını izlemek için en ideal noktalardan biridir.
      </p>
      <!-- Gövde Şeması -->
      <div class="seatmap">
        <div class="seatmap__cap">▲ KOKPİT & ÖN KAPI (BURUN) ▲</div>
        ${rowsToRender
          .map(r => {
            const isWing = r >= 11 && r <= 19;
            return `
              <div class="seatmap__row">
                <span class="seatmap__wing seatmap__wing--l">${isWing ? "◄ KANAT" : ""}</span>
                <div class="seatmap__seats">
                  ${seatLetters.slice(0, 3).map(letter => seatCell(`${r}${letter}`)).join("")}
                  <span class="seatmap__num">${r}</span>
                  ${seatLetters.slice(3, 6).map(letter => seatCell(`${r}${letter}`)).join("")}
                </div>
                <span class="seatmap__wing">${isWing ? "KANAT ►" : ""}</span>
              </div>
            `;
          })
          .join("")}
        <div class="seatmap__cap">▼ KUYRUK & ARKA GALLEY ▼</div>
      </div>
    `;
    modal.classList.remove("hidden");
  }

  function quickTail(reg) {
    const inp = document.getElementById("tailLookupInput");
    if (inp) {
      inp.value = reg;
      lookupTailNumber();
    }
  }

  async function lookupTailNumber() {
    const inp = document.getElementById("tailLookupInput");
    const box = document.getElementById("tailLookupResultBox");
    if (!inp || !box) return;
    const reg = (inp.value || "").trim().toUpperCase();
    if (!reg) return;
    box.classList.remove("hidden");
    const localInfo = window.TURKISH_TAIL_REGISTRY[reg];
    box.innerHTML = `<div class="muted">${esc(reg)} kuyruk tescili sorgulanıyor...</div>`;
    let apiPhotoUrl = null;
    let apiPhotographer = null;
    try {
      const resp = await fetch(`https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(reg)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.photos && data.photos.length > 0) {
          apiPhotoUrl = data.photos[0].thumbnail_large?.src || data.photos[0].thumbnail?.src;
          apiPhotographer = data.photos[0].photographer;
        }
      }
    } catch {
      // Çevrimdışı veya CORS durumunda yerleşik veritabanı kullanılır
    }
    const closeBtn = `<button onclick="document.getElementById('tailLookupResultBox').classList.add('hidden')" class="btn btn--quiet btn--small">Kapat</button>`;
    if (!localInfo && !apiPhotoUrl) {
      box.innerHTML = `
        <div class="lookup-result__main">
          <p><b>${esc(reg)}</b> için yerel veritabanında kayıt bulunamadı. Örnek tesciller: <b>TC-RDM</b>, <b>TC-LTV</b>, <b>TC-RBA</b>, <b>TC-JRO</b>, <b>TC-JJN</b>.</p>
        </div>
        ${closeBtn}
      `;
      return;
    }
    const fallbackAc = localInfo ? window.AviationUtils.getAircraft(localInfo.aircraftId) : null;
    const photoUrl = apiPhotoUrl || (fallbackAc ? fallbackAc.photoUrl : "");
    // Yalnızca kayıtta bulunan alanlar gösterilir (doğrulanmamış alanlar boş bırakılabilir)
    const details = localInfo
      ? [
          localInfo.msn ? `MSN: ${localInfo.msn}` : "",
          localInfo.delivered ? `Teslim: ${localInfo.delivered}` : "",
          localInfo.engines ? `Motor: ${localInfo.engines}` : "",
          localInfo.base ? `Merkez: ${localInfo.base}` : ""
        ].filter(Boolean)
      : [];
    if (apiPhotographer) details.push(`Fotoğraf: © ${esc(apiPhotographer)} (Planespotters.net)`);
    box.innerHTML = `
      <div class="lookup-result__main">
        ${photoUrl ? `<img src="${photoUrl}" alt="${esc(reg)}" onerror="this.style.display='none'" />` : ""}
        <div>
          <p class="kicker">${localInfo ? localInfo.airline : "Türk Sivil Havacılık Tescili"}</p>
          <div class="lookup-result__reg">${esc(reg)}</div>
          <p><b>${localInfo ? localInfo.type : "Uçak tipi yerel veritabanında kayıtlı değil"}</b></p>
          <p class="muted">${localInfo ? localInfo.note : "Planespotters açık havacılık verisi."}</p>
          ${details.length ? `<p class="muted">${details.join(" • ")}</p>` : ""}
        </div>
      </div>
      ${closeBtn}
    `;
  }

  // ==========================================================================
  // 8. MELİH PROFİL PANELİ & BÖLGESEL İSTATİSTİKLER
  // ==========================================================================
  function renderProfileDashboard() {
    const container = document.getElementById("profileDashboardContainer");
    if (!container) return;
    const regions = ["Marmara", "İç Anadolu", "Ege", "Akdeniz", "Karadeniz", "Doğu Anadolu", "Güneydoğu Anadolu"];
    const regionStats = regions.map(reg => {
      const totalInReg = window.TURKEY_PROVINCES.filter(p => p.region === reg);
      const visitedInReg = totalInReg.filter(
        p => state.provinceStatuses[p.plate] === "visited" || state.provinceStatuses[p.plate] === "home"
      );
      const pct = Math.round((visitedInReg.length / totalInReg.length) * 100);
      return { region: reg, total: totalInReg.length, visited: visitedInReg.length, pct };
    });
    const initials = (state.profile.name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toLocaleUpperCase("tr-TR"))
      .join("");
    container.innerHTML = `
      <div class="profile">
        <!-- Sol: Melih Kimlik Kartı -->
        <div class="profile__id">
          <div class="profile__top">
            <div class="monogram">${initials || "MD"}</div>
            <div>
              <h3 class="profile__name">${state.profile.name}</h3>
              <p class="muted">${state.profile.handle} • ${state.profile.title}</p>
              <p class="kicker">Merkez: 34 İstanbul (SAW / IST)</p>
            </div>
          </div>
          <p>${state.profile.bio}</p>
          <dl class="facts">
            <div><dt>Favori Koltuk:</dt><dd>${state.profile.favoriteSeat}</dd></div>
            <div><dt>Favori Uçak Ailesi:</dt><dd>${state.profile.favoriteAircraft}</dd></div>
            <div><dt>Uçulan Havayolları:</dt><dd>Pegasus (PC), AJet (VF)</dd></div>
            <div><dt>Uçulan Havalimanları:</dt><dd>SAW, ASR</dd></div>
          </dl>
          <div class="profile__btns">
            <button onclick="window.App.exportJsonData()" class="btn">JSON Yedek İndir</button>
            <button onclick="window.App.resetToDefault()" class="btn btn--quiet btn--danger">Sıfırla</button>
          </div>
        </div>
        <!-- Sağ: 7 Coğrafi Bölge İlerleme Durumu -->
        <div class="block">
          <h3 class="block__title">Türkiye 7 Coğrafi Bölge Keşif İlerlemesi</h3>
          <div class="regions">
            ${regionStats
              .map(
                r => `
              <div>
                <div class="region__row">
                  <b>${r.region} Bölgesi</b>
                  <span class="muted num">${r.visited} / ${r.total} İl (%${r.pct})</span>
                </div>
                <div class="bar"><i style="width: ${r.pct}%"></i></div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // 9. YENİ SEYAHAT / UÇUŞ EKLEME FORMU
  // ==========================================================================
  function populateFormSelects() {
    const fromSel = document.getElementById("formFromPlate");
    const toSel = document.getElementById("formToPlate");
    const acSel = document.getElementById("formAircraftId");
    if (!fromSel || !toSel || !acSel) return;
    const optionsHtml = window.TURKEY_PROVINCES.map(
      p => `<option value="${p.plate}" ${p.plate === 34 ? "selected" : ""}>${p.code} - ${p.name} ${p.airport ? `(${p.airport})` : ""}</option>`
    ).join("");
    fromSel.innerHTML = optionsHtml;
    toSel.innerHTML = window.TURKEY_PROVINCES.map(
      p => `<option value="${p.plate}" ${p.plate === 6 ? "selected" : ""}>${p.code} - ${p.name} ${p.airport ? `(${p.airport})` : ""}</option>`
    ).join("");
    acSel.innerHTML = window.AIRCRAFT_CATALOG.map(
      a => `<option value="${a.id}">${a.fullName} (${a.icao})</option>`
    ).join("");
  }

  let uploadedTicketDataUrl = null;

  function toggleFlightFields() {
    const type = document.getElementById("formTransportType").value;
    const fields = document.getElementById("flightSpecificFields");
    const scannerBox = document.getElementById("smartTicketScannerBox");
    const corridorBox = document.getElementById("highwayCorridorBox");
    if (fields) fields.classList.toggle("hidden", type !== "plane");
    if (scannerBox) scannerBox.classList.toggle("hidden", type !== "plane");
    if (corridorBox) corridorBox.classList.toggle("hidden", type === "plane");
    if (type !== "plane") {
      updateHighwayCorridorPreview();
    }
  }

  function updateHighwayCorridorPreview() {
    const type = document.getElementById("formTransportType")?.value || "plane";
    const corridorBox = document.getElementById("highwayCorridorBox");
    const chipsContainer = document.getElementById("highwayCorridorChips");
    if (!corridorBox || !chipsContainer) return;
    if (type === "plane") {
      corridorBox.classList.add("hidden");
      return;
    }
    corridorBox.classList.remove("hidden");
    const fromPlate = Number(document.getElementById("formFromPlate")?.value || 34);
    const toPlate = Number(document.getElementById("formToPlate")?.value || 6);
    const fromP = window.TURKEY_PROVINCES.find(p => p.plate === fromPlate);
    const toP = window.TURKEY_PROVINCES.find(p => p.plate === toPlate);
    const transitProvs = window.HighwayCorridorEngine.findTransitProvinces(fromPlate, toPlate);
    if (transitProvs.length === 0) {
      chipsContainer.innerHTML = `<span class="muted">Komşu veya doğrudan bağlantılı şehirler (ara geçiş ili yok).</span>`;
      return;
    }
    const arrow = `<span class="muted">→</span>`;
    chipsContainer.innerHTML = `
      <span class="tag tag--from">${fromP?.name || ""}</span>
      ${arrow}
      ${transitProvs.map(tp => `<span class="tag tag--via">${tp.code} ${tp.name}</span>`).join(arrow)}
      ${arrow}
      <span class="tag tag--to">${toP?.name || ""}</span>
    `;
  }

  // ==========================================================================
  // 10. AKILLI BİLET FOTOĞRAFI / OCR OKUYUCU
  // ==========================================================================
  function handleTicketOcrUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const statusBox = document.getElementById("ocrScanStatus");
    if (statusBox) {
      statusBox.classList.remove("hidden");
      statusBox.textContent = `"${file.name}" bilet görseli analiz ediliyor...`;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      uploadedTicketDataUrl = e.target.result;
      const rawHint = document.getElementById("ocrRawTextInput")?.value || "";
      const parsed = window.SmartTicketScanner.parseTicketText(rawHint, file.name);
      applyParsedTicketToForm(parsed, `"${file.name}" görseli yüklendi ve bilet alanları otomatik dolduruldu!`);
    };
    reader.readAsDataURL(file);
  }

  function runSampleTicketScan() {
    const sampleText = "TK2026 IST AYT 10.11.2026 09:40 11:05 Koltuk 14A Kapı 208 Airbus A321neo";
    const inp = document.getElementById("ocrRawTextInput");
    if (inp) inp.value = sampleText;
    const parsed = window.SmartTicketScanner.parseTicketText(sampleText);
    applyParsedTicketToForm(parsed, "Örnek bilet (TK2026 • IST → AYT • Airbus A321neo • Koltuk 14A • Kapı 208) otomatik çözümlendi!");
  }

  function parseManualTicketText() {
    const raw = document.getElementById("ocrRawTextInput")?.value || "";
    if (!raw.trim()) {
      runSampleTicketScan();
      return;
    }
    const parsed = window.SmartTicketScanner.parseTicketText(raw);
    applyParsedTicketToForm(parsed, `Bilet metni çözümlendi: ${parsed.airline} ${parsed.flightNo} • Koltuk ${parsed.seat}`);
  }

  function applyParsedTicketToForm(parsed, message) {
    document.getElementById("formTransportType").value = "plane";
    toggleFlightFields();
    document.getElementById("formAirline").value = parsed.airline;
    document.getElementById("formFlightNo").value = parsed.flightNo;
    document.getElementById("formFromPlate").value = parsed.fromPlate;
    document.getElementById("formToPlate").value = parsed.toPlate;
    document.getElementById("formDepTime").value = parsed.depTime;
    document.getElementById("formArrTime").value = parsed.arrTime;
    document.getElementById("formSeat").value = parsed.seat;
    document.getElementById("formGate").value = parsed.gate;
    document.getElementById("formAircraftId").value = parsed.aircraftId;
    document.getElementById("formDate").value = parsed.date;
    const statusBox = document.getElementById("ocrScanStatus");
    if (statusBox) {
      statusBox.classList.remove("hidden");
      statusBox.textContent = message;
    }
  }

  function handleAddFlightSubmit(event) {
    event.preventDefault();
    const transportType = document.getElementById("formTransportType").value;
    const dateVal = document.getElementById("formDate").value || "2026-11-09";
    const fromPlate = Number(document.getElementById("formFromPlate").value);
    const toPlate = Number(document.getElementById("formToPlate").value);
    const notes = document.getElementById("formNotes").value || "";
    const fromProv = window.TURKEY_PROVINCES.find(p => p.plate === fromPlate);
    const toProv = window.TURKEY_PROVINCES.find(p => p.plate === toPlate);
    if (!fromProv || !toProv) return;
    // Varış ilini otomatik "visited" olarak işaretle
    if (!state.provinceStatuses[toPlate]) {
      state.provinceStatuses[toPlate] = "visited";
    }
    // Karayolu ise geçiş illerini kontrol et ve otomatik "passed" (İçinden Geçtim) işaretle
    let transitPlates = [];
    if (transportType !== "plane") {
      const transitProvs = window.HighwayCorridorEngine.findTransitProvinces(fromPlate, toPlate);
      transitPlates = transitProvs.map(p => p.plate);
      const autoMark = document.getElementById("formAutoMarkTransit")?.checked;
      if (autoMark) {
        transitPlates.forEach(pl => {
          if (!state.provinceStatuses[pl]) {
            state.provinceStatuses[pl] = "passed";
          }
        });
      }
    }
    const km = window.AviationUtils.calculateDistanceKm(fromProv.lat, fromProv.lon, toProv.lat, toProv.lon);
    if (transportType === "plane") {
      const airline = document.getElementById("formAirline").value;
      const flightNo = (document.getElementById("formFlightNo").value || "TK2026").toUpperCase();
      const aircraftId = document.getElementById("formAircraftId").value;
      const depTime = document.getElementById("formDepTime").value || "09:30";
      const arrTime = document.getElementById("formArrTime").value || "11:00";
      const seat = (document.getElementById("formSeat").value || "20A").toUpperCase();
      const gate = document.getElementById("formGate").value || "-";
      const ac = window.AviationUtils.getAircraft(aircraftId);
      const newFlight = {
        id: `FL-${flightNo}-${Date.now()}`,
        tripId: `TRIP-${Date.now()}`,
        direction: "outbound",
        directionLabel: "Uçuş Kaydı",
        airline,
        airlineCode: flightNo.slice(0, 2),
        airlineTheme: airline.includes("Pegasus") ? "pegasus" : "ajet",
        flightNumber: flightNo,
        date: dateVal,
        dateFormatted: dateVal,
        fromIata: fromProv.airport || fromProv.code,
        fromCity: fromProv.name,
        fromPlate,
        toIata: toProv.airport || toProv.code,
        toCity: toProv.name,
        toPlate,
        departureTime: depTime,
        arrivalTime: arrTime,
        durationMinutes: Math.max(45, Math.round(km / 7.5)),
        distanceKm: km,
        aircraftId,
        aircraftName: ac.fullName,
        tailNumber: "TC-...",
        seat,
        seatType: "Pencere / Koridor",
        departureTerminal: "Ana Terminal",
        arrivalTerminal: "Ana Terminal",
        gate,
        boardingTime: depTime,
        boardingZone: "A",
        sequenceNo: "-",
        baggage: "15 Kg",
        maskedPnr: "****TR",
        status: "Uçuldu",
        cruiseAltitudeFt: 35000,
        cruiseSpeedKmh: ac.cruiseSpeedKmh,
        routeColor: "#10b981",
        ticketImage: uploadedTicketDataUrl,
        notes
      };
      state.flights.push(newFlight);
      uploadedTicketDataUrl = null;
    }
    state.trips.unshift({
      id: `TRIP-${Date.now()}`,
      title: `${fromProv.name} ➔ ${toProv.name} Seyahati`,
      fromPlate,
      toPlate,
      transitPlates,
      transportType,
      transportLabel: transportType === "plane" ? "Uçak" : transportType === "car" ? `Özel Araba (${transitPlates.length} Geçiş İli)` : transportType === "bus" ? "Otobüs" : "Tren",
      startDate: dateVal,
      endDate: dateVal,
      dateDisplay: dateVal,
      isRoundTrip: false,
      flightIds: [],
      distanceTotalKm: km,
      durationTotalMinutes: Math.max(60, Math.round(km / 7)),
      summary: notes || `${fromProv.name} şehrinden ${toProv.name} şehrine seyahat.`,
      tags: [fromProv.name, toProv.name, ...(transitPlates.length ? [`+${transitPlates.length} Geçiş İli`] : [])]
    });
    saveState();
    closeModal("addTripModal");
    selectedProvincePlate = toPlate;
    renderAll();
  }

  // ==========================================================================
  // 11. PAYLAŞILABİLİR UÇUŞ & SEYAHAT PASAPORTU KARTI (CANVAS PNG ÜRETİCİ)
  // ==========================================================================
  function openPassportModal() {
    const modal = document.getElementById("passportModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    renderPassportCanvas();
    // Başlık yazı tipi henüz yüklenmediyse yüklenince yeniden çiz
    if (document.fonts && document.fonts.load) {
      document.fonts.load("500 80px Newsreader").then(renderPassportCanvas).catch(() => {});
    }
  }

  function renderPassportCanvas() {
    const canvas = document.getElementById("passportCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const SERIF = "Newsreader, Georgia, 'Times New Roman', serif";
    const SANS = "Inter, system-ui, 'Segoe UI', sans-serif";
    const M = 76; // kenar boşluğu
    const spaced = px => {
      if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
    };
    ctx.setLineDash([]);
    ctx.textBaseline = "alphabetic";
    // 1. Zemin (derginin gri-mavi zemini) ve üst şerit
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = INK;
    ctx.fillRect(M, 62, W - 2 * M, 6);
    // 2. Üst Başlık & Melih Profili
    ctx.fillStyle = MUTED;
    ctx.font = `600 21px ${SANS}`;
    spaced(3);
    ctx.fillText("ROTAM TÜRKİYE • SEYAHAT & HAVACILIK PASAPORTU", M, 116);
    spaced(0);
    ctx.fillStyle = INK;
    ctx.font = `500 88px ${SERIF}`;
    ctx.fillText(state.profile.name, M - 4, 208, W - 2 * M);
    ctx.fillStyle = MUTED;
    ctx.font = `500 25px ${SANS}`;
    ctx.fillText(`${state.profile.handle} • Favori Koltuk: 20A (Cam Kenarı)`, M, 254);
    ctx.fillStyle = INK;
    ctx.fillRect(M, 282, W - 2 * M, 1.5);
    // 3. 4 Ana İstatistik Kutusu (uçuş kayıtlarından hesaplanır)
    const statuses = state.provinceStatuses || {};
    const visitedPlates = visitedPlateList();
    const visitedCount = visitedPlates.length;
    const passedCount = Object.keys(statuses).filter(k => statuses[k] === "passed").length;
    const flights = state.flights || [];
    const totalKm = flights.reduce((a, f) => a + (Number(f.distanceKm) || 0), 0);
    const totalMin = flights.reduce((a, f) => a + (Number(f.durationMinutes) || 0), 0);
    const modelNames = flownModelNames();
    const visitedNames = visitedPlates
      .map(p => window.TURKEY_PROVINCES.find(x => x.plate === Number(p)))
      .filter(Boolean)
      .slice(0, 2)
      .map(x => `${x.code} ${x.name}`)
      .join(" & ");
    const stats = [
      { label: "KEŞFEDİLEN İLLER", val: `${visitedCount} / 81 İl`, sub: passedCount ? `+${passedCount} Geçiş İli` : (visitedNames || "Henüz il işaretlenmedi"), color: COBALT },
      { label: "TOPLAM UÇUŞ", val: `${flights.length} Uçuş`, sub: "SAW ⇄ ASR (Gidiş-Dönüş)", color: INK },
      { label: "UÇUŞ MESAFESİ", val: `${totalKm.toLocaleString("tr-TR")} km`, sub: `Havada: ${window.AviationUtils.formatDuration(totalMin)}`, color: INK },
      { label: "UÇAK HANGARIM", val: `${modelNames.length} Model`, sub: modelNames.join(" & ") || "Henüz uçuş yok", color: INK }
    ];
    stats.forEach((st, idx) => {
      const bx = M + (idx % 2) * 474;
      const by = 312 + Math.floor(idx / 2) * 160;
      ctx.fillStyle = PAPER;
      ctx.fillRect(bx, by, 454, 140);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, 454, 140);
      ctx.fillStyle = MUTED;
      ctx.font = `600 17px ${SANS}`;
      spaced(2);
      ctx.fillText(st.label, bx + 26, by + 38);
      spaced(0);
      ctx.fillStyle = st.color;
      ctx.font = `500 52px ${SERIF}`;
      ctx.fillText(st.val, bx + 24, by + 92, 406);
      ctx.fillStyle = MUTED;
      ctx.font = `500 18px ${SANS}`;
      ctx.fillText(st.sub, bx + 26, by + 122, 402);
    });
    // 4. Mini Türkiye Haritası & Uçuş Rotaları
    const mapBoxY = 644;
    const mapBoxH = 346;
    ctx.fillStyle = GROUND;
    ctx.fillRect(M, mapBoxY, W - 2 * M, mapBoxH);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(M, mapBoxY, W - 2 * M, mapBoxH);
    ctx.save();
    const scale = Math.min((W - 2 * M - 24) / 1200, (mapBoxH - 16) / 560);
    ctx.translate(M + (W - 2 * M - 1200 * scale) / 2, mapBoxY + (mapBoxH - 560 * scale) / 2);
    ctx.scale(scale, scale);
    const fillFor = st => (st === "home" ? AMBER : st === "visited" ? COBALT : st === "passed" ? COBALT_SOFT : st === "wishlist" ? "#F7F8FA" : PAPER);
    const geo = window.TURKEY_GEO_PATHS;
    if (geo && typeof Path2D === "function") {
      // Gerçek il sınırları
      window.TURKEY_PROVINCES.forEach(p => {
        if (!geo[p.plate]) return;
        const shape = new Path2D(geo[p.plate]);
        ctx.fillStyle = fillFor(statuses[p.plate]);
        ctx.fill(shape);
        ctx.strokeStyle = statuses[p.plate] ? INK : "#8FA0B0";
        ctx.lineWidth = statuses[p.plate] ? 1.6 : 1.1;
        ctx.stroke(shape);
      });
    } else {
      // Sınır verisi yüklenemediyse iller nokta olarak çizilir
      window.TURKEY_PROVINCES.forEach(p => {
        const [px, py] = window.TurkeyMapEngine.project(p.lat, p.lon);
        const st = statuses[p.plate];
        ctx.beginPath();
        ctx.arc(px, py, st ? 14 : 7, 0, Math.PI * 2);
        ctx.fillStyle = fillFor(st);
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
    // Uçuş yayları: gidiş düz, dönüş noktalı
    flights.forEach(f => {
      const fromAp = window.AviationUtils.getAirport(f.fromIata);
      const toAp = window.AviationUtils.getAirport(f.toIata);
      if (!fromAp || !toAp) return;
      const [x1, y1] = window.TurkeyMapEngine.project(fromAp.lat, fromAp.lon);
      const [x2, y2] = window.TurkeyMapEngine.project(toAp.lat, toAp.lon);
      const inbound = f.direction === "inbound";
      const draw = (color, width, dash) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + (inbound ? 55 : -55), x2, y2);
        ctx.stroke();
      };
      draw(PAPER, 9, []);
      draw(INK, 4.5, inbound ? [3, 9] : []);
    });
    ctx.setLineDash([]);
    PRIMARY_AIRPORTS.forEach(code => {
      const ap = window.AviationUtils.getAirport(code);
      if (!ap || !flights.some(f => f.fromIata === code || f.toIata === code)) return;
      const [ax, ay] = window.TurkeyMapEngine.project(ap.lat, ap.lon);
      ctx.beginPath();
      ctx.arc(ax, ay, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.5;
      ctx.stroke();
    });
    ctx.restore();
    // 5. Alt Biniş Kartı Özetleri (PC2730 & VF3181)
    flights.slice(0, 2).forEach((f, i) => {
      const fy = 1016 + i * 112;
      ctx.fillStyle = PAPER;
      ctx.fillRect(M, fy, W - 2 * M, 94);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(M, fy, W - 2 * M, 94);
      ctx.fillStyle = f.airlineCode === "PC" ? "#FDB913" : f.airlineCode === "VF" ? "#0A3266" : INK;
      ctx.fillRect(M, fy, 10, 94);
      ctx.fillStyle = MUTED;
      ctx.font = `600 18px ${SANS}`;
      spaced(2);
      ctx.fillText(`${f.airline.toLocaleUpperCase("tr-TR")} • ${f.flightNumber}`, M + 34, fy + 36);
      spaced(0);
      ctx.fillStyle = INK;
      ctx.font = `500 31px ${SERIF}`;
      ctx.fillText(
        `${f.fromIata} (${f.departureTime}) → ${f.toIata} (${f.arrivalTime}) • ${String(f.aircraftName || "").replace(/\s*\(.*\)\s*$/, "")} • Koltuk ${f.seat}`,
        M + 34,
        fy + 75,
        W - 2 * M - 62
      );
    });
    ctx.fillStyle = INK;
    ctx.fillRect(M, H - 100, W - 2 * M, 1.5);
    ctx.fillStyle = MUTED;
    ctx.font = `500 19px ${SANS}`;
    ctx.fillText("Rotam Türkiye • Melih'in Kişisel Seyahat & FlightRadar Arşivi", M, H - 62);
  }

  function downloadPassportPng() {
    renderPassportCanvas();
    const canvas = document.getElementById("passportCanvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "melih-rotam-turkiye-pasaport.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add("hidden");
  }

  function exportJsonData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "melih-seyahat-ve-ucus-arsivi.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    state = JSON.parse(JSON.stringify(window.DEFAULT_MELIH_STATE));
    saveState();
    renderAll();
  }

  let deferredPwaPrompt = null;
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPwaPrompt = e;
  });
  if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  function triggerPwaInstall() {
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt();
      deferredPwaPrompt.userChoice.finally(() => {
        deferredPwaPrompt = null;
      });
    } else {
      alert(
        "Rotam Türkiye PWA Kurulumu:\n\n" +
          "• Bilgisayarda (Chrome/Edge): Adres çubuğunun sağındaki 'Yükle / Uygulamayı Kur' ikonuna tıklayın.\n" +
          "• iPhone/iPad (Safari): Paylaş butonuna basıp 'Ana Ekrana Ekle' seçeneğini seçin.\n" +
          "• Android (Chrome): Sağ üst menüden 'Ana ekrana ekle / Uygulamayı yükle' seçeneğine dokunun."
      );
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    switchTab,
    setMapMode,
    selectProvince,
    setProvinceStatus,
    saveCityNote,
    handleCityPhotoUpload,
    focusFlightOnMap,
    openBoardingPassModal,
    openSeatMapModal,
    lookupTailNumber,
    quickTail,
    toggleFlightFields,
    updateHighwayCorridorPreview,
    handleTicketOcrUpload,
    runSampleTicketScan,
    parseManualTicketText,
    handleAddFlightSubmit,
    openPassportModal,
    downloadPassportPng,
    triggerPwaInstall,
    closeModal,
    exportJsonData,
    resetToDefault
  };
})();
