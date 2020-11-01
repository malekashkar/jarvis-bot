import { Message } from "discord.js";
import { UserModel } from "../models/user";
import { GlobalModel } from "../models/global";
import settings from "../settings";
import Client from "../structures/client";
import Event from ".";

export default class CommandHandler extends Event {
  name = "message";

  async handle(client: Client, message: Message) {
    if (message.author.bot) return;

    const userData =
      (await UserModel.findOne({ userId: message.author.id })) ||
      (await UserModel.create({ userId: message.author.id }));

    const globalData =
      (await GlobalModel.findOne()) || (await GlobalModel.create());

    if (message.content.indexOf(globalData.prefix) !== 0) return;
    if (message.channel.type === "text") message.delete();

    const command = message.content
      .slice(globalData.prefix.length)
      .trim()
      .toLowerCase();

    for (const commandObj of client.commands.array()) {
      if (
        commandObj.cmdName === command ||
        commandObj.aliases.includes(command)
      ) {
        if (
          commandObj.permission &&
          !permissionCheck(message.author.id, commandObj.permission)
        )
          return;
        commandObj.run(client, message, userData, globalData);
      }
    }

    function permissionCheck(userId: string, permissionType: string) {
      if (permissionType.toLowerCase() === "ACCESS" && !userData.access)
        return false;
      else if (
        permissionType.toLowerCase() === "owner" &&
        message.author.id !== settings.ownerId
      )
        return false;

      return true;
    }
  }
}
