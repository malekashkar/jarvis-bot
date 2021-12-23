import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import _ from "lodash";
import { DbInvite, InviteModel } from "../../models/invite";
import InviteCommands from ".";
import { Permissions } from "..";

export default class InvitesCreateCommand extends InviteCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("createinvites")
    .setDescription("Create a bunch of invites in the db.");

  permission = Permissions.OWNER;

  async run(interaction: CommandInteraction) {
      const users = this.client.users.cache.filter(x => !x.bot);
      for(let i = 0; i < 20; i++) {
          const inviterId = Array.from(users.keys())[Math.floor(Math.random() * users.size)];
          const invitedId = Array.from(users.keys())[Math.floor(Math.random() * users.size)];
          await InviteModel.create(new DbInvite(inviterId, interaction.guildId, invitedId, interaction.createdTimestamp));
      }
      return interaction.reply("Created!");
  }
}
