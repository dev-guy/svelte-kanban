const table = {
en: {
	Yes: 'Yes',
	No: 'No',
	Done: 'Done',
	Todo: 'Todo',
	Card: 'Card',
	Cards: 'Cards',
	AddACard: 'Add a card',
	NewCard: 'New card',
	NewColumn: 'New column',
	new: 'new',
	task: 'task',
	personal: 'personal',
	work: 'work',
	important: 'important'
},
fr: {
	Yes: 'Oui',
	No: 'Non',
	Done: 'Terminé',
	Todo: 'À faire',
	Card: 'Tâche',
	Cards: 'Tâches',
	AddACard: 'Nouvelle tâche',
	NewCard: 'Nouvelle tâche',
	NewColumn: 'Nouvelle colonne',
	new: 'nouveau',
	task: 'tâche',
	personal: 'personnel',
	work: 'travail',
	important: 'important'
}};

export type LangCode = keyof typeof table;
type Key = keyof typeof table.en;

export class Lang {
	lang: LangCode;

	constructor(lang: LangCode) {
		this.lang = lang;
	}

	getStr(key: Key) {
		return table[this.lang][key];
	}
}
