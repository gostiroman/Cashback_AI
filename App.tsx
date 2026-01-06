import React, { useState } from 'react';
import { 
  BankConfig, BankId, NormalizedGroup, AppStage, RawCategory, SolverState 
} from './types';
import { DEFAULT_BANKS } from './constants';
import { analyzeImages } from './services/geminiService';
import { normalizeCategories } from './services/normalizationService';
import { solveCashbackMatrix } from './services/solverService';

// UI
import { UploadZone } from './components/UploadZone';
import { NormalizationReview } from './components/NormalizationReview';
import { ResultsMatrix } from './components/ResultsMatrix';
import { BrainCircuit, ChevronRight, Loader2, Settings2, ArrowLeft } from 'lucide-react';

const App = () => {
  const [banks, setBanks] = useState<Record<BankId, BankConfig>>(DEFAULT_BANKS);
  // Changed: Store all files in a single array
  const [files, setFiles] = useState<File[]>([]);
  
  const [stage, setStage] = useState<AppStage>('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [normalizedGroups, setNormalizedGroups] = useState<NormalizedGroup[]>([]);
  const [priorities, setPriorities] = useState<Set<string>>(new Set());
  
  // Solution
  const [solverState, setSolverState] = useState<SolverState>({
      selections: { sber: [], vtb: [], tbank: [], alfa: [], yandex: [] }
  });

  const toggleBank = (id: BankId) => {
    setBanks(prev => ({ ...prev, [id]: { ...prev[id], isActive: !prev[id].isActive } }));
  };

  const updateBankLimit = (id: BankId, newLimit: number) => {
      setBanks(prev => ({ ...prev, [id]: { ...prev[id], limit: newLimit } }));
  };

  const handleDrop = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      if (files.length === 0) {
          throw new Error("Пожалуйста, загрузите хотя бы один скриншот.");
      }

      // Send all files to AI. It will detect banks automatically.
      const results = await analyzeImages(files);

      if (results.length === 0) {
          throw new Error("Категории не найдены. Убедитесь, что скриншоты четкие.");
      }

      const initialGroups = normalizeCategories(results);
      setNormalizedGroups(initialGroups);
      setStage('normalization');

    } catch (err: any) {
      setError(err.message || "Ошибка анализа");
    } finally {
      setLoading(false);
    }
  };

  const calculateMatrix = () => {
      const result = solveCashbackMatrix(
          normalizedGroups, 
          banks, 
          Array.from(priorities)
      );
      setSolverState(result);
      setStage('matrix');
  };

  // Navigation Logic
  const goBack = () => {
    switch (stage) {
      case 'normalization':
        setStage('setup');
        break;
      case 'priorities':
        setStage('normalization');
        break;
      case 'matrix':
        setStage('priorities');
        break;
      default:
        break;
    }
  };

  // Render Helpers
  const renderStepIndicator = () => {
      const steps: AppStage[] = ['setup', 'normalization', 'priorities', 'matrix'];
      const currentIdx = steps.indexOf(stage === 'analysis' ? 'setup' : stage);
      
      return (
          <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-2">
                  {steps.map((s, idx) => (
                      <React.Fragment key={s}>
                          <div className={`h-2 w-8 rounded-full transition-colors ${idx <= currentIdx ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                      </React.Fragment>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight">Cashback AI</h1>
            <p className="text-xs text-gray-500">Умный выбор категорий</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {renderStepIndicator()}

        {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
                Ошибка: {error}
            </div>
        )}

        {/* STAGE 1: SETUP */}
        {stage === 'setup' && (
          <div className="space-y-8 animate-fade-in">
             <div className="text-center space-y-2">
                 <h2 className="text-2xl font-bold">Загрузка и Настройка</h2>
                 <p className="text-gray-500">Загрузите скриншоты (все сразу) и проверьте настройки банков.</p>
             </div>

             {/* Global Upload */}
             <div className="w-full max-w-2xl mx-auto">
                <UploadZone 
                    files={files} 
                    onDrop={handleDrop}
                    onRemove={removeFile}
                    disabled={false}
                />
             </div>

             {/* Bank Settings */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex items-center gap-2 mb-4">
                     <Settings2 className="text-gray-400" size={20}/>
                     <h3 className="text-lg font-bold text-gray-800">Настройки банков</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(Object.values(banks) as BankConfig[]).map(bank => (
                        <div 
                            key={bank.id} 
                            className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${bank.isActive ? 'border-gray-300 bg-gray-50' : 'border-gray-100 opacity-60'}`}
                        >
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={bank.isActive} 
                                    onChange={() => toggleBank(bank.id)}
                                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <span className="font-medium text-gray-700 block">{bank.name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full text-white ${bank.color} opacity-80`}>
                                        {bank.isActive ? 'Активен' : 'Выкл'}
                                    </span>
                                </div>
                            </div>
                            
                            {bank.isActive && (
                                <div className="flex flex-col items-end">
                                    <label className="text-xs text-gray-400 mb-1">Лимит</label>
                                    <input 
                                        type="number" 
                                        min={1} 
                                        max={10}
                                        value={bank.limit}
                                        onChange={(e) => updateBankLimit(bank.id, parseInt(e.target.value) || 0)}
                                        className="w-16 p-1 text-center border rounded text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                 </div>
             </div>

             <div className="flex justify-center pt-8">
                 <button 
                    onClick={startAnalysis}
                    disabled={loading || files.length === 0}
                    className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                 >
                    {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                    {loading ? "Анализирую..." : "Запустить анализ"}
                 </button>
             </div>
          </div>
        )}

        {/* STAGE 3: NORMALIZATION */}
        {stage === 'normalization' && (
          <div className="animate-fade-in">
            <NormalizationReview 
                groups={normalizedGroups}
                onUpdateGroups={setNormalizedGroups}
                onConfirm={() => setStage('priorities')}
                onBack={goBack}
            />
          </div>
        )}

        {/* STAGE 4: PRIORITIES */}
        {stage === 'priorities' && (
           <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Выберите приоритеты</h2>
                    <p className="text-gray-500">Отметьте категории, которые вам точно нужны в этом месяце.</p>
                </div>

                <div className="flex flex-wrap gap-3 justify-center">
                    {normalizedGroups.map(group => {
                        const isSelected = priorities.has(group.id);
                        return (
                            <button
                                key={group.id}
                                onClick={() => {
                                    const next = new Set(priorities);
                                    if(isSelected) next.delete(group.id); else next.add(group.id);
                                    setPriorities(next);
                                }}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-medium border-2 transition-all
                                    ${isSelected 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-105' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}
                                `}
                            >
                                {group.name}
                            </button>
                        );
                    })}
                </div>

                <div className="flex justify-center gap-4 pt-8">
                    <button 
                        onClick={goBack}
                        className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-xl text-lg font-bold hover:bg-gray-50 transition shadow-sm"
                    >
                        <ArrowLeft size={20} /> Назад
                    </button>
                    <button 
                        onClick={calculateMatrix}
                        className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl text-lg font-bold hover:bg-gray-800 transition shadow-lg"
                    >
                        Рассчитать стратегию <ChevronRight />
                    </button>
                </div>
           </div>
        )}

        {/* STAGE 5: MATRIX */}
        {stage === 'matrix' && (
            <div className="animate-fade-in">
                <ResultsMatrix 
                    groups={normalizedGroups} 
                    banks={banks}
                    solverState={solverState}
                    setSolverState={setSolverState}
                />
                
                <div className="mt-8 flex flex-col items-center gap-4">
                    <button 
                        onClick={goBack}
                         className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        <ArrowLeft size={16} /> Изменить приоритеты
                    </button>
                    
                    <button 
                        onClick={() => {
                            setFiles([]);
                            setStage('setup');
                        }}
                        className="text-gray-500 hover:text-gray-900 underline text-sm"
                    >
                        Начать заново
                    </button>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;
