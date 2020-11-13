import { Message, MessageAttachment } from "discord.js";
import FunCommands from ".";
import { imgurImage } from "../../util";

export default class CatCommand extends FunCommands {
  cmdName = "cat";
  description = "Looks like you can use some cat pics.";
  permission = "ACCESS";

  async run(message: Message) {
    await message.channel.send(new MessageAttachment(await imgurImage("cat")));
  }
}
