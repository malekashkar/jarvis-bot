import AdminCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import User from "../../models/user";
import Global from "../../models/global";
import embeds from "../../util/embed";

export default class SetstatusCommand extends AdminCommands {
  cmdName = "setstatus";
  description = "Set the status of the bot.";
  aliases = ["status"];
  permission = "OWNER";

  async run(
    message: Message,
    args: string[],
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const status = args.length ? args.join(" ") : null;
    if (!status)
      return message.channel.send(
        embeds.error(
          `Please provide the message you would like to set the status to!`
        )
      );

    globalData.status = status;
    await globalData.save();

    this.client.user.setActivity(status, { type: "WATCHING" });
    return message.channel.send(
      embeds.normal(
        `Status Changed`,
        `The status of the bot has been changed to: **${status}**`
      )
    );
  }
}
