/*global jQuery*/

var setupPhotos = (function ($) {
    function each (items, callback) {
        var i; //Initialize variable I
        for (i = 0; i < items.length; i += 1) {
            //Set i=0
            //then while i is less than the variable items.length
            //
            setTimeout(callback.bind(this, items[i]), 0);
        }
    }

    function flatten (items) {
        return items.reduce(function (a, b) {
            return a.concat(b);
        });
    }

    function loadPhotosByTag (tag, max, callback) {
        var photos = [];
        var callback_name = 'callback_' + Math.floor(Math.random() * 100000);

        window[callback_name] = function (data) {
            delete window[callback_name];
            var i;
            for (i = 0; i < max; i += 1) {
                photos.push(data.items[i].media.m);
            }
            callback(null, photos);
        };

        $.ajax({
            url: 'http://api.flickr.com/services/feeds/photos_public.gne',
            data: {
                tags: tag,
                lang: 'en-us',
                format: 'json',
                jsoncallback: callback_name
            },
            dataType: 'jsonp'
        });
    }

    function loadAllPhotos (tags, max, callback) {
        var results = [];
        function handleResult (err, photos) {
            if (err) { return callback(err); }

            results.push(photos);
            if (results.length === tags.length) {
                callback(null, flatten(results));
            }
        }

        each(tags, function (tag) {
            loadPhotosByTag(tag, max, handleResult);
        });
    }

    function renderPhoto (photo) {
        var img = new Image();
        img.src = photo;
        return img;
    }

    var max_per_tag = 5;
    var count = 0;
    function imageAppender (id) {
        var holder = document.getElementById(id);
        return function (img) {
            var elm = document.createElement('div');
            var fav = document.createElement('span');
            var favIcon = document.createElement('i');
            elm.className = 'photo';
            fav.className = 'favorite';
            fav.style = 'opacity: 0';
            favIcon.className = 'favIcon icon-heart-empty icon-2x';
            fav.appendChild(favIcon);
            elm.appendChild(fav);
            elm.appendChild(img);
            holder.appendChild(elm);
            $(fav).click(function(){
                $(this).children().toggleClass('icon-heart-empty');
                $(this).children().toggleClass('icon-heart');
            });
        };
    }

    // ----

    return function setup (tags, callback) {
        loadAllPhotos(tags, max_per_tag, function (err, items) {
            if (err) { return callback(err); }

            each(items.map(renderPhoto), imageAppender('photos'));
            callback();
        });
    };
}(jQuery));
