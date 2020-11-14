import { getModelForClass, prop } from "@typegoose/typegoose";
import { Groups } from "../commands";

export default class Order {
  @prop({ unique: true })
  userId: string;

  @prop()
  chargeId: string;

  @prop()
  invoiceMessageId: string;

  @prop({ type: String })
  modules: Groups[];

  @prop()
  endTime: Date;

  constructor(
    userId: string,
    chargeId: string,
    invoiceMessageId: string,
    modules: Groups[],
    endTime: Date
  ) {
    this.userId = userId;
    this.chargeId = chargeId;
    this.invoiceMessageId = invoiceMessageId;
    this.modules = modules;
    this.endTime = endTime;
  }
}

export const OrderModel = getModelForClass(Order);
