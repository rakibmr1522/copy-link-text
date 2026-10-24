# Copy Link Text

A lightweight Chrome extension that adds **Copy Link Text** to the right-click menu on links.

![Copy Link Text logo](icons/logo-original.png)

## Features

- Right-click a link and choose **Copy Link Text**.
- Copies the main visible title/text instead of the URL.
- Attempts to ignore breadcrumb text, website names, and URL-like metadata.
- Uses the original project logo supplied by the creator.
- Does not add buttons or change the webpage layout.

## Install locally

1. Download or clone this repository.
2. Open `chrome://extensions` in Google Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this project folder (the folder containing `manifest.json`).

Then right-click a link on a webpage and choose **Copy Link Text**.

## Limitations

Some websites use custom components, closed Shadow DOM, embedded frames, or dynamically generated content that may prevent the extension from finding the intended label. Browser-internal pages and some protected content do not allow extension scripts.

## Privacy

Copy Link Text does not intentionally collect, store, or transmit browsing history, page text, or copied text. Text is processed locally in the active page and sent to the clipboard when the user selects the context-menu action. See [PRIVACY.md](PRIVACY.md).

## Project structure

- `manifest.json` — Chrome Extension Manifest V3 configuration
- `background.js` — context-menu setup and copy logic
- `icons/` — extension icons and original logo

## License

This repository does not currently include an open-source license. Unless a license is added, standard copyright rules apply.