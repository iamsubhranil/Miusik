const { exec } = require("child_process");

function checkForUpdates(channel = null) {
    if (channel) {
        channel.send("Checking for updates..");
    }
    console.log("Checking for updates..");

    exec("git log --pretty=format:'%H' -n 1", (err, stdout, stderr) => {
        if (err) {
            if (channel)
                channel.send(
                    "Check for updates failed: Could not check current version!"
                );
            console.log(
                "Error checking current version: ",
                err,
                "\n",
                stderr,
                "\n",
                stdout
            );
            return;
        }
        console.log("Latest local commit: " + stdout);
        const local = stdout;
        exec("git ls-remote origin HEAD", (err, stdout, stderr) => {
            if (err) {
                if (channel)
                    channel.send(
                        "Check for updates failed: Could not check remote version!"
                    );
                console.log(
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
            console.log("Latest remote commit: " + remote);

            if (local === remote) {
                console.log("Already up to date!");

                if (channel) {
                    channel.send("Miusik is already up to date!");
                }
                return;
            }
            if (channel) {
                channel.send("New update found, updating now..");
            }
            console.log("New update found!");
            console.log("Updating from remote..");

            exec("git pull", (err, stdout, stderr) => {
                if (err) {
                    if (channel) {
                        channel.send("Update failed!");
                    }
                    console.log(
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
                    channel.send("Update fetch complete!");
                }
                console.log("git pull successful:\n" + stdout);
                exec("npm install", (err, stdout, stderr) => {
                    if (err) {
                        if (channel) {
                            channel.send("Update install failed!");
                            channel.send("Reverting back to the old version..");
                        }
                        console.log(
                            "npm install failed: ",
                            err,
                            "\n",
                            stderr,
                            "\n",
                            stdout
                        );
                        exec(
                            "git reset --hard " + local,
                            (err, stdout, stderr) => {
                                if (err) {
                                    if (channel) {
                                        channel.send("Reverting failed!");
                                        channel.send(
                                            "The bot is now in an inconsistent state!"
                                        );
                                        channel.send(
                                            "Please inform the owner to manually fix this!"
                                        );
                                    }
                                    console.log(
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
                                    channel.send("Update rollback complete!");
                                    channel.send("Miusik is now restarting..");
                                }
                                console.log("git reset successful:\n" + stdout);
                                console.log("Restarting..");
                                process.exit(0);
                            }
                        );
                        return;
                    }
                    if (channel) {
                        channel.send("Update install complete!");
                    }
                    console.log("npm install successful:\n" + stdout);
                    exec(
                        "git shortlog " +
                            local +
                            ".." +
                            remote +
                            " --oneline --no-color",
                        (err, stdout, stderr) => {
                            if (err) {
                                console.log(
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
                                channel.send(
                                    "Changelog:\n```" + stdout + "```"
                                );
                            }
                            console.log("Changelog:\n" + stdout);
                        }
                    );
                });
                if (channel) {
                    channel.send("Miusik is now restarting..");
                }
                console.log("Restarting..");
                // here we assume we are running on top of a daemon
                // which will take care of restarting us
                process.exit(0);
            });
        });
    });
}

module.exports = { checkForUpdates };