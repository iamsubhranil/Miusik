module.exports = {
    command: "s",
    description: "Stops the current queue",
    commandModifier: null,
    handler: executeStop,
    requiresOnChannel: true,
};

async function executeStop(
    interaction,
    player,
    guildQueue,
    infoChannel,
    logger
) {
    if (guildQueue) {
        guildQueue.stop();
        interaction.reply("Music stopped!");
    } else {
        interaction.reply("No music playing!");
    }
}
