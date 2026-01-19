import { useState, useCallback, CSSProperties } from 'react';
import Panel from './Panel';
import { PanelRegistry, PanelInstance } from './PanelRegistry';

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
  panelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '8px',
    padding: '12px',
    flex: 1,
    overflow: 'auto',
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
};

let instanceCounter = 0;

export default function Workspace({ className, style }: WorkspaceProps) {
  const [panels, setPanels] = useState<PanelInstance[]>([]);

  const addPanel = useCallback((typeId: string) => {
    const config = PanelRegistry.get(typeId);
    if (!config) {
      console.warn(`Panel type "${typeId}" not registered`);
      return null;
    }

    const instanceId = `panel-${++instanceCounter}`;
    const instance: PanelInstance = {
      instanceId,
      typeId,
      title: config.title,
      width: config.defaultWidth,
      height: config.defaultHeight,
    };

    setPanels((prev) => [...prev, instance]);
    return instanceId;
  }, []);

  const removePanel = useCallback((instanceId: string) => {
    setPanels((prev) => prev.filter((p) => p.instanceId !== instanceId));
  }, []);

  const resizePanel = useCallback(
    (instanceId: string, width?: number, height?: number) => {
      setPanels((prev) =>
        prev.map((p) =>
          p.instanceId === instanceId
            ? { ...p, width: width ?? p.width, height: height ?? p.height }
            : p
        )
      );
    },
    []
  );

  const registeredTypes = PanelRegistry.getRegisteredTypes();

  return (
    <div
      className={className}
      style={{ ...workspaceStyles.container, ...style }}
    >
      <div style={workspaceStyles.header}>
        ╔═══════════════════════════════╗<br />
        ║   eTORO TERMINAL WORKSPACE    ║<br />
        ╚═══════════════════════════════╝
      </div>

      <div style={workspaceStyles.toolbar}>
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

      {panels.length > 0 ? (
        <div style={workspaceStyles.panelGrid}>
          {panels.map((instance) => {
            const config = PanelRegistry.get(instance.typeId);
            if (!config) return null;

            const PanelContent = config.component;
            return (
              <Panel
                key={instance.instanceId}
                id={instance.instanceId}
                title={instance.title}
                onClose={removePanel}
                width={instance.width}
                height={instance.height}
              >
                <PanelContent panelId={instance.instanceId} />
              </Panel>
            );
          })}
        </div>
      ) : (
        <div style={workspaceStyles.emptyState}>
          <div>▓▓▓ NO ACTIVE PANELS ▓▓▓</div>
          <div style={{ fontSize: '12px' }}>
            Use the toolbar above to add panels
          </div>
        </div>
      )}
    </div>
  );
}

export { addPanel, removePanel, resizePanel } from './useWorkspace';
