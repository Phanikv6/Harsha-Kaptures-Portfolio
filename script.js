let albumData = {};
let allProjects = [];
let viewMoreExpanded = false;

document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initPhotoReveal();
    initStatsCounter();
    initTestimonialsCarousel();
    initScrollToTop();
    initFadeAnimations();
    initHeroParticles();
    initParallaxHero();
    initCursorGlow();
    initScrollReveal();
    const contactForm = document.getElementById('contactForm');
    if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);
    initAlbumView();
    initImageZoom();
    initLazyLoading();
    loadProjects();

    const socket = window.io && io();
    if (socket) socket.on('content-updated', () => loadProjects());
});

// Peekaboo camera cover - click to reveal photo
function initPhotoReveal() {
    const container = document.getElementById('photoReveal');
    const cameraCover = document.getElementById('cameraCover');
    const aboutPhoto = document.getElementById('aboutPhoto');

    if (container && cameraCover && aboutPhoto) {
        container.addEventListener('click', function () {
            cameraCover.classList.add('hidden');
            aboutPhoto.classList.add('revealed');
        });
    }
}

// Mobile menu toggle functionality
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mainNav = document.querySelector('.main-nav');

    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', function () {
            mainNav.classList.toggle('active');
            // Change icon when menu is open
            if (mainNav.classList.contains('active')) {
                mobileMenuToggle.textContent = '✕';
            } else {
                mobileMenuToggle.textContent = '☰';
            }
        });

        // Close menu when clicking on a link
        const navLinks = mainNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('active');
                mobileMenuToggle.textContent = '☰';
            });
        });
    }
}

// Contact form submission - uses backend API (Google Sheets + Telegram handled server-side)
function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const data = {
        firstName: form.firstName.value.trim(),
        lastName: form.lastName.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        message: form.message.value.trim(),
        timestamp: new Date().toISOString()
    };

    fetch((window.location.origin || '') + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(async (response) => {
            let payload = {};
            try {
                payload = await response.json();
            } catch (_) {}

            if (!response.ok) {
                throw new Error(payload.error || 'Submission failed');
            }

            showSuccessMessage();
            form.reset();
        })
        .catch(() => {
            showErrorMessage('Something went wrong. Please try again or email us directly.');
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

function showErrorMessage(msg) {
    const errEl = document.createElement('div');
    errEl.className = 'success-message';
    errEl.textContent = msg;
    errEl.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background-color: #d32f2f; color: white;
        padding: 15px 25px; border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;
        animation: slideIn 0.5s ease-out;
    `;
    document.body.appendChild(errEl);
    setTimeout(() => {
        errEl.style.animation = 'slideOut 0.5s ease-in';
        setTimeout(() => document.body.removeChild(errEl), 500);
    }, 4000);
}

// Success message for form
function showSuccessMessage() {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.textContent = 'Thank you! Your message has been sent successfully.';
    successMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #4CAF50;
        color: white;
        padding: 15px 25px;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideIn 0.5s ease-out;
    `;

    document.body.appendChild(successMsg);

    setTimeout(() => {
        successMsg.style.animation = 'slideOut 0.5s ease-in';
        setTimeout(() => {
            document.body.removeChild(successMsg);
        }, 500);
    }, 3000);
}

// Lazy loading for images
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

function getBaseUrl() {
    return window.location.origin;
}

function resolveImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('/')) return getBaseUrl() + url;
    return url;
}

function loadProjects() {
    fetch(getBaseUrl() + '/api/projects').then(r => r.json()).then(data => {
        const { projects, viewMoreEnabled, limit } = data;
        allProjects = projects || [];
        albumData = {};
        allProjects.forEach(p => {
            albumData[p._id] = { title: p.title, photos: p.images && p.images.length ? p.images : (p.coverImage ? [p.coverImage] : []) };
        });
        viewMoreExpanded = false;
        renderGallery(projects || [], viewMoreEnabled !== false, limit || 6);
    }).catch(() => {
        document.getElementById('projectsGallery').innerHTML = '<p class="empty-state" style="text-align:center;padding:40px;color:#999;">Projects will load when the server is running.</p>';
    });
}

function renderGallery(projects, viewMoreEnabled, limit) {
    const gallery = document.getElementById('projectsGallery');
    const viewMoreContainer = document.getElementById('viewMoreContainer');
    const viewMoreBtn = document.getElementById('viewMoreBtn');
    if (!gallery) return;

    const showCount = viewMoreEnabled ? (viewMoreExpanded ? projects.length : Math.min(limit, projects.length)) : Math.min(limit, projects.length);
    const toShow = projects.slice(0, showCount);
    const hasMore = viewMoreEnabled && projects.length > limit && !viewMoreExpanded;

    gallery.innerHTML = toShow.map(p => {
        const cover = resolveImageUrl(p.coverImage);
        const desc = (p.description || '').slice(0, 120) + ((p.description || '').length > 120 ? '...' : '');
        return `
            <div class="gallery-item static-project">
                <div class="gallery-image">
                    <img src="${cover}" alt="${(p.title || '').replace(/"/g, '&quot;')}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22><rect fill=%22%23ddd%22 width=%22400%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22>No image</text></svg>'">
                    <div class="gallery-overlay">
                        <p class="gallery-description">${desc}</p>
                        <a href="#" class="album-link-btn" data-album="${p._id}">View Album</a>
                    </div>
                </div>
                <div class="gallery-label">${(p.title || '').replace(/</g, '&lt;')}</div>
            </div>`;
    }).join('');

    viewMoreContainer.classList.toggle('hidden', !hasMore);
    if (viewMoreBtn) {
        viewMoreBtn.onclick = (e) => {
            e.preventDefault();
            viewMoreExpanded = true;
            renderGallery(allProjects, viewMoreEnabled, limit);
        };
    }

    gallery.querySelectorAll('.album-link-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const id = this.getAttribute('data-album');
            if (id && albumData[id]) showAlbum(id);
        });
    });

    // Apply 3D tilt to newly rendered gallery items
    if (typeof init3DTilt === 'function') init3DTilt();
}

function initAlbumView() {

    // Handle close button
    const closeBtn = document.getElementById('closeAlbum');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAlbum);
    }

    // Close album on Escape key (zoom overlay takes priority)
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const zoomOverlay = document.getElementById('imageZoomOverlay');
            const albumView = document.getElementById('album-view');
            if (zoomOverlay && !zoomOverlay.classList.contains('hidden')) return;
            if (albumView && !albumView.classList.contains('hidden')) closeAlbum();
        }
    });

    // Close on click outside
    const albumView = document.getElementById('album-view');
    if (albumView) {
        albumView.addEventListener('click', function (e) {
            if (e.target === albumView) {
                closeAlbum();
            }
        });
    }
}

function showAlbum(albumId) {
    const data = albumData[albumId];
    if (!data) return;

    const albumView = document.getElementById('album-view');
    const albumTitle = document.getElementById('albumTitle');
    const albumGrid = document.getElementById('albumGrid');

    albumTitle.textContent = data.title;
    albumGrid.innerHTML = '';

    (data.photos || []).forEach(photoPath => {
        const src = resolveImageUrl(photoPath);
        const gridItem = document.createElement('div');
        gridItem.className = 'album-grid-item';
        const img = document.createElement('img');
        img.src = src;
        img.alt = data.title;
        img.loading = 'lazy';
        gridItem.appendChild(img);
        albumGrid.appendChild(gridItem);
        addImageZoomListeners(gridItem, src);
    });

    albumView.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeAlbum() {
    const albumView = document.getElementById('album-view');
    albumView.classList.add('hidden');
    document.body.style.overflow = '';
}

function addImageZoomListeners(container, imgSrc) {
    container.addEventListener('click', function (e) {
        e.stopPropagation();
        openImageZoom(imgSrc);
    });
}

function initImageZoom() {
    const overlay = document.getElementById('imageZoomOverlay');
    const zoomedImg = document.getElementById('zoomedImage');

    if (!overlay || !zoomedImg) return;

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeImageZoom();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
            closeImageZoom();
            e.stopImmediatePropagation();
        }
    });
}

function openImageZoom(src) {
    const overlay = document.getElementById('imageZoomOverlay');
    const zoomedImg = document.getElementById('zoomedImage');
    if (overlay && zoomedImg) {
        zoomedImg.src = src;
        overlay.classList.remove('hidden');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeImageZoom() {
    const overlay = document.getElementById('imageZoomOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}


// ================ STATS COUNTER ANIMATION ================
function initStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (!statNumbers.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-target'), 10);
                if (isNaN(target)) return;
                animateCounter(el, target);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.3 });

    statNumbers.forEach(el => observer.observe(el));
}

function animateCounter(el, target) {
    const duration = 2000;
    const startTime = performance.now();
    const suffix = el.textContent.replace(/[0-9]/g, '').trim();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        el.textContent = current.toLocaleString() + (suffix ? '+' : '');
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ================ TESTIMONIALS CAROUSEL ================
function initTestimonialsCarousel() {
    const cards = document.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.testimonial-dots .dot');
    const prevBtn = document.getElementById('testimonialPrev');
    const nextBtn = document.getElementById('testimonialNext');
    if (!cards.length || !dots.length) return;

    let currentSlide = 0;
    const totalSlides = cards.length;
    let autoInterval;

    function goToSlide(index) {
        currentSlide = ((index % totalSlides) + totalSlides) % totalSlides;
        cards.forEach((c, i) => c.classList.toggle('active', i === currentSlide));
        dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
    }

    function resetAutoAdvance() {
        clearInterval(autoInterval);
        autoInterval = setInterval(() => goToSlide(currentSlide + 1), 6000);
    }

    dots.forEach((dot, i) => dot.addEventListener('click', () => { goToSlide(i); resetAutoAdvance(); }));

    if (prevBtn) prevBtn.addEventListener('click', () => { goToSlide(currentSlide - 1); resetAutoAdvance(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goToSlide(currentSlide + 1); resetAutoAdvance(); });

    // Auto-advance every 6 seconds
    autoInterval = setInterval(() => goToSlide(currentSlide + 1), 6000);
}

// ================ SCROLL TO TOP ================
function initScrollToTop() {
    const btn = document.querySelector('.scroll-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 500);
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ================ FADE-UP ANIMATIONS ON SCROLL ================
function initFadeAnimations() {
    const elements = document.querySelectorAll('.fade-up');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    elements.forEach(el => observer.observe(el));
}

// ================ HERO PARTICLES ================
function initHeroParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;
    const count = 25;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'hero-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 8 + 's';
        p.style.animationDuration = (6 + Math.random() * 6) + 's';
        p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
        container.appendChild(p);
    }
}

// ================ PARALLAX HERO ================
function initParallaxHero() {
    const hero = document.querySelector('.hero-background');
    if (!hero) return;
    let ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(function () {
                const scrollY = window.scrollY;
                if (scrollY < window.innerHeight) {
                    hero.style.transform = 'translateY(' + (scrollY * 0.35) + 'px) scale(1.1)';
                }
                ticking = false;
            });
            ticking = true;
        }
    });
}

// ================ 3D TILT ON GALLERY ITEMS ================
function init3DTilt() {
    document.querySelectorAll('.gallery-item').forEach(item => {
        const img = item.querySelector('.gallery-image');
        if (!img) return;
        item.addEventListener('mousemove', function (e) {
            const rect = item.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            img.style.transform = 'rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) translateZ(10px)';
        });
        item.addEventListener('mouseleave', function () {
            img.style.transform = '';
        });
    });
}

// ================ GOLDEN CURSOR GLOW ================
function initCursorGlow() {
    const glow = document.getElementById('cursorGlow');
    if (!glow || window.innerWidth <= 768) return;
    let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;

    document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!glow.classList.contains('active')) glow.classList.add('active');
    });

    document.addEventListener('mouseleave', function () {
        glow.classList.remove('active');
    });

    function animate() {
        glowX += (mouseX - glowX) * 0.12;
        glowY += (mouseY - glowY) * 0.12;
        glow.style.left = glowX + 'px';
        glow.style.top = glowY + 'px';
        requestAnimationFrame(animate);
    }
    animate();
}

// ================ STAGGERED SCROLL REVEAL ================
function initScrollReveal() {
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    // Apply to stat items, testimonial cards, about section, contact section
    var selectors = '.stat-item, .testimonial-card, .about-content, .contact-form, .contact-info, .footer-content';
    document.querySelectorAll(selectors).forEach(function (el) {
        el.classList.add('reveal-on-scroll');
        observer.observe(el);
    });
}

// ================ ADD REVEAL TO GALLERY ON RENDER ================
(function () {
    var origRender = window.renderGallery;
    if (typeof origRender === 'function') {
        window.renderGallery = function () {
            origRender.apply(this, arguments);
            applyGalleryReveal();
        };
    }
})();

function applyGalleryReveal() {
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.gallery-item').forEach(function (el) {
        if (!el.classList.contains('reveal-on-scroll')) {
            el.classList.add('reveal-on-scroll');
            observer.observe(el);
        }
    });
}