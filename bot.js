require("dotenv").config();

const { Client, Intents } = require("discord.js");
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
    ],
});

const { Player } = require("discord-music-player");
const player = new Player(client, {
    leaveOnEmpty: false,
});
client.player = player;
client.channel = null;
player.on("songFirst", (queue, newSong) => {
    if (client.channel) {
        client.channel.send("Now playing: " + newSong.name);
    }
});
player.on("songChanged", (queue, newSong, oldSong) => {
    if (client.channel) {
        client.channel.send("Now playing: " + newSong.name);
    }
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    // if (interaction.commandName === 'ping') {
    const channel = interaction.member.voice.channel;
    client.channel = interaction.channel;
    if (!channel) {
        await interaction.reply("Join a voice channel before playing!");
    } else {
        let guildQueue = client.player.getQueue(interaction.guildId);
        const cmd = interaction.commandName;
        if (cmd == "p") {
            song = interaction.options.getString("song");
            console.log(song);
            if (song) {
                interaction.reply("Queued: " + song);
                if (!guildQueue)
                    guildQueue = client.player.createQueue(interaction.guildId);
                await guildQueue.join(channel);
                guildQueue.play(song).catch((e) => {
                    client.channel.send("Error Occurred: " + e);
                    guildQueue.stop();
                });
            } else if (guildQueue && guildQueue.paused) {
                interaction.reply("Playback resumed!");
                guildQueue.setPaused(false);
            } else {
                interaction.reply("Specify song to play!");
            }
        } else if (cmd == "s") {
            if (guildQueue) {
                guildQueue.stop();
                interaction.reply("Music stopped!");
            } else {
                interaction.reply("No music playing!");
            }
        } else if (cmd == "pp") {
            if (guildQueue && guildQueue.isPlaying) {
                guildQueue.setPaused(true);
                interaction.reply("Music paused!");
            } else {
                interaction.reply("Music is not playing!");
            }
        } else if (cmd == "v") {
            if (!guildQueue) {
                interaction.reply("No songs in queue!");
            } else {
                console.log(guildQueue);
                var songs = "";
                var i = 1;
                for (s of guildQueue.songs) {
                    if (s == guildQueue.currentlyPlaying) {
                        songs += "** -> " + i + ". " + s.name + "**\n";
                    } else songs += i + ". " + s.name + "\n";
                    i++;
                }
                interaction.reply(songs);
            }
        } else if (cmd == "n") {
            if (guildQueue && guildQueue.isPlaying) {
                var s = guildQueue.skip();
                interaction.reply("Skipped: " + s.name);
            } else {
                interaction.reply("No music is playing!");
            }
        }
    }
    // }
});

client.login(process.env.TOKEN);
