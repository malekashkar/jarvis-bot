import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import AdminCommands from ".";
import { Groups } from "..";
import Global, { ModulePrices } from "../../models/global";
import User from "../../models/user";
import embeds from "../../util/embed";
import { confirmator } from "../../util/questions";
import _ from "lodash";

export default class ModulePriceCommand extends AdminCommands {
  cmdName = "prices";
  description = "Change the prices of the modules";
  permission = "OWNER";

  async run(
    message: Message,
    args: string[],
    userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const modules: string[] = _.sortedUniq(
      this.client.commands
        .map((x) => x.groupName)
        .filter((x) => !x.toLowerCase().includes("admin"))
    );

    const moduleName = args[0]?.toLowerCase();
    if (!modules?.includes(moduleName))
      return message.channel.send(
        embeds.error(
          `Please choose from the following modules: ${modules.join(", ")}`
        )
      );
    const price = !isNaN(parseInt(args[0])) ? parseInt(args[0]) : null;
    if (!price)
      return message.channel.send(
        embeds.error(`Please provide the new price of the module.`)
      );

    const confirm = await confirmator(
      message,
      `Are you sure you would like to change the price of the module **${moduleName}** to **$${price}**?`
    );

    if (confirm) {
      globalData.modulePrices[moduleName as keyof ModulePrices] = price;
      await globalData.save();

      return message.channel.send(
        embeds.normal(
          `Module Price Edited`,
          `The price of the module **${moduleName}** has been set to **$${price}**!`
        )
      );
    }
  }
}
