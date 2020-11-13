import UtilityCommands from ".";
import { Message, MessageEmbed } from "discord.js";

import embeds from "../../util/embed";
import { emojis, react } from "../../util";

export default class serverCommand extends UtilityCommands {
  cmdName = "server";
  description = "Get a list of all the servers or check a specific one.";
  aliases = ["servers"];
  permission = "ACCESS";

  async run(message: Message) {
    const guilds = this.client.guilds.cache.array();
    const guildsFormattedText = guilds
      .map((x, i) => `${i + 1}. **${x.name}**`)
      .join("\n");

    const msg = await message.channel.send(
      embeds.normal(`List of Servers`, guildsFormattedText)
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
