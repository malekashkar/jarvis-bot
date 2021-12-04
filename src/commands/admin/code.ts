import AdminCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { CommandInteraction, MessageReaction, User } from "discord.js";
import Global, { CodeInfo } from "../../models/global";
import DbUser from "../../models/user";
import embeds from "../../util/embed";
import _ from "lodash";
import { emojis } from "../../util";
import { Groups } from "..";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class CodeCommand extends AdminCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("code")
    .setDescription("Create a new redeemable Jarvis code or list all active codes.")
    .addSubcommand(sub => 
      sub.setName("list").setDescription("List all of the available codes."))
    .addSubcommand(sub =>
      sub.setName("create").setDescription("Create a new code for someone to redeem."))

  aliases = ["gen"];
  permission = "owner";

  async run(
    interaction: CommandInteraction,
    _userData: DocumentType<DbUser>,
    globalData: DocumentType<Global>
  ) {
    const subCommand = interaction.options.getSubcommand(true);
    if (subCommand == "list") {
      return interaction.reply({
        embeds: [
          embeds.normal(
            `Available Codes`,
            globalData.codes
              .map((x, i) => `${i + 1}. **${x.code}** ~ (${x.modules.join(", ")})`)
              .join("\n")
          )
        ]
      });
    } else {
      const modules: string[] = _.sortedUniq(
        this.client.commands
          .map((x) => x.groupName)
          .filter((x) => !x.toLowerCase().includes("admin"))
      );
      const moduleEmojis = emojis.slice(0, modules.length);
      const modulesDescription = modules
        .map((x, i) => `${emojis[i]} ${x}`)
        .join("\n");
  
      const modulesQuestion = await interaction.channel.send({
        embeds: [
          embeds.question(
            `Which modules would you like to provide?\n\n${modulesDescription}`
          )
        ]
      });
      for (const emoji of moduleEmojis.concat("✅")) {
        await modulesQuestion.react(emoji);
      }
  
      const filter = (reaction: MessageReaction, user: User) => user.id == interaction.user.id && reaction.emoji.name == "✅";
      const collector = await modulesQuestion.awaitReactions(
        { filter, time: 10 * 60 * 1000, errors: ["time"] }
      );
  
      if (modulesQuestion.deletable) await modulesQuestion.delete();
      if (collector?.first()) {
        const selectedEmojis = Array.from(
          modulesQuestion.reactions.cache
            .filter(
              (x) => x.emoji.name !== "✅" && x.users.cache.has(interaction.user.id)
            )
            .values()
          );
        const selectedModules = selectedEmojis.map(
          (x) => modules[moduleEmojis.indexOf(x.emoji.toString())]
        ) as Groups[];
  
        const code =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
  
        await interaction.reply({
          embeds: [
            embeds.normal(
              `Code Generated`,
              `The code **${code}** accompanied by the modules ${selectedModules.join(
                ", "
              )} is now available for use!`
            )
          ]
        });
        await interaction.reply(code);
  
        globalData.codes.push(new CodeInfo(code, selectedModules));
        await globalData.save();
      }
    }
  }
}
