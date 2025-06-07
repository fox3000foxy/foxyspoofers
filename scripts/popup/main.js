Preloader.show();
fetch(chrome.runtime.getURL('popup/popup.css'))
.then(cssResponse => cssResponse.text())
.then(css => {
    fetch(chrome.runtime.getURL('popup/popup.html'))
    .then(response => response.text())
    .then(html => {
        document.documentElement.innerHTML = html.replace('${domain}', window.location.hostname);
        document.documentElement.innerHTML = html.replaceAll('${iconUrl}', chrome.runtime.getURL('icons/icon.png'));
        
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = chrome.runtime.getURL('icons/icon.png');
        document.head.appendChild(link);

        Preloader.hide();
        new VirtualCameraApp();
    });
});