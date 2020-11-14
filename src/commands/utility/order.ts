import { DocumentType } from "@typegoose/typegoose";
import { DMChannel, Message } from "discord.js";
import UtilityCommands from ".";
import User from "../../models/user";
import { emojis, react } from "../../util";
import embeds from "../../util/embed";
import coinbase from "coinbase-commerce-node";
import _ from "lodash";
import Order, { OrderModel } from "../../models/order";
import Global from "../../models/global";
import { Groups } from "..";

export default class OrderCommand extends UtilityCommands {
  cmdName = "order";
  description = "Order modules from Jarvis!";

  async run(
    message: Message,
    userData: DocumentType<User>,
    guildData: DocumentType<Global>
  ) {
    if (!(message.channel instanceof DMChannel))
      return message.channel.send(
        embeds.error(`You can only use this command in our DM's!`)
      );
    else if (userData.access)
      return message.channel.send(
        embeds.error(`You already have access to this discord bot!`)
      );

    const orderData = await OrderModel.findOne({
      userId: message.author.id,
    });
    if (orderData)
      return await message.channel.send(
        embeds.error(`You already have an order open!`)
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
        `Which modules would you like to install?\n\n${modulesDescription}`
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
        .filter((x) => x.count === 2 && x.emoji.name !== "✅")
        .map((x) => x.emoji.name);
      const selectedModules = selectedEmojis.map(
        (x) => modules[moduleEmojis.indexOf(x)]
      );
      const selectedModulesDescription = selectedModules
        .map((x, i) => `${i + 1}. **${x}**`)
        .join("\n");

      const Charge = coinbase.resources.Charge;
      const charge = new Charge({
        name: message.author.username,
        description: `Order the modules ${selectedModules.join(
          ", "
        )} on Jarvis bot.`,
        pricing_type: "fixed_price",
        local_price: {
          amount: Math.round(
            selectedModules.length * guildData.modulePrice
          ).toString(),
          currency: "USD",
        },
      });
      try {
        await charge.save();

        const invoiceMessage = await message.channel.send(
          embeds
            .normal(
              `Invoice Created`,
              `Please complete the payment here: ${charge.hosted_url}.\n\nSelected Modules:\n${selectedModulesDescription}`
            )
            .setFooter(`You must send the payment in within the next hour.`)
        );

        await OrderModel.create(
          new Order(
            message.author.id,
            charge.id,
            invoiceMessage.id,
            selectedModules as Groups[],
            new Date(Date.now() + 3600 * 1000)
          )
        );
      } catch (err) {
        console.log(err);
        message.channel.send(
          embeds.error(
            `There was an error creating your order, please contact administration!`
          )
        );
      }
    }
  }
}
