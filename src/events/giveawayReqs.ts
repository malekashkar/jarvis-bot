import { MessageReaction, User } from "discord.js";
import Event, { EventNameType, Groups } from ".";
import { GiveawayModel } from "../models/giveaway";
import { StatsModel } from "../models/stats";
import embeds from "../util/embed";

export default class GiveawayRequirements extends Event {
  groupName: Groups = "giveaways";
  eventName: EventNameType = "messageReactionAdd";

  async handle(reaction: MessageReaction, user: User) {
    if (user.bot) return;
    if (reaction.message.partial) await reaction.message.fetch();

    const message = reaction.message;
    if (reaction.emoji.name === "🎉") {
      const giveawayData = await GiveawayModel.findOne({
        "location.messageId": message.id,
      });
      if (giveawayData) {
        if (giveawayData?.requirements?.messageRequirement) {
          const statsData = await StatsModel.findOne({
            userId: user.id,
            guildId: message.guild.id,
          });

          if (
            statsData?.messages &&
            statsData.messages < giveawayData.requirements.messageRequirement
          ) {
            await reaction.users.remove(user);
            await user
              .send(
                embeds.error(
                  `You need **${giveawayData.requirements.messageRequirement}** messages in order to enter this giveaway!\n**Note: You currently have ${statsData.messages} messages.**`
                )
              )
              .catch(() => {});
          }
        }

        const member = message.guild.members.resolve(user);
        if (
          giveawayData?.requirements?.roleRequirements?.length &&
          !giveawayData.requirements.roleRequirements.some((roleId) =>
            member?.roles?.cache?.has(roleId)
          )
        ) {
          const roles = giveawayData.requirements.roleRequirements
            .map((x) => message.guild.roles?.resolve(x)?.name)
            .filter((x) => !!x)
            .join(", ");
          await reaction.users.remove(user);

          await user
            .send(
              embeds.error(
                `You need one of the following roles to enter this giveaway: ${roles}`
              )
            )
            .catch(() => {});
        }
      }
    }
  }
}
