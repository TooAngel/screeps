Screeps Autocomplete
====================
The purpose of this is to add screeps autocomplete to IDEs by creating a definition from the documents. People can then
add this project as a library in their IDE, and their IDE should be able to start autocompleting their code. Tested
somewhat in JetBrain's WebStorm

## How to Install

#### Webstorm (Or Other Jetbrains IDE's)
This can be done by quite simply copying the `ScreepsAutocomplete` folder in their project, and Webstorm should automatically
detect it and add it to the autocompletion
###### Adding it as a library
Instead of copying the `ScreepsAutocomplete` folder to each and every project folder, you can add it as a global library.

* Create a new project in Webstorm if you don't already have one and open it.
* In the menu bar at the top of the screen, navigate to `File` -> `Settings` -> `Languages & Frameworks` -> `JavaScript` -> `Libraries`
* Click `Add`.
* Name the Library whatever you want.
* Set `Framework type` to custom, if it is not already so. `Version` can be left blank.
* Change `Visibility` to `Global`.
* Click the green plus sign to the right of the listbox below `Visibility`, then choose "Attach Directories...".
* Navigate to the ScreepsAutocomplete folder, select the folder itself and click `OK`.
* Click `OK` at the bottom of the "Edit Library" dialog.
* Click the `Enabled` checkbox on the library you just created, make sure it's checked before continuing.
* Click `OK` at the bottom of the "Settings" dialog.

Webstorm should automatically detect the library and add it to the autocompletion.

#### Visual Studio
Copy the `ScreepsAutcompete` folder in to your project, then create a file called `_references.js`. Right click your newly
created and empty file, and then select `Update JavaScript References`. The file should now be populated autocomplete should
be available.

#### Sublime Text
There are two ways to enable Autocomplete in Sublime Text, both of them require installing a plugin through 
[`Package Control`](https://packagecontrol.io/installation), and copying `ScreepsAutocomplete` in to your project.

 * `TernJS` - Install `TernJS` through `Package Control`, restart Sublime Text and try `var room = new Room(); room.lookAt(x, y)` 
 to see if Autocomplete is working. If not, try the next options
 
 * `SublimeCodeIntel` - Install `SublimeCodeIntel` through `Package Control`. Go to `Preferences > Package Settings > SublimeCodeIntel > Settings -- User`
 and copy the contents of `ScreepsAutocomplete/config/SublimeCodeIntel.json` in to the file that opens. Save and restart Sublime
 Text. After waiting for CodeIntel to process JavaScript, Autocomplete should be working
 
#### Atom
Integration with Atom is done through use of the [`atom-ternjs`](https://github.com/tststs/atom-ternjs) package. Here's the steps

 * Copy `ScreepsAutocomplete` in to your project folder
 * Install the `atom-ternjs` package
 * Put the following in your `.tern-project` file
```json
{
  "ecmaVersion": 6,
  "libs": [],
  "loadEagerly": [
    "ScreepsAutocomplete/**/*.js"
  ]
}
```
 * Restart and Enjoy