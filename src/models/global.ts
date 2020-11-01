import { getModelForClass, prop } from "@typegoose/typegoose";

export default class Global {
  @prop({ required: true, default: "-" })
  prefix?: string;

  @prop({ required: false, type: String })
  codes?: string[];

  @prop({ required: true, default: `Default Status` })
  status?: string;
}

export const GlobalModel = getModelForClass(Global);
