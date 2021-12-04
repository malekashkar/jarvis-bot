import { DocumentType } from "@typegoose/typegoose";
import Task, { Groups } from ".";
import { CodeInfo, GlobalModel } from "../models/global";
import Order, { OrderModel } from "../models/order";
import embeds from "../util/embed";
import coinbase from "coinbase-commerce-node";


export default class CoinbaseTask extends Task {
    taskName = "coinbase";
    groupName: Groups = "default";
    interval = 60 * 1000;

    async execute() {
        const charges = coinbase.resources.Charge;

        const ordersCursor = OrderModel.find({
            endTime: { $gt: new Date() },
          }).cursor();
    
          ordersCursor.on("data", async (infoData: DocumentType<Order>) => {
            const user = await this.client.users.fetch(infoData.userId);
            const invoice = await charges.retrieve(infoData.chargeId);
            if (!invoice) await infoData.updateOne({ endTime: new Date() });
    
            if (invoice.payments[0]?.status === "COMPLETED") {
              const code =
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
    
              const globalData =
                (await GlobalModel.findOne({})) || (await GlobalModel.create({}));
              globalData.codes.push(
                new CodeInfo(code, infoData.modules as Groups[])
              );
              await globalData.save();
    
              if (user)
                user.send({
                  embeds: [
                    embeds.normal(
                      `Payment Completed`,
                      `Please run the command \`${globalData.prefix}auth ${code}\` in order to gain access to your features.`
                    )
                  ]
                });
    
              await OrderModel.deleteOne(infoData);
            }
          });
    
        const endedOrderCursor = OrderModel.find({
            endTime: { $lte: new Date() },
        }).cursor();
        endedOrderCursor.on("data", async (infoData: DocumentType<Order>) => {
            const user = await this.client.users.fetch(infoData.userId);
            await OrderModel.deleteOne(infoData);
            const invoiceMessage = await user.dmChannel.messages.fetch(
                infoData.invoiceMessageId
            );

            if (invoiceMessage?.deletable) invoiceMessage.delete();
            try {
                user.send({
                    embeds: [
                        embeds.normal(
                            `Order Cancelled`,
                            `The order with checkout ID \`${infoData.invoiceMessageId}\` has been cancelled.`
                        )
                    ]
                });
            } catch(ignore) {}
        });
    }
}