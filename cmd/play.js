module.exports = {
    command: "p",
    description: "Plays a song",
    commandModifier: addSongOption,
    handler: executePlay,
    requiresOnChannel: true,
};

function addSongOption(slashCommand) {
    return slashCommand.addStringOption((opt) => {
        return opt
            .setName("song")
            .setDescription("Song to play")
            .setRequired(false);
    });
}

var songCache = {};
const CACHE_EXPIRE_MILLS = 1000 * 60 * 60 * 24 * 7;

var CURRENTDATE = new Date();

function updateDate() {
    CURRENTDATE = new Date();
}
// update current date every one hour (good enough for now)
setInterval(updateDate, 1000 * 60 * 60);

async function executePlay(
    interaction,
    player,
    guildQueue,
    infoChannel,
    logger
) {
    var song = interaction.options.getString("song");
    const guildId = interaction.guildId;
    logger.info("[Queued]: " + song);
    if (song) {
        if (!guildQueue) {
            guildQueue = player.createQueue(guildId);
            if (!infoChannel) {
                interaction.channel.send(
                    "Create a text channel with name " +
                        REPLY_CHANNEL +
                        " to interact with the bot."
                );
            }
        }
        const voiceChannel = interaction.member.voice.channel;
        await guildQueue.join(voiceChannel);
        if (song.includes("playlist") || song.includes("album")) {
            interaction.reply("Queued: **" + song + "**");
            guildQueue.playlist(song).catch((e) => {
                infoChannel.send(logger.niceError(e));
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
                    infoChannel.send(logger.niceError(e));
                });
        }
    } else if (guildQueue && guildQueue.paused) {
        interaction.reply("Playback resumed!");
        guildQueue.setPaused(false);
    } else {
        interaction.reply("Specify song to play!");
    }
}
