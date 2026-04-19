/* =======================================================
   NEO STUDIO — Vanilla JS
   · Reveal-on-scroll
   · Sticky nav blur-on-scroll
   · Mobile drawer (focus trap + body lock)
   · Contact modal (focus trap + Escape + success)
   · Inline CTA form + toast
   · Countup animation on intersection
   · Bottom nav active state + smooth scroll
   · Hero parallax
   · Respects prefers-reduced-motion
   ======================================================= */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     CONFIGURACIÓN — reemplaza estos valores con los tuyos
     1. EmailJS  →  https://www.emailjs.com/
        · Crea cuenta → conecta Gmail (neostudiocdmx@gmail.com)
        · Crea un Service y un Template
        · Copia Public Key, Service ID y Template ID aquí
     2. reCAPTCHA v3  →  https://www.google.com/recaptcha/admin
        · Registra el dominio, elige v3
        · Copia la Site Key aquí Y en el <script> del index.html
     ───────────────────────────────────────────────────────── */
  const EMAILJS_PUBLIC_KEY  = 'YOUR_EMAILJS_PUBLIC_KEY';   // ← tu Public Key
  const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';            // ← ej: service_abc123
  const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';           // ← ej: template_xyz789
  const RECAPTCHA_SITE_KEY  = '6Ldj3r4sAAAAAK2EKTO6CTSputCqILK9CL387Wfg';   // ← igual que en index.html

  /* ── Inicializa EmailJS ── */
  if (window.emailjs) window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  else document.addEventListener('DOMContentLoaded', () => {
    if (window.emailjs) window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  });

  /* ── Obtiene token de reCAPTCHA v3 ── */
  async function getRecaptchaToken(action) {
    try {
      if (!window.grecaptcha) return '';
      return await new Promise((resolve) =>
        window.grecaptcha.ready(() =>
          window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action }).then(resolve)
        )
      );
    } catch { return ''; }
  }

  /* ── Envía email vía EmailJS ── */
  async function sendContactEmail(params) {
    const token = await getRecaptchaToken('contact');
    return window.emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      { ...params, recaptcha_token: token, to_email: 'neostudiocdmx@gmail.com' },
      { publicKey: EMAILJS_PUBLIC_KEY }
    );
  }

  /* ── Estado de carga en botón de submit ── */
  function setSubmitting(btn, isSubmitting) {
    if (!btn) return;
    if (isSubmitting) {
      btn.disabled = true;
      btn._originalText = btn.innerHTML;
      btn.innerHTML = 'Enviando<span class="btn-spinner" aria-hidden="true"></span>';
    } else {
      btn.disabled = false;
      if (btn._originalText) btn.innerHTML = btn._originalText;
    }
  }

  /* -----------------------------------------------------
     0. Feature detection / helpers
     ----------------------------------------------------- */
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* Current year in footer */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Smooth scroll with offset for sticky nav */
  const NAV_OFFSET = 88;
  function smoothScrollTo(target) {
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const top = rect.top + window.pageYOffset - NAV_OFFSET + 1;
    window.scrollTo({
      top,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
  }

  /* -----------------------------------------------------
     1. Reveal on scroll (IntersectionObserver)
     ----------------------------------------------------- */
  const revealEls = $$(
    '.reveal-up, .reveal-down, .reveal-left, .reveal-right, .stat-item'
  );

  if (prefersReduced) {
    revealEls.forEach((el) => el.classList.add('in-view'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* -----------------------------------------------------
     2. Sticky top-nav blur-on-scroll
     ----------------------------------------------------- */
  const topNav = $('#topNav');
  if (topNav) {
    let navTicking = false;
    const updateNav = () => {
      topNav.classList.toggle('scrolled', window.scrollY > 20);
      navTicking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!navTicking) {
          window.requestAnimationFrame(updateNav);
          navTicking = true;
        }
      },
      { passive: true }
    );
    updateNav();
  }

  /* -----------------------------------------------------
     3. Smooth scroll for all anchor links (except skip link)
     ----------------------------------------------------- */
  $$('a[href^="#"]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href === '#' || a.classList.contains('skip-link')) return;
    a.addEventListener('click', (e) => {
      const target = document.getElementById(href.slice(1));
      if (target) {
        e.preventDefault();
        smoothScrollTo(target);
        // Close drawer if open
        if (drawer && drawer.classList.contains('open')) closeDrawer();
      }
    });
  });

  /* -----------------------------------------------------
     4. Mobile drawer
     ----------------------------------------------------- */
  const burger = $('#burger');
  const drawer = $('#drawer');
  const drawerBackdrop = $('#drawerBackdrop');
  const drawerClose = $('#drawerClose');
  let lastFocusBeforeDrawer = null;

  function openDrawer() {
    if (!drawer) return;
    lastFocusBeforeDrawer = document.activeElement;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    if (drawerBackdrop) {
      drawerBackdrop.classList.add('open');
      drawerBackdrop.setAttribute('aria-hidden', 'false');
    }
    if (burger) burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Focus first focusable
    const firstFocus = drawer.querySelector(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocus) setTimeout(() => firstFocus.focus(), 60);
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    if (drawerBackdrop) {
      drawerBackdrop.classList.remove('open');
      drawerBackdrop.setAttribute('aria-hidden', 'true');
    }
    if (burger) burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocusBeforeDrawer && lastFocusBeforeDrawer.focus) {
      lastFocusBeforeDrawer.focus();
    }
  }

  if (burger) burger.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

  // Close drawer on drawer link click (smooth scroll already handles this,
  // but we ensure cleanup)
  $$('[data-drawer-link]').forEach((link) => {
    link.addEventListener('click', () => {
      setTimeout(closeDrawer, 10);
    });
  });

  /* -----------------------------------------------------
     5. Contact modal (focus trap + Escape)
     ----------------------------------------------------- */
  const modal = $('#modal');
  const modalBackdrop = $('#modalBackdrop');
  const modalClose = $('#modalClose');
  const modalForm = $('#modalForm');
  const modalSuccess = $('#modalSuccess');
  const modalSuccessClose = $('#modalSuccessClose');
  const projectTypeSelect = $('#f-type');
  let lastFocusBeforeModal = null;

  function getFocusable(container) {
    if (!container) return [];
    return Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('hidden'));
  }

  function openModal(prefill) {
    if (!modal) return;
    lastFocusBeforeModal = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    if (modalBackdrop) {
      modalBackdrop.classList.add('open');
      modalBackdrop.setAttribute('aria-hidden', 'false');
    }
    document.body.style.overflow = 'hidden';

    // Optional prefill of project type
    if (prefill && projectTypeSelect) {
      const opt = Array.from(projectTypeSelect.options).find(
        (o) => o.value === prefill
      );
      if (opt) projectTypeSelect.value = prefill;
    }

    // Close drawer if open
    if (drawer && drawer.classList.contains('open')) closeDrawer();

    // Reset success state in case it was left open
    if (modalSuccess) modalSuccess.hidden = true;
    if (modalForm) modalForm.hidden = false;

    // Focus first field
    const first = modal.querySelector('input, select, textarea, button');
    if (first) setTimeout(() => first.focus(), 60);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (modalBackdrop) {
      modalBackdrop.classList.remove('open');
      modalBackdrop.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    if (lastFocusBeforeModal && lastFocusBeforeModal.focus) {
      lastFocusBeforeModal.focus();
    }
  }

  // Triggers
  $$('[data-open-modal]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const pType = trigger.getAttribute('data-project-type');
      openModal(pType);
    });
  });

  // Reel button (placeholder)
  $$('[data-open-reel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast('Próximamente: nuestro reel en vídeo. Mientras tanto, échale un ojo a los proyectos ↓');
      const projects = document.getElementById('projects');
      if (projects) setTimeout(() => smoothScrollTo(projects), 400);
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
  if (modalSuccessClose) modalSuccessClose.addEventListener('click', closeModal);

  // Escape key → close modal or drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (modal && modal.classList.contains('open')) closeModal();
      else if (drawer && drawer.classList.contains('open')) closeDrawer();
    }
    // Focus trap for modal
    if (e.key === 'Tab' && modal && modal.classList.contains('open')) {
      const focusables = getFocusable(modal);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* -----------------------------------------------------
     6. Modal form validation + submit
     ----------------------------------------------------- */
  function setError(input, msg) {
    if (!input) return;
    const group = input.closest('.mf-field') || input.parentElement;
    const err = group ? group.querySelector('.mf-error') : null;
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (err) {
        err.textContent = msg;
        err.hidden = false;
      }
    } else {
      input.removeAttribute('aria-invalid');
      if (err) {
        err.textContent = '';
        err.hidden = true;
      }
    }
  }

  function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  if (modalForm) {
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#f-name');
      const email = $('#f-email');
      let ok = true;

      if (!name.value.trim()) {
        setError(name, 'Necesitamos tu nombre para dirigirnos a ti.');
        ok = false;
      } else {
        setError(name, '');
      }

      if (!email.value.trim()) {
        setError(email, 'Escribe tu email para responderte.');
        ok = false;
      } else if (!validateEmail(email.value.trim())) {
        setError(email, 'Hmm... ese email no parece válido.');
        ok = false;
      } else {
        setError(email, '');
      }

      if (!ok) {
        const firstInvalid = modalForm.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      /* ── Envío real con EmailJS ── */
      const submitBtn = modalForm.querySelector('[type="submit"]');
      setSubmitting(submitBtn, true);

      const projectType = $('#f-type') ? $('#f-type').value : '';
      const budget      = $('#f-budget') ? $('#f-budget').value : '';
      const message     = $('#f-message') ? $('#f-message').value.trim() : '';

      sendContactEmail({
        from_name:    name.value.trim(),
        from_email:   email.value.trim(),
        project_type: projectType || 'No especificado',
        budget:       budget      || 'No especificado',
        message:      message     || '(sin mensaje)',
        source:       'Modal / Briefing detallado',
      }).then(() => {
        setSubmitting(submitBtn, false);
        modalForm.hidden = true;
        if (modalSuccess) modalSuccess.hidden = false;
        setTimeout(() => modalForm.reset(), 400);
      }).catch((err) => {
        console.error('EmailJS error:', err);
        setSubmitting(submitBtn, false);
        showToast('Error al enviar. Escríbenos directo a neostudiocdmx@gmail.com', 'error');
      });
    });

    // Live clear error on input
    $$('#modalForm input, #modalForm select, #modalForm textarea').forEach((el) => {
      el.addEventListener('input', () => setError(el, ''));
    });
  }

  /* -----------------------------------------------------
     7. Inline CTA form (hero/contact bottom)
     ----------------------------------------------------- */
  const ctaForm = $('#ctaForm');
  if (ctaForm) {
    ctaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#cta-email');
      if (!email) return;
      const v = email.value.trim();
      if (!v || !validateEmail(v)) {
        email.setAttribute('aria-invalid', 'true');
        email.focus();
        showToast('Revisa tu email — no parece válido.', 'error');
        return;
      }
      email.removeAttribute('aria-invalid');

      /* ── Envío real con EmailJS ── */
      const submitBtn = ctaForm.querySelector('[type="submit"]');
      setSubmitting(submitBtn, true);

      sendContactEmail({
        from_name:    email.value.trim(),  // sólo email disponible en este form
        from_email:   email.value.trim(),
        project_type: 'No especificado',
        budget:       'No especificado',
        message:      '(Contacto rápido desde el formulario del hero/CTA)',
        source:       'Formulario CTA rápido',
      }).then(() => {
        setSubmitting(submitBtn, false);
        email.value = '';
        showToast('¡Gracias! Te escribimos en menos de 24 h.', 'success');
      }).catch((err) => {
        console.error('EmailJS error:', err);
        setSubmitting(submitBtn, false);
        showToast('Error al enviar. Escríbenos a neostudiocdmx@gmail.com', 'error');
      });
    });
  }

  /* -----------------------------------------------------
     8. Toast notifications
     ----------------------------------------------------- */
  const toastEl = $('#toast');
  let toastTimer = null;
  function showToast(msg, type) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('success', 'error', 'show');
    if (type) toastEl.classList.add(type);
    // Force reflow to restart animation
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3800);
  }

  /* -----------------------------------------------------
     9. Countup animation for [data-count]
     ----------------------------------------------------- */
  const countEls = $$('[data-count]');

  function animateCount(el) {
    const target = parseFloat(el.getAttribute('data-count')) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    if (prefersReduced) {
      el.textContent = prefix + target + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const from = 0;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const value = Math.round(from + (target - from) * easeOutCubic(t));
      el.textContent = prefix + value + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (countEls.length) {
    const countIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    countEls.forEach((el) => countIO.observe(el));
  }

  /* -----------------------------------------------------
     10. Bottom nav — active state + click scroll
     ----------------------------------------------------- */
  const bnItems = $$('.bn-item');
  bnItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const target = document.getElementById(id);
      if (target) {
        bnItems.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        smoothScrollTo(target);
      }
    });
  });

  /* -----------------------------------------------------
     11. Section observer — sync bottom nav + top nav
     ----------------------------------------------------- */
  const trackedSections = ['home', 'services', 'projects', 'vr', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const topLinks = $$('.top-links a[data-nav]');

  const setActiveSection = (id) => {
    bnItems.forEach((b) => {
      // bottom-nav only has home/services/projects
      b.classList.toggle('active', b.dataset.id === id);
    });
    topLinks.forEach((a) => {
      const href = a.getAttribute('href');
      a.classList.toggle('active', href === '#' + id);
    });
  };

  if (trackedSections.length) {
    const sectionIO = new IntersectionObserver(
      (entries) => {
        // Pick the most visible
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { threshold: [0.3, 0.55], rootMargin: '-88px 0px -40% 0px' }
    );
    trackedSections.forEach((s) => sectionIO.observe(s));
  }

  /* -----------------------------------------------------
     12. Hero parallax (disabled for reduced-motion)
     ----------------------------------------------------- */
  const heroRight = $('.hero-right');
  const hero = $('.hero');
  if (heroRight && hero && !prefersReduced) {
    let ticking = false;
    const update = () => {
      const rect = hero.getBoundingClientRect();
      const total = rect.height || 1;
      const progress = Math.min(1, Math.max(0, -rect.top / total));
      const y = -60 * progress;
      const opacity = progress < 0.6 ? 1 - progress / 0.6 : 0;
      heroRight.style.transform = `translateY(${y}px)`;
      heroRight.style.opacity = String(opacity);
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }
})();


/* =======================================================
   VIRTUAL TOUR — NEO STUDIO (v2)
   UX fixes:
   · cursor grab/grabbing on desktop
   · touch-action: none (iOS scroll fix)
   · image preload + loading spinner
   · keyboard arrows prev/next room
   · mobile prev/next buttons
   · hotspot label edge clamping
   · passive:false touchmove to prevent iOS page scroll
   ======================================================= */
(function () {
  'use strict';

  /* ---- Room data ---- */
  const rooms = [
    {
      id: 'entrance',
      name: 'Entrada',
      desc: 'Hall con mármol travertino y doble altura',
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2400&q=85',
      hotspots: [{ label: 'Sala de estar', to: 1, x: 58, y: 52 }]
    },
    {
      id: 'living',
      name: 'Sala de estar',
      desc: 'Dobles alturas y vistas panorámicas a la ciudad',
      img: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=2400&q=85',
      hotspots: [
        { label: 'Dormitorio', to: 2, x: 22, y: 55 },
        { label: 'Cocina',     to: 3, x: 72, y: 58 },
        { label: 'Terraza',   to: 4, x: 48, y: 42 }
      ]
    },
    {
      id: 'bedroom',
      name: 'Dormitorio principal',
      desc: 'Suite de 40m² con baño en suite y vestidor italiano',
      img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=2400&q=85',
      hotspots: [{ label: 'Sala de estar', to: 1, x: 78, y: 58 }]
    },
    {
      id: 'kitchen',
      name: 'Cocina',
      desc: 'Diseño con isla central y electrodomésticos Gaggenau',
      img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=2400&q=85',
      hotspots: [{ label: 'Sala de estar', to: 1, x: 20, y: 55 }]
    },
    {
      id: 'terrace',
      name: 'Terraza',
      desc: '80m² con piscina privada y vistas 360° a Madrid',
      img: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=2400&q=85',
      hotspots: [{ label: 'Sala de estar', to: 1, x: 42, y: 58 }]
    }
  ];

  /* ---- DOM refs ---- */
  const overlay       = document.getElementById('vrOverlay');
  const openBtns      = document.querySelectorAll('[data-open-tour]');
  const closeBtn      = document.getElementById('vrClose');
  const vrBg          = document.getElementById('vrBg');
  const vrBgFade      = document.getElementById('vrBgTransition');
  const vrHotspots    = document.getElementById('vrHotspots');
  const vrRoomName    = document.getElementById('vrRoomName');
  const vrRoomDesc    = document.getElementById('vrRoomDesc');
  const vrRoomCounter = document.getElementById('vrRoomCounter');
  const vrDots        = document.getElementById('vrDots');
  const fpRooms       = document.querySelectorAll('.vr-fp-room');
  const scene         = document.getElementById('vrScene');
  const dragHint      = document.getElementById('vrDragHint');

  if (!overlay || !scene) return;

  /* ---- State ---- */
  let currentRoom  = 0;
  let panX         = 0;
  let targetPanX   = 0;
  let isDragging   = false;
  let dragStartX   = 0;
  let dragStartPan = 0;
  let rafId        = null;
  const MAX_PAN        = -38;
  const PAN_SENSITIVITY = 0.055;  // increased for snappier feel

  /* ---- Preload all images upfront ---- */
  rooms.forEach((r) => {
    const img = new Image();
    img.src = r.img;
  });

  /* ---- Build navigation dots ---- */
  rooms.forEach((r, i) => {
    const btn = document.createElement('button');
    btn.className = 'vr-dot-btn' + (i === 0 ? ' vr-dot-active' : '');
    btn.setAttribute('aria-label', r.name);
    btn.setAttribute('role', 'tab');
    btn.addEventListener('click', () => goToRoom(i));
    vrDots.appendChild(btn);
  });

  /* ---- Wire up preview room chips ---- */
  document.querySelectorAll('.tour-room-chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      openTour(parseInt(chip.dataset.room, 10));
    });
  });

  /* ---- Open / Close ---- */
  function openTour(startRoom) {
    if (startRoom === undefined || startRoom === null) startRoom = 0;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    currentRoom = startRoom;
    panX = 0; targetPanX = 0;
    loadRoom(startRoom, true);
    startPanLoop();
    // Reset drag hint visibility
    if (dragHint) {
      dragHint.style.animation = 'none';
      dragHint.style.opacity   = '1';
      void dragHint.offsetWidth;
      dragHint.style.animation = '';
    }
    setTimeout(() => closeBtn && closeBtn.focus(), 120);
  }

  function closeTour() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    stopPanLoop();
  }

  openBtns.forEach((btn) => btn.addEventListener('click', () => openTour(0)));
  if (closeBtn) closeBtn.addEventListener('click', closeTour);

  /* ---- Keyboard: Escape + Arrow navigation ---- */
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape' || e.key === 'Esc') { closeTour(); return; }
    if (e.key === 'ArrowRight') { goToRoom((currentRoom + 1) % rooms.length); }
    if (e.key === 'ArrowLeft')  { goToRoom((currentRoom - 1 + rooms.length) % rooms.length); }
  });

  /* ---- Load room ---- */
  // Helper: wait for browser to paint before calling fn
  function afterPaint(fn) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  function loadRoom(idx, instant) {
    const room = rooms[idx];
    if (!room) return;

    if (instant) {
      // Show spinner, load image, reveal only after paint
      setLoadingState(true);
      const img = new Image();
      const apply = () => {
        vrBg.src = room.img;
        vrBg.alt = room.name;
        afterPaint(() => { setLoadingState(false); setRoomUI(idx); });
      };
      img.onload  = apply;
      img.onerror = apply;
      img.src = room.img;
      if (img.complete) apply();

    } else {
      // Key fix: start image load AND fade-to-black simultaneously.
      // Only reveal when BOTH are done (fade finished + image painted).
      setLoadingState(true);
      vrBgFade.classList.add('fading');

      let fadeReady = false;
      let imgReady  = false;

      function tryReveal() {
        if (!fadeReady || !imgReady) return;
        // Apply new image while still behind black overlay
        vrBg.src = room.img;
        vrBg.alt = room.name;
        panX = 0; targetPanX = 0;
        vrBg.style.transform = 'translateX(0)';
        setRoomUI(idx);
        // Wait two frames so browser paints the new image before removing overlay
        afterPaint(() => {
          vrBgFade.classList.remove('fading');
          setLoadingState(false);
        });
      }

      // Load image immediately (parallel to fade animation)
      const img = new Image();
      img.onload  = () => { imgReady = true;  tryReveal(); };
      img.onerror = () => { imgReady = true;  tryReveal(); };
      img.src = room.img;
      if (img.complete) { imgReady = true; }

      // Fade-to-black takes 400ms (matches CSS transition on vr-bg-transition)
      setTimeout(() => { fadeReady = true; tryReveal(); }, 420);
    }
  }

  /* ---- Loading spinner state ---- */
  function setLoadingState(on) {
    scene.classList.toggle('vr-loading', on);
  }

  /* ---- Update all UI for a room ---- */
  function setRoomUI(idx) {
    const room = rooms[idx];
    currentRoom = idx;
    vrRoomName.textContent    = room.name;
    vrRoomDesc.textContent    = room.desc;
    vrRoomCounter.textContent = (idx + 1) + ' / ' + rooms.length;

    document.querySelectorAll('.vr-dot-btn').forEach((d, i) =>
      d.classList.toggle('vr-dot-active', i === idx));
    fpRooms.forEach((fp) =>
      fp.classList.toggle('fp-active', parseInt(fp.dataset.fp, 10) === idx));
    document.querySelectorAll('.tour-room-chip').forEach((c) =>
      c.classList.toggle('active-chip', parseInt(c.dataset.room, 10) === idx));

    buildHotspots(room);
    updateMobileNavBtns();
  }

  function goToRoom(idx) {
    if (idx === currentRoom) return;
    loadRoom(idx, false);
  }

  /* ---- Hotspots ---- */
  function buildHotspots(room) {
    vrHotspots.innerHTML = '';
    room.hotspots.forEach((hs) => {
      const el = document.createElement('button');
      el.className = 'vr-hotspot';
      // Clamp to avoid edge overflow
      const clampedX = Math.min(Math.max(hs.x, 12), 88);
      const clampedY = Math.min(Math.max(hs.y, 20), 72);
      el.style.left = clampedX + '%';
      el.style.top  = clampedY + '%';
      el.setAttribute('aria-label', 'Ir a ' + hs.label);
      el.innerHTML = `
        <div class="vr-hotspot-ring">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
        <span class="vr-hotspot-label">${hs.label}</span>
      `;
      el.addEventListener('click', () => goToRoom(hs.to));
      vrHotspots.appendChild(el);
    });
  }

  /* ---- Minimap click ---- */
  fpRooms.forEach((fp) => {
    fp.addEventListener('click', () => {
      const idx = parseInt(fp.dataset.fp, 10);
      overlay.classList.contains('open') ? goToRoom(idx) : openTour(idx);
    });
  });

  /* ---- Mobile prev/next buttons ---- */
  function updateMobileNavBtns() {
    const prevBtn = document.getElementById('vrPrevRoom');
    const nextBtn = document.getElementById('vrNextRoom');
    if (prevBtn) prevBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = false;
  }
  const prevBtn = document.getElementById('vrPrevRoom');
  const nextBtn = document.getElementById('vrNextRoom');
  if (prevBtn) prevBtn.addEventListener('click', () =>
    goToRoom((currentRoom - 1 + rooms.length) % rooms.length));
  if (nextBtn) nextBtn.addEventListener('click', () =>
    goToRoom((currentRoom + 1) % rooms.length));

  /* ---- RAF pan loop ---- */
  function startPanLoop() {
    if (rafId) return;
    function loop() {
      panX += (targetPanX - panX) * 0.08;
      vrBg.style.transform = 'translateX(' + panX + '%)';
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }
  function stopPanLoop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  /* ---- Mouse drag (desktop) ---- */
  const isUI = (el) => el.closest('.vr-hotspot, .vr-topbar, .vr-info, .vr-minimap, .vr-bottom, .vr-mobile-nav');

  scene.addEventListener('mousedown', (e) => {
    if (isUI(e.target)) return;
    isDragging   = true;
    dragStartX   = e.clientX;
    dragStartPan = targetPanX;
    scene.classList.add('is-dragging');
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const delta = (e.clientX - dragStartX) * PAN_SENSITIVITY;
    targetPanX = Math.max(MAX_PAN, Math.min(0, dragStartPan + delta));
  });
  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    scene.classList.remove('is-dragging');
  });

  /* ---- Touch drag (mobile) — non-passive to prevent iOS page scroll ---- */
  let touchStartY = 0;
  let touchIsHorizontal = null;

  scene.addEventListener('touchstart', (e) => {
    if (isUI(e.target)) return;
    isDragging          = true;
    dragStartX          = e.touches[0].clientX;
    touchStartY         = e.touches[0].clientY;
    dragStartPan        = targetPanX;
    touchIsHorizontal   = null;
  }, { passive: true });

  scene.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - dragStartX;
    const dy = e.touches[0].clientY - touchStartY;
    // Determine direction on first move
    if (touchIsHorizontal === null) {
      touchIsHorizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (!touchIsHorizontal) { isDragging = false; return; }
    e.preventDefault(); // Prevent page scroll on horizontal drag
    const delta = dx * PAN_SENSITIVITY;
    targetPanX = Math.max(MAX_PAN, Math.min(0, dragStartPan + delta));
  }, { passive: false });

  window.addEventListener('touchend', () => {
    isDragging         = false;
    touchIsHorizontal  = null;
  });

  /* ---- Idle auto-pan ---- */
  let idleTimer = null;
  function scheduleIdlePan() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!isDragging) {
        targetPanX = targetPanX < MAX_PAN / 2 ? 0 : MAX_PAN / 2;
        scheduleIdlePan();
      }
    }, 6000);
  }
  scene.addEventListener('mousedown',  scheduleIdlePan);
  scene.addEventListener('touchstart', scheduleIdlePan, { passive: true });
  // Start auto-pan on open
  overlay.addEventListener('transitionend', () => {
    if (overlay.classList.contains('open')) scheduleIdlePan();
  });

})();

/* =======================================================
   360° PRODUCT VIEWER — Three.js + GLB Model
   Open-source model: SheenChair (KhronosGroup glTF samples)
   · Dynamic Three.js loading (no page-load penalty)
   · GLTFLoader + OrbitControls
   · Real PBR material swatches
   · Auto-rotate + user drag
   ======================================================= */
(function () {
  'use strict';

  const overlay  = document.getElementById('p360Overlay');
  const closeBtn = document.getElementById('p360Close');
  const canvas   = document.getElementById('p360Canvas');
  const loading  = document.getElementById('p360Loading');
  const degreeEl = document.getElementById('p360Degree');
  const swatches = document.querySelectorAll('.p360-swatch');

  if (!overlay || !canvas) return;

  /* ---- Three.js CDN scripts to load lazily ---- */
  const THREE_SCRIPTS = [
    'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js',
    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js',
    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
  ];

  /* ---- Model URL (open-source, CC licence) ---- */
  const MODEL_URL = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@main/2.0/SheenChair/glTF-Binary/SheenChair.glb';

  /* ---- Material configs ---- */
  const MATERIALS = [
    { name: 'Roble natural',    color: 0xc8a96e, roughness: 0.82, metalness: 0.0  },
    { name: 'Cuero negro',      color: 0x1c1c1c, roughness: 0.42, metalness: 0.08 },
    { name: 'Terciopelo verde', color: 0x4a7c59, roughness: 0.92, metalness: 0.0  },
    { name: 'Mármol blanco',    color: 0xf0ebe3, roughness: 0.12, metalness: 0.04 },
  ];

  /* ---- Three.js state ---- */
  let renderer, scene, camera, controls, mixer;
  let chairMeshes = [];
  let threeReady  = false;
  let modelLoaded = false;
  let animId      = null;
  let scriptsLoaded = false;

  /* ---- Open / Close ---- */
  function openViewer() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (!scriptsLoaded) {
      showLoading(true);
      loadScriptsSequentially(THREE_SCRIPTS)
        .then(() => {
          scriptsLoaded = true;
          /* Double-rAF: wait for overlay layout to be fully computed before measuring */
          requestAnimationFrame(() => requestAnimationFrame(initThree));
        })
        .catch(() => showLoading(false));
    } else if (threeReady) {
      startRender();
    }
    setTimeout(() => closeBtn && closeBtn.focus(), 120);
  }

  function closeViewer() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    stopRender();
  }

  document.querySelectorAll('[data-open-360]').forEach((b) =>
    b.addEventListener('click', openViewer));
  if (closeBtn) closeBtn.addEventListener('click', closeViewer);
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Escape' || e.key === 'Esc') && overlay.classList.contains('open')) closeViewer();
  });

  /* ---- Load scripts sequentially ---- */
  function loadScriptsSequentially(urls) {
    return urls.reduce((chain, url) =>
      chain.then(() => new Promise((res, rej) => {
        if (document.querySelector(`script[src="${url}"]`)) { res(); return; }
        const s = document.createElement('script');
        s.src = url; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      })), Promise.resolve());
  }

  /* ---- Init Three.js ---- */
  function initThree() {
    const THREE  = window.THREE;

    /* Measure AFTER overlay is visible — getBoundingClientRect is more reliable than clientWidth */
    const stage = canvas.parentElement;
    const rect  = stage.getBoundingClientRect();
    const w = rect.width  || stage.offsetWidth  || 480;
    const h = rect.height || stage.offsetHeight || 480;

    /* Renderer — canvas is sized by CSS (position:absolute inset:0), Three.js sets only buffer */
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w || 480, h || 480, false); /* false = don't override CSS size, only set buffer */
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping    = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled  = true;
    renderer.shadowMap.type     = THREE.PCFSoftShadowMap;

    /* Scene */
    scene = new THREE.Scene();

    /* Camera */
    camera = new THREE.PerspectiveCamera(42, w / h, 0.01, 100);
    camera.position.set(0, 0.6, 2.8);

    /* Lights */
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff8f0, 2.2);
    key.position.set(3, 5, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far  = 20;
    key.shadow.camera.top = key.shadow.camera.right = 3;
    key.shadow.camera.bottom = key.shadow.camera.left = -3;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc0d8ff, 0.5);
    fill.position.set(-4, 2, -2);
    scene.add(fill);

    const rim = new THREE.PointLight(0xec4899, 0.8, 8);
    rim.position.set(-1.5, 2, -2);
    scene.add(rim);

    const ground = new THREE.PointLight(0x6366f1, 0.4, 6);
    ground.position.set(0, -1, 1);
    scene.add(ground);

    /* Shadow-receiving ground plane */
    const planeGeo = new THREE.PlaneGeometry(6, 6);
    const planeMat = new THREE.ShadowMaterial({ opacity: 0.18 });
    const plane    = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.01;
    plane.receiveShadow = true;
    scene.add(plane);

    /* OrbitControls */
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enablePan     = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate    = true;
    controls.autoRotateSpeed = 1.2;
    controls.minDistance   = 1.2;
    controls.maxDistance   = 5;
    controls.minPolarAngle = Math.PI * 0.15;
    controls.maxPolarAngle = Math.PI * 0.75;

    /* Load model */
    const loader = new THREE.GLTFLoader();
    loader.load(MODEL_URL, (gltf) => {
      const model = gltf.scene;

      /* Centre + scale */
      const box  = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const cent = box.getCenter(new THREE.Vector3());
      const maxS = Math.max(size.x, size.y, size.z);
      const scale = 1.6 / maxS;
      model.scale.setScalar(scale);
      model.position.sub(cent.multiplyScalar(scale));
      model.position.y += 0.04;

      /* Enable shadows on all meshes */
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
          chairMeshes.push(child);
        }
      });

      scene.add(model);
      modelLoaded = true;
      showLoading(false);
      applyMaterial(0, true);

      /* Show drag hint via class (CSS handles animation) */
      const hint = document.getElementById('p360DragHint');
      if (hint) hint.classList.add('visible');
    },
    (xhr) => {
      /* progress */
      if (loading) {
        const pct = Math.round(xhr.loaded / xhr.total * 100);
        const p = loading.querySelector('p');
        if (p) p.textContent = `Cargando modelo… ${pct}%`;
      }
    },
    (err) => {
      console.warn('Model load error', err);
      showLoading(false);
    });

    /* Resize observer — also call once after first paint to correct initial size */
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas.parentElement);
    /* Deferred initial resize — after browser has laid out the overlay */
    requestAnimationFrame(() => requestAnimationFrame(onResize));

    threeReady = true;
    startRender();
  }

  /* ---- Render loop ---- */
  function startRender() {
    if (animId) return;
    function tick() {
      animId = requestAnimationFrame(tick);
      if (!threeReady) return;
      controls.update();
      renderer.render(scene, camera);

      /* Degree readout from azimuth angle */
      if (degreeEl && controls) {
        const az  = controls.getAzimuthalAngle(); // -π to π
        const deg = Math.round(((az * 180 / Math.PI) % 360 + 360) % 360);
        degreeEl.textContent = deg + '°';
      }
    }
    animId = requestAnimationFrame(tick);
  }
  function stopRender() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
  }

  /* ---- Resize ---- */
  function onResize() {
    if (!renderer || !camera) return;
    const stage = canvas.parentElement;
    const rect  = stage.getBoundingClientRect();
    const w = rect.width  || stage.offsetWidth;
    const h = rect.height || stage.offsetHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false); /* false = canvas display sized by CSS, only update buffer */
  }

  /* ---- Material switcher ---- */
  function applyMaterial(idx, instant) {
    if (!window.THREE) return;
    const cfg = MATERIALS[idx];
    chairMeshes.forEach((mesh) => {
      if (!mesh.material) return;
      // Clone material on first change
      if (!mesh.material._cloned) {
        mesh.material = mesh.material.clone();
        mesh.material._cloned = true;
      }
      if (instant) {
        mesh.material.color.setHex(cfg.color);
        mesh.material.roughness = cfg.roughness;
        mesh.material.metalness = cfg.metalness;
      } else {
        /* Animate color transition using a tweened approach */
        const from = mesh.material.color.clone();
        const to   = new THREE.Color(cfg.color);
        const fromR = mesh.material.roughness;
        const fromM = mesh.material.metalness;
        const dur   = 400;
        const start = performance.now();
        (function tween() {
          const t = Math.min(1, (performance.now() - start) / dur);
          const ease = 1 - Math.pow(1 - t, 3);
          mesh.material.color.lerpColors(from, to, ease);
          mesh.material.roughness = fromR + (cfg.roughness - fromR) * ease;
          mesh.material.metalness = fromM + (cfg.metalness - fromM) * ease;
          mesh.material.needsUpdate = true;
          if (t < 1) requestAnimationFrame(tween);
        })();
      }
    });

    /* Update swatch UI */
    swatches.forEach((s, i) => {
      s.classList.toggle('p360-swatch-active', i === idx);
      s.setAttribute('aria-checked', i === idx ? 'true' : 'false');
    });

    /* Update product name */
    const nameEl = document.getElementById('p360ProductName');
    if (nameEl) nameEl.textContent = 'Sillón Oslo · ' + MATERIALS[idx].name;
  }

  swatches.forEach((s, i) => s.addEventListener('click', () => applyMaterial(i, false)));

  /* ---- Loading state ---- */
  function showLoading(on) {
    if (!loading) return;
    loading.style.display = on ? 'flex' : 'none';
  }

})();
