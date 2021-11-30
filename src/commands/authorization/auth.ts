import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import AuthCommands from ".";
import Global from "../../models/global";
import User from "../../models/user";
import embeds from "../../util/embed";

export default class AuthCommand extends AuthCommands {
  cmdName = "auth";
  description = "Authorize yourself to get access to the bot.";
  aliases = ["authenticate", "authorize"];

  async run(
    message: Message,
    args: string[],
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const code = args[0];
    if (!code)
      return message.channel.send({
        embeds: [
          embeds.error(`Please provide the code you would like to redeem!`)
        ]
      });
    else if (!globalData.codes.some((x) => x.code === code))
      return message.channel.send({
        embeds: [
          embeds.error(`The code you provided is either invalid or outdated.`)
        ]
      });

    const modules = globalData.codes.find((x) => x.code === code)?.modules;
    globalData.codes = globalData.codes.filter((x) => x.code !== code);
    await globalData.save();

    userData.access = true;
    userData.modules = modules;
    await userData.save();

    return message.channel.send({
      embeds: [
        embeds.normal(
          `Welcome To Jarvis`,
          `Welcome master ${message.author}. I am **${this.client.user.username}**, how can I be of assistance?`
        )
      ]
    });
  }
}
