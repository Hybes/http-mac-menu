# Show HTTP Response in System Tray

<img width="100%" alt="image" src="https://github.com/Hybes/http-mac-menu/assets/53020786/acb1e550-6970-4bbf-a882-de02333168a7">

## Download/Releases

If you don't know which option to select, choose the first one:<br><br>
[Mac OS - 64Bit/Intel](https://store.brth.uk/hybes/HTTP%20Mac%20Menu-1.4.0.dmg)<br>
[Mac OS - ARM64/Silicon](https://store.brth.uk/hybes/HTTP%20Mac%20Menu-1.4.0-arm64.dmg)

[Mac OS ZIP - 64Bit/Intel](https://store.brth.uk/hybes/HTTP%20Mac%20Menu-1.4.0-mac.zip)<br>
[Mac OS ZIP - ARM64/Silicon](https://store.brth.uk/hybes/HTTP%20Mac%20Menu-1.4.0-arm64-mac.zip)

I don't understand Apple's quarantine stuff, so you might need to run: ```xattr -cr /Applications/HTTP\ Mac\ Menu.app``` in terminal after you've moved the app to your Applications folder.

## Usage

The app only runs in the tray and uses your configuration to show the result in the Menu Bar at the top of the screen.
You can then close the settings window. Don't CMD-Q as it will quit the whole app, you just need to press the 'X'.

### Running Multiple Instances

The application has support for up to 3 different requests, each with their own configuration.

## Settings / Configuration

If you want the value to be localised, IE: 12000 = 12,000. Please set the multiplier to a valid value (1)

**Invalid Data** - This usually means there is an invalid response from the HTTP request, please click the 'Open Log' button in the menu.

## Troubleshooting

What is there to go wrong?

If something does... contact me: help@cnnct.uk

## Building

If you wanna build it yourself, you can clone the repo: <br>
`git clone https://github.com/Hybes/http-mac-menu`
Fetch the node packages with <br>`npm i`
Build the installers with <br>`npm run dist`
Or test in dev with <br>`npm run start`
