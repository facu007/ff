/**
 * EXPRESO 38 SRL — Interactividad UI Responsive, Mapa Geográfico Mercosur, Flota Real, Galería & Cotizador B2B
 */
document.addEventListener('DOMContentLoaded', () => {
  const supportsHover = () => window.matchMedia('(hover: hover)').matches;

  // =========================================================================
  // 1. PANEL OPERATIVO LATERAL (SIDE DRAWER)
  // =========================================================================
  const drawerToggle = document.getElementById('drawerToggle');
  const drawerClose = document.getElementById('drawerClose');
  const sideDrawer = document.getElementById('sideDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');

  function openDrawer() {
    if (!sideDrawer || !drawerBackdrop) return;
    sideDrawer.classList.remove('translate-x-full');
    drawerBackdrop.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  function closeDrawer() {
    if (!sideDrawer || !drawerBackdrop) return;
    sideDrawer.classList.add('translate-x-full');
    drawerBackdrop.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  if (drawerToggle) drawerToggle.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

  if (sideDrawer) {
    sideDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeDrawer);
    });
  }

  // =========================================================================
  // 2. NAVEGACIÓN ACTIVA POR SCROLL (DESKTOP NAVBAR)
  // =========================================================================
  const sections = document.querySelectorAll('section[id]');
  const desktopNavLinks = document.querySelectorAll('header nav a[href^="#"]');

  function setActiveNav(id) {
    desktopNavLinks.forEach((link) => {
      const isMatch = link.getAttribute('href') === `#${id}`;
      if (isMatch) {
        link.className =
          'text-primary dark:text-primary border-b-2 border-primary-container dark:border-primary pb-1 text-label-lg font-label-lg whitespace-nowrap transition-colors duration-200';
      } else {
        link.className =
          'text-on-surface-variant dark:text-on-surface-variant font-label-lg text-label-lg hover:text-primary dark:hover:text-primary whitespace-nowrap transition-colors duration-200';
      }
    });
  }

  if ('IntersectionObserver' in window && sections.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.id);
          }
        });
      },
      { rootMargin: '-28% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((sec) => observer.observe(sec));
  }

  // =========================================================================
  // 3. SELECTOR INTERACTIVO DE FLOTA REAL VOLVO FH (#flota)
  // =========================================================================
  const fleetShowcaseCard = document.getElementById('fleetShowcaseCard');
  const fleetShowcaseImg = document.getElementById('fleetShowcaseImg');
  const fleetShowcaseBadges = document.querySelectorAll('[data-fleet-badge-display]');
  const fleetShowcaseTitles = document.querySelectorAll('[data-fleet-title-display]');
  const fleetShowcaseDescs = document.querySelectorAll('[data-fleet-desc-display]');
  const fleetThumbs = document.querySelectorAll('[data-fleet-thumb]');
  const configCards = document.querySelectorAll('[data-fleet-config]');
  const notesField = document.getElementById('notes');

  function updateFleetShowcase(data) {
    if (!fleetShowcaseImg || !data) return;
    if (data.src) {
      fleetShowcaseImg.src = data.src;
      fleetShowcaseImg.alt = data.title || 'Unidad Volvo FH Expreso 38 SRL';
    }
    if (data.badge) {
      fleetShowcaseBadges.forEach((el) => {
        el.textContent = data.badge;
      });
    }
    if (data.title) {
      fleetShowcaseTitles.forEach((el) => {
        el.textContent = data.title;
      });
    }
    if (data.desc) {
      fleetShowcaseDescs.forEach((el) => {
        el.textContent = data.desc;
      });
    }

    fleetThumbs.forEach((btn) => {
      const isActive = btn.dataset.src === data.src;
      btn.classList.toggle('ring-2', isActive);
      btn.classList.toggle('ring-primary-container', isActive);
      btn.classList.toggle('opacity-100', isActive);
      btn.classList.toggle('opacity-65', !isActive);
    });
  }

  fleetThumbs.forEach((btn) => {
    btn.addEventListener('click', () => {
      updateFleetShowcase({
        src: btn.dataset.src,
        badge: btn.dataset.badge,
        title: btn.dataset.title,
        desc: btn.dataset.desc
      });
    });
  });

  configCards.forEach((card) => {
    card.addEventListener('click', () => {
      const configName = card.dataset.fleetConfig;
      configCards.forEach((c) => c.classList.remove('border-primary-container', 'bg-surface-container'));
      card.classList.add('border-primary-container', 'bg-surface-container');

      if (card.dataset.src) {
        updateFleetShowcase({
          src: card.dataset.src,
          badge: card.dataset.badge,
          title: card.dataset.title,
          desc: card.dataset.desc
        });
      }

      // En pantallas móviles/tablets desplazamos suavemente hacia el visor principal para mostrar el cambio
      if (fleetShowcaseCard && window.innerWidth < 1024) {
        const rect = fleetShowcaseCard.getBoundingClientRect();
        if (rect.top < 60) {
          fleetShowcaseCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      if (notesField && configName) {
        const prefix = `Unidad requerida: ${configName}. `;
        if (!notesField.value.includes(configName)) {
          notesField.value = prefix + notesField.value;
        }
      }
    });
  });

  // =========================================================================
  // 4. MAPA GEOGRÁFICO INTERACTIVO ARGENTINA & CORREDORES MERCOSUR
  // =========================================================================
  const CORRIDOR_META = {
    '1': {
      title: '1. Corredor Industrial Centro',
      routes: 'RN 9 · Autopista Bs. As. – Rosario – Córdoba',
      distance: '705 km',
      sla: 'Tránsito 24 hs · Salidas diarias',
      hubs: 'AMBA / Zárate ⇄ Rosario ⇄ Córdoba Capital',
      originProv: 'Buenos Aires',
      originCity: 'Buenos Aires / Zárate',
      destCountry: 'ARG_CBA',
      destCity: 'Córdoba / Rosario'
    },
    '2': {
      title: '2. Corredor Bioceánico Cuyo & Chile',
      routes: 'RN 7 · Paso Internacional Cristo Redentor (CH-60)',
      distance: '1.420 km',
      sla: '48 a 72 hs · Gestión MIC/DTA',
      hubs: 'Bs. As. / Córdoba ⇄ Mendoza ⇄ Santiago / Valparaíso',
      originProv: 'Buenos Aires',
      originCity: 'Buenos Aires',
      destCountry: 'CHL',
      destCity: 'Santiago de Chile'
    },
    '3': {
      title: '3. Corredor Mercosur Este (Brasil & Uruguay)',
      routes: 'RN 12 · RN 14 · RN 136 · BR-290',
      distance: '1.280 km',
      sla: '48 a 72 hs · Aduana Integrada',
      hubs: 'AMBA / Rosario ⇄ Colón / Montevideo & Paso de los Libres / Brasil',
      originProv: 'Buenos Aires',
      originCity: 'Buenos Aires',
      destCountry: 'BRA',
      destCity: 'Uruguaiana / Porto Alegre'
    },
    '4': {
      title: '4. Corredor Norte NOA & NEA (Bolivia / Paraguay)',
      routes: 'RN 9 · RN 34 · RN 11',
      distance: '1.650 km',
      sla: '48 a 72 hs · Frontera Norte',
      hubs: 'Córdoba / Rosario ⇄ Tucumán / Salta ⇄ Yacuiba (BOL) & Asunción (PRY)',
      originProv: 'Córdoba',
      originCity: 'Córdoba',
      destCountry: 'BOL',
      destCity: 'Yacuiba / Santa Cruz'
    },
    '5': {
      title: '5. Corredor Atlántico, Patagonia & Tierra del Fuego',
      routes: 'RN 3 Troncal · Bs. As. – Bahía Blanca – Puerto Madryn – Ushuaia / Río Grande',
      distance: '2.980 km',
      sla: 'Frecuencia continua · +7 años de ruta a Tierra del Fuego',
      hubs: 'Bs. As. ⇄ Bahía Blanca (Galpón 750 m²) ⇄ Puerto Madryn ⇄ Comodoro ⇄ Río Gallegos ⇄ Río Grande / Ushuaia',
      originProv: 'Buenos Aires',
      originCity: 'Bahía Blanca',
      destCountry: 'ARG_PAT',
      destCity: 'Ushuaia / Río Grande / Puerto Madryn'
    },
    '6': {
      title: '6. Corredor Norpatagónico, Vaca Muerta & Cordillera',
      routes: 'RN 22 · RN 237 · RN 40 Andina',
      distance: '1.120 km',
      sla: '24 a 48 hs · Operación todo clima',
      hubs: 'Bahía Blanca / Puerto Madryn ⇄ Alto Valle / Neuquén ⇄ Cordillera Sur',
      originProv: 'Neuquén',
      originCity: 'Neuquén / Añelo',
      destCountry: 'ARG_PAT',
      destCity: 'Cordillera / Chubut'
    }
  };

  const mapCanvasCard = document.getElementById('mapCanvasCard');
  const corridorCards = document.querySelectorAll('[data-corridor-card]');
  const corridorGroups = document.querySelectorAll('[data-corridor-group]');
  const mapNodes = document.querySelectorAll('[data-node-corridors]');
  const mapResetBtn = document.getElementById('mapResetBtn');
  const mapQuoteBtn = document.getElementById('mapQuoteBtn');
  const hudTitle = document.getElementById('mapHudTitle');
  const hudRoutes = document.getElementById('mapHudRoutes');
  const hudDistance = document.getElementById('mapHudDistance');
  const hudSla = document.getElementById('mapHudSla');
  const hudHubs = document.getElementById('mapHudHubs');

  let lockedCorridorId = null;

  function renderHud(corridorId) {
    if (!hudTitle) return;
    if (!corridorId || !CORRIDOR_META[corridorId]) {
      hudTitle.textContent = 'Red Troncal Integrada — 6 Corredores Activos';
      if (hudRoutes) hudRoutes.textContent = 'RN 3 · RN 7 · RN 9 · RN 14 · RN 22 · RN 34 · RN 40';
      if (hudDistance) hudDistance.textContent = '+8.700 km';
      if (hudSla) hudSla.textContent = 'Monitoreo GPS 24/7';
      if (hudHubs)
        hudHubs.textContent =
          'Toque o seleccione una ruta en el mapa o en el listado para inspeccionar tiempos, pasos aduaneros y cotizar.';
      if (mapResetBtn) mapResetBtn.classList.add('hidden');
      return;
    }

    const meta = CORRIDOR_META[corridorId];
    hudTitle.textContent = meta.title;
    if (hudRoutes) hudRoutes.textContent = meta.routes;
    if (hudDistance) hudDistance.textContent = meta.distance;
    if (hudSla) hudSla.textContent = meta.sla;
    if (hudHubs) hudHubs.textContent = meta.hubs;
    if (mapResetBtn) mapResetBtn.classList.toggle('hidden', !lockedCorridorId);
  }

  function applyCorridorState(corridorId) {
    corridorGroups.forEach((group) => {
      if (!corridorId) {
        group.classList.remove('is-highlighted', 'is-dimmed');
      } else if (group.dataset.corridorGroup === corridorId) {
        group.classList.add('is-highlighted');
        group.classList.remove('is-dimmed');
      } else {
        group.classList.remove('is-highlighted');
        group.classList.add('is-dimmed');
      }
    });

    mapNodes.forEach((node) => {
      if (!corridorId) {
        node.classList.remove('is-dimmed');
      } else {
        const list = (node.dataset.nodeCorridors || '').split(',');
        node.classList.toggle('is-dimmed', !list.includes(corridorId));
      }
    });

    corridorCards.forEach((card) => {
      const isSelected = card.dataset.corridorCard === corridorId;
      if (!corridorId) {
        card.classList.remove('bg-surface-container-high');
        if (card.dataset.corridorCard === '5') {
          card.classList.add('border-l-primary-container');
          card.classList.remove('border-l-surface-container-highest');
        } else {
          card.classList.remove('border-l-primary-container');
          card.classList.add('border-l-surface-container-highest');
        }
      } else if (isSelected) {
        card.classList.remove('border-l-surface-container-highest');
        card.classList.add('border-l-primary-container', 'bg-surface-container-high');
      } else {
        card.classList.remove('bg-surface-container-high', 'border-l-primary-container');
        card.classList.add('border-l-surface-container-highest');
      }
    });

    renderHud(corridorId);
  }

  corridorCards.forEach((card) => {
    const id = card.dataset.corridorCard;
    card.addEventListener('mouseenter', () => {
      if (supportsHover() && !lockedCorridorId) applyCorridorState(id);
    });
    card.addEventListener('mouseleave', () => {
      if (supportsHover() && !lockedCorridorId) applyCorridorState(null);
    });
    card.addEventListener('click', () => {
      lockedCorridorId = lockedCorridorId === id ? null : id;
      applyCorridorState(lockedCorridorId);
      if (lockedCorridorId && mapCanvasCard && window.innerWidth < 1024) {
        const rect = mapCanvasCard.getBoundingClientRect();
        if (rect.bottom < 180) {
          mapCanvasCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  corridorGroups.forEach((group) => {
    const id = group.dataset.corridorGroup;
    group.addEventListener('mouseenter', () => {
      if (supportsHover() && !lockedCorridorId) applyCorridorState(id);
    });
    group.addEventListener('mouseleave', () => {
      if (supportsHover() && !lockedCorridorId) applyCorridorState(null);
    });
    group.addEventListener('click', () => {
      lockedCorridorId = lockedCorridorId === id ? null : id;
      applyCorridorState(lockedCorridorId);
    });
  });

  mapNodes.forEach((node) => {
    const primaryCorridor = (node.dataset.nodeCorridors || '').split(',')[0];
    if (!primaryCorridor) return;
    node.addEventListener('mouseenter', () => {
      if (supportsHover() && !lockedCorridorId) applyCorridorState(primaryCorridor);
    });
    node.addEventListener('mouseleave', () => {
      if (supportsHover() && !lockedCorridorId) applyCorridorState(null);
    });
    node.addEventListener('click', () => {
      lockedCorridorId = lockedCorridorId === primaryCorridor ? null : primaryCorridor;
      applyCorridorState(lockedCorridorId);
    });
  });

  if (mapResetBtn) {
    mapResetBtn.addEventListener('click', () => {
      lockedCorridorId = null;
      applyCorridorState(null);
    });
  }

  if (mapQuoteBtn) {
    mapQuoteBtn.addEventListener('click', () => {
      const activeId = lockedCorridorId || '5';
      const meta = CORRIDOR_META[activeId];
      if (meta) {
        const originProvEl = document.getElementById('originProv');
        const originCityEl = document.getElementById('originCity');
        const destCountryEl = document.getElementById('destinationCountry');
        const destCityEl = document.getElementById('destinationCity');
        if (originProvEl) originProvEl.value = meta.originProv;
        if (originCityEl) originCityEl.value = meta.originCity;
        if (destCountryEl) destCountryEl.value = meta.destCountry;
        if (destCityEl) destCityEl.value = meta.destCity;
        if (notesField && !notesField.value.includes(meta.title)) {
          notesField.value = `Corredor consultado: ${meta.title} (${meta.routes}). ` + notesField.value;
        }
      }
      const cotizador = document.getElementById('cotizador');
      if (cotizador) cotizador.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // =========================================================================
  // 5. GALERÍA MULTIMEDIA INSTAGRAM (#galeria), FILTROS, AUDIO & LIGHTBOX
  // =========================================================================
  const filterBtns = document.querySelectorAll('[data-gallery-filter]');
  const galleryItems = document.querySelectorAll('.gallery-item[data-category]');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.galleryFilter;
      filterBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      galleryItems.forEach((item) => {
        const cats = (item.dataset.category || '').split(' ');
        const show = filter === 'all' || cats.includes(filter);
        item.classList.toggle('is-hidden', !show);
      });
    });
  });

  // Controles rápidos de audio y reproducción para videos inline (soporta múltiples botones responsive por tarjeta)
  document.querySelectorAll('[data-video-card]').forEach((card) => {
    const video = card.querySelector('video');
    const muteBtns = card.querySelectorAll('[data-toggle-mute]');
    const playBtns = card.querySelectorAll('[data-toggle-play]');
    if (!video) return;

    muteBtns.forEach((muteBtn) => {
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
        muteBtns.forEach((b) => {
          const icon = b.querySelector('.material-symbols-outlined');
          if (icon) icon.textContent = video.muted ? 'volume_off' : 'volume_up';
        });
      });
    });

    playBtns.forEach((playBtn) => {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      });
    });

    video.addEventListener('play', () => {
      playBtns.forEach((b) => {
        const icon = b.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'pause';
      });
    });

    video.addEventListener('pause', () => {
      playBtns.forEach((b) => {
        const icon = b.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'play_arrow';
      });
    });
  });

  // Lightbox Modal Pantalla Completa con Soporte Táctil Swipe (Fotos + Videos)
  const lightbox = document.getElementById('mediaLightbox');
  const lightboxImg = document.getElementById('lightboxImage');
  const lightboxVideo = document.getElementById('lightboxVideo');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxBadge = document.getElementById('lightboxBadge');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrevs = document.querySelectorAll('[data-lightbox-prev]');
  const lightboxNexts = document.querySelectorAll('[data-lightbox-next]');

  const lightboxTriggers = Array.from(document.querySelectorAll('[data-lightbox-src]'));
  let currentMediaIndex = 0;

  function renderLightboxItem(index) {
    if (!lightbox || lightboxTriggers.length === 0) return;
    currentMediaIndex = (index + lightboxTriggers.length) % lightboxTriggers.length;
    const trigger = lightboxTriggers[currentMediaIndex];
    const src = trigger.dataset.lightboxSrc;
    const type = trigger.dataset.lightboxType || 'image';
    const title = trigger.dataset.lightboxTitle || 'Expreso 38 SRL';
    const badge = trigger.dataset.lightboxBadge || '@expreso_38_srl';

    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxBadge) lightboxBadge.textContent = badge;
    if (lightboxCounter)
      lightboxCounter.textContent = `${currentMediaIndex + 1} / ${lightboxTriggers.length}`;

    if (type === 'video') {
      if (lightboxImg) {
        lightboxImg.classList.add('hidden');
        lightboxImg.src = '';
      }
      if (lightboxVideo) {
        lightboxVideo.classList.remove('hidden');
        lightboxVideo.src = src;
        lightboxVideo.muted = false;
        lightboxVideo.play().catch(() => {
          lightboxVideo.muted = true;
          lightboxVideo.play().catch(() => {});
        });
      }
    } else {
      if (lightboxVideo) {
        lightboxVideo.pause();
        lightboxVideo.removeAttribute('src');
        lightboxVideo.load();
        lightboxVideo.classList.add('hidden');
      }
      if (lightboxImg) {
        lightboxImg.src = src;
        lightboxImg.alt = title;
        lightboxImg.classList.remove('hidden');
      }
    }
  }

  function openLightbox(index) {
    if (!lightbox) return;
    document.querySelectorAll('[data-video-card] video').forEach((v) => v.pause());
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    renderLightboxItem(index);
  }

  function closeLightbox() {
    if (!lightbox) return;
    if (lightboxVideo) {
      lightboxVideo.pause();
      lightboxVideo.removeAttribute('src');
      lightboxVideo.load();
    }
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
  }

  lightboxTriggers.forEach((trigger, idx) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(idx);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrevs.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderLightboxItem(currentMediaIndex - 1);
    });
  });
  lightboxNexts.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderLightboxItem(currentMediaIndex + 1);
    });
  });

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    // Soporte de gestos Swipe Izquierda / Derecha en dispositivos móviles
    let touchStartX = 0;
    let touchStartY = 0;
    lightbox.addEventListener(
      'touchstart',
      (e) => {
        if (e.changedTouches && e.changedTouches.length > 0) {
          touchStartX = e.changedTouches[0].screenX;
          touchStartY = e.changedTouches[0].screenY;
        }
      },
      { passive: true }
    );

    lightbox.addEventListener(
      'touchend',
      (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        const dx = e.changedTouches[0].screenX - touchStartX;
        const dy = e.changedTouches[0].screenY - touchStartY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          if (dx < 0) {
            renderLightboxItem(currentMediaIndex + 1);
          } else {
            renderLightboxItem(currentMediaIndex - 1);
          }
        }
      },
      { passive: true }
    );
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      closeLightbox();
    } else if (lightbox && !lightbox.classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') renderLightboxItem(currentMediaIndex - 1);
      if (e.key === 'ArrowRight') renderLightboxItem(currentMediaIndex + 1);
    }
  });

  // =========================================================================
  // 6. COTIZADOR B2B CONECTADO AL BACKEND (/api/cotizaciones) + SEGUIMIENTO
  // =========================================================================
  const quoteForm = document.getElementById('quoteForm');
  const quoteSubmitBtn = document.getElementById('quoteSubmitBtn');
  const quoteSubmitText = document.getElementById('quoteSubmitText');
  const quoteErrorAlert = document.getElementById('quoteErrorAlert');
  const confirmationAlert = document.getElementById('confirmationAlert');
  const confirmationDetails = document.getElementById('confirmationDetails');
  const confirmationMeta = document.getElementById('confirmationMeta');
  const whatsappQuoteLink = document.getElementById('whatsappQuoteLink');
  const trackingLookupForm = document.getElementById('trackingLookupForm');
  const trackingCodeInput = document.getElementById('trackingCodeInput');
  const trackingResultBox = document.getElementById('trackingResultBox');

  if (quoteForm) {
    quoteForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (quoteErrorAlert) quoteErrorAlert.classList.add('hidden');
      if (confirmationAlert) confirmationAlert.classList.add('hidden');

      const fullName = document.getElementById('fullName')?.value.trim() || '';
      const companyName = document.getElementById('companyName')?.value.trim() || '';
      const email = document.getElementById('email')?.value.trim() || '';
      const phone = document.getElementById('phone')?.value.trim() || '';
      const originProv = document.getElementById('originProv')?.value || '';
      const originCity = document.getElementById('originCity')?.value.trim() || '';
      const destSelect = document.getElementById('destinationCountry');
      const destinationCountry = destSelect?.value || '';
      const destinationLabel = destSelect?.options[destSelect.selectedIndex]?.text || '';
      const destinationCity = document.getElementById('destinationCity')?.value.trim() || '';
      const cargoType = document.getElementById('cargoType')?.value || '';
      const cargoWeight = document.getElementById('cargoWeight')?.value || '';
      const dispatchDate = document.getElementById('dispatchDate')?.value || '';
      const notes = document.getElementById('notes')?.value.trim() || '';

      if (quoteSubmitBtn) quoteSubmitBtn.disabled = true;
      if (quoteSubmitText) quoteSubmitText.textContent = 'Procesando Solicitud en Servidor...';

      try {
        const response = await fetch('/api/cotizaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            companyName,
            email,
            phone,
            originProv,
            originCity,
            destinationCountry,
            destinationLabel,
            destinationCity,
            cargoType,
            cargoWeight,
            dispatchDate,
            notes
          })
        });

        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'No se pudo procesar la cotización.');
        }

        const q = data.quote;
        if (confirmationDetails) {
          confirmationDetails.textContent = `Código ${q.codigo_referencia} — ${q.empresa} | Ruta: ${q.localidad_origen} (${q.provincia_origen}) → ${q.localidad_destino} (${q.destino_etiqueta}) | Carga: ${q.tipo_carga} (${q.peso_toneladas} Tn).`;
        }

        if (confirmationMeta) {
          const storageLabel =
            data.storage === 'supabase_cloud'
              ? 'Guardado en Supabase Cloud (PostgreSQL)'
              : 'Guardado en servidor (respaldo local activo)';
          const emailLabel = data.email?.sent
            ? 'Notificación SMTP enviada'
            : 'Comprobante HTML generado en servidor';
          confirmationMeta.textContent = `${q.corredor_sugerido} (~${q.distancia_estimada_km} km) · ${storageLabel} · ${emailLabel}`;
        }

        if (whatsappQuoteLink && data.whatsappUrl) {
          whatsappQuoteLink.href = data.whatsappUrl;
        }

        if (trackingCodeInput && q.codigo_referencia) {
          trackingCodeInput.value = q.codigo_referencia;
        }

        if (confirmationAlert) {
          confirmationAlert.classList.remove('hidden');
          confirmationAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } catch (err) {
        // Fallback inmediato si se abrió como archivo estático sin correr node server.js
        const refCode = `EXP38-${Math.floor(1000 + Math.random() * 9000)}`;
        if (window.location.protocol === 'file:') {
          if (confirmationDetails) {
            confirmationDetails.textContent = `Ref. ${refCode} — ${companyName} | Ruta: ${originCity} (${originProv}) → ${destinationCity} (${destinationLabel}) | Carga: ${cargoType} (${cargoWeight} Tn).`;
          }
          if (whatsappQuoteLink) {
            const waMessage = [
              `*SOLICITUD DE COTIZACIÓN B2B (${refCode})*`,
              `• *Empresa:* ${companyName}`,
              `• *Contacto:* ${fullName} (${phone} / ${email})`,
              `• *Origen:* ${originCity}, ${originProv}`,
              `• *Destino:* ${destinationCity} (${destinationLabel})`,
              `• *Carga:* ${cargoType} — ${cargoWeight} Tn`,
              `• *Fecha estimada:* ${dispatchDate || 'A coordinar'}`,
              `• *Observaciones:* ${notes || 'Sin observaciones adicionales'}`
            ].join('\n');
            whatsappQuoteLink.href = `https://wa.me/5492914276253?text=${encodeURIComponent(waMessage)}`;
          }
          if (confirmationAlert) {
            confirmationAlert.classList.remove('hidden');
          }
        } else if (quoteErrorAlert) {
          quoteErrorAlert.textContent = err.message || 'Error al registrar la cotización.';
          quoteErrorAlert.classList.remove('hidden');
        }
      } finally {
        if (quoteSubmitBtn) quoteSubmitBtn.disabled = false;
        if (quoteSubmitText) quoteSubmitText.textContent = 'Generar Solicitud de Cotización';
      }
    });
  }

  // Consulta en vivo de estado por código EXP38-XXXX (GET /api/cotizaciones/:codigo)
  const STATUS_LABELS = {
    pendiente: { text: 'PENDIENTE DE COTIZACIÓN', color: 'text-amber-400' },
    en_revision: { text: 'EN ANÁLISIS DE FLOTA', color: 'text-sky-400' },
    cotizado: { text: 'COTIZACIÓN EMITIDA', color: 'text-emerald-400' },
    en_transito: { text: 'UNIDAD EN TRÁNSITO', color: 'text-primary' },
    completado: { text: 'OPERACIÓN COMPLETADA', color: 'text-emerald-400' },
    cancelado: { text: 'CANCELADA', color: 'text-red-400' }
  };

  if (trackingLookupForm && trackingCodeInput && trackingResultBox) {
    trackingLookupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const rawCode = trackingCodeInput.value.trim().toUpperCase();
      if (!rawCode) return;

      trackingResultBox.classList.remove('hidden');
      trackingResultBox.innerHTML =
        '<p class="text-secondary font-mono-technical text-xs">Consultando base de datos...</p>';

      try {
        const res = await fetch(`/api/cotizaciones/${encodeURIComponent(rawCode)}`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'No se encontró el código solicitado.');
        }

        const q = data.quote;
        const st = STATUS_LABELS[q.estado] || { text: q.estado.toUpperCase(), color: 'text-white' };

        trackingResultBox.innerHTML = `
          <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-surface-container-highest">
            <span class="font-mono-technical font-bold text-white">${q.codigo_referencia}</span>
            <span class="font-mono-technical text-xs font-bold ${st.color}">${st.text}</span>
          </div>
          <p class="text-white font-semibold mt-1">${q.empresa} — ${q.localidad_origen} (${q.provincia_origen}) → ${q.localidad_destino}</p>
          <p class="text-xs text-secondary">${q.corredor_sugerido} (~${q.distancia_estimada_km} km) · ${q.tipo_carga} (${q.peso_toneladas} Tn)</p>
        `;
      } catch (err) {
        trackingResultBox.innerHTML = `<p class="text-red-300 text-xs">${err.message}</p>`;
      }
    });
  }
});
