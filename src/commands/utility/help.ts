import UtilityCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { Message, MessageEmbed, Collection } from "discord.js";
import User from "../../models/user";
import { emojis, react } from "../../util";
import settings from "../../settings";
import embeds from "../../util/embed";

export interface IGroup {
  commands: string[];
  descriptions: string[];
}

export default class HelpCommand extends UtilityCommands {
  cmdName = "help";
  description = "Load up the help menu.";

  async run(
    message: Message,
    userData: DocumentType<User>
  ) {
    const help: Collection<string, IGroup> = new Collection();
    const helpEmbed = new MessageEmbed()
      .setColor("RANDOM")
      .setTitle(`Jarvis Help Menu`);

    for (const commandObj of this.client.commands.array()) {
      if (!commandObj.groupName) continue;
      if (commandObj.permission === "ACCESS" && !userData.access) continue;
      if (
        commandObj.permission === "OWNER" &&
        !settings.ownerId.includes(message.author.id)
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
      helpEmbed.addField(key, value);
    }

    const categories = Object.keys(help);
    const categoryEmojis = emojis.slice(0, categories.length);

    const helpMessage = await message.channel.send(helpEmbed);
    await react(helpMessage, categoryEmojis);

    const categoryReaction = await helpMessage.awaitReactions(
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

    helpMessage.reactions.removeAll();
    helpMessage.edit(embeds.normal(chosenCategory + " Menu", description));
  }
}

function toTitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
