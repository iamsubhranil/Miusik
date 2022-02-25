module.exports = {
    command: "h",
    description: "Shows the command help",
    commandModifier: null,
    handler: executeHelp,
    requiresOnChannel: false,
};

const { COMMANDS } = require("../deploy_commands.js");

async function executeHelp(
    interaction,
    player,
    guildQueue,
    infoChannel,
    logger
) {
    var usage =
        "Use / to bring up the command menu, then choose one of the following:\n";
    for (var c of COMMANDS) {
        usage += c[0] + ": " + c[1].description + "\n";
    }
    interaction.reply(usage);
}
