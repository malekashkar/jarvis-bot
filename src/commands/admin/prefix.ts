import AdminCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import User from "../../models/user";
import Global from "../../models/global";
import embeds from "../../util/embed";

export default class PrefixCommand extends AdminCommands {
  cmdName = "prefix";
  description = "Set the prefix of the bot.";
  aliases = ["status"];
  permission = "OWNER";

  async run(
    message: Message,
    args: string[],
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const prefix = args[0]?.toLowerCase();
    if (!prefix)
      return message.channel.send({
        embeds: [
          embeds.error(`Please provide the prefix you would like to change to.`)
        ]
      });

    globalData.prefix = prefix;
    await globalData.save();

    await message.channel.send({
      embeds: [
        embeds.normal(
          `Prefix Changed`,
          `The prefix of the bot has been changed to: **${prefix}**`
        )
      ]
    });
  }
}
