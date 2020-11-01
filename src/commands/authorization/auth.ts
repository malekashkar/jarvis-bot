import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import Command from "..";
import Global from "../../models/global";
import User from "../../models/user";
import Client from "../../structures/client";
import embeds from "../../util/embed";
import { messageQuestion } from "../../util/questions";

export default class AuthCommand extends Command {
  cmdName = "auth";
  description = "Authorize yourself to get access to the bot.";
  groupName = "Authorization";
  aliases = ["authenticate", "authorize"];
  permission = "EVERYONE";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const codeQuestion = await messageQuestion(
      message,
      `What's the code you would like to use?`
    );
    if (!codeQuestion) return;

    const code = codeQuestion.content;

    if (!globalData.codes.includes(code))
      return message.channel.send(
        embeds.error(`The code you provided is either invalid or outdated.`)
      );

    globalData.codes = globalData.codes.filter((x) => x !== code);
    await globalData.save();

    userData.access = true;
    await userData.save();

    message.channel.send(
      embeds.normal(
        `Welcome To Jarvis`,
        `Welcome master ${message.author}. I am **${client.user.username}**, how can I be of assistance?`
      )
    );
  }
}
