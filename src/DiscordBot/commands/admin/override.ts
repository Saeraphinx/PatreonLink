import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, APIApplicationCommandOptionChoice } from "discord.js";
import { Command } from "../../classes/Command";
import { Bot } from "../../classes/Bot";
import { DatabaseHelper, IDLookupType } from "../../../Shared/Database";

const choices = [
    {name: 'None', value: '0'},
    {name: 'Early Access', value: '1'},
    {name: 'Large Donation', value: '2'},
    {name: 'Big Donation', value: '3'},
]

module.exports = {
    command: new Command({
        data: new SlashCommandBuilder()
            .setName('override')
            .setDescription("Enforce a user to stay at a specific patreon level.")
            .addSubcommand(subcommand => subcommand
                .setName(`bygameid`)
                .setDescription('Override a user\'s patreon level.')
                .addStringOption(option => option
                    .setName('id')
                    .setDescription('The user to enforce the patreon level on.')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('level')
                    .setDescription('The patreon level to enforce.')
                    .addChoices(choices)
                    .setRequired(true)
                )
            )
            .setDMPermission(false),
        execute: async function exec(bot: Bot, interaction: ChatInputCommandInteraction) {
            const id = interaction.options.getString('id');
            const level = parseInt(interaction.options.getString('level'));
            let user = DatabaseHelper.getUser(id, IDLookupType.Game);
            if (level == 0) {
                await DatabaseHelper.updateUser(id, { overridePatreonLevel: null });
            } else {
                await bot.database.updateUser(id, { overridePatreonLevel: level });
            }
        }
    })
}