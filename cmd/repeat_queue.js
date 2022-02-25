const { RepeatMode } = require("discord-music-player");

module.exports = {
    command: "rq",
    description: "Toggles 'repeat' for the current queue",
    commandModifier: null,
    handler: executeRepeatQueue,
    requiresOnChannel: true,
};

async function executeRepeatQueue(
    interaction,
    player,
    guildQueue,
    infoChannel,
    logger
) {
    if (!guildQueue || !guildQueue.nowPlaying) {
        interaction.reply("No music is playing!");
    } else {
        if (guildQueue.repeatMode == RepeatMode.QUEUE) {
            guildQueue.setRepeatMode(RepeatMode.DISABLED);
            interaction.reply("Repeat mode disabled!");
        } else {
            guildQueue.setRepeatMode(RepeatMode.QUEUE);
            interaction.reply("Repeat mode set to current queue!");
        }
    }
}
