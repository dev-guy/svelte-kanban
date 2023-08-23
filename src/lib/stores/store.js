import { syncedStore } from "@syncedstore/core";
import { svelteSyncedStore } from "@syncedstore/svelte";

import { writable } from 'svelte/store';
import { Lang } from '../class/Lang.js';

export const columns = svelteSyncedStore(syncedStore( { columns: [] }));
export const globalLang = writable(new Lang());
