import React, { useState } from 'react';
import { NormalizedGroup } from '../types';
import { ArrowRight, Merge, Edit2, Check, ArrowLeft } from 'lucide-react';

interface Props {
  groups: NormalizedGroup[];
  onUpdateGroups: (groups: NormalizedGroup[]) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const NormalizationReview: React.FC<Props> = ({ groups, onUpdateGroups, onConfirm, onBack }) => {
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  const toggleSelection = (id: string) => {
    const next = new Set(selectedGroupIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedGroupIds(next);
  };

  const handleMerge = () => {
    if (selectedGroupIds.size < 2) return;
    
    const ids = Array.from(selectedGroupIds);
    const targetGroup = groups.find(g => g.id === ids[0])!;
    const otherGroups = groups.filter(g => ids.includes(g.id) && g.id !== targetGroup.id);
    
    // Merge items
    const mergedItems = targetGroup.items.concat(otherGroups.flatMap(g => g.items));
    
    const newGroup = { ...targetGroup, items: mergedItems };
    const remainingGroups = groups.filter(g => !ids.includes(g.id));
    
    onUpdateGroups([...remainingGroups, newGroup].sort((a,b) => a.name.localeCompare(b.name)));
    setSelectedGroupIds(new Set());
  };

  const handleStartEdit = (group: NormalizedGroup) => {
    setEditingId(group.id);
    setTempName(group.name);
  };

  const handleSaveEdit = (id: string) => {
    if (!tempName.trim()) return;
    const updated = groups.map(g => g.id === id ? { ...g, name: tempName.trim() } : g);
    onUpdateGroups(updated);
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id);
    }
  };

  const handleUngroupItem = (groupId: string, itemIndex: number) => {
      const group = groups.find(g => g.id === groupId)!;
      const itemToMove = group.items[itemIndex];
      
      const newGroup: NormalizedGroup = {
          id: `new-${Date.now()}`,
          name: itemToMove.rawName,
          items: [itemToMove]
      };

      const updatedGroup = {
          ...group,
          items: group.items.filter((_, i) => i !== itemIndex)
      };

      if (updatedGroup.items.length === 0) {
          onUpdateGroups([...groups.filter(g => g.id !== groupId), newGroup]);
      } else {
          onUpdateGroups([...groups.map(g => g.id === groupId ? updatedGroup : g), newGroup]);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm sticky top-0 z-10 gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition"
            title="Назад"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold">Проверка категорий</h2>
            <p className="text-sm text-gray-500">Объедините дубликаты или разделите категории.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedGroupIds.size >= 2 && (
            <button 
              onClick={handleMerge}
              className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-200 transition"
            >
              <Merge size={18} /> Объединить ({selectedGroupIds.size})
            </button>
          )}
          <button 
            onClick={() => {
                if (editingId) handleSaveEdit(editingId);
                onConfirm();
            }}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Подтвердить <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(group => (
          <div 
            key={group.id} 
            className={`border-2 rounded-xl p-4 transition cursor-pointer relative ${selectedGroupIds.has(group.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 bg-white'}`}
            onClick={() => toggleSelection(group.id)}
          >
            <div className="flex justify-between items-start mb-2" onClick={e => e.stopPropagation()}>
              {editingId === group.id ? (
                <div className="flex items-center gap-2 w-full">
                  <input 
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    onBlur={() => handleSaveEdit(group.id)}
                    onKeyDown={(e) => handleKeyDown(e, group.id)}
                    className="border rounded p-1 text-sm w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                  <button onClick={() => handleSaveEdit(group.id)} className="text-green-600 hover:text-green-700">
                    <Check size={16}/>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full">
                    <h3 className="font-semibold text-gray-800 break-words">{group.name}</h3>
                    <button onClick={() => handleStartEdit(group)} className="text-gray-400 hover:text-gray-600 p-1">
                        <Edit2 size={12} />
                    </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              {group.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs bg-gray-100 p-1.5 rounded text-gray-600 group">
                  <span className="truncate max-w-[180px]">{item.rawName} ({item.percentage}%) <span className="text-gray-400">[{item.bankId}]</span></span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleUngroupItem(group.id, idx); }}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Выделить в отдельную группу"
                  >
                    <Merge size={12} className="rotate-180"/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
