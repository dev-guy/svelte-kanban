import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

type DropCard = {
	col: number;
	index: number;
	sameCol?: boolean;
}

export function getDropCard() : Writable<DropCard> {
	let obj: Writable<DropCard> = getContext('dropCard');
	if (obj) return obj;
	obj = writable({col: -1, index: -1});
	setContext('dropCard', obj);
	return obj;
}
