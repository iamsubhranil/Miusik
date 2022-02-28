module.exports = {
    command: "update",
    description: "Updates the bot",
    commandModifier: null,
    handler: executeUpdate,
    requiresOninfoChannel: false,
};

const { execSync } = require("child_process");

class DefaultChannel {
    constructor() {}

    async send(...message) {}
}

class TaskManager {
    constructor() {
        this.tasks = {};
    }

    addTaskFromConfig(config) {
        var t = new Task(this);
        t.fromConfig(config);
        this.tasks[config.id] = t;
    }

    getTask(id) {
        if (!id) return null;
        return this.tasks[id];
    }
}

class Task {
    constructor(manager) {
        this.manager = manager;
        this.stepID = null;
        this.step = { prepare: null, exec: null, success: null, failure: null };
        this.texts = {
            condition: {
                start: null,
                failure: null,
                success: null,
            },
            step: {
                start: null,
                failure: null,
                success: null,
            },
        };
        this.condition = null;
        this.sendCommandOutput = false;

        this.channel = null;
        this.logger = null;
    }

    setSendCommandOutput(isTrue) {
        this.sendStepOutput = isTrue;
    }

    fromConfig(config) {
        this.stepID = config.id;
        if (config.step) Object.assign(this.step, config.step);
        if (config.text) Object.assign(this.texts, config.text);
        this.condition = config.condition;
        this.sendCommandOutput = config.sendCommandOutput;
    }

    // id, step, condition, step.prepare, step.success, step.failure,
    // text.condition.start, text.condition.failure, text.condition.success,
    // text.step.start, text.step.failure, text.step.success
    set(what, value) {
        if (what == "id") {
            this.stepID = value;
        } else if (what == "condition") {
            this.condition = value;
        } else if (what.startsWith("step.")) {
            this.step[what.substring(5)] = value;
        } else if (what.startsWith("text.")) {
            this.setText(what.substring(5), value);
        } else {
            console.log("Invalid set property: " + what);
        }
        return this;
    }

    setStepID(stepID) {
        this.stepID = stepID;
        return this;
    }

    // function (step, state) {}
    setPrepareStep(prepareStep) {
        this.step.prepare = prepareStep;
        return this;
    }

    // step can either be a string, or a callback of the
    // following signature:
    // function step(state) {}
    //
    // if there is a prepareStep, it will be executed before the command
    // as following
    // step = prepareStep(step, state)
    setStep(step) {
        this.step.exec = step;
        return this;
    }

    // condition.start
    // condition.success
    // condition.failure
    // step.start
    // step.success
    // step.failure
    setText(state, message) {
        if (state.startsWith("condition.")) {
            this.texts.condition[state.substring(10)] = message;
        } else if (state.startsWith("step.")) {
            this.texts.state[state.substring(5)] = message;
        }
        return this;
    }

    // function(state) {}
    setCondition(condition) {
        this.condition = condition;
        return this;
    }

    async displayIfExists(stage, result) {
        var message = this.texts[stage][result];
        if (message) {
            await this.channel.send(message);
            if (result == "failure") {
                this.logger.error(message);
            } else {
                this.logger.log(message);
            }
        }
    }

    async execute(state, logger, channel) {
        this.logger = logger;
        this.channel = channel;

        // contains the output and results of condition and step
        state[this.stepID] = { condition: true, step: true, error: null };

        await this.displayIfExists("condition", "start");

        if (this.condition && !this.condition(state)) {
            this.displayIfExists("condition", "failure");
            state[this.stepID].condition = false;
            return;
        }

        await this.displayIfExists("condition", "success");

        if (this.step.prepare) {
            this.step.exec = this.step.prepare(this.step.exec, state);
        }

        await this.displayIfExists("step", "start");

        try {
            if (typeof this.step.exec == "string") {
                logger.log("Executing '" + this.step.exec + "'..");
                state[this.stepID]["output"] = execSync(
                    this.step.exec
                ).toString();
            } else {
                state[this.stepID]["output"] = this.step.exec(state);
            }
            state[this.stepID].step = true;

            this.logger.log(state[this.stepID].output);

            if (this.sendStepOutput) {
                await channel.send(state[this.stepID].output);
            }

            await this.displayIfExists("step", "success");

            var t = this.manager.getTask(this.step.success);
            if (t) {
                await t.execute(state, logger, channel);
            }
        } catch (e) {
            state[this.stepID].step = false;
            state[this.stepID].error = e;
            await this.displayIfExists("step", "failure");
            logger.log(e);

            var t = this.manager.getTask(this.step.failure);
            if (t) {
                await t.execute(state, logger, channel);
            }
        }
    }
}

function constructUpdateSteps() {
    var manager = new TaskManager();

    manager.addTaskFromConfig({
        id: "checkLocal",
        step: {
            exec: "git log --pretty=format:'%H' -n 1",
            success: "checkRemote",
        },
        text: {
            step: {
                start: "Checking local version..",
                failure: "Unable to check local version!",
            },
        },
    });

    manager.addTaskFromConfig({
        id: "checkRemote",
        step: { exec: "git ls-remote origin HEAD", success: "pull" },
        text: {
            step: {
                start: "Checking remote version..",
                failure: "Unable to check remote version!",
            },
        },
    });

    manager.addTaskFromConfig({
        id: "pull",
        condition: function (state) {
            return (
                state.checkLocal.output.trim() !=
                state.checkRemote.output.split("\t")[0].trim()
            );
        },
        step: { exec: "git pull", success: "install" },

        text: {
            condition: {
                failure: "Local version is up to date!",
                success: "New version available!",
            },
            step: {
                start: "Downloading new updates..",
                failure: "Unable to download updates!",
            },
        },
    });

    manager.addTaskFromConfig({
        id: "install",
        step: { exec: "npm install", success: "showLog", failure: "revert" },
        text: {
            step: {
                start: "Installing new dependencies..",
                failure: "Unable to install new dependencies!",
            },
        },
    });

    manager.addTaskFromConfig({
        id: "showLog",
        step: {
            prepare: function (step, state) {
                const local = state.checkLocal.output.trim();
                const remote = state.checkRemote.output.split("\t")[0].trim();
                return (
                    "git shortlog " +
                    local +
                    ".." +
                    remote +
                    " --oneline --no-color"
                );
            },
            exec: "", // will be set in prepare
            success: "restart",
            failure: "restart",
        },
        text: {
            step: {
                start: "Changelog:",
                failure: "Unable to show changelog!",
            },
        },
        sendCommandOutput: true,
    });

    manager.addTaskFromConfig({
        id: "revert",
        step: {
            prepare: function (step, state) {
                const local = state.checkLocal.output.trim();
                return "git reset --hard " + local;
            },
            exec: "", // will be set in prepare
            success: "restart",
            failure: "restart",
        },
        text: {
            step: {
                start: "Reverting updates..",
                success: "Updates reverted successfully!",
                failure:
                    "Unable to revert updates! Please tell the maintainer to fix it manually!",
            },
        },
    });

    manager.addTaskFromConfig({
        id: "restart",
        step: {
            exec: function (state) {
                process.exit(0);
            },
        },
        text: {
            step: {
                start: "Miusik is restarting..",
            },
        },
    });

    return manager;
}

const MANAGER = constructUpdateSteps();

async function executeUpdate(
    interaction,
    player,
    guildQueue,
    infoChannel,
    logger
) {
    interaction.reply("Miusik will now check for updates..");
    if (infoChannel) {
        await infoChannel.send("Checking for updates..");
    } else {
        infoChannel = new DefaultChannel();
    }
    logger.log("Checking for updates..");

    var updater = MANAGER.getTask("checkLocal");
    updater.execute({}, logger, infoChannel);
}
