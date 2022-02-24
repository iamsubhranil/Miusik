const { exec } = require("child_process");

function checkForUpdates(channel = null) {
    if (channel) {
        channel.send("Checking for updates..");
    }
    console.log("Checking for updates..");

    exec("git log --pretty=format:'%H' -n 1", (err, stdout, stderr) => {
        if (err || stderr) {
            if (channel)
                channel.send(
                    "Check for updates failed: Could not check current version!"
                );
            console.log("Error checking current version: ", err || stderr);
            return;
        }
        console.log("Latest local commit: " + stdout);
        const local = stdout;
        exec("git ls-remote origin HEAD", (err, stdout, stderr) => {
            if (err || stderr) {
                if (channel)
                    channel.send(
                        "Check for updates failed: Could not check remote version!"
                    );
                console.log("Error checking for updates: ", err || stderr);
                return;
            }
            const remote = stdout.split("\t")[0];
            console.log("Latest remote commit: " + remote);

            if (local === remote) {
                console.log("Already up to date!");

                if (channel) {
                    channel.send("Miusik is already up to date!");
                }
            } else {
                if (channel) {
                    channel.send("New update found, updating now..");
                }
                console.log("New update found!");
                console.log("Updating from remote..");

                exec("git pull", (err, stdout, stderr) => {
                    if (err || stderr) {
                        if (channel) {
                            channel.send("Updating failed!");
                        }
                        console.log(
                            "Error updating to the remote: ",
                            err || stderr
                        );
                        return;
                    }
                    if (channel) {
                        channel.send("Update successful!");
                    }
                    console.log("Update complete!");
                    exec(
                        "git shortlog " +
                            local +
                            ".." +
                            remote +
                            " --oneline --no-color",
                        (err, stdout, stderr) => {
                            if (err || stderr) {
                                console.log(
                                    "Unable to show changelog: ",
                                    err || stderr
                                );
                            }
                            if (channel) {
                                channel.send(
                                    "Changelog:\n```" + stdout + "```"
                                );
                            }
                            console.log("Changelog:\n" + stdout);
                        }
                    );
                    if (channel) {
                        channel.send("Miusik is now restarting..");
                    }
                    console.log("Restarting..");
                    // here we assume we are running on top of a daemon
                    // which will take care of restarting us
                    process.exit(0);
                });
            }
        });
    });
}

module.exports = { checkForUpdates };
