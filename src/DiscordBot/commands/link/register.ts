import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Command } from "../../classes/Command";
import { Bot } from "../../classes/Bot";
//@ts-ignore
import { express } from '../../../storage/config.json';

module.exports = {
    command: new Command({
        data: new SlashCommandBuilder()
            .setName('register')
            .setDescription("Register for a new PatreonLink account.")
            .setDMPermission(false),
        execute: async function exec(bot: Bot, interaction: ChatInputCommandInteraction) {
            await interaction.deferReply();

            let linkButton = new ButtonBuilder().setStyle(ButtonStyle.Link)
            linkButton.setLabel("Create PatreonLink Account").setURL(`${express.url}/api/auth/patreon?type=link&simple=true`);

            interaction.editReply({ content: "Click the button below to register for PatreonLink.", components: [new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton)] });
        }
    })
}