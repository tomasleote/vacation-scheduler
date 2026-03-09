import { injectManifest } from 'workbox-build';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildSW = async () => {
    console.log('👷 Injecting precache manifest into Service Worker...');

    try {
        const { count, size } = await injectManifest({
            swSrc: path.join(__dirname, '../src/service-worker.js'),
            swDest: path.join(__dirname, '../build/service-worker.js'),
            globDirectory: path.join(__dirname, '../build'),
            globPatterns: [
                '**/*.{js,css,html,png,svg,ico,json}',
            ],
            // Don't cache the service worker itself
            globIgnores: ['service-worker.js'],
        });

        console.log(`✨ Service worker generated with ${count} precached assets (${Math.round(size / 1024)} KB)`);
    } catch (error) {
        console.error('❌ Failed to inject manifest:', error);
        process.exit(1);
    }
};

buildSW();
