# VideoPlaylists
Add video playlist functionality to any site that hosts videos (and even across domains). Currently designed to be used with Tampermonkey or similar, one day I hope to make it an extension.

Completely vanilla JS aside from one library, uses UUIDv4 library for UID generation.

## Gotchas
Runs locally in one browser, not shareable data between multiple browsers. Currently only accesible via console in developer tools (this is one of the things I hope to change asap to have a small unobtrusive UI for managing the playlist).

## TODOs/Roadmap
* playlist video ordering
* UI to maintain the playlist(s)
* improved tracking of video playtime (event handler for player currentTime update)
* more meta data in video object
* move to website using iframes and data saved to cloud storage to allow for resumption of playlist on different device
* api to allow for website integration
* chrome extension
* firefox addon
* electron app using iframes (hella in the future, maybe)
