import { DocumentType } from "@typegoose/typegoose";
import { CommandInteraction, Message } from "discord.js";
import AdminCommands from ".";
import Global, { ModulePrices } from "../../models/global";
import User from "../../models/user";
import embeds from "../../util/embed";
import { confirmator } from "../../util/questions";
import _ from "lodash";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class ModulePriceCommand extends AdminCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("prices")
    .setDescription("Change the prices of the modules.")
    .addStringOption(sub =>
      sub.setName("module name").setDescription("The module name.").setRequired(true))
    .addNumberOption(sub =>
      sub.setName("amount").setDescription("The new price of the module.").setRequired(true));

  permission = "OWNER";

  async run(
    interaction: CommandInteraction,
    _userData: DocumentType<User>,
    globalData: DocumentType<Global>
  ) {
    const modules: string[] = _.sortedUniq(
      this.client.commands
        .map((x) => x.groupName)
        .filter((x) => !x.toLowerCase().includes("admin"))
    );

    const moduleName = interaction.options.getString("module name").toLowerCase();
    if (!modules?.includes(moduleName))
      return interaction.reply({
        embeds: [
          embeds.error(
            `Please choose from the following modules: ${modules.join(", ")}`
          )
        ]
      });
    const price = interaction.options.getNumber("amount");
    if (!price)
      return interaction.reply({
        embeds: [
          embeds.error(`Please provide the new price of the module.`)
        ]
      });

    const confirm = await confirmator(
      interaction,
      `Are you sure you would like to change the price of the module **${moduleName}** to **$${price}**?`
    );

    if (confirm) {
      globalData.modulePrices[moduleName as keyof ModulePrices] = price;
      await globalData.save();

      return interaction.reply({
        embeds: [
          embeds.normal(
            `Module Price Edited`,
            `The price of the module **${moduleName}** has been set to **$${price}**!`
          )
        ]
      });
    }
  }
}
