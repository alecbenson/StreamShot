'use strict';

angular.module('streamshot')
	.controller('imageController', function ($scope) {
		$scope.socket = io();
	});
