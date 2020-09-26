import { SaveMethod, ApiCallSaveMethod } from './methods';
import { get_fast_metrics, get_full_metrics } from './password';
import {
	loadResources,
	advanceSprite,
	selectStep,
	disableGuide,
	draw,
	enabled,
	selectGesture,
	selectExactSprite
} from './avatar';

class App {
	saveMethod: SaveMethod;
	
	all_valid: boolean;
	mail: HTMLInputElement;
	username: HTMLInputElement;
	password: HTMLInputElement;
	show_password: HTMLInputElement;
	clear_password: HTMLInputElement;
	password_repeat: HTMLInputElement;
	
	password_hidden: boolean;
	
	missing_field_hint: string;
	
	constructor() {
		window.onload = () => this.init();
		this.saveMethod = new ApiCallSaveMethod('/ingress');
	}
	
	init() {
		this.all_valid = true;
		this.mail = <HTMLInputElement> document.getElementById('email');
		this.username = <HTMLInputElement> document.getElementById('username');
		this.password = <HTMLInputElement> document.getElementById('psw');
		this.show_password = <HTMLInputElement> document.getElementById('pw-show');
		this.clear_password = <HTMLInputElement> document.getElementById('pw-clear');
		this.password_repeat = <HTMLInputElement> document.getElementById('psw-repeat');
		
		this.mail.oninput = () => this.checkMail(this.mail.value);
		this.mail.onkeyup = (e: KeyboardEvent) => this.submitOnEnter(e);
		this.mail.onfocus = () => this.mail.oninput(null);
		
		this.username.oninput = () => this.checkUsername(this.username.value);
		this.username.onkeyup = (e: KeyboardEvent) => this.submitOnEnter(e);
		this.username.onfocus = () => this.username.oninput(null);
		
		this.password.oninput = () => this.checkPassword(this.password.value);
		this.password.onkeyup = (e: KeyboardEvent) => this.submitOnEnter(e);
		this.show_password.onclick = () => this.togglePWVisibility();
		this.clear_password.onclick = () => {
			this.password.value = "";
			this.password_repeat.value = "";
			(<HTMLTextAreaElement> document.getElementById('psw_info')).innerHTML = '';
			(<HTMLTextAreaElement> document.getElementById('psw_rpt_info')).style.display = 'none';
		};
		this.password.onfocus = () => this.password.oninput(null);
		
		this.password_repeat.oninput = () => this.checkPWConfirm(this.password_repeat.value, this.password.value);
		this.password_repeat.onkeyup = (e: KeyboardEvent) => this.submitOnEnter(e);
		this.password_repeat.onfocus = () => this.password_repeat.oninput(null);
		
		let btn = document.getElementById('submit_btn');
		btn.onclick = () => {
			// Check constraints and store result in all_valid
			this.all_valid = true;
			this.missing_field_hint = '';
			this.password_repeat.oninput(null);
			this.password.oninput(null);
			this.username.oninput(null);
			this.mail.oninput(null);
			// Submit
			this.onSubmitClick(this.all_valid)
		};
		
		this.password_hidden = true;
		
		let closeExButton = <HTMLButtonElement> document.getElementById('close-explanation');
		closeExButton.onclick = () => {
			document.getElementById('explanation-popup').style.display = 'none';
		};
		
		let openExButton = <HTMLButtonElement> document.getElementById('pw-help');
		openExButton.onclick = () => {
			document.getElementById('explanation-popup').style.display = 'block';
		};
		
		let createButton = <HTMLButtonElement> document.getElementById('create-avatar');
		createButton.onclick = () => {
			document.getElementById('creation-popup').style.display = 'none';
			selectStep(0, []);
		};
		
		let skipButton = <HTMLButtonElement> document.getElementById('skip-avatar');
		skipButton.onclick = () => {
			document.getElementById('creation-popup').style.display = 'none';
			disableGuide();
			this.checkInitialFields();
		};
		
		let buttons_left = document.getElementsByClassName('sprite-prev');
		for (let i = 0; i < buttons_left.length; i++) {
			let btn = <HTMLInputElement> buttons_left.item(i);
			btn.onclick = () => advanceSprite(false, btn.id.replace('sprite-', '').replace('-prev', ''));
		}
		
		let buttons_right = document.getElementsByClassName('sprite-next');
		for (let i = 0; i < buttons_right.length; i++) {
			let btn = <HTMLInputElement> buttons_right.item(i);
			btn.onclick = () => advanceSprite(true, btn.id.replace('sprite-', '').replace('-next', ''));
		}
		
		(<HTMLInputElement> document.getElementById('sprite-randomize')).onclick = () => advanceSprite(true, 'random');
		loadResources();
		selectExactSprite(2, 0, 1, 1);
	}
	
	// Initial check if field not empty: in case of website backtracking / cached info
	checkInitialFields() {
		let groups: HTMLCollection = document.getElementsByClassName('inp_group');
		for (let i = 0; i < groups.length; i++) {
			let field: HTMLInputElement = (<HTMLInputElement> (<HTMLDivElement> groups.item(i)).children.namedItem('inp'));
			if (field.value) field.oninput(null);
		}
	}
	
	submitOnEnter(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			document.getElementById("submit_btn").click();
		}
	}
	
	togglePWVisibility() {
		this.password.type = this.password_hidden ? "text" : "password";
		this.password_repeat.type = this.password_hidden ? "text" : "password";
		this.password_hidden = !this.password_hidden;
		this.show_password.classList.toggle("fa-eye-slash");
	}
	
	checkMail(value: string) {
		let valid: boolean = value.match('.+@.+\\..+') != null;
		this.all_valid = valid ? this.all_valid : false;
		this.missing_field_hint = valid ? this.missing_field_hint : 'mail';
		if (enabled) return selectStep(1, [valid ? 'valid' : '', value]);
		let warning = (<HTMLTextAreaElement> document.getElementById('mail_info'));
		warning.style.display = 'inline-block';
		warning.style.color = !valid ? '#e31400' : '#18d546';
		warning.innerHTML = !valid ? 'Not a valid mail address' : '';
	}
	
	checkUsername(value: string) {
		let valid: boolean = value.length != 0 && value.length <= 32;
		this.all_valid = valid ? this.all_valid : false;
		this.missing_field_hint = valid ? this.missing_field_hint : 'username';
		if (enabled) return selectStep(2, [valid ? 'valid' : '', value]);
		let warning = (<HTMLTextAreaElement> document.getElementById('username_info'));
		warning.style.display = 'inline-block';
		warning.style.color = !valid ? '#e31400' : '#18d546';
		warning.innerHTML = !valid ? 'Username cannot be empty' : 'Username available';
	}
	
	checkPassword(value: string) {
		let valid: boolean = value.length >= 8;
		this.all_valid = valid ? this.all_valid : false;
		this.missing_field_hint = valid ? this.missing_field_hint : 'password';
		let suggestion = '';
		if (value.length < 32) {
			let metrics = get_fast_metrics(value);
			if (metrics.blacklisted) {
				suggestion = 'A lot of people use this password, please choose another one';
				valid = false;
				this.all_valid = false;
			}
			if (enabled) {
				if (valid && metrics.score < 3) {
					suggestion = 'This password is pretty weak... ';
					if (metrics.classes.symbol < 2) suggestion += 'Maybe add a few more special characters?';
					else if (metrics.classes.digit < 2) suggestion += 'Maybe add a few more digits?';
					else if (metrics.classes.capital < 2) suggestion += 'Maybe add a few more capital letters?';
					else if (metrics.classes.lower < 2) suggestion += 'Maybe add a few more lowercase letters?';
					else suggestion += 'Maybe shuffle the characters around a bit?'
				}
				return selectStep(3, [valid ? 'valid' : '', value, suggestion]);
			}
		}
		let warning = (<HTMLTextAreaElement> document.getElementById('psw_info'));
		warning.style.color = !valid ? '#e31400' : '#18d546';
		warning.innerHTML = !valid ? (suggestion != '' ? suggestion : 'Password must be 8 characters or longer') : '';
	}
	
	checkPWConfirm(value: string, compare_to: string) {
		let valid: boolean = value === compare_to;
		this.all_valid = valid ? this.all_valid : false;
		this.missing_field_hint = valid ? this.missing_field_hint : 'second password';
		if (enabled) return selectStep(4, [valid ? 'valid' : '', value]);
		let warning = (<HTMLTextAreaElement> document.getElementById('psw_rpt_info'));
		warning.style.display = 'inline-block';
		warning.style.color = !valid ? '#e31400' : '#18d546';
		warning.innerHTML = !valid ? 'Passwords do not match' : '';
	}
	
	onSubmitClick(checks_valid: boolean) {
		console.log(checks_valid ? 'Submitting!' : 'Constraints not satisfied.');
		if (!checks_valid) {
			selectStep(5, [ this.missing_field_hint ]);
			return;
		}
		let username_enc = new Buffer(this.username.value).toString('base64');
		let mail_enc = new Buffer(this.mail.value).toString('base64');
		let payload =
			{
				nudge_id: 7,
				username: username_enc,
				mail: mail_enc,
				metrics: get_full_metrics(this.password.value),
			};
		this.saveMethod.save(payload);
		
		document.getElementById('finished-popup').style.display = 'block';
		document.getElementById('finished-popup').style.backgroundColor = '#f3f3f3';
		document.getElementById('finished-modal-body').style.backgroundColor = '#fefefe';
		document.getElementById('finished-modal-body').appendChild(document.getElementById('sprite-canvas'));
		selectStep(-1, []);
		disableGuide();
		selectGesture(1);
		draw();
	}
}

// DEBUG
let _app = new App();