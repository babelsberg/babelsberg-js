define(function moduleLoadImage() {
    var loadImage = function(path, callback) {
        var img = new window.Image();
        img.onload = function loaded() { callback(null, img)};
        img.onerror = function(error) { callback(error)};
        img.src = "assets/images/" + path;

        Image[path] = img;
    };

    return loadImage;
});
