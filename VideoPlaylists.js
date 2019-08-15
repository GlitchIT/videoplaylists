// ==UserScript==
// @name         Video Playlists
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Add playlist functionality to any website (even across domains!)
// @author       Aaron Toomey <aaron@inkiebeard.com>
// @match        *://*/*
// @grant        none
// ==/UserScript==

const requiredScripts = [
  "https://cdn.jsdelivr.net/npm/uuidv4@4.0.0/lib/uuidv4.min.js"
];

const playerIdMap = {
  "roosterteeth.com": "video-player_html5_api"
};

let loadedScripts = [];

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
  }

  addVideo(url) {
    this.videos.push(new videoItem(url));
  }

  removeVideo(ind) {
    this.videos.splice(ind, 1);
  }

  /**
   * @param id string - UID
   * @param options object - {player, videos}
   */
  constructor(id, { player = null, videos = [] } = {}) {
    this.videos = videos || [];
    this.currentVideoIndex = null;
    this.vidPlayer = player || null;
    this.autoplay = true;
    this.id = id;
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
        this.playlists = stored.playlists;
      }
      if (stored.hasOwnProperty("currentPlaylist")) {
        this.currentPlaylist = stored.currentPlaylist;
      }
    }
  }

  findVidPlayer() {
    // todo get vid player element from domain map
    this.player = document.getElementById(playerIdMap[location.host]);
  }

  addPlaylist() {
    const id = new uuid();
    this.playlists[id] = new playlist(id, { player: this.player });
  }

  removePlaylist(id) {
    delete this.playlists[id];
  }

  constructor() {
    this.currentPlaylist = null;
    this.playlists = {};
    this.player = null;
    this.findVidPlayer();
    this.loadData();
    if (Object.keys(this.playlists).length === 0) {
      this.addPlaylist();
    }
    window.addEventListener("beforeunload", e => {
      this.storeData();
    });
  }
}

class videoItem {
  markWatched() {
    this.watched = true;
  }

  setTime(time) {
    this.currentTime = time;
  }

  constructor(url, { currentTime } = {}) {
    this.url = url;
    this.currentTime = currentTime || 0;
    this.watched = false;
  }
}

const loaded = url => {
  loadedScripts.push(url);
  if (loadedScripts.length === requiredScripts.length) {
    window.beadroPlaylist = new playlistController();
  }
};
// Chrome doesn't alow require, workaround to load scripts into page before run
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

(function() {
  "use strict";

  requireScripts(requiredScripts);
})();
