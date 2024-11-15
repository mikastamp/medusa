import { model, ProductUtils, toHandle } from "@medusajs/framework/utils"
import ProductCategory from "./product-category"
import ProductCollection from "./product-collection"
import ProductImage from "./product-image"
import ProductOption from "./product-option"
import ProductTag from "./product-tag"
import ProductType from "./product-type"
import ProductVariant from "./product-variant"

const productHandleIndexName = "IDX_product_handle_unique"
// const productHandleIndexStatement = createPsqlIndexStatementHelper({
//   name: productHandleIndexName,
//   tableName: "product",
//   columns: ["handle"],
//   unique: true,
//   where: "deleted_at IS NULL",
// })

const productTypeIndexName = "IDX_product_type_id"
// const productTypeIndexStatement = createPsqlIndexStatementHelper({
//   name: productTypeIndexName,
//   tableName: "product",
//   columns: ["type_id"],
//   unique: false,
//   where: "deleted_at IS NULL",
// })

const productCollectionIndexName = "IDX_product_collection_id"
// const productCollectionIndexStatement = createPsqlIndexStatementHelper({
//   name: productCollectionIndexName,
//   tableName: "product",
//   columns: ["collection_id"],
//   unique: false,
//   where: "deleted_at IS NULL",
// })

const Product = model
  .define("Product", {
    id: model.id().primaryKey(),
    title: model.text().searchable(),
    handle: model.text().nullable(), // TODO: provide a way to compute a value if not provided (default maybe)
    subtitle: model.text().searchable().nullable(),
    description: model.text().searchable().nullable(),
    is_giftcard: model.boolean().default(false),
    status: model
      .enum(ProductUtils.ProductStatus)
      .default(ProductUtils.ProductStatus.DRAFT),
    thumbnail: model.text().nullable(),
    weight: model.number().nullable(),
    length: model.number().nullable(),
    height: model.number().nullable(),
    width: model.number().nullable(),
    origin_country: model.text().nullable(),
    hs_code: model.text().nullable(),
    mid_code: model.text().nullable(),
    material: model.text().nullable(),
    discountable: model.boolean().default(true),
    external_id: model.text().nullable(),
    metadata: model.json().nullable(),
    variants: model.hasMany(() => ProductVariant, {
      mappedBy: "product",
    }),
    type: model
      .belongsTo(() => ProductType, {
        mappedBy: "product",
      })
      .nullable(),
    tags: model.manyToMany(() => ProductTag, {
      mappedBy: "products",
      pivotTable: "product_tags",
    }),
    options: model.hasMany(() => ProductOption, {
      mappedBy: "product",
    }),
    images: model.manyToMany(() => ProductImage, {
      pivotTable: "product_images",
      mappedBy: "products",
      joinColumn: "product_id",
      inverseJoinColumn: "image_id",
    }),
    collection: model
      .belongsTo(() => ProductCollection, {
        mappedBy: "products",
      })
      .nullable(),
    categories: model.manyToMany(() => ProductCategory, {
      pivotTable: "product_category_product",
      mappedBy: "products",
    }),
  })
  .cascades({
    delete: ["variants", "options"],
  })
  .hooks({
    creating: (product) => {
      product.handle ??= product.title ? toHandle(product.title) : null
    },
  })
  .indexes([
    {
      name: productHandleIndexName,
      on: ["handle"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: productTypeIndexName,
      on: ["type_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: productCollectionIndexName,
      on: ["collection_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ])

// productTypeIndexStatement.MikroORMIndex()
// productCollectionIndexStatement.MikroORMIndex()
// productHandleIndexStatement.MikroORMIndex()
// @Entity({ tableName: "product" })
// @Filter(DALUtils.mikroOrmSoftDeletableFilterOptions)
// class Product {
// @PrimaryKey({ columnType: "text" })
// id!: string
// @Searchable()
// @Property({ columnType: "text" })
// title: string
// @Property({ columnType: "text" })
// handle?: string
// @Searchable()
// @Property({ columnType: "text", nullable: true })
// subtitle?: string | null
// @Searchable()
// @Property({
//   columnType: "text",
//   nullable: true,
// })
// description?: string | null
// @Property({ columnType: "boolean", default: false })
// is_giftcard!: boolean
// @Enum(() => ProductUtils.ProductStatus)
// @Property({ default: ProductUtils.ProductStatus.DRAFT })
// status!: ProductUtils.ProductStatus
// @Property({ columnType: "text", nullable: true })
// thumbnail?: string | null
// @OneToMany(() => ProductOption, (o) => o.product, {
//   cascade: ["soft-remove"] as any,
// })
// options = new Collection<ProductOption>(this)
// @Searchable()
// @OneToMany(() => ProductVariant, (variant) => variant.product, {
//   cascade: ["soft-remove"] as any,
// })
// variants = new Collection<ProductVariant>(this)
// @Property({ columnType: "text", nullable: true })
// weight?: number | null
// @Property({ columnType: "text", nullable: true })
// length?: number | null
// @Property({ columnType: "text", nullable: true })
// height?: number | null
// @Property({ columnType: "text", nullable: true })
// width?: number | null
// @Property({ columnType: "text", nullable: true })
// origin_country?: string | null
// @Property({ columnType: "text", nullable: true })
// hs_code?: string | null
// @Property({ columnType: "text", nullable: true })
// mid_code?: string | null
// @Property({ columnType: "text", nullable: true })
// material?: string | null
// @Searchable()
// @ManyToOne(() => ProductCollection, {
//   columnType: "text",
//   nullable: true,
//   fieldName: "collection_id",
//   mapToPk: true,
//   onDelete: "set null",
// })
// collection_id: string | null
// @ManyToOne(() => ProductCollection, {
//   nullable: true,
//   persist: false,
// })
// collection: ProductCollection | null
// @ManyToOne(() => ProductType, {
//   columnType: "text",
//   nullable: true,
//   fieldName: "type_id",
//   mapToPk: true,
//   onDelete: "set null",
// })
// type_id: string | null
// @ManyToOne(() => ProductType, {
//   nullable: true,
//   persist: false,
// })
// type: ProductType | null
// @ManyToMany(() => ProductTag, "products", {
//   owner: true,
//   pivotTable: "product_tags",
//   index: "IDX_product_tag_id",
// })
// tags = new Collection<ProductTag>(this)
// @ManyToMany(() => ProductImage, "products", {
//   owner: true,
//   pivotTable: "product_images",
//   joinColumn: "product_id",
//   inverseJoinColumn: "image_id",
// })
// images = new Collection<ProductImage>(this)
// @ManyToMany(() => ProductCategory, "products", {
//   owner: true,
//   pivotTable: "product_category_product",
// })
// categories = new Collection<ProductCategory>(this)
// @Property({ columnType: "boolean", default: true })
// discountable: boolean
// @Property({ columnType: "text", nullable: true })
// external_id?: string | null
// @Property({
//   onCreate: () => new Date(),
//   columnType: "timestamptz",
//   defaultRaw: "now()",
// })
// created_at: Date
// @Property({
//   onCreate: () => new Date(),
//   onUpdate: () => new Date(),
//   columnType: "timestamptz",
//   defaultRaw: "now()",
// })
// updated_at: Date
// @Index({ name: "IDX_product_deleted_at" })
// @Property({ columnType: "timestamptz", nullable: true })
// deleted_at?: Date
// @Property({ columnType: "jsonb", nullable: true })
// metadata?: Record<string, unknown> | null
// @OnInit()
// @BeforeCreate()
// onInit() {
//   this.id = generateEntityId(this.id, "prod")
//   this.type_id ??= this.type?.id ?? null
//   this.collection_id ??= this.collection?.id ?? null
//   if (!this.handle && this.title) {
//     this.handle = toHandle(this.title)
//   }
// }
// }

export default Product
// export default Product
