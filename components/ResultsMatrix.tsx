import React from 'react';
import { BankConfig, BankId, NormalizedGroup, SolverState } from '../types';
import { Check, Download, AlertCircle } from 'lucide-react';
import { generatePDF } from '../services/pdfService';

interface Props {
  groups: NormalizedGroup[];
  banks: Record<BankId, BankConfig>;
  solverState: SolverState;
  setSolverState: React.Dispatch<React.SetStateAction<SolverState>>;
}

export const ResultsMatrix: React.FC<Props> = ({ groups, banks, solverState, setSolverState }) => {
  
  // Transform data for rendering
  const matrixRows = groups.map(group => {
    const bankSelections: any = {};
    Object.keys(banks).forEach(key => {
        const bid = key as BankId;
        const item = group.items.find(i => i.bankId === bid);
        const isSelected = solverState.selections[bid]?.includes(group.id);
        
        if (item) {
            bankSelections[bid] = {
                selected: isSelected,
                percentage: item.percentage,
                isRecommended: isSelected // In this simplified view, selected === recommended
            };
        }
    });

    return {
        categoryId: group.id,
        categoryName: group.name,
        bankSelections
    };
  });

  // Toggle Logic
  const toggleCell = (groupId: string, bankId: BankId) => {
      const currentList = solverState.selections[bankId] || [];
      const limit = banks[bankId].limit;
      const isSelected = currentList.includes(groupId);

      let newList;
      if (isSelected) {
          newList = currentList.filter(id => id !== groupId);
      } else {
          if (currentList.length >= limit) {
              alert(`Лимит для банка ${banks[bankId].name} достигнут (${limit})`);
              return;
          }
          newList = [...currentList, groupId];
      }

      setSolverState(prev => ({
          ...prev,
          selections: { ...prev.selections, [bankId]: newList }
      }));
  };

  const activeBanks = Object.values(banks).filter(b => b.isActive);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold">Ваша Стратегия</h2>
          <p className="text-gray-500 text-sm">Зеленые ячейки — рекомендованный выбор. Нажмите, чтобы изменить.</p>
        </div>
        <button 
          onClick={() => generatePDF(matrixRows, banks)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          <Download size={18} /> Скачать PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {activeBanks.map(bank => {
              const count = solverState.selections[bank.id]?.length || 0;
              return (
                  <div key={bank.id} className={`p-3 rounded-lg border-l-4 bg-white shadow-sm ${bank.color.replace('bg-', 'border-')}`}>
                      <div className="font-bold text-gray-700">{bank.name}</div>
                      <div className={`text-sm ${count === bank.limit ? 'text-green-600 font-medium' : 'text-orange-500'}`}>
                          {count} / {bank.limit} выбрано
                      </div>
                  </div>
              );
          })}
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-bold sticky left-0 bg-gray-50 z-10 shadow-sm">Категория</th>
              {activeBanks.map(bank => (
                <th key={bank.id} className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded text-white ${bank.color}`}>
                    {bank.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixRows.map((row) => (
              <tr key={row.categoryId} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-white">
                  {row.categoryName}
                </td>
                {activeBanks.map(bank => {
                  const cell = row.bankSelections[bank.id];
                  if (!cell) {
                      return <td key={bank.id} className="px-6 py-4 text-center text-gray-300">-</td>;
                  }
                  
                  return (
                    <td key={bank.id} className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleCell(row.categoryId, bank.id)}
                        className={`
                          relative w-16 py-2 rounded-lg font-bold transition-all
                          ${cell.selected 
                            ? 'bg-green-100 text-green-700 border-2 border-green-500 shadow-sm' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                      >
                        {cell.percentage}%
                        {cell.selected && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-0.5">
                                <Check size={10} />
                            </div>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {matrixRows.length === 0 && (
          <div className="text-center p-12 text-gray-400">
              <AlertCircle className="mx-auto mb-2" />
              Категории не найдены.
          </div>
      )}
    </div>
  );
};
