'use strict';

angular.module('streamshot', ['ngMaterial'])
	.config(function ($mdThemingProvider) {
		$mdThemingProvider.theme('default')
			.primaryPalette('red')
			.accentPalette('deep-orange')
      .backgroundPalette('grey');
	});
