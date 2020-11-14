import UtilityCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { Message, MessageEmbed, Collection, TextChannel } from "discord.js";
import User from "../../models/user";
import { emojis, permissionCheck, react } from "../../util";
import Global from "../../models/global";
import embeds from "../../util/embed";

export interface IGroup {
  commands: string[];
  descriptions: string[];
}

export default class DashCommand extends UtilityCommands {
  cmdName = "dash";
  description = "Load up the dashboard menu.";

  async run(
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const help: Collection<string, IGroup> = new Collection();
    for (const commandObj of this.client.commands.array()) {
      if (!commandObj.groupName) continue;
      if (
        commandObj.permission &&
        !permissionCheck(userData, commandObj.permission, commandObj.groupName)
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

    const categories = help.keyArray();
    const categoryEmojis = emojis.slice(0, categories.length);

    let i = 0;
    const categoriesDescription = help.map((value, key) => {
      return {
        name: `${categoryEmojis[i++]} ${key}`,
        value: `${value.commands
          .map((x) => `${globalData.prefix}${x}`)
          .join("\n")}`,
        inline: true,
      };
    });

    const dashMessage = await message.channel.send(
      new MessageEmbed()
        .setTitle(`Jarvis Dashboard`)
        .addFields(categoriesDescription)
        .setColor("RANDOM")
    );
    await react(dashMessage, categoryEmojis);

    const categoryReaction = await dashMessage.awaitReactions(
      (r, u) => u.id === message.author.id && emojis.includes(r.emoji.name),
      { max: 1, time: 900000, errors: ["time"] }
    );
    if (!categoryReaction) return;
    if (message.channel instanceof TextChannel)
      dashMessage.reactions.removeAll();

    const chosenCategory =
      categories[categoryEmojis.indexOf(categoryReaction.first().emoji.name)];
    const category = help.get(chosenCategory);

    const commandEmojis = emojis.slice(0, category.commands.length);
    await react(dashMessage, commandEmojis);

    dashMessage.edit(
      embeds.normal(
        chosenCategory + " Menu",
        category.commands
          .map(
            (x, i) =>
              `${commandEmojis[i]} **${globalData.prefix}${x}** ~ ${category.descriptions[i]}`
          )
          .join("\n")
      )
    );

    const reactionCommand = await dashMessage.awaitReactions(
      (r, u) => emojis.includes(r.emoji.name) && u.id === message.author.id,
      { max: 1, time: 900000, errors: ["time"] }
    );
    if (!reactionCommand) return;

    const command =
      category.commands[
        commandEmojis.indexOf(reactionCommand.first().emoji.name)
      ];

    this.client.commands
      .get(command.toLowerCase())
      .run(message, userData, globalData);
  }
}

function toTitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
