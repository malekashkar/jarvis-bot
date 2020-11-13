import AdminCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import User from "../../models/user";
import Global from "../../models/global";
import { messageQuestion } from "../../util/questions";
import embeds from "../../util/embed";

export default class SetstatusCommand extends AdminCommands {
  cmdName = "setstatus";
  description = "Set the status of the bot.";
  aliases = ["status"];
  permission = "OWNER";

  async run(
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
    this.client.user.setActivity(status, { type: "WATCHING" });
  }
}
