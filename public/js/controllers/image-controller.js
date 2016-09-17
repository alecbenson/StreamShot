'use strict';

angular.module('streamshot')
	.controller('imageController', function ($scope) {
		var socket = io();

		socket.on('bmp', function (msg) {
			$scope.img = msg;
		});

		socket.on('diff', function (diff) {
			transform_image(diff);
		});

		function transform_image(diff) {
			if (!$scope.img) {
				return;
			}
			var newImg = $scope.img;
			var diffObjs = Object.keys(diff);
			for (var i = 0; i < diffObjs.length; i++) {
				var index = diffObjs[i];
				spliceString(newImg, index, diff[index].length, diff[index])
			}
			console.log($scope.img === newImg);
			$scope.img = newImg;
			$scope.$apply();
		}

		$scope.$watch('img', function () {
			console.log('changed!!!!')
		}, true);

		function spliceString(str, start, delCount, newSubStr) {
			return str.slice(0, start) + newSubStr + str.slice(start + Math.abs(delCount));
		}

	});
