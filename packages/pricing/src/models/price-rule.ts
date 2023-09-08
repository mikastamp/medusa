import {
  BeforeCreate,
  Collection,
  Entity,
  ManyToMany,
  PrimaryKey,
} from "@mikro-orm/core"

import MoneyAmount from "./money-amount"
import PriceSetMoneyAmount from "./price-set-money-amount"
import { generateEntityId } from "@medusajs/utils"

@Entity()
export default class PriceRule {
  @PrimaryKey({ columnType: "text" })
  id!: string

  // @ManyToMany({
  //   entity: () => MoneyAmount,
  //   pivotEntity: () => PriceSetMoneyAmount,
  // })
  // money_amounts = new Collection<MoneyAmount>(this)

  @BeforeCreate()
  onCreate() {
    this.id = generateEntityId(this.id, "pset")
  }
}
