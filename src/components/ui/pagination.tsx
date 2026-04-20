import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      "inline-flex items-center justify-center rounded-lg text-sm font-medium",
      "transition-all duration-200 ease-in-out",
      "h-9 min-w-[36px] px-3",
      isActive 
        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="上一页"
    size="default"
    className={cn("gap-1 pl-2.5 pr-3", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>上一页</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="下一页"
    size="default"
    className={cn("gap-1 pr-2.5 pl-3", className)}
    {...props}
  >
    <span>下一页</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center text-slate-400", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">更多页码</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

// 页码信息组件
const PaginationInfo = ({ 
  total, 
  page, 
  pageSize,
  className 
}: { 
  total: number
  page: number
  pageSize: number
  className?: string 
}) => {
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  
  return (
    <div className={cn(
      "flex items-center justify-between text-sm text-slate-500 dark:text-slate-400",
      className
    )}>
      <span>
        显示第 <span className="font-medium text-slate-700 dark:text-slate-300">{start}-{end}</span> 条，
        共 <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span> 条记录
      </span>
      <span>
        第 <span className="font-medium text-slate-700 dark:text-slate-300">{page}</span> / 
        <span className="font-medium text-slate-700 dark:text-slate-300">{totalPages}</span> 页
      </span>
    </div>
  )
}
PaginationInfo.displayName = "PaginationInfo"

// 每页数量选择器
const PaginationPageSize = ({
  value,
  options = [10, 20, 50, 100],
  onChange,
  className
}: {
  value: number
  options?: number[]
  onChange: (size: number) => void
  className?: string
}) => (
  <div className={cn("flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400", className)}>
    <span>每页显示</span>
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      {options.map((size) => (
        <option key={size} value={size}>{size}</option>
      ))}
    </select>
    <span>条</span>
  </div>
)
PaginationPageSize.displayName = "PaginationPageSize"

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  PaginationInfo,
  PaginationPageSize,
}
