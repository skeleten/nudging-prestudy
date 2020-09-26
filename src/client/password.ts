import zxcvbn = require("zxcvbn");
import sjcl = require("sjcl");
import NBP = require("../../dist/script/nbp.min.js");

NBP.init("mostcommon_100000", "../../res/", true);

export function count_classes(password: string): any {
	let capital: number = 0, lower: number = 0, digits: number = 0, symbols: number = 0;
	for (let i = 0; i < password.length; i++) {
		let char = password.charAt(i);
		if (char.match('[0-9]'))
			digits++;
		else if (char.match('[a-z]'))
			lower++;
		else if (char.match('[A-Z]'))
			capital++;
		else
			symbols++;
	}
	return { lower: lower, capital: capital, digit: digits, symbol: symbols };
}

export function get_fast_metrics(password: string): any {
	let zresult = zxcvbn(password);
	let blacklisted = NBP.isCommonPassword(password);
	
	return {
		length: password.length,
		classes: count_classes(password),
		blacklisted: blacklisted,
		guesses: zresult.guesses,
		score: zresult.score,
	};
}

export function get_full_metrics(password: string): any {
	console.log('Generating full metrics, please wait');
	let hexHash = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(password));
	let zresult = zxcvbn(password);
	let blacklisted = NBP.isCommonPassword(password);
	console.log('Done generating');
	
	return {
		length: password.length,
		classes: count_classes(password),
		blacklisted: blacklisted,
		guesses: zresult.guesses,
		score: zresult.score,
		hash: hexHash
	};
}