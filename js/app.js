// ===================
// Configuration
// ===================
const CONFIG = {
  images: {
    light: 'images/static-grid-dark-green-4k.png',
    dark: 'images/static-grid-4k.png',
    blackout: 'images/static-white-grid-4k.png'
  },
  stars: {
    minCount: 220,
    densityDivisor: 4500
  },
  typewriter: {
    lineDelay: 50,      // ms between lines
    pauseAfter: 400     // ms pause before fade to image
  }
};

// ===================
// DOM Elements
// ===================
const elements = {
  toggle: document.querySelector('.theme-toggle'),
  moonSwitch: document.querySelector('.moon-switch'),
  starfield: document.querySelector('.starfield'),
  mapReveal: document.querySelector('.page-figure'),
  gridImage: document.querySelector('.page-figure img'),
  mapShell: document.querySelector('.map-shell'),
  mapFallback: document.querySelector('.map-fallback'),
  year: document.getElementById('y')
};

// ===================
// Utilities
// ===================
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function setVars(el, vars) {
  Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
}

// ===================
// Typewriter Module
// ===================
const Typewriter = {
  lines: [],
  currentLine: 0,
  targetLine: 0,
  imagesLoaded: 0,
  totalImages: 3,
  isTyping: false,
  cursor: '█',

  init() {
    if (!elements.mapFallback) return;

    // Store full ASCII and split into lines
    const fullText = elements.mapFallback.textContent;
    this.lines = fullText.split('\n');
    this.currentLine = 0;
    this.targetLine = 0;
    this.imagesLoaded = 0;
    this.isTyping = false;

    // Clear and show cursor
    elements.mapFallback.textContent = this.cursor;
    elements.mapFallback.style.opacity = '1';

    // Start preloading all images
    this.preloadImages();
  },

  preloadImages() {
    const images = [
      CONFIG.images.light,
      CONFIG.images.dark,
      CONFIG.images.blackout
    ];

    images.forEach(src => {
      const img = new Image();
      img.onload = () => this.onImageLoaded();
      img.src = src;
    });
  },

  onImageLoaded() {
    this.imagesLoaded++;
    // Calculate target line based on load progress
    const progress = this.imagesLoaded / this.totalImages;
    this.targetLine = Math.floor(progress * this.lines.length);

    // Resume typing if paused
    if (!this.isTyping) {
      this.typeToTarget();
    }
  },

  typeToTarget() {
    // If we've reached target, pause and wait for more images
    if (this.currentLine >= this.targetLine) {
      this.isTyping = false;
      // Check if fully complete
      if (this.imagesLoaded >= this.totalImages && this.currentLine >= this.lines.length) {
        this.complete();
      }
      return;
    }

    this.isTyping = true;
    this.currentLine++;
    const typed = this.lines.slice(0, this.currentLine).join('\n');
    elements.mapFallback.textContent = typed + this.cursor;

    setTimeout(() => this.typeToTarget(), CONFIG.typewriter.lineDelay);
  },

  complete() {
    // Remove cursor
    elements.mapFallback.textContent = this.lines.join('\n');

    setTimeout(() => {
      // Fade out ASCII
      elements.mapShell.classList.add('is-loaded');
      // After ASCII fades, fade in map
      setTimeout(() => {
        elements.mapShell.classList.add('is-revealed');
      }, 600);
    }, CONFIG.typewriter.pauseAfter);
  }
};

// ===================
// Theme Module
// ===================
const Theme = {
  isDark() {
    return document.body.classList.contains('dark');
  },

  toggle() {
    const isDark = !this.isDark();
    document.body.classList.toggle('dark', isDark);
    elements.toggle.setAttribute('aria-pressed', String(isDark));
    elements.toggle.textContent = isDark ? '☾' : '☀︎';
    Blackout.update();
  }
};

// ===================
// Stars Module
// ===================
const Stars = {
  populate() {
    const { innerWidth: w, innerHeight: h } = window;
    const count = Math.max(CONFIG.stars.minCount, Math.floor((w * h) / CONFIG.stars.densityDivisor));

    this.clear();

    for (let i = 0; i < count; i++) {
      elements.starfield.appendChild(this.create());
    }
  },

  create() {
    const wrap = document.createElement('span');
    const star = document.createElement('span');

    const isBig = Math.random() < 0.15;
    const size = isBig ? rand(3, 6) : rand(1, 3);
    const hue = Math.random() < 0.25 ? rand(200, 240) : rand(40, 80);

    wrap.className = 'star-wrap';
    star.className = 'star';

    setVars(wrap, {
      '--size': `${size.toFixed(2)}px`,
      '--drift-x': `${rand(-20, 20).toFixed(2)}px`,
      '--drift-y': `${rand(-20, 20).toFixed(2)}px`,
      '--drift-dur': `${rand(8, 14).toFixed(2)}s`,
      '--drift-delay': `${rand(0, 3).toFixed(2)}s`
    });

    setVars(star, {
      '--delay': `${rand(0, 2.5).toFixed(2)}s`,
      '--twinkle-delay': `${rand(0, 3.5).toFixed(2)}s`
    });

    star.style.background = `radial-gradient(circle,
      hsla(${hue}, 100%, 95%, 1) 0%,
      hsla(${hue}, 100%, 90%, .85) 35%,
      hsla(${hue}, 100%, 70%, 0) 70%)`;

    wrap.style.left = `${Math.random() * 100}%`;
    wrap.style.top = `${Math.random() * 100}%`;

    wrap.appendChild(star);
    return wrap;
  },

  clear() {
    elements.starfield.innerHTML = '';
  }
};

// ===================
// Blackout Module
// ===================
const Blackout = {
  isActive() {
    const isDark = Theme.isDark();
    const isOff = elements.moonSwitch.getAttribute('aria-pressed') === 'false';
    return isDark && isOff;
  },

  update() {
    const active = this.isActive();
    elements.starfield.classList.toggle('active', active);
    document.body.classList.toggle('blackout', active);

    this.updateImage();

    if (active) {
      Stars.populate();
    } else {
      Stars.clear();
    }
  },

  updateImage() {
    if (!elements.gridImage) return;

    if (this.isActive()) {
      elements.gridImage.src = CONFIG.images.blackout;
    } else if (Theme.isDark()) {
      elements.gridImage.src = CONFIG.images.dark;
    } else {
      elements.gridImage.src = CONFIG.images.light;
    }
  },

  toggle() {
    const isOn = elements.moonSwitch.getAttribute('aria-pressed') !== 'true';
    elements.moonSwitch.setAttribute('aria-pressed', String(isOn));
    this.update();
  }
};

// ===================
// Content Module
// ===================
const Content = {
  toggle() {
    const isCollapsed = document.body.classList.contains('content-collapsed');
    document.body.classList.toggle('content-collapsed', !isCollapsed);
    elements.mapReveal.setAttribute('aria-expanded', String(isCollapsed));
    elements.mapReveal.classList.toggle('is-selected', isCollapsed);
  }
};


// ===================
// Event Listeners
// ===================
function initEventListeners() {
  elements.toggle.addEventListener('click', () => Theme.toggle());
  elements.moonSwitch.addEventListener('click', () => Blackout.toggle());

  if (elements.mapReveal) {
    elements.mapReveal.addEventListener('click', () => Content.toggle());
    elements.mapReveal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        Content.toggle();
      }
    });
  }

  window.addEventListener('resize', () => {
    if (elements.starfield.classList.contains('active')) {
      Stars.populate();
    }
  });
}

// ===================
// Initialize
// ===================
function init() {
  elements.year.textContent = new Date().getFullYear();

  Typewriter.init();
  initEventListeners();
  Blackout.update();
}

init();
