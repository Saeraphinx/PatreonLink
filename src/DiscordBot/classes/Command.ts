/* eslint-disable @typescript-eslint/ban-types */ //ill fix eventually but it really doesn't matter if youre careful lmao
import { CommandInteraction, SlashCommandBuilder, Routes, REST, RESTGetAPIApplicationCommandResult, Collection } from "discord.js";
import { Bot } from "./Bot";
//@ts-ignore
import { botconfig } from "../../../storage/config.json";

export interface ICommand {
    data:SlashCommandBuilder;
    guilds?:string[];
    execute:Function;
    autocomplete?:Function;
    //userwl?:string[];
    //userbl?:string[];
    //guildwl?:string[];
    //guildbl?:string[];
    //devRolewl?:string[];
}

export class Command {
    public data: SlashCommandBuilder;
    public guilds: string[] = [];
    public execute: Function;
    public autocomplete?: Function;
    public id?: string|Collection<string, string>;

    //public userwl: string[] = [];
    //public userbl: string[] = [];
    //public guildwl: string[] = [];
    //public guildbl: string[] = [];
    //public devRolewl: string[] = [];

    constructor(command: ICommand) {
        this.data = command.data;
        this.execute = command.execute;
        if (command.guilds != undefined) {
            if (command.guilds.length != 0) {
                this.guilds = command.guilds;
                this.id = new Collection<string, string>();
            }
        }
        if (command.autocomplete) {
            this.autocomplete = command.autocomplete;
        }
        /*if (command.guildwl) {
            this.guildwl = command.guildwl;
        }
        if (command.guildbl) {
            this.guildbl = command.guildbl;
        }
        if (command.userwl) {
            this.userwl = command.userwl;
        }
        if (command.userbl) {
            this.userbl = command.userbl;
        }*/
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async updateCommand(bot: Bot, compareObject?: RESTGetAPIApplicationCommandResult) {
        let rest = new REST({ version: `10` }).setToken(botconfig.auth.token);

        /*if (compareObject) {
            if(compareObject.options === undefined) {
                compareObject.options = [];
            }
            if (JSON.stringify(compareObject.options) == JSON.stringify(this.data.toJSON().options as unknown as RESTGetAPIApplicationCommandResult) && compareObject.description == this.data.toJSON().description) {
                bot.logger.log(`Skipping PATCH for command ${this.data.name}.`, "Update Command");
                return;
            }
        }*/ // this was an attempt to prevent the bot from updating commands that don't need to be updated. i tried i promise
        if (!this.id) {
            bot.logger.error(`Command ID is not set. Cannot update command ${this.data.name}.`, `Update Command`);
            return;
        }
        if (this.guilds.length == 0) {
            rest.patch(Routes.applicationCommand(botconfig.auth.clientId, this.id as string), { body: this.data.toJSON() })
                .then((response) => {
                    let response2: RESTGetAPIApplicationCommandResult = response as RESTGetAPIApplicationCommandResult;
                    this.id = response2.id;
                    bot.logger.log(`Patched command (${this.data.name})`, `Update Command`);
                })
                .catch(error => {
                    bot.logger.error(error, `Update Command`);
                }
                );
        } else {
            this.guilds.forEach(guild => {
                let commandId = (this.id as Collection<string, string>).get(guild);
                rest.patch(Routes.applicationGuildCommand(botconfig.auth.clientId, guild, commandId), { body: this.data.toJSON() })
                    .then((response) => {
                        let response2: RESTGetAPIApplicationCommandResult = response as RESTGetAPIApplicationCommandResult;
                        this.id = response2.id;
                        bot.logger.log(`Patched command (${this.data.name}) in guild ${guild}`, `Update Command`);
                    })
                    .catch(error => {
                        bot.logger.error(error, `Update Command`);
                    }
                    );
            });
        }
    }

    public async runCommand(bot: Bot, interaction: CommandInteraction) {
        bot.logger.log(`<@!${interaction.user.id}> ran ${this.data.name}: ${interaction.commandName}`, `Interactions`);

        let errorString: string = `You are not allowed to run this command at the moment. Please contact <@!${botconfig.ids.devId}> if you think you should be able to.`;

        let flag: boolean = true;
        /* Old permission system
        let wlcount: number = 0//this.userwl.length + this.guildwl.length;
        let blcount: number = 0//this.userbl.length + this.guildbl.length;
        let permcount: number = 0//wlcount + blcount + this.devRolewl.length;
        if (permcount != 0) {
            if (wlcount != 0) {
                flag = false;
                this.userwl.forEach(id => {
                    if (interaction.user.id == id) {
                        flag = true;
                    }
                });
                this.guildwl.forEach(id => {
                    if (interaction.guildId == id) {
                        flag = true;
                    }
                });
            } else if (blcount != 0) {
                this.userbl.forEach(id => {
                    if (interaction.user.id == id) {
                        flag = false;
                        errorString = `You are not allowed to run that command. Please contact <@${botconfig.ids.devId}> if you think you should be able to.`;
                    }
                });
                this.guildbl.forEach(id => {
                    if (interaction.guildId == id) {
                        flag = false;
                        errorString = `This server is not allowed to run that command. Please contact <@${botconfig.ids.devId}> if you think you should be able to.`;
                    }
                });
            } else {
                flag = false;
                let server: Guild = bot.guilds.cache.get(botconfig.ids.homeGuildId);
                let member: GuildMember = server.members.cache.find(member => member.id === interaction.user.id)
                if (member) {
                    member.roles.cache.forEach(role => {
                        if (role.id == this.devRolewl[0]) {
                            flag = true;
                        }
                    });
                }
            }
        }
        */

        try {
            try {
                if (flag) {
                    await this.execute(bot, interaction);
                } else {
                    await interaction.reply({ content: errorString });
                }
            } catch (error: any) {
                console.error(error);
                //bot.logger.warn(`Interaction (${interaction.commandName}) did not reply.`, `Interactions`);
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: `damn it broke. msg <@213074932458979330>\nError: \`${error.name}: ${error.message}\`` }).catch(error => {
                        bot.logger.warn(`(${interaction.commandName}) had an error.\n${error}`, `Interactions`);
                    });
                } else {
                    await interaction.reply({ content: `damn it broke. msg <@213074932458979330>\nError: \`${error.name}: ${error.message}\`` }).catch(error => {
                        bot.logger.warn(`Interaction (${interaction.commandName}) did not reply in time.\n${error}`, `Interactions`);
                    });
                }
            }
        } catch (error) {
            bot.logger.error(error, `interactions`);
        }
    }
}
