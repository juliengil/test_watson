'use strict';

const Rx = require('rxjs');
const Util = require('./src/Util');
const HttpRequest = require('./src/HttpRequest');
const https = require('https');

class Watson extends HttpRequest {

    constructor() {
        super();
        this.requests = 0;
        this.responses = 0;
        this.headers = {
            'Content-Type': 'application/json'            
        };
        this.init()
            .mergeMap(files => this.extractTones(files))
            .map(json_response => JSON.stringify(json_response, null, 4))
            .reduce((acc, buffer) => acc.concat('\n\n').concat(buffer))
            .mergeMap(response => Util.writeFile(response, '.', 'responses'))
            .subscribe(v => console.log(this.responses + ' responses for ' + this.requests + ' requests'), err => console.log(err));
    }

    init() {
        return Rx.Observable.of(process.argv)
            .mergeMap(argv => {
                if (argv.length === 5) {
                    return Rx.Observable.of(argv)
                        .do(x => this.auth = 'Basic ' + new Buffer(argv[3] + ':' + argv[4]).toString('base64'))
                        .do(x => Object.assign(this.headers, {
                            'Authorization': this.auth
                        }))
                        .mergeMapTo(Util.readFile(argv[2]))
                        .reduce((acc, buffer) => acc.concat(buffer))
                        .map(file => JSON.parse(file));
                }
                else {
                    return Rx.Observable.throw('ERROR: expected command = npm run watson --file=./path/to/file.json --user=username --password=password');
                }
            });
    }

    extractTones(inputFile) {
        return Rx.Observable.from(inputFile)
            .map(line => JSON.stringify(line))
            .map(payload => {
                const headers = Object.assign(this.headers, {
                    'Content-Length': Buffer.byteLength(payload)
                });
                return Object.assign({}, {
                    headers: headers,
                    payload: payload
                })
            })
            .mergeMap(obj => {
                return this.request(https, "gateway.watsonplatform.net", "/tone-analyzer/api/v3/tone?version=2017-09-21", 'POST', '443', obj.payload, obj.headers)
                    .reduce((acc, buff) => acc.concat(buff))
                    .map(response => JSON.parse(response))
                    .do(x => this.requests++)
                    .filter(response => response.document_tone.tones.length)
                    .do(x => this.responses++)
                    .map(valid_response => {
                        return Object.assign({}, {
                            sentence: JSON.parse(obj.payload).text,
                            tones: valid_response.document_tone.tones
                        })
                    })
            })
            .defaultIfEmpty("Please provide a file which isn't empty and well formated");
    }

}
module.exports = Watson;
const c = new Watson();