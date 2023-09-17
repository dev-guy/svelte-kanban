<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import Column from './components/Column/Column.svelte';
	import AddColumnBtn from './components/AddColumnBtn.svelte';
	import {getBoard, getLang, useCrdt, getDragDrop} from './stores';
	import type {LangCode} from './lang';

	// Properties of the Kanban
	export let lang: LangCode	= 'en';
	export let theme 			= 'light';
	export let primary 			= null;
	export let secondary 		= null;
	export let third 			= null;
	export let fontPrimary 		= null;
	export let fontSecondary 	= null;
	export let minimalist 		= false;
	export let maxColumns 		= 5;

	const globalLang = getLang(lang);
	const dragDrop = getDragDrop();

	// Default categories
	export let catsList = [{
            label:$globalLang.getStr('new'),
			color:'white',
            bgColor:"#0A99FF"
        },{   
            label:$globalLang.getStr('important'),
			color:'white',
            bgColor:"#EA0B38"
        },{
            label:$globalLang.getStr('task'),
			color:'black',
            bgColor:"#00F5DC"
        },{
            label:$globalLang.getStr('personal'),
			color:'white',
            bgColor:"#629387"
        },{
            label:$globalLang.getStr('work'),
			color:'black',
            bgColor:"#13F644"
	}];

	// Default columns
	export let colsList = [{
			name:$globalLang.getStr('Todo'),
			cards:[],
		},{
			name:$globalLang.getStr('Done'), 
			cards:[]
	}];

	const dispatch = createEventDispatcher();

	// Props used for setting up card size / drag and drop
	const HEIGHT_CARD = 105; // 96
	const HEIGHT_CARD_CONTAINER = 120;
	const STARTING_POINT_TOP = 98;
	const HEIGHT_CARD_GAP = HEIGHT_CARD_CONTAINER - STARTING_POINT_TOP;  
	const REAL_STARTING_POINT_TOP = STARTING_POINT_TOP + HEIGHT_CARD/2; // The first point of reference is the middle of the first card (if there is one)

	// Local property (ie used to track drag and drop of the cards)
	let cOffX     = 0;
	let cOffY     = 0;
	let rect_card;
	let card_top_coord = {x:0, y:0}; // Infos of the card being dragged
	const board = getBoard();

	colsList.forEach(function(column){
		$board.columns.push({
			title:column.name,
			coordinates: {x_start:0, x_end:0, y_start:0, y_end:0},
			cards:column.cards || [],
		});
	});

	function cardDragStart(event){	
		let e = event.detail.event;
		e = e || window.event;
		e.preventDefault();

		const {col, card: index} = event.detail;
		$dragDrop = {};

		const card = $board.columns[col]?.cards?.[index];
		if (!card) return;

		dispatch('cardDragStart', {card, col, event:event.detail.event});  

		const elem_dragged = document.getElementById(`card-${index}-col-${col}`);
		if (!elem_dragged) return;

		$dragDrop.from = {col, index};

		cOffX = e.clientX - elem_dragged.offsetLeft;
		cOffY = e.clientY - elem_dragged.offsetTop;

		rect_card = elem_dragged.getBoundingClientRect();

		// Stocker la position du milieu top de la card au départ
		card_top_coord.x = (rect_card.right + rect_card.left)/2;
		card_top_coord.y = rect_card.top;

		document.addEventListener('mousemove', cardDragMove);
		document.addEventListener('mouseup', cardDragEnd);
	}

	function cardDragMove(e) {
		e = e || window.event;
		e.preventDefault();

		delete $dragDrop.to;
		if (!$dragDrop.from) return;

		dispatch('cardDragMove', {card:$dragDrop.from.index, col:$dragDrop.from.col, event:e});  

		const elem_dragged = document.getElementById(`card-${$dragDrop.from.index}-col-${$dragDrop.from.col}`);
		if (!elem_dragged) {
			delete $dragDrop.from;
			return;
		}

		// Position live par rapport au click de départ
		const x_live = e.clientX - cOffX; 
		let y_live = e.clientY - cOffY;

		const x_card_top = card_top_coord.x + x_live; // card_top_coord.y (98) + e.clientY (100) - c0ffY (100)
		const y_card_top = card_top_coord.y + y_live;

		for (let i=0; i<$board.columns.length;i++){
			const rect = document.getElementsByClassName('column')[i].getBoundingClientRect();

			if((x_card_top >= rect.left)
			  && (x_card_top <= rect.right)
		      && (y_card_top >= rect.top)
			  && (y_card_top <= rect.bottom)) {
				let bool_position_order_found = false; // Boolean signaling we found the order position of the card in the column (ie)
				let position_order = 0; // Position order of the card in the column
				let j = 1; // variable to increment to navigate between the cards of the column

				// If at least one card is present in the column
				if ($board.columns[i].cards.length){
					// 1- checking if the point is between the first card
					if(y_card_top < REAL_STARTING_POINT_TOP) bool_position_order_found = true; // Position will stay at 0
					// 2- Searching the position order of the card between the cards of the column
					while(!bool_position_order_found && j <= $board.columns[i].cards.length){
						if(y_card_top <= (REAL_STARTING_POINT_TOP + j*HEIGHT_CARD_CONTAINER)){
							bool_position_order_found = true;
							position_order = j;
							break;
						}
						j++;
					}

					// 3- If the boolean still at false => the card will be in last position
					if(!bool_position_order_found) position_order = $board.columns[i].cards.length;
				}

				// Dragging in the same column?
				if (i === $dragDrop.from.col) {
					const diff = position_order - $dragDrop.from.index;
					if (diff > 0) {
						if (diff == 1) {
							if (position_order < $board.columns[i].cards.length) $dragDrop.to = {col:i, index:position_order+1};
						} else {
							$dragDrop.to = {col:i, index:position_order};
						}
						// Down
					} else if (diff < 0) {
						// Up
						// y_live -= HEIGHT_CARD_CONTAINER + HEIGHT_CARD_GAP;
						$dragDrop.to = {col:i, index:position_order};
					}
				} else {
					$dragDrop.to = {col:i, index:position_order};
				}

				break;
			}
		}

		elem_dragged.style.top = y_live.toString() + 'px';
		elem_dragged.style.left = x_live.toString() + 'px';
	};

	function cardDragEnd(e){
		e = e || window.event;
		e.preventDefault();

		// Removing event listeners
		document.removeEventListener('mousemove', cardDragMove);
		document.removeEventListener('mouseup', cardDragEnd);

		if (!$dragDrop.from) {
			dispatch('cardDragEnd', {event:e});  
			return;
		}

		dispatch('cardDragEnd', {card:$dragDrop.from.index, col:$dragDrop.from.col, event:e});  

		const elem_dragged = document.getElementById(`card-${$dragDrop.from.index}-col-${$dragDrop.from.col}`);
		if (!elem_dragged) return;

		let bool_drag_success = false;

		try {
			if (!$dragDrop.to) return;

			let card = $board.columns[$dragDrop.from.col].cards[$dragDrop.from.index];
			if (useCrdt) card = JSON.parse(JSON.stringify(card));

			// Dragged in the same column?
			if ($dragDrop.from.col === $dragDrop.to.col) {
				// Remove the card
				$board.columns[$dragDrop.from.col].cards.splice($dragDrop.from.index, 1);
				// Add the card
				if ($dragDrop.from.index < $dragDrop.to.index) {
					$board.columns[$dragDrop.from.col].cards.splice($dragDrop.to.index-1, 0, card);
				} else {
					$board.columns[$dragDrop.from.col].cards.splice($dragDrop.to.index, 0, card);
				}
			} else {
				// Remove the card
				$board.columns[$dragDrop.from.col].cards.splice($dragDrop.from.index, 1);
				// Add the card
				$board.columns[$dragDrop.to.col].cards.splice($dragDrop.to.index, 0, card);
			}

			if (!useCrdt) $board = $board;
			bool_drag_success = true;
		}
		finally {
			if (elem_dragged) {
				elem_dragged.style.removeProperty('top');
				elem_dragged.style.removeProperty('left');
			}

			// console.log(`ACTION [${action_dispatch}] OLD COL [${$dragDrop.from.col}] IN POSITION OLD POS [${$dragDrop.from.index}] NEW COL [${newCol}] NEW POS [${newPos}]`);
			const action_dispatch = (bool_drag_success ? 'cardDragSuccess' : 'cardDragFailed');

			const propsDispatch = {
				old_col:$dragDrop.from.col,
				old_pos:$dragDrop.from.index,
				columns:$board.columns,
			};

			if ($dragDrop.to) {
				propsDispatch.new_col = $dragDrop.to.col;
				propsDispatch.new_pos = $dragDrop.to.index;
			}

			$dragDrop = {};
			dispatch(action_dispatch, propsDispatch);  
		}
	}

	function addCard(col_index:number){		
		const column = $board.columns[col_index];
		if (!column) return;
		const card_temp = {
 			empty: false,
			animate: false,
			title: $globalLang.getStr('NewCard'),
			description: $globalLang.getStr('new'),
			category: catsList[0],
			date: new Date().toLocaleString().replace(/,.*/, ''),
 		};
		column.cards.unshift(card_temp);
		if (!useCrdt) $board = $board;
		dispatch('cardAdd', {col:col_index, columns:$board.columns});  
	}

	function removeColumn(event){
		const name = $board.columns[event.detail.index_col];
		if (name) {
			$board.columns.splice(event.detail.index_col, 1);
			if (!useCrdt) $board = $board;
			dispatch('columnRemove', {position:event.detail.index_col, name, columns:$board.columns});  
		}
	}

	function addColumn(){
		if ($board.columns.length >= maxColumns) return;

		const col_temp = {
			title:$globalLang.getStr('NewColumn'),
			coordinates: {x_start:0, x_end:0, y_start:0, y_end:0},
			cards: [],
		}

		const posAdd = $board.columns.length;
		$board.columns.push(col_temp);
		if (!useCrdt) $board = $board;

        dispatch('columnAdd', {position:posAdd, columns:$board.columns});  	
	}

	function moveCardUp(event){
		if(!event.detail.card)return;

		let card = $board.columns[event.detail.col]?.cards?.[event.detail.card];
		if (!card) return;
		
		if (useCrdt) card = JSON.parse(JSON.stringify(card));

		$board.columns[event.detail.col].cards.splice(event.detail.card, 1);
		$board.columns[event.detail.col].cards.splice((event.detail.card-1), 0, card);

		if (!useCrdt) $board = $board;
		dispatch('moveCardUp', {col:event.detail.col, old_pos:event.detail.card, new_pos:event.detail.card-1, columns:$board.columns});
	}

	function moveCardDown(event){
		const lastCard = $board.columns[event.detail.col]?.cards?.length -1;
		if(isNaN(lastCard) || event.detail.card >= lastCard) return;
	
		let card = $board.columns[event.detail.col].cards[event.detail.card];
		if (!card) return;

		if (useCrdt) card = JSON.parse(JSON.stringify(card));
		$board.columns[event.detail.col].cards.splice(event.detail.card, 1);
		$board.columns[event.detail.col].cards.splice((event.detail.card+1), 0, card);
		if (!useCrdt) $board = $board;
		dispatch('moveCardDown', {col:event.detail.col, old_pos:event.detail.card, new_pos:event.detail.card+1, columns:$board.columns});  	
	}

	function moveColumn(e){
		const direction = e.detail.direction === 'left' ? -1 : 1;
		const index = e.detail.index;

		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= $board.columns.length) return;

		let col = $board.columns[index];
		if (!col) return;

		if (useCrdt) col = JSON.parse(JSON.stringify(col));

		if (!useCrdt || direction === 1) {
			// Move right
			// Remove
			$board.columns.splice(index, 1);
			// Add
			$board.columns.splice(newIndex, 0, col)
		} else {
			// Move left
			// No idea why syncedStore wants things done in this order
			// Add
			$board.columns.splice(newIndex, 0, col);
			// Remove
			$board.columns.splice(index+1, 1);
		}

		if (!useCrdt) $board = $board;
		dispatch('columnMoved', {old_pos:index, new_pos:newIndex});
	}

	onMount(() => {
		// we only need to observe the first column since all the columns have the same size atm
		// let resizer = new ResizeObserver(handleResize)
		// resizer.observe(document.getElementsByClassName('column')[0])
	})
</script>

<div class="kanban {theme}" style:background="{primary}">
	<div class="layout">
		<div class="kanban-container">
			{#each $board.columns as column, index_col (index_col)}
				<Column
					title={column.title}
					cards={column.cards}
					{theme}
					{catsList}
					{index_col}
					{secondary}
					{third}
					{fontPrimary}
					{fontSecondary}
					on:columnSaveTitle={(e)=>{dispatch('columnSaveTitle', {title:e.detail.title, columns:$board.columns})}}
					on:cardMouseDown={cardDragStart}
					on:removeColumn={removeColumn}
					on:addCard={(e) => {addCard(e.detail.index)}}
					on:cardPropSaved={(e) => {dispatch('cardPropSaved', {prop:e.detail.prop, col:e.detail.col, card:e.detail.card, value:e.detail.value, columns:$board.columns})}}
					on:cardPropModify
					on:cardRemove={()=>{dispatch('cardRemove', {columns:$board.columns})}}
					on:moveCardUp={moveCardUp}
					on:moveCardDown={moveCardDown}
					on:moveColumn={moveColumn}	
				/>
			{/each}
			<AddColumnBtn
				{theme}
				{secondary}
				{third}
				{fontPrimary}
				{fontSecondary}
				on:addColumn={addColumn}
			/>
		</div>
		<div class="footer" style:background="{primary}"></div>
	</div>
</div>



<style lang="scss">
	:root{
		--light-bg:rgb(255, 255, 255);
		--dark-bg:#052C39;
		--light-column-bg:rgb(243, 244, 246);
		--dark-column-bg:#031D26;
		--light-gray-font:rgb(107, 114, 128);
	}
	.kanban {
		height:100%;
		width:100%;
		text-align:center;
		padding:1rem;
		font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
	}

	.layout{
		display:flex;
		width:100%;
		height:100%;
		flex-direction: column;
		/* border: 2px rgb(107, 114, 128) dashed; */
	}
	.header{
		height:150px;
		display:flex;
		justify-content: center;
		width:100%;
	}

	.footer{
		height:75px;
		margin-top:0.625rem;
	}

	.kanban-container{
		display:flex;
		flex:1;
		width:100%;
		justify-content: flex-start;
	}

	.kanban.light, .light .kanban-container, .light .footer, .light .header{
		background:var(--light-bg);
	}
	.kanban.dark, .dark .kanban-container, .dark .footer, .dark .header{
		background:var(--dark-bg);
	}
</style>