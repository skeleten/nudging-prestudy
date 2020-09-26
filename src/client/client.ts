import { SaveMethod, ApiCallSaveMethod } from './methods';
import { get_fast_metrics, get_full_metrics } from './password';
import Chart = require('chart.js');

class App {
	saveMethod: SaveMethod;

	all_valid: boolean;
	mail: HTMLInputElement;
	username: HTMLInputElement;
	password: HTMLInputElement;
	show_password: HTMLInputElement;
	clear_password: HTMLInputElement;
	password_repeat: HTMLInputElement;

	radarChart: HTMLCanvasElement;
	innerChart: Chart;

	password_hidden: boolean;

	static MAX_RADAR_CHART_VAL: number = 1.5;

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
		this.radarChart = <HTMLCanvasElement> document.getElementById('radarChart');

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

		let closeExButton = <HTMLButtonElement> document.getElementById('close-explanation');
		closeExButton.onclick = () => {
			document.getElementById('explanation-popup').style.display = 'none';
		};

		let openExButton = <HTMLButtonElement> document.getElementById('pw-help');
		openExButton.onclick = () => {
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
		this.init_radar_graph();
	}

	init_radar_graph() {
		let ctx = this.radarChart.getContext('2d');
		this.innerChart = new Chart(ctx, {
			type: 'radar',

			data: {
				labels: ["Lower Case",
						 "Upper Case",
						 "Digits",
						 "Special Characters",
						 "Length"],
				datasets: [{
					label: "Check Password Strength",
					backgroundColor: 'rgba(106,101,184,0.5)',
					borderColor: 'rgba(123,88,184,0.8)',
					data: [0, 0, 0, 0, 0]
				}],
			},
			options: {
				legend: {
					display: true,
					labels: {
						fontStyle: 'bold',
						boxWidth: 30
					}
				},
				scale: {
					ticks: {
						display: false,
						stepSize: 0.5,
						suggestedMin: 0,
						suggestedMax: App.MAX_RADAR_CHART_VAL,
					},
					gridLines: {
						display: true,
					},
				}
			},
		})
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
		if (value.length < 32) {
			let metrics = get_fast_metrics(value);
			if (metrics.blacklisted) {
				suggestion = 'A lot of people use this password, please choose another one';
				valid = false;
			}
		}
		let warning = (<HTMLTextAreaElement> document.getElementById('psw_info'));
		warning.style.color = !valid ? '#e31400' : '#18d546';
		warning.innerHTML = !valid ? (suggestion != '' ? suggestion : 'Password must be 8 characters or longer') : '';
		this.all_valid = valid ? this.all_valid : false;
		let metrics = get_fast_metrics(value);
		// lower, upper, digits, special chars, length
		// TODO
		let data = [
			this.scale_radar_chart_value(metrics.classes.lower, 2, 1, App.MAX_RADAR_CHART_VAL),
			this.scale_radar_chart_value(metrics.classes.capital, 2, 1, App.MAX_RADAR_CHART_VAL),
			this.scale_radar_chart_value(metrics.classes.digit, 2, 1, App.MAX_RADAR_CHART_VAL),
			this.scale_radar_chart_value(metrics.classes.symbol, 2, 1, App.MAX_RADAR_CHART_VAL),
			this.scale_radar_chart_value(value.length, 8, 1, App.MAX_RADAR_CHART_VAL),
		];
		this.innerChart.data.datasets[0].data = data;
		this.innerChart.update();
	}

	scale_radar_chart_value(val: number, recom: number, val_on_rec: number, val_max: number): number {
		if (val < recom) {
			return val_on_rec * (val / recom);
		} else {
			let val_diff = val_max - val_on_rec;
			let neg = val_diff * (1 / (val - recom + 1));
			return val_max - neg;
		}
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
				nudge_id: 3,
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
