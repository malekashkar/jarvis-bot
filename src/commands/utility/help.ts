import UtilityCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { Message, MessageEmbed, Collection, TextChannel } from "discord.js";
import User from "../../models/user";
import { emojis, permissionCheck } from "../../util";
import Global from "../../models/global";
import embeds from "../../util/embed";

export interface IGroup {
  commands: string[];
  descriptions: string[];
}

export default class DashCommand extends UtilityCommands {
  cmdName = "help";
  description = "Load up the help menu.";

  async run(
    message: Message,
    args: string[],
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

    let i = 0;
    const categories = help.keyArray();
    const categoryEmojis = emojis.slice(0, categories.length);

    const dashMessage = await message.channel.send(
      new MessageEmbed()
        .setTitle(`Jarvis Help Menu`)
        .addFields(
          help.map((value, key) => {
            return {
              name: `${categoryEmojis[i++]} ${key}`,
              value: `${value.commands
                .map((x) => `${globalData.prefix}${x}`)
                .join("\n")}`,
              inline: true,
            };
          })
        )
        .setColor("RANDOM")
    );
    for (const emoji of categoryEmojis) {
      await dashMessage.react(emoji);
    }

    const categoryReaction = await dashMessage.awaitReactions(
      (r, u) => u.id === message.author.id && emojis.includes(r.emoji.name),
      { max: 1, time: 900000, errors: ["time"] }
    );
    if (!categoryReaction) return;
    if (message.channel instanceof TextChannel)
      await dashMessage.reactions.removeAll();

    const chosenCategory =
      categories[categoryEmojis.indexOf(categoryReaction.first().emoji.name)];
    const category = help.get(chosenCategory);
    dashMessage.edit(
      embeds.normal(
        chosenCategory + " Menu",
        category.commands
          .map(
            (x, i) =>
              `**${globalData.prefix}${x}** ~ ${category.descriptions[i]}`
          )
          .join("\n")
      )
    );
  }
}

function toTitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
