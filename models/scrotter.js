'use strict';

var exec = require('child_process');
var fs = require('fs');
var path = require('path');
var BB = require('bluebird');
var socket = require('../app').io;

//Take a screenshot
function takeScreenshot() {
	return new BB(function (resolve, reject) {
		var opts = ['dt.bmp', '--t', '25'];
		var appDir = process.cwd();
		var scrot = exec.spawn(path.join(appDir, 'bin', 'scrot'), opts);
		scrot.on('close', function () {
			try {
				fs.statSync('dt.bmp');
				//Read the file
				fs.readFile('dt-thumb.bmp', (err, data) => {
					resolve(data.toString('base64'));
				});
			} catch (error) {
				reject('not found!');
			}
		});
	});
}

function compare_images() {
	return new BB(function (resolve) {
		fs.readFile('dt-thumb.bmp', (err, data) => {
			var oldData = data.toString('base64');
			takeScreenshot().then(function (newdata) {
				var diffs = generate_string_diffs(oldData, newdata);
				var compression_ratio = (JSON.stringify(diffs).length / oldData.length) * 100
				console.log('Compression ratio: ' + compression_ratio);
				resolve(diffs);
			})
		});
	});
}

function generate_string_diffs(a, b) {
	//Iterate through
	var diffs = {};
	for (var i = 0; i < a.length; i++) {
		var block_diff = diff_from_index(a, b, i);
		if (block_diff.len) {
			diffs[i] = block_diff.diff;
			i += block_diff.len;
		}
	}
	return diffs;
}

function diff_from_index(a, b, start) {
	var diffs = '';
	var result = {}
	var consecSame = 0;

	var index = start;
	// Under a worst case scenario, every other pixel is different.
	// This would mean that a new key is created for every other index that stores every other pixel.
	// To mitigate, we store the pixels in the diff as long as there are two different pixels or
	// We se eight consecutive matching pixels.
	while ((consecSame < 8 && diffs.length) || a[index] !== b[index]) {
		if(a[index] === b[index]) {
			consecSame++;
		} else {
			consecSame = 0;
		}
		diffs += b[index];
		index++;
	}
	result.diff = diffs;
	result.len = (index - start);
	return result;
}

/*
function transform_image(oldData, diff, outname) {
	var diffObjs = Object.keys(diff);
	for (let change of diffObjs) {
		spliceString(oldData, change, diff[change].length, diff[change])
	}
	var buf = new Buffer(oldData, 'base64');
	return saveUpdated(buf, outname);
}

function spliceString(str, start, delCount, newSubStr) {
	return str.slice(0, start) + newSubStr + str.slice(start + Math.abs(delCount));
}


function saveUpdated(data, outname) {
	return new BB(function (resolve, reject) {
		fs.writeFile(outname + '.bmp', data, function (err) {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		})
	});
}
*/

function transmit_bmp() {
	compare_images().then(function(diff) {
		socket.emit('bmp', diff);
	});
}

setInterval(transmit_bmp, 1000);
