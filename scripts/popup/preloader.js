class Preloader {
    static show() {
        const preloader = document.createElement('div');
        preloader.id = 'preloader';
        preloader.innerHTML = `
            <div class="preloader-spinner"></div>
            <div class="preloader-text">Loading Virtual Camera...</div>
        `;
        Object.assign(preloader.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(135deg, #23293a 0, #374151 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999
        });
        const style = document.createElement('style');
        style.textContent = `

        * {
            overflow: auto;
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE 10+ */
        }
        *::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
        }
        #preloader .preloader-spinner {
            width: 56px;
            height: 56px;
            border: 6px solid #667eea;
            border-top: 6px solid #a5b4fc;
            border-radius: 50%;
            animation: preloader-spin 1s linear infinite;
            margin-bottom: 24px;
        }
        #preloader .preloader-text {
            color: #fff;
            font-size: 1.2em;
            font-weight: 600;
            letter-spacing: 0.02em;
            text-shadow: 0 2px 8px rgba(30,41,59,0.2);
        }
        @keyframes preloader-spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
        }
        `;
        (document.head || document.documentElement).appendChild(style);
        (document.body || document.documentElement).appendChild(preloader);
    }
    static hide() {
        const preloader = document.getElementById('preloader');
        if (preloader) preloader.remove();
    }
}

window.Preloader = Preloader;