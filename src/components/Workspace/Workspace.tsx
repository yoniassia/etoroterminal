import { CSSProperties, useState, useRef, useCallback } from 'react';
import Panel from './Panel';
import { PanelRegistry } from './PanelRegistry';
import CompareTray from '../CompareTray';
import { useWorkspaceContext } from '../../contexts/WorkspaceContext';

// Panel size storage
interface PanelSizes {
  [instanceId: string]: { width: number; height: number };
}

const PANEL_SIZES_KEY = 'etoro-terminal-panel-sizes';

export interface WorkspaceProps {
  className?: string;
  style?: CSSProperties;
}

const workspaceStyles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    color: '#00ff00',
    fontFamily: '"Courier New", monospace',
  },
  header: {
    padding: '10px 20px',
    backgroundColor: '#0a0a0a',
    borderBottom: '1px solid #333',
    textAlign: 'center',
    fontSize: '14px',
  },
  toolbar: {
    display: 'flex',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#111',
    borderBottom: '1px solid #333',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  toolbarSection: {
    display: 'flex',
    gap: '8px',
    flex: 1,
    flexWrap: 'wrap',
  },
  toolbarActions: {
    display: 'flex',
    gap: '8px',
    borderLeft: '1px solid #333',
    paddingLeft: '12px',
    marginLeft: '8px',
  },
  toolbarButton: {
    background: 'none',
    border: '1px solid #00cc00',
    color: '#00cc00',
    cursor: 'pointer',
    padding: '4px 12px',
    fontFamily: '"Courier New", monospace',
    fontSize: '12px',
    borderRadius: '2px',
    transition: 'all 0.2s',
  },
  saveButton: {
    background: 'none',
    border: '1px solid #00ccff',
    color: '#00ccff',
    cursor: 'pointer',
    padding: '4px 12px',
    fontFamily: '"Courier New", monospace',
    fontSize: '11px',
    borderRadius: '2px',
    transition: 'all 0.2s',
  },
  resetButton: {
    background: 'none',
    border: '1px solid #ff9900',
    color: '#ff9900',
    cursor: 'pointer',
    padding: '4px 12px',
    fontFamily: '"Courier New", monospace',
    fontSize: '11px',
    borderRadius: '2px',
    transition: 'all 0.2s',
  },
  panelGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '12px',
    flex: 1,
    overflow: 'auto',
    alignContent: 'flex-start',
  },
  panelWrapper: {
    flex: '1 1 350px',
    minWidth: '350px',
    maxWidth: '600px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#666',
    fontSize: '14px',
    gap: '10px',
  },
  draggingPanel: {
    opacity: 0.5,
    border: '2px dashed #00ff00',
  },
  dragOverPanel: {
    borderLeft: '3px solid #00ff00',
  },
  savedIndicator: {
    color: '#00cc00',
    fontSize: '10px',
    marginLeft: '4px',
  },
};

// Load saved panel sizes from localStorage
const loadPanelSizes = (): PanelSizes => {
  try {
    const saved = localStorage.getItem(PANEL_SIZES_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Save panel sizes to localStorage
const savePanelSizes = (sizes: PanelSizes): void => {
  try {
    localStorage.setItem(PANEL_SIZES_KEY, JSON.stringify(sizes));
  } catch (e) {
    console.error('Failed to save panel sizes:', e);
  }
};

export default function Workspace({ className, style }: WorkspaceProps) {
  const { panels, addPanel, removePanel, movePanel, saveAsDefault, resetToDefault, hasCustomLayout } = useWorkspaceContext();
  const registeredTypes = PanelRegistry.getRegisteredTypes();
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [panelSizes, setPanelSizes] = useState<PanelSizes>(loadPanelSizes);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  // Handle panel resize
  const handlePanelResize = useCallback((id: string, width: number, height: number) => {
    setPanelSizes(prev => {
      const updated = { ...prev, [id]: { width, height } };
      savePanelSizes(updated);
      return updated;
    });
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    // Add a slight delay to show the drag styling
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      movePanel(fromIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveLayout = () => {
    saveAsDefault();
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 2000);
  };

  const handleResetLayout = () => {
    if (confirm('Reset to default layout? This will remove your saved layout.')) {
      resetToDefault();
    }
  };

  const getPanelStyle = (index: number): CSSProperties => {
    let panelStyle: CSSProperties = {};
    if (draggedIndex === index) {
      panelStyle = { ...workspaceStyles.draggingPanel };
    }
    if (dragOverIndex === index && draggedIndex !== index) {
      panelStyle = { ...panelStyle, ...workspaceStyles.dragOverPanel };
    }
    return panelStyle;
  };

  return (
    <div
      className={className}
      style={{ ...workspaceStyles.container, ...style }}
    >
      <div style={workspaceStyles.header}>
        ╔═══════════════════════════════╗<br />
        ║   ETORO TERMINAL WORKSPACE    ║<br />
        ╚═══════════════════════════════╝
      </div>

      <div style={workspaceStyles.toolbar}>
        <div style={workspaceStyles.toolbarSection}>
          {registeredTypes.length > 0 ? (
            registeredTypes.map((typeId) => {
              const config = PanelRegistry.get(typeId);
              return (
                <button
                  key={typeId}
                  style={workspaceStyles.toolbarButton}
                  onClick={() => addPanel(typeId)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#003300';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  [ + {config?.title || typeId} ]
                </button>
              );
            })
          ) : (
            <span style={{ color: '#666', fontSize: '12px' }}>
              No panel types registered
            </span>
          )}
        </div>
        
        <div style={workspaceStyles.toolbarActions}>
          <button
            style={workspaceStyles.saveButton}
            onClick={handleSaveLayout}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#003344';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Save current layout as default"
          >
            [ 💾 SAVE LAYOUT ]
            {showSaveConfirm && <span style={workspaceStyles.savedIndicator}>✓ Saved!</span>}
          </button>
          {hasCustomLayout && (
            <button
              style={workspaceStyles.resetButton}
              onClick={handleResetLayout}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#332200';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Reset to factory default layout"
            >
              [ ↺ RESET ]
            </button>
          )}
        </div>
      </div>

      {panels.length > 0 ? (
        <div style={workspaceStyles.panelGrid}>
          {panels.map((instance, index) => {
            const config = PanelRegistry.get(instance.typeId);
            if (!config) return null;

            const PanelContent = config.component;
            const savedSize = panelSizes[instance.instanceId];
            const panelWidth = savedSize?.width || config.defaultWidth || 400;
            const panelHeight = savedSize?.height || config.defaultHeight || 350;
            
            return (
              <div
                key={instance.instanceId}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className="workspace-panel-wrapper"
                style={{
                  cursor: 'grab',
                  ...getPanelStyle(index),
                }}
              >
                <Panel
                  id={instance.instanceId}
                  title={instance.title}
                  onClose={removePanel}
                  width={panelWidth}
                  height={panelHeight}
                  onResize={handlePanelResize}
                  resizable={true}
                  minWidth={config.minWidth || 250}
                  minHeight={config.minHeight || 200}
                >
                  <PanelContent panelId={instance.instanceId} />
                </Panel>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={workspaceStyles.emptyState}>
          <div>▓▓▓ LOADING PANELS... ▓▓▓</div>
          <div style={{ fontSize: '12px' }}>
            If panels don't load, use the toolbar above to add them manually
          </div>
        </div>
      )}

      <CompareTray />
    </div>
  );
}
