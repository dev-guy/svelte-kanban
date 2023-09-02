import { useCrdt } from '$lib/stores/stores.ts';

// WebRTC doesn't work with SSR
export const ssr = !useCrdt;
