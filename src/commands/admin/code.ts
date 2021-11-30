import AdminCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { Message, MessageReaction, User } from "discord.js";
import Global, { CodeInfo } from "../../models/global";
import DbUser from "../../models/user";
import embeds from "../../util/embed";
import _ from "lodash";
import { emojis } from "../../util";
import { Groups } from "..";

export default class CodeCommand extends AdminCommands {
  cmdName = "code";
  description = "Create a code for a user to redeem.";
  aliases = ["gen"];
  permission = "owner";

  async run(
    message: Message,
    args: string[],
    _userData: DocumentType<DbUser>,
    globalData: DocumentType<Global>
  ) {
    const option =
      args[0].toLowerCase() === "list"
        ? "list"
        : args[0].toLowerCase() === "create"
        ? "create"
        : null;
    if (option === "list" || !option) {
      const codes = globalData.codes
        .map((x, i) => `${i + 1}. **${x.code}** ~ (${x.modules.join(", ")})`)
        .join("\n");
      return message.channel.send({
        embeds: [
          embeds.normal(`Available Codes`, codes)
        ]
      });
    }

    const modules: string[] = _.sortedUniq(
      this.client.commands
        .map((x) => x.groupName)
        .filter((x) => !x.toLowerCase().includes("admin"))
    );
    const moduleEmojis = emojis.slice(0, modules.length);
    const modulesDescription = modules
      .map((x, i) => `${emojis[i]} ${x}`)
      .join("\n");

    const modulesQuestion = await message.channel.send({
      embeds: [
        embeds.question(
          `Which modules would you like to provide?\n\n${modulesDescription}`
        )
      ]
    });
    for (const emoji of moduleEmojis.concat("✅")) {
      await modulesQuestion.react(emoji);
    }

    const filter = (reaction: MessageReaction, user: User) => user.id == message.author.id && reaction.emoji.name == "✅";
    const collector = await modulesQuestion.awaitReactions(
      { filter, time: 10 * 60 * 1000, errors: ["time"] }
    );

    if (modulesQuestion.deletable) await modulesQuestion.delete();
    if (collector?.first()) {
      const selectedEmojis = Array.from(
        modulesQuestion.reactions.cache
          .filter(
            (x) => x.emoji.name !== "✅" && x.users.cache.has(message.author.id)
          )
          .values()
        );
      const selectedModules = selectedEmojis.map(
        (x) => modules[moduleEmojis.indexOf(x.emoji.toString())]
      ) as Groups[];

      const code =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      await message.channel.send({
        embeds: [
          embeds.normal(
            `Code Generated`,
            `The code **${code}** accompanied by the modules ${selectedModules.join(
              ", "
            )} is now available for use!`
          )
        ]
      });
      await message.channel.send(code);

      globalData.codes.push(new CodeInfo(code, selectedModules));
      await globalData.save();
    }
  }
}
