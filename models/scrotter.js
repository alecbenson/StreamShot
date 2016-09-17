var exec = require('child_process');
var fs = require('fs');
var path = require('path');
var BB = require('bluebird');
var natural = require('natural');


//Take a screenshot
function takeScreenshot() {
	return new BB(function (resolve, reject) {
		var opts = ['dt.bmp', '--t', '50'];
		var appDir = process.cwd();
		var scrot = exec.spawn(path.join(appDir, "bin", "scrot"), opts);
		scrot.on('close', function (code, signal) {
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
	var i = 0;
	return new BB(function (resolve, reject) {
		fs.readFile('dt-thumb.bmp', (err, data) => {
			var oldData = data.toString('base64');
			takeScreenshot().then(function (newdata) {
				var diffs = generate_string_diffs(oldData, newdata);
				transform_image(oldData, diffs, 'tranformed').then(function () {
					resolve(diffs);
				});
			})
		});
	});
}

function generate_string_diffs(a, b) {
	//Iterate through
	var diffs = {};
	for (i = 0; i < a.length; i++) {
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

	var index = start;
	while (a[index] != b[index]) {
		diffs += b[index];
		index++;
	}
	result.diff = diffs;
	result.len = (index - start);
	return result;
}

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

compare_images().then(function () {

})