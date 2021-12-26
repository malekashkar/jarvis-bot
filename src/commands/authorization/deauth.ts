import AuthCommands from ".";
import User, { UserModel } from "../../models/user";
import embeds from "../../util/embed";
import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Permissions } from "..";

export default class DeauthCommand extends AuthCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("deauth")
    .setDescription("Remove someone's permission from using the discord bot.")
    .addUserOption(opt =>
      opt.setName("user").setDescription("The user you would like to de-authorize.").setRequired(true));
    
  permission: Permissions = Permissions.OWNER;

  async run(interaction: CommandInteraction) {
    const user = interaction.options.getUser("user", true);
    const userData = await UserModel.findOne({ userId: user.id});
    if (!userData?.access)
      return interaction.reply({
        embeds: [
          embeds.error(`That user is not authorized, you cannot deauth him!`)
        ]
      });

    userData.access = false;
    userData.usedCode = null;
    await userData.save();

    return interaction.reply({
      embeds: [
        embeds.normal(
          `User De-authed`,
          `${user.username} has been de-authorized from using the bot.`
        )
      ]
    });
  }
}
