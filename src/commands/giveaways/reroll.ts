import { CommandInteraction, User } from "discord.js";
import { GiveawayModel } from "../../models/giveaway";
import embeds from "../../util/embed";
import { SlashCommandBuilder } from "@discordjs/builders";
import GiveawayCommands from ".";

export default class RerollCommand extends GiveawayCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("reroll")
    .setDescription("Reroll a past giveaway using it's message ID.")
    .addStringOption(sub =>
      sub.setName("message id").setDescription("The ID of the giveaway message.").setRequired(true));

  async run(interaction: CommandInteraction) {
    const messageId = interaction.options.getString("message id");
    if (!messageId)
      return interaction.reply({
        embeds: [embeds.error(`Please provide the message ID of the giveaway.`)]
      });

    const giveaway = await GiveawayModel.findOne({
      "location.messageId": messageId,
    });
    if (giveaway) {
      if (giveaway.location?.guildId !== interaction.guildId)
        return interaction.reply({
          embeds: [embeds.error(`You cannot reroll giveaways from other guilds!`)]
        });

      let giveawayWinners: User[] = [];

      const gMessage = await this.client.locateMessage(giveaway.location);
      if (gMessage) {
        let entries = Array.from(
          gMessage.reactions?.cache
            .get("🎉")
            ?.users?.cache?.filter((x) => !x.bot)
            .values()
          );
        if (entries?.length) {
          let possibleWinners: string[] = entries.map((x) => x.id);

          if (giveaway?.requirements?.multipliers?.length) {
            for (const multiplier of giveaway.requirements.multipliers) {
              for (const user of entries) {
                const member = await gMessage.guild.members.fetch(user);
                if (member?.roles?.cache?.has(multiplier.roleId)) {
                  for (let i = 0; i < multiplier.multiplier; i++) {
                    possibleWinners.push(user.id);
                  }
                }
              }
            }
          }

          for (let i = 0; i < giveaway.winners; i++) {
            const winner = entries[Math.floor(Math.random() * entries.length)];
            entries = entries.filter((x) => x !== winner);
            giveawayWinners.push(winner);
          }

          if (giveawayWinners.length) {
            await interaction.channel.send({
              content: `${giveawayWinners.map((x) => x.toString()).join(", ")}`,
              embeds: [
                embeds.normal(
                  `Giveaway Ended`,
                  `🎁 **Prize** ${
                    giveaway.prize
                  }\n👥 **Winners** ${giveawayWinners
                    .map((x) => x.toString())
                    .join(", ")}`
                )
              ]
            }
            );
          }
        } else {
          await interaction.channel.send({
            embeds: [
              embeds.normal(
                `Giveaway Ended`,
                `🎁 **Prize** ${giveaway.prize}\n👥 **Winners** Not enough people entered the giveaway!`
              )
            ]
          });
        }
      } else {
        return interaction.channel.send({
          embeds: [embeds.error(`The giveaway message could not be located!`)]
        });
      }
    } else {
      return interaction.reply({
        embeds: [
          embeds.error(
            `No giveaway could be found with the message ID \`${messageId}\`.`
          )
        ]
      });
    }
  }
}
