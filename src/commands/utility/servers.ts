import UtilityCommands from ".";
import { Message, MessageEmbed } from "discord.js";
import embeds from "../../util/embed";
import { emojis } from "../../util";

export default class serverCommand extends UtilityCommands {
  cmdName = "server";
  description = "Get a list of all the servers or check a specific one.";
  aliases = ["server", "guilds"];
  permission = "ACCESS";

  async run(message: Message) {
    const guilds = this.client.guilds.cache.array();
    const guildEmojis = emojis.slice(0, guilds.length);

    const guildsFormattedText = guilds
      .map((x, i) => `${guildEmojis[i]} **${x.name}**`)
      .join("\n");

    const msg = await message.channel.send(
      embeds.normal(`List of Servers`, guildsFormattedText)
    );
    for (const emoji of guildEmojis) {
      await msg.react(emoji);
    }

    const reaction = await msg.awaitReactions(
      (r, u) =>
        u.id === message.author.id && guildEmojis.includes(r.emoji.name),
      { max: 1, time: 900 * 1000, errors: ["time"] }
    );
    if (!reaction) return;

    const reactedEmoji = reaction.first().emoji.name;
    const guild = guilds[guildEmojis.indexOf(reactedEmoji)];
    const invite = (await guild.fetchInvites()).first()?.url;

    const members = await guild.members.fetch();
    const onlineMemberCount = members.filter(
      (m) => m.presence.status === "online"
    ).size;
    const botsMemberCount = members.filter((member) => member.user.bot).size;

    await message.channel.send(
      new MessageEmbed()
        .setTitle(guild.name + ` Server Info`)
        .setThumbnail(guild.iconURL())
        .addField("Total Members", members.size, true)
        .addField("Online Members", onlineMemberCount, true)
        .addField("Bots", botsMemberCount, true)
        .addField(`Guild Invite`, invite || `No Invite`, true)
    );
  }
}
