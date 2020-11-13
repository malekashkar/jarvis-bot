import AdminCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import User from "../../models/user";
import Global from "../../models/global";
import { messageQuestion } from "../../util/questions";
import embeds from "../../util/embed";

export default class PrefixCommand extends AdminCommands {
  cmdName = "prefix";
  description = "Set the prefix of the bot.";
  aliases = ["status"];
  permission = "OWNER";

  async run(
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const prefixQuestion = await messageQuestion(
      message,
      `What would you like the new prefix to be?`
    );
    if (!prefixQuestion) return;

    const prefix = prefixQuestion.content;

    globalData.prefix = prefix;
    await globalData.save();

    await message.channel.send(
      embeds.normal(
        `Prefix Changed`,
        `The prefix of the bot has been changed to: **${prefix}**`
      )
    );
  }
}
