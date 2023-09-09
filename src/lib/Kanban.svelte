<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import Column from '$lib/components/Column/Column.svelte';
	import AddColumnBtn from '$lib/components/AddColumnBtn.svelte';
	import {getBoard, getLang, useCrdt} from '$lib/stores';
	import type {LangCode} from '$lib/lang';

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

	// Props used for setting up card size / dragNdrop
	const HEIGHT_CARD_CONTAINER = 120;
	const STARTING_POINT_TOP = 98;
	const HEIGHT_CARD = 105; // 96
	const REAL_STARTING_POINT_TOP = STARTING_POINT_TOP + HEIGHT_CARD/2; // The first point of reference is the middle of the first card (if there is one)

	// Local property (ie used to track dragNdrop of the cards)
	let cOffX_new = 0;
	let cOffY_new = 0;
	let cOffX     = 0;
	let cOffY     = 0;
	let rect_card;
	let card_top_coord = {x:0, y:0};

	// Infos of the card being dragged
	let dragged_card_infos = {col:-1, index:-1};
	let tracking_last_empty_card = {col:-1, index:-1};
	const board = getBoard();

	colsList.forEach(function(column){
		$board.columns.push({
			title:column.name,
			coordinates: {x_start:0, x_end:0, y_start:0, y_end:0},
			slots:column.cards || [],
		});
	});

	function cardDragStart(event){	
		// Storing infos of the card dragged (coordinates, rectangle)
		dragged_card_infos.col = event.detail.col;
		dragged_card_infos.index = event.detail.card;
		const card = $board.columns[dragged_card_infos.col]?.slots?.[dragged_card_infos.index];
		if (!card) return;

        dispatch('cardDragStart', {card:event.detail.card, col:event.detail.col, event:event.detail.event});  

		let e = event.detail.event;
		e = e || window.event;
		e.preventDefault();

		const elem_dragged = document.getElementById(`card-${dragged_card_infos.index}-col-${dragged_card_infos.col}`);
		if (!elem_dragged) {
			dragged_card_infos = {col: -1, index: -1};
			tracking_last_empty_card = {col: -1, index: -1};
			return;
		}

		cOffX = e.clientX - elem_dragged.offsetLeft;
		cOffY = e.clientY - elem_dragged.offsetTop;
		rect_card = elem_dragged.getBoundingClientRect();

		// Stocker la position du milieu top de la card au départ
		card_top_coord.x = (rect_card.right + rect_card.left)/2;
		card_top_coord.y = rect_card.top;

		// by default the first empty card should take the place of the card dragged
		// $board.columns[dragged_card_infos.col].slots.splice(dragged_card_infos.index, 0, {empty:true});
		// tracking_last_empty_card.col = dragged_card_infos.col;
		// tracking_last_empty_card.index = dragged_card_infos.index;
		if (!useCrdt) $board = $board;
		
		document.addEventListener('mousemove', cardDragMove);
		document.addEventListener('mouseup', cardDragEnd);
	}

	function cardDragMove(e) {
		// TODO: Verify elem_dragged is still valid
		const elem_dragged = document.getElementById(`card-${dragged_card_infos.index}-col-${dragged_card_infos.col}`);
		if (!elem_dragged) {
			dragged_card_infos = {col: -1, index: -1};
			tracking_last_empty_card = {col: -1, index: -1};
			return;
		}

        dispatch('cardDragMove', {card:dragged_card_infos.index, col:dragged_card_infos.col, event:e});  
		// 'cardDragStart', {card:event.detail.card, col:event.detail.col, event:event.detail.event});

		e = e || window.event;
		e.preventDefault();

		// Position live par rapport au click de départ
		const x_live = (e.clientX - cOffX); 
		const y_live = (e.clientY - cOffY);
		elem_dragged.style.top = y_live.toString() + 'px';
		elem_dragged.style.left = x_live.toString() + 'px';

		const x_card_top = card_top_coord.x + x_live; // card_top_coord.y (98) + e.clientY (100) - c0ffY (100)
		const y_card_top = card_top_coord.y + y_live;

		for (let i=0; i<$board.columns.length;i++){
			const rect = document.getElementsByClassName('column')[i].getBoundingClientRect();
			if((x_card_top >= rect.left)
			  && (x_card_top <= rect.right)
		      && (y_card_top >= rect.top)
			  && (y_card_top <= rect.bottom)){
				let bool_position_order_found = false; // Boolean signaling we found the order position of the card in the column (ie)
				let position_order = 0; // Position order of the card in the column
				let j = 1; // variable to increment to navigate between the cards of the column

				// If at least one card is present in the column
				if($board.columns[i].slots.length > 0){
					// 1- checking if the point is between the first card
					if(y_card_top < REAL_STARTING_POINT_TOP) bool_position_order_found = true; // Position will stay at 0
					// 2- Searching the position order of the card between the cards of the column
					while(bool_position_order_found == false && j <= $board.columns[i].slots.length){
						if(y_card_top <= (REAL_STARTING_POINT_TOP + j*HEIGHT_CARD_CONTAINER)){
							bool_position_order_found = true;
							position_order = j;
							break;
						}
						j++;
					}

					// 3- If the boolean still at false => the card will be in last position
					if(!bool_position_order_found) position_order = $board.columns[i].slots.length;
				}

				// checking if the last empty slot is the same as the one found now (ie, we don't need to do anything) 
				// if((tracking_last_empty_card.col == i && tracking_last_empty_card.index == position_order) || rect_card.) return;
				if(tracking_last_empty_card.col == i && tracking_last_empty_card.index == position_order) return;

				if(i == dragged_card_infos.col) return;

				// Copying columns
				// if the last empty is not empty and not the same as the one we are going to add, we need to delete it
				if(tracking_last_empty_card.col != -1) $board.columns[tracking_last_empty_card.col]?.slots?.splice(tracking_last_empty_card.index, 1)

				// Adding empty slot to the right column at the right position
				let bool_add_empty = true;
				for(let j=0; j<$board.columns[i].slots.length; j++){
					if($board.columns[i].slots[j].empty == true) bool_add_empty = false;
				}

				if(bool_add_empty) {
					$board.columns[i].slots.splice(position_order, 0, {empty:true});
					if (!useCrdt) $board = $board; 
				}
				tracking_last_empty_card = {col:i, index:position_order};// updating the last empty
			}
		}
	};

	function cardDragEnd(e){
		try {
			// Removing event listeners
			document.removeEventListener('mousemove', cardDragMove);
			document.removeEventListener('mouseup', cardDragEnd);

			if (tracking_last_empty_card.col === -1) return;

			const elem_dragged = document.getElementById(`card-${dragged_card_infos.index}-col-${dragged_card_infos.col}`);
			if (!elem_dragged) return;

			let card = $board.columns[dragged_card_infos.col]?.slots?.[dragged_card_infos.index];
			if (!card) return;

			dispatch('cardDragEnd', {card:dragged_card_infos.index, col:dragged_card_infos.col, event:e});  
			let bool_drag_success = false;
			e = e || window.event;
			e.preventDefault();
			const x_card_top 		= card_top_coord.x + (e.clientX - cOffX);
			const y_card_top	 	= card_top_coord.y + (e.clientY - cOffY);
			let newCol;
			let newPos;

			for(let i=0; i<$board.columns.length;i++){
				const rect = document.getElementsByClassName('column')[i].getBoundingClientRect();

				if((x_card_top >= rect.left)
				&& (x_card_top <= rect.right)
				&& (y_card_top >= rect.top)
				&& (y_card_top <= rect.bottom)) {
					let bool_position_order_found = false; // Boolean signaling we found the order position of the card in the column (ie)
					let position_order = 0; // Position order of the card in the column
					let j = 1; // variable to increment to navigate between the cards of the column

					// If at least one card is present in the column
					if($board.columns[i].slots.length > 0){
						// 1- checking if the point is between the first card
						if(y_card_top < REAL_STARTING_POINT_TOP) bool_position_order_found = true; // Position will stay at 0
						// 2- Searching the position order of the card between the cards of the column
						while(bool_position_order_found == false && j <= $board.columns[i].slots.length){
							if(y_card_top <= (REAL_STARTING_POINT_TOP + j*HEIGHT_CARD_CONTAINER)){
								bool_position_order_found = true;
								position_order = j;
								break;
							}
							j++;
						}

						// 3- If the boolean still at false => the card will be in last position
						if(!bool_position_order_found) position_order = $board.columns[i].slots.length;
					}

					// Copying columns
					if (useCrdt) card = JSON.parse(JSON.stringify(card));

					$board.columns[dragged_card_infos.col]?.slots?.splice(dragged_card_infos.index, 1);
					// console.log('LAST EMPTY CARD', tracking_last_empty_card);

					if(tracking_last_empty_card.col != -1){ // deleting all the empty cards of the column
						if (tracking_last_empty_card.index == $board.columns[tracking_last_empty_card.col]?.slots?.length) {
							if (tracking_last_empty_card.index > 0) tracking_last_empty_card.index--;
						}
						const slots = $board.columns[tracking_last_empty_card.col]?.slots;
						if (slots && tracking_last_empty_card.index < slots.length)
							slots.splice(tracking_last_empty_card.index, 1); // if empty card exist, delete it
					} 
					
					// console.log('POSITION ORDER', position_order, 'columns work', $board.columns[i].slots.length);

					// if(position_order == 1 && $board.columns[i].slots.length == 0) position_order = 0;

					// Adding card to column dragged on at the right position
					
					// Removing card from column dragged from
					$board.columns[i].slots.splice(position_order, 0, card);

					if (!useCrdt) $board = $board;

					newCol = i;
					newPos = position_order;
					bool_drag_success = true;
				}
			}

			elem_dragged.style.removeProperty('top');
			elem_dragged.style.removeProperty('left');

			// console.log(`ACTION [${action_dispatch}] OLD COL [${dragged_card_infos.col}] IN POSITION OLD POS [${dragged_card_infos.index}] NEW COL [${newCol}] NEW POS [${newPos}]`);
			const action_dispatch = (bool_drag_success ? 'cardDragSuccess' : 'cardDragFailed');
			let propsDispatch = (bool_drag_success ? {old_col:dragged_card_infos.col, old_pos:dragged_card_infos.index, new_col:newCol, new_pos:newPos, columns:$board.columns} : {col:dragged_card_infos.col, pos:dragged_card_infos.index});
			dispatch(action_dispatch, propsDispatch);  
		}
		finally {
			dragged_card_infos = {col: -1, index: -1};
			tracking_last_empty_card = {col: -1, index: -1};
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
		column.slots.unshift(card_temp);
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
			rect:{},
			slots:[]
		}

		const posAdd = $board.columns.length;
		$board.columns.push(col_temp);
		if (!useCrdt) $board = $board;

        dispatch('columnAdd', {position:posAdd, columns:$board.columns});  	
	}

	function moveCardUp(event){
		if(!event.detail.card)return;

		let card = $board.columns[event.detail.col]?.slots?.[event.detail.card];
		if (!card) return;
		
		if (useCrdt) card = JSON.parse(JSON.stringify(card));
		$board.columns[event.detail.col].slots.splice(event.detail.card, 1);
		$board.columns[event.detail.col].slots.splice((event.detail.card-1), 0, card);
		if (!useCrdt) $board = $board;
		dispatch('moveCardUp', {col:event.detail.col, old_pos:event.detail.card, new_pos:event.detail.card-1, columns:$board.columns});
	}

	function moveCardDown(event){
		const numEvents = $board.columns[event.detail.col]?.slots?.length -1;
		if(isNaN(numEvents) || event.detail.card == numEvents) return;
	
		let card = $board.columns[event.detail.col]?.slots?.[event.detail.card];
		if (!card) return;

		if (useCrdt) card = JSON.parse(JSON.stringify(card));
		$board.columns[event.detail.col].slots.splice(event.detail.card, 1);
		$board.columns[event.detail.col].slots.splice((event.detail.card+1), 0, card);
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
					{theme}
					{catsList}
					slots={column.slots}
					title={column.title}
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