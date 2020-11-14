import { Message } from "discord.js";
import { UserModel } from "../models/user";
import { GlobalModel } from "../models/global";
import settings from "../settings";
import Event from ".";
import { permissionCheck } from "../util";

export default class CommandHandler extends Event {
  name = "message";

  async handle(message: Message) {
    if (
      message.author.bot &&
      settings.friday_id !== message.author.id &&
      settings.vision_id !== message.author.id
    )
      return;

    const userData =
      (await UserModel.findOne({ userId: message.author.id })) ||
      (await UserModel.create({ userId: message.author.id }));

    const globalData =
      (await GlobalModel.findOne({})) || (await GlobalModel.create({}));

    if (message.content.indexOf(globalData.prefix) !== 0) return;
    if (message.channel.type === "text") message.delete();

    const command = message.content
      .slice(globalData.prefix.length)
      .trim()
      .toLowerCase();

    for (const commandObj of this.client.commands.array()) {
      if (commandObj.disabled) continue;
      if (
        commandObj.cmdName.toLowerCase() === command.toLowerCase() ||
        commandObj.aliases
          .map((x) => x.toLowerCase())
          .includes(command.toLowerCase())
      ) {
        if (
          commandObj.permission &&
          !permissionCheck(
            userData,
            commandObj.permission,
            commandObj.groupName
          )
        )
          return;
        commandObj.run(message, userData, globalData);
      }
    }
  }
}
