const scriptGum = document.createElement('script');
scriptGum.src = chrome.runtime.getURL('inject-gum.js');
(document.head || document.documentElement).appendChild(scriptGum);

const scriptGeo = document.createElement('script');
scriptGeo.src = chrome.runtime.getURL('inject-geo.js');
(document.head || document.documentElement).appendChild(scriptGeo);

console.log('Virtual Camera content script injected');
console.log('Virtual Camera Geo Spoofing content script injected');