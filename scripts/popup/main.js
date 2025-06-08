Preloader.show();
fetch(chrome.runtime.getURL('popup/popup.css'))
.then(cssResponse => cssResponse.text())
.then(css => {
    fetch(chrome.runtime.getURL('popup/popup.html'))
    .then(response => response.text())
    .then(html => {
        let processedHtml = html.replace('{domain}', window.location.hostname);
        processedHtml = processedHtml.replaceAll('{extensionPath}', chrome.runtime.getURL('background.js').split('/').slice(0, -1).join('/'));
        document.documentElement.innerHTML = processedHtml;
        
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = chrome.runtime.getURL('icons/icon.png');
        document.head.appendChild(link);

        document.getElementById('ua-string').placeholder = spoofAttrs.get('userAgent');
        document.getElementById('lang-string').placeholder = spoofAttrs.get('language');
        document.getElementById('languages-string').placeholder = JSON.stringify(spoofAttrs.get('languages'));
        document.getElementById('tz-string').placeholder = spoofAttrs.get('timezone');
        document.getElementById('tz-offset').placeholder = spoofAttrs.get('tzOffset');
        document.getElementById('screen-res').placeholder = spoofAttrs.get('screenRes');
        document.getElementById('color-depth').placeholder = spoofAttrs.get('colorDepth');
        document.getElementById('window-outer').placeholder = spoofAttrs.get('outer');
        document.getElementById('plugins').placeholder = spoofAttrs.get('plugins');
        document.getElementById('mimetypes').placeholder = spoofAttrs.get('mimeTypes');
        document.getElementById('connection-type').placeholder = spoofAttrs.get('connection');
        document.getElementById('device-memory').placeholder = spoofAttrs.get('deviceMemory');
        document.getElementById('cpu-threads').placeholder = spoofAttrs.get('cpuThreads');

        let userAgents = [];
        fetch(chrome.runtime.getURL('data/user-agents.json'))
        .then(uaResponse => uaResponse.json())
        .then(data => {
            userAgents = data;
            updateUaList('');
        });

        const uaInput = document.getElementById('ua-string');
        const uaSelect = document.getElementById('ua-list');

        function updateUaList(filter) {
            uaSelect.innerHTML = '';
            userAgents
            .filter(ua => ua.toLowerCase().includes(filter.toLowerCase()))
            .map(ua => ua.trim())
            .map(ua => ua.replace(/^\s+|\s+$/g, '')) // Trim spaces
            .slice(0, 100)
            .forEach(ua => {
                const option = document.createElement('option');
                option.value = ua;
                option.textContent = ua;
                uaSelect.appendChild(option);
            });
        }

        uaInput.addEventListener('input', (e) => {
            setTimeout(() => {
                updateUaList(e.target.value);
            }, 300);
        });

        Preloader.hide();
        new VirtualCameraApp();
    });
});
