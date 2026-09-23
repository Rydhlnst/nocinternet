import { describe, expect, it } from "vitest"
import React from "react"
import FabsPage from "@/app/dashboard/fabs/page"

describe("FabsPage", () => {
  it("uses the shared dashboard content wrapper", () => {
    globalThis.React = React
    const page = FabsPage()

    expect(page.type).toBe("div")
    expect(page.props.className).toBe("content")
  })
})