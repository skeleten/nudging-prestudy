import bodyParser = require('body-parser');
import express = require('express');
import fs = require('fs');

const port: number = 8081;

let app = express();

app.use(bodyParser.json());
app.use(express.static('../dist'));

function getTimestampString(): string {
	let date = new Date(Date.now());
	return date.toISOString();
}

function getOriginIp(req: any): string {
	let ip = req.get('X-Real-Ip');
	return ip;
}

app.post('/ingress', (req, res) => {
	var envelope = {
		date: getTimestampString(),
		origin_ip: getOriginIp(req),
		payload: req.body,
	};

	console.info(envelope);
	let payload = JSON.stringify(envelope) + '\n';

	fs.appendFile('ingress_data.json', payload, (err: any) => {
		if (err) {
			console.error('Failed to append to file: ' + err);
			res.status(500).end();
		} else res.status(200).end();
	});
});

app.listen(port, () => console.log(`App listening at http://localhost:${port}`));
