(function () {
	'use strict';

	angular
		.module('shared')
		.component('panoEditor', panoEditor());

	function panoEditor() {
		return {
			controller: retailerSliderController,
			controllerAs: 'panoECtrl',
			templateUrl: 'components/pano/pano-editor/templates/pano-editor.component.tpl.html',
			bindings: {
				shop: '<',
				panoList: '='
			}
		};
	}

	/*@ngInject*/
	function retailerSliderController($timeout, $mdDialog, Scene, $rootScope, helper, $scope, $translate, marzHelper) {
		var self = this,
			mode = 'edit',
			Marzipano,
			viewer,
			marHelper = new marzHelper();

		this.spotType = 'info';
		this.picture = '';
		this.uploadPano = uploadPano;
		this.updatePanoImg = updatePanoImg;
		this.deletePanoById = deletePanoById;
		this.activeSceneId;

		$timeout(function () {
			Marzipano = window.Marzipano;
			viewer = new Marzipano.Viewer(document.getElementById('pano'));
			marHelper.init(viewer, mode);

			self.switchScene = switchScene;
			self.changeSpotType = changeSpotType;

			init();

			function init() {
				initScene();
			}

			function initScene() {
				changeSpotType();
				setFirstScene();

				$scope.$watchCollection(function(){
					return self.panoList;
				}, function () {
					if(!self.activeSceneId){
						setFirstScene();
					}
				});

				$rootScope.$on('setFirstSceneEdit', setFirstScene);
			}

			function changeSpotType() {
				marHelper.changeSpotType(self.spotType);
			}

			function switchScene(activeScene) {
				marHelper.setPanoActiveSceneById(activeScene.id);

			}
		}, 100);

		function uploadPano(picture) {
			if (picture && self.shop.id) {
				var uplaodData = {
					shop_id: self.shop.id,
					picture: picture
				};

				Scene.uploadPano(uplaodData)
					.then(refreshList, showErrorMsg)
			}
		}

		function updatePanoImg(panoId, picture) {
			if (picture && self.shop.id && panoId) {
				var uplaodData = {
					shop_id: self.shop.id,
					picture: picture
				};

				Scene.updatePano(uplaodData, panoId)
					.then(function () {
						if (Scene.getActiveScene() && Scene.getActiveScene().id === panoId) {
							setFirstScene();
						}else{
							self.activeSceneId = false;
						}
					}, showErrorMsg)
			}
		}

		function refreshList(pano) {
			setFirstScene();
		}

		function showErrorMsg(resp) {
			$translate('PANO_IMAGE_SIZE').then(function (translations) {

				if (resp.data && resp.data.picture[0]) {
					$mdDialog.show(
						$mdDialog.alert()
							.parent(angular.element(document.body))
							.clickOutsideToClose(true)
							.title('')
							.theme('alert-default')
							.textContent(translations)
							.ok('Ok')
					);
				}
			});
		}

		function deletePanoById(panoId) {
			var confirm = $mdDialog.confirm({
				onShowing: function onShowAnimation() {
					helper.fixDialogButtons();
				}
			})
				.title('Möchtest du das Panorama löschen?')
				.textContent('Alle Informationen werden gelöscht.')
				.ok('Löschen')
				.cancel('Abbrechen');

			$mdDialog.show(confirm).then(function () {
				Scene.deletePanoById(panoId)
					.then(function () {
						Scene.deleteAllRelatedLinkSpots(false, panoId);
						deletePanoFromList(panoId);
						setFirstScene();
					});
			});
		}

		function deletePanoFromList(panoId) {
			var deleteIndex;

			angular.forEach(self.panoList, function (pano, key) {
				if (pano.id === panoId) {
					deleteIndex = key;
				}
			});

			if (Number.isInteger(deleteIndex)) {
				self.panoList.splice(deleteIndex, 1);
			}

			setFirstScene();
		}

		function setFirstScene() {
			if (self.panoList.length) {
				setActivePano();
				$timeout(function () {
					viewer.updateSize();
				}, 100);
			}
		}

		function setActivePano() {
			self.panoList = Scene.getCurrentSceneList();
			self.activeSceneId = false;

			angular.forEach(self.panoList, function (pano) {
				if (!self.activeSceneId && pano.status === 'ready') {
					self.activeSceneId = pano.id;
				}
			});

			if (self.activeSceneId) {
				marHelper.setPanoActiveSceneById(self.activeSceneId);
			}
		}
	}
})();
