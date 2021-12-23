import { GuildInvitableChannelResolvable, MessageReaction, User } from "discord.js";
import Event, { EventNameType, Groups } from "..";
import { GiveawayModel } from "../../models/giveaway";
import { StatsModel } from "../../models/stats";
import embeds from "../../util/embed";

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
            await user.send({
                embeds: [
                  embeds.error(
                    `You need **${giveawayData.requirements.messageRequirement}** messages in order to enter this giveaway!\n**Note: You currently have ${statsData.messages} messages.**`
                  )
                ]
              })
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
          await user.send({
              embeds: [
                embeds.error(
                  `You need one of the following roles to enter this giveaway: ${roles}`
                )
              ]
            })
            .catch(() => {});
        }

        if(giveawayData.requirements.guildRequirements.length) {
          let missingGuilds = [];

          for(const guildId of giveawayData.requirements.guildRequirements) {
            const guild = await this.client.guilds.fetch(guildId);
            if(guild) {
              if(!guild.members.cache.has(user.id)) {
                if(!missingGuilds.length) await reaction.users.remove(user);

                const inviteChannel = guild.channels.cache.filter(x => x.type == "GUILD_TEXT").first() as GuildInvitableChannelResolvable;
                missingGuilds.push((await guild.invites.create(inviteChannel)).url);
              }
            } else {
              await reaction.message.channel.send({
                embeds: [embeds.error(
                  `One of the guild requirements in (this giveaway)[${reaction.message.url}] doesn't have Jarvis in it.\n`
                 + `The requirement will be ignored unless Jarvis is invited.`
                 )]
              })
            }
          }

          if(missingGuilds.length) {
            const formatted = missingGuilds.map(x => `◦  ${x}`).join("\n");
            await user.send({
              embeds: [
                embeds.error(
                  `You must join the following guilds to enter the giveaway:\n${formatted}`
                )
              ]
            })
            .catch(() => {});
          }
        }
      }
    }
  }
}
