import UtilityCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { Collection, CommandInteraction } from "discord.js";
import User from "../../models/user";
import embeds from "../../util/embed";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Permissions } from "..";
import Paginator from "../../util/paginator";
import { permissionCheck } from "../../events/handler";


interface CommandInfo {
  name: string;
  description: string;
}

export default class DashCommand extends UtilityCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("help")
    .setDescription("Load up the help menu.");

  permission = Permissions.NONE;

  async run(
    interaction: CommandInteraction,
    userData: DocumentType<User>,
  ) {
    const groups: Collection<string, CommandInfo[]> = new Collection();
    for (const commandObj of Array.from(this.client.commands.values())) {
      if (
        !commandObj.groupName ||
        (commandObj.permission &&
        !permissionCheck(userData, commandObj.permission, commandObj.groupName))
      ) continue;

      const group = groups.get(toTitleCase(commandObj.groupName));
      if (!group) {
        groups.set(toTitleCase(commandObj.groupName), [{
          name: commandObj.slashCommand.name,
          description: commandObj.slashCommand.description
        }]);
      } else {
        group.push({
          name: commandObj.slashCommand.name,
          description: commandObj.slashCommand.description
        });
      }
    }

    new Paginator(
      interaction, 
      groups.size,
      async(pageIndex: number) => {
        const groupName = Array.from(groups.keys())[pageIndex];
        const group = Array.from(groups.values())[pageIndex];
        const formatted = group.map((command) => {
          return `**/${command.name}** ~ ${command.description}`
        });
        return embeds.normal(`Jarvis Help Menu | ${groupName} Module`, formatted.join("\n"));
      }
    ).start();
  }
}

function toTitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
