import { ReactNode, CSSProperties } from 'react';
import { LinkGroup } from './ActiveSymbolContext';

export interface PanelProps {
  id: string;
  title: string;
  children: ReactNode;
  onClose?: (id: string) => void;
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
  linkGroup?: LinkGroup;
  isPinned?: boolean;
  onLinkGroupChange?: (group: LinkGroup) => void;
  onPinToggle?: () => void;
}

const linkGroupColors: Record<Exclude<LinkGroup, null>, string> = {
  A: '#00cc00',
  B: '#00cccc',
  C: '#cc00cc',
};

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
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  linkButton: {
    background: 'none',
    border: '1px solid #666',
    cursor: 'pointer',
    padding: '2px 6px',
    fontFamily: '"Courier New", monospace',
    fontSize: '11px',
    borderRadius: '2px',
    transition: 'all 0.2s',
  },
  pinButton: {
    background: 'none',
    border: '1px solid #666',
    color: '#888',
    cursor: 'pointer',
    padding: '2px 6px',
    fontFamily: '"Courier New", monospace',
    fontSize: '11px',
    borderRadius: '2px',
    transition: 'all 0.2s',
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
    overflow: 'hidden', /* Changed from 'auto' - children handle their own scrolling */
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, /* Allow flex children to shrink and scroll properly */
    color: '#00ff00',
    fontFamily: '"Courier New", monospace',
    fontSize: '13px',
  },
};

const linkGroups: Exclude<LinkGroup, null>[] = ['A', 'B', 'C'];

export default function Panel({
  id,
  title,
  children,
  onClose,
  width,
  height,
  style,
  linkGroup = null,
  isPinned = false,
  onLinkGroupChange,
  onPinToggle,
}: PanelProps) {
  const containerStyle: CSSProperties = {
    ...panelStyles.container,
    width: width || 'auto',
    height: height || 'auto',
    ...style,
  };

  const handleLinkGroupClick = () => {
    if (!onLinkGroupChange) return;
    const currentIndex = linkGroup ? linkGroups.indexOf(linkGroup) : -1;
    const nextIndex = (currentIndex + 1) % (linkGroups.length + 1);
    const nextGroup = nextIndex === linkGroups.length ? null : linkGroups[nextIndex];
    onLinkGroupChange(nextGroup);
  };

  const getLinkButtonStyle = (): CSSProperties => {
    const baseStyle = { ...panelStyles.linkButton };
    if (linkGroup) {
      baseStyle.color = linkGroupColors[linkGroup];
      baseStyle.borderColor = linkGroupColors[linkGroup];
    } else {
      baseStyle.color = '#666';
    }
    return baseStyle;
  };

  const getPinButtonStyle = (): CSSProperties => {
    const baseStyle = { ...panelStyles.pinButton };
    if (isPinned) {
      baseStyle.color = '#ffcc00';
      baseStyle.borderColor = '#ffcc00';
    }
    return baseStyle;
  };

  return (
    <div style={containerStyle} data-panel-id={id}>
      <div style={panelStyles.header}>
        <div style={panelStyles.title}>
          <span>╔═</span>
          <span>{title}</span>
          <span>═╗</span>
        </div>
        <div style={panelStyles.controls}>
          {onLinkGroupChange && (
            <button
              style={getLinkButtonStyle()}
              onClick={handleLinkGroupClick}
              title={linkGroup ? `Linked to group ${linkGroup}` : 'Not linked'}
            >
              {linkGroup || '○'}
            </button>
          )}
          {onPinToggle && (
            <button
              style={getPinButtonStyle()}
              onClick={onPinToggle}
              title={isPinned ? 'Pinned - click to unpin' : 'Click to pin'}
            >
              {isPinned ? '📌' : '○'}
            </button>
          )}
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
      </div>
      <div style={panelStyles.content}>{children}</div>
    </div>
  );
}
