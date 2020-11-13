import AuthCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import Global from "../../models/global";
import User from "../../models/user";
import { messageQuestion } from "../../util/questions";
import embeds from "../../util/embed";

export default class CodeCommand extends AuthCommands {
  cmdName = "code";
  description = "Create a code for a user to redeem.";
  aliases = ["gen"];
  permission = "OWNER";

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
    if (!typeQuestion) return;

    const option = typeQuestion.content;

    if (option === "create") {
      const code =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      message.channel.send(
        embeds.normal(
          `Code Generated`,
          `The code **${code}** is now available for use!`
        )
      );
      await message.channel.send(code);

      globalData.codes.push(code);
      await globalData.save();
    } else {
      const codes = globalData.codes.map((x, i) => `${i + 1}. **${x}**`);

      message.channel.send(
        embeds.normal(
          `Available Codes List`,
          `Available Codes:\n\n${codes.join("\n")}`
        )
      );
    }
  }
}
