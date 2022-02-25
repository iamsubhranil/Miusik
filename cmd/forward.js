module.exports = {
    command: "f",
    description:
        "Forwards the current song by a certain amount of seconds (default: 10)",
    commandModifier: addSecondsOption,
    handler: executeForward,
    requiresOnChannel: true,
};

function addSecondsOption(slashCommand) {
    return slashCommand.addIntegerOption((opt) => {
        return opt
            .setName("seconds")
            .setDescription("Amount of seconds to skip forward")
            .setRequired(false);
    });
}

async function executeForward(
    interaction,
    player,
    guildQueue,
    infoChannel,
    logger
) {
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
}
