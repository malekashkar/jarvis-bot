import AdminCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import Global, { CodeInfo } from "../../models/global";
import User from "../../models/user";
import { messageQuestion } from "../../util/questions";
import embeds from "../../util/embed";
import _ from "lodash";
import { emojis, react } from "../../util";
import { Groups } from "..";

export default class CodeCommand extends AdminCommands {
  cmdName = "code";
  description = "Create a code for a user to redeem.";
  aliases = ["gen"];
  permission = "owner";

  async run(
    message: Message,
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const typeQuestion = await messageQuestion(
      message,
      `Would you like to **create** a code or **list** the codes?`,
      message.author.id,
      ["list", "create"]
    );
    const option = typeQuestion?.content;

    if (!option || option === "list")
      return await message.channel.send(
        embeds.normal(
          `Available Codes`,
          globalData.codes
            .map(
              (x, i) => `${i + 1}. **${x.code}** ~ (${x.modules.join(", ")})`
            )
            .join("\n")
        )
      );

    const modules: string[] = _.sortedUniq(
      this.client.commands
        .map((x) => x.groupName)
        .filter((x) => !x.toLowerCase().includes("admin"))
    );
    const moduleEmojis = emojis.slice(0, modules.length);
    const modulesDescription = modules
      .map((x, i) => `${emojis[i]} ${x}`)
      .join("\n");

    const modulesQuestion = await message.channel.send(
      embeds.question(
        `Which modules would you like to provide?\n\n${modulesDescription}`
      )
    );
    await react(modulesQuestion, moduleEmojis.concat("✅"));

    const collector = await modulesQuestion.awaitReactions(
      (r, u) => u.id === message.author.id && r.emoji.name === "✅",
      {
        max: 1,
        time: 10 * 60 * 1000,
        errors: ["time"],
      }
    );

    if (modulesQuestion.deletable) await modulesQuestion.delete();
    if (collector?.first()) {
      const selectedEmojis = modulesQuestion.reactions.cache
        .filter((x) => x.emoji.name !== "✅" && x.users.cache.has(message.author.id))
        .keyArray();
      const selectedModules = selectedEmojis.map(
        (x) => modules[moduleEmojis.indexOf(x)]
      ) as Groups[];

      const code =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      await message.channel.send(
        embeds.normal(
          `Code Generated`,
          `The code **${code}** accompanied by the modules ${selectedModules.join(
            ", "
          )} is now available for use!`
        )
      );
      await message.channel.send(code);

      globalData.codes.push(new CodeInfo(code, selectedModules));
      await globalData.save();
    }
  }
}
