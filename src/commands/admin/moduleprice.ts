import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import AdminCommands from ".";
import Global from "../../models/global";
import User from "../../models/user";
import embeds from "../../util/embed";
import { messageQuestion } from "../../util/questions";

export default class ModulePriceCommand extends AdminCommands {
  cmdName = "moduleprice";
  description = "Change the price of a module";
  permission = "OWNER";

  async run(
    message: Message,
    userData: DocumentType<User>,
    guildData: DocumentType<Global>
  ) {
    const amountQuestion = await messageQuestion(
      message,
      `What would you like to set the price per module to?`
    );
    const price = !isNaN(Number(amountQuestion.content))
      ? Number(Number(amountQuestion.content).toString(2))
      : null;
    if (!price)
      return message.channel.send(
        embeds.error(
          `The value \`${amountQuestion.content}\` is not a valid price.`
        )
      );

    guildData.modulePrice = price;
    await guildData.save();

    return await message.channel.send(
      embeds.normal(
        `Module Price Change`,
        `The price per module has been changed to **${price}**.`
      )
    );
  }
}
