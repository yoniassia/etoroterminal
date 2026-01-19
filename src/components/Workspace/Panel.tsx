import { ReactNode, CSSProperties } from 'react';

export interface PanelProps {
  id: string;
  title: string;
  children: ReactNode;
  onClose?: (id: string) => void;
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
}

const panelStyles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '4px',
    overflow: 'hidden',
    minWidth: '200px',
    minHeight: '150px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #333',
    color: '#00cc00',
    fontFamily: '"Courier New", monospace',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  closeButton: {
    background: 'none',
    border: '1px solid #666',
    color: '#ff4444',
    cursor: 'pointer',
    padding: '2px 8px',
    fontFamily: '"Courier New", monospace',
    fontSize: '12px',
    borderRadius: '2px',
    transition: 'all 0.2s',
  },
  content: {
    flex: 1,
    padding: '12px',
    overflow: 'auto',
    color: '#00ff00',
    fontFamily: '"Courier New", monospace',
    fontSize: '13px',
  },
};

export default function Panel({
  id,
  title,
  children,
  onClose,
  width,
  height,
  style,
}: PanelProps) {
  const containerStyle: CSSProperties = {
    ...panelStyles.container,
    width: width || 'auto',
    height: height || 'auto',
    ...style,
  };

  return (
    <div style={containerStyle} data-panel-id={id}>
      <div style={panelStyles.header}>
        <div style={panelStyles.title}>
          <span>╔═</span>
          <span>{title}</span>
          <span>═╗</span>
        </div>
        {onClose && (
          <button
            style={panelStyles.closeButton}
            onClick={() => onClose(id)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#331111';
              e.currentTarget.style.borderColor = '#ff4444';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#666';
            }}
          >
            [X]
          </button>
        )}
      </div>
      <div style={panelStyles.content}>{children}</div>
    </div>
  );
}
