import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '$lib': path.resolve(__dirname, './src/lib')
        }
    },
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./vitest.setup.js'],
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
