import { Message, TextChannel } from "discord.js";
import { UserModel } from "../models/user";
import { GlobalModel } from "../models/global";
import settings from "../settings";
import Event, { Groups } from ".";
import { GuildModel } from "../models/guild";
import ms from "ms";
import embeds from "../util/embed";

export default class Advertisement extends Event {
  eventName = "message";
  groupName: Groups = "friday";

  async handle(message: Message) {
    if (message.author.bot && settings.vision_id !== message.author.id) return;

    const userData =
      (await UserModel.findOne({ userId: message.author.id })) ||
      (await UserModel.create({ userId: message.author.id }));

    const globalData =
      (await GlobalModel.findOne({})) || (await GlobalModel.create({}));

    const guildData =
      (await GuildModel.findOne({ guildId: message.guild.id })) ||
      (await GuildModel.create({ guildId: message.guild.id }));

    if (message.content.indexOf(globalData.prefix) !== 0) {
      if (message.channel instanceof TextChannel) {
        const role = guildData.roles.find((role) =>
          message.member.roles.cache.map((x) => x.id).includes(role.role)
        );
        if (role && role.channels.includes(message.channel.id)) {
          if (
            !userData?.lastAd?.nextAdTime ||
            userData.lastAd.nextAdTime < Date.now()
          ) {
            const quest = await message.channel.send(
              embeds
                .normal(
                  `Advertisement Confirmation`,
                  `Are you sure you would like to post this advertisement.\nClick the ✅ or 🚫 depending on your choice.`
                )
                .addField(`Advertisement Message`, message.content, true)
                .addField(`Advertisement Interval`, ms(role.cooldownTime), true)
            );
            await quest.react("✅");
            await quest.react("🚫");

            quest
              .awaitReactions(
                (r, u) =>
                  u.id === message.author.id &&
                  ["🚫", "✅"].includes(r.emoji.name),
                { max: 1, time: 900000, errors: ["time"] }
              )
              .then(async (reaction) => {
                if (reaction.first().emoji.name === "✅") {
                  if (quest.deletable) quest.delete();

                  message.react("🚫");

                  userData.lastAd.channel = message.channel.id;
                  userData.lastAd.nextAdTime = Date.now() + role.cooldownTime;
                  await userData.save();
                } else {
                  message.delete();
                  quest.delete();
                }
              });
          } else {
            message.delete();
            const denial = await message.channel.send(
              embeds.error(
                `Please wait **${ms(
                  userData.lastAd.nextAdTime - Date.now()
                )}** before you can post an ad again!`
              )
            );
            await denial.delete({ timeout: 10000 });
          }
        }
      }
    }
  }
}
