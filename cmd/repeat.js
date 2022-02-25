const { RepeatMode } = require("discord-music-player");

module.exports = {
    command: "r",
    description: "Toggles 'repeat' for the current song",
    commandModifier: null,
    handler: executeRepeat,
    requiresOnChannel: true,
};

async function executeRepeat(
    interaction,
    player,
    guildQueue,
    infoChannel,
    logger
) {
    if (!guildQueue || !guildQueue.nowPlaying) {
        interaction.reply("No music is playing!");
    } else {
        if (guildQueue.repeatMode == RepeatMode.SONG) {
            guildQueue.setRepeatMode(RepeatMode.DISABLED);
            interaction.reply("Repeat mode disabled!");
        } else {
            guildQueue.setRepeatMode(RepeatMode.SONG);
            interaction.reply("Repeat mode set to current song!");
        }
    }
}
