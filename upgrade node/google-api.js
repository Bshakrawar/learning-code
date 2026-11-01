// ==========================================================================
// MAP
// ==========================================================================

(function(NAMESPACE, $) {

	/**
	 * @namespace map
	 * @memberof VEC
	 * @version 0.1.0
	 * @author Deloitte Digital Australia
	 */
	NAMESPACE.Map = (function() {
		var APIS,
			SELECTORS,
			ATTRIBUTES,
			init,
			insertMapsApiScriptIfNil,
			_addAccessibleMaps;

		APIS = {
			MAPS_API_SRC: 'https://maps.googleapis.com/maps/api/js?callback=exapmle.Map.init&client=',
		};

		SELECTORS = {
			MAP_CONTAINER: '.map-container',
			MAP_MODULE: '.cm-map',
			MAP_CONTENT: '.content',
		};

		ATTRIBUTES = {
			CLIENT_ID: 'data-map-client-id',
			GEO_HREF: 'data-geo-href',
			URL: 'data-kml-url',
		};

		insertMapsApiScriptIfNil = function($mapModule) {

			// Update the key to have a key if there isn't one.
			if (!APIS.MAPS_API_SRC.split('client=')[1]) {
				APIS.MAPS_API_SRC += $mapModule.attr(ATTRIBUTES.CLIENT_ID);
			}

			// If there is no google maps API script, insert it.
			if ($('script[src="' + APIS.MAPS_API_SRC + '"]').length === 0) {

				var tag,
					firstScript;

				tag = document.createElement('script');
				tag.src = APIS.MAPS_API_SRC;

				firstScript = document.getElementsByTagName('script')[0];
				firstScript.parentNode.insertBefore(tag, firstScript);

			}
		};

		_addAccessibleMaps = function(canvas, map) {
			var attemptInterval = 2,
				maxAttempts = 18,
				mA = 0,
				notYet = true,
				addKey,
				titles = {
					'pan up': 1,
					'pan down': 1,
					'pan right': 1,
					'pan left': 1,
					'zoom in': 1,
					'zoom out': 1,
					'show street map': 1,
					'show satellite imagery': 1,
				};

			// add keyboard accessibility to Google Maps
			addKey = function() {
				mA += 1;

				// only allow the function to be called a max number of times
				if (mA > maxAttempts) {
					return;
				}

				// for every DIV inside the map container
				$(canvas).find('div').each(function() {

					var title = this.getAttribute('title');

					if (title) {
						title = $.trim(title.toLowerCase());
					}

					// check if the title exists in our object
					if (titles.hasOwnProperty(title)) {
						var $el = $(this),
							hPan = Math.floor(canvas.offsetHeight / 4),
							wPan = Math.floor(canvas.offsetWidth / 4);

						titles[title] = $el;

						// set the DIV element to be clickable
						$el.attr({
							tabindex: '0',
							role: 'button',
						});

						// See http://www.visionaustralia.org/digital-access-googlemap

						$el.on('keydown.visionAusMaps', function(e) {

							var shouldPrevent = true,
								key = e.keyCode || e.which;

							if (key === 13) {
								$(this).trigger('click');
								shouldPrevent = false;
							} else if (key === 40) {//down
								map.panBy(0, wPan);
							} else if (key === 38) {//up
								map.panBy(0, -wPan);
							} else if (key === 37) {//left
								map.panBy(-hPan, 0);
							} else if (key === 39) {//right
								map.panBy(hPan, 0);
							} else {
								return;
							}

							if (shouldPrevent) {
								e.preventDefault();
								e.stopPropagation();
							}

						});

						// styling to give the focus state
						(function() {
							var mo = false,
								bo = $el.css('border'),
								ma = $el.css('margin'),
								bc = $el.css('background-color'),
								op = $el.css('opacity');

							$el.on('mouseover.visionAusMaps', function() {
								mo = true;
							}).on('mouseout.visionAusMaps', function() {
								mo = false;
							}).on('focus.visionAusMaps', function() {
								if (mo) {
									return;
								}

								$el.css({
									'border': '2px solid blue',
									'margin': '-2px',
									'background-color': 'transparent',
									'opacity': '1',
								});

							}).on('blur.visionAusMaps', function() {
								$el.css({
									'border': bo,
									'margin': ma,
									'background-color': bc,
									'opacity': op,
								});
							});

							// when set to false, this means it's run and we dont need to run it again
							notYet = false;
						}());


					}
				});

				if (notYet) {
					// run until the maps have been loaded and we're able to bind events to it
					setTimeout(addKey, attemptInterval * 1000);
				}
			};

			addKey();
		};

		init = function() {
			if ($(SELECTORS.MAP_MODULE).length > 0) {
				var $mapModule = $(SELECTORS.MAP_MODULE),
					map;
				insertMapsApiScriptIfNil($mapModule);

				$(window).on('load', function() {
					var mapContainer = $mapModule.find(SELECTORS.MAP_CONTAINER)[0],
						initialZoomAttr = $mapModule.attr('data-initial-zoom'),
						url = $mapModule.attr('data-kml-url'),
						zoom = initialZoomAttr && initialZoomAttr.length > 0 ? parseInt(initialZoomAttr) : 15,
						mapOptions = {
							zoom: zoom,
						};

					// Debug: log container and script status
					if (!mapContainer) {
						console.warn('Google Maps: mapContainer not found');
					} else {
						console.log('Google Maps: mapContainer found, size:', mapContainer.offsetWidth, mapContainer.offsetHeight);
						if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
							console.warn('Google Maps: mapContainer has zero width/height');
						}
					}
					var scriptFound = !!document.querySelector('script[src*="maps.googleapis.com"]');
					console.log('Google Maps: script found in DOM?', scriptFound);

					map = new google.maps.Map(mapContainer, mapOptions);

					//Disabling warning about ctaLayer not being used (is used by Google)
					// eslint-disable-next-line no-unused-vars
					var ctaLayer = new google.maps.KmlLayer({url, map});

					// Add accessibility
					if (mapContainer) {
						if ($('.d-touch').length === 0) {
							_addAccessibleMaps(mapContainer, map);
						}
					}
				});
			}
		};

		return {
			init: init,
		};
	}());

}(VEC, jQuery));
