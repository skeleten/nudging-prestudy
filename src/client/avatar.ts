let hair_sprite: HTMLImageElement;
let head_sprite: HTMLImageElement;
let body_sprite: HTMLImageElement;
let bottom_sprite: HTMLImageElement;
let placeholder_sprite: HTMLImageElement;

let selected: number[] = [0, 0, 0, 0];
const num_sprites = [6, 3, 6, 5];
let enabled = true;
let last_text = '';
let aY = -1;
let last_gesture = -1, gesture = 0;

export { selected, enabled };

export function loadResources() {
	hair_sprite = <HTMLImageElement> document.getElementById('avatar-hair');
	hair_sprite.onload = () => draw();
	head_sprite = <HTMLImageElement> document.getElementById('avatar-head');
	head_sprite.onload = () => draw();
	body_sprite = <HTMLImageElement> document.getElementById('avatar-body');
	body_sprite.onload = () => draw();
	bottom_sprite = <HTMLImageElement> document.getElementById('avatar-bottom');
	bottom_sprite.onload = () => draw();
	placeholder_sprite = <HTMLImageElement> document.getElementById('avatar-placeholder');
	placeholder_sprite.onload = () => draw();
	
	let canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('guide-canvas');
	canvas.width  = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
	
	let ctx: CanvasRenderingContext2D = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawBubble(false, 0, '');
	
	draw();
}

export function selectGesture(gesture_id: number) {
	gesture = gesture_id;
	selectExactSprite(selected[0], selected[1], selected[2], selected[3]);
}

export function selectExactSprite(hair: number, head: number, body: number, bottom: number) {
	
	let updated = [ hair, head, body, body == 5 ? 4 : bottom ];
	let same = 0;
	for (let i = 0; i < updated.length; i++) same += updated[i] === selected[i] ? 1 : 0;
	if (same == updated.length && last_gesture == gesture) return;
	selected = updated;
	last_gesture = gesture;
	
	hair_sprite.src = '/res/sprites/hair-' + String(selected[0]) + '.png';
	head_sprite.src = '/res/sprites/head-' + String(selected[1] + (gesture * num_sprites[1])) + '.png';
	body_sprite.src = '/res/sprites/body-' + String(selected[2]) + '.png';
	bottom_sprite.src = '/res/sprites/bottom-' + String(selected[3]) + '.png';
}

export function advanceSprite(forward: boolean, sprite_id: string) {
	let sprites = [selected[0], selected[1], selected[2], selected[3]];
	
	switch (sprite_id) {
		case 'hair': sprites[0] = (selected[0] + (forward ? 1 : num_sprites[0] - 1)) % num_sprites[0]; break;
		case 'head': sprites[1] = (selected[1] + (forward ? 1 : num_sprites[1] - 1)) % num_sprites[1]; break;
		case 'body': sprites[2] = (selected[2] + (forward ? 1 : num_sprites[2] - 1)) % num_sprites[2]; break;
		case 'bottom': sprites[3] = (selected[3] + (forward ? 1 : num_sprites[3] - 1)) % num_sprites[3]; break;
		default:
			sprites[0] = Math.floor(Math.random() * num_sprites[0]);
			sprites[1] = Math.floor(Math.random() * num_sprites[1]);
			sprites[2] = Math.floor(Math.random() * num_sprites[2]);
			sprites[3] = Math.floor(Math.random() * num_sprites[3]);
	}
	
	selectExactSprite(sprites[0], sprites[1], sprites[2], sprites[3]);
}

export function disableGuide() {
	enabled = false;
}

export function selectStep(step_id: number, args: string[]) {
	if (!enabled) return;
	
	selectGesture(0);
	
	aY = -1;
	let text = '';
	
	switch (step_id) {
		case 0: { // []
			let elem = document.getElementById('logo');
			aY = getCoords(elem).y + elem.offsetHeight;
			text = 'Welcome! Create your NudgeFlix account here and start streaming right away.';
			break;
		}
		case 1: { // [ valid?, content ]
			aY = getCoords(document.getElementById('email')).y + 46;
			text = 'I\'ll send you a postcard sometime!';
			if (!args[0]) text = !args[1] ? 'How can we reach you?' : 'I can\'t send messages to that.';
			selectGesture(args[0] ? 1 : 2);
			break;
		}
		case 2: { // [ valid?, content ]
			aY = getCoords(document.getElementById('username')).y + 46;
			text = insertBold('Great! ', args[1], ', I like the sound of that.');
			if (!args[0]) text = !args[1] ? 'What should we call you?' : 'Sorry, I can\'t remember such a long name.';
			selectGesture(args[0] ? 1 : 2);
			break;
		}
		case 3: { // [ valid?, content, suggestion ]
			aY = getCoords(document.getElementById('psw')).y + 46;
			text = 'Stronger than a grizzly! Great job.';
			selectGesture(args[0] ? 0 : 2);
			if (!args[0]) text = !args[1] ? 'This stays between us ;)' : 'That\'s a bit short, don\'t you think?';
			if (args[1] && args[2]) text = args[2];
			if (args[0] && args[1] && !args[2]) selectGesture(1);
			break;
		}
		case 4: { // [ valid?, content ]
			aY = getCoords(document.getElementById('psw-repeat')).y + 46;
			text = 'It\'s a match!';
			if (!args[0]) text = !args[1] ? 'Tell me again!' : 'Corporate says these are not the same.';
			selectGesture(args[0] ? 1 : 2);
			break;
		}
		case 5: { // [ missing field ]
			aY = getCoords(document.getElementById('submit_btn')).y + 50;
			text = insertBold('Sorry, could you check the ', args[0] + ' field', ' again?');
			selectGesture(2);
			break;
		}
		default:
			drawBubble(false, 0, '');
			return;
	}
	
	if (last_text === String(step_id) + text || aY < 0) return;
	last_text = String(step_id) + text;
	
	draw();
	drawBubble(true, aY - 150, text);
}

function drawGuide(avatar: HTMLCanvasElement) {
	if (!enabled || aY < 0) return;
	
	// Update gestures
	selectExactSprite(selected[0], selected[1], selected[2], selected[3]);
	
	let canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('guide-canvas');
	let ctx: CanvasRenderingContext2D = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(avatar, canvas.width / 2 - avatar.width / 2, aY - 150, avatar.width, avatar.height);
}

function insertBold(left: string, strong: string, right: string) {
	let p = document.createElement("p");
	p.innerText = left;
	let b = document.createElement("b");
	b.innerText = strong;
	p.append(b);
	p.append(right);
	return p.innerHTML;
}

function drawBubble(draw: boolean, y: number, html: string) {
	let bubble: HTMLParagraphElement = <HTMLParagraphElement> document.getElementById('avatar-bubble');
	
	if (!draw) {
		bubble.style.display = 'none';
		return;
	}
	
	// Restart animation
	bubble.classList.remove("bubble");
	void bubble.offsetWidth;
	bubble.classList.add("bubble");
	
	// Set text -> changes height and width
	bubble.innerHTML = html;
	
	bubble.style.display = 'block';
	bubble.style.position = 'absolute';
	bubble.style.top = String(y - 35 - bubble.offsetHeight) + 'px';
	bubble.style.left = String(75 - bubble.offsetWidth / 2) + 'px';
}

/* For creation area */
export function draw(): HTMLCanvasElement {
	let canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('sprite-canvas');
	let ctx: CanvasRenderingContext2D = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	//ctx.fillStyle = "#ff0000";
	//ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	try {
		ctx.drawImage(body_sprite, canvas.width / 2 - body_sprite.width / 2, 0);
		ctx.drawImage(head_sprite, canvas.width / 2 - head_sprite.width / 2, 0);
		ctx.drawImage(bottom_sprite, canvas.width / 2 - bottom_sprite.width / 2, 0);
		ctx.drawImage(hair_sprite, canvas.width / 2 - hair_sprite.width / 2, 0);
		//ctx.drawImage(placeholder_sprite, canvas.width / 2 - placeholder_sprite.width / 2, 0);
	} catch (e) { console.log('Could not draw sprites, waiting on load.'); }
	
	drawGuide(canvas);
	return canvas;
}

function getCoords(elem: HTMLElement) {
	let box = elem.getBoundingClientRect();
	return {
		y: box.top + pageYOffset,
		x: box.left + pageXOffset
	};
}