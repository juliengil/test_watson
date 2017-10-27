'use strict';

const Rx = require('rxjs');

class HttpRequest {

    constructor() {}

    /**
     * @description node http request options
     * @param {string} path additional path
     * @returns {Object}
     */
    options(hostname, path, method, port, headers) {
        return Object.assign({}, {
            hostname: hostname,
            path: path,
            method: method || 'POST',
            port: port || 80,
            headers: headers || {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * @description rx wrapper for node http request
     * @param  {string} protocol
     * @param  {string} hostname
     * @param  {string} path
     * @param  {string} method
     * @param  {string} port
     * @param  {string} data
     * @returns {Observable}
     */
    request(protocol, hostname, path, method, port, data, headers) {
        return Rx.Observable.create(observer => {
            var req = protocol.request(this.options(hostname, path, method, port, headers), response => {
                response.on('data', data => observer.next(data.toString()));
                response.on('end', _ => observer.complete());
            });
            req.on('error', error => observer.error(error));
            if (data)
                req.write(data);
            req.end();
        });
    }
}

module.exports = HttpRequest;