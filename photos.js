/*global jQuery*/

var setupPhotos = (function ($) {
    function each (items, callback) {
        var i; //Initialize variable I
        for (i = 0; i < items.length; i += 1) {
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
            if (getFav(img.src)) {
                favIcon.className = 'favIcon icon-heart icon-2x';
            } else {
                favIcon.className = 'favIcon icon-heart-empty icon-2x';
            }
            fav.appendChild(favIcon);
            elm.appendChild(fav);
            elm.appendChild(img);

            holder.appendChild(elm);
            if($(favIcon).hasClass('icon-heart')){
                $(fav).toggle(function () {
                    //remove favorite
                    $(this).children().removeClass('icon-heart');
                    $(this).children().addClass('icon-heart-empty');
                    removeFav(img.src);
                }, function () {
                    //add favorite
                    $(this).children().addClass('icon-heart');
                    $(this).children().removeClass('icon-heart-empty');
                    recordFav(img.src);
                });
            } else {
                $(fav).toggle(function () {
                    //add favorite
                    $(this).children().addClass('icon-heart');
                    $(this).children().removeClass('icon-heart-empty');
                    recordFav(img.src);
                }, function () {
                    //remove favorite
                    $(this).children().removeClass('icon-heart');
                    $(this).children().addClass('icon-heart-empty');
                    removeFav(img.src);
                });
            }
        };
    }
    var cookieName = 'flickr-photo';
    function recordFav(newFav) {
        if(document.cookie) {
            var existingFavs=document.cookie.split("=");
            existingFavs = existingFavs[1];
            document.cookie=cookieName + '=' + existingFavs + "," + newFav;
        } else {
            document.cookie=cookieName + '=' + newFav;
        }
    }

    function getFav(favID) {
      if(document.cookie){
        var favArray=document.cookie.split("=");
        favArray = favArray[1].split(",");
        if(favArray.indexOf(favID) !== -1){
            return true;
        } else {
            return false;
        }
      } else {
          return false;
      }
    }
    
    function removeFav(favID){
        var favArray=document.cookie.split("=");
        favArray = favArray[1].split(",");
        favArray.splice(favArray.indexOf(favID), 1);
        document.cookie=cookieName + '=' + favArray;
        
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
