module.exports = {
    command: "n",
    description: "Plays the next song in the queue",
    commandModifier: null,
    handler: executeNext,
    requiresOnChannel: true,
};

async function executeNext(
    interaction,
    player,
    guildQueue,
    infoChannel,
    logger
) {
    if (guildQueue && guildQueue.isPlaying) {
        var s = guildQueue.skip();
        interaction.reply("Skipped: " + s.name);
    } else {
        interaction.reply("No music is playing!");
    }
}
