// COMPREHENSIVE WINDOW TRACKING FOR 404 DEBUGGING

// Track all navigation events
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  console.log('🔍 TRACKING: history.pushState called with:', args);
  console.log('🔍 TRACKING: Current URL before pushState:', window.location.href);
  const result = originalPushState.apply(this, args);
  console.log('🔍 TRACKING: URL after pushState:', window.location.href);
  return result;
};

history.replaceState = function(...args) {
  console.log('🔍 TRACKING: history.replaceState called with:', args);
  console.log('🔍 TRACKING: Current URL before replaceState:', window.location.href);
  const result = originalReplaceState.apply(this, args);
  console.log('🔍 TRACKING: URL after replaceState:', window.location.href);
  return result;
};

// Track popstate events
window.addEventListener('popstate', (event) => {
  console.log('🔍 TRACKING: popstate event fired');
  console.log('🔍 TRACKING: popstate event state:', event.state);
  console.log('🔍 TRACKING: Current URL after popstate:', window.location.href);
});

// Track beforeunload events
window.addEventListener('beforeunload', (event) => {
  console.log('🔍 TRACKING: beforeunload event fired');
  console.log('🔍 TRACKING: Current URL during beforeunload:', window.location.href);
});

// Track URL changes
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (lastUrl !== window.location.href) {
    console.log('🔍 TRACKING: URL changed from', lastUrl, 'to', window.location.href);
    lastUrl = window.location.href;
  }
});

observer.observe(document, { subtree: true, childList: true });

// Track window.location assignments
let originalLocationHref = window.location.href;
Object.defineProperty(window.location, 'href', {
  get: function() {
    return originalLocationHref;
  },
  set: function(value) {
    console.log('🔍 TRACKING: window.location.href being set to:', value);
    console.log('🔍 TRACKING: Current URL before redirect:', originalLocationHref);
    originalLocationHref = value;
    window.location.replace(value);
  }
});

// Track service worker events
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('🔍 TRACKING: Service worker message:', event.data);
  });
  
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    console.log('🔍 TRACKING: Active service workers:', registrations.length);
    registrations.forEach((registration, index) => {
      console.log(`🔍 TRACKING: SW ${index}:`, registration.scope);
    });
  });
}

// Track fetch requests to catch service worker interceptions
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🔍 TRACKING: Fetch request:', args[0]);
  return originalFetch.apply(this, args).catch((error) => {
    console.log('🔍 TRACKING: Fetch error:', error, 'for request:', args[0]);
    throw error;
  });
};

// Track any 404 errors in network requests
window.addEventListener('error', (event) => {
  console.log('🔍 TRACKING: Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.log('🔍 TRACKING: Unhandled rejection:', event.reason);
});

console.log('🔍 TRACKING: Window tracking initialized');