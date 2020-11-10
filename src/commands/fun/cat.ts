import { DocumentType } from "@typegoose/typegoose";
import { Message, MessageAttachment } from "discord.js";
import Command from "..";
import Global from "../../models/global";
import User from "../../models/user";
import Client from "../../structures/client";
import { imgurImage } from "../../util";

export default class CatCommand extends Command {
  cmdName = "cat";
  description = "Looks like you can use some cat pics.";
  groupName = "Fun";
  permission = "ACCESS";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    await message.channel.send(new MessageAttachment(await imgurImage("cat")));
  }
}
