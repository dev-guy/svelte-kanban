import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

type Coordinates = {
	col: number;
	index: number;
};

type DragDrop = {
	from?: Coordinates;
	to?: Coordinates;
};

export function getDragDrop() : Writable<DragDrop> {
	let obj: Writable<DragDrop> = getContext('dnd');
	if (obj) return obj;
	obj = writable({});
	setContext('dnd', obj);
	return obj;
}
