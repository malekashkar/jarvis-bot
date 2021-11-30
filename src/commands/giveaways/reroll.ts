import { Message, TextChannel, User } from "discord.js";
import Command, { Groups } from "..";
import { GiveawayModel } from "../../models/giveaway";
import embeds from "../../util/embed";

export default class RerollCommand extends Command {
  groupName: Groups = "giveaways";
  cmdName = "reroll";
  description = "Reroll a past giveaway using it's message ID.";

  async run(message: Message, args: string[]) {
    const messageId = args[0];
    if (!messageId)
      return message.channel.send({
        embeds: [embeds.error(`Please provide the message ID of the giveaway.`)]
      });

    const giveaway = await GiveawayModel.findOne({
      "location.messageId": messageId,
    });
    if (giveaway) {
      if (giveaway.location?.guildId !== message.guild.id)
        return message.channel.send({
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
            await gMessage.channel.send({
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
          await gMessage.channel.send({
            embeds: [
              embeds.normal(
                `Giveaway Ended`,
                `🎁 **Prize** ${giveaway.prize}\n👥 **Winners** Not enough people entered the giveaway!`
              )
            ]
          });
        }
      } else {
        return message.channel.send({
          embeds: [embeds.error(`The giveaway message could not be located!`)]
        });
      }
    } else {
      return message.channel.send({
        embeds: [
          embeds.error(
            `No giveaway could be found with the message ID \`${messageId}\`.`
          )
        ]
      });
    }
  }
}
