import AuthCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import User, { UserModel } from "../../models/user";
import embeds from "../../util/embed";
import { getTaggedUsers } from "../../util/questions";
import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class DeauthCommand extends AuthCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("deauth")
    .setDescription("Remove someone's permission from using the discord bot.")
    
    permission = "OWNER";

  async run(interaction: CommandInteraction, userData: DocumentType<User>) {
    const users = await getTaggedUsers(
      interaction,
      `Who would you like to deauth? Tag them!`
    );
    if (!users) return;

    const user = users.first();
    userData = await UserModel.findById(user.id);
    if (!userData || !userData.access)
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
