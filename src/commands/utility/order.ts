import { Message } from "discord.js";
import UtilityCommands from ".";

export default class OrderCommand extends UtilityCommands {
  cmdName = "order";
  description = "Order modules from Jarvis!";

  async run(message: Message) {}
}
