import { ReactNode, CSSProperties, useState, useCallback, useRef, useEffect } from 'react';
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
  onResize?: (id: string, width: number, height: number) => void;
  resizable?: boolean;
  minWidth?: number;
  minHeight?: number;
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

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

export default function Panel({
  id,
  title,
  children,
  onClose,
  width: initialWidth,
  height: initialHeight,
  style,
  linkGroup = null,
  isPinned = false,
  onLinkGroupChange,
  onPinToggle,
  onResize,
  resizable = true,
  minWidth = 250,
  minHeight = 200,
}: PanelProps) {
  const [dimensions, setDimensions] = useState({
    width: typeof initialWidth === 'number' ? initialWidth : 400,
    height: typeof initialHeight === 'number' ? initialHeight : 350,
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{
    direction: ResizeDirection;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();
    
    resizeRef.current = {
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: dimensions.width,
      startHeight: dimensions.height,
    };
    setIsResizing(true);
  }, [dimensions]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      
      const { direction, startX, startY, startWidth, startHeight } = resizeRef.current;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      // Horizontal resizing
      if (direction?.includes('e')) {
        newWidth = Math.max(minWidth, startWidth + deltaX);
      } else if (direction?.includes('w')) {
        newWidth = Math.max(minWidth, startWidth - deltaX);
      }
      
      // Vertical resizing
      if (direction?.includes('s')) {
        newHeight = Math.max(minHeight, startHeight + deltaY);
      } else if (direction?.includes('n')) {
        newHeight = Math.max(minHeight, startHeight - deltaY);
      }
      
      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      if (resizeRef.current && onResize) {
        onResize(id, dimensions.width, dimensions.height);
      }
      resizeRef.current = null;
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, id, onResize, dimensions, minWidth, minHeight]);

  const containerStyle: CSSProperties = {
    ...panelStyles.container,
    width: dimensions.width,
    height: dimensions.height,
    position: 'relative',
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

  const resizeHandleStyle = (cursor: string): CSSProperties => ({
    position: 'absolute',
    background: 'transparent',
    zIndex: 10,
    cursor,
  });

  return (
    <div 
      ref={panelRef}
      style={containerStyle} 
      data-panel-id={id}
      className={isResizing ? 'panel-resizing' : ''}
    >
      <div style={panelStyles.header}>
        <div style={panelStyles.title}>
          <span>╔═</span>
          <span>{title}</span>
          <span>═╗</span>
          {resizable && (
            <span style={{ fontSize: '10px', color: '#444', marginLeft: '8px' }}>
              {Math.round(dimensions.width)}×{Math.round(dimensions.height)}
            </span>
          )}
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
      
      {/* Resize handles */}
      {resizable && (
        <>
          {/* Edge handles */}
          <div
            style={{ ...resizeHandleStyle('ew-resize'), top: '8px', bottom: '8px', right: '-4px', width: '8px' }}
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            title="Drag to resize horizontally"
          />
          <div
            style={{ ...resizeHandleStyle('ew-resize'), top: '8px', bottom: '8px', left: '-4px', width: '8px' }}
            onMouseDown={(e) => handleResizeStart(e, 'w')}
            title="Drag to resize horizontally"
          />
          <div
            style={{ ...resizeHandleStyle('ns-resize'), left: '8px', right: '8px', bottom: '-4px', height: '8px' }}
            onMouseDown={(e) => handleResizeStart(e, 's')}
            title="Drag to resize vertically"
          />
          <div
            style={{ ...resizeHandleStyle('ns-resize'), left: '8px', right: '8px', top: '-4px', height: '8px' }}
            onMouseDown={(e) => handleResizeStart(e, 'n')}
            title="Drag to resize vertically"
          />
          
          {/* Corner handles */}
          <div
            style={{ ...resizeHandleStyle('nwse-resize'), bottom: '-6px', right: '-6px', width: '14px', height: '14px' }}
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            title="Drag to resize diagonally"
          >
            <div style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '8px',
              height: '8px',
              borderRight: '2px solid #00cc00',
              borderBottom: '2px solid #00cc00',
              opacity: 0.5,
            }} />
          </div>
          <div
            style={{ ...resizeHandleStyle('nesw-resize'), bottom: '-6px', left: '-6px', width: '14px', height: '14px' }}
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            title="Drag to resize diagonally"
          />
          <div
            style={{ ...resizeHandleStyle('nesw-resize'), top: '-6px', right: '-6px', width: '14px', height: '14px' }}
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
            title="Drag to resize diagonally"
          />
          <div
            style={{ ...resizeHandleStyle('nwse-resize'), top: '-6px', left: '-6px', width: '14px', height: '14px' }}
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
            title="Drag to resize diagonally"
          />
        </>
      )}
    </div>
  );
}
