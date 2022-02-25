module.exports = {
    command: "q",
    description: "Shows the current queue",
    commandModifier: null,
    handler: executeQueue,
    requiresOnChannel: true,
};

const { RepeatMode } = require("discord-music-player");

async function executeQueue(
    interaction,
    player,
    guildQueue,
    infoChannel,
    logger
) {
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
            if (guildQueue.nowPlaying && s.url === guildQueue.nowPlaying.url) {
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
}
