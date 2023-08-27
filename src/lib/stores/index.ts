import { syncedStore, getYjsDoc } from "@syncedstore/core";
import { svelteSyncedStore } from "@syncedstore/svelte";
import { WebrtcProvider } from "y-webrtc";

import { getContext, setContext } from "svelte";
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

import { Lang } from '$lib/lang/index.ts';
import type { LangCode } from '$lib/lang/index.ts';

type Columns = {
	columns: object[];
};

export const isCrdt = true;

export function getBoard() : Writable<Columns> {
	let obj: Writable<Columns> = getContext('board');
	if (obj) return obj;

	const store = syncedStore( { columns: [] });
	obj = svelteSyncedStore(store) as unknown as Writable<Columns>;
	const rtc = new WebrtcProvider('svelte-kanban', getYjsDoc(store), {signaling: ['ws://localhost:4444']});
	rtc.connect();
	setContext('web-rtc', rtc);

	// obj = writable({ columns: [] });

	setContext('board', obj);
	return obj;
}

export function getLang(lang: string): Writable<Lang> {
	let obj: Writable<Lang> = getContext('lang');
	if (obj) return obj;

	// typescript wants this to be an if-like statement. Array.includes() will not work.
	const code: LangCode = (lang !== 'en' && lang !== 'fr') ? 'en' : lang;
	
	obj = writable(new Lang(code));
	setContext('lang', obj);
	return obj;
}
