/*global jQuery*/

var setupPhotos = (function ($) {
    function each (items, callback) { //function to process multiple items with a callback
        var count; //Initialize the count variable

        for (count = 0; count < items.length; count += 1) { //Loop through the contained code until all items have been processed
            //by using the setTimeout function, you can break off processing of the item into a "virtual thread"
            //this allows the function to execute multiple bits of code concurrently
            setTimeout(callback.bind(this, items[count]), 0);
        }
    }

    function flatten (items) { //function for combining arrays
        return items.reduce(function (a, b) {
            return a.concat(b); //returns the combined arrays
        });
    }

    function loadPhotosByTag (tag, max, callback) { //Loading photos from flickr based on input
        var photos = []; //create array for holding the photos
        var callback_name = 'callback_' + Math.floor(Math.random() * 100000); //create callback name with random appended ID

        window[callback_name] = function (data) { //create window object
            delete window[callback_name]; //delete window object

            var count;
            for (count = 0; count < max; count += 1) {//process each data item
                photos.push(data.items[count].media.m); //push data onto the photos array
            }
            callback(null, photos); //return photos array after it has been loaded with data.
        };

        $.ajax({ //making use of the flickr ajax api
            url: 'http://api.flickr.com/services/feeds/photos_public.gne', //flickr url
            data: { //data to be retrieved from flickr
                tags: tag,
                lang: 'en-us',
                format: 'json',
                jsoncallback: callback_name
            },
            dataType: 'jsonp' //set data type
        });
    }

    function loadAllPhotos (tags, max, callback) {
        var results = []; //initialize results array
        function handleResult (err, photos) {
            if (err) { return callback(err); } //return an error if one is thrown

            results.push(photos); //push the photos array onto the results array
            if (results.length === tags.length) { //when the results array matches the number of tags
                callback(null, flatten(results)); //combine the nested arrays into a single array
            }
        }

        each(tags, function (tag) { //call the each function to process each tag seperately
            loadPhotosByTag(tag, max, handleResult); //load photos for a given tag
        });
    }

    function renderPhoto (photo) { //process the photo data into a usable form
        var img = new Image(); //new Image object
        img.src = photo; //set the image source
        return img; //return the image object
    }

    var max_per_tag = 5; //setting a variable which defines max number of images per tag
    function imageAppender (id) {
        var holder = document.getElementById(id); //load the specific element into a holding variable
        return function (img) {
            //initialize variables
            var elm = document.createElement('div'); //create the <div> element to contain the photo and favorite button
            var fav = document.createElement('span'); //create the favorites span
            var favIcon = document.createElement('i'); //create the Font Awesome <i> element

            //setting element class names
            elm.className = 'photo';
            fav.className = 'favorite'; //name the span

            //Logic for the favorite button
            if (isFav(img.src)) { //check if image has been favorited
                //If favorited, set icon to icon-heart (made red in CSS).
                favIcon.className = 'favIcon icon-heart icon-2x';
            } else {
                //Otherwise, use icon-heart-empty
                favIcon.className = 'favIcon icon-heart-empty icon-2x';
            }

            //Nesting the elements
            fav.appendChild(favIcon); //add the <i> element inside the <span>
            elm.appendChild(fav); //add the <span> inside the <div>
            elm.appendChild(img); //add the image to the <div>

            //add the finished element to the content holder
            holder.appendChild(elm);

            //logic for toggling the "favorite" button
            if($(favIcon).hasClass('icon-heart')){//if it's already a favorite
                $(fav).toggle(function () {
                    //first toggle action is to remove favorite
                    $(this).children().removeClass('icon-heart');
                    $(this).children().addClass('icon-heart-empty');
                    removeFav(img.src);
                }, function () {
                    //second toggle action will add favorite
                    $(this).children().addClass('icon-heart');
                    $(this).children().removeClass('icon-heart-empty');
                    recordFav(img.src);
                });
            } else { //if it's not already a favorite
                $(fav).toggle(function () {
                    //first toggle will add favorite
                    $(this).children().addClass('icon-heart');
                    $(this).children().removeClass('icon-heart-empty');
                    recordFav(img.src);
                }, function () {
                    //second toggle will remove favorite
                    $(this).children().removeClass('icon-heart');
                    $(this).children().addClass('icon-heart-empty');
                    removeFav(img.src);
                });
            }
        };
    }

    var cookieName = 'flickr-photo'; //set the cookie name in a variable
    function recordFav(newFav) {
        if(document.cookie) {//if the cookie exists already
            var existingFavs=document.cookie.split("="); //read cookie into an array
            existingFavs = existingFavs[1]; //split cookie values into an array
            document.cookie=cookieName + '=' + existingFavs + "," + newFav; //Set the cookie with new value in addition to old values
        } else { //Otherwise (cookie does not exist)
            document.cookie=cookieName + '=' + newFav; //create cookie with favorited image as the value
        }
    }

    function isFav(favID) { //check to see if the cookie contains a specific favorite
      if(document.cookie){ //cookie exists
        var favArray=document.cookie.split("="); //read cookie into array
        favArray = favArray[1].split(","); //split cookie values into an array
        if(favArray.indexOf(favID) !== -1){ //if it's not favorited
            return true;
        } else { //if it has been favorited
            return false;
        }
      } else { //if the cookie doesn't exist, will always return false
          return false;
      }
    }

    function removeFav(favID){ //removing specific favorite
        var favArray=document.cookie.split("="); //read cookie into an array

        favArray = favArray[1].split(","); //split values into an array
        favArray.splice(favArray.indexOf(favID), 1); //removed specified favorite from the values array

        document.cookie=cookieName + '=' + favArray; //set the cookie value equal to the values array
        //could potentially add logic to remove cookie if there are no more values
    }

    return function setup (tags, callback) { //bring it all together and return the result
        loadAllPhotos(tags, max_per_tag, function (err, items) {
            if (err) { return callback(err); } //return any errors

            each(items.map(renderPhoto), imageAppender('photos')); //process through each photo
            callback(); //catch any errors
        });
    };
}(jQuery));
