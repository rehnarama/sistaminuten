/* global Set */

const spotify_authorize_url = "https://accounts.spotify.com/authorize";
const spotify_token_url = "https://accounts.spotify.com/api/token";
const spotify_api_url = "https://api.spotify.com/v1/";

const config = require("./config");

const request = require("request-promise-native");

function spotifyLogin(req, res) {
  let searchParameters = [
    "client_id=" + process.env.SPOTIFY_CLIENT_ID,
    "response_type=code",
    "redirect_uri=" + config.redirect_uri,
    "scope=playlist-read-private playlist-read-collaborative"
  ];
  let parameterString = searchParameters.join("&");
  res.redirect(spotify_authorize_url + "?" + parameterString)
}
module.exports.spotifyLogin = spotifyLogin;

function spotifyAuthorize(req, res) {
  let code = req.query.code;
  if (!code) {
    res.redirect("/");
  }
  
  request.post({
    url: spotify_token_url,
    form: {
      grant_type: "authorization_code",
      code: code,
      redirect_uri: config.redirect_uri,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET
    }
  }).then(function(result){
    let parsedResult = JSON.parse(result);
    
    return res.redirect(config.app_location + "?token=" + parsedResult.access_token);
  }).catch(function(err) {
    res.status(500).send(err);
  });
}
module.exports.spotifyAuthorize = spotifyAuthorize;

function getPlaylists(accessToken) {
  return request.get({
    baseUrl: spotify_api_url,
    url: "/me/playlists",
    headers: {
      Authorization: "Bearer " + accessToken
    }
  });
}
module.exports.getPlaylists = getPlaylists;

function getPlaylistArtists(accessToken, ownerId, playlistId) {
  return request.get({
    baseUrl: spotify_api_url,
      url: "/users/" + ownerId + "/playlists/" + playlistId + "?fields=tracks.total",
      headers: {
        Authorization: "Bearer " + accessToken      
      }
  }).then(function(data) {
    let playlist = JSON.parse(data);
    let total_tracks = playlist.tracks.total;
    let limit = 100; // spotify max limit
    
    let requests = [];
    
    for (let offset = 0; offset < total_tracks; offset += limit) {
      requests.push(request.get({
      baseUrl: spotify_api_url,
      url: "/users/" + ownerId + "/playlists/" + playlistId + "/tracks?limit=" + limit + "&offset=" + offset,
      headers: {
        Authorization: "Bearer " + accessToken      
      }}));
    }
    
    return Promise.all(requests);
  }).then(function(data) {
    let playlist1 = data[0] ? JSON.parse(data[0]) : { items: [] };
    let playlist2 = data[1] ? JSON.parse(data[1]) : { items: [] };
    let playlist3 = data[2] ? JSON.parse(data[2]) : { items: [] };
    
    const items = playlist1.items.concat(playlist2.items, playlist3.items);
    const artistIds = new Set();
    
    items.forEach((item) => artistIds.add(item.track.artists[0].id)); //First artist is the relevant one
    let artists = Array.from(artistIds);
    
    let promises = [];
    for (let i = 0; i < artists.length / 50; i++) {
      promises.push(request.get({
        baseUrl: spotify_api_url,
        url: "/artists?ids=" + artists.slice(i * 50, (i + 1) * 50).join(","),
        headers: {
          Authorization: "Bearer " + accessToken            
        }
      }));
    }
    
    return Promise.all(promises);
  }).then(function(data) {
    let artists = data.map(d => JSON.parse(d)).reduce((acc, data) => acc.concat(data.artists), []);
    return artists.map(artist => ({ name: artist.name, img: artist.images[0].url }));
  }).catch(function(err) {
    throw new Error(err);
  });
}
module.exports.getPlaylistArtists = getPlaylistArtists;