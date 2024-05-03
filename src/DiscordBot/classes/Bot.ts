import * as Discord from "discord.js" ;
//import * as fs from "node:fs"; fs historically gets used in this framework but it didn't today.
//@ts-ignore
import { botconfig } from "../../../storage/config.json";
import { DatabaseManager } from "../../Shared/Database";
import { Command } from "./Command";
import { loadCommands } from "../commands/commandLoader";
import { loadEvents } from "../events/eventLoader";
import { RESTAPIPartialCurrentUserGuild } from "discord.js";
import { Logger } from "../../Shared/Logger";


export class Bot extends Discord.Client {
    public database: DatabaseManager;
    public commands: Discord.Collection<string, Command> = new Discord.Collection();
    public logger: Logger = new Logger();

    constructor(database: DatabaseManager, options: Discord.ClientOptions) {
        super(options);
        this.database = database;
        loadCommands(this);
        loadEvents(this);
        this.pushCommands();
        this.commandListener();
    }

    public async pushCommands() {
        let rest = new Discord.REST({ version: `10` }).setToken(botconfig.auth.token);
        let guilds: RESTAPIPartialCurrentUserGuild[] = await rest.get(Discord.Routes.userGuilds()) as RESTAPIPartialCurrentUserGuild[];
        let existingGlobalCommands: Discord.RESTGetAPIApplicationCommandResult[] = await rest.get(Discord.Routes.applicationCommands(botconfig.auth.clientId)) as Discord.RESTGetAPIApplicationCommandResult[]; // trust me bro

        type CollectionOfCommandData = Array<Discord.RESTPostAPIChatInputApplicationCommandsJSONBody | Discord.RESTPostAPIContextMenuApplicationCommandsJSONBody>;

        let newServerCommands: Discord.Collection<string, CollectionOfCommandData> = new Discord.Collection<string, CollectionOfCommandData>();
        let newGlobalCommands: CollectionOfCommandData = [];

        guilds.forEach(guild => {
            newServerCommands.set(guild.id, []); //initialize newServerCommands
        });

        // Load commands into their arrays, tell existing global commands to update themselves.
        this.commands.forEach(command => {
            if (command.guilds.length != 0) {
                command.guilds.forEach(gid => {
                    try {
                        newServerCommands.get(gid).push(command.data.toJSON());
                    } catch (error) {
                        this.logger.error(error, `pushServerCommands`);
                    }
                });
            } else {
                let existingCommand = existingGlobalCommands.find((value) => value.name == command.data.name);
                if (existingCommand) {
                    command.id = existingCommand.id;
                    command.updateCommand(this, existingCommand);
                    return;
                }
                newGlobalCommands.push(command.data.toJSON());
            }
        });

        // check this.commands to see if any global commands returned from the api arent in the this.commands array. if there are any, delete them.
        existingGlobalCommands.forEach((value) => {
            if (!this.commands.find((command) => command.data.name == value.name && (command.guilds == null || command.guilds.length == 0))) {
                rest.delete(Discord.Routes.applicationCommand(botconfig.auth.clientId, value.id))
                    .then(() => this.logger.log(`Deleted command ${value.name}`, `Luma.pushCommands()`))
                    .catch(error => this.logger.error(error, `Luma.pushCommands()`));
            }
        });

        // for any new global command (anyone that didn't get caught by the Command.updateCommand() call earlier), push it to Discord.
        newGlobalCommands.forEach((value) => {
            rest.post(Discord.Routes.applicationCommands(botconfig.auth.clientId), { body: value })
                .then((response) => {
                    let response2: Discord.RESTGetAPIApplicationCommandResult = response as Discord.RESTGetAPIApplicationCommandResult;

                    this.commands.find((value) => value.data.name == response2.name).id = response2.id;
                    this.logger.log(`Global command ${value.name} pushed.`, `Luma.pushCommands()`);
                })
                .catch(error => {
                    this.logger.error(error, `Luma.pushCommands()`);
                }
                ); // i dont like this form the linter but i dont know how to fix it.
        });

        // does 2 tasks
        newServerCommands.forEach(async (value, key) => {
            let existingServerCommands: Discord.RESTGetAPIApplicationCommandResult[] = await rest.get(Discord.Routes.applicationGuildCommands(botconfig.auth.clientId, key)) as Discord.RESTGetAPIApplicationCommandResult[];

            //for each guild, check and see if the command in this.commands is present and scoped to the current guild. if no, delete it.
            existingServerCommands.forEach((value) => {
                if (!this.commands.find((command) => command.data.name == value.name && command.guilds?.find((id) => id == key))) {
                    rest.delete(Discord.Routes.applicationGuildCommand(botconfig.auth.clientId, key, value.id))
                        .then(() => this.logger.log(`Deleted command ${value.name} for ${key}`, `Luma.pushCommands()`))
                        .catch(error => this.logger.error(error, `Luma.pushCommands()`));
                }
            });

            // for each command scoped to the current guild, check and see if it already exists. if it does, remove it from the newServerCommands array for the current server and call Command.updateCommand();
            value.forEach(command => {
                let existingCommand = existingServerCommands.find((value) => value.name == command.name);
                if (existingCommand) {
                    value.splice(value.indexOf(command), 1);
                    let commandObj = this.commands.find((value) => value.data.name == command.name);
                    (commandObj.id as Discord.Collection<string, string>).set(key, existingCommand.id);
                    commandObj.updateCommand(this, existingCommand);
                }
            });

            // loop through the array again and push any commands not caught from the loop above as a server command.
            value.forEach(command => {
                rest.post(Discord.Routes.applicationGuildCommands(botconfig.auth.clientId, key), { body: command })
                    .then(() => this.logger.log(`Pushed command ${command.name} for ${key}`, `Luma.pushCommands()`))
                    .catch(error => {
                        this.logger.error(error, `Luma.pushCommands()`);
                    }
                    );
            });
        });

    }

    private async commandListener() {
        this.on(`interactionCreate`, async (interaction) => {
            if (interaction.isChatInputCommand()) {
                const command = this.commands.get(interaction.commandName);
                if (!command) return;
                await command.runCommand(this, interaction);
            } else if (interaction.isAutocomplete()) {
                const command = this.commands.get(interaction.commandName);
                if (!command) return;
                try {
                    command.autocomplete(this, interaction);
                } catch (error) {
                    // do nothing. its not worth it.
                }
            } /*else if (interaction.isContextMenuCommand()) {
                const command = this.contextMenus.get(interaction.commandName);
                if (!command) return;
                await command.runCommand(luma, interaction);
            } */
        });
    }
}

export interface CustomIDTypes {
    type: string;
    value?: string;
    inputName?: string;
}