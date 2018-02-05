const appLocation = "https://sistaminuten.glitch.me";
// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {
  const access_token = findAccessToken();
  if (access_token === null) {
    $("#spotify-login").on("click", authorize);
  } else {
    $("body").addClass("logged-in");
    $.ajaxSetup({
      beforeSend: function (xhr)
      {
         xhr.setRequestHeader("access-token", access_token);
      }
    });
    getPlaylists();
  }
  
  function renderPlaylistDiv(spotifyPlaylist) {
    let playlistDiv = document.createElement("div");
    playlistDiv.className = "playlist";
    playlistDiv.setAttribute("data-spotify-playlist-id", spotifyPlaylist.id);
    playlistDiv.setAttribute("data-spotify-owner-id", spotifyPlaylist.owner.id);
    let playlistImg = document.createElement("img");
    playlistImg.className = "playlist-image";
    playlistImg.src = spotifyPlaylist.images[0].url;
    playlistImg.width = 130;
    playlistImg.height = 130;
    let playlistName = document.createElement("p");
    playlistName.className = "playlist-name";
    playlistName.innerHTML = spotifyPlaylist.name;
    
    playlistDiv.appendChild(playlistImg);
    playlistDiv.appendChild(playlistName);
    
    playlistDiv.addEventListener("click", onSpotifyPlaylistClick);
    
    return playlistDiv;
  }
  
  function onSpotifyPlaylistClick(event) {
    let playlistId = event.currentTarget.getAttribute("data-spotify-playlist-id");
    let ownerId = event.currentTarget.getAttribute("data-spotify-owner-id");
    
    getSpotifyPlaylist(playlistId, ownerId);
  }
  
  function getSpotifyPlaylist(playlistId, ownerId) {
    if (!access_token) return;
    
    $.get({
      url: "/playlists/" + ownerId + "/" + playlistId
    }).done(function(data) {
      artists = data;
      nextIndex = randomArrayIndex(artists);
      next();
    }).fail(function(err) {
      console.error(err);
    });
  }
  
  function getPlaylists() {
    if (!access_token) return;
    
    $.get({
      url: "/playlists",
    }).done(function(data) {
      if (data && data.items) {
        let playlistContainer = document.querySelector("#playlists");
        let fragment = document.createDocumentFragment();
        data.items.forEach(playList => {
          let playlistDiv = renderPlaylistDiv(playList);
          fragment.appendChild(playlistDiv);
        });
        playlistContainer.appendChild(fragment);
      }
    }).fail(authorize);
  }
  
  function getSearchKeyValue() {
    if (window.location) {
      let searchString = window.location.search; //e.g. ?code=auth
      searchString = searchString.substr(1); //Removes the questionmark
      let searchArray = searchString.split("&");
      let searchKeyValue = searchArray.map((str) => {
        let split = str.split("=");
        return {
          key: split[0],
          value: split[1]
        }
      });
      return searchKeyValue;
    } else {
      alert("You're browser is too old for this webapp. Update it!")
      return null;
    }
  }
  
  function findAccessToken() {
    let searchKeyValues = getSearchKeyValue();
    let codePair = searchKeyValues.find((searchPair) => searchPair.key === "token");
    if (codePair) {
      localStorage.setItem("accessToken", codePair.value);
      return codePair.value;
    }
    if (window.localStorage) {
      let token = window.localStorage.getItem("accessToken");
      if (token) {
        return token;
      }
    } else {
      alert("You're browser is too old for this webapp. Update it!")
    }
    return null;
  }
  
  function authorize() {
    window.location.replace("/spotify_login");
  }
  
  
  bindKeys();
  function bindKeys() {
    $("body").on("keyup", function(ev) {
      // keycode 32 = space button
      if (ev.keyCode === 32) {
        next();
      }
    });
    $("#artist-img").on("click", next);
    $("#default-playlist").on("click", loadDefaultPlaylist);
  }
  
  let artists;
  let nextIndex = 0;
  
  function loadDefaultPlaylist() {
    $.get('/data', function(data) {
      artists = data.artists;
      nextIndex = randomArrayIndex(artists);
      next();
    });
  }
    
  function next() {
    if (artists.length === 0) {
      displayEmpty();
      return;
    }
    
    let artist = artists.splice(nextIndex, 1);
    setArtist(artist[0]);
    nextIndex = randomArrayIndex(artists);
    cacheImage(artists[nextIndex].img);
  }
  
  function cacheImage(imgSrc) {
    const tmpImg = new Image();
    tmpImg.src = imgSrc;
  }
  
  function randomArrayIndex(arr) {
    let rnd = Math.random();
    let index = Math.floor(rnd * arr.length);
    return index;
  }
  
  function setArtist(artist) {
    $("#artist-name").text(artist.name);
    $("#artist-img").attr("src", artist.img);
    $("#bg-cover").css("background-image", "url(" + artist.img + ")");
  }
  
  function displayEmpty() {
    alert("Finns inga fler artister!");
  }
  
  $("#playlist-toggle").on("click", function() {
    $("#playlists").toggleClass("hidden");
  });

});
