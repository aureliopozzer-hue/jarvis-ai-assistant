'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, FileText, Image, Code, Table, File, Search, Upload, Grid, List, Trash2, Loader2, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useJarvisStore, type FileItem } from '@/lib/jarvis-store';

type TypeFilter = 'all' | 'document' | 'image' | 'code' | 'spreadsheet' | 'other';
type ViewMode = 'grid' | 'list';

const FILE_ICONS: Record<string, React.ElementType> = {
  document: FileText,
  image: Image,
  code: Code,
  spreadsheet: Table,
  other: File,
};

const FILE_COLORS: Record<string, string> = {
  document: 'text-blue-400',
  image: 'text-pink-400',
  code: 'text-emerald-400',
  spreadsheet: 'text-amber-400',
  other: 'text-muted-foreground',
};

function formatFileSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function parseTags(tags: string[] | string): string[] {
  if (Array.isArray(tags)) return tags;
  try { return JSON.parse(tags); } catch { return []; }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function JarvisFiles() {
  const { files, isLoadingFiles, loadFiles, uploadFile, deleteFile } = useJarvisStore();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({ name: '', type: 'document', size: '1024', path: '', tags: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = useCallback(async () => {
    if (!uploadData.name.trim() || !uploadData.path.trim()) return;
    setUploading(true);
    await uploadFile({
      name: uploadData.name.trim(),
      type: uploadData.type,
      size: parseInt(uploadData.size) || 1024,
      path: uploadData.path.trim(),
      tags: uploadData.tags ? uploadData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });
    setUploadData({ name: '', type: 'document', size: '1024', path: '', tags: '' });
    setShowUpload(false);
    setUploading(false);
  }, [uploadData, uploadFile]);

  const filteredFiles = useMemo(() =>
    files.filter((f) => {
      const matchesType = typeFilter === 'all' || f.type === typeFilter;
      const matchesSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    }),
    [files, typeFilter, searchQuery]
  );

  const typeFilters: { key: TypeFilter; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: 'Todos', icon: FolderOpen },
    { key: 'document', label: 'Documentos', icon: FileText },
    { key: 'image', label: 'Imagens', icon: Image },
    { key: 'code', label: 'Código', icon: Code },
    { key: 'spreadsheet', label: 'Planilhas', icon: Table },
  ];

  return (
    <div className="jarvis-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-jarvis-cyan/10">
          <FolderOpen className="h-5 w-5 text-jarvis-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-jarvis-cyan jarvis-glow-text">Arquivos</h2>
          <p className="text-xs text-muted-foreground">Gestão de documentos</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowUpload(!showUpload)} className="text-jarvis-cyan/60 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan gap-1.5">
          {showUpload ? <X className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
          <span className="text-[10px] hidden sm:inline">{showUpload ? 'Fechar' : 'Upload'}</span>
        </Button>
      </div>

      {/* Upload Form */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="jarvis-panel p-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={uploadData.name}
                  onChange={(e) => setUploadData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nome do arquivo"
                  className="flex-1 bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
                />
                <select
                  value={uploadData.type}
                  onChange={(e) => setUploadData((p) => ({ ...p, type: e.target.value }))}
                  className="bg-jarvis-dark border border-jarvis-border/30 rounded-md px-2 py-1.5 text-xs text-foreground/80 focus:outline-none focus:border-jarvis-cyan/40"
                >
                  <option value="document">Documento</option>
                  <option value="image">Imagem</option>
                  <option value="code">Código</option>
                  <option value="spreadsheet">Planilha</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Input
                  value={uploadData.path}
                  onChange={(e) => setUploadData((p) => ({ ...p, path: e.target.value }))}
                  placeholder="Caminho (ex: /docs/relatorio.pdf)"
                  className="flex-1 bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
                />
                <Input
                  value={uploadData.size}
                  onChange={(e) => setUploadData((p) => ({ ...p, size: e.target.value }))}
                  placeholder="Tamanho (bytes)"
                  type="number"
                  className="w-28 bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
                />
              </div>
              <Input
                value={uploadData.tags}
                onChange={(e) => setUploadData((p) => ({ ...p, tags: e.target.value }))}
                placeholder="Tags (separadas por vírgula)"
                className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
              />
              <Button
                onClick={handleUpload}
                disabled={uploading || !uploadData.name.trim() || !uploadData.path.trim()}
                className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 gap-2"
                size="sm"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Enviar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
        <input
          type="text"
          placeholder="Buscar arquivos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-jarvis-dark/50 border border-jarvis-border/20 rounded-md pl-8 pr-3 py-1.5 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none focus:border-jarvis-cyan/30 transition-colors"
        />
      </div>

      {/* Type filter chips */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {typeFilters.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] transition-colors ${
              typeFilter === key
                ? 'bg-jarvis-cyan/15 text-jarvis-cyan border border-jarvis-cyan/20'
                : 'text-muted-foreground/50 hover:bg-jarvis-cyan/5 hover:text-jarvis-cyan/80'
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground/40">{filteredFiles.length} arquivo{filteredFiles.length !== 1 ? 's' : ''}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'text-jarvis-cyan bg-jarvis-cyan/10' : 'text-muted-foreground/40 hover:text-jarvis-cyan/60'}`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'text-jarvis-cyan bg-jarvis-cyan/10' : 'text-muted-foreground/40 hover:text-jarvis-cyan/60'}`}
          >
            <Grid className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Files */}
      <ScrollArea className="jarvis-scrollbar flex-1">
        {isLoadingFiles ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-jarvis-cyan animate-spin" />
            <span className="ml-2 text-xs text-muted-foreground">Carregando...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-8 w-8 text-jarvis-cyan/15 mb-2" />
            <p className="text-xs text-muted-foreground/40">Nenhum arquivo encontrado</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredFiles.map((file, i) => (
              <FileGridCard key={file.id} file={file} index={i} onDelete={deleteFile} />
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredFiles.map((file, i) => (
              <FileListCard key={file.id} file={file} index={i} onDelete={deleteFile} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function FileListCard({ file, index, onDelete }: { file: FileItem; index: number; onDelete: (id: string) => Promise<void> }) {
  const Icon = FILE_ICONS[file.type] || File;
  const iconColor = FILE_COLORS[file.type] || FILE_COLORS.other;
  const tags = parseTags(file.tags);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="group flex items-center gap-2 p-2 rounded-lg hover:bg-jarvis-dark/50 transition-colors"
    >
      <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground/70 truncate">{file.name}</p>
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground/40">
          <span>{formatFileSize(file.size)}</span>
          <span>{formatDate(file.createdAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="outline" className="text-[7px] h-3.5 px-1 border-jarvis-border/20 text-muted-foreground/40">
            {tag}
          </Badge>
        ))}
        <button
          onClick={() => onDelete(file.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground/30 hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}

function FileGridCard({ file, index, onDelete }: { file: FileItem; index: number; onDelete: (id: string) => Promise<void> }) {
  const Icon = FILE_ICONS[file.type] || File;
  const iconColor = FILE_COLORS[file.type] || FILE_COLORS.other;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className="jarvis-panel p-3 group"
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-6 w-6 ${iconColor}`} />
        <button
          onClick={() => onDelete(file.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground/30 hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <p className="text-[11px] text-foreground/70 truncate font-medium">{file.name}</p>
      <p className="text-[9px] text-muted-foreground/40">{formatFileSize(file.size)}</p>
    </motion.div>
  );
}
