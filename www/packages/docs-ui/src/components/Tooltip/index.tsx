"use client"

import React, { forwardRef, useId } from "react"
import { Tooltip as ReactTooltip } from "react-tooltip"
import type { ITooltip } from "react-tooltip"
import clsx from "clsx"
import "react-tooltip/dist/react-tooltip.css"

export type TooltipProps = {
  text?: string
  tooltipClassName?: string
  html?: string
  tooltipChildren?: React.ReactNode
  innerClassName?: string
} & React.HTMLAttributes<HTMLSpanElement> &
  ITooltip

export const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(
  function Tooltip(
    {
      text = "",
      tooltipClassName = "",
      children,
      html = "",
      tooltipChildren,
      className,
      innerClassName,
      ...tooltipProps
    },
    ref
  ) {
    const elementId = useId()

    return (
      <span className={clsx(className, "notranslate")} translate="no" ref={ref}>
        <span
          id={elementId}
          data-tooltip-content={text}
          data-tooltip-html={html}
          data-tooltip-id={elementId}
          className={innerClassName}
        >
          {children}
        </span>
        <ReactTooltip
          anchorId={elementId}
          // anchorSelect={elementId ? `#${elementId}` : undefined}
          className={clsx(
            "!text-compact-x-small !shadow-elevation-tooltip dark:!shadow-elevation-tooltip-dark !rounded-docs_DEFAULT",
            "!py-docs_0.25 !z-[399] hidden !px-docs_0.5 lg:block",
            "!bg-medusa-bg-component",
            "!text-medusa-fg-base text-center",
            tooltipClassName
          )}
          wrapper="span"
          noArrow={true}
          positionStrategy={"fixed"}
          opacity={1}
          {...tooltipProps}
        >
          {tooltipChildren}
        </ReactTooltip>
      </span>
    )
  }
)
