import { getModelForClass, prop } from "@typegoose/typegoose";

export default class Global {
  @prop({ default: "-" })
  prefix?: string;

  @prop()
  codes?: string[];

  @prop({ default: `Default Status` })
  status?: string;
}

export const GlobalModel = getModelForClass(Global);
