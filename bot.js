require("dotenv").config();

// bind to a port if we're running on heroku, otherwise we're gonna
// get killed
if (process.env.HEROKU) {
    const http = require("http");

    const requestListener = function (req, res) {
        res.writeHead(200);
        res.end(
            "Hi there! Glad you visited the website, but unfortunately it does not have a frontend right now!"
        );
    };

    const server = http.createServer(requestListener);
    server.listen(process.env.PORT);
}

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

var CURRENTDATE = new Date();

function updateDate() {
    CURRENTDATE = new Date();
}
// update current date every one hour (good enough for now)
setInterval(updateDate, 1000 * 60 * 60);

const { Player, RepeatMode } = require("discord-music-player");
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
var songCache = {};
const CACHE_EXPIRE_MILLS = 1000 * 60 * 60 * 24 * 7;

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
                    interaction.reply("Queued: **" + song + "**");
                    guildQueue.playlist(song).catch((e) => {
                        client.channel.send(errorMessage(e));
                    });
                } else {
                    var user = interaction.member.user.username;
                    if (
                        song in songCache &&
                        CURRENTDATE - songCache[song].date < CACHE_EXPIRE_MILLS
                    ) {
                        song = songCache[song].cachedSong;
                        interaction.reply("Queued: **" + song.name + "**");
                    } else {
                        interaction.reply("Queued: **" + song + "**");
                    }
                    guildQueue
                        .play(song)
                        .then((s) => {
                            if (s != song) {
                                songCache[song] = {
                                    cachedSong: s,
                                    date: CURRENTDATE,
                                };
                            }
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
                var songs = "Current queue";
                if (guildQueue.repeatMode == RepeatMode.QUEUE) {
                    songs += " (on repeat)";
                }
                songs += ":\n";
                var i = 1;
                for (s of guildQueue.songs) {
                    if (
                        guildQueue.nowPlaying &&
                        s.url === guildQueue.nowPlaying.url
                    ) {
                        songs += "**" + i + ". " + s.name + "**";
                        if (guildQueue.repeatMode == RepeatMode.SONG) {
                            songs += " (on repeat)";
                        }
                        songs += "\n";
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
        } else if (cmd == "r" || cmd == "rq") {
            if (!guildQueue || !guildQueue.nowPlaying) {
                interaction.reply("No music is playing!");
            } else {
                var setTo = RepeatMode.SONG;
                var setToStr = "current song";
                if (cmd == "rq") {
                    setTo = RepeatMode.QUEUE;
                    setToStr = "current queue";
                }
                if (guildQueue.repeatMode != setTo) {
                    guildQueue.setRepeatMode(setTo);
                    interaction.reply("Repeat mode set to " + setToStr + "!");
                } else {
                    guildQueue.setRepeatMode(RepeatMode.DISABLED);
                    interaction.reply("Repeat mode disabled!");
                }
            }
        }
    }
});

client.login(process.env.TOKEN);
