import { DocumentType } from "@typegoose/typegoose";
import { Guild, Message, MessageAttachment } from "discord.js";
import Command from "..";
import User from "../../models/user";
import Client from "../../structures/client";
import { imgurImage } from "../../util";

export default class MemeCommand extends Command {
  cmdName = "meme";
  description = "Looks like you can use some memes right now?";
  groupName = "Fun";
  permission = "ACCESS";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    await message.channel.send(new MessageAttachment(await imgurImage("meme")));
  }
}
