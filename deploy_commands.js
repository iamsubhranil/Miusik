require("dotenv").config();

const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { Collection } = require("discord.js");
const { Logger } = require("./logger.js");
const fs = require("node:fs");

var COMMANDS = new Collection();
module.exports = {
    COMMANDS,
};

const commandFiles = fs
    .readdirSync("./cmd")
    .filter((file) => file.endsWith(".js"));

var commandJSON = [];
for (const file of commandFiles) {
    const commandModule = require(`./cmd/${file}`);
    if (commandModule.command) {
        var cmd = new SlashCommandBuilder()
            .setName(commandModule.command)
            .setDescription(commandModule.description);
        if (commandModule.commandModifier) {
            cmd = commandModule.commandModifier(cmd);
        }
        commandJSON.push(cmd.toJSON());
        COMMANDS.set(commandModule.command, commandModule);
    }
}

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

const guildIds = process.env.GUILD_IDS.split(",").map((id) => id.trim());

for (var id of guildIds) {
    rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, id), {
        body: commandJSON,
    })
        .then(() =>
            new Logger().info("Successfully registered application commands.")
        )
        .catch(console.error);
}
