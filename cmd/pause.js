module.exports = {
    command: "pp",
    description: "Pauses currently playing song",
    commandModifier: null,
    handler: executePause,
    requiresOnChannel: true,
};

async function executePause(
    interaction,
    player,
    guildQueue,
    infoChannel,
    logger
) {
    if (guildQueue) {
        guildQueue.setPaused(true);
        interaction.reply("Music paused!");
    } else {
        interaction.reply("No music playing!");
    }
}
