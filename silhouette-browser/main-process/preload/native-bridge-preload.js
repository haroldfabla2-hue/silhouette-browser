const { contextBridge, ipcRenderer } = require('electron');

/**
 * Script de preload para comunicación segura entre aplicaciones web y Silhouette
 * Este script se ejecuta en un contexto aislado dentro de cada WebContentsView
 */

/**
 * API expuesta de forma segura a las aplicaciones web
 */
contextBridge.exposeInMainWorld('silhouetteAPI', {
    // Información del host
    getHostInfo: () => {
        return {
            version: '5.1.0',
            name: 'Silhouette',
            platform: process.platform,
            arch: process.arch
        };
    },
    
    // Comunicación con el host
    communicate: (message) => {
        if (typeof message === 'object' && message.type) {
            ipcRenderer.send('app-to-host', message);
        }
    },
    
    // Solicitar URL de la aplicación actual
    getCurrentUrl: () => {
        return window.location.href;
    },
    
    // Solicitar título de la ventana
    getWindowTitle: () => {
        return document.title;
    },
    
    // Detectar framework de la aplicación
    detectFramework: () => {
        const frameworks = {
            react: () => typeof window.React !== 'undefined' || document.querySelector('[data-reactroot]'),
            vue: () => typeof window.Vue !== 'undefined' || document.querySelector('#__vue'),
            angular: () => typeof window.angular !== 'undefined' || document.querySelector('[ng-app]'),
            svelte: () => document.querySelector('[data-svelte]') || typeof window.svelte !== 'undefined',
            nextjs: () => window.__NEXT_DATA__ || document.querySelector('#__next'),
            nuxt: () => window.__NUXT__ || document.querySelector('#__nuxt'),
            gatsby: () => window.__GATSBY || document.querySelector('#___gatsby'),
            webpack: () => typeof window.webpackJsonp !== 'undefined' || document.querySelector('script[src*="webpack"]'),
            vite: () => document.querySelector('script[src*="vite"]') || typeof window.__vite !== 'undefined'
        };
        
        const detected = [];
        for (const [name, detector] of Object.entries(frameworks)) {
            try {
                if (detector()) {
                    detected.push(name);
                }
            } catch (e) {
                // Silent fail for framework detection
            }
        }
        
        return detected;
    },
    
    // Obtener información de performance
    getPerformance: () => {
        if (!window.performance || !window.performance.timing) {
            return null;
        }
        
        const timing = window.performance.timing;
        const navigation = window.performance.getEntriesByType('navigation')[0];
        
        return {
            loadTime: timing.loadEventEnd - timing.navigationStart,
            domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
            firstByte: timing.responseStart - timing.navigationStart,
            dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
            tcpConnect: timing.connectEnd - timing.connectStart,
            requestResponse: timing.responseEnd - timing.requestStart,
            domProcessing: timing.domComplete - timing.domLoading,
            navigationType: navigation ? navigation.type : 'navigate'
        };
    },
    
    // Detectar errores de JavaScript
    getJavaScriptErrors: () => {
        const errors = [];
        
        // Capturar errores futuros
        window.addEventListener('error', (event) => {
            errors.push({
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : null,
                timestamp: Date.now()
            });
        });
        
        // Capturar errores de promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            errors.push({
                message: 'Unhandled promise rejection',
                reason: event.reason,
                stack: event.reason && event.reason.stack,
                timestamp: Date.now()
            });
        });
        
        return errors;
    },
    
    // Notificar cambios de estado
    notifyStateChange: (state) => {
        if (typeof state === 'object') {
            ipcRenderer.send('state-change', state);
        }
    },
    
    // Solicitar hot reload
    requestHotReload: () => {
        ipcRenderer.send('hot-reload-request');
    },
    
    // Configurar auto-refresh
    setupAutoRefresh: (interval = 5000) => {
        setInterval(() => {
            // Verificar si hay cambios en los archivos fuente
            ipcRenderer.send('check-updates');
        }, interval);
    },
    
    // Obtener información del viewport
    getViewportInfo: () => {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            orientation: screen.orientation ? screen.orientation.type : 'unknown'
        };
    },
    
    // Configurar notificaciones del host
    onHostMessage: (callback) => {
        if (typeof callback === 'function') {
            ipcRenderer.on('host-to-app', (event, message) => {
                callback(message);
            });
        }
    },
    
    // Configurar callbacks de eventos
    on: (event, callback) => {
        if (typeof event === 'string' && typeof callback === 'function') {
            switch (event) {
                case 'load':
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', callback);
                    } else {
                        callback();
                    }
                    break;
                    
                case 'error':
                    window.addEventListener('error', callback);
                    break;
                    
                case 'unhandledrejection':
                    window.addEventListener('unhandledrejection', callback);
                    break;
                    
                default:
                    ipcRenderer.on(`app-event-${event}`, (event, data) => callback(data));
            }
        }
    },
    
    // Remover listeners
    off: (event, callback) => {
        if (typeof event === 'string') {
            switch (event) {
                case 'error':
                    window.removeEventListener('error', callback);
                    break;
                    
                case 'unhandledrejection':
                    window.removeEventListener('unhandledrejection', callback);
                    break;
                    
                default:
                    ipcRenderer.removeAllListeners(`app-event-${event}`);
            }
        }
    }
});

/**
 * Configuración automática de la aplicación
 */
document.addEventListener('DOMContentLoaded', () => {
    // Detectar framework automáticamente
    const frameworks = window.silhouetteAPI.detectFramework();
    
    // Notificar al host que la aplicación está lista
    window.silhouetteAPI.communicate({
        type: 'app_loaded',
        timestamp: Date.now(),
        url: window.location.href,
        title: document.title,
        frameworks: frameworks,
        userAgent: navigator.userAgent
    });
    
    // Configurar hot reload para frameworks que lo soporten
    if (frameworks.includes('react') || frameworks.includes('vue') || frameworks.includes('angular')) {
        // Configurar WebSocket para hot reload si no existe
        if (typeof WebSocket !== 'undefined' && !window.__SILHOUETTE_HOT_RELOAD__) {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = window.location.hostname;
            const wsPort = process.env.SILHOUETTE_WS_PORT || '35729';
            
            try {
                const ws = new WebSocket(`${wsProtocol}//${wsHost}:${wsPort}/hot-reload`);
                
                ws.onopen = () => {
                    console.log('🔄 Silhouette Hot Reload conectado');
                    window.__SILHOUETTE_HOT_RELOAD__ = ws;
                };
                
                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'reload') {
                            window.location.reload();
                        } else if (data.type === 'hmr' && data.path) {
                            // Hot Module Replacement
                            window.location.reload();
                        }
                    } catch (e) {
                        // Fallback a reload simple
                        window.location.reload();
                    }
                };
                
                ws.onerror = (error) => {
                    console.warn('⚠️ Error conectando hot reload:', error);
                };
                
                ws.onclose = () => {
                    console.log('🔌 Silhouette Hot Reload desconectado');
                    window.__SILHOUETTE_HOT_RELOAD__ = null;
                };
                
            } catch (error) {
                console.warn('⚠️ WebSocket no disponible para hot reload');
            }
        }
    }
    
    // Configurar monitoreo de errores
    window.silhouetteAPI.getJavaScriptErrors();
    
    // Configurar notificaciones de estado
    let lastState = {
        url: window.location.href,
        title: document.title,
        ready: document.readyState
    };
    
    // Monitorear cambios de estado
    const observer = new MutationObserver(() => {
        const currentState = {
            url: window.location.href,
            title: document.title,
            ready: document.readyState
        };
        
        if (JSON.stringify(currentState) !== JSON.stringify(lastState)) {
            window.silhouetteAPI.notifyStateChange(currentState);
            lastState = currentState;
        }
    });
    
    observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
    });
    
    // Notificar cambios de URL (SPA navigation)
    let lastUrl = window.location.href;
    setInterval(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            window.silhouetteAPI.communicate({
                type: 'url_change',
                oldUrl: lastUrl,
                newUrl: currentUrl,
                timestamp: Date.now()
            });
            lastUrl = currentUrl;
        }
    }, 1000);
    
    // Configurar auto-refresh opcional
    const autoRefreshInterval = parseInt(process.env.SILHOUETTE_AUTO_REFRESH || '0');
    if (autoRefreshInterval > 0) {
        window.silhouetteAPI.setupAutoRefresh(autoRefreshInterval);
    }
    
    console.log('🚀 Silhouette API inicializada');
});

/**
 * Manejo de mensajes del host
 */
window.silhouetteAPI.onHostMessage((message) => {
    switch (message.type) {
        case 'refresh':
            window.location.reload();
            break;
            
        case 'focus':
            window.focus();
            break;
            
        case 'minimize':
            // La aplicación no puede minimizarse a sí misma
            break;
            
        case 'maximize':
            // La aplicación no puede maximizarse a sí misma
            break;
            
        case 'set_title':
            if (message.title && typeof message.title === 'string') {
                document.title = message.title;
            }
            break;
            
        case 'execute_script':
            if (message.script && typeof message.script === 'string') {
                try {
                    eval(message.script);
                } catch (error) {
                    console.error('Error ejecutando script del host:', error);
                }
            }
            break;
            
        case 'navigate':
            if (message.url && typeof message.url === 'string') {
                window.location.href = message.url;
            }
            break;
            
        default:
            console.log('Mensaje del host:', message);
    }
});

/**
 * API de desarrollo para testing
 */
if (process.env.NODE_ENV === 'development') {
    window.silhouetteDevTools = {
        // Herramientas de debugging
        getAppInfo: () => {
            return {
                url: window.location.href,
                title: document.title,
                frameworks: window.silhouetteAPI.detectFramework(),
                performance: window.silhouetteAPI.getPerformance(),
                viewport: window.silhouetteAPI.getViewportInfo(),
                userAgent: navigator.userAgent
            };
        },
        
        // Simular eventos
        simulateError: () => {
            throw new Error('Error simulado desde herramientas de desarrollo');
        },
        
        simulateSlowLoad: (ms = 5000) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    console.log('Carga simulada completada');
                    resolve();
                }, ms);
            });
        },
        
        // Capturar métricas
        captureMetrics: () => {
            const timing = performance.timing;
            return {
                totalLoadTime: timing.loadEventEnd - timing.navigationStart,
                domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
                firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint'),
                firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')
            };
        }
    };
}

console.log('🎯 Preload script de Silhouette cargado');