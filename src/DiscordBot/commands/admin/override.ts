import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, APIApplicationCommandOptionChoice } from "discord.js";
import { Command } from "../../classes/Command";
import { Bot } from "../../classes/Bot";
import { DatabaseHelper, IDLookupType } from "../../../Shared/Database";

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
                    .setChoices(
                        {name: 'None', value: '0'},
                        {name: 'Early Access', value: '10'},
                        {name: 'Large Donation', value: '20'},
                        {name: 'Big Donation', value: '30'},
                        {name: 'Super Secret', value : '999'}
                    )
                    .setRequired(true)
                )
            )
            .addSubcommand(subcommand => subcommand
                .setName(`bydiscordid`)
                .setDescription('Override a user\'s patreon level.')
                .addUserOption(option => option
                    .setName('user')
                    .setDescription('The user to enforce the patreon level on.')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('level')
                    .setDescription('The patreon level to enforce.')
                    .setChoices(
                        {name: 'None', value: '0'},
                        {name: 'Early Access', value: '10'},
                        {name: 'Large Donation', value: '20'},
                        {name: 'Big Donation', value: '30'},
                        {name: 'Super Secret', value : '999'}
                    )
                    .setRequired(true)
                )
            )
            .setDMPermission(false),
        execute: async function exec(bot: Bot, interaction: ChatInputCommandInteraction) {
            interaction.deferReply();
            const id = interaction.options.getString('id');
            const user = interaction.options.getUser('user');
            const level = parseInt(interaction.options.getString('level'));
            let dbUser
            if (user) {
                dbUser = await DatabaseHelper.getUser(user.id, IDLookupType.Discord);
            } else {
                dbUser = await DatabaseHelper.getUser(id, IDLookupType.Game);
            }

            
            if (level == 0) {
                await DatabaseHelper.updateUser(dbUser, { overridePatreonLevel: null });
            } else {
                await DatabaseHelper.updateUser(dbUser, { overridePatreonLevel: level });
            }
            interaction.editReply({ content: `Successfully enforced patreon level ${level} on user ${id}.` });
        }
    })
}