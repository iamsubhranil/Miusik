require("dotenv").config();

const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const commands = [
    ["p", "Play a song", "song", "Song to play", false],
    ["pp", "Pauses currently playing song"],
    ["n", "Plays the next song in the playlist"],
    ["s", "Stops the current playlist"],
    ["v", "Shows the current playlist"],
];

var slashCommands = [];

for (var c of commands) {
    if (c.length == 5) {
        var cmd = new SlashCommandBuilder()
            .setName(c[0])
            .setDescription(c[1])
            .addStringOption((opt) =>
                opt.setName(c[2]).setDescription(c[3]).setRequired(c[4])
            );
        console.log(cmd);
        slashCommands.push(cmd);
    } else if (c.length == 2) {
        slashCommands.push(
            new SlashCommandBuilder().setName(c[0]).setDescription(c[1])
        );
    }
}

console.log(slashCommands);

slashCommands.map((command) => command.toJSON());

console.log(slashCommands);

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
