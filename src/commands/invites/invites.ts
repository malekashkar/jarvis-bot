import ModCommands from ".";
import { CommandInteraction } from "discord.js";
import embeds from "../../util/embed";
import { SlashCommandBuilder } from "@discordjs/builders";
import { InviteModel } from "../../models/invite";

export default class InvitesCommand extends ModCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("invites")
    .setDescription("Check your own or a guild members invites.")
    .addUserOption(opt =>
        opt.setName("user").setDescription("Check a guild member's invites."));

  permission = "ACCESS";

  async run(interaction: CommandInteraction) {
    const user = interaction.options.getUser("user");
    const member = user ? await interaction.guild.members.fetch(user) : interaction.member;

    const invites = await InviteModel.find({ guildId: interaction.guildId, inviterId: member.user.id });
    const real = invites.filter(x => !x.left).length;
    const fake = invites.filter(x => x.left).length;

    return interaction.reply({
        embeds: [
            embeds.normal(
                member.user.username + " Invites",
                `**${real}** Invites (${real} Real, ${fake} Leaves, ${real + fake} Total)`
            )
        ]
    });
  }
}
