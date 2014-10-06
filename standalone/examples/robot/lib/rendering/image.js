/*
rts.Image = Resource.subclass({
	initialize: function(path) {
		Resource.prototype.initialize.apply(this, arguments);
		this.path = path;
	},
	
	load: function(callback) {
		this.data = new window.Image();
		this.data.onload = callback;
		this.data.onerror = callback;
		this.data.src = "data/graphics/" + this.path;
	},
	
	draw: function(aabb, sourceX, sourceY, width, height) {
		env.renderer.drawImageOnWorldAABB(this.data, aabb, sourceX, sourceY, width, height);
	}
});

rts.Image.cache = {};
rts.Image.get = function(path) {
	if(typeof rts.Image.cache[path] === "undefined") {
		rts.Image.cache[path] = new rts.Image(path);
	};
	
	return rts.Image.cache[path];
};
*/

var loadImage = function(path, callback) {
	var img = new window.Image();
	img.onload = function loaded() { callback(null, img)};
	img.onerror = function(error) { callback(error)};
	img.src = path;
	
	Image[path] = img;
};
