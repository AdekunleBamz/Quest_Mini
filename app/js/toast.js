/**
 * Quest Mini App - Toast Notification System
 * Lightweight toast notification manager
 */

class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.defaultOptions = {
            duration: 5000,
            position: 'top-right',
            closable: true,
            showProgress: true
        };
    }

    /**
     * Initialize toast container
     */
    init() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.className = 'toast-container toast-container--top-right';
        document.body.appendChild(this.container);
    }

    /**
     * Create and show a toast
     * @param {Object} options - Toast options
     * @returns {string} Toast ID
     */
    show(options) {
        this.init();
        
        const id = this.generateId();
        const config = { ...this.defaultOptions, ...options, id };
        
        const toast = this.createToastElement(config);
        this.container.appendChild(toast);
        this.toasts.push({ id, element: toast, config });
        
        if (config.duration > 0) {
            setTimeout(() => this.dismiss(id), config.duration);
        }
        
        return id;
    }

    /**
     * Create toast DOM element
     * @param {Object} config - Toast configuration
     * @returns {HTMLElement} Toast element
     */
    createToastElement(config) {
        const toast = document.createElement('div');
        toast.className = `toast toast--${config.type || 'info'}`;
        toast.dataset.id = config.id;
        
        // Icon
        const icon = document.createElement('div');
        icon.className = 'toast-icon';
        icon.textContent = this.getIcon(config.type);
        toast.appendChild(icon);
        
        // Content
        const content = document.createElement('div');
        content.className = 'toast-content';
        
        if (config.title) {
            const title = document.createElement('h4');
            title.className = 'toast-title';
            title.textContent = config.title;
            content.appendChild(title);
        }
        
        if (config.message) {
            const message = document.createElement('p');
            message.className = 'toast-message';
            message.textContent = config.message;
            content.appendChild(message);
        }
        
        // Transaction link
        if (config.txHash) {
            const link = document.createElement('a');
            link.className = 'tx-link';
            link.href = `https://basescan.org/tx/${config.txHash}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'View on Explorer →';
            content.appendChild(link);
        }
        
        toast.appendChild(content);
        
        // Close button
        if (config.closable) {
            const close = document.createElement('button');
            close.className = 'toast-close';
            close.textContent = '×';
            close.onclick = () => this.dismiss(config.id);
            toast.appendChild(close);
        }
        
        // Progress bar
        if (config.showProgress && config.duration > 0) {
            const progress = document.createElement('div');
            progress.className = 'toast-progress';
            progress.style.animationDuration = `${config.duration}ms`;
            toast.appendChild(progress);
        }
        
        return toast;
    }

    /**
     * Get icon for toast type
     * @param {string} type - Toast type
     * @returns {string} Icon character
     */
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
            transaction: '↗'
        };
        return icons[type] || icons.info;
    }

    /**
     * Dismiss a toast
     * @param {string} id - Toast ID
     */
    dismiss(id) {
        const index = this.toasts.findIndex(t => t.id === id);
        if (index === -1) return;
        
        const { element } = this.toasts[index];
        element.classList.add('toast--exiting');
        
        setTimeout(() => {
            element.remove();
            this.toasts.splice(index, 1);
        }, 200);
    }

    /**
     * Dismiss all toasts
     */
    dismissAll() {
        [...this.toasts].forEach(t => this.dismiss(t.id));
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Convenience methods
    success(message, title = 'Success') {
        return this.show({ type: 'success', message, title });
    }

    error(message, title = 'Error') {
        return this.show({ type: 'error', message, title, duration: 8000 });
    }

    warning(message, title = 'Warning') {
        return this.show({ type: 'warning', message, title });
    }

    info(message, title = 'Info') {
        return this.show({ type: 'info', message, title });
    }

    transaction(txHash, message = 'Transaction submitted') {
        return this.show({
            type: 'transaction',
            title: 'Transaction',
            message,
            txHash,
            duration: 10000
        });
    }
}

// Export singleton instance
export const toast = new ToastManager();
export default toast;
