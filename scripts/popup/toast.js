class Toast {
    static show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: type === 'success' ? '#10b981' : 
                            type === 'error' ? '#ef4444' : '#667eea',
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
        });
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.transform = 'translateX(0)'; }, 100);
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => { toast.remove(); }, 300);
        }, 3000);
    }
}
window.Toast = Toast;