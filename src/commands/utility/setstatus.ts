import Client from "../../structures/client";
import Command from "..";
import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import User from "../../models/user";
import Global from "../../models/global";
import { messageQuestion } from "../../util/questions";
import embeds from "../../util/embed";

export default class SetstatusCommand extends Command {
  cmdName = "setstatus";
  description = "Set the status of the bot.";
  groupName = "Misc";
  aliases = ["status"];
  permission = "OWNER";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const reactionQuestion = await messageQuestion(
      message,
      `What would you like the new status to be?`
    );
    if (!reactionQuestion) return;

    const status = reactionQuestion.content;

    globalData.status = status;
    await globalData.save();

    await message.channel.send(
      embeds.normal(
        `Status Changed`,
        `The status of the bot has been changed to: **${status}**`
      )
    );
    client.user.setActivity(status, { type: "WATCHING" });
  }
}
