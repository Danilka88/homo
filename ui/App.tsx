
import * as React from 'react';
import { useState } from 'react';
import { 
  Upload, 
  Layout, 
  AlertTriangle, 
  Play, 
  MousePointer2, 
  Eraser, 
  DoorOpen, 
  Box, 
  CheckCircle2,
  XCircle,
  BrainCircuit,
  Hand,
  Menu,
  X,
  AppWindow,
  Tag,
  Droplets,
  FileText,
  Check,
  ShoppingBag,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import EditorCanvas from './components/EditorCanvas';
import Preview3D from './components/Preview3D';
import { Wall, Furniture, AppMode, EditorTool, Violation, WallType, FurnitureType, RoomLabel, RoomType, CatalogCategory } from './types';
import { INITIAL_WALLS, INITIAL_FURNITURE, FURNITURE_CATALOG, ROOM_METADATA, MOCK_CATALOG_ITEMS } from './constants';
import { GeminiService } from './services/geminiService';

export default function App() {
  // State
  const [mode, setMode] = useState<AppMode>(AppMode.UPLOAD);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [rooms, setRooms] = useState<RoomLabel[]>([]);
  const [activeTool, setActiveTool] = useState<EditorTool>('SELECT');
  const [activeRoomType, setActiveRoomType] = useState<RoomType | null>(null);
  const [scale, setScale] = useState(1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  
  // Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderFormSent, setOrderFormSent] = useState(false);
  
  // Catalog & Viz State
  const [selectedCatalogItems, setSelectedCatalogItems] = useState<Set<string>>(new Set());
  const [vizLoading, setVizLoading] = useState(false);
  const [vizResultOpen, setVizResultOpen] = useState(false);

  // Responsive UI State
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  // Handle Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setUploadedImage(evt.target.result as string);
          setMode(AppMode.EDITOR);
          setWalls([]);
          setFurniture([]);
          setRooms([]);
          setScale(0.5);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDemoLoad = () => {
    setMode(AppMode.EDITOR);
    setWalls(INITIAL_WALLS);
    setFurniture(INITIAL_FURNITURE);
    setRooms([]);
    setScale(0.8);
  };

  const addFurniture = (type: FurnitureType, width: number, depth: number) => {
    const newItem: Furniture = {
      id: Date.now().toString(),
      type,
      x: 1000, 
      y: 1000,
      rotation: 0,
      width,
      depth
    };
    setFurniture([...furniture, newItem]);
    setActiveTool('SELECT');
  };

  const checkNorms = async () => {
    setIsChecking(true);
    setIsRightSidebarOpen(true);
    const results = await GeminiService.checkCompliance(walls, furniture, rooms);
    setViolations(results);
    setIsChecking(false);
  };

  const generateAI = async () => {
    setAiSuggestion('Думаю...');
    const result = await GeminiService.generateIdeas(aiPrompt, walls);
    setAiSuggestion(result);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setOrderFormSent(true);
    setTimeout(() => {
      setOrderFormSent(false);
      setIsOrderModalOpen(false);
    }, 3000);
  };

  // Catalog Logic
  const toggleCatalogItem = (id: string) => {
    const newSet = new Set(selectedCatalogItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedCatalogItems(newSet);
  };

  const handleGenerateViz = () => {
    if (selectedCatalogItems.size === 0) {
      alert("Выберите хотя бы один материал или мебель для визуализации.");
      return;
    }
    setVizLoading(true);
    // Simulate processing delay
    setTimeout(() => {
      setVizLoading(false);
      setVizResultOpen(true);
    }, 2500);
  };

  // Views
  if (mode === AppMode.UPLOAD) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Layout className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Хомо Готово</h1>
          <p className="text-slate-500 mb-8">
            Загрузите план БТИ или эскиз квартиры. ИИ поможет оцифровать его и проверит нарушения СНиП.
          </p>

          <label className="block w-full cursor-pointer group">
             <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 transition-colors group-hover:border-blue-500 bg-slate-50 group-hover:bg-blue-50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-blue-500" />
                <span className="text-sm font-medium text-slate-600 group-hover:text-blue-600">Загрузить фото плана</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
             </div>
          </label>

          <div className="mt-6">
            <button onClick={handleDemoLoad} className="text-sm text-slate-400 hover:text-blue-600 underline">
              Или загрузить демо-проект
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === AppMode.PREVIEW_3D) {
    return (
       <Preview3D 
          walls={walls} 
          furniture={furniture} 
          rooms={rooms} 
          backgroundImage={uploadedImage}
          onBack={() => setMode(AppMode.EDITOR)} 
       />
    );
  }

  if (mode === AppMode.CATALOG) {
    const categories: { id: CatalogCategory, label: string }[] = [
      { id: 'WALLPAPER', label: 'Обои и Стены' },
      { id: 'FLOORING', label: 'Напольные покрытия' },
      { id: 'FURNITURE', label: 'Мебель и Декор' },
    ];

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
         <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30">
            <div className="flex items-center gap-2">
               <button onClick={() => setMode(AppMode.EDITOR)} className="p-2 hover:bg-slate-100 rounded-full">
                 <ArrowLeft className="w-5 h-5 text-slate-600" />
               </button>
               <h1 className="font-bold text-lg text-slate-800">Каталог материалов</h1>
            </div>
            <button 
              onClick={handleGenerateViz}
              disabled={vizLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-all shadow-md shadow-purple-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {vizLoading ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Sparkles className="w-4 h-4" />}
              {vizLoading ? 'Генерация...' : 'Создать визуализацию'}
            </button>
         </header>

         <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 pb-20">
           {categories.map(cat => (
             <section key={cat.id}>
               <h2 className="text-xl font-bold text-slate-800 mb-4">{cat.label}</h2>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {MOCK_CATALOG_ITEMS.filter(item => item.category === cat.id).map(item => {
                    const isSelected = selectedCatalogItems.has(item.id);
                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleCatalogItem(item.id)}
                        className={`group cursor-pointer rounded-xl bg-white border-2 overflow-hidden transition-all shadow-sm hover:shadow-md ${
                          isSelected ? 'border-green-500 ring-2 ring-green-100' : 'border-transparent hover:border-slate-200'
                        }`}
                      >
                         <div className="aspect-square bg-slate-100 relative">
                           {/* Placeholder logic if image fails or is dummy path */}
                           <img 
                              src={item.image} 
                              alt={item.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=' + encodeURIComponent(item.title);
                              }}
                           />
                           {isSelected && (
                             <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                               <Check className="w-5 h-5" />
                             </div>
                           )}
                         </div>
                         <div className="p-3">
                           <h3 className="text-sm font-medium text-slate-700 group-hover:text-blue-600">{item.title}</h3>
                         </div>
                      </div>
                    )
                  })}
               </div>
             </section>
           ))}
         </main>

         {/* RESULT MODAL */}
         {vizResultOpen && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl max-w-4xl w-full p-1 overflow-hidden shadow-2xl relative">
                  <div className="absolute top-4 right-4 z-10">
                     <button onClick={() => setVizResultOpen(false)} className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm">
                       <X className="w-6 h-6" />
                     </button>
                  </div>
                  <div className="w-full aspect-video bg-slate-100 relative flex items-center justify-center">
                    <img 
                      src="./assets/result.png" 
                      alt="Visualization Result" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                         // Fallback text if user hasn't put the image yet
                         (e.target as HTMLImageElement).style.display = 'none';
                         const parent = (e.target as HTMLImageElement).parentElement;
                         if(parent) {
                             parent.innerHTML = `<div class="text-center p-8"><p class="text-xl font-bold text-slate-400 mb-2">Файл result.png не найден</p><p class="text-slate-500">Пожалуйста, добавьте result.png в папку /assets/</p></div>`;
                         }
                      }}
                    />
                  </div>
                  <div className="p-6 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Ваша визуализация готова!</h3>
                      <p className="text-slate-600 max-w-xl">
                        Мы готовы реализовать проект ремонта вашей квартиры с учетом всех ваших пожеланий и выбранных материалов.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setVizResultOpen(false);
                        setIsOrderModalOpen(true);
                      }}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200 whitespace-nowrap"
                    >
                      Заказать ремонт
                    </button>
                  </div>
               </div>
            </div>
         )}
      </div>
    );
  }

  // EDITOR MODE
  return (
    <div className="fixed inset-0 flex flex-col bg-slate-100 overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-4 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <Layout className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-800 hidden sm:block">Хомо Готово</span>
          
          {/* NEW BUTTON: ORDER DOCS */}
          <button 
             onClick={() => setIsOrderModalOpen(true)}
             className="ml-4 hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors shadow-sm shadow-green-200"
          >
             <FileText className="w-4 h-4" />
             Заказать оформление
          </button>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
           {/* Zoom Controls */}
           <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-1">
             <button 
               onClick={() => setScale(s => Math.max(0.1, s - 0.1))} 
               className="w-8 h-8 flex items-center justify-center rounded hover:bg-white text-slate-600 font-bold"
             >-</button>
             <span className="text-xs text-slate-500 w-10 text-center">{Math.round(scale * 100)}%</span>
             <button 
               onClick={() => setScale(s => Math.min(3, s + 0.1))} 
               className="w-8 h-8 flex items-center justify-center rounded hover:bg-white text-slate-600 font-bold"
             >+</button>
           </div>

           {/* CATALOG BUTTON */}
           <button 
             onClick={() => setMode(AppMode.CATALOG)}
             className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 text-sm font-medium transition-colors"
           >
             <ShoppingBag className="w-4 h-4" /> <span className="hidden sm:inline">Каталог</span>
           </button>
           
           <button 
             onClick={() => setMode(AppMode.PREVIEW_3D)}
             className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-medium transition-colors"
           >
             <Box className="w-4 h-4" /> <span className="hidden sm:inline">3D Вид</span>
           </button>
           
           <button 
             onClick={checkNorms}
             className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm shadow-blue-200"
           >
             <CheckCircle2 className="w-4 h-4" /> 
             {isChecking ? '...' : <span className="hidden sm:inline">Проверка</span>}
           </button>

           <button 
             onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
             className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
           >
             {isRightSidebarOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5" />}
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT TOOLBAR */}
        <aside className="w-14 md:w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-3 md:gap-4 z-10 shrink-0 shadow-sm overflow-y-auto">
          <ToolButton active={activeTool === 'SELECT'} onClick={() => setActiveTool('SELECT')} icon={<MousePointer2 />} label="Выбрать" />
          <ToolButton active={activeTool === 'HAND'} onClick={() => setActiveTool('HAND')} icon={<Hand />} label="Рука" />
          
          <div className="w-8 h-[1px] bg-slate-200 my-1" />
          
          <ToolButton 
            active={activeTool === 'WALL_BEARING'} 
            onClick={() => setActiveTool('WALL_BEARING')} 
            icon={<div className="w-5 h-5 bg-green-500 rounded-sm border-2 border-green-700" />} 
            label="Несущая стена" 
          />
          <ToolButton 
            active={activeTool === 'WALL_PARTITION'} 
            onClick={() => setActiveTool('WALL_PARTITION')} 
            icon={<div className="w-5 h-5 bg-slate-300 border-2 border-slate-500 rounded-sm" />} 
            label="Перегородка" 
          />
          <ToolButton 
            active={activeTool === 'WALL_DEMOLITION'} 
            onClick={() => setActiveTool('WALL_DEMOLITION')} 
            icon={<div className="w-5 h-5 border-2 border-dashed border-red-500 rounded-sm bg-red-50" />} 
            label="Стена под снос" 
          />
          
          <div className="w-8 h-[1px] bg-slate-200 my-1" />
          
          <ToolButton active={activeTool === 'DOOR'} onClick={() => addFurniture(FurnitureType.DOOR, 80, 10)} icon={<DoorOpen />} label="Дверь" />
          <ToolButton active={activeTool === 'WINDOW'} onClick={() => addFurniture(FurnitureType.WINDOW, 100, 10)} icon={<AppWindow />} label="Окно" />
          
          <ToolButton active={activeTool === 'ROOM_LABEL'} onClick={() => { setActiveTool('ROOM_LABEL'); setActiveRoomType(RoomType.KITCHEN); }} icon={<Tag />} label="Зонирование" />

          <div className="w-8 h-[1px] bg-slate-200 my-1" />
          <ToolButton active={activeTool === 'ERASER'} onClick={() => setActiveTool('ERASER')} icon={<Eraser />} label="Ластик" />
        </aside>

        {/* ROOM TYPE SUB-MENU (When Room Label Tool is Active) */}
        {activeTool === 'ROOM_LABEL' && (
           <div className="absolute left-16 md:left-20 top-4 bg-white p-3 rounded-xl shadow-xl border border-slate-100 z-50 flex flex-col gap-2">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Выберите тип</span>
             {Object.entries(ROOM_METADATA).map(([key, data]) => (
               <button
                 key={key}
                 onClick={() => setActiveRoomType(key as RoomType)}
                 className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeRoomType === key ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                 }`}
               >
                 <span className={`w-3 h-3 rounded-full`} style={{ backgroundColor: data.color }} />
                 {data.name}
                 {data.isWet && <Droplets className="w-3 h-3 text-blue-400 ml-auto" />}
               </button>
             ))}
           </div>
        )}

        {/* MAIN CANVAS AREA */}
        <main className="flex-1 relative bg-slate-100 overflow-hidden touch-none">
           <div className="absolute inset-0 overflow-auto flex items-center justify-center p-0 md:p-20 touch-none">
              <div className="bg-white shadow-2xl relative shrink-0">
                 <EditorCanvas 
                    walls={walls} 
                    setWalls={setWalls}
                    furniture={furniture}
                    setFurniture={setFurniture}
                    rooms={rooms}
                    setRooms={setRooms}
                    activeTool={activeTool}
                    activeRoomType={activeRoomType}
                    backgroundImage={uploadedImage}
                    scale={scale}
                 />
              </div>
           </div>
           
           {/* FLOATING FURNITURE PALETTE */}
           <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-auto md:w-auto bg-white p-2 rounded-xl shadow-xl border border-slate-100 flex gap-2 overflow-x-auto z-10 no-scrollbar">
             {FURNITURE_CATALOG.map(f => (
               <button 
                 key={f.type}
                 onClick={() => addFurniture(f.type, f.width, f.depth)}
                 className="flex flex-col items-center justify-center min-w-[3.5rem] h-14 rounded-lg hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors gap-1"
               >
                 <Box className="w-5 h-5" />
                 <span className="text-[9px] leading-tight text-center whitespace-nowrap overflow-hidden text-ellipsis w-full px-1">{f.name}</span>
               </button>
             ))}
           </div>
        </main>

        {/* RIGHT SIDEBAR (AI & COMPLIANCE) */}
        <aside 
          className={`
            fixed inset-y-0 right-0 z-30 w-80 bg-white border-l border-slate-200 flex flex-col transition-transform duration-300 shadow-2xl md:shadow-none md:static md:translate-x-0
            ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          {/* Mobile Header for Sidebar */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100">
            <span className="font-bold text-slate-800">Инструменты</span>
            <button onClick={() => setIsRightSidebarOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
          </div>
          
          {/* COMPLIANCE SECTION */}
          <div className="flex-1 overflow-y-auto p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Проверка СНиП
            </h3>
            
            {violations.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-100" />
                <p className="text-sm">Нарушений пока не найдено.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {violations.map(v => (
                  <div key={v.id} className={`p-3 rounded-lg border text-sm ${
                    v.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-800' :
                    v.severity === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                    'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <div className="flex items-start gap-2">
                      {v.severity === 'critical' ? <XCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                      <div>
                        <strong className="block mb-1">{v.title}</strong>
                        <p className="opacity-90 leading-snug">{v.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI CHAT SECTION */}
          <div className="h-1/2 flex flex-col bg-slate-50 border-t border-slate-200">
             <div className="p-3 border-b border-slate-200 bg-white">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <BrainCircuit className="w-4 h-4 text-purple-600" />
                 AI Ассистент
               </h3>
             </div>
             <div className="flex-1 p-4 overflow-y-auto text-sm text-slate-600">
               {aiSuggestion ? (
                 <div className="whitespace-pre-wrap">{aiSuggestion}</div>
               ) : (
                 <p className="text-slate-400 italic">Спросите совета по планировке...</p>
               )}
             </div>
             <div className="p-3 bg-white border-t border-slate-200 mb-safe"> 
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={aiPrompt}
                   onChange={(e) => setAiPrompt(e.target.value)}
                   placeholder="Вопрос..."
                   className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                   onKeyDown={(e) => e.key === 'Enter' && generateAI()}
                 />
                 <button 
                   onClick={generateAI}
                   className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shrink-0"
                 >
                   <Play className="w-4 h-4" />
                 </button>
               </div>
             </div>
          </div>

        </aside>

        {/* Backdrop for Mobile Sidebar */}
        {isRightSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-20 md:hidden glass"
            onClick={() => setIsRightSidebarOpen(false)}
          />
        )}

        {/* ORDER MODAL */}
        {isOrderModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
                <button 
                   onClick={() => setIsOrderModalOpen(false)}
                   className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                   <X className="w-6 h-6" />
                </button>
                
                {orderFormSent ? (
                   <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                         <Check className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Заявка отправлена!</h3>
                      <p className="text-slate-500">Наш специалист свяжется с вами в ближайшее время для уточнения деталей.</p>
                   </div>
                ) : (
                   <>
                     <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-green-600" />
                        Оформление перепланировки
                     </h2>
                     <p className="text-sm text-slate-600 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        Мы обеспечим оформление и реализацию перепланировки вашей квартиры <strong>«под ключ»</strong>. 
                        Готовы предложить лучшие условия и профессионалов, которые учтут все моменты законодательства и требований (СНиП, ЖК РФ).
                     </p>
                     
                     <form onSubmit={handleOrderSubmit} className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Ваше имя</label>
                           <input type="text" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Иван" />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Телефон</label>
                           <input type="tel" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="+7 (999) 000-00-00" />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Комментарий (необязательно)</label>
                           <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-20" placeholder="Например: хочу объединить кухню с гостиной..." />
                        </div>
                        
                        <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors">
                           Отправить заявку
                        </button>
                     </form>
                   </>
                )}
             </div>
          </div>
        )}

      </div>
    </div>
  );
}

// UI Components
const ToolButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative group ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
    title={label}
  >
    {React.isValidElement(icon) ? React.cloneElement(icon as any, { size: 20 }) : icon}
    <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 hidden md:block">
      {label}
    </span>
  </button>
);
