import { SaveMethod, ApiCallSaveMethod } from './methods';
import { get_fast_metrics, get_full_metrics } from './password';
import { Chat, ChatBot } from './chat';

class App {
	saveMethod: SaveMethod;

	chat: Chat;
	chatbot: ChatBot;

	constructor() {
		this.chat = new Chat();
		window.onload = () => this.init();
		this.saveMethod = new ApiCallSaveMethod('/ingress');
	}

	init() {
		let closeExButton = <HTMLButtonElement> document.getElementById('close-explanation');
		closeExButton.onclick = () => {
			document.getElementById('explanation-popup').style.display = 'none';
		};
		
		let openExButton = <HTMLButtonElement> document.getElementById('pw-help');
		openExButton.onclick = () => {
			document.getElementById('explanation-popup').style.display = 'block';
		};
		
		this.chat.init();

		this.chatbot = new ChatBot(this.chat);
		this.chatbot.start();
		this.chatbot.on_done = () => this.onSubmitClick();
	}

	submitOnEnter(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			document.getElementById("submit_btn").click();
		}
	}

	onSubmitClick() {
		let username_enc = new Buffer(this.chatbot.username).toString('base64');
		let mail_enc = new Buffer(this.chatbot.email_addr).toString('base64');
		let payload = {
			nudge_id: 6,
			username: username_enc,
			mail: mail_enc,
			metrics: get_full_metrics(this.chatbot.pass),
		};
		this.saveMethod.save(payload);
		//window.location.href = "/../success";
	}
}

// KEEP THIS
// This is so we can inspect the state, if need be.
var _app = new App();
