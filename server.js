let data = require("./data.json");
const appLocation = "https://sistaminuten.glitch.me";
const spotify_authorize_url = "https://accounts.spotify.com/authorize";


// server.js
// where your node app starts

// init project
var express = require('express');
var http = require("http");
var request = require("request");
var app = express();
var config = require("./config");

const spotifyClient = require("./spotify-client");

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

app.use(function(req, res, next) {
  let accessToken = req.get("access-token");
  if (accessToken) {
    req.accessToken = accessToken;
  }
  next();
})

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/data", function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data));
});

app.get("/spotify_login", spotifyClient.spotifyLogin);

app.get("/spotify_auth", spotifyClient.spotifyAuthorize);

app.get("/playlists", function(req, res) {
  if (!req.accessToken) return res.status(401).send();
  
  spotifyClient.getPlaylists(req.accessToken)
    .then(function(playlists) {
      res.json(JSON.parse(playlists));
    })
    .catch(function(err) {
      res.status(500).send(err);
    });
});

app.get("/playlists/:ownerId/:playlistId", function(req, res) {
  if (!req.accessToken) return res.status(401).send();
  
  spotifyClient.getPlaylistArtists(req.accessToken, req.params.ownerId, req.params.playlistId)
    .then(function(artists) {
      res.json(artists);
    })
    .catch(function(err) {
      res.status(500).send(err);
    });
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
