import { expectTypeOf } from "expect-type"
import { model } from "../../dml"
import { MedusaService } from "../medusa-service"
import { InferTypeOf } from "@medusajs/types"

const Blog = model.define("Blog", {
  id: model.text(),
  title: model.text(),
  description: model.text().nullable(),
})

type BlogDTO = {
  id: number
  title: string
}

type CreateBlogDTO = {
  title: string | null
}

const baseRepoMock = {
  serialize: jest.fn().mockImplementation((item) => item),
  transaction: (task) => task("transactionManager"),
  getFreshManager: jest.fn().mockReturnThis(),
}

const containerMock = {
  baseRepository: baseRepoMock,
  mainModelMockRepository: baseRepoMock,
  otherModelMock1Repository: baseRepoMock,
  otherModelMock2Repository: baseRepoMock,
  mainModelMockService: {
    retrieve: jest.fn().mockResolvedValue({ id: "1", name: "Item" }),
    list: jest.fn().mockResolvedValue([{ id: "1", name: "Item" }]),
    delete: jest.fn().mockResolvedValue(undefined),
    softDelete: jest.fn().mockResolvedValue([[], {}]),
    restore: jest.fn().mockResolvedValue([[], {}]),
  },
  otherModelMock1Service: {
    retrieve: jest.fn().mockResolvedValue({ id: "1", name: "Item" }),
    list: jest.fn().mockResolvedValue([{ id: "1", name: "Item" }]),
    delete: jest.fn().mockResolvedValue(undefined),
    softDelete: jest.fn().mockResolvedValue([[], {}]),
    restore: jest.fn().mockResolvedValue([[], {}]),
  },
  otherModelMock2Service: {
    retrieve: jest.fn().mockResolvedValue({ id: "1", name: "Item" }),
    list: jest.fn().mockResolvedValue([{ id: "1", name: "Item" }]),
    delete: jest.fn().mockResolvedValue(undefined),
    softDelete: jest.fn().mockResolvedValue([[], {}]),
    restore: jest.fn().mockResolvedValue([[], {}]),
  },
}

describe("Medusa Service typings", () => {
  describe("create<Service>", () => {
    test("type-hint model properties", () => {
      class BlogService extends MedusaService({ Blog }) {}
      const blogService = new BlogService(containerMock)

      expectTypeOf(blogService.createBlogs).parameters.toMatchTypeOf<
        [
          (
            | Partial<InferTypeOf<typeof Blog>>
            | Partial<InferTypeOf<typeof Blog>>[]
          ),
          ...args: any[]
        ]
      >()
      expectTypeOf(blogService.createBlogs).returns.toMatchTypeOf<
        Promise<InferTypeOf<typeof Blog>> | Promise<InferTypeOf<typeof Blog>[]>
      >()
    })

    test("type-hint DTO properties", () => {
      class BlogService extends MedusaService<{ Blog: { dto: BlogDTO } }>({
        Blog,
      }) {}
      const blogService = new BlogService(containerMock)

      expectTypeOf(blogService.createBlogs).parameters.toMatchTypeOf<
        [Partial<BlogDTO> | Partial<BlogDTO>[], ...args: any[]]
      >()
      expectTypeOf(blogService.createBlogs).returns.toMatchTypeOf<
        Promise<BlogDTO> | Promise<BlogDTO[]>
      >()
    })

    test("type-hint force overridden properties", () => {
      class BlogService extends MedusaService<{ Blog: { dto: BlogDTO } }>({
        Blog,
      }) {
        // @ts-expect-error
        async createBlogs(_: CreateBlogDTO): Promise<BlogDTO> {
          return {} as BlogDTO
        }
      }
      const blogService = new BlogService(containerMock)

      expectTypeOf(blogService.createBlogs).parameters.toMatchTypeOf<
        [CreateBlogDTO]
      >()
      expectTypeOf(blogService.createBlogs).returns.toMatchTypeOf<
        Promise<BlogDTO>
      >()
    })
  })

  describe("update<Service>", () => {
    test("type-hint model properties", () => {
      class BlogService extends MedusaService({ Blog }) {}
      const blogService = new BlogService(containerMock)

      expectTypeOf(blogService.updateBlogs).parameters.toMatchTypeOf<
        [
          (
            | {
                selector: Record<string, any>
                data:
                  | Partial<InferTypeOf<typeof Blog>>
                  | Partial<InferTypeOf<typeof Blog>>[]
              }
            | {
                selector: Record<string, any>
                data:
                  | Partial<InferTypeOf<typeof Blog>>
                  | Partial<InferTypeOf<typeof Blog>>[]
              }[]
            | Partial<InferTypeOf<typeof Blog>>
            | Partial<InferTypeOf<typeof Blog>>[]
          ),
          ...args: any[]
        ]
      >()
      expectTypeOf(blogService.updateBlogs).returns.toMatchTypeOf<
        Promise<InferTypeOf<typeof Blog>> | Promise<InferTypeOf<typeof Blog>[]>
      >()
    })

    test("type-hint DTO properties", () => {
      class BlogService extends MedusaService<{ Blog: { dto: BlogDTO } }>({
        Blog,
      }) {}
      const blogService = new BlogService(containerMock)

      expectTypeOf(blogService.createBlogs).parameters.toMatchTypeOf<
        [
          (
            | {
                selector: Record<string, any>
                data: Partial<BlogDTO> | Partial<BlogDTO>[]
              }
            | {
                selector: Record<string, any>
                data: Partial<BlogDTO> | Partial<BlogDTO>[]
              }[]
            | Partial<BlogDTO>
            | Partial<BlogDTO>[]
          ),
          ...args: any[]
        ]
      >()
      expectTypeOf(blogService.updateBlogs).returns.toMatchTypeOf<
        Promise<BlogDTO> | Promise<BlogDTO[]>
      >()
    })

    test("type-hint force overridden properties", () => {
      class BlogService extends MedusaService<{ Blog: { dto: BlogDTO } }>({
        Blog,
      }) {
        // @ts-expect-error
        async updateBlogs(_: string, __: CreateBlogDTO): Promise<BlogDTO> {
          return {} as BlogDTO
        }
      }
      const blogService = new BlogService(containerMock)

      expectTypeOf(blogService.updateBlogs).parameters.toMatchTypeOf<
        [id: string, data: CreateBlogDTO]
      >()
      expectTypeOf(blogService.updateBlogs).returns.toMatchTypeOf<
        Promise<BlogDTO>
      >()
    })
  })
})
