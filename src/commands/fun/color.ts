import FunCommands from ".";
import { Message, MessageEmbed } from "discord.js";

export default class ColorCommand extends FunCommands {
  cmdName = "color";
  description = "Receive a random color.";
  aliases = ["randomcolor"];
  permission = "ACCESS";

  async run(message: Message) {
    const color = Math.floor(Math.random()*16777215).toString(16);
    await message.channel.send({
      embeds: [
        new MessageEmbed()
          .setTitle(color)
          .setColor(parseInt(color))
      ]
    });
  }
}
