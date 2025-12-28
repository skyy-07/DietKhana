
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { X, Check, Activity, Leaf, Clock, Utensils, User, Target } from 'lucide-react';
import Button from './Button';

interface ProfileSettingsProps {
  user: UserProfile;
  onSave: (updatedUser: UserProfile) => void;
  onClose: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState<UserProfile>({ ...user });

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRestrictionToggle = (restriction: string) => {
    const current = formData.dietaryRestrictions;
    if (current.includes(restriction)) {
      setFormData(prev => ({ ...prev, dietaryRestrictions: current.filter(r => r !== restriction) }));
    } else {
      setFormData(prev => ({ ...prev, dietaryRestrictions: [...current, restriction] }));
    }
  };

  const calculateTarget = () => {
    // Basic Mifflin-St Jeor + Activity + Goal
    let bmr = (10 * formData.weight) + (6.25 * formData.height) - (5 * formData.age);
    bmr = formData.gender === 'male' ? bmr + 5 : bmr - 161;

    const activityMultipliers: Record<string, number> = {
      'Sedentary': 1.2,
      'Lightly Active': 1.375,
      'Moderately Active': 1.55,
      'Very Active': 1.725
    };
    
    const goalModifiers: Record<string, number> = {
      'Lose Weight': -500,
      'Maintain': 0,
      'Build Muscle': 400,
      'Endurance': 200
    };

    const multiplier = activityMultipliers[formData.activityLevel] || 1.2;
    const modifier = goalModifiers[formData.primaryGoal] || 0;
    
    return Math.round((bmr * multiplier) + modifier);
  };

  const handleSave = () => {
    const finalUser = {
      ...formData,
      dailyCalorieTarget: calculateTarget()
    };
    onSave(finalUser);
    onClose();
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-3 mt-6 pb-2 border-b border-slate-100">
      <Icon size={18} className="text-blue-600" />
      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{title}</h3>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">Your Goals</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2 no-scrollbar">
          
          {/* Section: Goal & Activity */}
          <SectionHeader icon={Target} title="Fitness & Goals" />
          <div className="grid grid-cols-1 gap-4">
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Primary Goal</label>
               <div className="grid grid-cols-2 gap-2">
                 {['Lose Weight', 'Maintain', 'Build Muscle', 'Endurance'].map(opt => (
                   <button
                     key={opt}
                     onClick={() => handleChange('primaryGoal', opt)}
                     className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${formData.primaryGoal === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                   >
                     {opt}
                   </button>
                 ))}
               </div>
             </div>
             
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Activity Level</label>
               <select 
                 value={formData.activityLevel} 
                 onChange={(e) => handleChange('activityLevel', e.target.value)}
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
               >
                 <option value="Sedentary">Sedentary (Office job)</option>
                 <option value="Lightly Active">Lightly Active (1-3 days/wk)</option>
                 <option value="Moderately Active">Moderately Active (3-5 days/wk)</option>
                 <option value="Very Active">Very Active (6-7 days/wk)</option>
               </select>
             </div>
          </div>

          {/* Section: Diet */}
          <SectionHeader icon={Utensils} title="Diet & Nutrition" />
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Diet Type</label>
             <div className="flex flex-wrap gap-2 mb-4">
               {['Omnivore', 'Vegetarian', 'Vegan', 'Paleo', 'Keto'].map(opt => (
                 <button
                   key={opt}
                   onClick={() => handleChange('dietaryType', opt)}
                   className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${formData.dietaryType === opt ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
                 >
                   {opt}
                 </button>
               ))}
             </div>
             
             <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Restrictions</label>
             <div className="flex flex-wrap gap-2">
               {['Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Low Sugar', 'Low Sodium', 'Shellfish-Free'].map(opt => (
                 <button
                   key={opt}
                   onClick={() => handleRestrictionToggle(opt)}
                   className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${formData.dietaryRestrictions.includes(opt) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200'}`}
                 >
                   {opt}
                 </button>
               ))}
             </div>
          </div>

          {/* Section: Lifestyle */}
          <SectionHeader icon={Clock} title="Lifestyle & Sustainability" />
          <div className="space-y-4">
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Cooking Time Preference</label>
               <select 
                 value={formData.cookingTime} 
                 onChange={(e) => handleChange('cookingTime', e.target.value)}
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium"
               >
                 <option value="Quick (<15m)">Quick (&lt; 15 mins)</option>
                 <option value="Medium (30-45m)">Standard (30-45 mins)</option>
                 <option value="Elaborate (1h+)">Chef Mode (1 hr+)</option>
               </select>
             </div>
             
             <div 
               onClick={() => handleChange('sustainabilityFocus', !formData.sustainabilityFocus)}
               className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${formData.sustainabilityFocus ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}
             >
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full ${formData.sustainabilityFocus ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Leaf size={18} />
                   </div>
                   <div>
                      <div className="font-bold text-sm text-slate-800">Prioritize Sustainability</div>
                      <div className="text-xs text-slate-500">Reduce waste & use expiring items</div>
                   </div>
                </div>
                {formData.sustainabilityFocus && <Check size={18} className="text-emerald-600" />}
             </div>
          </div>

          {/* Section: Biometrics */}
          <SectionHeader icon={User} title="You" />
          <div className="grid grid-cols-3 gap-3">
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Age</label>
               <input type="number" value={formData.age} onChange={(e) => handleChange('age', parseInt(e.target.value))} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200" />
             </div>
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Height (cm)</label>
               <input type="number" value={formData.height} onChange={(e) => handleChange('height', parseInt(e.target.value))} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200" />
             </div>
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Weight (kg)</label>
               <input type="number" value={formData.weight} onChange={(e) => handleChange('weight', parseInt(e.target.value))} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200" />
             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white">
           <Button onClick={handleSave} className="w-full py-3">
             Save & Update Profile
           </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
