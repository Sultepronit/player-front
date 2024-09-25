const VitePWAOptions = {
    registerType: 'autoUpdate',
    // devOptions: { endabled: true },
    includeAssets: ['favicon.ico'],
    manifest: {
        "name": "My Music",
        "short_name": "My Music",
        "icons": [
            {
            "src": "/pwa-192x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
            },
            {
            "src": "/pwa-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
            },
            {
            "src": "/pwa-maskable-192x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "maskable"
            },
            {
            "src": "/pwa-maskable-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
            }
        ],
        "start_url": "/",
        "display": "standalone",
        "background_color": "#FFFFFF",
        "theme_color": "#01AE07",
        "description": "My web based music player"
    },
    workbox: {
        runtimeCaching: [
            {
                urlPattern: ({ request }) => request.destination === 'audio',
                handler: 'CacheFirst',
                options: {
                    cacheName: 'music-cache',
                    expiration: {
                        maxAgeSeconds: 60 * 60 * 24 * 365
                    }
                }
            }
        ]
    }
}

export default VitePWAOptions;