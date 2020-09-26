import { SaveMethod, ApiCallSaveMethod } from './methods';
import { count_classes, get_fast_metrics, get_full_metrics } from './password';

class App {
	saveMethod: ApiCallSaveMethod;

	all_valid: boolean;
	mail: HTMLInputElement;
	username: HTMLInputElement;
	password: HTMLInputElement;
	show_password: HTMLInputElement;
	clear_password: HTMLInputElement;
	password_repeat: HTMLInputElement;
	pw_meter_bar: HTMLElement;

	pwc_common: HTMLDivElement;
	pwc_length: HTMLDivElement;
	pwc_lower: HTMLDivElement;
	pwc_upper: HTMLDivElement;
	pwc_digit: HTMLDivElement;
	pwc_special: HTMLDivElement;

	password_hidden: boolean;

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
		this.pw_meter_bar = <HTMLElement> document.getElementById('meter-bar');

		this.mail.oninput = () => this.checkMail(this.mail.value);
		this.mail.onkeyup = (e: KeyboardEvent) => this.submitOnEnter(e);

		this.username.oninput = () => this.checkUsername(this.username.value);
		this.username.onkeyup = (e: KeyboardEvent) => this.submitOnEnter(e);

		this.password.oninput = () => this.checkPassword(this.password.value);
		this.password.onkeyup = (e: KeyboardEvent) => this.submitOnEnter(e);
		this.show_password.onclick = () => this.togglePWVisibility();
		this.clear_password.onclick = () => {
			this.password.value = "";
			this.password_repeat.value = "";
			(<HTMLTextAreaElement> document.getElementById('psw_info')).innerHTML = '';
			(<HTMLTextAreaElement> document.getElementById('psw_rpt_info')).style.display = 'none';
		};

		this.password_repeat.oninput = () => this.checkPWConfirm(this.password_repeat.value, this.password.value);
		this.password_repeat.onkeyup = (e: KeyboardEvent) => this.submitOnEnter(e);

		let btn = document.getElementById('submit_btn');
		btn.onclick = () => {
			// Check constraints and store result in all_valid
			this.all_valid = true;
			this.mail.oninput(null);
			this.username.oninput(null);
			this.password.oninput(null);
			this.password_repeat.oninput(null);
			// Submit
			this.onSubmitClick(this.all_valid)
		};

		this.pwc_common = <HTMLDivElement> document.getElementById('pwc-common');
		this.pwc_length = <HTMLDivElement> document.getElementById('pwc-length');
		this.pwc_lower = <HTMLDivElement> document.getElementById('pwc-lower');
		this.pwc_upper = <HTMLDivElement> document.getElementById('pwc-upper');
		this.pwc_digit = <HTMLDivElement> document.getElementById('pwc-digit');
		this.pwc_special = <HTMLDivElement> document.getElementById('pwc-special');

		let closeExButton = <HTMLButtonElement> document.getElementById('close-explanation');
		closeExButton.onclick = () => {
			document.getElementById('explanation-popup').style.display = 'none';
		};

		let openExButton = <HTMLButtonElement> document.getElementById('pw-help');
		openExButton.onclick = () => {
			console.log('yolo');
			document.getElementById('explanation-popup').style.display = 'block';
		};

		// Initial check if field not empty: in case of website backtracking / cached info
		let groups: HTMLCollection = document.getElementsByClassName('inp_group');
		for (let i = 0; i < groups.length; i++) {
			let field: HTMLInputElement = (<HTMLInputElement> (<HTMLDivElement> groups.item(i)).children.namedItem('inp'));
			if (field.value !== '')
				field.oninput(null);
		}

		this.password_hidden = true;
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
		let valid: boolean = value.match('.*@.*') != null;
		let warning = (<HTMLTextAreaElement> document.getElementById('mail_info'));
		warning.style.display = 'inline-block';
		warning.style.color = !valid ? '#e31400' : '#18d546';
		warning.innerHTML = !valid ? 'Not a valid mail address' : '';
		this.all_valid = valid ? this.all_valid : false;
	}

	checkUsername(value: string) {
		let valid: boolean = value.length != 0;
		let warning = (<HTMLTextAreaElement> document.getElementById('username_info'));
		warning.style.display = 'inline-block';
		warning.style.color = !valid ? '#e31400' : '#18d546';
		warning.innerHTML = !valid ? 'Username cannot be empty' : 'Username available';
		this.all_valid = valid ? this.all_valid : false;
	}

	checkPassword(value: string) {
		let valid: boolean = value.length >= 8;
		let suggestion = '';
		let blacklisted = false;
		if (value.length < 32) {
			let metrics = get_fast_metrics(value);
			blacklisted = metrics.blacklisted;
			if (blacklisted) {
				suggestion = 'A lot of people use this password, please choose another one';
				valid = false;
			}
			if (valid) this.pw_meter_bar.className = "meter-bar-" + metrics.score;
			else this.pw_meter_bar.className = "meter-bar-0";
		} else this.pw_meter_bar.className = "meter-bar-4";

		this.updateChecklist(value, blacklisted);
		this.all_valid = valid ? this.all_valid : false;
	}

	updateChecklist(password: string, blacklisted: boolean) {
		let classes = count_classes(password);

		if (!blacklisted && password) this.pwc_common.classList.add('pwc-satisfied');
		else this.pwc_common.classList.remove('pwc-satisfied');

		if (password.length >= 8) this.pwc_length.classList.add('pwc-satisfied');
		else this.pwc_length.classList.remove('pwc-satisfied');

		if (classes.lower >= 2) this.pwc_lower.classList.add('pwc-satisfied');
		else this.pwc_lower.classList.remove('pwc-satisfied');

		if (classes.capital >= 2) this.pwc_upper.classList.add('pwc-satisfied');
		else this.pwc_upper.classList.remove('pwc-satisfied');

		if (classes.digit >= 2) this.pwc_digit.classList.add('pwc-satisfied');
		else this.pwc_digit.classList.remove('pwc-satisfied');

		if (classes.symbol >= 2) this.pwc_special.classList.add('pwc-satisfied');
		else this.pwc_special.classList.remove('pwc-satisfied');

		let boxes = document.getElementsByClassName('pwc-item');
		for (let i = 0; i < boxes.length; i++) boxes.item(i).children.namedItem('checkbox').classList.replace('fa-check-square', 'fa-square');

		let check = document.getElementsByClassName('pwc-satisfied');
		for (let i = 0; i < check.length; i++) check.item(i).children.namedItem('checkbox').classList.replace('fa-square', 'fa-check-square');
	}

	checkPWConfirm(value: string, compare_to: string) {
		let valid: boolean = value == compare_to;
		let warning = (<HTMLTextAreaElement> document.getElementById('psw_rpt_info'));
		warning.style.display = 'inline-block';
		warning.style.color = !valid ? '#e31400' : '#18d546';
		warning.innerHTML = !valid ? 'Passwords do not match' : '';
		this.all_valid = valid ? this.all_valid : false;
	}

	onSubmitClick(checks_valid: boolean) {
		console.log(checks_valid ? 'Submitting!' : 'Constraints not satisfied.');
		if (!checks_valid) return;
		let username_enc = new Buffer(this.username.value).toString('base64');
		let mail_enc = new Buffer(this.mail.value).toString('base64');
		let payload =
			{
				// TODO timings
				nudge_id: 1,
				username: username_enc,
				mail: mail_enc,
				metrics: get_full_metrics(this.password.value),
			};
		this.saveMethod.save(payload, () => {
			window.location.href = "../success";
		});
	}
}

// KEEP THIS
// This is so we can inspect the state, if need be.
var _app = new App();
