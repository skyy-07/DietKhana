import React, { useState } from 'react';
import { Ingredient } from '../types';
import { Trash2, AlertCircle, Plus, ChevronDown, Check, X, Clock } from 'lucide-react';
import Button from './Button';

interface InventoryListProps {
  items: Ingredient[];
  onRemove: (id: string) => void;
  onAdd: () => void;
  onManualAdd: (ingredient: Omit<Ingredient, 'id'>) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ items, onRemove, onAdd, onManualAdd }) => {
  const [showManualForm, setShowManualForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Ingredient['category']>('produce');
  const [expiryDays, setExpiryDays] = useState<string>('5');

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'produce': return 'bg-green-100 text-green-700 border-green-200';
      case 'dairy': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'meat': return 'bg-red-100 text-red-700 border-red-200';
      case 'pantry': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'beverage': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getExpiryVisuals = (days?: number) => {
    if (days === undefined) return { color: 'bg-slate-200', text: '', bgClass: 'bg-white', label: '' };
    if (days <= 2) return { color: 'bg-red-500', text: 'text-red-600', bgClass: 'bg-red-50/50 border-red-100', label: 'Expires soon' };
    if (days <= 5) return { color: 'bg-amber-500', text: 'text-amber-600', bgClass: 'bg-amber-50/30 border-amber-100', label: 'Use shortly' };
    return { color: 'bg-emerald-500', text: 'text-emerald-600', bgClass: 'bg-white border-slate-100', label: 'Fresh' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onManualAdd({
      name: name.trim(),
      category,
      expiryEstimateDays: parseInt(expiryDays) || 7,
      confidence: 1.0
    });
    setName('');
    setExpiryDays('5');
    setShowManualForm(false);
  };

  return (
    <div className="pb-20 space-y-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl font-bold text-slate-900">My Fridge</h2>
        <span className="text-sm font-medium text-slate-500">{items.length} Items</span>
      </div>

      {showManualForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Quick Add</h3>
            <button type="button" onClick={() => setShowManualForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Item Name</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Avocado"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Category</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none capitalize"
                  >
                    <option value="produce">Produce</option>
                    <option value="dairy">Dairy</option>
                    <option value="meat">Meat</option>
                    <option value="pantry">Pantry</option>
                    <option value="beverage">Beverage</option>
                    <option value="other">Other</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              
              <div className="w-28">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Expires In</label>
                <div className="relative">
                   <input
                    type="number"
                    min="1"
                    max="365"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                   />
                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">days</span>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 text-white mt-2">
              <Check size={18} /> Save to Fridge
            </Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3">
        {items.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-400">Your fridge is empty!</p>
            <button onClick={onAdd} className="mt-2 text-blue-600 font-medium text-sm">Scan items to add</button>
          </div>
        ) : (
          items.map((item) => {
            const expiry = getExpiryVisuals(item.expiryEstimateDays);
            const freshnessPercent = item.expiryEstimateDays !== undefined ? Math.min(100, (item.expiryEstimateDays / 10) * 100) : 0;
            
            return (
              <div 
                key={item.id} 
                className={`p-3 rounded-2xl border shadow-sm flex flex-col group animate-in fade-in slide-in-from-left-2 transition-all duration-300 ${expiry.bgClass}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-lg capitalize border shadow-sm ${getCategoryColor(item.category)}`}>
                      {item.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 capitalize leading-tight">{item.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        <span className="opacity-70">{item.category}</span>
                        {item.expiryEstimateDays !== undefined && (
                          <span className={`flex items-center gap-1 ${expiry.text}`}>
                            <Clock size={10} /> {item.expiryEstimateDays}d left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemove(item.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {item.expiryEstimateDays !== undefined && (
                  <div className="w-full space-y-1.5">
                    <div className="flex justify-between items-center px-0.5">
                      <span className={`text-[9px] font-black uppercase tracking-tighter ${expiry.text}`}>
                        {expiry.label}
                      </span>
                      {item.expiryEstimateDays <= 2 && <AlertCircle size={12} className="text-red-500 animate-pulse" />}
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${expiry.color}`} 
                        style={{ width: `${freshnessPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onAdd}
          className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-500 hover:text-blue-500 font-bold transition-all bg-white"
        >
          <Plus size={18} /> Scan
        </button>
        <button 
          onClick={() => setShowManualForm(true)}
          className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-emerald-500 hover:text-emerald-500 font-bold transition-all bg-white"
        >
          <Plus size={18} /> Manual
        </button>
      </div>
    </div>
  );
};

export default InventoryList;