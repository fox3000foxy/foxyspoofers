class SpoofAttributes {
    constructor() {
        this.attrs = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            tzOffset: new Date().getTimezoneOffset(),
            screenRes: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            outer: `${window.outerWidth}x${window.outerHeight}`,
            plugins: navigator.plugins ? Array.from(navigator.plugins).map(p=>p.name).join(',') : '',
            mimeTypes: navigator.mimeTypes ? Array.from(navigator.mimeTypes).map(m=>m.type).join(',') : '',
            connection: navigator.connection ? navigator.connection.type : '',
            deviceMemory: navigator.deviceMemory || '',
            cpuThreads: navigator.hardwareConcurrency || '',
            // Avancés
            webglVendor: (function() {
                try {
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    const debugInfo = gl && gl.getExtension('WEBGL_debug_renderer_info');
                    return debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
                } catch { return ''; }
            })(),
            webglRenderer: (function() {
                try {
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    const debugInfo = gl && gl.getExtension('WEBGL_debug_renderer_info');
                    return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
                } catch { return ''; }
            })(),
            audioFp: '', // Non trivial à obtenir côté JS natif
            batteryLevel: (navigator.getBattery ? '' : ''), // async, à remplir dynamiquement si besoin
            maxTouch: navigator.maxTouchPoints || 0,
            pointerType: window.PointerEvent ? 'mouse' : '',
            speechVoices: (window.speechSynthesis && window.speechSynthesis.getVoices) ? window.speechSynthesis.getVoices().map(v=>v.lang).join(',') : '',
            speechLang: navigator.language,
            clipboardContent: '', // Non accessible par défaut
            perfOffset: 0,
            webdriver: navigator.webdriver || false,
            rafJitter: 0,
            canvasFp: '', // Non trivial à obtenir côté JS natif
            webrtcIp: '', // Non accessible par défaut
            discordNonce: '',
            keydownTiming: '',
            mouseMove: '',
            scrollTiming: '',
            notifPerm: Notification && Notification.permission ? Notification.permission : '',
            availScreen: `${screen.availWidth}x${screen.availHeight}`,
            wsSpoof: '',
            fetchSpoof: '',
            fontsSpoof: (document.fonts && document.fonts.size) ? Array.from(document.fonts).map(f=>f.family).join(',') : '',
            localstorageSpoof: '', // Non trivial à lister proprement
            deviceOrientation: '', // Non accessible par défaut
            touchPressure: '',
            mediaCap: '', // Non trivial à obtenir
            gamepadSpoof: (navigator.getGamepads && navigator.getGamepads()[0]) ? navigator.getGamepads()[0].id : '',
            wasmEnv: (typeof WebAssembly === "object") ? navigator.platform : '',
        };
    }
    get(attr) { return this.attrs[attr]; }
    set(attr, value) { this.attrs[attr] = value; }
}
window.spoofAttrs = new SpoofAttributes();