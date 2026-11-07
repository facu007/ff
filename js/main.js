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
      title: '5. Corredor Atlántico & Bases Patagónicas',
      routes: 'RN 3 Troncal · Bases Operativas Sur',
      distance: '2.580 km',
      sla: 'Frecuencia continua · Bases propias',
      hubs: 'Bs. As. ⇄ Bahía Blanca ⇄ Puerto Madryn ⇄ Comodoro ⇄ Río Gallegos',
      originProv: 'Buenos Aires',
      originCity: 'Bahía Blanca',
      destCountry: 'ARG_PAT',
      destCity: 'Puerto Madryn / Comodoro Rivadavia'
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
  // 6. COTIZADOR B2B PROFESIONAL CON RESUMEN + WHATSAPP DIRECTO
  // =========================================================================
  const quoteForm = document.getElementById('quoteForm');
  const confirmationAlert = document.getElementById('confirmationAlert');
  const confirmationDetails = document.getElementById('confirmationDetails');
  const whatsappQuoteLink = document.getElementById('whatsappQuoteLink');

  if (quoteForm) {
    quoteForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const fullName = document.getElementById('fullName')?.value.trim() || '';
      const companyName = document.getElementById('companyName')?.value.trim() || '';
      const email = document.getElementById('email')?.value.trim() || '';
      const phone = document.getElementById('phone')?.value.trim() || '';
      const originProv = document.getElementById('originProv')?.value || '';
      const originCity = document.getElementById('originCity')?.value.trim() || '';
      const destSelect = document.getElementById('destinationCountry');
      const destLabel = destSelect?.options[destSelect.selectedIndex]?.text || '';
      const destinationCity = document.getElementById('destinationCity')?.value.trim() || '';
      const cargoType = document.getElementById('cargoType')?.value || '';
      const cargoWeight = document.getElementById('cargoWeight')?.value || '';
      const dispatchDate = document.getElementById('dispatchDate')?.value || 'A coordinar';
      const notes = document.getElementById('notes')?.value.trim() || 'Sin observaciones adicionales';

      const refCode = `EXP38-${Math.floor(1000 + Math.random() * 9000)}`;

      if (confirmationDetails) {
        confirmationDetails.textContent = `Ref. ${refCode} — ${companyName} | Ruta: ${originCity} (${originProv}) → ${destinationCity} (${destLabel}) | Carga: ${cargoType} (${cargoWeight} Tn).`;
      }

      if (whatsappQuoteLink) {
        const waMessage = [
          `*SOLICITUD DE COTIZACIÓN B2B (${refCode})*`,
          `• *Empresa:* ${companyName}`,
          `• *Contacto:* ${fullName} (${phone} / ${email})`,
          `• *Origen:* ${originCity}, ${originProv}`,
          `• *Destino:* ${destinationCity} (${destLabel})`,
          `• *Carga:* ${cargoType} — ${cargoWeight} Tn`,
          `• *Fecha estimada:* ${dispatchDate}`,
          `• *Observaciones:* ${notes}`
        ].join('\n');

        whatsappQuoteLink.href = `https://wa.me/5491138380038?text=${encodeURIComponent(waMessage)}`;
      }

      if (confirmationAlert) {
        confirmationAlert.classList.remove('hidden');
        confirmationAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
});
