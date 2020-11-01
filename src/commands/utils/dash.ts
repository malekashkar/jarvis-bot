import Command from "..";
import Client from "../../structures/client";
import { DocumentType } from "@typegoose/typegoose";
import { Message, MessageEmbed, Collection } from "discord.js";
import User from "../../models/user";
import { emojis, react } from "../../util";
import settings from "../../settings";
import Global from "../../models/global";
import embeds from "../../util/embed";

export interface IGroup {
  commands: string[];
  descriptions: string[];
}

export default class DashCommand extends Command {
  cmdName = "dash";
  description = "Load up the dashboard menu.";
  groupName = "Misc";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const help: Collection<string, IGroup> = new Collection();
    const dashboard = new MessageEmbed()
      .setColor("RANDOM")
      .setTitle(`Jarvis Dashboard`);

    for (const commandObj of client.commands.array()) {
      if (!commandObj.groupName) continue;
      if (commandObj.permission === "ACCESS" && !userData.access) continue;
      if (
        commandObj.permission === "OWNER" &&
        message.author.id !== settings.ownerId
      )
        continue;

      const group = help.get(toTitleCase(commandObj.groupName));
      if (!group) {
        help.set(toTitleCase(commandObj.groupName), {
          commands: [commandObj.cmdName],
          descriptions: [commandObj.description],
        });
      } else {
        group.commands.push(commandObj.cmdName);
        group.descriptions.push(commandObj.description);
      }
    }

    for (const [key, value] of Object.entries(help)) {
      dashboard.addField(key, value);
    }

    const categories = Object.keys(help);
    const categoryEmojis = emojis.slice(0, categories.length);

    const dashMessage = await message.channel.send(dashboard);
    await react(dashMessage, categoryEmojis);

    const categoryReaction = await dashMessage.awaitReactions(
      (r, u) => emojis.includes(r.emoji.name) && u.id === message.author.id,
      { max: 1, time: 900000, errors: ["time"] }
    );
    if (!categoryReaction) return;

    const chosenCategory =
      categories[categoryEmojis.indexOf(categoryReaction.first().emoji.name)];
    const category = help.get(chosenCategory);

    let description = "";
    for (let i = 0; i < category.descriptions.length; i++) {
      description += `${category.commands[i]} ~ ${category.descriptions[i]}\n`;
    }

    dashMessage.reactions.removeAll();
    dashMessage.edit(embeds.normal(chosenCategory + " Menu", description));

    const commandEmojis = emojis.slice(0, category.commands.length);
    await react(dashMessage, commandEmojis);

    const reactionCommand = await dashMessage.awaitReactions(
      (r, u) => emojis.includes(r.emoji.name) && u.id === message.author.id,
      { max: 1, time: 900000, errors: ["time"] }
    );
    if (!reactionCommand) return;

    const command =
      category.commands[
        commandEmojis.indexOf(reactionCommand.first().emoji.name)
      ];

    client.commands
      .get(command.toLowerCase())
      .run(client, message, userData, globalData);
  }
}

function toTitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
