import { CommandInteraction } from "discord.js";
import embeds from "../../util/embed";
import { SlashCommandBuilder } from "@discordjs/builders";
import { InviteModel } from "../../models/invite";
import InviteCommands from ".";

export default class InvitesStatsCommand extends InviteCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("invitestats")
    .setDescription("Check the guild stats on invites.");

  async run(interaction: CommandInteraction) {
      const guildInvites = await InviteModel.find({ guildId: interaction.guildId });

      const joinTotal = guildInvites.filter(x => !x.left).length;
      const joinDaily = guildInvites.filter(x => Date.now() - x.timestamp < 24 * 60 * 60 * 1000 && !x.left).length;
      const joinWeekly = guildInvites.filter(x => Date.now() - x.timestamp < 7 * 24 * 60 * 60 * 1000 && !x.left).length;

      const leaveTotal = guildInvites.filter(x => x.left).length;
      const leaveDaily = guildInvites.filter(x => Date.now() - x.timestamp < 24 * 60 * 60 * 1000 && x.left).length;
      const leaveWeekly = guildInvites.filter(x => Date.now() - x.timestamp < 7 * 24 * 60 * 60 * 1000 && x.left).length;

      return interaction.reply({
          embeds: [
              embeds.empty().setTitle("Server Invite Stats")
                .setDescription(
                    `**Join Statistics**\n` + 
                    `Total: **${joinTotal}** Invites\nDaily: **${joinDaily}** Invites\nWeekly: **${joinWeekly}** Invites\n\n` +
                    `**Leave Statistics**\n` +
                    `Total: **${leaveTotal}** Invites\nDaily: **${leaveDaily}** Invites\nWeekly: **${leaveWeekly}** Invites`
                )
          ]
      });
  }
}
