import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../classes/Command";
import { Bot } from "../../classes/Bot";
import { DatabaseHelper, IDLookupType } from "../../../Shared/Database";

module.exports = {
    command: new Command({
        data: new SlashCommandBuilder()
            .setName('deletelink')
            .setDescription("Delete a user from the database.")
            .addSubcommand(subcommand => subcommand
                .setName('bydiscord')
                .setDescription('Delete a user from the database using their Discord ID.')
                .addUserOption(option => option
                    .setName('user')
                    .setDescription('The user to delete.')
                    .setRequired(true)
                )
            )
            .addSubcommand(subcommand => subcommand
                .setName('byid')
                .setDescription('Delete a user from the database using their Patreon ID.')
                .addStringOption(option => option
                    .setName('type')
                    .setDescription('The type of ID to use.')
                    .addChoices(
                        {name: 'Patreon', value: 'patreon'},
                        {name: 'Game', value: 'steam'},
                        {name: 'Discord', value: 'discord'},
                        {name: 'Database', value: 'database'}
                    )
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('id')
                    .setDescription('The user to delete.')
                    .setRequired(true)
                )
            )
            .setDMPermission(false),
        execute: async function exec(bot: Bot, interaction: ChatInputCommandInteraction) {
            const subcommand = interaction.options.getSubcommand();
            const user = interaction.options.getUser('user');
            const type = interaction.options.getString('type');
            const id = interaction.options.getString('id');

            if (subcommand === 'bydiscord') {
                await DatabaseHelper.deleteUser(user.id, IDLookupType.Discord);
                await interaction.reply({content: `User ${user.username} has been deleted from the database.`, ephemeral: true});
            } else if (subcommand === 'byid') {
                let lookupType = 0;
                if (type === 'patreon') {
                    lookupType = IDLookupType.Patreon;
                } else if (type === 'steam') {
                    lookupType = IDLookupType.Game;
                } else if (type === 'database') {
                    lookupType = IDLookupType.Database;
                } else if (type === 'discord') {
                    lookupType = IDLookupType.Discord;
                }
                let response = await DatabaseHelper.deleteUser(id, lookupType);
                if (response) {
                    return await interaction.reply({content: `User with ID ${id} Type ${lookupType} has been deleted from the database.`, ephemeral: true});
                } else {
                    return await interaction.reply({content: `User with ID ${id} Type ${lookupType} not found in the database.`, ephemeral: true});
                }
                
            }
        }
    })
}