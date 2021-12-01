import { Message } from "discord.js";
import Global from "../../models/global";
import { Guild } from "../../models/guild";
import User from "../../models/user";
import FridayCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import embeds from "../../util/embed";
import ms from "ms";

export default class ListCommand extends FridayCommands {
  cmdName = "list";
  description =
    "List all the roles currently setup and the channels they can use.";

  async run(
    message: Message,
    _args: string[],
    userData: DocumentType<User>,
    _globalData: DocumentType<Global>,
    guildData: DocumentType<Guild>
  ) {
    const role = guildData.roles.find((role) =>
        message.member.roles.cache.map((x) => x.id).includes(role.role)
    );
    if (role && role.channels.includes(message.channel.id)) {
        if (userData?.lastAd?.nextAdTime < Date.now()) {
            const quest = await message.channel.send({
                embeds: [
                    embeds
                        .normal(
                            `Advertisement Confirmation`,
                            `Are you sure you would like to post this advertisement.\nClick the ✅ or 🚫 depending on your choice.`
                        )
                        .addField(`Advertisement Message`, message.content, true)
                        .addField(`Advertisement Interval`, ms(role.cooldownTime), true)
                ]
            });
            await quest.react("✅");
            await quest.react("🚫");

            quest
            .awaitReactions({
                filter: (r, u) =>
                u.id === message.author.id &&
                ["🚫", "✅"].includes(r.emoji.name),
                max: 1, time: 900000, errors: ["time"]
            })
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
            const denial = await message.channel.send({
                embeds: [
                    embeds.error(
                        `Please wait **${ms(userData.lastAd.nextAdTime - Date.now())}** before you can post an ad again!`
                    )
                ]
            });
            await denial.delete();
        }
    }
  }
}
