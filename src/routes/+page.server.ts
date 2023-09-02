import { useCrdt } from '$lib/stores/stores.js';

// WebRTC doesn't work with SSR
export const ssr = !useCrdt;
