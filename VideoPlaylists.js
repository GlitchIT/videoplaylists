// ==UserScript==
// @name         Video Playlists
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Add playlist functionality to any website (even across domains!)
// @author       Aaron Toomey <aaron@inkiebeard.com>
// @match        *://roosterteeth.com/*
// @match        *://youtube.com/*
// @match        *://*.roosterteeth.com/*
// @match        *://*.youtube.com/*
// @grant       none
// ==/UserScript==
const config = {
  version: "0.0.1",
  state: "local",
  namespace: "videoPlaylist",
  playerIdMap: {
    "roosterteeth.com": "#video-player_html5_api",
    "youtube.com": ".html5-video-player video.html5-main-video"
  }
};
const requiredScripts = [];
let loadedScripts = [];

// shotrtcode uuidv4 generator function from: https://gist.github.com/jed/982883
function b(a) {
  return a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
}

function uuid() {
  return b();
}

class playlist {
  nextVideo() {
    let newIndex = this.currentVideoIndex ? this.currentVideoIndex++ : 0;
    this.currentVideoIndex = this.videos.length > newIndex ? newIndex : null;

    this.videoChangedHook();
  }

  prevVideo() {
    this.currentVideoIndex--;
    this.videoChangedHook();
  }

  gotoVideo(ind) {
    if (this.videos.length - 1 >= ind) {
      this.currentVideoIndex = ind;
      this.videoChangedHook();
    } else {
      console.log(
        `playlist does not contain video index ${ind}
(highest valid index ${this.videos.length - 1})`
      );
    }
  }

  videoChangedHook() {
    const video = this.videos[this.currentVideoIndex];
    window[config.namespace].storeData();
    window.location = video.url;
  }

  addVideo(url, name) {
    this.videos.push(new videoItem({ url, name }));
  }

  removeVideo(ind) {
    this.videos.splice(ind, 1);
  }

  /**
   * @param id string - UID
   * @param name string - name of playlist
   * @param options object - {player, videos}
   */
  constructor({ id, name, player, videos, currentVideoIndex, autoplay } = {}) {
    this.currentVideoIndex = currentVideoIndex || null;
    this.vidPlayer = player || null;
    this.autoplay = autoplay || true;
    this.id = id;
    this.name = name;
    if (Array.isArray(videos)) {
      videos.forEach(video => {
        this.videos.push(new videoItem(video));
      });
    }
  }
}

class playlistController {
  storeData() {
    localStorage.setItem(
      `playlists-${window.location.hostname}`,
      JSON.stringify(this)
    );
  }

  loadData() {
    let stored = localStorage.getItem(`playlists-${window.location.hostname}`);
    if (stored) {
      stored = JSON.parse(stored);
      if (stored.hasOwnProperty("playlists")) {
        Object.keys(stored.playlists).forEach(pl => {
          this.playlists[pl.id] = new playlist(pl);
        });
      }
      if (stored.hasOwnProperty("currentPlaylist")) {
        this.changePlaylist(stored.currentPlaylist);
      }
    }
  }

  findVidPlayer() {
    console.log(
      `Finding vid player based on '${location.host}': selector is '${
        config.playerIdMap[location.host]
      }'`
    );
    this.player = document.querySelector(config.playerIdMap[location.host]);
  }

  addPlaylist(name) {
    const id = uuid();
    this.playlists[id] = new playlist({ id, name, player: this.player });
    return id;
  }

  removePlaylist(id) {
    delete this.playlists[id];
  }

  changePlaylist(id) {
    if (this.playlists.hasOwnProperty(id)) {
      this.currentPlaylist = id;
      console.log(
        `${config.namespace}: ${this.playlists[id].name} active playlist`
      );
    } else {
      console.error(`Don't have playlist id ${id}`);
    }
  }

  addVideoToCurrent(url, name) {
    this.playlists[this.currentPlaylist].addVideo(url, name);
  }

  addVideoToPlaylist(url, vidName, plName) {
    const plId = Object.keys(this.playlists).find(
      id => this.playlists[id].name === plName
    );
    if (!plId) {
      console.error(`Couldn't find playlsit with name ${plName}`);
    } else {
      this.playlists[plId].addVideo(url, vidName);
    }
  }

  constructor() {
    this.currentPlaylist = null;
    this.playlists = {};
    this.player = null;
    this.findVidPlayer();
    this.loadData();
    if (Object.keys(this.playlists).length === 0) {
      this.changePlaylist(this.addPlaylist("default"));
    } else if (this.currentPlaylist === null) {
      this.changePlaylist(Object.keys(this.playlists)[0]);
    }

    window.addEventListener("beforeunload", e => {
      e.preventDefault();
      console.log("leaving page", e);
      this.storeData();
      e.returnValue = "";
    });

    console.log(
      `Video Playlist (v${config.version}): '${config.namespace}' - running ${
        config.state
      } data`
    );
  }
}

class videoItem {
  markWatched() {
    this.watched = true;
  }

  setTime(time) {
    this.currentTime = time;
  }

  constructor({ url, name, currentTime, watched }) {
    this.url = url;
    this.currentTime = currentTime || 0;
    this.watched = watched || false;
    this.name = name;
  }
}

const loaded = url => {
  loadedScripts.push(url);
  if (loadedScripts.length === requiredScripts.length) {
    window[config.namespace] =
      window[config.namespace] || new playlistController();
  }
};

// Chrome doesn't allow require, workaround to load scripts into page before run
const requireScripts = urls => {
  urls.forEach(url => {
    var script = document.createElement("script");
    script.setAttribute("src", url);
    script.addEventListener("load", e => {
      loaded(url);
    });
    document.body.appendChild(script);
  });
};

(() => {
  "use strict";

  if (requiredScripts.length) {
    requireScripts(requiredScripts);
  }
  window[config.namespace] =
    window[config.namespace] || new playlistController();
})();
