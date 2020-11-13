import { Message, MessageAttachment } from "discord.js";
import FunCommands from ".";
import { imgurImage } from "../../util";

export default class DogCommand extends FunCommands {
  cmdName = "dog";
  description = "Looks like you can use some dog pics.";
  permission = "ACCESS";

  async run(message: Message) {
    await message.channel.send(new MessageAttachment(await imgurImage("dog")));
  }
}
