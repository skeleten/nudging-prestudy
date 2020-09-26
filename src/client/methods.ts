export interface SaveMethod {
    save(obj: any): void;
}

export class ApiCallSaveMethod {
    backend_uri: string;

    constructor(uri: string) {
        this.backend_uri = uri;
    }

    async save(obj: any) {
		let payload = JSON.stringify(obj);
		let xhr = new XMLHttpRequest();
		xhr.open('POST', this.backend_uri);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.onload = () => {
			if (xhr.status !== 200) {
				console.error('Something went wrong: ' + xhr.status + ' ' + xhr.statusText);
			}
		};
		xhr.send(payload);
    }
}
