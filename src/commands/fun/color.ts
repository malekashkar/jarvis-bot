import Command from "..";
import Client from "../../structures/client";
import { DocumentType } from "@typegoose/typegoose";
import { Guild, Message, MessageEmbed } from "discord.js";
import User from "../../models/user";
import Global from "../../models/global";

export default class ColorCommand extends Command {
  cmdName = "color";
  description = "Receive a random color.";
  groupName = "Fun";
  aliases = ["randomcolor"];
  permission = "ACCESS";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const color =
      "#" + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6);
    await message.channel.send(
      new MessageEmbed().setTitle(color).setColor(color)
    );
  }
}
