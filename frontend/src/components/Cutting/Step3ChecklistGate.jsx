import React from 'react';
import {
  CHECKLIST_ITEMS,
  getChecklistCount,
  isChecklistComplete
} from '../../data/cuttingData';

/**
 * Step 3: Mandatory Cutting Master Checklist Gate (Hard Gate)
 * Process stays blocked until BOTH Marking Master and Checking Master mark every row OK
 * and Cutting Master acknowledges & accepts the PO.
 */
export default function Step3ChecklistGate({
  rec,
  onUpdateRec,
  onProceedToStep4,
  showToast
}) {
  const completedCount = getChecklistCount(rec);
  const allBoxesChecked = CHECKLIST_ITEMS.every(
    (i) => Boolean(rec.checklist?.marking?.[i.id]) && Boolean(rec.checklist?.checking?.[i.id])
  );
  const gatePassed = isChecklistComplete(rec);

  const toggleBox = (role, id) => {
    const prevVal = Boolean(rec.checklist?.[role]?.[id]);
    const nextRoleMap = { ...(rec.checklist?.[role] || {}), [id]: !prevVal };
    const tsKey = role === 'marking' ? 'markingTimestamps' : 'checkingTimestamps';
    const nextTsMap = {
      ...(rec.checklist?.[tsKey] || {}),
      [id]: !prevVal ? new Date().toLocaleDateString() : null
    };
    const nextChecklist = {
      ...rec.checklist,
      [role]: nextRoleMap,
      [tsKey]: nextTsMap
    };
    if (prevVal) {
      nextChecklist.acceptedByCuttingMaster = false;
    }
    onUpdateRec({ checklist: nextChecklist });
  };

  const handleMarkBothOK = () => {
    const m = {};
    const c = {};
    const mTs = {};
    const cTs = {};
    const today = new Date().toLocaleDateString();
    CHECKLIST_ITEMS.forEach((item) => {
      m[item.id] = true;
      c[item.id] = true;
      mTs[item.id] = today;
      cTs[item.id] = today;
    });
    onUpdateRec({
      checklist: {
        ...rec.checklist,
        marking: m,
        checking: c,
        markingTimestamps: mTs,
        checkingTimestamps: cTs,
        patternDiffersFromSample: false,
        sirApprovalGranted: true,
        acceptedByCuttingMaster: true,
        acceptedAt: today
      }
    });
    if (showToast) showToast('Both Masters marked OK & Cutting Master accepted PO.', 'success');
  };

  const handlePause = () => {
    const pausedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    onUpdateRec({
      checklist: {
        ...rec.checklist,
        pausedAt
      }
    });
    if (showToast) showToast('Checklist progress saved. Process remains paused until both masters finish.', 'info');
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="card border-0 shadow-sm p-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fs-10 text-uppercase mb-1">
              Step 3 · Hard Gate (Process Blocked Until Both Masters OK)
            </span>
            <h4 className="fw-bold text-dark mb-1">
              CHECKLIST FOR MASTER JI (Marking &amp; Checking Master)
            </h4>
            <p className="text-secondary fs-12 mb-0">
              Both Marking Master and Checking Master must verify all rows before Cutting Master accepts PO.
            </p>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <button
              type="button"
              onClick={handleMarkBothOK}
              className="btn btn-outline-primary btn-sm px-3 fw-semibold d-flex align-items-center gap-1"
            >
              <i className="ti ti-checks fs-14"></i>
              <span>Mark Both Masters OK</span>
            </button>
            <button
              type="button"
              onClick={handlePause}
              className="btn btn-light border btn-sm px-3 text-secondary fw-semibold d-flex align-items-center gap-1"
            >
              <i className="ti ti-player-pause fs-14"></i>
              <span>Pause &amp; Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pattern Differs Check */}
      <div className="card border-0 shadow-sm p-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <label className="d-flex align-items-center gap-2 fw-bold text-dark fs-12 mb-0" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(rec.checklist?.patternDiffersFromSample)}
              onChange={(e) => {
                const checked = e.target.checked;
                onUpdateRec({
                  checklist: {
                    ...rec.checklist,
                    patternDiffersFromSample: checked,
                    sirApprovalGranted: !checked
                  }
                });
              }}
              style={{ width: 16, height: 16 }}
            />
            <span>
              Pattern differs from approved sample?{' '}
              <span className="text-secondary fw-normal">(If different, cut only after Sir&apos;s approval)</span>
            </span>
          </label>

          {rec.checklist?.patternDiffersFromSample ? (
            <button
              type="button"
              onClick={() =>
                onUpdateRec({
                  checklist: {
                    ...rec.checklist,
                    sirApprovalGranted: !rec.checklist?.sirApprovalGranted
                  }
                })
              }
              className={`btn btn-sm px-3 fw-bold ${
                rec.checklist?.sirApprovalGranted ? 'btn-success' : 'btn-outline-danger'
              }`}
            >
              {rec.checklist?.sirApprovalGranted
                ? '✓ Sir / Authority Approval Recorded'
                : '⚠ Click to Record Sir / Authority Approval'}
            </button>
          ) : (
            <span className="badge bg-success-subtle text-success border border-success-subtle fs-11">
              Pattern Matches Sample (100% OK)
            </span>
          )}
        </div>
      </div>

      {/* Checklist Table */}
      <div className="card border border-dark shadow-sm overflow-hidden">
        <div className="p-3 bg-light border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span className="fw-bold text-dark fs-12 text-uppercase">
            Style Name: {rec.selectedStyle || '—'} ({rec.selectedColor || '—'}) — Mandatory Pre-Layer Verification
          </span>
          <span
            className={`badge font-monospace fs-11 ${
              allBoxesChecked
                ? 'bg-success-subtle text-success border border-success-subtle'
                : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
            }`}
          >
            {completedCount} / {CHECKLIST_ITEMS.length * 2} Ticks Completed
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered align-middle mb-0 fs-12">
            <thead>
              <tr className="text-center">
                <th style={{ width: 50 }}>#</th>
                <th className="text-start">Instruction</th>
                <th style={{ width: 180 }}>
                  Marking Master
                  <div className="text-primary fs-10 fw-semibold">Marking Master OK</div>
                </th>
                <th style={{ width: 180 }}>
                  Checking Master
                  <div className="text-success fs-10 fw-semibold">Checking Master OK</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {CHECKLIST_ITEMS.map((item) => {
                const mOk = Boolean(rec.checklist?.marking?.[item.id]);
                const cOk = Boolean(rec.checklist?.checking?.[item.id]);
                return (
                  <tr key={item.id}>
                    <td className="text-center font-monospace fw-bold">{item.id}</td>
                    <td>
                      <div className="fw-bold text-dark fs-13">{item.en}</div>
                    </td>
                    <td className="text-center">
                      <label className="d-inline-flex flex-column align-items-center gap-1 mb-0" style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={mOk}
                          onChange={() => toggleBox('marking', item.id)}
                          style={{ width: 18, height: 18 }}
                        />
                        <span className={`font-monospace fs-10 ${mOk ? 'text-primary fw-bold' : 'text-muted'}`}>
                          {mOk ? `SIGNED OK` : 'Pending'}
                        </span>
                      </label>
                    </td>
                    <td className="text-center">
                      <label className="d-inline-flex flex-column align-items-center gap-1 mb-0" style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={cOk}
                          onChange={() => toggleBox('checking', item.id)}
                          style={{ width: 18, height: 18 }}
                        />
                        <span className={`font-monospace fs-10 ${cOk ? 'text-success fw-bold' : 'text-muted'}`}>
                          {cOk ? `SIGNED OK` : 'Pending'}
                        </span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Acceptance */}
        <div className="p-3 bg-light border-top d-flex flex-wrap align-items-center justify-content-between gap-3">
          <label className="d-inline-flex align-items-center gap-2 fw-bold text-dark fs-12 mb-0" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean(rec.checklist?.acceptedByCuttingMaster)}
              disabled={!allBoxesChecked}
              onChange={(e) =>
                onUpdateRec({
                  checklist: {
                    ...rec.checklist,
                    acceptedByCuttingMaster: e.target.checked,
                    acceptedAt: e.target.checked ? new Date().toLocaleDateString() : null
                  }
                })
              }
              style={{ width: 18, height: 18 }}
            />
            <span>Cutting Master Acknowledges &amp; Accepts PO ({rec.poNumber})</span>
          </label>

          <button
            type="button"
            disabled={!gatePassed}
            onClick={onProceedToStep4}
            className={`btn btn-sm px-4 fw-bold d-flex align-items-center gap-2 ${
              gatePassed ? 'btn-primary' : 'btn-light border text-muted'
            }`}
          >
            <span>Unlock Step 4: Cutting Sheet</span>
            <i className="ti ti-arrow-right fs-14"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
