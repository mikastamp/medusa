import { Providers } from "./providers"
import { RouterProvider } from "./providers/router-provider"

export class Application {
  render() {
    return (
      <Providers>
        <RouterProvider />
      </Providers>
    )
  }
}
