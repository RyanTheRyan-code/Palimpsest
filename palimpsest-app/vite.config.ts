import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// Allow Ngrok to forward traffic to this server
		allowedHosts: [
			'localhost',
			'.ngrok-free.app' 
		],
        // Alternatively, use true to allow everything (easiest for dev)
        // allowedHosts: true, 
	}
});