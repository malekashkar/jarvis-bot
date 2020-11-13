import FunCommands from ".";
import { Message, MessageEmbed } from "discord.js";

export default class ColorCommand extends FunCommands {
  cmdName = "color";
  description = "Receive a random color.";
  aliases = ["randomcolor"];
  permission = "ACCESS";

  async run(message: Message) {
    const color =
      "#" + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6);
    await message.channel.send(
      new MessageEmbed().setTitle(color).setColor(color)
    );
  }
}
