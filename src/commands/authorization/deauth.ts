import Command from "..";
import Client from "../../structures/client";
import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import User, { UserModel } from "../../models/user";
import Global from "../../models/global";
import embeds from "../../util/embed";
import { getSourceMapRange } from "typescript";
import { getTaggedUser } from "../../util/questions";

export default class DeauthCommand extends Command {
  cmdName = "deauth";
  description = "Remove someone's permission from using the discord bot.";
  groupName = "Authorization";
  aliases = ["unauthorize", "deauthorize", "unath"];
  permission = "OWNER";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const user = await getTaggedUser(
      message,
      `Who would you like to deauth? Tag them!`
    );
    if (!user) return;

    userData = await UserModel.findById(user.id);
    if (!userData || !userData.access)
      return message.channel.send(
        embeds.error(`That user is not authorized, you cannot deauth him!`)
      );

    userData.access = false;
    userData.usedCode = null;
    await userData.save();

    message.channel.send(
      embeds.normal(
        `User De-authed`,
        `${user.username} has been de-authorized from using the bot.`
      )
    );
  }
}
