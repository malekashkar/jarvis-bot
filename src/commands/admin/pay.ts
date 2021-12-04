import { CommandInteraction } from "discord.js";
import AdminCommands from ".";
import coinbase from "coinbase-commerce-node";
import embeds from "../../util/embed";
import { confirmator } from "../../util/questions";
import { SlashCommandBuilder } from "@discordjs/builders"

export default class PayCommand extends AdminCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Create a new invoice for a payment.")
    .addNumberOption(option =>
      option.setName("amount").setDescription("The price of the invoice.").setRequired(true));

  permission = "OWNER";

  async run(interaction: CommandInteraction) {
    const price = interaction.options.getNumber("amount");
    if (!price)
      return interaction.reply({
        embeds: [
          embeds.error(`Please provide a number value for the price!`)
        ]
      });

    const confirm = await confirmator(
      interaction,
      `Are you sure you would like to create this invoice?`
    );

    if (confirm) {
      const charge = new coinbase.resources.Charge({
        name: interaction.user.username,
        description: `Invoice payment for ${price} on Jarvis bot.`,
        pricing_type: "fixed_price",
        local_price: {
          amount: price.toString(),
          currency: "USD",
        },
      });
      try {
        await charge.save();

        interaction.reply({
          embeds: [
            embeds.normal(
              `Invoice Created`,
              `Please complete the payment here: ${charge.hosted_url}.`
            )
          ]
        });
      } catch (err) {
        console.log(err);
        interaction.reply({
          embeds: [
            embeds.error(
              `There was an error creating your invoice, please contact administration!`
            )
          ]
        });
      }
    }
  }
}
