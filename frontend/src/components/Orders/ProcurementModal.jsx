import React, { useEffect } from 'react';

export default function ProcurementModal({ data, onClose, onNavigate }) {
  if (!data || !data.isOpen) return null;

  const {
    actionType = 'Confirm Order',
    order = {},
    title = 'Material Request & Accessories Order',
    badgeText = 'Requisition Queued',
    badgeColor = '#10b981',
    icon = '📦',
    heading = 'Requisition & Procurement Order Generated',
    message = '',
    details = []
  } = data;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') {
        if (actionType === 'Create PO' && onNavigate) {
          onNavigate();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actionType, onClose, onNavigate]);

  const defaultDetails = details.length > 0 ? details : [
    { label: 'Order ID', value: `#${order.id || 'RD-2610-0002'}` },
    { label: 'Style Name', value: order.styleName || 'Kurta Style' },
    { label: 'Total Garments', value: `${order.totalGarments || 100} pcs` },
    { label: 'Greige Fabric', value: `${order.totalFabricGreige || 0}m` },
    { label: 'Accessories BOM', value: 'Requisition Generated' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 10500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeInModal 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUpModal {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          animation: 'slideUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
      >
        {/* Top colored accent line */}
        <div
          style={{
            height: '6px',
            background: 'linear-gradient(90deg, #ea580c 0%, #2e37a4 50%, #9333ea 100%)'
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background 0.2s'
          }}
          title="Close (Esc)"
        >
          <i className="ti ti-x"></i>
        </button>

        <div style={{ padding: '28px 24px 24px' }}>
          {/* Centered Icon badge */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                margin: '0 auto',
                borderRadius: '20px',
                backgroundColor: '#fff7ed',
                border: '2px solid #ffedd5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                boxShadow: '0 10px 20px -5px rgba(234, 88, 12, 0.15)'
              }}
            >
              {icon}
            </div>
            <div style={{ marginTop: '14px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  borderRadius: '9999px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                <i className="ti ti-check" style={{ fontSize: '13px' }}></i> {badgeText}
              </span>
            </div>
          </div>

          {/* Heading & Message */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h4
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '8px'
              }}
            >
              {title}
            </h4>
            <p
              style={{
                fontSize: '13.5px',
                color: '#475569',
                lineHeight: 1.5,
                margin: 0,
                padding: '0 8px'
              }}
            >
              {message || `Material Request and Accessories Order generated for ${order.styleName || 'Kurta Style'} (${order.id || ''})!`}
            </p>
          </div>

          {/* Details Summary Card */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {defaultDetails.map((det, idx) => (
                <div key={idx} style={{ fontSize: '12.5px' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: 500 }}>
                    {det.label}
                  </span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>
                    {det.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                if ((actionType === 'Create PO' || actionType === 'QC Batch') && onNavigate) {
                  onNavigate();
                }
                onClose();
              }}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#2e37a4',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(46, 55, 164, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <i className="ti ti-check" style={{ fontSize: '16px' }}></i>
              <span>{actionType === 'Create PO' ? 'Proceed to PO' : actionType === 'QC Batch' ? 'Proceed to QC' : 'OK, Got It'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
