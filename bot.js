require("dotenv").config();

// bind to a port if we're running on heroku, otherwise we're gonna
// get killed
if (process.env.HEROKU) {
    const http = require("http");

    const requestListener = function (req, res) {
        res.writeHead(200);
        res.end(
            "Hi there! Glad you visited the website, but unfortunately it does not have a frontend right now!"
        );
    };

    const server = http.createServer(requestListener);
    server.listen(process.env.PORT);
}

const { COMMANDS } = require("./deploy_commands.js");

const { Client, Intents, MessageEmbed } = require("discord.js");
const { Logger } = require("./logger.js");
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
    ],
});

function nowPlayingMessage(song) {
    var m = new MessageEmbed()
        .setColor("#0099ff")
        .setTitle("Now playing")
        .setURL(song.url)
        .setImage(song.thumbnail)
        .setDescription(song.name)
        .addField("Duration", song.duration, true);
    if (song.data) {
        m.addField("Requested by", song.data, true);
    }
    if (song.queue.songs.length > 1) {
        m.setFooter({
            text: "Up next: " + song.queue.songs[1].name,
            iconURL: song.queue.songs[1].thumbnail,
        });
    }
    return {
        embeds: [m],
    };
}

const { Player } = require("discord-music-player");
const player = new Player(client, {
    leaveOnEmpty: false,
});
client.player = player;
client.infoChannel = {};
client.logger = new Logger();

player.on("songFirst", (queue, newSong) => {
    const guildId = newSong.queue.guild.id;
    if (client.infoChannel[guildId]) {
        client.infoChannel[guildId].send(nowPlayingMessage(newSong));
    }
});
player.on("songChanged", (queue, newSong, oldSong) => {
    const guildId = newSong.queue.guild.id;
    if (client.infoChannel[guildId]) {
        client.infoChannel[guildId].send(nowPlayingMessage(newSong));
    }
});

client.on("ready", () => {
    client.logger.info(`Logged in as ${client.user.tag}!`);
    client.guilds.cache.forEach((guild) => {
        const ch = guild.channels.cache.find((c) => c.name == REPLY_CHANNEL);
        if (ch) {
            client.infoChannel[guild.id] = ch;
            ch.send("Miusik is now online!");
        }
    });
});

const REPLY_CHANNEL = "miusikchannel";

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = COMMANDS.get(interaction.commandName);
    if (!command) {
        interaction.reply("Command not found!");
        command = COMMANDS.get("h");
    }

    const channel = interaction.member.voice.channel;
    if (command.requiresOnChannel && !channel) {
        interaction.reply("Join a channel before using this command!");
        return;
    }

    let guildQueue = client.player.getQueue(interaction.guildId);
    let player = client.player;
    let infoChannel = client.infoChannel[interaction.guildId];
    if (!infoChannel) {
        infoChannel = client.infoChannel[interaction.guilId] =
            interaction.guild.channels.cache.find(
                (c) => c.name == REPLY_CHANNEL
            );
    }
    let logger = client.logger;

    try {
        await command.handler(
            interaction,
            player,
            guildQueue,
            infoChannel,
            logger
        );
    } catch (e) {
        client.logger.error(e);
        interaction.reply("There was an error while executing this command!");
    }
});

client.login(process.env.TOKEN);
