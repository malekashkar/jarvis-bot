import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import _ from "lodash";
import { InviteModel } from "../../models/invite";
import InviteCommands from ".";
import { Permissions } from "..";

export default class InvitesClearCommand extends InviteCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("clearinvites")
    .setDescription("Clear all the invites in the database.");

  permissions = Permissions.OWNER;

  async run(interaction: CommandInteraction) {
      await InviteModel.deleteMany({ guildId: interaction.guildId });
      return interaction.reply("Deleted!");
  }
}
