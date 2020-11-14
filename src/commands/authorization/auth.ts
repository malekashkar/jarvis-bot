import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import AuthCommands from ".";
import Global from "../../models/global";
import User from "../../models/user";
import embeds from "../../util/embed";
import { messageQuestion } from "../../util/questions";

export default class AuthCommand extends AuthCommands {
  cmdName = "auth";
  description = "Authorize yourself to get access to the bot.";
  aliases = ["authenticate", "authorize"];

  async run(
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
    if (!globalData.codes.some((x) => x.code === code))
      return message.channel.send(
        embeds.error(`The code you provided is either invalid or outdated.`)
      );

    const modules = globalData.codes.find((x) => x.code === code)?.modules;

    globalData.codes = globalData.codes.filter((x) => x.code !== code);
    await globalData.save();

    userData.access = true;
    userData.modules = modules;
    await userData.save();

    message.channel.send(
      embeds.normal(
        `Welcome To Jarvis`,
        `Welcome master ${message.author}. I am **${this.client.user.username}**, how can I be of assistance?`
      )
    );
  }
}
