import Client from "../../structures/client";
import Command from "..";
import { DocumentType } from "@typegoose/typegoose";
import { Message, MessageEmbed } from "discord.js";
import User from "../../models/user";
import Global from "../../models/global";
import embeds from "../../util/embed";
import { emojis, react } from "../../util";

export default class serverCommand extends Command {
  cmdName = "server";
  description = "Get a list of all the servers or check a specific one.";
  groupName = "Moderation";
  aliases = ["servers"];
  permission = "ACCESS";

  async run(
    client: Client,
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const guilds = client.guilds.cache.array();
    const guildsFormattedText = guilds
      .map((x, i) => `${i + 1}. **${x.name}**`)
      .join("\n");

    const msg = await message.channel.send(
      embeds
        .normal(`List of Servers`, guildsFormattedText)
        .setThumbnail(client.user.avatarURL())
    );
    const selectedEmojis = emojis.slice(0, guilds.length - 1);
    await react(msg, selectedEmojis);

    const reaction = await msg.awaitReactions(
      (r, u) =>
        u.id === message.author.id && selectedEmojis.includes(r.emoji.name),
      { max: 1, time: 900000, errors: ["time"] }
    );
    if (!reaction) return;

    const reactedEmoji = reaction.first().emoji.name;
    const guild = guilds[selectedEmojis.indexOf(reactedEmoji)];

    await message.channel.send(
      new MessageEmbed()
        .setTitle(guild.name + ` Server Info`)
        .setThumbnail(guild.iconURL())
        .addField("Total Members", guild.memberCount, true)
        .addField(
          "Online Members",
          guild.members.cache.filter((m) => m.presence.status === "online")
            .size,
          true
        )
        .addField(
          "Bots",
          guild.members.cache.filter((member) => member.user.bot).size,
          true
        )
    );
  }
}
