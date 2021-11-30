import { Message, MessageAttachment } from "discord.js";
import FunCommands from ".";
import { imgurImage } from "../../util";

export default class MemeCommand extends FunCommands {
  cmdName = "meme";
  description = "Looks like you can use some memes right now?";
  permission = "ACCESS";

  async run(message: Message) {
    await message.channel.send({ embeds: [new MessageAttachment(await imgurImage("meme"))] });
  }
}
