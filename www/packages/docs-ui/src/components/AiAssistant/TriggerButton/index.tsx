"use client"

import React, { useMemo, useState } from "react"
import { Button } from "../../Button"
import { Tooltip } from "../../Tooltip"
import { Kbd } from "../../Kbd"
import { getOsShortcut } from "../../../utils"
import { useAiAssistant, useSearch, useSiteConfig } from "../../../providers"
import { useKeyboardShortcut } from "../../../hooks"
import Image from "next/image"

const AI_ASSISTANT_ICON = "/images/ai-assistent-luminosity.png"
const AI_ASSISTANT_ICON_ACTIVE = "/images/ai-assistent.png"

export const AiAssistantTriggerButton = () => {
  const [hovered, setHovered] = useState(false)
  const { config } = useSiteConfig()
  const { chatOpened, setChatOpened } = useAiAssistant()
  const { setIsOpen } = useSearch()
  const isActive = useMemo(() => {
    return hovered || chatOpened
  }, [hovered, chatOpened])
  const osShortcut = getOsShortcut()

  useKeyboardShortcut({
    metakey: true,
    shortcutKeys: ["i"],
    action: () => {
      setChatOpened((prev) => !prev)
      setIsOpen(false)
    },
    checkEditing: false,
  })

  return (
    <Tooltip
      render={() => (
        <span className="flex gap-[6px] items-center">
          <span className="text-compact-x-small-plus text-medusa-fg-base">
            Ask AI
          </span>
          <span className="flex gap-[5px] items-center">
            <Kbd className="bg-medusa-bg-field-component border-medusa-border-strong w-[18px] h-[18px] inline-block">
              {osShortcut}
            </Kbd>
            <Kbd className="bg-medusa-bg-field-component border-medusa-border-strong w-[18px] h-[18px] inline-block">
              i
            </Kbd>
          </span>
        </span>
      )}
    >
      <Button
        variant="transparent-clear"
        className="!p-[6.5px]"
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
        onTouchStart={() => setHovered(true)}
        onTouchEnd={() => setHovered(false)}
        onClick={() => setChatOpened((prev) => !prev)}
      >
        <Image
          src={`${config.basePath}${isActive ? AI_ASSISTANT_ICON_ACTIVE : AI_ASSISTANT_ICON}`}
          width={15}
          height={15}
          alt="AI Assistant"
        />
      </Button>
    </Tooltip>
  )
}
