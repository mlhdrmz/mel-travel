// ============================================================================
// MelTravel - Ana Uygulama Motoru (Harita, FlightRadar, Hangar & Profil)
// ============================================================================
window.App = (function () {
  const STORAGE_KEY = "mel_travel_state_v2";
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
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Yerel durum okunamadı, varsayılan Melih profili yükleniyor.", e);
    }
    return JSON.parse(JSON.stringify(window.DEFAULT_MELIH_STATE));
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
          const active = b.dataset.region === selectedRegionFilter;
          b.className = active
            ? "region-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40"
            : "region-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-400 border border-slate-800 hover:text-white";
        });
        renderSvgProvinces();
      });
    });
    // Uçak Filtreleri
    document.querySelectorAll(".ac-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        aircraftFilter = btn.dataset.acfilter;
        document.querySelectorAll(".ac-filter-btn").forEach(b => {
          const active = b.dataset.acfilter === aircraftFilter;
          b.className = active
            ? "ac-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-white"
            : "ac-filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800 hover:text-white";
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
    activeTab = tabId;
    ["map", "trips", "aircraft", "profile"].forEach(t => {
      const el = document.getElementById(`tabContent-${t}`);
      if (el) el.classList.toggle("hidden", t !== tabId);
    });
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      const isCurrent = btn.dataset.tab === tabId;
      btn.className = isCurrent
        ? "nav-tab-btn px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 bg-sky-500 text-white shadow"
        : "nav-tab-btn px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800/70";
    });
    if (tabId === "map" && mapMode === "leaflet" && leafletMap) {
      setTimeout(() => leafletMap.invalidateSize(), 120);
    }
  }
  function setMapMode(mode) {
    mapMode = mode;
    document.querySelectorAll(".map-mode-btn").forEach(btn => {
      const active = btn.dataset.mapmode === mode;
      btn.className = active
        ? "map-mode-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500 text-white shadow flex items-center gap-1.5 transition"
        : "map-mode-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/90 text-slate-300 hover:text-white flex items-center gap-1.5 transition";
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
    renderKpiStrip();
    renderSvgProvinces();
    renderMapRoutesAndAirports();
    renderSelectedCityPanel(selectedProvincePlate);
    renderBoardingPassesAndTrips();
    renderAircraftCatalog();
    renderProfileDashboard();
  }
  // ==========================================================================
  // 1. ÜST KPI ŞERİDİ
  // ==========================================================================
  function renderKpiStrip() {
    const statuses = state.provinceStatuses || {};
    const visitedPlates = Object.keys(statuses).filter(
      k => statuses[k] === "visited" || statuses[k] === "home"
    );
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
    // Gölleri Çiz (Van Gölü & Tuz Gölü)
    const lakeVanPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    lakeVanPath.setAttribute("d", mapData.lakeVan);
    lakeVanPath.setAttribute("fill", "#061224");
    lakeVanPath.setAttribute("stroke", "#0ea5e9");
    lakeVanPath.setAttribute("stroke-width", "0.9");
    lakeVanPath.setAttribute("opacity", "0.9");
    lakesLayer.appendChild(lakeVanPath);
    const lakeTuzPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    lakeTuzPath.setAttribute("d", mapData.lakeTuz);
    lakeTuzPath.setAttribute("fill", "#081a33");
    lakeTuzPath.setAttribute("stroke", "#38bdf8");
    lakeTuzPath.setAttribute("stroke-width", "0.7");
    lakeTuzPath.setAttribute("opacity", "0.75");
    lakesLayer.appendChild(lakeTuzPath);
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
      const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pathEl.setAttribute("d", pathStr);
      pathEl.setAttribute("data-plate", prov.plate);
      let cls = `province-path status-${mapMode === "radar" && status === "none" ? "none" : status}`;
      if (isSelected) cls += " selected-province";
      if (isDimmed) cls += " dimmed";
      pathEl.setAttribute("class", cls);
      if (mapMode === "radar" && status === "none") {
        pathEl.style.fill = "#071821";
        pathEl.style.stroke = "rgba(16, 185, 129, 0.22)";
      }
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
      const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textEl.setAttribute("x", cx);
      textEl.setAttribute("y", cy);
      const isHighlighted = status !== "none" || isSelected;
      textEl.setAttribute("class", `province-label ${isHighlighted ? "highlight-label" : ""} ${isDimmed ? "opacity-25" : ""}`);
      textEl.textContent = isHighlighted ? `${prov.code} ${prov.name}` : prov.code;
      labelsLayer.appendChild(textEl);
    });
  }
  function showProvinceTooltip(e, prov, status) {
    const tooltip = document.getElementById("mapTooltip");
    const statusLabels = {
      home: `<span class="text-sky-400 font-bold">🏠 Merkez / Ev</span>`,
      visited: `<span class="text-emerald-400 font-bold">✅ Gezildi / Görüldü</span>`,
      passed: `<span class="text-amber-400 font-bold">🚗 İçinden Geçildi / Aktarma</span>`,
      wishlist: `<span class="text-purple-400 font-bold">💜 Gitmek İstiyorum</span>`,
      none: `<span class="text-slate-400">⚪ Henüz Gidilmedi</span>`
    };
    const cityFlights = (state.flights || []).filter(
      f => f.fromPlate === prov.plate || f.toPlate === prov.plate
    );
    tooltip.innerHTML = `
      <div class="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5 mb-1.5">
        <div class="flex items-center gap-1.5">
          <span class="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold text-[11px]">${prov.code}</span>
          <span class="font-extrabold text-white text-sm">${prov.name}</span>
        </div>
        <span class="text-[10px] text-slate-400">${prov.region}</span>
      </div>
      <div class="space-y-1">
        <div>Durum: ${statusLabels[status] || statusLabels.none}</div>
        ${prov.airport ? `<div class="text-slate-300">✈️ Havalimanı: <span class="font-mono font-bold text-amber-300">${prov.airport}</span></div>` : ""}
        ${cityFlights.length > 0 ? `<div class="text-emerald-300 font-semibold">🛫 ${cityFlights.length} Kayıtlı Uçuş (${cityFlights.map(f => f.flightNumber).join(", ")})</div>` : ""}
        <div class="text-[10px] text-slate-400 pt-1">Detaylar ve fotoğraf galerisi için tıklayın</div>
      </div>
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
  // ==========================================================================
  function renderMapRoutesAndAirports() {
    const routesLayer = document.getElementById("svgRoutesLayer");
    const airportsLayer = document.getElementById("svgAirportsLayer");
    if (!routesLayer || !airportsLayer) return;
    routesLayer.innerHTML = "";
    airportsLayer.innerHTML = "";
    if (selectedRouteFilter === "none") return;
    const flightsToShow = (state.flights || []).filter(
      f => selectedRouteFilter === "all" || f.id === selectedRouteFilter
    );
    const activeAirportCodes = new Set();
    // Eğer FlightRadar modundaysak tüm ana havalimanlarını radar noktası olarak göster
    if (mapMode === "radar") {
      window.TURKEY_AIRPORTS.forEach(ap => activeAirportCodes.add(ap.iata));
    }
    flightsToShow.forEach((flight, idx) => {
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
      const nx = -dy / len;
      const ny = dx / len;
      // Gidiş (SAW->ASR) kuzeyden yay çizer, Dönüş (ASR->SAW) güneyden yay çizer
      const curveOffset = flight.direction === "inbound" ? 46 : -48;
      const cx = midX + nx * curveOffset;
      const cy = midY + ny * curveOffset;
      const pathD = `M ${x1},${y1} Q ${cx.toFixed(1)},${cy.toFixed(1)} ${x2},${y2}`;
      const routeId = `flightArc_${flight.id}`;
      const color = flight.routeColor || (flight.direction === "inbound" ? "#38bdf8" : "#f59e0b");
      // 1. Arka Plan Parlama Yayı
      const glowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      glowPath.setAttribute("d", pathD);
      glowPath.setAttribute("fill", "none");
      glowPath.setAttribute("stroke", color);
      glowPath.setAttribute("stroke-width", "5");
      glowPath.setAttribute("opacity", "0.22");
      routesLayer.appendChild(glowPath);
      // 2. Kesikli Animasyonlu FlightRadar Yayı
      const arcPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      arcPath.setAttribute("id", routeId);
      arcPath.setAttribute("d", pathD);
      arcPath.setAttribute("fill", "none");
      arcPath.setAttribute("stroke", color);
      arcPath.setAttribute("stroke-width", "2.6");
      arcPath.setAttribute("class", "flight-arc-Animated cursor-pointer");
      arcPath.addEventListener("click", () => openBoardingPassModal(flight.id));
      routesLayer.appendChild(arcPath);
      // 3. Yay Ortası Uçuş Bilgi Etiketi (PC2730 / VF3181)
      const labelX = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
      const labelY = 0.25 * y1 + 0.5 * cy + 0.25 * y2 + (flight.direction === "inbound" ? 16 : -14);
      const badgeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      badgeGroup.setAttribute("class", "cursor-pointer");
      badgeGroup.addEventListener("click", () => openBoardingPassModal(flight.id));
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", labelX - 66);
      rect.setAttribute("y", labelY - 10);
      rect.setAttribute("width", "132");
      rect.setAttribute("height", "20");
      rect.setAttribute("rx", "6");
      rect.setAttribute("fill", "#020617");
      rect.setAttribute("stroke", color);
      rect.setAttribute("stroke-width", "1.2");
      badgeGroup.appendChild(rect);
      const badgeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      badgeText.setAttribute("x", labelX);
      badgeText.setAttribute("y", labelY + 3.5);
      badgeText.setAttribute("text-anchor", "middle");
      badgeText.setAttribute("fill", color);
      badgeText.setAttribute("font-size", "9.5");
      badgeText.setAttribute("font-family", "JetBrains Mono, monospace");
      badgeText.setAttribute("font-weight", "700");
      badgeText.textContent = `${flight.flightNumber} • ${flight.aircraftName.replace("Airbus ", "")}`;
      badgeGroup.appendChild(badgeText);
      routesLayer.appendChild(badgeGroup);
      // 4. Rota Üzerinde Canlı Hareket Eden Uçak İkonu (<animateMotion>)
      const planeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const planeIcon = document.createElementNS("http://www.w3.org/2000/svg", "path");
      // Uçak burun yönü +X eksenine bakacak şekilde SVG path
      planeIcon.setAttribute("d", "M 10,0 L -6,-7 L -3,-1 L -10,-4 L -10,4 L -3,1 L -6,7 Z");
      planeIcon.setAttribute("fill", "#ffffff");
      planeIcon.setAttribute("stroke", color);
      planeIcon.setAttribute("stroke-width", "1.5");
      const animMotion = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
      animMotion.setAttribute("dur", flight.direction === "inbound" ? "7.5s" : "6.5s");
      animMotion.setAttribute("repeatCount", "indefinite");
      animMotion.setAttribute("rotate", "auto");
      const mpath = document.createElementNS("http://www.w3.org/2000/svg", "mpath");
      mpath.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#${routeId}`);
      mpath.setAttribute("href", `#${routeId}`);
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
        const roadPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        roadPath.setAttribute("d", d);
        roadPath.setAttribute("fill", "none");
        roadPath.setAttribute("stroke", "#10b981");
        roadPath.setAttribute("stroke-width", "2.4");
        roadPath.setAttribute("stroke-dasharray", "5 4");
        roadPath.setAttribute("opacity", "0.85");
        routesLayer.appendChild(roadPath);
      });
    // Aktif Havalimanı Radar İşaretçilerini Çiz
    activeAirportCodes.forEach(iata => {
      const ap = window.AviationUtils.getAirport(iata);
      if (!ap) return;
      const [ax, ay] = window.TurkeyMapEngine.project(ap.lat, ap.lon);
      const isPrimary = iata === "SAW" || iata === "ASR";
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "cursor-pointer");
      g.addEventListener("click", () => selectProvince(ap.plate));
      if (isPrimary) {
        const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pulse.setAttribute("cx", ax);
        pulse.setAttribute("cy", ay);
        pulse.setAttribute("r", "6");
        pulse.setAttribute("fill", "none");
        pulse.setAttribute("stroke", iata === "SAW" ? "#38bdf8" : "#f59e0b");
        pulse.setAttribute("stroke-width", "2");
        pulse.setAttribute("class", "airport-pulse-ring");
        g.appendChild(pulse);
      }
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", ax);
      dot.setAttribute("cy", ay);
      dot.setAttribute("r", isPrimary ? "5.5" : "3.2");
      dot.setAttribute("fill", isPrimary ? "#ffffff" : "#10b981");
      dot.setAttribute("stroke", isPrimary ? "#0ea5e9" : "#052e16");
      dot.setAttribute("stroke-width", "2");
      g.appendChild(dot);
      if (isPrimary || mapMode === "radar") {
        const tag = document.createElementNS("http://www.w3.org/2000/svg", "text");
        tag.setAttribute("x", ax);
        tag.setAttribute("y", ay - 10);
        tag.setAttribute("text-anchor", "middle");
        tag.setAttribute("fill", isPrimary ? "#fde68a" : "#6ee7b7");
        tag.setAttribute("font-size", isPrimary ? "11" : "8.5");
        tag.setAttribute("font-family", "JetBrains Mono, monospace");
        tag.setAttribute("font-weight", "800");
        tag.setAttribute("stroke", "#020617");
        tag.setAttribute("stroke-width", "3");
        tag.setAttribute("paint-order", "stroke");
        tag.textContent = isPrimary ? `🛫 ${ap.iata} (${ap.city})` : ap.iata;
        g.appendChild(tag);
      }
      airportsLayer.appendChild(g);
    });
  }
  function focusFlightOnMap(flightIdOrAll) {
    selectedRouteFilter = flightIdOrAll;
    const sel = document.getElementById("routeFilterSelect");
    if (sel) sel.value = flightIdOrAll;
    renderMapRoutesAndAirports();
    updateHudMetrics(flightIdOrAll);
    if (mapMode === "leaflet") initOrUpdateLeafletMap();
  }
  function updateHudMetrics(flightIdOrAll) {
    if (flightIdOrAll === "all" || flightIdOrAll === "none") {
      document.getElementById("hudAircraft").textContent = "A321 & A321neo";
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
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap & CartoDB",
        maxZoom: 18
      }).addTo(leafletMap);
      leafletLayerGroup = L.layerGroup().addTo(leafletMap);
    }
    leafletLayerGroup.clearLayers();
    // Gezilen İlleri Pinle
    window.TURKEY_PROVINCES.forEach(p => {
      const st = state.provinceStatuses[p.plate];
      if (!st) return;
      const color = st === "home" ? "#0ea5e9" : st === "visited" ? "#10b981" : st === "passed" ? "#f59e0b" : "#a855f7";
      const marker = L.circleMarker([p.lat, p.lon], {
        radius: 8,
        fillColor: color,
        color: "#ffffff",
        weight: 2,
        fillOpacity: 0.9
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
          color: f.routeColor || "#f59e0b",
          weight: 3.5,
          dashArray: "8, 6"
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
      { key: "visited", label: "✅ Gezdim", activeCls: "bg-emerald-500 text-white border-emerald-400" },
      { key: "passed", label: "🚗 Geçtim", activeCls: "bg-amber-500 text-slate-950 border-amber-300" },
      { key: "wishlist", label: "💜 Hedefim", activeCls: "bg-purple-500 text-white border-purple-400" },
      { key: "home", label: "🏠 Merkez", activeCls: "bg-sky-500 text-white border-sky-400" },
      { key: "none", label: "⚪ Temizle", activeCls: "bg-slate-700 text-white border-slate-600" }
    ];
    container.innerHTML = `
      <!-- Kapak Görseli -->
      <div class="relative h-48 overflow-hidden">
        <img src="${prov.photo}" alt="${prov.name}" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent"></div>
        <div class="absolute top-3 left-3 flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur border border-slate-700 font-mono font-extrabold text-sm text-sky-400">
            ${prov.code}
          </span>
          <span class="px-2.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur border border-slate-700 text-xs font-semibold text-slate-200">
            ${prov.region} Bölgesi
          </span>
        </div>
        ${prov.airport ? `
          <div class="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-amber-500/90 text-slate-950 font-mono font-extrabold text-xs shadow">
            ✈️ ${prov.airport}
          </div>
        ` : ""}
        <div class="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <h3 class="text-2xl font-extrabold text-white drop-shadow">${prov.name}</h3>
            <p class="text-xs text-slate-300">Nüfus: ${prov.population} • Koordinat: ${prov.lat.toFixed(2)}°K, ${prov.lon.toFixed(2)}°D</p>
          </div>
        </div>
      </div>
      <!-- İçerik Gövdesi -->
      <div class="p-5 space-y-5">
        <!-- Ziyaret Durumu Değiştirici -->
        <div>
          <label class="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
            📍 Bu Şehirdeki Durumun (Tıkla & İşaretle)
          </label>
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            ${statusButtons
              .map(
                b => `
              <button onclick="window.App.setProvinceStatus(${prov.plate}, '${b.key}')"
                class="px-2 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                  status === b.key
                    ? b.activeCls + " shadow-lg"
                    : "bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                }">
                ${b.label}
              </button>
            `
              )
              .join("")}
          </div>
        </div>
        <!-- Şehir Özeti -->
        <p class="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
          ${prov.summary}
        </p>
        <!-- Gezilecek Yerler & Meşhur Lezzetler -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-2">🏛️ Gezilecek Yerler</h4>
            <div class="flex flex-wrap gap-1">
              ${prov.highlights
                .map(h => `<span class="px-2 py-0.5 rounded-lg bg-slate-800 text-[11px] text-slate-200">${h}</span>`)
                .join("")}
            </div>
          </div>
          <div class="bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2">🍽️ Meşhur Lezzetler</h4>
            <div class="flex flex-wrap gap-1">
              ${prov.foods
                .map(f => `<span class="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">${f}</span>`)
                .join("")}
            </div>
          </div>
        </div>
        <!-- Bu Şehre Ait Uçuşlarım & FlightRadar Rotalarım -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-400">
              🛫 ${prov.name} Uçuş & Seyahat Kayıtlarım (${cityFlights.length})
            </h4>
          </div>
          ${
            cityFlights.length === 0
              ? `<div class="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-2xl border border-slate-800/80">
                  Bu şehre henüz bir uçuş kaydı eklenmemiş. Üstteki <b>+ Seyahat / Uçuş Ekle</b> butonundan ekleyebilirsin.
                </div>`
              : cityFlights
                  .map(
                    f => `
                <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 transition space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      f.airlineTheme === "pegasus"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    }">
                      ${f.airline} • ${f.flightNumber}
                    </span>
                    <span class="text-[11px] text-slate-400 font-mono">${f.dateFormatted}</span>
                  </div>
                  <div class="flex items-center justify-between text-xs font-bold text-white">
                    <span>${f.fromIata} (${f.departureTime})</span>
                    <span class="text-sky-400 font-mono text-[11px]">── ✈️ ${f.aircraftName} ──►</span>
                    <span>${f.toIata} (${f.arrivalTime})</span>
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>Koltuk: <b class="text-amber-300 font-mono">${f.seat}</b> • Kapı: <b class="text-white font-mono">${f.gate}</b></span>
                    <div class="flex gap-1.5">
                      <button onclick="window.App.focusFlightOnMap('${f.id}')" class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 font-semibold">
                        Haritada Rota
                      </button>
                      <button onclick="window.App.openBoardingPassModal('${f.id}')" class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold">
                        Bilet & Foto
                      </button>
                    </div>
                  </div>
                </div>
              `
                  )
                  .join("")
          }
        </div>
        <!-- Kişisel Şehir Anılarım & Fotoğraf Ekleme -->
        <div class="space-y-2.5 pt-2 border-t border-slate-800">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300">📸 ${prov.name} Anılarım & Fotoğraflarım</h4>
          <textarea id="cityNoteTextarea" rows="2" placeholder="${prov.name} seyahatinle ilgili kişisel notların..."
            class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500">${memory.notes || ""}</textarea>
          <div class="flex items-center justify-between gap-2">
            <label class="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold transition inline-flex items-center gap-1.5">
              <span>🖼️ Fotoğraf Yükle</span>
              <input type="file" accept="image/*" class="hidden" onchange="window.App.handleCityPhotoUpload(event, ${prov.plate})" />
            </label>
            <button onclick="window.App.saveCityNote(${prov.plate})" class="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition">
              Notu Kaydet
            </button>
          </div>
          ${
            memory.photos && memory.photos.length > 0
              ? `<div class="grid grid-cols-2 gap-2 pt-1">
                  ${memory.photos
                    .map(
                      ph => `
                    <div class="relative group rounded-xl overflow-hidden border border-slate-800 h-24">
                      <img src="${ph.url}" class="w-full h-full object-cover" />
                      <div class="absolute bottom-0 inset-x-0 bg-slate-950/80 px-2 py-0.5 text-[10px] text-slate-300 truncate">
                        ${ph.caption || prov.name}
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>`
              : ""
          }
        </div>
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
      <div class="glass-card rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-slate-800">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              ${t.isRoundTrip ? "🔄 Gidiş - Dönüş Seyahat" : "➡️ Tek Yön Seyahat"}
            </span>
            <span class="text-xs font-mono text-slate-400">${t.dateDisplay || t.startDate}</span>
            <span class="text-xs text-sky-400 font-semibold">${t.transportLabel}</span>
          </div>
          <h4 class="text-lg font-extrabold text-white">${t.title}</h4>
          <p class="text-xs text-slate-300">${t.summary}</p>
          <div class="flex flex-wrap gap-1.5 pt-1">
            ${(t.tags || [])
              .map(tag => `<span class="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">${tag}</span>`)
              .join("")}
          </div>
        </div>
        <div class="flex flex-wrap lg:flex-col items-end justify-center gap-2 shrink-0">
          <div class="text-right">
            <div class="text-xl font-extrabold text-amber-400 font-mono">${t.distanceTotalKm} km</div>
            <div class="text-[11px] text-slate-400">Toplam Havada: ${window.AviationUtils.formatDuration(t.durationTotalMinutes)}</div>
          </div>
          <button onclick="window.App.switchTab('map'); window.App.focusFlightOnMap('all');"
            class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow transition">
            🗺️ Haritada Gidiş-Dönüş Rotasını Göster
          </button>
        </div>
      </div>
    `
      )
      .join("");
  }
  function buildBoardingPassCardHtml(f) {
    const isPegasus = f.airlineTheme === "pegasus" || f.airlineCode === "PC";
    const ac = window.AviationUtils.getAircraft(f.aircraftId);
    return `
      <div class="boarding-pass ${isPegasus ? "boarding-pass-pegasus" : "boarding-pass-ajet"} flex flex-col justify-between">
        <!-- Üst Şerit -->
        <div class="bp-header px-5 py-3.5 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-lg font-black tracking-tight">${isPegasus ? "PEGASUS AIRLINES" : "AJet"}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isPegasus ? "bg-slate-950/20 text-slate-950" : "bg-lime-400 text-slate-950"
            }">
              ${f.directionLabel}
            </span>
          </div>
          <div class="text-right font-mono">
            <span class="text-xs font-bold">UÇUŞ: ${f.flightNumber}</span>
          </div>
        </div>
        <!-- Orta Rota & Saat Bilgisi -->
        <div class="p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-3xl font-black text-white font-mono">${f.fromIata}</div>
              <div class="text-xs text-slate-300 font-semibold">${f.fromCity}</div>
              <div class="text-sm font-mono font-bold text-amber-400 mt-0.5">${f.departureTime}</div>
            </div>
            <div class="flex-1 px-4 text-center">
              <div class="text-[11px] font-mono text-sky-400 font-bold">${f.aircraftName}</div>
              <div class="relative flex items-center justify-center my-1.5">
                <div class="w-full border-t border-dashed border-slate-600"></div>
                <span class="px-2 bg-slate-900 text-base">✈️</span>
              </div>
              <div class="text-[10px] font-mono text-slate-400">${f.distanceKm} km • ${window.AviationUtils.formatDuration(f.durationMinutes)}</div>
            </div>
            <div class="text-right">
              <div class="text-3xl font-black text-white font-mono">${f.toIata}</div>
              <div class="text-xs text-slate-300 font-semibold">${f.toCity}</div>
              <div class="text-sm font-mono font-bold text-emerald-400 mt-0.5">${f.arrivalTime}</div>
            </div>
          </div>
          <!-- Biniş Kartı Detay Kutucukları (Koltuk 20A, Kapı 206, Biniş Saati, Bagaj) -->
          <div class="grid grid-cols-4 gap-2 bg-slate-950/65 p-3 rounded-2xl border border-slate-800/90 text-center">
            <div>
              <div class="text-[10px] text-slate-400 uppercase">Yolcu</div>
              <div class="text-xs font-extrabold text-white truncate">MELİH DURMAZ</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 uppercase">Koltuk</div>
              <div class="text-sm font-black text-amber-400 font-mono">${f.seat}</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 uppercase">Kapı / Biniş</div>
              <div class="text-xs font-extrabold text-lime-400 font-mono">${f.gate !== "-" ? `Kapı ${f.gate}` : f.departureTerminal} (${f.boardingTime})</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400 uppercase">Tarih</div>
              <div class="text-xs font-bold text-sky-300 font-mono">08.11.2026</div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 text-[11px] text-slate-300 font-mono bg-slate-900/50 px-3 py-2 rounded-xl">
            <div><span class="text-slate-500">BAGAJ:</span> ${f.baggage}</div>
            <div><span class="text-slate-500">BÖLGE/SEQ:</span> ${f.boardingZone} / ${f.sequenceNo}</div>
            <div><span class="text-slate-500">PNR:</span> ${f.maskedPnr}</div>
          </div>
          <div class="bp-tear-line"></div>
          <!-- Alt Aksiyon Butonları -->
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <button onclick="window.App.openBoardingPassModal('${f.id}')"
                class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition flex items-center gap-1.5 shadow">
                <span>📸</span>
                <span>Bilet Fotoğrafını & Detayı Gör</span>
              </button>
              <button onclick="window.App.openSeatMapModal('${f.aircraftId}', '${f.seat}', '${f.flightNumber}')"
                class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition">
                💺 20A Koltuk Şeması
              </button>
            </div>
            <button onclick="window.App.switchTab('map'); window.App.focusFlightOnMap('${f.id}');"
              class="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-bold transition">
              📡 Haritada Göster
            </button>
          </div>
        </div>
      </div>
    `;
  }
  function openBoardingPassModal(flightId) {
    const f = (state.flights || []).find(x => x.id === flightId) || state.flights[0];
    if (!f) return;
    const ac = window.AviationUtils.getAircraft(f.aircraftId);
    const modal = document.getElementById("ticketModal");
    const content = document.getElementById("ticketModalContent");
    content.innerHTML = `
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span class="text-xs font-mono uppercase text-amber-400 font-bold">${f.airline} • ${f.flightNumber} • ${f.dateFormatted}</span>
          <h3 class="text-xl font-extrabold text-white">${f.fromCity} (${f.fromIata}) ➔ ${f.toCity} (${f.toIata}) Biniş Kartı & Bilet Görseli</h3>
        </div>
        <button onclick="window.App.closeModal('ticketModal')" class="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold">✕</button>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Sol: Orijinal Bilet Görseli -->
        <div class="lg:col-span-6 bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-sky-400">📸 Yüklenen Orijinal Bilet / Biniş Kartı Görseli</span>
            <span class="text-[11px] text-slate-400 font-mono">${f.flightNumber}</span>
          </div>
          ${
            f.ticketImage
              ? `<div class="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex flex-col items-center justify-center max-h-[440px]">
                  <img src="${f.ticketImage}" alt="${f.flightNumber} Bilet" class="max-h-[420px] w-auto object-contain"
                    onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');" />
                  <div class="hidden p-6 text-center space-y-2">
                    <div class="text-3xl">🎫</div>
                    <div class="text-sm font-extrabold text-white">${f.airline} • ${f.flightNumber} Dijital Biniş Kartı</div>
                    <p class="text-xs text-slate-400">Gizlilik koruması nedeniyle kişisel bilet fotoğrafı yalnızca yerel cihazda görüntülenir (Maskeli PNR: <b class="text-amber-300 font-mono">${f.maskedPnr}</b>).</p>
                  </div>
                </div>`
              : `<div class="p-8 text-center text-slate-500 text-xs">Bu uçuş için bilet görseli yüklenmedi.</div>`
          }
        </div>
        <!-- Sağ: Uçuş Telemetri ve Uçak Özeti -->
        <div class="lg:col-span-6 space-y-4">
          <div class="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h4 class="text-sm font-extrabold text-white">✈️ Uçuş & Biniş Detayları</h4>
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-2.5 rounded-xl bg-slate-950"><span class="text-slate-500 block">Havayolu & Uçuş</span><b class="text-white font-mono">${f.airline} (${f.flightNumber})</b></div>
              <div class="p-2.5 rounded-xl bg-slate-950"><span class="text-slate-500 block">Tarih</span><b class="text-white">${f.dateFormatted}</b></div>
              <div class="p-2.5 rounded-xl bg-slate-950"><span class="text-slate-500 block">Kalkış</span><b class="text-amber-300 font-mono">${f.fromIata} - ${f.departureTime} (${f.departureTerminal})</b></div>
              <div class="p-2.5 rounded-xl bg-slate-950"><span class="text-slate-500 block">Varış</span><b class="text-emerald-300 font-mono">${f.toIata} - ${f.arrivalTime} (${f.arrivalTerminal})</b></div>
              <div class="p-2.5 rounded-xl bg-slate-950"><span class="text-slate-500 block">Koltuk Numarası</span><b class="text-amber-400 font-mono text-sm">${f.seat} (${f.seatType})</b></div>
              <div class="p-2.5 rounded-xl bg-slate-950"><span class="text-slate-500 block">Kapı / Biniş / Seq</span><b class="text-lime-400 font-mono">Kapı: ${f.gate} • Biniş: ${f.boardingTime} • Seq: ${f.sequenceNo}</b></div>
              <div class="p-2.5 rounded-xl bg-slate-950"><span class="text-slate-500 block">Bagaj Hakkı</span><b class="text-slate-200">${f.baggage}</b></div>
              <div class="p-2.5 rounded-xl bg-slate-950"><span class="text-slate-500 block">Mesafe & Süre</span><b class="text-sky-300 font-mono">${f.distanceKm} km • ${window.AviationUtils.formatDuration(f.durationMinutes)}</b></div>
            </div>
          </div>
          <!-- Uçak Teknik Kartı -->
          <div class="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-amber-400 uppercase">Bindiğin Uçak Modeli</span>
              <span class="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-xs font-bold">${ac.icao}</span>
            </div>
            <h5 class="text-base font-extrabold text-white">${ac.fullName}</h5>
            <p class="text-xs text-slate-300">${ac.description}</p>
            <div class="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
              <div class="bg-slate-950 p-2 rounded-lg"><span class="text-slate-500 block">MOTOR</span>${ac.engines.split("/")[0]}</div>
              <div class="bg-slate-950 p-2 rounded-lg"><span class="text-slate-500 block">SEYİR HIZI</span>${ac.cruiseSpeedKmh} km/s</div>
              <div class="bg-slate-950 p-2 rounded-lg"><span class="text-slate-500 block">KAPASİTE</span>${ac.maxPassengers} Yolcu</div>
            </div>
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
        <div class="glass-card rounded-3xl overflow-hidden flex flex-col justify-between border ${
          isFlown ? "border-amber-500/50 shadow-lg shadow-amber-500/10" : "border-slate-800"
        }">
          <div>
            <!-- Uçak Fotoğrafı -->
            <div class="relative h-48 overflow-hidden bg-slate-950">
              <img src="${ac.photoUrl}" alt="${ac.fullName}" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
              <div class="absolute top-3 left-3 flex items-center gap-1.5">
                <span class="px-2.5 py-1 rounded-xl bg-slate-950/85 text-xs font-mono font-bold text-white border border-slate-700">
                  ${ac.manufacturer} • ${ac.icao}
                </span>
                ${
                  isFlown
                    ? `<span class="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 text-xs font-extrabold shadow">
                        ⭐ Bindiğim Uçak (${myFlightsWithThis.length} Uçuş)
                      </span>`
                    : ""
                }
              </div>
              <div class="absolute bottom-3 left-4 right-4">
                <span class="text-[11px] text-sky-400 font-semibold">${ac.category}</span>
                <h3 class="text-xl font-extrabold text-white">${ac.fullName}</h3>
              </div>
            </div>
            <!-- Teknik Özellikler -->
            <div class="p-5 space-y-4">
              <p class="text-xs text-slate-300 leading-relaxed">${ac.description}</p>
              <div class="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                <div><span class="text-slate-500 block text-[10px]">MOTOR</span><span class="text-slate-200">${ac.engines.split("/")[0]}</span></div>
                <div><span class="text-slate-500 block text-[10px]">SEYİR HIZI</span><span class="text-sky-300">${ac.cruiseSpeedKmh} km/s (${ac.mach})</span></div>
                <div><span class="text-slate-500 block text-[10px]">MAKS. MENZİL</span><span class="text-emerald-300">${ac.rangeKm.toLocaleString()} km</span></div>
                <div><span class="text-slate-500 block text-[10px]">KAPASİTE / DÜZEN</span><span class="text-amber-300">${ac.maxPassengers} Yolcu (${ac.seatLayout.split(" ")[0]})</span></div>
                <div><span class="text-slate-500 block text-[10px]">KANAT / UZUNLUK</span><span class="text-slate-200">${ac.wingspan.split(" ")[0]}m / ${ac.length}</span></div>
                <div><span class="text-slate-500 block text-[10px]">İLK UÇUŞ & TAVAN</span><span class="text-slate-200">${ac.firstFlight} • ${ac.ceilingFt}</span></div>
              </div>
              ${
                myFlightsWithThis.length > 0
                  ? `<div class="space-y-1.5 bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl">
                      <div class="text-[11px] font-bold text-amber-300 uppercase">🎫 Bu Uçakla Yaptığım Uçuşlar:</div>
                      ${myFlightsWithThis
                        .map(
                          fl => `
                        <div class="flex items-center justify-between text-xs text-white font-mono">
                          <span>${fl.airline} <b>${fl.flightNumber}</b> (${fl.fromIata}→${fl.toIata})</span>
                          <span class="text-amber-300 font-bold">Koltuk ${fl.seat}</span>
                        </div>
                      `
                        )
                        .join("")}
                    </div>`
                  : ""
              }
            </div>
          </div>
          <div class="px-5 pb-5 pt-1 flex items-center justify-between gap-2">
            <button onclick="window.App.openSeatMapModal('${ac.id}', '20A', '${myFlightsWithThis[0]?.flightNumber || ac.model}')"
              class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5">
              <span>💺</span>
              <span>Kabin & Koltuk Haritasını Aç (20A Cam Kenarı)</span>
            </button>
          </div>
        </div>
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
    content.innerHTML = `
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span class="text-xs font-mono text-sky-400 font-bold">${ac.fullName} • ${ac.seatLayout}</span>
          <h3 class="text-lg font-extrabold text-white">✈️ Kabin İçi Koltuk Yerleşimi & <span class="text-amber-400">${highlightSeat}</span> Koltuk Konumu</h3>
        </div>
        <button onclick="window.App.closeModal('seatMapModal')" class="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-white">✕</button>
      </div>
      <p class="text-xs text-slate-300">
        <b>${highlightSeat}</b> koltuğu uçağın sol tarafında (iskele), kanat firar kenarının (arka kısmının) hemen arkasında yer alan <b>Cam Kenarı (Window)</b> koltuktur. Hem motor/kanat flap hareketlerini hem de aşağıda uzanan Anadolu coğrafyasını izlemek için en ideal noktalardan biridir.
      </p>
      <!-- Gövde Şeması -->
      <div class="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col items-center space-y-2 overflow-x-auto">
        <div class="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">▲ KOKPİT & ÖN KAPI (BURUN) ▲</div>
        ${rowsToRender
          .map(r => {
            const isWing = r >= 11 && r <= 19;
            return `
            <div class="flex items-center gap-3">
              <span class="w-16 text-right text-[10px] font-mono ${isWing ? "text-sky-400 font-bold" : "text-slate-600"}">
                ${isWing ? "◄ KANAT" : ""}
              </span>
              <div class="flex items-center gap-1.5">
                ${seatLetters
                  .slice(0, 3)
                  .map(L => {
                    const code = `${r}${L}`;
                    const isMelih = code === highlightSeat;
                    return `<div class="seat-cell ${isMelih ? "seat-melih" : ""}" title="Koltuk ${code}">${code}</div>`;
                  })
                  .join("")}
                <span class="w-7 text-center text-[10px] font-mono text-slate-500">${r}</span>
                ${seatLetters
                  .slice(3, 6)
                  .map(L => {
                    const code = `${r}${L}`;
                    const isMelih = code === highlightSeat;
                    return `<div class="seat-cell ${isMelih ? "seat-melih" : ""}" title="Koltuk ${code}">${code}</div>`;
                  })
                  .join("")}
              </div>
              <span class="w-16 text-left text-[10px] font-mono ${isWing ? "text-sky-400 font-bold" : "text-slate-600"}">
                ${isWing ? "KANAT ►" : ""}
              </span>
            </div>
          `;
          })
          .join("")}
        <div class="text-xs font-mono text-slate-400 uppercase tracking-widest mt-2">▼ KUYRUK & ARKA GALLEY ▼</div>
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
    box.innerHTML = `<div class="text-xs font-mono text-sky-400">📡 ${reg} kuyruk tescili sorgulanıyor...</div>`;
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
    if (!localInfo && !apiPhotoUrl) {
      box.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="text-xs text-amber-300">
            <b>${reg}</b> için yerel veritabanında kayıt bulunamadı. Örnek tesciller: <b>TC-LAJ</b>, <b>TC-RBC</b>, <b>TC-RBA</b>, <b>TC-JRO</b>, <b>TC-JJN</b>.
          </div>
          <button onclick="document.getElementById('tailLookupResultBox').classList.add('hidden')" class="text-xs text-slate-400">✕</button>
        </div>
      `;
      return;
    }
    const fallbackAc = localInfo ? window.AviationUtils.getAircraft(localInfo.aircraftId) : window.AIRCRAFT_CATALOG[1];
    box.innerHTML = `
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <img src="${apiPhotoUrl || fallbackAc.photoUrl}" alt="${reg}" class="w-36 h-24 object-cover rounded-2xl border border-slate-700" />
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-lg bg-sky-500 text-white font-mono font-extrabold text-xs">${reg}</span>
              <span class="text-xs font-bold text-amber-400">${localInfo ? localInfo.airline : "Türk Sivil Havacılık Tescili"}</span>
            </div>
            <h4 class="text-base font-extrabold text-white">${localInfo ? localInfo.type : fallbackAc.fullName}</h4>
            <p class="text-xs text-slate-300">${localInfo ? localInfo.note : "Planespotters açık havacılık verisi."}</p>
            <div class="text-[11px] font-mono text-slate-400">
              ${localInfo ? `MSN: ${localInfo.msn} • Teslim: ${localInfo.delivered} • Motor: ${localInfo.engines} • Merkez: ${localInfo.base}` : ""}
              ${apiPhotographer ? ` • Fotoğraf: © ${apiPhotographer} (Planespotters.net)` : ""}
            </div>
          </div>
        </div>
        <button onclick="document.getElementById('tailLookupResultBox').classList.add('hidden')" class="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white">Kapat</button>
      </div>
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
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Sol: Melih Kimlik Kartı -->
        <div class="lg:col-span-4 glass-panel rounded-3xl p-6 space-y-5">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-2xl font-black text-white shadow-lg">
              MD
            </div>
            <div>
              <h3 class="text-xl font-extrabold text-white">${state.profile.name}</h3>
              <p class="text-xs font-mono text-sky-400">${state.profile.handle} • ${state.profile.title}</p>
              <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold">
                🏠 Merkez: 34 İstanbul (SAW / IST)
              </span>
            </div>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">${state.profile.bio}</p>
          <div class="space-y-2 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs">
            <div class="flex justify-between"><span class="text-slate-400">Favori Koltuk:</span><b class="text-amber-400 font-mono">${state.profile.favoriteSeat}</b></div>
            <div class="flex justify-between"><span class="text-slate-400">Favori Uçak Ailesi:</span><b class="text-sky-400">${state.profile.favoriteAircraft}</b></div>
            <div class="flex justify-between"><span class="text-slate-400">Uçulan Havayolları:</span><b class="text-white">Pegasus (PC), AJet (VF)</b></div>
            <div class="flex justify-between"><span class="text-slate-400">Uçulan Havalimanları:</span><b class="text-emerald-400 font-mono">SAW, ASR</b></div>
          </div>
          <div class="flex flex-wrap gap-2 pt-2">
            <button onclick="window.App.exportJsonData()" class="flex-1 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-bold transition">
              💾 JSON Yedek İndir
            </button>
            <button onclick="window.App.resetToDefault()" class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 text-xs font-semibold transition">
              Sıfırla
            </button>
          </div>
        </div>
        <!-- Sağ: 7 Coğrafi Bölge İlerleme Durumu -->
        <div class="lg:col-span-8 glass-panel rounded-3xl p-6 space-y-4">
          <h3 class="text-lg font-extrabold text-white">📊 Türkiye 7 Coğrafi Bölge Keşif İlerlemesi</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            ${regionStats
              .map(
                r => `
              <div class="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-white">${r.region} Bölgesi</span>
                  <span class="font-mono text-emerald-400 font-bold">${r.visited} / ${r.total} İl (%${r.pct})</span>
                </div>
                <div class="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-500" style="width: ${Math.max(r.pct, 4)}%"></div>
                </div>
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
      chipsContainer.innerHTML = `<span class="text-slate-400">Komşu veya doğrudan bağlantılı şehirler (ara geçiş ili yok).</span>`;
      return;
    }
    chipsContainer.innerHTML = `
      <span class="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 font-bold">${fromP?.name || ""}</span>
      <span class="text-slate-500">➔</span>
      ${transitProvs
        .map(
          tp => `<span class="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold">🚗 ${tp.code} ${tp.name}</span>`
        )
        .join('<span class="text-slate-500">➔</span>')}
      <span class="text-slate-500">➔</span>
      <span class="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">${toP?.name || ""}</span>
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
      statusBox.textContent = `🤖 "${file.name}" bilet görseli analiz ediliyor...`;
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
    applyParsedTicketToForm(parsed, "⚡ Örnek bilet (TK2026 • IST → AYT • Airbus A321neo • Koltuk 14A • Kapı 208) otomatik çözümlendi!");
  }
  function parseManualTicketText() {
    const raw = document.getElementById("ocrRawTextInput")?.value || "";
    if (!raw.trim()) {
      runSampleTicketScan();
      return;
    }
    const parsed = window.SmartTicketScanner.parseTicketText(raw);
    applyParsedTicketToForm(parsed, `✅ Bilet metni çözümlendi: ${parsed.airline} ${parsed.flightNo} • Koltuk ${parsed.seat}`);
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
      transportLabel: transportType === "plane" ? "✈️ Uçak" : transportType === "car" ? `🚗 Özel Araba (${transitPlates.length} Geçiş İli)` : transportType === "bus" ? "🚌 Otobüs" : "🚆 Tren",
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
  }
  function renderPassportCanvas() {
    const canvas = document.getElementById("passportCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    // 1. Arka Plan Gradyanı
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#040914");
    bgGrad.addColorStop(0.5, "#0b172a");
    bgGrad.addColorStop(1, "#061220");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Dekoratif Çerçeve
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, W - 72, H - 72);
    // 2. Üst Başlık & Melih Profili
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 24px Inter, sans-serif";
    ctx.fillText("ROTAM TÜRKİYE • SEYAHAT & HAVACILIK PASAPORTU", 76, 105);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 54px Inter, sans-serif";
    ctx.fillText(state.profile.name.toUpperCase(), 76, 175);
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 26px JetBrains Mono, monospace";
    ctx.fillText(`${state.profile.handle} • Favori Koltuk: 20A (Cam Kenarı)`, 76, 218);
    // 3. 4 Ana İstatistik Kutusu
    const statuses = state.provinceStatuses || {};
    const visitedCount = Object.keys(statuses).filter(k => statuses[k] === "visited" || statuses[k] === "home").length;
    const passedCount = Object.keys(statuses).filter(k => statuses[k] === "passed").length;
    const flights = state.flights || [];
    const totalKm = flights.reduce((a, f) => a + (Number(f.distanceKm) || 0), 0);
    const uniqueModels = [...new Set(flights.map(f => f.aircraftName))].join(" • ");
    const stats = [
      { label: "KEŞFEDİLEN İLLER", val: `${visitedCount} / 81 İl`, sub: passedCount ? `+${passedCount} Geçiş İli` : "34 İstanbul & 38 Kayseri", color: "#10b981" },
      { label: "TOPLAM UÇUŞ", val: `${flights.length} Uçuş`, sub: "SAW ⇄ ASR (Gidiş-Dönüş)", color: "#f59e0b" },
      { label: "UÇUŞ MESAFESİ", val: `${totalKm.toLocaleString("tr-TR")} km`, sub: "Havada: 2 sa 50 dk", color: "#38bdf8" },
      { label: "UÇAK HANGARIM", val: "2 Model", sub: "Airbus A321 & A321neo", color: "#a855f7" }
    ];
    stats.forEach((st, idx) => {
      const bx = 76 + (idx % 2) * 474;
      const by = 260 + Math.floor(idx / 2) * 165;
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, 454, 145, 22);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.fillText(st.label, bx + 28, by + 42);
      ctx.fillStyle = st.color;
      ctx.font = "800 42px JetBrains Mono, monospace";
      ctx.fillText(st.val, bx + 28, by + 95);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 18px Inter, sans-serif";
      ctx.fillText(st.sub, bx + 28, by + 125);
    });
    // 4. Mini Türkiye Haritası & SAW ⇄ ASR Rota Çizimi
    const mapBoxY = 610;
    const mapBoxH = 380;
    ctx.fillStyle = "#050d1a";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
    ctx.beginPath();
    ctx.roundRect(76, mapBoxY, W - 152, mapBoxH, 26);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.translate(76, mapBoxY + 10);
    const scaleX = (W - 152) / 1200;
    const scaleY = (mapBoxH - 20) / 560;
    ctx.scale(scaleX, scaleY);
    window.TURKEY_PROVINCES.forEach(p => {
      const [px, py] = window.TurkeyMapEngine.project(p.lat, p.lon);
      const st = statuses[p.plate];
      ctx.beginPath();
      ctx.arc(px, py, st ? 14 : 7, 0, Math.PI * 2);
      ctx.fillStyle = st === "home" ? "#0ea5e9" : st === "visited" ? "#10b981" : st === "passed" ? "#f59e0b" : "#1e293b";
      ctx.fill();
    });
    // SAW ⇄ ASR Yayları
    const saw = window.AviationUtils.getAirport("SAW");
    const asr = window.AviationUtils.getAirport("ASR");
    if (saw && asr) {
      const [x1, y1] = window.TurkeyMapEngine.project(saw.lat, saw.lon);
      const [x2, y2] = window.TurkeyMapEngine.project(asr.lat, asr.lon);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 55, x2, y2);
      ctx.stroke();
      ctx.strokeStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + 55, x1, y1);
      ctx.stroke();
    }
    ctx.restore();
    // 5. Alt Biniş Kartı Özetleri (PC2730 & VF3181)
    flights.slice(0, 2).forEach((f, i) => {
      const fy = 1020 + i * 115;
      ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
      ctx.strokeStyle = i === 0 ? "#f59e0b" : "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(76, fy, W - 152, 96, 18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = i === 0 ? "#f59e0b" : "#38bdf8";
      ctx.font = "bold 24px JetBrains Mono, monospace";
      ctx.fillText(`${f.airline.toUpperCase()} • ${f.flightNumber}`, 104, fy + 40);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px Inter, sans-serif";
      ctx.fillText(`${f.fromIata} (${f.departureTime}) ➔ ${f.toIata} (${f.arrivalTime}) • ${f.aircraftName} • Koltuk ${f.seat}`, 104, fy + 76);
    });
    ctx.fillStyle = "#64748b";
    ctx.font = "600 18px JetBrains Mono, monospace";
    ctx.fillText("Rotam Türkiye • Melih'in Kişisel Seyahat & FlightRadar Arşivi", 76, H - 55);
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
        "📲 Rotam Türkiye PWA Kurulumu:\n\n" +
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
