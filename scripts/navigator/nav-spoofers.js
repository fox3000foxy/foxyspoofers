import { NavSpoofSettings } from './nav-spoof-settings.js';

export class NavSpoofers {
    constructor() {
        this.settings = null;
    }

    async override() {
        this.settings = await NavSpoofSettings.fetch();
        console.log('[NavSpoofer] Settings:', this.settings);
        if (!this.settings || !JSON.parse(this.settings.enabled)) return;

        // User-Agent
        if (this.settings.ua) {
            try {
                Object.defineProperty(navigator, 'userAgent', {
                    get: () => this.settings.ua,
                    configurable: true
                });
                window.navigator.__defineGetter__('userAgent', () => this.settings.ua);
            } catch (e) {}
        }

        // Langue principale
        if (this.settings.language) {
            try {
                Object.defineProperty(navigator, 'language', {
                    get: () => this.settings.language,
                    configurable: true
                });
            } catch (e) {}
        }

        // Languages (tableau ou string)
        if (this.settings.languages) {
            let langs = this.settings.languages;
            try {
                if (typeof langs === "string") langs = JSON.parse(langs);
            } catch {}
            if (!Array.isArray(langs)) langs = [langs];
            try {
                Object.defineProperty(navigator, 'languages', {
                    get: () => langs,
                    configurable: true
                });
            } catch (e) {}
        }

        // Timezone (Intl)
        if (this.settings.timezone) {
            try {
                const orig = Intl.DateTimeFormat;
                Intl.DateTimeFormat = function(...args) {
                    const dtf = new orig(...args);
                    const origResolved = dtf.resolvedOptions;
                    dtf.resolvedOptions = function() {
                        const opts = origResolved.call(this);
                        opts.timeZone = this.settings.timezone;
                        return opts;
                    }.bind(this);
                    return dtf;
                }.bind(this);
            } catch (e) {}
        }

        // Décalage timezone (Date)
        if (this.settings.tzOffset) {
            try {
                const offset = parseInt(this.settings.tzOffset, 10);
                const origGetTimezoneOffset = Date.prototype.getTimezoneOffset;
                Date.prototype.getTimezoneOffset = function() {
                    return -offset;
                };
            } catch (e) {}
        }

        // Résolution écran
        if (this.settings.screenRes) {
            try {
                const [width, height] = this.settings.screenRes.split('x').map(Number);
                Object.defineProperty(window.screen, 'width', { get: () => width, configurable: true });
                Object.defineProperty(window.screen, 'height', { get: () => height, configurable: true });
            } catch (e) {}
        }

        // Profondeur couleur
        if (this.settings.colorDepth) {
            try {
                Object.defineProperty(window.screen, 'colorDepth', {
                    get: () => Number(this.settings.colorDepth),
                    configurable: true
                });
            } catch (e) {}
        }

        // Outer window
        if (this.settings.outer) {
            try {
                const [w, h] = this.settings.outer.split('x').map(Number);
                Object.defineProperty(window, 'outerWidth', { get: () => w, configurable: true });
                Object.defineProperty(window, 'outerHeight', { get: () => h, configurable: true });
            } catch (e) {}
        }

        // Plugins (faux tableau)
        if (this.settings.plugins) {
            try {
                Object.defineProperty(navigator, 'plugins', {
                    get: () => this.settings.plugins.split(','),
                    configurable: true
                });
            } catch (e) {}
        }

        // MimeTypes (faux tableau)
        if (this.settings.mimeTypes) {
            try {
                Object.defineProperty(navigator, 'mimeTypes', {
                    get: () => this.settings.mimeTypes.split(','),
                    configurable: true
                });
            } catch (e) {}
        }

        // Connection type
        if (this.settings.connection) {
            try {
                if (navigator.connection) {
                    Object.defineProperty(navigator.connection, 'type', {
                        get: () => this.settings.connection,
                        configurable: true
                    });
                }
            } catch (e) {}
        }

        // Mémoire device
        if (this.settings.deviceMemory) {
            try {
                Object.defineProperty(navigator, 'deviceMemory', {
                    get: () => Number(this.settings.deviceMemory),
                    configurable: true
                });
            } catch (e) {}
        }

        // Threads CPU
        if (this.settings.cpuThreads) {
            try {
                Object.defineProperty(navigator, 'hardwareConcurrency', {
                    get: () => Number(this.settings.cpuThreads),
                    configurable: true
                });
            } catch (e) {}
        }
    }
}