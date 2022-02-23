require("dotenv").config();

const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const COMMANDS = [
    ["p", "Plays a song", "song", "Song to play", false, "str"],
    ["pp", "Pauses currently playing song"],
    ["n", "Plays the next song in the queue"],
    ["s", "Stops the current queue"],
    ["q", "Shows the current queue"],
    [
        "f",
        "Forwards the current song by a certain amount of seconds (default: 10)",
        "seconds",
        "Amount of seconds to skip forward",
        false,
        "int",
    ],
    ["r", "Toggles 'repeat' for the current song"],
    ["rq", "Toggles 'repeat' for the current queue"],
    ["h", "Shows the command help"],
];

module.exports = {
    COMMANDS,
};

var slashCommands = [];

for (var c of COMMANDS) {
    if (c.length == 6) {
        if (c[5] == "str") {
            var cmd = new SlashCommandBuilder()
                .setName(c[0])
                .setDescription(c[1])
                .addStringOption((opt) =>
                    opt.setName(c[2]).setDescription(c[3]).setRequired(c[4])
                );
            slashCommands.push(cmd);
        } else if (c[5] == "int") {
            var cmd = new SlashCommandBuilder()
                .setName(c[0])
                .setDescription(c[1])
                .addIntegerOption((opt) =>
                    opt.setName(c[2]).setDescription(c[3]).setRequired(c[4])
                );
            slashCommands.push(cmd);
        }
    } else if (c.length == 2) {
        slashCommands.push(
            new SlashCommandBuilder().setName(c[0]).setDescription(c[1])
        );
    }
}

slashCommands.map((command) => command.toJSON());

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

rest.put(
    Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
    ),
    { body: slashCommands }
)
    .then(() => console.log("Successfully registered application commands."))
    .catch(console.error);
