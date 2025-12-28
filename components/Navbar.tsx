import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Refrigerator, ShoppingCart, ScanLine, UtensilsCrossed } from 'lucide-react';

interface NavbarProps {
  currentView: ViewState;
  onChange: (view: ViewState) => void;
  onScan: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onChange, onScan }) => {
  const navItem = (view: ViewState, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => onChange(view)}
      className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors ${
        currentView === view ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-20 px-2 pb-4 pt-1 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] flex justify-between items-center z-40 max-w-md mx-auto w-full">
      {navItem('dashboard', <LayoutDashboard size={22} />, 'Home')}
      {navItem('inventory', <Refrigerator size={22} />, 'Fridge')}
      
      {/* Scan Button - Floating */}
      <div className="relative -top-5">
        <button 
          onClick={onScan}
          className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-300 flex items-center justify-center transform transition-transform active:scale-95"
        >
          <ScanLine size={24} />
        </button>
      </div>

      {navItem('recipes', <UtensilsCrossed size={22} />, 'Recipes')}
      {navItem('grocery', <ShoppingCart size={22} />, 'Shop')}
    </div>
  );
};

export default Navbar;