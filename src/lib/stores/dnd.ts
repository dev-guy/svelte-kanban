import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

type DropZone = {
	col: number;
	index: number;
}

export function getDropCard() : Writable<DropZone> {
	let obj: Writable<DropZone> = getContext('dropZone');
	if (obj) return obj;
	obj = writable({col: -1, index: -1});
	setContext('dropZone', obj);
	return obj;
}
