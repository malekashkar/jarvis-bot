import AdminCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { CommandInteraction, Message, MessageReaction, User } from "discord.js";
import Global, { CodeInfo } from "../../models/global";
import DbUser from "../../models/user";
import embeds from "../../util/embed";
import _ from "lodash";
import { emojis, toTitleCase } from "../../util";
import { Groups, Permissions } from "..";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class CodeCommand extends AdminCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("code")
    .setDescription("Create a new redeemable Jarvis code or list all active codes.")
    .addSubcommand(sub => 
      sub.setName("list").setDescription("List all of the available codes."))
    .addSubcommand(sub =>
      sub.setName("create").setDescription("Create a new code for someone to redeem."))
      
  async run(
    interaction: CommandInteraction,
    _userData: DocumentType<DbUser>,
    globalData: DocumentType<Global>
  ) {
    const subCommand = interaction.options.getSubcommand(true);
    if (subCommand == "list") {
      if(globalData.codes.length) {
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
        return interaction.reply({
          embeds: [embeds.error("Run the \`/code create\` command in order to create your first authentication code!")]
        })
      }
    } else {
      const modules: string[] = _.sortedUniq(
        this.client.commands
          .map((x) => toTitleCase(x.groupName))
          .filter((x) => !x.toLowerCase().includes("admin"))
      );
      const moduleEmojis = emojis.slice(0, modules.length);
      const modulesDescription = modules
        .map((x, i) => `${emojis[i]} ${x}`)
        .join("\n");
  
      const modulesQuestion = await interaction.reply({
        embeds: [
          embeds.question(
            `Which modules would you like to provide?\n\n${modulesDescription}`
          )
        ],
        fetchReply: true
      });

      if(modulesQuestion instanceof Message) {
        for (const emoji of moduleEmojis.concat("✅")) {
          await modulesQuestion.react(emoji);
        }
    
        const collector = modulesQuestion.createReactionCollector({
          filter: (r: MessageReaction, u: User) => u.id == interaction.user.id && r.emoji.name == "✅",
          max: 1,
          time: 10 * 60 * 1000,
        });
        
        collector.on("collect", async() => {          
          const selectedModules = Array.from(
            modulesQuestion.reactions.cache
              .filter((x) => x.emoji.name !== "✅" && x.users.cache.has(interaction.user.id))
              .values()
            ).map((x) => modules[moduleEmojis.indexOf(x.emoji.toString())]) as Groups[];
          if(selectedModules.length == 0) return interaction.editReply({
            embeds: [embeds.error("Select modules you would like to add next time!")]
          });
    
          const code =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    
          await modulesQuestion.reactions.removeAll();
          await interaction.editReply({
            embeds: [
              embeds.normal(
                `Code Generated`,
                `The code **${code}** accompanied by the modules ${selectedModules.join(
                  ", "
                )} is now available for use!`
              )
            ]
          }); 
          await interaction.channel.send(code);
    
          globalData.codes.push(new CodeInfo(code, selectedModules));
          await globalData.save();
        });
      }
    }
  }
}
