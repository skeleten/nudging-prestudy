import { get_fast_metrics } from './password'

// String utils
// First, checks if it isn't implemented yet.

// Chat config
export interface ChatConfig {
	// Ids of all the elements the `Chat` class will try to access.
	id_container: string;
	id_log_container: string;
	id_input_container: string;
	id_button_positive: string;
	id_button_negative: string;
	id_button_dark: string;
	id_text_input: string;
}

export function default_chat_config(): ChatConfig {
	return {
		id_container: "chat-container",
		id_log_container: "chat-log",
		id_input_container: "chat-input",
		id_button_positive: "chat-btn-pos",
		id_button_negative: "chat-btn-neg",
		id_button_dark: "chat-btn-drk",
		id_text_input: "chat-input-text",
	};
}

export class Chat {
	private config: ChatConfig;

	private container: HTMLDivElement;
	private log_container: HTMLDivElement;
	private input_container: HTMLDivElement;

	private button_pos: HTMLButtonElement;
	private button_neg: HTMLButtonElement;
	private button_drk: HTMLButtonElement;
	private text_input: HTMLInputElement;

	on_user_text: (msg: string) => void;
	on_user_yes: () => void;
	on_user_no: () => void;

	constructor() {
		this.config = default_chat_config();
	}

	static new_with_config(cfg: ChatConfig): Chat {
		let chat = new Chat();
		chat.config = cfg;
		return chat;
	}

	init() {
		// get relevant elements from DOM
		this.container = <HTMLDivElement>document.getElementById(this.config.id_container);
		this.log_container = <HTMLDivElement>document.getElementById(this.config.id_log_container);
		this.input_container = <HTMLDivElement>document.getElementById(this.config.id_input_container);

		this.button_pos = <HTMLButtonElement>document.getElementById(this.config.id_button_positive);
		this.button_neg = <HTMLButtonElement>document.getElementById(this.config.id_button_negative);
		this.button_drk = <HTMLButtonElement>document.getElementById(this.config.id_button_dark);
		this.text_input = <HTMLInputElement>document.getElementById(this.config.id_text_input);

		// register listeners
		this.button_pos.onclick = () => this.button_pos_click();
		this.button_neg.onclick = () => this.button_neg_click();
		this.button_drk.onclick = () => this.button_drk_click();
		this.text_input.onkeyup = (e) => this.text_keydown(e);
	}

	append_message(msg: HTMLDivElement) {
		this.log_container.appendChild(msg);
		this.log_container.scrollTop = this.log_container.scrollHeight;
	}

	private button_pos_click() {
		if (this.on_user_yes) {
			this.on_user_yes();
		}
	}

	private button_neg_click() {
		if (this.on_user_no) {
			this.on_user_no();
		}
	}

	private button_drk_click() {
		// this is a sent button now
		if (this.on_user_text && this.text_input.value.trim()) {
			this.on_user_text(this.text_input.value);
		}
	}

	private text_keydown(e: KeyboardEvent) {
		if (e.key === "Enter" && this.text_input.value.trim()) {
			if (this.on_user_text) {
				this.on_user_text(this.text_input.value);
			}
		}
	}

	create_bot_message(inner: string): HTMLDivElement {
		let div = <HTMLDivElement>document.createElement("div");
		div.className = "chat-bubble-bot";

		let avatar = <HTMLImageElement>document.createElement("img");
		avatar.alt = "Avatar";
		avatar.src = "/res/avatar-1.png";

		let para = <HTMLParagraphElement>document.createElement("p");
		para.innerText = inner;

		div.appendChild(avatar);
		div.appendChild(para);

		return div;
	}

	create_user_message(inner: string): HTMLDivElement {
		let div = <HTMLDivElement>document.createElement("div");
		div.className = "chat-bubble";

		let avatar = <HTMLImageElement>document.createElement("img");
		avatar.alt = "User Avatar";
		avatar.src = "/res/avatar-2.png";

		let para = <HTMLParagraphElement>document.createElement("p");
		para.innerText = inner;

		div.appendChild(avatar);
		div.appendChild(para);

		return div;
	}

	create_system_message(inner: string): HTMLDivElement {
		let div = <HTMLDivElement>document.createElement("div");
		div.className = "chat-system";

		let para = <HTMLParagraphElement>document.createElement("p");
		para.innerText = inner;

		div.appendChild(para);

		return div;
	}

	setup_text_input() {
		this.input_container.className = "cfg-text-input";
		this.text_input.focus();
	}

	set_input_max_length(len: number) {
		this.text_input.maxLength = len;
	}

	setup_yesno_input() {
		this.input_container.className = "cfg-yesno-input";
	}

	clear_text_input() {
		this.text_input.value = "";
	}

	disable_input() {
		this.text_input.disabled = true;
	}
}

export class ChatBot {
	username: string;
	email_addr: string;
	pass: string;

	on_done: () => void;

	private chat: Chat;
	private state: "username"
		| "email"
		| "password"
		| "confirm_weak"
		| "confirm_pass"
		| "done";

	// Strings used in messages
	private msg_initial =
		() => "Welcome to NudgeFlix! Let's set up your account.";
	private msg_ask_name =
		() => "What should we call you?";
	private msg_valid_uname =
		(name: string) => `Hello, ${name}!\nCould you give us an email address so we know how to reach you?`;
	private msg_invalid_uname =
		() => "This shouldn't be displayed.";
	private msg_valid_email =
		(mail: string) => `Okay! We will send any messages to ${mail}\nNext we will need a password so you can authenticate.`;
	private msg_invalid_email =
		() => `This doesnt look like a valid email address. Please provide a valid email address so we can reach you if we need to!`;
	private msg_confirm_weak_pass_use =
		() => "This password seems rather weak. Do you want to choose a new one?\nI'll even help you create a stronger one!";
	private msg_confirm_strong_pass =
		() => "Nice and strong! Please type it in one more time to confirm!";
	private msg_invalid_pass =
		() => "Unfortunately this password doesn't reach the minimum length of 8 characters.\nPlease enter a new password.";
	private msg_banlisted_pass =
		() => "Unfortunately you have chosen a very common password. Please choose another.";
	private msg_confirm_weak_pass =
		() => "Okay then. Please enter the password one more time to confirm.";
	private msg_no_confirm_weak_pass =
		() => {
			let message = "Thank goodness, a good password is important!\nPlease enter a new password.";
			let metrics = get_fast_metrics(this.pass);
			let please_add: Array<string> = [];

			if (metrics.classes.symbol < 2)
				please_add.push("special characters");
			if (metrics.classes.digit < 2)
				please_add.push("digits");
			if (metrics.classes.capital < 2)
				please_add.push("uppercase letters");
			if (metrics.classes.lower < 2)
				please_add.push("lowercase letters");

			if (please_add.length > 0) {
				message += "\nFor a stronger password, try adding more ";
				// Format:
				// TYPE1
				// TYPE1 and TYPE2
				// TYPE1, ..., and TYPEn
				for (let i = 0; i < please_add.length; i++) {
					if (i > 0 && please_add.length >= 2) {
						// We have more than 2 and are not at the beginning, so we add a comma
						message += ", ";
					}
					if (i == please_add.length - 1 && i != 0) {
						// We are at the end so we add an 'and'
						if (please_add.length == 2) { message += " "; };
						message += "and ";
					}
					message += please_add[i];
				}

				message += "!";
			}
			return message;
		};
	private msg_confirm_pass_mismatch =
		() => "Unfortunately those did not match up..\n Please choose a new password";
	private msg_done =
		() => "Thanks! We'll get in touch as soon as your account is set up :)";

	constructor(chat: Chat) {
		this.chat = chat;
		this.chat.on_user_text = (m) => this.on_user_text(m);
		this.chat.on_user_yes = () => this.on_user_yes();
		this.chat.on_user_no = () => this.on_user_no();

		this.state = "username";
		this.chat.set_input_max_length(32);
	}

	start() {
		this.chat.setup_text_input();
		let msg1 = this.chat.create_bot_message(this.msg_initial());
		this.chat.append_message(msg1);
		let msg2 = this.chat.create_bot_message(this.msg_ask_name());
		this.chat.append_message(msg2);
	}

	private on_user_text(msg: string) {
		switch (this.state) {
			case "username":
				this.on_username(msg);
				break;
			case "email": // email
				this.on_email(msg);
				break;
			case "password":
				this.on_password(msg);
				break;
			case "confirm_pass":
				this.on_confirm_pass(msg);
				break;
		}
	}

	private on_user_yes() {
		console.log("ChatBot::on_user_yes");
		switch (this.state) {
			case "confirm_weak":
				this.on_confirm_weak_pass(true);
				break;
		}
	}

	private on_user_no() {
		console.log("ChatBot::on_user_no");
		switch (this.state) {
			case "confirm_weak":
				this.on_confirm_weak_pass(false);
				break;
		}
	}

	private on_username(name: string) {
		// CHECK		NEXT_STATE
		// --------------------------
		// VALID		"email"
		// INVALID		"username"

		this.chat.clear_text_input();
		this.chat.append_message(this.chat.create_user_message(name));

		this.username = name;

		if (name.length < 99) {
			// VALID
			this.chat.append_message(this.chat.create_bot_message(
				this.msg_valid_uname(this.username)));

			this.state = "email";
			this.chat.set_input_max_length(64);
		} else {
			// INVALID
			this.chat.append_message(this.chat.create_bot_message(this.msg_invalid_uname()));
			this.state = "username";
		}
	}

	private on_email(mail: string) {
		// CHECK		NEXT STATE
		//-------------------------
		// VALID		"password"
		// INVALID		"email"

		this.chat.clear_text_input();
		this.chat.append_message(this.chat.create_user_message(mail));

		this.email_addr = mail;

		if (mail.match('.+@.+\\..+')) {
			// VALID
			this.chat.append_message(this.chat.create_bot_message(
				this.msg_valid_email(mail)));

			this.state = "password";
			this.chat.set_input_max_length(128);
		} else {
			// INVALID
			this.chat.append_message(this.chat.create_bot_message(
				this.msg_invalid_email()))

			this.state = "email";
			this.chat.set_input_max_length(64);
		}
	}

	private on_password(pass: string) {
		// VALID		STRENGTH		NEXT_STATE
		//--------------------------------------------
		// WEAK			VALID			"confirm_weak"
		// STRONG		VALID			"confirm_pass"
		// *			INVALID			"password"

		let msg = "";
		for (var i = 0; i < pass.length; i++) {
			msg += "*";
		}

		this.chat.append_message(this.chat.create_user_message(msg));
		this.chat.clear_text_input();

		let metrics = get_fast_metrics(pass);
		let valid = pass.length >= 8 && !metrics.blacklisted;
		let weak = metrics.score <= 2;

		this.pass = pass;

		if (weak && valid) {
			this.state = "confirm_weak";
			this.chat.append_message(this.chat.create_bot_message(
				this.msg_confirm_weak_pass_use()));
			this.chat.setup_yesno_input();
		} else if (!weak && valid) {
			this.state = "confirm_pass";
			this.chat.append_message(this.chat.create_bot_message(
				this.msg_confirm_strong_pass()));
		} else {
			// ! valid
			this.state = "password";
			this.chat.set_input_max_length(128);
			if (metrics.blacklisted) {
				this.chat.append_message(this.chat.create_bot_message(
					this.msg_banlisted_pass()));
			} else {
				this.chat.append_message(this.chat.create_bot_message(
					this.msg_invalid_pass()));
			}
		}
	}

	private on_confirm_weak_pass(confirmed: boolean) {
		// CONFIRMED		NEXT_STATE
		//------------------------------------
		// TRUE				"confirm_pass"
		// FALSE			"password"

		let m = "";
		if (confirmed) m = "Yes"
		else m = "No";

		this.chat.append_message(this.chat.create_user_message(m));

		if (confirmed) {
			this.state = "password";
			this.chat.setup_text_input();
			this.chat.set_input_max_length(128);
			this.chat.append_message(this.chat.create_bot_message(
				this.msg_no_confirm_weak_pass()));
		} else {
			this.state = "confirm_pass";
			this.chat.setup_text_input();
			this.chat.set_input_max_length(128);
			this.chat.append_message(this.chat.create_bot_message(
				this.msg_confirm_weak_pass()));
		}
	}

	private on_confirm_pass(conf_pass: string) {
		// VALID		NEXT_STATE
		//---------------------------------
		// TRUE			"done"
		// FALSE		"password"

		let msg = "";
		for (var i = 0; i < conf_pass.length; i++)
			msg += "*";
		this.chat.append_message(this.chat.create_user_message(msg));
		this.chat.clear_text_input();

		if (conf_pass === this.pass) {
			// VALID
			this.state = "done";
			this.chat.append_message(this.chat.create_bot_message(this.msg_done()));
			this.chat.append_message(this.chat.create_system_message("This chat is closed"));
			this.chat.disable_input();
			if (this.on_done) { this.on_done(); }
		} else {
			// INVALID
			this.state = "password";
			this.chat.append_message(this.chat.create_bot_message(
				this.msg_confirm_pass_mismatch()));
		}
	}
}
