import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 scrollbar-thin bg-white dark:bg-slate-900">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead 
    ref={ref} 
    className={cn(
      "sticky top-0 z-10 [&_tr]:border-b-0",
      "bg-gradient-to-b from-slate-100 to-slate-50",
      "dark:from-slate-800 dark:to-slate-800/95",
      className
    )} 
    {...props} 
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t-2 border-slate-300 dark:border-slate-600",
      "bg-gradient-to-b from-slate-100 to-slate-50",
      "dark:from-slate-800 dark:to-slate-900",
      "font-semibold text-slate-700 dark:text-slate-200",
      "[&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-slate-200/80 dark:border-slate-700/50",
      "transition-colors duration-150 ease-in-out",
      "hover:bg-primary/5",
      "data-[state=selected]:bg-primary/10",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    align?: 'left' | 'center' | 'right'
  }
>(({ className, align = 'left', ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 align-middle",
      "text-xs font-semibold tracking-wide",
      "text-slate-700 dark:text-slate-300",
      "border-b-2 border-slate-200 dark:border-slate-700",
      "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      "whitespace-nowrap select-none",
      align === 'left' && "text-left",
      align === 'center' && "text-center",
      align === 'right' && "text-right",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    align?: 'left' | 'center' | 'right'
    truncate?: boolean
  }
>(({ className, align = 'left', truncate = false, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-4 py-3.5 align-middle text-sm",
      "text-slate-700 dark:text-slate-300",
      "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      align === 'left' && "text-left",
      align === 'center' && "text-center",
      align === 'right' && "text-right",
      truncate && "max-w-0 truncate",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-slate-500 dark:text-slate-400", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// 可排序的表头组件
const SortableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    sortable?: boolean
    sorted?: 'asc' | 'desc' | false
    onSort?: () => void
    align?: 'left' | 'center' | 'right'
  }
>(({ className, sortable, sorted, onSort, align = 'left', children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 align-middle",
      "text-xs font-semibold tracking-wide",
      "text-slate-700 dark:text-slate-300",
      "border-b-2 border-slate-200 dark:border-slate-700",
      sortable && "cursor-pointer select-none hover:text-primary transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50",
      sorted && "text-primary",
      align === 'left' && "text-left",
      align === 'center' && "text-center",
      align === 'right' && "text-right",
      className
    )}
    onClick={sortable ? onSort : undefined}
    {...props}
  >
    <div className="flex items-center gap-1.5">
      {children}
      {sortable && (
        <span className="inline-flex flex-col text-[10px] leading-none opacity-40">
          <span className={cn(
            "transition-colors",
            sorted === 'asc' ? 'opacity-100 text-primary' : ''
          )}>▲</span>
          <span className={cn(
            "transition-colors",
            sorted === 'desc' ? 'opacity-100 text-primary' : ''
          )}>▼</span>
        </span>
      )}
    </div>
  </th>
))
SortableHead.displayName = "SortableHead"

// 空状态组件
const TableEmpty = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { colSpan: number; message?: string }
>(({ colSpan, message = '暂无数据', className, ...props }, ref) => (
  <tr ref={ref} className={cn("bg-slate-50/50 dark:bg-slate-800/30", className)} {...props}>
    <td 
      colSpan={colSpan} 
      className="h-40 text-center"
    >
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-slate-500 dark:text-slate-400 text-sm">{message}</span>
      </div>
    </td>
  </tr>
))
TableEmpty.displayName = "TableEmpty"

// 加载骨架屏行
const TableSkeletonRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { columns: number }
>(({ columns, className, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b border-slate-200/50 dark:border-slate-700/30", className)} {...props}>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3.5">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
      </td>
    ))}
  </tr>
))
TableSkeletonRow.displayName = "TableSkeletonRow"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  SortableHead,
  TableEmpty,
  TableSkeletonRow,
}
