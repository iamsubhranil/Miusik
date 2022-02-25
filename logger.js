const { MessageEmbed } = require("discord.js");

class Logger {
    constructor() {
        this.logs = [];
    }

    getDate() {
        return new Date().toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
            hour12: false,
        });
    }

    log(...message) {
        console.log("[", this.getDate(), "]", ...message);
    }

    error(...message) {
        this.log("[Error]", ...message);
    }

    info(...message) {
        this.log("[Info]", ...message);
    }

    warn(...message) {
        this.log("[Warn]", ...message);
    }

    niceError(...message) {
        this.error(...message);
        return {
            embeds: [
                new MessageEmbed()
                    .setColor("#ff0000")
                    .setTitle("Error")
                    .setDescription(msg),
            ],
        };
    }

    getLog() {
        return this.logs;
    }
}

module.exports = { Logger };
