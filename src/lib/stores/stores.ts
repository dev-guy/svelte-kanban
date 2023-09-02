// ====================
// When not using CRDT:
/*
export const useCrdt = false;
*/

// ====================================
// When using CRDT:
// /*
// Also add the following dependencies:
// "@syncedstore/core": "0.6.0-alpha.0",
// "@syncedstore/svelte": "0.6.0-alpha.0",
// "y-webrtc": "^10.2.5"
export const useCrdt = true;
import { syncedStore, getYjsDoc } from '@syncedstore/core';
import { svelteSyncedStore } from '@syncedstore/svelte';
import { WebrtcProvider } from 'y-webrtc';
// */

import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

import { Lang } from '$lib/lang/lang.js';
import type { LangCode } from '$lib/lang/lang.js';

type Columns = {
	columns: object[];
};

export function getBoard(): Writable<Columns> {
	let obj: Writable<Columns> = getContext('board');
	if (obj) return obj;

	// ====================
	// When not using CRDT:
	/*
	if (useCrdt) throw new Error('useCrdt should be false');
	obj = writable({ columns: [] });
	*/

	// ================
	// When using CRDT:
	// /*
	// To enable the webrtc provider, run: PORT=4444 npx y-webrtc server.js
	if (!useCrdt) throw new Error('useCrdt should be true');
	const store = syncedStore({ columns: [] });
	obj = svelteSyncedStore(store) as unknown as Writable<Columns>;
	const rtc = new WebrtcProvider('svelte-kanban', getYjsDoc(store), {
		signaling: ['ws://localhost:4444']
	});
	rtc.connect();
	setContext('web-rtc', rtc);
	// */

	setContext('board', obj);
	return obj;
}

/**
 * @param {LangCode} lang?
 * @returns
 */
export function getLang(lang: LangCode = 'en'): Writable<Lang> {
	let obj: Writable<Lang> = getContext('lang');
	if (obj) return obj;
	obj = writable(new Lang(lang));
	setContext('lang', obj);
	return obj;
}
