# spotprox

Finds & uses a random US proxy server for Spotify; mainly useful for using Spotify in countries where it is not available officially. If Spotify is available in your country, do not use this.

## Warning!

This has only been tested on Linux and MacOS, it should also work on Windows but I am unable to test on Windows and therefore can not confidently state that it does work.

## Requirements

- [Spotify Desktop App](https://www.spotify.com/)
- [Node.js](https://nodejs.org/) and npm
- Some way to run a command from the command line (Terminal.app, Xterm, iTerm2, xfce4-terminal, etc.)

## Usage

In order for this to work, you need to have a spotify account (free).
Use any VPN extension that offers a US server in your browser to create a Spotify account, If you don't have an account.

Download the [Spotify Desktop App](https://www.spotify.com/us/download/).

Install the Spotify Desktop App and run it at least once.

Next, open a terminal emulator (Terminal.app, Xterm, iTerm2, xfce4-terminal, etc.) and run the following commands:

### Install the script using _npm_

```bash
npm install -g spotprox
```

### Launch the script

```bash
spotprox
```

The script will update the proxy settings for Spotify and Launch the desktop app, if a proxy server stops working simply quit Spotify and run the script again.

## LICENSE

MIT
