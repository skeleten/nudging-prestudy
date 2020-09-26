import bodyParser = require('body-parser');
import express = require('express');
import fs = require('fs');

const port: number = 8081;

let app = express();

app.use(bodyParser.json());
app.use(express.static('../dist'));

app.post('/ingress', (req, res) => {
	console.info(req.body);

	let ip = req.get('X-Real-IP');
	let payload = JSON.stringify({
		origin_ip: ip,
		payload: req.body,
	}) + '\n';

	console.log('got data from ip: ' + ip);

	fs.appendFile('ingress_data.json', payload, (err: any) => {
		if (err) {
			console.error('Failed to append to file: ' + err);
			res.status(500).end();
		} else res.status(200).end();
	});
});

app.listen(port, () => console.log(`App listening at http://localhost:${port}`));
