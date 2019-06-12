/**
 * LEAFLET.MARKER_DIRECTION
 * vesion 0.1.0
 * @author Ivan Matias Pascual
 */
L.AngleIcon = L.Icon.extend({

	_angle: 0,

	// default
	options: {
		text: null,
		textColor: "black"
	},

	/**
	 * @override
	 * @param {object} options
	 * @param {HTMLImageElement} options.htmlImageElement Tag <img>
	 * @param {string} [options.text] Una etiqueta
	 * @param {string} [options.textColor] Color de la etiqueta
	 */
	initialize: function (options) {

		// la imagen es rectangular, hay que cubrir cualquier todos los angulos de giro que podria llegar a tener el icono si la imagen rotara
		let hypotenuse = Math.hypot(options.htmlImageElement.width, options.htmlImageElement.height);
		options.iconSize = new L.Point(hypotenuse, hypotenuse);

		L.Icon.prototype.initialize.call(this, options);
	},

	/**
	 * Se ejecuta cada vez que se adhiere a un layer.
	 * @override
	 */
	createIcon: function (oldIcon) {
		let canvas = document.createElement("canvas");
		this._setIconStyles(canvas, "icon");
		canvas.width = this.options.iconSize.x;
		canvas.height = this.options.iconSize.y;
		/*
		 * https://www.456bereastreet.com/archive/201202/using_max-width_on_images_can_make_them_disappear_in_ie8/
		 * If you try to integrate with some ui framework that use canvas or img max-width to be responsive
		 * the images disappear. That avoid that.
		 */
		canvas.style.maxWidth = "none";

		let context = canvas.getContext("2d");

		if (this.options.text) {
			context.font = "10px Courier New";
			context.fillStyle = this.options.textColor;
			context.fillText(this.options.text, 0, 20);
		}

		if (!this.options.htmlImageElement.complete || this.options.htmlImageElement.naturalHeight === 0) {
			this.options.htmlImageElement.onload = () => { // postergamos hasta que htmlImageElement este lista
				this._drawImage(context);
			};
		} else { // si la imagen ya esta cargada
			this._drawImage(context);
		}

		return canvas;
	},

	_drawImage: function (context) {
		let x = this.options.iconSize.x / 2;
		let y = this.options.iconSize.y / 2;
		context.translate(x, y);
		context.rotate(this._angle);
		context.translate(-x, -y);
		let dx = (this.options.iconSize.x - this.options.htmlImageElement.width) / 2;
		let dy = (this.options.iconSize.y - this.options.htmlImageElement.height) / 2;
		context.drawImage(this.options.htmlImageElement, dx, dy);
	},

	/**
	 * Set the angle between the maker and the north
	 * @param {number} angle Radians
	 * @return {L.AngleIcon} this
	 */
	setAngle: function (angle) {

		if (!Number.isNaN(angle)) {
			this._angle = angle % 360;
		}

		return this;
	},

	/**
	 * @return {number} angle Radians
	 */
	getAngle: function () {
		return this._angle;
	}
});

L.DirectionMarker = L.Marker.extend({

	_latLngSouth: null,

	/**
	 * @override
	 * @param {object} options
	 * @param {HTMLImageElement} [options.htmlImageElement] Tag <img>, la imagen ya preparada tiene prioridad sobre svg recibida
	 * @param {SVGSVGElement} [options.svgSVGElement] Tag <svg>, si no tengo la image preparada, prepara una con la svg recibida
	 */
	initialize: function (latLng, options) {

		if (!options.htmlImageElement) {
			let svgSVGElement = options.svgSVGElement;

			let htmlImageElement = new Image();
			htmlImageElement.width = svgSVGElement.getAttribute("width");
			htmlImageElement.height = svgSVGElement.getAttribute("height");

			let xml = (new XMLSerializer).serializeToString(svgSVGElement);
			htmlImageElement.src = "data:image/svg+xml;charset=utf-8," + xml;

			options.htmlImageElement = htmlImageElement;
		}

		options.icon = new L.AngleIcon({
			htmlImageElement: options.htmlImageElement
		});

		this._latLngSouth = latLng;

		L.Marker.prototype.initialize.call(this, latLng, options);
	},

	/**
	 * @param {L.LatLng} latLng Point south
	 * @return {L.DirectionMarker} this
	 */
	setLatLngSouth: function (latLng) {
		let latLngNorth = this._latlng;

		let angle = 0;
		if (latLng.lng == latLngNorth.lng && latLng.lat > latLngNorth.lat) { // when lnggitude or latitude is equal
			angle = Math.PI;
		} else if (latLng.lng == latLngNorth.lng && latLng.lat < latLngNorth.lat) {
			angle = 0;
		} else if (latLng.lng > latLngNorth.lng && latLng.lat == latLngNorth.lat) {
			angle = -(Math.PI / 2);
		} else if (latLng.lng < latLngNorth.lng && latLng.lat == latLngNorth.lat) {
			angle = Math.PI / 2;
		} else { // lnggitude and latitude are not equal
			let x1 = latLng.lat * Math.pow(10, 12);
			let x2 = latLngNorth.lat * Math.pow(10, 12);
			let y1 = latLng.lng * Math.pow(10, 12);
			let y2 = latLngNorth.lng * Math.pow(10, 12);

			angle = Math.atan2(y2 - y1, x2 - x1)
		}

		this.options.icon.setAngle(angle);
		this._latLngSouth = latLng;

		return this;
	},

	/**
	 * @return {L.LatLng} latLng Point south
	 */
	getLatLngSouth: function () {
		return this._latLngSouth;
	},

	/**
	 * @param {number} angle Radians
	 * @return {L.DirectionMarker} this
	 */
	setAngle: function (angle) {
		this.options.icon.setAngle(angle);
		return this;
	},

	/**
	 * @param {number} angle Radians
	 */
	getAngle: function () {
		return this.options.icon.getAngle();
	}
});

L.directionMarker = function (latLng, options) {
	return new L.DirectionMarker(latLng, options);
};
