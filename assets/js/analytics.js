/**
 * NEO STUDIO - Analytics & Cookie Consent Manager
 */
(function() {
  'use strict';

  // Config IDs
  const GTM_ID = 'GTM-5632ZZJN'; 
  const CLARITY_PROJECT_ID = 'xxxxxxxxxx'; // Microsoft Clarity (Optional)

  const banner = document.getElementById('cookieBanner');
  const btnAccept = document.getElementById('btnAcceptCookies');
  const btnReject = document.getElementById('btnRejectCookies');

  // Check state
  const consentState = localStorage.getItem('ns_cookie_consent');

  function showBanner() {
    if (banner) {
      setTimeout(() => {
        banner.setAttribute('aria-hidden', 'false');
        banner.classList.add('show');
      }, 1500); // 1.5 seconds delay so it feels native
    }
  }

  function hideBanner() {
    if (banner) {
      banner.classList.remove('show');
      setTimeout(() => {
        banner.setAttribute('aria-hidden', 'true');
        banner.style.display = 'none';
      }, 600);
    }
  }

  function injectAnalytics() {
    // 1. Google Tag Manager
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer', GTM_ID);

    // 2. Microsoft Clarity
    if (CLARITY_PROJECT_ID !== 'xxxxxxxxxx') {
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", CLARITY_PROJECT_ID);
    }
  }

  // Decision logic
  if (consentState === 'accepted') {
    injectAnalytics();
  } else if (consentState === 'rejected') {
    // Do nothing (respect privacy)
  } else {
    showBanner();
  }

  // Listeners
  if (btnAccept) {
    btnAccept.addEventListener('click', () => {
      localStorage.setItem('ns_cookie_consent', 'accepted');
      hideBanner();
      injectAnalytics();
    });
  }

  if (btnReject) {
    btnReject.addEventListener('click', () => {
      localStorage.setItem('ns_cookie_consent', 'rejected');
      hideBanner();
    });
  }
})();
