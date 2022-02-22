require("dotenv").config();

const { COMMANDS } = require("./deploy_commands.js");

const {
    Client,
    Intents,
    MessageEmbed,
    EmbedAuthorData,
} = require("discord.js");
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
    ],
});

function nowPlayingMessage(song) {
    var m = new MessageEmbed()
        .setColor("#0099ff")
        .setTitle("Now playing")
        .setURL(song.url)
        .setImage(song.thumbnail)
        .setDescription(song.name)
        .addField("Duration", song.duration, true);
    if (song.data) {
        m.addField("Requested by", song.data, true);
    }
    if (song.queue.songs.length > 1) {
        m.setFooter({
            text: "Up next: " + song.queue.songs[1].name,
            iconURL: song.queue.songs[1].thumbnail,
        });
    }
    return {
        embeds: [m],
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
            var song = interaction.options.getString("song");
            console.log("[Queued]: " + song);
            if (song) {
                interaction.reply("Queued: **" + song + "**");
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
                    });
                } else {
                    var user = interaction.member.user.username;
                    guildQueue
                        .play(song)
                        .then((s) => {
                            s.data = user;
                        })
                        .catch((e) => {
                            client.channel.send(errorMessage(e));
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
                interaction.reply("No music playing!");
            }
        } else if (cmd == "q") {
            if (!guildQueue) {
                interaction.reply("No songs in queue!");
            } else {
                var songs = "Current queue:\n";
                var i = 1;
                for (s of guildQueue.songs) {
                    if (
                        guildQueue.nowPlaying &&
                        s.url === guildQueue.nowPlaying.url
                    ) {
                        songs += "**" + i + ". " + s.name + "**\n";
                    } else songs += i + ". " + s.name + "\n";
                    i++;
                }
                if (i == 1) {
                    songs = "No songs in queue!";
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
        } else if (cmd == "f") {
            if (!guildQueue || !guildQueue.nowPlaying) {
                interaction.reply("No music is playing!");
            } else {
                var amount = interaction.options.getInteger("seconds");
                if (!amount) {
                    amount = 10;
                }
                guildQueue.seek(guildQueue.nowPlaying.seekTime + amount);
                interaction.reply("Seeked by " + amount + " seconds!");
            }
        } else if (cmd == "h") {
            var usage =
                "Use / to bring up the command menu, then choose one of the following:\n";
            for (var c of COMMANDS) {
                usage += c[0] + ": " + c[1] + "\n";
            }
            interaction.reply(usage);
        }
    }
});

client.login(process.env.TOKEN);
