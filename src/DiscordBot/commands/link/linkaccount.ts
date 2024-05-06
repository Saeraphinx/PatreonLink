import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, ButtonStyle, ButtonBuilder, ActionRowBuilder } from "discord.js";
import { Command } from "../../classes/Command";
import { Bot } from "../../classes/Bot";
//@ts-ignore
import { express } from '../../../storage/config.json';
import { DatabaseHelper, IDLookupType } from "../../../Shared/Database";

module.exports = {
    command: new Command({
        data: new SlashCommandBuilder()
            .setName('linkaccount')
            .setDescription("Link accounts to your PatreonLink account. (Requires that youre already signed in)")
            .addSubcommand(subcommand => subcommand
                .setName(`beatleader`)
                .setDescription('Link your Patreon account to your BeatLeader Account.')
            ).addSubcommand(subcommand => subcommand
                .setName(`discord`)
                .setDescription('Link your Patreon account to your Discord Account.')
            ).addSubcommand(subcommand => subcommand
                .setName(`patreon`)
                .setDescription('Link your Discord account to your Patreon Account.')
            ).setDMPermission(false),
        execute: async function exec(bot: Bot, interaction: ChatInputCommandInteraction) {
            await interaction.deferReply();
            let dbUser = DatabaseHelper.getUser(interaction.user.id, IDLookupType.Discord);
            if (!dbUser) {
                let dbUser = await DatabaseHelper.createUser({
                    discordId: interaction.user.id,
                });
            }

            let linkButton = new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)

            switch (interaction.options.getSubcommand()) {
                case `patreon`:
                    linkButton.setLabel("Link Patreon").setURL(`${express.url}/api/auth/patreon?type=link`);
                    break;
                case `discord`:
                    linkButton.setLabel("Link Discord").setURL(`${express.url}/api/auth/discord?type=link`);
                    break;
                case `beatleader`:
                    linkButton.setLabel("Link Patreon").setURL(`${express.url}/api/auth/beatleader?type=link`);
                    break;
            }

            interaction.editReply({ content: "Click the button below to link your account. You must already be signed in, otherwise this link might not work.", components: [new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton)] });
        }
    })
}