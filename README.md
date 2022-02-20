# Usage
Create a .env file in the parent folder with the following items:
```
TOKEN=<your bot token>
CLIENT_ID=<your application client id>
GUILD_ID=<id of the server you want to connect>
```

Install the dependencies:
```
$ npm install
```

First run the following to register commands to your server:
```
$ node deploy_commands.json
```

Then, run the bot. The bot needs to stay alive for any activity.
```
$ node bot.js
```
