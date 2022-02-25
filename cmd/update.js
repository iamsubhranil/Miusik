module.exports = {
    command: "update",
    description: "Updates the bot",
    commandModifier: null,
    handler: executeUpdate,
    requiresOnChannel: false,
};
const { exec } = require("child_process");

async function executeUpdate(
    interaction,
    player,
    guildQueue,
    infoChannel,
    logger
) {
    if (channel) {
        await channel.send("Checking for updates..");
    }
    logger.log("Checking for updates..");

    exec("git log --pretty=format:'%H' -n 1", async (err, stdout, stderr) => {
        if (err) {
            if (channel)
                channel.send(
                    "Check for updates failed: Could not check current version!"
                );
            logger.log(
                "Error checking current version: ",
                err,
                "\n",
                stderr,
                "\n",
                stdout
            );
            return;
        }
        logger.log("Latest local commit: " + stdout);
        const local = stdout;
        exec("git ls-remote origin HEAD", async (err, stdout, stderr) => {
            if (err) {
                if (channel)
                    await channel.send(
                        "Check for updates failed: Could not check remote version!"
                    );
                logger.log(
                    "Error checking for updates: ",
                    err,
                    "\n",
                    stderr,
                    "\n",
                    stdout
                );
                return;
            }
            const remote = stdout.split("\t")[0];
            logger.log("Latest remote commit: " + remote);

            if (local === remote) {
                logger.log("Already up to date!");

                if (channel) {
                    await channel.send("Miusik is already up to date!");
                }
                return;
            }
            if (channel) {
                await channel.send("New update found, updating now..");
            }
            logger.log("New update found!");
            logger.log("Updating from remote..");

            exec("git pull", async (err, stdout, stderr) => {
                if (err) {
                    if (channel) {
                        channel.send("Update failed!");
                    }
                    logger.log(
                        "Error updating to the remote: ",
                        err,
                        "\n",
                        stderr,
                        "\n",
                        stdout
                    );
                    return;
                }
                if (channel) {
                    await channel.send("Update fetch successful!");
                }
                logger.log("git pull successful:\n" + stdout);
                exec("npm install", async (err, stdout, stderr) => {
                    if (err) {
                        if (channel) {
                            await channel.send("Update install failed!");
                            await channel.send(
                                "Reverting back to the old version.."
                            );
                        }
                        logger.log(
                            "npm install failed: ",
                            err,
                            "\n",
                            stderr,
                            "\n",
                            stdout
                        );
                        exec(
                            "git reset --hard " + local,
                            async (err, stdout, stderr) => {
                                if (err) {
                                    if (channel) {
                                        await channel.send("Reverting failed!");
                                        await channel.send(
                                            "The bot is now in an inconsistent state!"
                                        );
                                        await channel.send(
                                            "Please inform the owner to manually fix this!"
                                        );
                                    }
                                    logger.log(
                                        "Git reset failed: ",
                                        err,
                                        "\n",
                                        stderr,
                                        "\n",
                                        stdout
                                    );
                                    return;
                                }
                                if (channel) {
                                    await channel.send(
                                        "Update rollback complete!"
                                    );
                                    await channel.send(
                                        "Miusik is now restarting.."
                                    );
                                }
                                logger.log("git reset successful:\n" + stdout);
                                logger.log("Restarting..");
                                process.exit(0);
                            }
                        );
                        return;
                    }
                    if (channel) {
                        await channel.send("Update install complete!");
                    }
                    logger.log("npm install successful:\n" + stdout);
                    exec(
                        "git shortlog " +
                            local +
                            ".." +
                            remote +
                            " --oneline --no-color",
                        async (err, stdout, stderr) => {
                            if (err) {
                                logger.log(
                                    "Unable to show changelog: ",
                                    err,
                                    "\n",
                                    stderr,
                                    "\n",
                                    stdout
                                );
                                return;
                            }
                            if (channel) {
                                await channel.send(
                                    "Changelog:\n```" + stdout + "```"
                                );
                            }
                            logger.log("Changelog:\n" + stdout);

                            if (channel) {
                                await channel.send(
                                    "Miusik is now restarting.."
                                );
                            }
                            logger.log("Restarting..");
                            // here we assume we are running on top of a daemon
                            // which will take care of restarting us
                            process.exit(0);
                        }
                    );
                });
            });
        });
    });
}
