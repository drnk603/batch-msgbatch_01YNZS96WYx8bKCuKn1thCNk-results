(function() {
  'use strict';

  if (typeof window.__app === 'undefined') {
    window.__app = {};
  }

  var app = window.__app;

  function debounce(fn, delay) {
    var timer;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() {
        fn.apply(context, args);
      }, delay);
    };
  }

  function throttle(fn, limit) {
    var waiting = false;
    return function() {
      if (!waiting) {
        fn.apply(this, arguments);
        waiting = true;
        setTimeout(function() {
          waiting = false;
        }, limit);
      }
    };
  }

  function initAOS() {
    if (app.aosInitialized) return;
    app.aosInitialized = true;

    if (typeof window.AOS !== 'undefined') {
      var elementsWithAvoidLayout = document.querySelectorAll('[data-aos][data-avoid-layout="true"]');
      for (var i = 0; i < elementsWithAvoidLayout.length; i++) {
        elementsWithAvoidLayout[i].removeAttribute('data-aos');
      }

      window.AOS.init({
        once: false,
        duration: 600,
        easing: 'ease-out',
        offset: 120,
        mirror: false,
        disable: function() {
          return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
      });
    }

    app.refreshAOS = function() {
      try {
        if (typeof window.AOS !== 'undefined' && window.AOS.refresh) {
          window.AOS.refresh();
        }
      } catch (e) {}
    };
  }

  function initBurgerMenu() {
    if (app.burgerInitialized) return;
    app.burgerInitialized = true;

    var nav = document.querySelector('.c-nav#main-nav');
    var toggle = document.querySelector('.c-nav__toggle');
    var navList = document.querySelector('.c-nav__list');

    if (!nav || !toggle || !navList) return;

    var focusableElements = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function openMenu() {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('u-no-scroll');
      trapFocus();
    }

    function closeMenu() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('u-no-scroll');
    }

    function trapFocus() {
      var focusables = navList.querySelectorAll(focusableElements);
      if (focusables.length === 0) return;

      var firstFocusable = focusables[0];
      var lastFocusable = focusables[focusables.length - 1];

      firstFocusable.focus();

      navList.addEventListener('keydown', function(e) {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      });
    }

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      if (nav.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
      }
    });

    document.addEventListener('click', function(e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target)) {
        closeMenu();
      }
    });

    var navLinks = document.querySelectorAll('.c-nav__link');
    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function() {
        closeMenu();
      });
    }

    var resizeHandler = debounce(function() {
      if (window.innerWidth >= 1024 && nav.classList.contains('is-open')) {
        closeMenu();
      }
    }, 100);

    window.addEventListener('resize', resizeHandler, { passive: true });
  }

  function initAnchorsAndScroll() {
    if (app.anchorsInitialized) return;
    app.anchorsInitialized = true;

    var isHomePage = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');

    var anchorLinks = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < anchorLinks.length; i++) {
      var link = anchorLinks[i];
      var href = link.getAttribute('href');

      if (href === '#' || href === '#!') continue;

      if (!isHomePage && href.charAt(0) === '#' && !link.hasAttribute('data-keep-hash')) {
        link.setAttribute('href', '/' + href);
      }

      link.addEventListener('click', function(e) {
        var targetHref = this.getAttribute('href');
        var hashIndex = targetHref.indexOf('#');

        if (hashIndex === -1) return;

        var hash = targetHref.substring(hashIndex + 1);
        if (!hash || hash === '!') return;

        var isCurrentPage = hashIndex === 0 || targetHref.substring(0, hashIndex) === window.location.pathname;

        if (isCurrentPage) {
          e.preventDefault();
          var target = document.getElementById(hash);
          if (target) {
            var header = document.querySelector('.l-header');
            var headerHeight = header ? header.offsetHeight : 80;
            var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });

            history.pushState(null, null, '#' + hash);
          }
        }
      });
    }
  }

  function initActiveMenuState() {
    if (app.activeMenuInitialized) return;
    app.activeMenuInitialized = true;

    var currentPath = window.location.pathname;
    var navLinks = document.querySelectorAll('.c-nav__link');

    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      var linkPath = link.getAttribute('href');

      if (!linkPath) continue;

      var linkPathClean = linkPath.split('#')[0];

      var isMatch = false;

      if (currentPath === '/' || currentPath.endsWith('/index.html')) {
        if (linkPathClean === '/' || linkPathClean === '/index.html' || linkPathClean === 'index.html') {
          isMatch = true;
        }
      } else {
        if (linkPathClean && (currentPath === linkPathClean || currentPath.endsWith(linkPathClean))) {
          isMatch = true;
        }
      }

      if (isMatch) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('active');
      }
    }
  }

  function initImages() {
    if (app.imagesInitialized) return;
    app.imagesInitialized = true;

    var images = document.querySelectorAll('img');

    for (var i = 0; i < images.length; i++) {
      var img = images[i];

      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      if (!img.hasAttribute('loading') && !img.classList.contains('c-logo__img') && !img.hasAttribute('data-critical')) {
        img.setAttribute('loading', 'lazy');
      }

      img.addEventListener('error', function() {
        var fallbackSVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTllOWU5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
        this.src = fallbackSVG;
        this.style.objectFit = 'contain';

        if (this.closest('.c-logo') || this.classList.contains('c-logo__img')) {
          this.style.maxHeight = '40px';
        }
      });
    }
  }

  function initForms() {
    if (app.formsInitialized) return;
    app.formsInitialized = true;

    var forms = document.querySelectorAll('.needs-validation');

    app.notify = function(message, type) {
      var container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.maxWidth = '350px';
        document.body.appendChild(container);
      }

      var toast = document.createElement('div');
      toast.className = 'alert alert-' + (type || 'info') + ' alert-dismissible fade show';
      toast.setAttribute('role', 'alert');
      toast.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';

      container.appendChild(toast);

      setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 150);
      }, 5000);
    };

    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();

        var form = this;

        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }

        var submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          var originalText = submitBtn.innerHTML;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Bezig met verzenden...';

          var formData = new FormData(form);
          var data = {};
          formData.forEach(function(value, key) {
            data[key] = value;
          });

          fetch('process.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
          .then(function(response) {
            return response.json();
          })
          .then(function(result) {
            if (result.success) {
              app.notify('Uw bericht is succesvol verzonden!', 'success');
              form.reset();
              form.classList.remove('was-validated');
            } else {
              app.notify(result.message || 'Er is een fout opgetreden. Probeer het later opnieuw.', 'danger');
            }
          })
          .catch(function() {
            app.notify('Er is een fout opgetreden. Controleer uw internetverbinding en probeer het opnieuw.', 'danger');
          })
          .finally(function() {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalText;
            }
          });
        }
      }, false);
    }
  }

  function initAnimeInteractions() {
    if (app.animeInitialized) return;
    app.animeInitialized = true;

    if (typeof window.anime === 'undefined') return;

    var selectors = ['.card', '.feature-card', '.animal-card', '.btn-primary', '.btn-success'];
    var elements = document.querySelectorAll(selectors.join(','));

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];

      el.addEventListener('mouseenter', function() {
        window.anime({
          targets: this,
          scale: 1.02,
          opacity: 0.95,
          duration: 300,
          easing: 'easeOutQuad'
        });
      });

      el.addEventListener('mouseleave', function() {
        window.anime({
          targets: this,
          scale: 1,
          opacity: 1,
          duration: 300,
          easing: 'easeOutQuad'
        });
      });
    }
  }

  function initMobileFlexGaps() {
    if (app.mobileGapsInitialized) return;
    app.mobileGapsInitialized = true;

    function applyMobileGaps() {
      var isMobile = window.innerWidth < 576;
      var flexElements = document.querySelectorAll('.d-flex');

      for (var i = 0; i < flexElements.length; i++) {
        var el = flexElements[i];
        var hasGap = false;

        for (var j = 0; j < el.classList.length; j++) {
          if (el.classList[j].match(/^(gap-|g-)/)) {
            hasGap = true;
            break;
          }
        }

        if (!hasGap && el.children.length > 1) {
          if (isMobile) {
            if (!el.classList.contains('gap-3')) {
              el.classList.add('gap-3');
              el.setAttribute('data-mobile-gap-added', 'true');
            }
          } else {
            if (el.getAttribute('data-mobile-gap-added') === 'true') {
              el.classList.remove('gap-3');
              el.removeAttribute('data-mobile-gap-added');
            }
          }
        }
      }
    }

    applyMobileGaps();

    var resizeHandler = debounce(function() {
      applyMobileGaps();
    }, 100);

    window.addEventListener('resize', resizeHandler, { passive: true });
  }

  app.init = function() {
    initAOS();
    initBurgerMenu();
    initAnchorsAndScroll();
    initActiveMenuState();
    initImages();
    initForms();
    initAnimeInteractions();
    initMobileFlexGaps();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }

})();