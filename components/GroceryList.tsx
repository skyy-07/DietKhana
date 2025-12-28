import React, { useMemo } from 'react';
import { ShoppingItem, IngredientCategory } from '../types';
import { ShoppingCart, CheckCircle2, Circle, Trash2 } from 'lucide-react';

interface GroceryListProps {
  items: ShoppingItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onClearChecked: () => void;
}

interface CategorySectionProps {
  title: string;
  catItems: ShoppingItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ title, catItems, onToggle, onRemove }) => {
  if (catItems.length === 0) return null;
  return (
    <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">{title}</h3>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {catItems.map((item) => (
          <div 
            key={item.id} 
            className={`flex items-center gap-3 p-3.5 border-b border-slate-50 last:border-0 transition-all ${item.checked ? 'bg-slate-50/50' : 'hover:bg-blue-50/30'}`}
          >
            <button 
              onClick={() => onToggle(item.id)}
              className={`flex-shrink-0 transition-colors ${item.checked ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-500'}`}
            >
              {item.checked ? <CheckCircle2 size={22} className="fill-current" /> : <Circle size={22} />}
            </button>
            
            <div className="flex-1" onClick={() => onToggle(item.id)}>
              <span className={`font-medium text-sm block transition-all ${item.checked ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800'}`}>
                {item.name}
              </span>
            </div>
            
            <button 
              onClick={() => onRemove(item.id)}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const GroceryList: React.FC<GroceryListProps> = ({ items, onToggle, onRemove, onClearChecked }) => {
  
  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {
      produce: [],
      dairy: [],
      meat: [],
      pantry: [],
      beverage: [],
      other: []
    };
    
    // Sort: Unchecked first, then alphabetically
    const sorted = [...items].sort((a, b) => {
       if (a.checked === b.checked) return a.name.localeCompare(b.name);
       return a.checked ? 1 : -1;
    });

    sorted.forEach(item => {
      const cat = item.category || 'other';
      if (groups[cat]) {
        groups[cat].push(item);
      } else {
        groups['other'].push(item);
      }
    });

    return groups;
  }, [items]);

  const categoriesOrder: IngredientCategory[] = ['produce', 'dairy', 'meat', 'pantry', 'beverage', 'other'];
  const hasCheckedItems = items.some(i => i.checked);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center text-slate-400 px-8">
        <div className="bg-slate-100 p-6 rounded-full mb-4">
           <ShoppingCart size={40} className="text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 mb-1">List is Empty</h3>
        <p className="text-sm max-w-[200px]">Generate a meal plan to automatically add missing ingredients.</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
           <h2 className="text-xl font-bold text-slate-900">Shopping List</h2>
           <p className="text-xs text-slate-400 font-medium">{items.filter(i => !i.checked).length} items remaining</p>
        </div>
        {hasCheckedItems && (
           <button 
             onClick={onClearChecked}
             className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
           >
             Clear Checked
           </button>
        )}
      </div>

      <div className="space-y-1">
        {categoriesOrder.map(cat => (
          <CategorySection 
            key={cat} 
            title={cat} 
            catItems={groupedItems[cat]} 
            onToggle={onToggle}
            onRemove={onRemove}
          />
        ))}
      </div>
      
      {/* Bottom quick add placeholder (visual only for now) */}
      <div className="mt-8 pt-8 border-t border-slate-100 text-center">
         <p className="text-xs text-slate-400">
            Tip: Recipes automatically add missing items here.
         </p>
      </div>
    </div>
  );
};

export default GroceryList;