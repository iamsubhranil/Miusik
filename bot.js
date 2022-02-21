require("dotenv").config();

const { Client, Intents, MessageEmbed } = require("discord.js");
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
    ],
});

function nowPlayingMessage(song) {
    return {
        embeds: [
            new MessageEmbed()
                .setColor("#0099ff")
                .setTitle("Now playing")
                .setURL(song.url)
                .setImage(song.thumbnail)
                .setDescription(song.name),
        ],
    };
}

function errorMessage(msg) {
    return {
        embeds: [
            new MessageEmbed()
                .setColor("#ff0000")
                .setTitle("Error")
                .setDescription(msg),
        ],
    };
}

const { Player } = require("discord-music-player");
const player = new Player(client, {
    leaveOnEmpty: false,
});
client.player = player;
client.channel = null;
player.on("songFirst", (queue, newSong) => {
    if (client.channel) {
        client.channel.send(nowPlayingMessage(newSong));
    }
});
player.on("songChanged", (queue, newSong, oldSong) => {
    if (client.channel) {
        client.channel.send(nowPlayingMessage(newSong));
    }
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const REPLY_CHANNEL = "miusikchannel";

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const channel = interaction.member.voice.channel;
    if (!channel) {
        await interaction.reply("Join a voice channel before playing!");
    } else {
        let guildQueue = client.player.getQueue(interaction.guildId);
        const cmd = interaction.commandName;
        if (cmd == "p") {
            song = interaction.options.getString("song");
            console.log("[Queued]: " + song);
            if (song) {
                interaction.reply("Queued: " + song);
                if (!guildQueue) {
                    guildQueue = client.player.createQueue(interaction.guildId);
                    if (!client.channel) {
                        client.channel = interaction.guild.channels.cache.find(
                            (c) => c.name == REPLY_CHANNEL
                        );
                    }
                    if (!client.channel) {
                        try {
                            client.channel =
                                await interaction.guild.channels.create(
                                    REPLY_CHANNEL,
                                    {
                                        type: "GUILD_TEXT",
                                    }
                                );
                        } catch (e) {
                            interaction.channel.send(
                                "Create a text channel with name " +
                                    REPLY_CHANNEL +
                                    " to interact with the bot."
                            );
                        }
                    }
                }
                await guildQueue.join(channel);
                if (song.includes("playlist") || song.includes("album")) {
                    guildQueue.playlist(song).catch((e) => {
                        client.channel.send(errorMessage(e));
                        guildQueue.stop();
                    });
                } else {
                    guildQueue.play(song).catch((e) => {
                        client.channel.send(errorMessage(e));
                        guildQueue.stop();
                    });
                }
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
                var songs = "";
                var i = 1;
                for (s of guildQueue.songs) {
                    if (s.url === guildQueue.currentlyPlaying.url) {
                        songs += "*** -> " + i + ". " + s.name + "***\n";
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
});

client.login(process.env.TOKEN);
