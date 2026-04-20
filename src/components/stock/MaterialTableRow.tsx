/**
 * 原材料表格行组件
 * 使用 React.memo 优化性能
 */
import React, { memo } from 'react';
import type { RawMaterial } from '@/types';
import { TableCell } from '@/components/ui/table';
import { STOCK_STATUS, STOCK_THRESHOLDS } from '@/constants';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface MaterialTableRowProps {
  item: RawMaterial;
  onEdit: (item: RawMaterial) => void;
  onDelete: (id: string) => void;
}

export const MaterialTableRow = memo(({ item, onEdit, onDelete }: MaterialTableRowProps) => {
  /**
   * 获取库存状态
   */
  const getStockStatus = () => {
    const stockWeight = item.stock_weight || 0;

    if (stockWeight <= STOCK_THRESHOLDS.OUT_OF_STOCK) {
      return STOCK_STATUS.OUT_OF_STOCK;
    } else if (stockWeight <= STOCK_THRESHOLDS.LOW_STOCK) {
      return STOCK_STATUS.LOW_STOCK;
    } else {
      return STOCK_STATUS.IN_STOCK;
    }
  };

  /**
   * 获取状态样式
   */
  const getStatusClass = () => {
    const status = getStockStatus();

    switch (status) {
      case STOCK_STATUS.OUT_OF_STOCK:
        return 'text-red-500 bg-red-50';
      case STOCK_STATUS.LOW_STOCK:
        return 'text-orange-500 bg-orange-50';
      default:
        return 'text-green-500 bg-green-50';
    }
  };

  /**
   * 获取状态标签
   */
  const getStatusLabel = () => {
    const status = getStockStatus();

    switch (status) {
      case STOCK_STATUS.OUT_OF_STOCK:
        return '缺货';
      case STOCK_STATUS.LOW_STOCK:
        return '低库存';
      default:
        return '充足';
    }
  };

  return (
    <tr className="hover:bg-muted/50 transition-colors">
      <TableCell>{item.batch_no}</TableCell>
      <TableCell>{item.model}</TableCell>
      <TableCell>{item.material}</TableCell>
      <TableCell>{item.gram_weight} g/㎡</TableCell>
      <TableCell>{item.length} m</TableCell>
      <TableCell>{item.in_weight} kg</TableCell>
      <TableCell>{item.out_weight} kg</TableCell>
      <TableCell className={getStatusClass()}>
        <span className="inline-block px-2 py-1 rounded-md text-xs font-medium">
          {item.stock_weight} kg
        </span>
      </TableCell>
      <TableCell>
        <span
          className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getStatusClass()}`}
        >
          {getStatusLabel()}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </tr>
  );
});

MaterialTableRow.displayName = 'MaterialTableRow';
