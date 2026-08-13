import React from 'react';
import {
  Terminal,
  CheckSquare,
  Target,
  Clock,
  FileText,
  Cpu,
  Layers,
  ExternalLink,
  User,
  Mail,
  Users,
  FolderOpen,
  Calendar,
  StickyNote,
  Mic,
  FileSpreadsheet,
} from 'lucide-react';
import { QuickTool } from '../types';

interface QuickToolsGridProps {
  tools: QuickTool[];
  onToolAction?: (actionName: string) => void;
}

export const QuickToolsGrid: React.FC<QuickToolsGridProps> = ({ tools, onToolAction }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Mic':
        return <Mic className="w-4 h-4 text-rose-400" />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-4 h-4 text-cyan-400" />;
      case 'Terminal':
        return <Terminal className="w-4 h-4 text-indigo-400" />;
      case 'CheckSquare':
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'Target':
        return <Target className="w-4 h-4 text-purple-400" />;
      case 'Clock':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'FileText':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'Cpu':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'User':
        return <User className="w-4 h-4 text-sky-400" />;
      case 'Mail':
        return <Mail className="w-4 h-4 text-red-400" />;
      case 'Users':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'FolderOpen':
        return <FolderOpen className="w-4 h-4 text-emerald-400" />;
      case 'Calendar':
        return <Calendar className="w-4 h-4 text-cyan-400" />;
      case 'StickyNote':
        return <StickyNote className="w-4 h-4 text-amber-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };


  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-2xl transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100 font-mono tracking-wider uppercase">Operational Launchpad</h2>
        </div>
        <span className="text-xs font-mono text-cyan-400">6 Modules Active</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              if (t.action && typeof onToolAction === 'function') {
                onToolAction(t.action);
              }
            }}
            className="group flex flex-col justify-between p-3 rounded-xl glass-panel glass-panel-hover text-left transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-black/40 group-hover:bg-cyan-500/10 transition-colors">
                {getIcon(t.iconName)}
              </div>
              {t.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                  {t.badge}
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                {t.name}
                <ExternalLink className="w-3 h-3 text-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t.category}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
