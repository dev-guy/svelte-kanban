import { syncedStore } from "@syncedstore/core";
import { svelteSyncedStore } from "@syncedstore/svelte";
import { getContext, setContext } from "svelte";

import { writable } from 'svelte/store';
import { Lang } from '../class/Lang.js';

export const globalLang = writable();

export function getColumns() {
	let columns = getContext('columns');
	if (!columns) {
		columns = writable({ columns: [] });
		// columns = svelteSyncedStore(syncedStore( { columns: [] }));
		setContext('columns', columns);
	}
	return columns;
}
