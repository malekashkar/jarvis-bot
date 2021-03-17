import { Message } from "discord.js";
import AdminCommands from ".";
import coinbase from "coinbase-commerce-node";
import embeds from "../../util/embed";
import { confirmator } from "../../util/questions";

export default class PayCommand extends AdminCommands {
  cmdName = "pay";
  description = "Create a new invoice for a payment.";
  permission = "OWNER";

  async run(message: Message, args: string[]) {
    const price = !isNaN(parseInt(args[0])) ? parseInt(args[0]) : null;
    if (!price)
      return message.channel.send(
        embeds.error(`Please provide a number value for the price!`)
      );

    const confirm = await confirmator(
      message,
      `Are you sure you would like to create this invoice?`
    );

    if (confirm) {
      const charge = new coinbase.resources.Charge({
        name: message.author.username,
        description: `Invoice payment for ${price} on Jarvis bot.`,
        pricing_type: "fixed_price",
        local_price: {
          amount: price.toString(),
          currency: "USD",
        },
      });
      try {
        await charge.save();

        message.channel.send(
          embeds.normal(
            `Invoice Created`,
            `Please complete the payment here: ${charge.hosted_url}.`
          )
        );
      } catch (err) {
        console.log(err);
        message.channel.send(
          embeds.error(
            `There was an error creating your invoice, please contact administration!`
          )
        );
      }
    }
  }
}
