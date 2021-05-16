import { getModelForClass, prop } from "@typegoose/typegoose";
import { Groups } from "../commands/";

export class CodeInfo {
  @prop()
  code: string;

  @prop({ type: String })
  modules: Groups[];

  constructor(code: string, modules: Groups[]) {
    this.code = code;
    this.modules = modules;
  }
}

export class ModulePrices {
  @prop({ default: 5 })
  default: number;

  @prop({ default: 5 })
  administration: number;

  @prop({ default: 5 })
  authorization: number;

  @prop({ default: 5 })
  fun: number;

  @prop({ default: 5 })
  moderation: number;

  @prop({ default: 5 })
  reminders: number;

  @prop({ default: 5 })
  utility: number;

  @prop({ default: 5 })
  friday: number;

  @prop({ default: 5 })
  giveaways: number;
}

export default class Global {
  @prop({ default: "-" })
  prefix?: string;

  @prop({ type: CodeInfo })
  codes?: CodeInfo[];

  @prop({ default: `Default Status` })
  status?: string;

  @prop({ default: {} })
  modulePrices?: ModulePrices;
}

export const GlobalModel = getModelForClass(Global);
