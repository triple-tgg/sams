import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
    children: React.ReactNode
    content: React.ReactNode | string
    side?: "top" | "right" | "bottom" | "left"
}

const TooltipComponent = (props: Props) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {props.children}
                </TooltipTrigger>
                <TooltipContent side={props.side || "top"}>
                    {props.content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default TooltipComponent