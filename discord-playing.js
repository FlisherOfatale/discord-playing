/*
Playing Highligh Module for DiscordJS
Author: Flisher (andre@jmle.net)
Version 2.1.1

##History:
2.1.1 Fixed self-reported version  
2.1.0 Added back the option to set a required group
2.0.2 Added better check when members isn't playing the designated games anymore
2.0.1 Initial push to GitHub, and Initial Discord.js v12 verion  
1.7.1 Modified the scheduler to avoid spamming (one action per 2 seconds max), last v11 compatible version  
1.0.0 Initial publish  


// Todo: 
	Add randomness in the minutes for the cron task
	Add a limit of actions per minutes
	Add muti roles capability per server
*/

module.exports = async (bot, options) => {
	const cron = require('node-cron');

	const description = {
		name: `discord-playing`,
		filename: `playing.js`,
		version: `2.1.1`
	}

	console.log(`Module: ${description.name} | Loaded - version ${description.version} from ("${description.filename}")`)
	const DiscordJSversion = require("discord.js").version
	if (DiscordJSversion.substring(0, 2) !== "12") console.error("This version of discord-lobby only run on DiscordJS V12 and up, please run \"npm i discord-playing@discord.js-v11\" to install an older version")
	if (DiscordJSversion.substring(0, 2) !== "12") return

	if (!options) {
		options = {};
	}

	let Ready = false

	// Add check on startup and intialize the Ready Value
	if (options.AlreadyReady === true) {
		onReady()
		delete options.AlreadyReady
	} else {
		bot.on("ready", () => {
			onReady()
		});
	}

	async function onReady() {
		Ready = true;
		console.log(`Module: ${description.name} | Ready`)
	}

	// Add a Cron job every minutes
	let jobPlayingCheck = new cron.schedule('*/3 * * * * *', function () { // check 10 seeconds
		if (!Ready) return;
		Check(bot, options);
	});

	async function Check(bot, options) {
		if (!Ready) return;
		Ready = false

		if (options && options.live) {
			// Single Server Config, will default to first guild found in the bot
			let guild = bot.guilds.first();
			await GamingLive(guild, options)
			await GamingNotLive(guild, options)
		} else {
			// Multi-Servers Config
			for (let key in options) {
				// check that guild is loaded			
				let guild = bot.guilds.cache.get(key);
				if (guild) {
					await GamingLive(guild, options[key])
					await GamingNotLive(guild, options[key])
				} else {
					console.log(`${description.name} -> Check - Bot isn't connected to Guild "${key}"`)
				}
			}
		}
		Ready = true
	}


	function isPlaying(activity, games) {
		return games.includes(activity.name)

	}


	function gotRequiredRole(member, requiredRole) {
		let returnValue = false
		if (typeof requiredRole !== "undefined") {
			returnValue = (typeof (member.roles.cache.find(val => val.name === requiredRole || val.id === requiredRole)) !== "undefined")
		} else {
			returnValue = true
		}
		return returnValue
	}


	async function addRole(member, role) {
		let actionTaken = false
		try {
			if (!member.roles.cache.find(val => val.name === role || val.id === role)) {
				let resolvableRole = member.guild.roles.cache.find(val => val.name === role || val.id === role)
				await member.roles.add(resolvableRole)
				actionTaken = true
			} else {
				// Do Nothing
			}
		} catch (e) {
			console.error(`${description.name} -> GamingLive - Bot could not assign role to ${member} of guild ${member.guild} / ${member.guild.id} )`);
		}
		return actionTaken
	}


	async function removeRole(member, role) {
		let actionTaken = false
		try {
			if (member.roles.cache.find(val => val.name === role || val.id === role)) {
				let resolvableRole = member.guild.roles.cache.find(val => val.name === role || val.id === role)
				await member.roles.remove(resolvableRole)
				actionTaken = true
			} else {
				// Do Nothing
			}
		} catch (e) {
			console.error(`${description.name} -> GamingLive - Bot could not remove role to ${member} of guild ${member.guild} / ${member.guild.id} )`);
		}
		return actionTaken
	}


	async function GamingLive(guild, options) {
		// Check if the bot can manage Roles for this guild
		if (guild.me.hasPermission("MANAGE_ROLES")) {
			// Loop trough presence to find streamers (type 1)
			let presences = guild.presences;
			let actionAlreadyTaken = false
			if (presences) {
				// presences.cache.forEach(async function (element, key) {	
				for (let [key, element] of presences.cache) {
					if (!actionAlreadyTaken) { // This check will skip the elements if an action was already taken, it's to prevent API spam when too many status need to be updated
						// Loop trought presence within the cache
						if (typeof element.activities !== undefined) { // element.activities will be set only if there is 1 or more activities active
							// The activities list is an array, needing to parse trought it
							for (let activityKey in element.activities) {
								let activity = element.activities[activityKey]
								if (activity && activity.type === "PLAYING") {
									let member = element.guild.members.cache.get(key)
									if (gotRequiredRole(member, options.required)) {
										if (isPlaying(activity, options.games)) {
											actionAlreadyTaken = await addRole(member, options.live)
										}
									}
								}
							}

						}
					}

				}
			}
		} else {
			console.error(`${description.name} -> GamingLive - Bot doesn't have "MANAGE_ROLES" permission on Guild "${guild.name}" (${guild.id})`);
		}
	}

	async function GamingNotLive(guild, options) {
		// Check if the bot can manage Roles for this guild
		if (guild.me.hasPermission("MANAGE_ROLES")) {
			// Loop trough presence to find streamers (type 1)
			let gamingMembers = guild.roles.cache.find(val => val.name === options.live).members
			let actionAlreadyTaken = false // This check will skip the elements if an action was already taken, it's to prevent API spam when too many status need to be updated
			for (let [memberid, member] of gamingMembers) {
				if (!actionAlreadyTaken) {
					let isPlayingSC = false
					if (member.presence && typeof member.presence.activities !== undefined && Object.keys(member.presence.activities).length > 0) {
						// Need to iterate activities
						for (let activityKey in member.presence.activities) {
							let activity = member.presence.activities[activityKey]
							if (activity && activity.type === "PLAYING") {
								if (isPlaying(activity, options.games)) {
									isPlayingSC = true
								}
							}
						}
					} else {
						// No activity, the member isn't playing anymore

					}
					if (!isPlayingSC) actionAlreadyTaken = await removeRole(member, options.live)

				}

			}
		} else {
			console.error(`${description.name} -> GamingLive - Bot doesn't have "MANAGE_ROLES" permission on Guild "${guild.name}" (${guild.id})`);
		}
	}
}