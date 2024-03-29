/*
Playing Highligh Module for DiscordJS
Author: Flisher (andre@jmle.net)

Todo: 
	Add randomness in the minutes for the cron task
	Add a limit of actions per minutes
	Add muti roles capability per server
*/

module.exports = async (client, options) => {
	const cron = require('node-cron');

	const description = {
		name: `discord-playing`,
		filename: `playing.js`,
		version: `3.1.1`
	}

	if (!options) {
		options = {};
	}

	let Ready = false
	const debug = false

	console.log(`Module: ${description.name} | Loaded - version ${description.version} from ("${description.filename}")`)
	const DiscordJSversion = require("discord.js").version.substring(0, 2)

	if (DiscordJSversion === '11') console.error("This version of discord-lobby only run on DiscordJS V13 and up, please run \"npm i discord-playing@discord.js-v11\" to install an older version")
	if (DiscordJSversion === '12') console.error("This version of discord-lobby only run on DiscordJS V13 and up, please run \"npm i discord-playing@discord.js-v12\" to install an older version")
	if (DiscordJSversion !== '13') return

	// Check that required Gateway Intention
	const {
		Intents
	} = require('discord.js');
	const liveIntent = new Intents(client.options.intents)
	const requiredIntent = ['GUILD_PRESENCES', 'GUILDS', 'GUILD_MEMBERS']
	const gotAllIntent = liveIntent.has(requiredIntent)

	if (gotAllIntent) {
		init(client, options)
	} else {
		console.log(`Module: ${description.name} | Version ${description.version} NOT initialized due to the following reasons ")`)
		for (let i in requiredIntent) {
			let checkedIntent = requiredIntent[i]
			if (!liveIntent.has(requiredIntent[i])) {
				console.log(`Module: ${description.name} | Missing Gateway Intent ${requiredIntent[i]}`)
			}
		}
	}



	function init(client, options) {
		if (debug) console.log(`Module: ${description.name} | init start`)
		// Add check on startup and intialize the Ready Value
		if (options.AlreadyReady === true) {
			onReady()
			delete options.AlreadyReady
		} else {
			client.on("ready", () => {
				onReady()
			});
		}
	}

	async function onReady() {
		if (debug) console.log(`Module: ${description.name} | onReady start`, {
			"Ready": Ready
		})
		Ready = true;
		console.log(`Module: ${description.name} | onReady`)
		// Serverless Config
		if (options && options.live) {
			if (typeof options.casesensitive === 'undefined') options.casesensitive = true
			if (typeof options.exactmatch === 'undefined') options.exactmatch = true
			if (options.casesensitive === false) {
				for (let [key, element] of options.games) {
					options.games[key] = options.games[key].toLowerCase()
				}
			}
		} else {
			// Initialize if options are multi-server
			for (let guildid in options) {
				if (typeof options[guildid].casesensitive === 'undefined') options[guildid].casesensitive = true
				if (typeof options[guildid].exactmatch === 'undefined') options[guildid].exactmatch = true
				if (options[guildid].casesensitive === false) {
					for (let [key] in options[guildid].games) {
						options[guildid].games[key] = options[guildid].games[key].toLowerCase()
					}
				}
			}
		}
		// Add a Cron job every minutes
		let jobPlayingCheck = new cron.schedule('*/3 * * * * *', function () { // check 10 seeconds
			if (debug) console.log(`Module: ${description.name} | jobPlayingCheck start`, {
				"Ready": Ready
			})
			if (!Ready) return;
			Check(client, options);
		});
	}



	async function Check(bot, options) {
		if (debug) console.log(`Module: ${description.name} | Check start`)
		if (!Ready) return;
		Ready = false

		if (options && options.live) {
			// Single Server Config, will default to first guild found in the bot
			let guild = client.guilds.cache.first();
			await GamingLive(guild, options)
			await GamingNotLive(guild, options)
		} else {
			// Multi-Servers Config
			for (let key in options) {
				// check that guild is loaded			
				let guild = client.guilds.cache.get(key);
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


	function isPlaying(activity, localoptions) {
		if (debug) console.log(`Module: ${description.name} | isPlaying start`)
		// TODO flip logic with loop if lax mode is enabled
		// TODO add case scenario.
		if (localoptions.exactmatch === true) {
			if (localoptions.casesensitive === true) {
				return localoptions.games.includes(activity.name) || localoptions.games.includes(activity.state)
			} else {
				let match
				if (typeof activity.name === "string") match = localoptions.games.includes(activity.name.toLowerCase())
				if (typeof activity.state === "string") match = (localoptions.games.includes(activity.state.toLowerCase()) || match)
				return match
			}
		} else {
			// loop for not exact match

			// Turn haystack toLowerCase
			if (!localoptions.casesensitive) {
				if (typeof activity.name === "string") activity.name = activity.name.toLowerCase()
				if (typeof activity.state === "string") activity.state = activity.state.toLowerCase()
			}

			// Search needle in the haystack
			for (let [key] in localoptions.games) {
				/*
				console.log("2222", 
				{	"key" : key,
					"activity.name" : activity.name,
					"activity.state" : activity.state,
					"localoptions.games[key]" : localoptions.games[key],

				})*/
				if (typeof activity.name === "string")
					if (activity.name.includes(localoptions.games[key])) return true
				if (typeof activity.state === "string")
					if (activity.state.includes(localoptions.games[key])) return true
			}


		}
	}


	function gotRequiredRole(member, requiredRole) {
		if (debug) console.log(`Module: ${description.name} | gotRequiredRole Start`)
		let returnValue = false
		try {
			if (typeof requiredRole !== "undefined" && member && member.roles && member.roles.cache) {
				returnValue = (typeof (member.roles.cache.find(val => val.name === requiredRole || val.id === requiredRole)) !== "undefined")
			} else {
				returnValue = true
			}
		} catch (e) {
			console.error(`${description.name} -> GamingLive - Bot failed the gotRequiredRole function for ${member} of guild ${member.guild} / ${member.guild.id} )`);
			console.error(e)
		}
		return returnValue
	}


	async function addRole(member, role) {
		if (debug) console.log(`Module: ${description.name} | addRole Start`)
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
			console.error(e)
		}
		return actionTaken
	}


	async function removeRole(member, role) {
		if (debug) console.log(`Module: ${description.name} | removeRole Start`)
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
			console.error(e)
		}
		return actionTaken
	}


	async function GamingLive(guild, options) {
		if (debug) console.log(`Module: ${description.name} | GamingLive Start, version ${DiscordJSversion}`)
		// Check if the bot can manage Roles for this guild
		if (guild.me.permissions.has("MANAGE_ROLES")) {
			if (debug) console.log(`Module: ${description.name} | GamingLive | VersionCheck and Role OK`)
			// Loop trough presence to find streamers (type 1)
			let presences = guild.presences;
			let actionAlreadyTaken = false
			if (presences) {
				if (debug) console.log(`Module: ${description.name} | GamingLive | Presence Loaded`)
				// presences.cache.forEach(async function (element, key) {	
				for (let [key, element] of presences.cache) {
					if (!actionAlreadyTaken) { // This check will skip the elements if an action was already taken, it's to prevent API spam when too many status need to be updated
						// Loop trought presence within the cache
						if (typeof element.activities !== undefined) { // element.activities will be set only if there is 1 or more activities active
							// The activities list is an array, needing to parse trought it
							for (let activityKey in element.activities) {
								let activity = element.activities[activityKey]
								if (activity && (activity.type === "PLAYING" || activity.type === "CUSTOM_STATUS")) {
									let member = element.guild.members.cache.get(key)
									if (gotRequiredRole(member, options.required)) {
										if (isPlaying(activity, options)) {
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
		if (debug) console.log(`Module: ${description.name} | GamingNotLive Start`)
		// Check if the bot can manage Roles for this guild
		if (guild.me.permissions.has("MANAGE_ROLES")) {
			// Loop trough presence to find streamers (type 1)
			let gamingMembers = guild.roles.cache.find(val => val.name === options.live).members
			let actionAlreadyTaken = false // This check will skip the elements if an action was already taken, it's to prevent API spam when too many status need to be updated
			for (let [memberid, member] of gamingMembers) {
				if (!actionAlreadyTaken) {
					let isPlayingGame = false
					if (member.presence && typeof member.presence.activities !== undefined && Object.keys(member.presence.activities).length > 0) {
						// Need to iterate activities
						for (let activityKey in member.presence.activities) {
							let activity = member.presence.activities[activityKey]
							if (activity && (activity.type === "PLAYING" || activity.type === "CUSTOM_STATUS")) {
								if (isPlaying(activity, options)) {
									isPlayingGame = true
								}
							}
						}
					} else {
						// No activity, the member isn't playing anymore

					}
					if (!isPlayingGame) actionAlreadyTaken = await removeRole(member, options.live)

				}

			}
		} else {
			console.error(`${description.name} -> GamingLive - Bot doesn't have "MANAGE_ROLES" permission on Guild "${guild.name}" (${guild.id})`);
		}
	}
}