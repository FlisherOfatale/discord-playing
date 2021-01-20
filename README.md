<p align="center"><a href="https://nodei.co/npm/discord-playing/"><img src="https://nodei.co/npm/discord-playing.png"></a></p>

# discord-playing
An extremely simple module that highligh Live player of specifics games by assigning them a temporary role 

## Installation
This module assumes you already have a basic [Discord.js](https://discord.js.org/#/) bot setup.
Simply type the following command to install the module and it depedencies.
```
npm i discord-playing
``` 

##Discord.js v11 compatibility
You can install the last version working with Discord.js v11 by using `npm install discord-playing@discord.js-v11`.
While this version should work, it's not maintainted anymore.

##Instructions
Once you've done this, setting the module will be very easy.
And you can follow the code  below to get started!

###Single-Server Usage (no server ID required in the configuration)
```js
const Playing = require("discord-playing");

Playing(client, {
	live :  "In-Game",
	games : ["Star Citizen"], 			// Array of Games, can be 1 or multiples format changed on v2.0.0
});
```
###Multi-Servers Usage 

```js
const Playing = require("discord-playing");
Playing(bot, {
	"125048273865015211" : {
		live :  "In-Game",
		games : ["Star Citizen", "DCS World"],          // 1 or multiple games, format changed on v2.0.0
		//,required : "Streamers" // optional parameter, only use if you want to take action on people of a specific role
		}	
	}
});


##Caveat:
-If you take actions on roles that have duplicate name, the module might get confused 
-Multi-Servers configuration require to know Server ID

###English:
This module was initialy coded for the Bucherons.ca gamers community and the Star Citizen Organization "Gardiens du LYS".

###Français:
Ce module a initiallement été conçu pour la communauté de gamers Bucherons.ca, la communauté gaming pour adultes au Québec, et l'organisation des Gardiens du LYS dans Star Citizen.  
  
Liens:  https://www.bucherons.ca et https://www.gardiensdulys.com  

##Support:
You can reach me via my Discord Development Server at https://discord.gg/Tmtjkwz

###History:  
2.2.4 Fixing a crash on line 70, thanks to Badbird-5907
2.2.3 Adding option to use custom status 
2.2.0 Improved error logging  
2.1.1 Fixed self-reported version  
2.1.0 Added back the option to set a required group  
2.0.2 Added better check when members isn't playing the designated games anymore  
2.0.1 Initial push to GitHub, and Initial Discord.js v12 verion. removed required group option, contact me if you need.  
1.7.1 Modified the scheduler to avoid spamming (one action per 2 seconds max), last v11 compatible version  
1.0.0 Initial publish  

