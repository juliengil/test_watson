'use strict';

const Rx = require('rxjs');
const fs = require('fs');
const crypto = require('crypto');

class Util {

	/**
	 * @description rx wrapper to write live
	 * @param  {string} buffer
	 * @param  {string} path
	 * @param  {string} name
	 * @returns {Observable}
	 */
	static writeFile(buffer, path, name) {
		var node_writeFile = Rx.Observable.bindNodeCallback(fs.writeFile);
		return node_writeFile(path.concat('/', name), buffer);
	}

	/**
	 * @description rx wrapper to read file
	 * @param  {string} path
	 * @return {Observable}
	 */
	static readFile(path) {
		var node_readFile = Rx.Observable.bindNodeCallback(fs.readFile);
		return node_readFile(path, 'utf8');
	}

	/**
	 * @description rx wrapper to read dir
	 * @param  {string} path
	 * @returns {Observable}
	 */
	static readDir(path) {
		var node_readdir = Rx.Observable.bindNodeCallback(fs.readdir);
		return node_readdir(path);
	}

	/**
	 * @description rx wrapper to create folder recursively
	 * @param  {string} path
	 * @returns {Observable}
	 */
	static createFolder(path) {
		return Rx.Observable.fromArray(path.split('/'))
			.scan((acc, buff) => acc.concat('/', buff))
			.mergeMap(p => {
				var node_mkdir = Rx.Observable.bindNodeCallback(fs.mkdir)
				return p === path ? node_mkdir(p).mergeMapTo(Rx.Observable.empty()) : node_mkdir(p);
			})
			.catch(err => Rx.Observable.empty());
	}

	/**
	 * @description rx wrapper to remove file
	 * @param  {string} path
	 * @param  {win} win windows flag
	 * @returns {Observable}
	 */
	static removeFile(path, win) {
		var node_unlink = Rx.Observable.bindNodeCallback(fs.unlink);
		return node_unlink(win ? path.replace(/\\/g, '/') : path);
	}

	/**
	 * description pseudo unique identifier
	 * @returns {string}
	 */
	static guid() {
		return crypto.randomBytes(16).toString('hex');
	}

	/**
	 * description pseudo unique identifier
	 * @returns {string}
	 */
	static softGuid() {
		return crypto.randomBytes(4).toString('hex');
	}

	/**
	 * @description Parse buffer, and replace macros w/ new content
	 * @param  {string} buff original buffer
	 * @param  {string} content new content
	 * @param  {string} var_key current key
	 * @returns {string}
	 */
	static replace(buff, content, var_key) {
		while (buff.indexOf('{{' + var_key + '}}') !== -1)
			buff = buff.replace('{{' + var_key + '}}', content);
		return buff;
	}

	/**
	 * @description extract values from string
	 * @param  {string} value
	 * @param  {type} value
	 * @returns {string}
	 */
	static extract(value, type) {
		switch (type) {
			case 'email':
				return value.match(/(\S+)?[a-z0-9]@[a-z0-9\.]+/img)[0];
		}
		return value;
	}

	/**
	 * @description recursively remove unused properties
	 * @param  {Object} obj
	 * @returns {Object}
	 */
	static cleanObject(obj) {
		for (var prop in obj) {
			if (prop === '_id' || prop === 'messageType')
				delete obj[prop];
			else if (typeof obj[prop] === 'object')
				this.cleanObject(obj[prop]);
		}
	}

	static prettyPrint(description, json) {
		console.log(description, JSON.stringify(json, null, 4));
	}
}

module.exports = Util;