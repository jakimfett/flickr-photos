/*global jQuery*/

var setupPhotos = (function ($) {
    function each (items, callback) { //Function to process multiple items with a callback
        var count; //Initialize the count variable

        for (count = 0; count < items.length; count += 1) { //Loop through the contained code until all items have been processed
            //by using the setTimeout function, you can break off processing of the item into a "virtual thread"
            //this allows the function to execute multiple bits of code concurrently
            setTimeout(callback.bind(this, items[count]), 0);
        }
    }

    function flatten (items) { //Function for combining arrays
        return items.reduce(function (a, b) {
            return a.concat(b); //Returns the combined arrays
        });
    }

    function loadPhotosByTag (tag, max, callback) { //Loading photos from flickr based on input
        var photos = []; //Create array for holding the photos
        var callback_name = 'callback_' + Math.floor(Math.random() * 100000); //Create callback name with random appended ID

        window[callback_name] = function (data) { //Create window object
            delete window[callback_name]; //Delete window object

            var count;
            for (count = 0; count < max; count += 1) {//Process each data item
                photos.push(data.items[count].media.m); //Push data onto the photos array
            }
            callback(null, photos); //Return photos array after it has been loaded with data.
        };

        $.ajax({ //Making use of the flickr ajax api
            url: 'http://api.flickr.com/services/feeds/photos_public.gne', //Flickr url
            data: { //Data to be retrieved from flickr
                tags: tag,
                lang: 'en-us',
                format: 'json',
                jsoncallback: callback_name
            },
            dataType: 'jsonp' //Set data type
        });
    }

    function loadAllPhotos (tags, max, callback) {
        var results = []; //Initialize results array
        function handleResult (err, photos) {
            if (err) { return callback(err); } //Return an error if one is thrown

            results.push(photos); //Push the photos array onto the results array
            if (results.length === tags.length) { //When the results array matches the number of tags
                callback(null, flatten(results)); //Combine the nested arrays into a single array
            }
        }

        each(tags, function (tag) { //Call the each function to process each tag seperately
            loadPhotosByTag(tag, max, handleResult); //Load photos for a given tag
        });
    }

    function renderPhoto (photo) { //Process the photo data into a usable form
        var img = new Image(); //New Image object
        img.src = photo; //Set the image source
        return img; //Return the image object
    }

    var max_per_tag = 5; //Setting a variable which defines max number of images per tag
    function imageAppender (id) {
        var holder = document.getElementById(id); //Load the specific element into a holding variable
        return function (img) {
            //Initialize variables
            var elm = document.createElement('div'); //Create the <div> element to contain the photo and favorite button
            var fav = document.createElement('span'); //Create the favorites span
            var favIcon = document.createElement('i'); //Create the Font Awesome <i> element

            //Setting element class names
            elm.className = 'photo';
            fav.className = 'favorite'; //Name the span

            //Logic for the favorite button
            if (isFav(img.src)) { //Check if image has been favorited
                //If favorited, set icon to icon-heart (made red in CSS).
                favIcon.className = 'favIcon icon-heart icon-2x';
            } else {
                //Otherwise, use icon-heart-empty
                favIcon.className = 'favIcon icon-heart-empty icon-2x';
            }

            //Nesting the elements
            fav.appendChild(favIcon); //Add the <i> element inside the <span>
            elm.appendChild(fav); //Add the <span> inside the <div>
            elm.appendChild(img); //Add the image to the <div>

            //Add the finished element to the content holder
            holder.appendChild(elm);

            //Logic for toggling the "favorite" button
            if($(favIcon).hasClass('icon-heart')){//Check whether this specific element is already a favorite
                $(fav).toggle(function () {
                    //First click removes the favorite
                    $(this).children().removeClass('icon-heart');
                    $(this).children().addClass('icon-heart-empty');
                    removeFav(img.src);
                }, function () {
                    //Second click action will add the image back as a favorite
                    $(this).children().addClass('icon-heart');
                    $(this).children().removeClass('icon-heart-empty');
                    recordFav(img.src);
                });
            } else { //If the image is not already a favorite
                $(fav).toggle(function () {
                    //First click will add favorite
                    $(this).children().addClass('icon-heart');
                    $(this).children().removeClass('icon-heart-empty');
                    recordFav(img.src);
                }, function () {
                    //Second click will remove favorite
                    $(this).children().removeClass('icon-heart');
                    $(this).children().addClass('icon-heart-empty');
                    removeFav(img.src);
                });
            }
        };
    }

    var cookieName = 'flickr-photo'; //Set the cookie name in a variable
    function recordFav(newFav) {
        if(document.cookie) {//If the cookie exists already
            var existingFavs=document.cookie.split("="); //Read cookie into an array
            existingFavs = existingFavs[1]; //Split cookie values into an array
            document.cookie=cookieName + '=' + existingFavs + "," + newFav; //Set the cookie with new value in addition to old values
        } else { //Otherwise (cookie does not exist)
            document.cookie=cookieName + '=' + newFav; //Create cookie with favorited image as the value
        }
    }

    function isFav(favID) { //Check to see if the cookie contains a specific favorite
      if(document.cookie){ //Cookie exists
        var favArray=document.cookie.split("="); //Read cookie into array
        favArray = favArray[1].split(","); //Split cookie values into an array
        if(favArray.indexOf(favID) !== -1){ //If the image is not favorited
            return true;
        } else { //If the image has been favorited
            return false;
        }
      } else { //If the cookie doesn't exist, function will always return false
          return false;
      }
    }

    function removeFav(favID){ //Removing specific favorite
        var favArray=document.cookie.split("="); //Read cookie into an array

        favArray = favArray[1].split(","); //Split values into an array
        favArray.splice(favArray.indexOf(favID), 1); //Removed specified favorite from the values array

        document.cookie=cookieName + '=' + favArray; //Set the cookie value equal to the values array
        //Could potentially add logic to remove cookie if there are no more values
    }

    return function setup (tags, callback) { //Bring it all together and return the result
        loadAllPhotos(tags, max_per_tag, function (err, items) {
            if (err) { return callback(err); } //Return any errors caught

            each(items.map(renderPhoto), imageAppender('photos')); //Process through each photo
            callback(); //Catch any errors
        });
    };
}(jQuery));
