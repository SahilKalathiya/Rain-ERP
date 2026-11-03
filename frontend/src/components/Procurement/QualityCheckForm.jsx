import React, { useState } from 'react';

/**
 * QualityCheckForm - 6.0 Quality Check (QC) Module
 * Handles: Auto-generated from GRN, Scope (Whole Shipment / Bale / Piece),
 * Persistent expected width & fold notes, Photo attachment (File / Camera simulation),
 * 3-way status outcome: OK, Send for Admin Approval, Reject.
 */
export default function QualityCheckForm({
  qc,
  grns = [],
  purchaseOrders = [],
  fabrics = [],
  currentUser = { name: '', role: 'Quality Inspector' },
  onBack,
  onSaveQC,
  onNavigateToStockPool,
  onNavigateToGRN
}) {
  const isExisting = Boolean(qc && qc.id);
  const [successModalData, setSuccessModalData] = useState(null);

  // Helper to resolve expected Fold & Width from GRN's linked POs
  const getExpectedFromGRN = (grnId) => {
    const foundGRN = grns.find((g) => g.id === grnId);

    let foundFold = null;
    let foundWidth = null;

    const poIds = (foundGRN?.linkedPOs && foundGRN.linkedPOs.length > 0)
      ? foundGRN.linkedPOs
      : (foundGRN?.poId
          ? [foundGRN.poId]
          : (qc?.againstRef
              ? qc.againstRef.split(',').map((s) => s.trim())
              : (qc?.poId ? [qc.poId] : [])));

    let linkedPO = purchaseOrders.find((p) => poIds.includes(p.id));

    // Fallback search across all POs if direct ID was not matched
    const rawTarget = qc?.fabricName || foundGRN?.fabricName || '';
    const targetFabric = rawTarget
      .replace(/^\[[^\]]+\]\s*/, '')
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/\s*—.*$/, '')
      .trim()
      .toLowerCase();

    if (!linkedPO && purchaseOrders.length > 0) {
      if (targetFabric) {
        linkedPO = purchaseOrders.find((p) =>
          (p.items || []).some((it) => {
            const itName = (it.fabricName || it.fabricQuality || '')
              .replace(/^\[[^\]]+\]\s*/, '')
              .replace(/\s*\([^)]*\)/g, '')
              .replace(/\s*—.*$/, '')
              .trim()
              .toLowerCase();
            return itName === targetFabric || targetFabric.includes(itName) || itName.includes(targetFabric);
          })
        );
      }
      if (!linkedPO) {
        linkedPO = purchaseOrders[0];
      }
    }

    if (linkedPO && linkedPO.items && linkedPO.items.length > 0) {
      const matchedItem = targetFabric
        ? linkedPO.items.find((it) => {
            const itName = (it.fabricName || it.fabricQuality || '')
              .replace(/^\[[^\]]+\]\s*/, '')
              .replace(/\s*\([^)]*\)/g, '')
              .replace(/\s*—.*$/, '')
              .trim()
              .toLowerCase();
            return itName === targetFabric || targetFabric.includes(itName) || itName.includes(targetFabric);
          }) || linkedPO.items[0]
        : linkedPO.items[0];

      const item = matchedItem || linkedPO.items[0];
      if (item.fold !== undefined && item.fold !== null && String(item.fold).trim() !== '') {
        foundFold = String(item.fold).replace(/%/g, '').trim();
      }
      if (item.width !== undefined && item.width !== null && String(item.width).trim() !== '') {
        foundWidth = String(item.width).replace(/"/g, '').trim();
      }
    }

    if (!foundWidth && foundGRN?.width) {
      foundWidth = String(foundGRN.width).replace(/"/g, '').trim();
    }
    if (!foundWidth && foundGRN?.pannaWidth) {
      foundWidth = String(foundGRN.pannaWidth).replace(/"/g, '').trim();
    }

    if (!foundFold && foundGRN?.fold) {
      foundFold = String(foundGRN.fold).replace(/%/g, '').trim();
    }
    if (!foundFold && foundGRN?.fabricFolding) {
      foundFold = String(foundGRN.fabricFolding).replace(/%/g, '').trim();
    }

    if (!foundWidth && targetFabric) {
      const matchingFabric = fabrics.find((f) => {
        const qName = (f.qualityName || '').toLowerCase();
        return qName === targetFabric || targetFabric.includes(qName) || qName.includes(targetFabric);
      });
      if (matchingFabric && matchingFabric.pannaWidth) {
        foundWidth = String(matchingFabric.pannaWidth).replace(/"/g, '').trim();
      }
    }

    return {
      fold: foundFold || (qc?.expectedFold ? String(qc.expectedFold).replace(/%/g, '').trim() : '100'),
      width: foundWidth || (qc?.expectedWidth ? String(qc.expectedWidth).replace(/"/g, '').trim() : '44')
    };
  };

  const initialGrnId = qc?.grnRef || grns[0]?.id || 'GRN-0001';
  const initialExpected = getExpectedFromGRN(initialGrnId);

  const [formData, setFormData] = useState({
    id: qc?.id || `QC-${String(Math.floor(1000 + Math.random() * 9000))}`,
    grnRef: initialGrnId,
    inspectionScope: qc?.inspectionScope || 'Whole Shipment', // Whole Shipment / Bale-Level / Piece-Level
    baleRef: qc?.baleRef || 'Bale 01',
    pieceRef: qc?.pieceRef || 'Piece 01',
    inspectorName: (qc?.inspectorName && qc.inspectorName !== 'Saksham Garg') ? qc.inspectorName : (currentUser.name && currentUser.name !== 'Saksham Garg' ? currentUser.name : ''),
    expectedWidth: initialExpected.width,
    actualWidth: qc?.actualWidth !== undefined && qc?.actualWidth !== null ? String(qc.actualWidth) : '',
    expectedFold: initialExpected.fold,
    actualFold: qc?.actualFold !== undefined && qc?.actualFold !== null ? String(qc.actualFold) : '',
    photos: qc?.photos || [],
    notes: (qc?.notes && !qc.notes.startsWith('Quality inspection generated')) ? qc.notes : '',
    defectPieces: qc?.defectPieces || '',
    defectQty: qc?.defectQty || '',
    defectReason: qc?.defectReason || '',
    qcStatus: qc?.qcStatus || 'OK', // OK / Send for Admin Approval / Reject
    adminDecision: qc?.adminDecision || '', // Approve / Reject
    adminRemarks: qc?.adminRemarks || '',
    dateTime: qc?.dateTime || new Date().toLocaleString('en-GB')
  });

  const [pieceInspections, setPieceInspections] = useState(qc?.pieceInspections || {});
  const [toastNotification, setToastNotification] = useState(null);

  // Dropdown states for Bale / Piece-level inspection (Requirement 24)
  const [selectedBaleFilter, setSelectedBaleFilter] = useState('');
  const [selectedPieceKey, setSelectedPieceKey] = useState('');
  const [inspectionScope, setInspectionScope] = useState(() => {
    if (qc?.inspectionScope === 'Piece-Level' || qc?.inspectionScope === 'piece') return 'piece';
    if (qc?.inspectionScope === 'Bale-Level' || qc?.inspectionScope === 'bale') return 'bale';
    return 'all';
  });

  // Real Camera Capture States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraTargetKey, setCameraTargetKey] = useState('shipment'); // 'shipment' or piece key like '0_0'
  const [cameraError, setCameraError] = useState(null);
  const videoRef = React.useRef(null);
  const cameraStreamRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  React.useEffect(() => {
    if (isCameraActive && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [isCameraActive]);

  const showToast = (message, type = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 3200);
  };

  React.useEffect(() => {
    if (qc && qc.id) {
      const exp = getExpectedFromGRN(qc.grnRef);
      setFormData({
        id: qc.id,
        grnRef: qc.grnRef,
        inspectionScope: qc.inspectionScope || 'Whole Shipment',
        baleRef: qc.baleRef || 'Bale 01',
        pieceRef: qc.pieceRef || 'Piece 01',
        inspectorName: (qc.inspectorName && qc.inspectorName !== 'Saksham Garg') ? qc.inspectorName : '',
        expectedWidth: exp.width,
        actualWidth: qc.actualWidth !== undefined && qc.actualWidth !== null ? String(qc.actualWidth) : '',
        expectedFold: exp.fold,
        actualFold: qc.actualFold !== undefined && qc.actualFold !== null ? String(qc.actualFold) : '',
        photos: qc.photos || [],
        notes: (qc.notes && !qc.notes.startsWith('Quality inspection generated')) ? qc.notes : '',
        defectPieces: qc.defectPieces || '',
        defectQty: qc.defectQty || '',
        defectReason: qc.defectReason || '',
        qcStatus: qc.qcStatus || 'OK',
        adminDecision: qc.adminDecision || '',
        adminRemarks: qc.adminRemarks || '',
        dateTime: qc.dateTime || new Date().toLocaleString('en-GB')
      });
      if (qc.pieceInspections) {
        setPieceInspections(qc.pieceInspections);
      }
    } else {
      const exp = getExpectedFromGRN(initialGrnId);
      setFormData((prev) => ({
        ...prev,
        grnRef: initialGrnId,
        expectedWidth: exp.width,
        actualWidth: '',
        expectedFold: exp.fold,
        actualFold: ''
      }));
    }
  }, [qc, purchaseOrders, grns]);

  const handleGRNChange = (newGrnId) => {
    const expected = getExpectedFromGRN(newGrnId);
    setFormData((prev) => ({
      ...prev,
      grnRef: newGrnId,
      expectedWidth: expected.width,
      actualWidth: '',
      expectedFold: expected.fold,
      actualFold: ''
    }));
  };

  const selectedGRN = grns.find((g) => g.id === formData.grnRef) || grns[0];

  // Extract physical pieces from selected GRN bales (scoped to fabric when specified)
  const grnPieces = [];
  (selectedGRN?.bales || []).forEach((b, bIdx) => {
    if (qc?.fabricName && b.fabricItemLabel) {
      const normBale = b.fabricItemLabel.toLowerCase().trim();
      const normQc = qc.fabricName.toLowerCase().trim();
      const idxMatches = (qc._poItemIndex !== undefined && b.itemIdx === qc._poItemIndex) ||
                         (qc.itemIdx !== undefined && b.itemIdx === qc.itemIdx);
      if (!idxMatches && !normBale.includes(normQc) && !normQc.includes(normBale)) {
        return;
      }
    }
    (b.pieces || []).forEach((p, pIdx) => {
      const m = typeof p === 'object' && p !== null ? (p.length || 0) : Number(p) || 0;
      grnPieces.push({
        key: `${bIdx}_${pIdx}`,
        baleIdx: bIdx,
        pieceIdx: pIdx,
        baleNo: b.baleNo || `${bIdx + 1}`,
        pieceNo: (typeof p === 'object' && p?.pieceNo) ? p.pieceNo : `Piece ${pIdx + 1}`,
        meters: m
      });
    });
  });

  // Fallback: If no pieces matched specific fabric filter, show all pieces
  if (grnPieces.length === 0 && (selectedGRN?.bales || []).length > 0) {
    (selectedGRN?.bales || []).forEach((b, bIdx) => {
      (b.pieces || []).forEach((p, pIdx) => {
        const m = typeof p === 'object' && p !== null ? (p.length || 0) : Number(p) || 0;
        grnPieces.push({
          key: `${bIdx}_${pIdx}`,
          baleIdx: bIdx,
          pieceIdx: pIdx,
          baleNo: b.baleNo || `${bIdx + 1}`,
          pieceNo: (typeof p === 'object' && p?.pieceNo) ? p.pieceNo : `Piece ${pIdx + 1}`,
          meters: m
        });
      });
    });
  }

  // Unique bale numbers for dropdown selection (Requirement 24)
  const uniqueBaleNumbers = Array.from(new Set(grnPieces.map((p) => String(p.baleNo)))).sort((a, b) => Number(a) - Number(b));

  // Filtered pieces based on dropdown option (Requirement 24)
  const displayedPieces = grnPieces.filter((pc) => {
    if (!selectedBaleFilter && !selectedPieceKey) {
      return false;
    }
    if (selectedBaleFilter !== 'all' && String(pc.baleNo) !== String(selectedBaleFilter)) {
      return false;
    }
    if (selectedPieceKey && pc.key !== selectedPieceKey) {
      return false;
    }
    return true;
  });

  // Handlers for Bale / Piece dropdown selection (Requirement 24)
  const handleBaleFilterChange = (val) => {
    if (val && val.startsWith('piece:')) {
      const pKey = val.replace('piece:', '');
      setSelectedPieceKey(pKey);
      const targetPc = grnPieces.find((p) => p.key === pKey);
      if (targetPc) {
        setSelectedBaleFilter(String(targetPc.baleNo));
        setPieceInspections((prev) => {
          const cur = prev[pKey] || {};
          const expW = formData.actualWidth || formData.expectedWidth || '44';
          const expF = formData.actualFold || formData.expectedFold || '100';
          return {
            ...prev,
            [pKey]: {
              ...cur,
              checked: true,
              actualWidth: cur.actualWidth || expW,
              actualFold: cur.actualFold || expF,
              status: cur.status || 'OK'
            }
          };
        });
      }
    } else {
      setSelectedBaleFilter(val);
      setSelectedPieceKey('');
    }
  };

  const handlePieceSelectChange = (val) => {
    setSelectedPieceKey(val);
    if (val) {
      const targetPc = grnPieces.find((p) => p.key === val);
      if (targetPc) {
        setSelectedBaleFilter(String(targetPc.baleNo));
        setPieceInspections((prev) => {
          const cur = prev[val] || {};
          const expW = formData.actualWidth || formData.expectedWidth || '44';
          const expF = formData.actualFold || formData.expectedFold || '100';
          return {
            ...prev,
            [val]: {
              ...cur,
              checked: true,
              actualWidth: cur.actualWidth || expW,
              actualFold: cur.actualFold || expF,
              status: cur.status || 'OK'
            }
          };
        });
      }
    }
  };

  const handleInspectionScopeChange = (scopeVal) => {
    setInspectionScope(scopeVal);
    if (scopeVal === 'all') {
      setSelectedBaleFilter('all');
      setSelectedPieceKey('');
    } else if (scopeVal === 'piece') {
      handleBatchCheckAll(true);
    }
  };

  const updatePieceField = (key, field, val) => {
    setPieceInspections((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {
          checked: true,
          actualWidth: '',
          actualFold: '',
          status: 'OK',
          notes: '',
          photos: []
        }),
        [field]: val
      }
    }));
  };

  // Batch actions for listed pieces in QC toolbar
  const handleBatchCheckAll = (shouldCheck) => {
    const expW = formData.actualWidth || formData.expectedWidth || '44';
    const expF = formData.actualFold || formData.expectedFold || '100';
    setPieceInspections((prev) => {
      const updated = { ...prev };
      displayedPieces.forEach((pc) => {
        const cur = updated[pc.key] || {};
        updated[pc.key] = {
          ...cur,
          checked: shouldCheck,
          actualWidth: (shouldCheck && !cur.actualWidth) ? expW : (cur.actualWidth || ''),
          actualFold: (shouldCheck && !cur.actualFold) ? expF : (cur.actualFold || ''),
          status: cur.status || 'OK'
        };
      });
      return updated;
    });
    showToast(shouldCheck ? `Checked all ${displayedPieces.length} pieces.` : 'Unchecked all pieces.', 'info');
  };

  const handleBatchFillExpected = () => {
    const expW = formData.actualWidth || formData.expectedWidth || '44';
    const expF = formData.actualFold || formData.expectedFold || '100';
    setPieceInspections((prev) => {
      const updated = { ...prev };
      displayedPieces.forEach((pc) => {
        const cur = updated[pc.key] || {};
        updated[pc.key] = {
          ...cur,
          checked: true,
          actualWidth: expW,
          actualFold: expF,
          status: cur.status || 'OK'
        };
      });
      return updated;
    });
    showToast(`Filled expected Width (${expW}") and Fold (${expF}%) for all listed pieces.`, 'success');
  };

  const handleBatchMarkStatus = (newStatus = 'OK') => {
    const expW = formData.actualWidth || formData.expectedWidth || '44';
    const expF = formData.actualFold || formData.expectedFold || '100';
    setPieceInspections((prev) => {
      const updated = { ...prev };
      displayedPieces.forEach((pc) => {
        const cur = updated[pc.key] || {};
        updated[pc.key] = {
          ...cur,
          checked: true,
          actualWidth: cur.actualWidth || expW,
          actualFold: cur.actualFold || expF,
          status: newStatus
        };
      });
      return updated;
    });
    showToast(`Marked listed pieces as ${newStatus}.`, 'success');
  };


  // Photo Upload via FileReader (Base64 persists cleanly across reloads & admin reviews)
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newPhoto = {
          name: f.name,
          url: ev.target.result,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, newPhoto]
        }));
      };
      reader.readAsDataURL(f);
    });
    e.target.value = '';
    showToast(`${files.length} photo(s) attached`, 'success');
  };

  const handlePiecePhotoUpload = (key, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newPhoto = {
          name: f.name,
          url: ev.target.result,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setPieceInspections((prev) => {
          const cur = prev[key] || { photos: [] };
          return {
            ...prev,
            [key]: {
              ...cur,
              photos: [...(cur.photos || []), newPhoto]
            }
          };
        });
      };
      reader.readAsDataURL(f);
    });
    e.target.value = '';
    showToast(`${files.length} piece photo(s) attached`, 'success');
  };

  // Remove Photo handlers (Cancel uploaded / captured photo)
  const handleRemoveShipmentPhoto = (idxToRemove) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== idxToRemove)
    }));
    showToast('Photo removed', 'info');
  };

  const handleRemovePiecePhoto = (pieceKey, idxToRemove) => {
    setPieceInspections((prev) => {
      const cur = prev[pieceKey] || { photos: [] };
      return {
        ...prev,
        [pieceKey]: {
          ...cur,
          photos: (cur.photos || []).filter((_, idx) => idx !== idxToRemove)
        }
      };
    });
    showToast('Piece photo removed', 'info');
  };

  // Real Laptop Camera Stream & Capture
  const handleOpenCamera = (targetKey = 'shipment') => {
    setCameraTargetKey(targetKey);
    setIsCameraActive(true);
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Webcam is not supported by your browser or environment. Please choose a file instead.');
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment'
      }
    })
    .then((stream) => {
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    })
    .catch((err) => {
      console.warn('Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera permissions in your browser bar, or choose an image file.'
          : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
          ? 'No camera/webcam was detected on this laptop/device. Please upload an image file instead.'
          : 'Unable to start camera. Please verify device permissions or upload an image file.'
      );
    });
  };

  const handleCloseCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    const nowStr = new Date().toISOString().replace(/[:.]/g, '-');
    const newPhoto = {
      name: `Camera_Capture_${nowStr.slice(0, 19)}.jpg`,
      url: dataUrl,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (cameraTargetKey === 'shipment') {
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, newPhoto]
      }));
      showToast('Camera photo attached to QC record!', 'success');
    } else {
      setPieceInspections((prev) => {
        const cur = prev[cameraTargetKey] || { photos: [] };
        return {
          ...prev,
          [cameraTargetKey]: {
            ...cur,
            photos: [...(cur.photos || []), newPhoto]
          }
        };
      });
      showToast('Piece camera snapshot captured and attached!', 'success');
    }

    handleCloseCamera();
  };

  // Calculation of Piece Split & Quality Quantities
  const inspectedList = Object.entries(pieceInspections)
    .filter(([_, d]) => d.checked)
    .map(([k, d]) => {
      const pcObj = grnPieces.find((p) => p.key === k);
      return {
        key: k,
        baleNo: pcObj?.baleNo,
        pieceNo: pcObj?.pieceNo,
        meters: Number(pcObj?.meters) || 0,
        actualWidth: d.actualWidth,
        actualFold: d.actualFold,
        status: d.status,
        notes: d.notes,
        photos: d.photos
      };
    });

  const totalReceivedMeters = Number(qc?.totalReceivedMeters) ||
    Number(qc?.receivedQty) ||
    (grnPieces.length > 0 ? grnPieces.reduce((sum, p) => sum + (Number(p.meters) || 0), 0) : 0) ||
    Number(selectedGRN?.declaredTotalMeters) ||
    Number(selectedGRN?.totalMetersEntered) || 0;

  const declaredTotalMeters = Number(qc?.totalReceivedMeters) ||
    Number(qc?.receivedQty) ||
    Number(selectedGRN?.totalQty) ||
    Number(selectedGRN?.declaredTotalMeters) || 0;

  // Requirement 21: QC should not proceed until total quantity entered in GRN has complete bale entries
  const grnPiecesSum = grnPieces.reduce((sum, p) => sum + (Number(p.meters) || 0), 0);
  const isBaleCompletenessOk = declaredTotalMeters <= 0 || (
    totalReceivedMeters > 0 && (
      Math.abs(totalReceivedMeters - declaredTotalMeters) < 0.01 ||
      (grnPiecesSum > 0 && Math.abs(grnPiecesSum - totalReceivedMeters) < 0.01)
    )
  );

  // Pieces flagged for Admin Review or Rejection
  const issuePieces = inspectedList.filter((p) => p.status !== 'OK');
  const pieceQtyHeldBack = issuePieces.reduce((sum, p) => sum + p.meters, 0);
  const flatDefectQty = Number(formData.defectQty) || 0;
  const totalHeldBackMeters = pieceQtyHeldBack + flatDefectQty;
  const goodMeters = Math.max(0, totalReceivedMeters - totalHeldBackMeters);
  // Helper for numeric parsing & comparison
  const parseNum = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const cleaned = String(val).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const expWidthClean = String(formData.expectedWidth || '44').replace(/"/g, '').trim();
  const expWidthNum = parseNum(expWidthClean);
  const actualWidthNum = parseNum(formData.actualWidth);
  const hasWidth = formData.actualWidth !== undefined && formData.actualWidth !== null && String(formData.actualWidth).trim() !== '';
  const isWidthMismatch = hasWidth && (actualWidthNum === null || expWidthNum === null || Math.abs(actualWidthNum - expWidthNum) > 0.01);
  const isWidthMatch = hasWidth && !isWidthMismatch;

  const expFoldClean = String(formData.expectedFold || '100').replace(/%/g, '').trim();
  const expFoldNum = parseNum(expFoldClean);
  const actualFoldNum = parseNum(formData.actualFold);
  const hasFold = formData.actualFold !== undefined && formData.actualFold !== null && String(formData.actualFold).trim() !== '';
  const isFoldMismatch = hasFold && (actualFoldNum === null || expFoldNum === null || Math.abs(actualFoldNum - expFoldNum) > 0.01);
  const isFoldMatch = hasFold && !isFoldMismatch;

  // Requirement: Checker Name, Width, and Fold are strictly MANDATORY before stock can be added
  const hasChecker = Boolean(formData.inspectorName && formData.inspectorName.trim() !== '');
  const isInspectionDetailsComplete = hasChecker && hasWidth && hasFold;

  const missingInspectionFields = [];
  if (!hasChecker) missingInspectionFields.push('Checker Name');
  if (!hasWidth) missingInspectionFields.push('Width found');
  if (!hasFold) missingInspectionFields.push('Fold found');

  // Requirement 23: Exception mismatch detection
  const hasAnyMismatch = isWidthMismatch || isFoldMismatch;
  const isQcFinalized = Boolean(qc && (qc.adminDecision || qc.qcStatus === 'Approved' || qc.qcStatus === 'OK' || qc.qcStatus === 'Reject' || qc.qcStatus === 'Partial OK'));

  const handleSubmit = (statusOverride) => {
    const effectiveStatus = (typeof statusOverride === 'string') ? statusOverride : formData.qcStatus;

    // Strict validation: Until Checker Name, Width, and Fold are entered, NO action can proceed
    if (!isInspectionDetailsComplete) {
      showToast(`Please enter ${missingInspectionFields.join(', ')} before proceeding.`, 'warning');
      return;
    }

    if (effectiveStatus === 'OK' && flatDefectQty > 0 && !formData.defectReason.trim()) {
      showToast('Please enter a defect reason for the defective quantity in the flat entry box.', 'warning');
      return;
    }

    // Requirement 23: During QC, if exceptions do not match, the option to add stock should be hidden or disabled.
    if (effectiveStatus === 'OK' && hasAnyMismatch) {
      showToast('Cannot add stock: Width or Fold exception does not match PO specification. Please submit for Admin Approval or Reject.', 'warning');
      return;
    }

    // Requirement 21: QC should not proceed until total quantity entered in GRN has complete bale entries.
    if (effectiveStatus === 'OK' && !isBaleCompletenessOk) {
      showToast(`Cannot add stock: Total quantity declared in GRN (${declaredTotalMeters}m) has incomplete bale entries (${totalReceivedMeters}m). Please complete all bale entries in GRN first.`, 'warning');
      return;
    }

    let finalStatus = effectiveStatus;
    let finalGoodQty = 0;
    let finalHeldBackQty = 0;

    if (effectiveStatus === 'OK') {
      finalStatus = totalHeldBackMeters > 0 ? 'Partial OK' : 'OK';
      finalGoodQty = goodMeters;
      finalHeldBackQty = totalHeldBackMeters;
    } else if (effectiveStatus === 'Send for Admin Approval' || (hasAnyMismatch && effectiveStatus !== 'Reject' && effectiveStatus !== 'Approved')) {
      finalStatus = 'Pending Admin Approval';
      finalGoodQty = 0;
      finalHeldBackQty = totalReceivedMeters;
    } else if (effectiveStatus === 'Approved') {
      finalStatus = 'Approved';
      finalGoodQty = goodMeters;
      finalHeldBackQty = totalHeldBackMeters;
    } else if (effectiveStatus === 'Reject') {
      finalStatus = 'Reject';
      finalGoodQty = 0;
      finalHeldBackQty = totalReceivedMeters;
    }

    // Requirement: Gather all photos from shipment and piece-level inspections
    const piecePhotos = Object.values(pieceInspections || {}).flatMap((p) => p?.photos || []);
    const allCombinedPhotos = [...(formData.photos || []), ...piecePhotos];
    const uniquePhotos = Array.from(new Map(allCombinedPhotos.map((p) => [p.url || p.name, p])).values());

    const payload = {
      ...formData,
      photos: uniquePhotos,
      inspectorName: (formData.inspectorName || '').replace(/(?:^|\s)\S/g, (c) => c.toUpperCase()).trim(),
      qcStatus: finalStatus,
      hasDiscrepancy: hasAnyMismatch,
      discrepancyType: isWidthMismatch && isFoldMismatch ? 'Width & Fold Mismatch' : (isWidthMismatch ? 'Width Mismatch' : (isFoldMismatch ? 'Fold Mismatch' : 'None')),
      actualWidth: actualWidthNum !== null ? actualWidthNum : (Number(formData.actualWidth) || 0),
      actualFold: actualFoldNum !== null ? actualFoldNum : (Number(formData.actualFold) || 100),
      expectedWidth: expWidthClean,
      expectedFold: expFoldClean,
      pieceInspections,
      inspectedPieces: inspectedList,
      totalReceivedMeters,
      goodQty: finalGoodQty,
      heldBackQty: finalHeldBackQty,
      issuePieces,
      flatDefectQty,
      defectReason: formData.defectReason,
      decidedAt: new Date().toLocaleDateString('en-GB')
    };

    if (onSaveQC) {
      onSaveQC(payload);
    }

    if (finalStatus === 'OK' || finalStatus === 'Partial OK' || finalStatus === 'Approved') {
      setSuccessModalData({
        goodQty: goodMeters,
        heldBackQty: totalHeldBackMeters,
        issuePiecesCount: issuePieces.length,
        grnId: formData.grnRef
      });
    } else if (finalStatus === 'Pending Admin Approval') {
      showToast('Discrepancy flagged! Submitted to Admin for review & approval.', 'warning');
      setTimeout(() => {
        if (onBack) onBack();
      }, 900);
    } else {
      if (onBack) onBack();
    }
  };

  const handleMarkAllPiecesReject = () => {
    const updated = {};
    grnPieces.forEach((p, idx) => {
      const key = p.key || `pc_${idx}`;
      updated[key] = {
        ...(pieceInspections[key] || {}),
        checked: true,
        actualWidth: pieceInspections[key]?.actualWidth || formData.actualWidth || formData.expectedWidth,
        actualFold: pieceInspections[key]?.actualFold || formData.actualFold || formData.expectedFold,
        status: 'Reject',
        notes: pieceInspections[key]?.notes || 'Defective piece rejected'
      };
    });
    setPieceInspections(updated);
    setFormData((prev) => ({ ...prev, qcStatus: 'Reject' }));
    showToast('All pieces marked as Reject.', 'error');
  };

  const handleMarkAllPiecesOK = () => {
    const updated = {};
    grnPieces.forEach((p, idx) => {
      const key = p.key || `pc_${idx}`;
      updated[key] = {
        ...(pieceInspections[key] || {}),
        checked: true,
        actualWidth: pieceInspections[key]?.actualWidth || formData.actualWidth || formData.expectedWidth,
        actualFold: pieceInspections[key]?.actualFold || formData.actualFold || formData.expectedFold,
        status: 'OK',
        notes: ''
      };
    });
    setPieceInspections(updated);
    setFormData((prev) => ({ ...prev, qcStatus: 'OK' }));
    showToast('All pieces marked as OK.', 'success');
  };

  const handleRejectAll = () => {
    // Strict validation: Until Checker Name, Width, and Fold are entered, Reject cannot proceed
    if (!isInspectionDetailsComplete) {
      showToast(`Please enter ${missingInspectionFields.join(', ')} before proceeding.`, 'warning');
      return;
    }

    const updated = {};
    grnPieces.forEach((p, idx) => {
      const key = p.key || `pc_${idx}`;
      updated[key] = {
        ...(pieceInspections[key] || {}),
        checked: true,
        actualWidth: pieceInspections[key]?.actualWidth || formData.actualWidth || formData.expectedWidth,
        actualFold: pieceInspections[key]?.actualFold || formData.actualFold || formData.expectedFold,
        status: 'Reject',
        notes: pieceInspections[key]?.notes || 'Entire lot rejected'
      };
    });
    setPieceInspections(updated);

    const allRejectedList = grnPieces.map((p, idx) => {
      const key = p.key || `pc_${idx}`;
      return {
        ...p,
        ...updated[key],
        status: 'Reject'
      };
    });

    const payload = {
      ...formData,
      qcStatus: 'Reject',
      actualWidth: Number(formData.actualWidth) || 0,
      actualFold: Number(formData.actualFold) || 100,
      pieceInspections: updated,
      inspectedPieces: allRejectedList,
      totalReceivedMeters,
      goodQty: 0,
      heldBackQty: totalReceivedMeters,
      rejectedQty: totalReceivedMeters,
      issuePieces: allRejectedList,
      flatDefectQty: 0,
      defectReason: formData.defectReason || 'Entire shipment rejected during quality inspection',
      decidedAt: new Date().toLocaleDateString('en-GB')
    };

    if (onSaveQC) {
      onSaveQC(payload);
    }

    showToast('Entire item and all pieces rejected. Sent to Rejected Stock Pool.', 'error');
    setTimeout(() => {
      if (onBack) onBack();
    }, 600);
  };

  const matchedPO = purchaseOrders.find((p) => selectedGRN?.linkedPOs && selectedGRN.linkedPOs.includes(p.id));
  const againstPO = matchedPO?.id || selectedGRN?.linkedPOs?.[0] || selectedGRN?.poId || 'PO-1001';

  return (
    <div className="container-fluid p-0">
      {/* Top Header (Matches Screenshot 2) */}
      <div className="mb-4">
        <button
          type="button"
          className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold d-inline-flex align-items-center gap-1.5 fs-13 mb-2"
          style={{ color: '#5b47fb' }}
          onClick={onBack}
        >
          <i className="ti ti-arrow-left"></i>
          <span>Back to Quality Checks</span>
        </button>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-1 fs-24">
              Quality Check &mdash; {qc?.fabricName || selectedGRN?.fabricName || 'Tussar Silk (42")'} &middot; {qc?.colorName || selectedGRN?.colorName || 'Charcoal'}
            </h2>
            <p className="text-secondary fs-13 mb-0">
              {formData.grnRef} &middot; {againstPO} &middot; Received quantity <strong>{totalReceivedMeters.toLocaleString()}m</strong> across {grnPieces.length || 1} piece(s)
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span
              className={`badge px-3 py-1.5 fs-12 rounded-pill ${
                formData.qcStatus === 'OK'
                  ? 'bg-success-subtle text-success border border-success border-opacity-25'
                  : formData.qcStatus === 'Reject'
                  ? 'bg-danger-subtle text-danger border border-danger border-opacity-25'
                  : 'bg-warning-subtle text-warning border border-warning border-opacity-25'
              }`}
            >
              {formData.qcStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Requirement 21 Alert: Incomplete Bale Entries in GRN */}
      {!isBaleCompletenessOk && (
        <div className="alert alert-warning py-3 px-3.5 rounded-4 fs-13 d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 border border-warning shadow-xs">
          <div className="d-flex align-items-center gap-2.5">
            <i className="ti ti-alert-triangle fs-22 text-warning flex-shrink-0"></i>
            <div>
              <strong className="text-dark d-block">QC Locked &mdash; Incomplete Bale Entries in GRN</strong>
              <span className="text-secondary">
                Total quantity declared in GRN is <strong>{declaredTotalMeters}m</strong>, but entered bales/pieces total <strong>{totalReceivedMeters}m</strong> ({Math.abs(declaredTotalMeters - totalReceivedMeters).toFixed(1)}m difference). QC should not proceed until total quantity in GRN has complete bale entries.
              </span>
            </div>
          </div>
          <span className="badge bg-warning text-dark px-3 py-1.5 fs-11 rounded-pill fw-semibold text-nowrap">
            Incomplete Bales
          </span>
        </div>
      )}

      {/* Main Form */}
      <div style={{ maxWidth: '960px' }}>
        <form onSubmit={handleSubmit}>
          {/* CARD 1: Inspection */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <h5 className="fw-bold text-dark mb-0 fs-16">Inspection</h5>
              {isInspectionDetailsComplete ? (
                <span className="badge bg-success-subtle text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 fs-11 fw-semibold d-inline-flex align-items-center gap-1">
                  <i className="ti ti-check fs-12"></i> Ready for Action
                </span>
              ) : (
                <span className="badge bg-light text-secondary border rounded-pill px-2.5 py-1 fs-11 fw-semibold d-inline-flex align-items-center gap-1">
                  <i className="ti ti-lock fs-12 text-primary"></i> 3 Required Fields
                </span>
              )}
            </div>

            {/* Checker Name */}
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                Checker name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control fs-13 rounded-3 bg-white border"
                style={{ textTransform: 'capitalize', borderColor: '#cbd5e1' }}
                placeholder="Name of person on shift (Required)"
                value={formData.inspectorName}
                onChange={(e) => {
                  const val = e.target.value.replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
                  setFormData({ ...formData, inspectorName: val });
                }}
              />
            </div>

            {/* Side-by-side: Width Found & Fold Found with PO comparison */}
            <div className="row g-3 align-items-center mb-3">
              <div className="col-12 col-sm-auto">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1 d-block">
                  Width found <span className="text-danger">*</span>
                </label>
                <div className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 rounded-pill px-2.5 py-0.5 fs-11 mb-1.5 d-inline-block">
                  Expected: {expWidthClean}&quot;
                </div>
                <input
                  type="text"
                  className="form-control fs-13 rounded-3 bg-white border"
                  style={{ width: '160px', borderColor: '#cbd5e1' }}
                  placeholder={`e.g. ${expWidthClean} (Required)`}
                  value={formData.actualWidth}
                  onChange={(e) => setFormData({ ...formData, actualWidth: e.target.value })}
                />
              </div>

              <div className="col-12 col-sm-auto">
                <label className="form-label fs-12 fw-semibold text-secondary mb-1 d-block">
                  Fold found (%) <span className="text-danger">*</span>
                </label>
                <div className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 rounded-pill px-2.5 py-0.5 fs-11 mb-1.5 d-inline-block">
                  Expected: {expFoldClean}%
                </div>
                <input
                  type="text"
                  className="form-control fs-13 rounded-3 bg-white border"
                  style={{ width: '160px', borderColor: '#cbd5e1' }}
                  placeholder={`e.g. ${expFoldClean} (Required)`}
                  value={formData.actualFold}
                  onChange={(e) => setFormData({ ...formData, actualFold: e.target.value })}
                />
              </div>

              <div className="col-12 col-md d-flex align-items-center pt-sm-4">
                {hasAnyMismatch ? (
                  <div className="p-2.5 rounded-3 bg-warning-subtle border border-warning border-opacity-50 text-dark fw-medium fs-12 w-100">
                    <div className="d-flex align-items-center gap-1.5 mb-0.5">
                      <i className="ti ti-alert-triangle fs-16 text-warning"></i>
                      <span className="fs-12 fw-bold">Note: Width or Fold differs from PO</span>
                    </div>
                    <div className="small text-secondary">
                      {isWidthMismatch && (
                        <span>• Width: {actualWidthNum}&quot; (expected {expWidthClean}&quot;). </span>
                      )}
                      {isFoldMismatch && (
                        <span>• Fold: {actualFoldNum}% (expected {expFoldClean}%). </span>
                      )}
                    </div>
                  </div>
                ) : hasWidth && isWidthMatch && hasFold && isFoldMatch ? (
                  <div className="d-flex align-items-center gap-1.5 text-success fw-semibold fs-13">
                    <i className="ti ti-check fs-16"></i>
                    <span>Matches PO expectation (Width: {expWidthClean}&quot;, Fold: {expFoldClean}%)</span>
                  </div>
                ) : !isInspectionDetailsComplete ? (
                  <div className="d-flex align-items-center gap-1.5 text-secondary fs-12">
                    <i className="ti ti-info-circle text-primary fs-14"></i>
                    <span>Fill Checker name, Width ({expWidthClean}&quot;), and Fold ({expFoldClean}%) to unlock actions.</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-3">
              <label className="form-label fs-12 fw-semibold text-secondary mb-1">Notes</label>
              <textarea
                rows="2"
                className="form-control form-control-sm bg-light fs-13"
                placeholder="Any observations..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              ></textarea>
            </div>

            {/* Attach Photos */}
            <div>
              <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                Attach photos (more than one allowed)
              </label>
              <div className="d-flex align-items-center gap-2 p-3 border rounded-3 bg-light">
                <label className="btn btn-outline-secondary btn-sm px-3 mb-0 fs-12 cursor-pointer bg-white">
                  <i className="ti ti-upload me-1"></i> Choose File(s)
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="d-none"
                    onChange={handlePhotoUpload}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-sm text-white fs-12 d-flex align-items-center gap-1 shadow-2xs"
                  style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                  onClick={() => handleOpenCamera('shipment')}
                  title="Open Camera to capture photo"
                >
                  <i className="ti ti-camera"></i> Open Camera
                </button>
              </div>

              {formData.photos.length > 0 && (
                <div className="d-flex flex-wrap gap-2 pt-2">
                  {formData.photos.map((ph, idx) => (
                    <div
                      key={idx}
                      className="position-relative border rounded-2 p-1 bg-white shadow-xs"
                      style={{ width: '85px' }}
                    >
                      {/* Cancel / Delete photo button */}
                      <button
                        type="button"
                        className="btn btn-danger position-absolute p-0 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                        style={{
                          top: '-6px',
                          right: '-6px',
                          width: '20px',
                          height: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          lineHeight: 1,
                          zIndex: 3,
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveShipmentPhoto(idx);
                        }}
                        title="Cancel / Remove Photo"
                      >
                        &times;
                      </button>
                      <img
                        src={ph.url}
                        alt={ph.name}
                        className="rounded-1 w-100"
                        style={{ height: '65px', objectFit: 'cover' }}
                      />
                      <div
                        className="text-truncate fs-10 text-muted mt-1 text-center"
                        title={ph.name}
                      >
                        {ph.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION: BALE / PIECE-LEVEL INSPECTION (OPTIONAL) - (Matches Screenshots 3, 4, 5) */}
          <div className="card border rounded-4 p-4 mb-4 bg-white shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h5 className="fw-bold text-dark mb-0 fs-16">
                Bale / piece-level inspection
              </h5>
            </div>
            <p className="text-secondary fs-12 mb-3">
              Most shipments are checked as a whole (above). If only specific pieces need a closer look, use the dropdown below or tick pieces &mdash; each gets its own width/fold/photo/status.
            </p>

            {/* Requirement 24: Dropdown Options for Bale / Piece-level inspection */}
            {grnPieces.length > 0 && (
              <div className="bg-light p-3 rounded-3 border mb-3">
                <div className="row g-3 align-items-center">
                  {/* Dropdown 1: Select Bale */}
                  <div className="col-12 col-sm-4">
                    <label className="form-label fs-11 fw-bold text-dark text-uppercase mb-1 d-flex align-items-center gap-1">
                      <i className="ti ti-box fs-13 text-primary"></i>
                      <span>Select Bale / Filter:</span>
                    </label>
                    <select
                      className="form-select form-select-sm bg-white fs-12 border rounded-2"
                      value={selectedPieceKey ? 'piece:' + selectedPieceKey : selectedBaleFilter}
                      onChange={(e) => handleBaleFilterChange(e.target.value)}
                    >
                      <option value="">-- Select Bale --</option>
                      <option value="all">
                        All Bales ({uniqueBaleNumbers.length} {uniqueBaleNumbers.length === 1 ? 'Bale' : 'Bales'} &middot; {grnPieces.length} {grnPieces.length === 1 ? 'Piece' : 'Pieces'})
                      </option>
                      {uniqueBaleNumbers.map((bNo) => {
                        const bPieces = grnPieces.filter((p) => String(p.baleNo) === String(bNo));
                        const count = bPieces.length;
                        const meters = bPieces.reduce((s, p) => s + (Number(p.meters) || 0), 0);
                        const inspCount = bPieces.filter((p) => pieceInspections[p.key]?.checked).length;
                        return (
                          <option key={bNo} value={bNo}>
                            Bale #{bNo} &mdash; {count} {count === 1 ? 'piece' : 'pieces'} ({meters}m){inspCount > 0 ? ` [${inspCount}/${count} inspected]` : ''}
                          </option>
                        );
                      })}
                      {grnPieces.length > 0 && (
                        <optgroup label="── Specific Pieces ──">
                          {grnPieces.map((pc) => (
                            <option key={'p_' + pc.key} value={'piece:' + pc.key}>
                              Bale #{pc.baleNo} &middot; Piece {pc.pieceIdx + 1} ({pc.meters}m)
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Dropdown 2: Select Specific Piece */}
                  <div className="col-12 col-sm-5">
                    <label className="form-label fs-11 fw-bold text-dark text-uppercase mb-1 d-flex align-items-center gap-1">
                      <i className="ti ti-eye fs-13 text-primary"></i>
                      <span>Inspect Specific Piece:</span>
                    </label>
                    <select
                      className="form-select form-select-sm bg-white fs-12 border rounded-2"
                      value={selectedPieceKey}
                      onChange={(e) => handlePieceSelectChange(e.target.value)}
                      disabled={!selectedBaleFilter}
                    >
                      <option value="">
                        {!selectedBaleFilter
                          ? '-- Select Bale first --'
                          : selectedBaleFilter === 'all'
                          ? '-- All Pieces in All Bales --'
                          : `-- All Pieces in Bale #${selectedBaleFilter} --`}
                      </option>
                      {(selectedBaleFilter === 'all' ? grnPieces : grnPieces.filter((p) => String(p.baleNo) === String(selectedBaleFilter))).map((pc) => {
                        const isInspected = Boolean(pieceInspections[pc.key]?.checked);
                        const st = isInspected ? (pieceInspections[pc.key]?.status || 'OK') : 'Unchecked';
                        return (
                          <option key={pc.key} value={pc.key}>
                            Bale {pc.baleNo} &middot; Piece {pc.pieceIdx + 1} ({pc.meters}m) &mdash; [{st}]
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Dropdown 3: Inspection Level / Scope */}
                  <div className="col-12 col-sm-3">
                    <label className="form-label fs-11 fw-bold text-dark text-uppercase mb-1 d-flex align-items-center gap-1">
                      <i className="ti ti-layers-subtract fs-13 text-primary"></i>
                      <span>Inspection Level:</span>
                    </label>
                    <select
                      className="form-select form-select-sm bg-white fs-12 border rounded-2"
                      value={inspectionScope}
                      onChange={(e) => handleInspectionScopeChange(e.target.value)}
                    >
                      <option value="all">Full Shipment Inspection</option>
                      <option value="bale">Bale-Level Focus</option>
                      <option value="piece">Piece-Level Detailed</option>
                    </select>
                  </div>
                </div>

                {/* Scope guidance & active filter toolbar */}
                <div className="d-flex flex-wrap align-items-center justify-content-between mt-2 pt-2 border-top gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-white text-secondary border fs-11">
                      {inspectionScope === 'piece' ? '🔬 Piece-Level Detailed Mode' : (inspectionScope === 'bale' ? '📦 Bale-Level Focus Mode' : '🌐 Full Shipment Inspection')}
                    </span>
                    <span className="fs-12 text-muted">
                      {!selectedBaleFilter && !selectedPieceKey
                        ? 'Select a bale from the dropdown above to load and inspect pieces.'
                        : inspectionScope === 'piece'
                        ? 'All individual pieces expanded with independent width/fold checks.'
                        : (inspectionScope === 'bale'
                          ? `Focusing inspection on Bale #${selectedBaleFilter === 'all' ? 'All' : selectedBaleFilter}.`
                          : 'Shipment-wide inspection. Top fields apply to all pieces.')}
                    </span>
                  </div>
                  {(selectedPieceKey || (selectedBaleFilter && selectedBaleFilter !== 'all')) && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-decoration-none fs-12 fw-semibold"
                      style={{ color: '#5b47fb' }}
                      onClick={() => {
                        setSelectedPieceKey('');
                        setSelectedBaleFilter('all');
                      }}
                    >
                      <i className="ti ti-x me-1"></i> Reset Filters (Show All)
                    </button>
                  )}
                </div>

                {/* Selected Piece Banner if specific piece active */}
                {selectedPieceKey && (() => {
                  const targetPiece = grnPieces.find((p) => p.key === selectedPieceKey);
                  if (!targetPiece) return null;
                  const pStatus = pieceInspections[selectedPieceKey]?.status || 'OK';
                  return (
                    <div className="mt-2 p-2 bg-white rounded border d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-12 text-secondary">Showing piece:</span>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-12 fw-semibold">
                          Bale {targetPiece.baleNo} &mdash; Piece {targetPiece.pieceIdx + 1} ({targetPiece.meters}m)
                        </span>
                        <span className={`badge fs-11 ${
                          pStatus === 'OK' ? 'bg-success-subtle text-success border border-success-subtle' :
                          pStatus === 'Reject' ? 'bg-danger-subtle text-danger border border-danger-subtle' :
                          'bg-warning-subtle text-warning border border-warning-subtle'
                        }`}>
                          {pStatus}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm py-0 px-2 fs-11"
                        onClick={() => setSelectedPieceKey('')}
                      >
                        Show All Pieces
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Quick Action Toolbar for displayed pieces */}
            {grnPieces.length > 0 && (selectedBaleFilter || selectedPieceKey) && (
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-2 bg-light rounded-2 border mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-12 fw-semibold text-dark">
                    {displayedPieces.length} {displayedPieces.length === 1 ? 'Piece' : 'Pieces'} Listed
                  </span>
                  {inspectedList.length > 0 && (
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-11">
                      {inspectedList.length} Inspected
                    </span>
                  )}
                </div>
                <div className="d-flex flex-wrap align-items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm fs-11 py-1 px-2"
                    onClick={() => handleBatchCheckAll(true)}
                    title="Check all listed pieces"
                  >
                    <i className="ti ti-checks me-1 text-primary"></i> Check All
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm fs-11 py-1 px-2"
                    onClick={() => handleBatchMarkStatus('OK')}
                    title="Mark checked pieces as OK"
                  >
                    <i className="ti ti-check me-1"></i> Mark OK
                  </button>
                  <button
                    type="button"
                    className="btn btn-light btn-sm fs-11 py-1 px-2 text-muted border"
                    onClick={() => handleBatchCheckAll(false)}
                    title="Uncheck and collapse all pieces"
                  >
                    <i className="ti ti-x me-1"></i> Uncheck All
                  </button>
                </div>
              </div>
            )}

            {grnPieces.length === 0 ? (
              <div className="text-center py-3 text-muted fs-13 border rounded-3 bg-light">
                No bale/piece breakdown recorded for this GRN. Use overall inspection fields above.
              </div>
            ) : !selectedBaleFilter && !selectedPieceKey ? (
              <div className="text-center py-4 text-muted fs-13 border rounded-3 bg-light d-flex flex-column align-items-center justify-content-center gap-1">
                <i className="ti ti-box fs-24 text-secondary mb-1"></i>
                <span className="fw-semibold text-dark">Please select a bale from the dropdown above</span>
                <span className="text-secondary fs-12">Choose "All Bales" or a specific Bale # to display and inspect pieces</span>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {displayedPieces.length === 0 ? (
                  <div className="text-center py-3 text-muted fs-13 border rounded-3 bg-light">
                    No pieces match the selected dropdown filter.
                  </div>
                ) : (
                  displayedPieces.map((pc) => {
                  const pieceData = pieceInspections[pc.key] || {
                    checked: false,
                    actualWidth: '',
                    actualFold: '',
                    status: 'OK',
                    notes: '',
                    photos: []
                  };
                  const isChecked = Boolean(pieceData.checked);

                  return (
                    <div
                      key={pc.key}
                      className="border rounded-3 p-3 bg-white shadow-xs"
                      style={{
                        borderColor: isChecked ? '#c4b5fd' : '#e5e7eb',
                        backgroundColor: isChecked ? '#faf5ff' : '#ffffff'
                      }}
                    >
                      <div className="form-check d-flex align-items-center gap-2 mb-0">
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          id={`chk-${pc.key}`}
                          checked={isChecked}
                          onChange={(e) => {
                            const isNowChecked = e.target.checked;
                            const expW = formData.actualWidth || formData.expectedWidth || '44';
                            const expF = formData.actualFold || formData.expectedFold || '100';
                            setPieceInspections({
                              ...pieceInspections,
                              [pc.key]: {
                                ...pieceData,
                                actualWidth: (isNowChecked && !pieceData.actualWidth) ? expW : pieceData.actualWidth,
                                actualFold: (isNowChecked && !pieceData.actualFold) ? expF : pieceData.actualFold,
                                checked: isNowChecked
                              }
                            });
                          }}
                        />
                        <label
                          className="form-check-label fw-bold text-dark fs-13 cursor-pointer user-select-none d-flex align-items-center gap-2"
                          htmlFor={`chk-${pc.key}`}
                        >
                          <span>Bale {pc.baleNo} &mdash; Piece {pc.pieceIdx + 1} ({pc.meters}m)</span>
                          {isChecked && (
                            <span className={`badge fs-10 ${
                              pieceData.status === 'OK' ? 'bg-success-subtle text-success border border-success-subtle' :
                              pieceData.status === 'Reject' ? 'bg-danger-subtle text-danger border border-danger-subtle' :
                              'bg-warning-subtle text-warning border border-warning-subtle'
                            }`}>
                              {pieceData.status}
                            </span>
                          )}
                        </label>
                      </div>

                      {/* Expanded piece inspection inputs when checked */}
                      {isChecked && (
                        <div className="mt-3 pt-3 border-top bg-white p-3 rounded-2 border">
                          <div className="row g-3 mb-2">
                            <div className="col-12 col-sm-6 col-md-3">
                              <label className="form-label fs-11 fw-semibold text-secondary mb-1 d-block">
                                Actual width
                                <span className="badge bg-light text-primary border ms-1 fs-10">
                                  Expected: {formData.expectedWidth}&quot;
                                </span>
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                className="form-control form-control-sm bg-white"
                                placeholder={`e.g. ${formData.expectedWidth || '44'}`}
                                value={pieceData.actualWidth !== undefined ? pieceData.actualWidth : ''}
                                onChange={(e) => updatePieceField(pc.key, 'actualWidth', e.target.value)}
                              />
                            </div>

                            <div className="col-12 col-sm-6 col-md-3">
                              <label className="form-label fs-11 fw-semibold text-secondary mb-1 d-block">
                                Actual fold (%)
                                <span className="badge bg-light text-primary border ms-1 fs-10">
                                  Expected: {formData.expectedFold}%
                                </span>
                              </label>
                              <input
                                type="number"
                                className="form-control form-control-sm bg-white"
                                placeholder={`e.g. ${formData.expectedFold || '100'}`}
                                value={pieceData.actualFold !== undefined ? pieceData.actualFold : ''}
                                onChange={(e) => updatePieceField(pc.key, 'actualFold', e.target.value)}
                              />
                            </div>

                            <div className="col-12 col-sm-6 col-md-3">
                              <label className="form-label fs-11 fw-semibold text-secondary mb-1">
                                Status
                              </label>
                              <select
                                className="form-select form-select-sm bg-white fw-semibold"
                                value={pieceData.status}
                                onChange={(e) => updatePieceField(pc.key, 'status', e.target.value)}
                              >
                                <option value="OK">OK</option>
                                <option value="Send for Admin Approval">Send for Admin Approval</option>
                                <option value="Reject">Reject</option>
                              </select>
                            </div>

                            <div className="col-12 col-sm-6 col-md-3">
                              <label className="form-label fs-11 fw-semibold text-secondary mb-1">
                                Photos (more than one allowed)
                              </label>
                              <div className="d-flex align-items-center gap-1">
                                <label className="btn btn-outline-secondary btn-sm px-2 fs-11 mb-0 flex-grow-1 text-nowrap">
                                  <i className="ti ti-upload me-1"></i> Choose File(s)
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="d-none"
                                    onChange={(e) => handlePiecePhotoUpload(pc.key, e)}
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm px-2 fs-11 d-flex align-items-center gap-1 text-white shadow-sm"
                                  style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                                  onClick={() => handleOpenCamera(pc.key)}
                                  title="Capture Camera Photo"
                                >
                                  <i className="ti ti-camera"></i>
                                  <span>Camera</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mb-2">
                            <label className="form-label fs-11 fw-semibold text-secondary mb-1">
                              Notes
                            </label>
                            <input
                              type="text"
                              placeholder="Record defect, selvedge condition, shade uniformity, or tears..."
                              className="form-control form-control-sm bg-white"
                              value={pieceData.notes || ''}
                              onChange={(e) => updatePieceField(pc.key, 'notes', e.target.value)}
                            />
                          </div>

                          {pieceData.photos && pieceData.photos.length > 0 && (
                            <div className="d-flex flex-wrap gap-2 pt-1">
                              {pieceData.photos.map((ph, phIdx) => (
                                <div key={phIdx} className="position-relative border rounded-2 p-1 bg-white shadow-xs" style={{ width: '75px' }}>
                                  {/* Cancel / Delete piece photo button */}
                                  <button
                                    type="button"
                                    className="btn btn-danger position-absolute p-0 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                    style={{
                                      top: '-6px',
                                      right: '-6px',
                                      width: '18px',
                                      height: '18px',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      lineHeight: 1,
                                      zIndex: 3,
                                      cursor: 'pointer'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemovePiecePhoto(pc.key, phIdx);
                                    }}
                                    title="Cancel / Remove Photo"
                                  >
                                    &times;
                                  </button>
                                  <img
                                    src={ph.url}
                                    alt={ph.name}
                                    className="rounded-1 w-100"
                                    style={{ height: '52px', objectFit: 'cover' }}
                                  />
                                  <div className="text-truncate fs-10 text-muted mt-1 text-center" title={ph.name}>
                                    {ph.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              </div>
            )}
          </div>





          {/* Bottom Action Section */}
          <div className="pt-3">
            {isQcFinalized ? (
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-light border">
                <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center bg-success text-white flex-shrink-0 shadow-xs"
                      style={{ width: '40px', height: '40px' }}
                    >
                      <i className="ti ti-check fs-20"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-dark fs-14 mb-0.5">
                        Inspection Decision Finalized: <span className="text-success">{qc.qcStatus || qc.adminDecision}</span>
                      </div>
                      <div className="text-secondary fs-12">
                        This Quality Check was already approved/finalized by Admin. Modifications and re-submissions are locked.
                      </div>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-secondary px-4 py-2 fs-13 shadow-sm rounded-3 text-nowrap fw-semibold"
                      onClick={onBack}
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            ) : !isInspectionDetailsComplete ? (
              <div
                className="card border-0 shadow-sm rounded-4 p-4"
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1'
                }}
              >
                <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: '44px',
                        height: '44px',
                        backgroundColor: '#eef2ff',
                        color: '#2e37a4'
                      }}
                    >
                      <i className="ti ti-lock fs-20"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-dark fs-14 mb-0.5">
                        Inspection Details Required to Unlock Actions
                      </div>
                      <div className="text-secondary fs-12">
                        Please enter <strong>{missingInspectionFields.join(', ')}</strong> in the Inspection section above. The action buttons (Mark OK, Admin Approval, Reject) will appear once all required fields are filled.
                      </div>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-white border px-4 py-2 fs-13 text-secondary shadow-sm rounded-3 text-nowrap"
                      style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                      onClick={onBack}
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-wrap align-items-center gap-3">
                {/* Button 1: Mark OK (Mark All) — Visible once fields are filled */}
                <button
                  type="button"
                  className="btn text-white px-4 py-2.5 fw-semibold fs-13 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
                  style={{
                    backgroundColor: '#15803d',
                    borderColor: '#15803d',
                    opacity: (hasAnyMismatch || !isBaleCompletenessOk) ? 0.45 : 1,
                    cursor: (hasAnyMismatch || !isBaleCompletenessOk) ? 'not-allowed' : 'pointer'
                  }}
                  disabled={hasAnyMismatch || !isBaleCompletenessOk}
                  onClick={() => {
                    setFormData({ ...formData, qcStatus: 'OK' });
                    handleSubmit('OK');
                  }}
                  title={
                    hasAnyMismatch
                      ? "Option to add stock is disabled because Width or Fold exception does not match PO specification"
                      : !isBaleCompletenessOk
                        ? "Option to add stock is disabled because total quantity declared in GRN has incomplete bale entries"
                        : "Mark OK — Add Good Qty to Stock Pool"
                  }
                >
                  <i className="ti ti-check fs-16"></i>
                  <span>Mark OK &mdash; Add Good Qty to Stock Pool</span>
                </button>

                {/* Button 2: Send Whole Item for Admin Approval */}
                <button
                  type="button"
                  className={`btn px-4 py-2.5 fw-semibold fs-13 rounded-3 shadow-sm d-inline-flex align-items-center gap-2 ${hasAnyMismatch ? 'border-2 border-danger text-danger bg-danger-subtle' : ''}`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#b91c1c',
                    color: '#b91c1c'
                  }}
                  onClick={() => {
                    setFormData({ ...formData, qcStatus: 'Send for Admin Approval' });
                    handleSubmit('Send for Admin Approval');
                  }}
                  title="Send Whole Item for Admin Approval"
                >
                  <i className="ti ti-shield-alert fs-16"></i>
                  <span>Send Whole Item for Admin Approval</span>
                </button>

                {/* Button 3: Reject Item (Reject All) */}
                <button
                  type="button"
                  className="btn text-white px-4 py-2.5 fw-semibold fs-13 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
                  style={{
                    backgroundColor: '#dc2626',
                    borderColor: '#dc2626'
                  }}
                  onClick={handleRejectAll}
                  title="Reject Item (Reject All)"
                >
                  <i className="ti ti-x fs-16"></i>
                  <span>Reject Item (Reject All)</span>
                </button>

                <button
                  type="button"
                  className="btn btn-white border px-4 py-2.5 fs-13 text-secondary shadow-sm rounded-3"
                  style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                  onClick={onBack}
                >
                  Back
                </button>

                {/* Clear Status / Warning messages when buttons are visible */}
                {hasAnyMismatch ? (
                  <div className="w-100 mt-2 p-2.5 rounded-3 bg-warning-subtle border border-warning border-opacity-50 text-dark d-flex align-items-center gap-2 fs-13 fw-medium">
                    <i className="ti ti-alert-triangle fs-16 text-warning"></i>
                    <span>Add stock disabled: Exceptions (Width/Fold) do not match PO specification. Must send for Admin Approval or Reject.</span>
                  </div>
                ) : !isBaleCompletenessOk ? (
                  <div className="w-100 mt-2 p-2.5 rounded-3 bg-warning-subtle border border-warning border-opacity-50 text-dark d-flex align-items-center gap-2 fs-13 fw-medium">
                    <i className="ti ti-alert-triangle fs-16 text-warning"></i>
                    <span>Add stock disabled: Complete all bale entries in GRN before completing QC.</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Added to Stock Pool Success Modal (Matches User Screenshot 3) */}
      {successModalData && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden p-4 bg-white position-relative">
              <button
                type="button"
                className="btn-close position-absolute"
                style={{ top: '18px', right: '18px' }}
                onClick={() => {
                  setSuccessModalData(null);
                  if (onBack) onBack();
                }}
              ></button>

              <div className="mb-4 pe-4">
                <h5 className="fw-bold text-dark fs-17 mb-1">
                  Added to Stock Pool
                </h5>
                <p className="text-secondary fs-13 mb-0">
                  {Number(successModalData.goodQty.toFixed(2)).toLocaleString()}m is now available in stock.
                </p>
              </div>

              {successModalData.heldBackQty > 0 && (
                <div className="p-3 rounded-3 bg-warning-subtle border border-warning border-opacity-50 mb-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <i className="ti ti-alert-triangle text-warning fs-15"></i>
                    <span className="fw-bold text-dark fs-12">Portion Held Back for Admin</span>
                  </div>
                  <div className="text-secondary fs-11">
                    <strong>{Number(successModalData.heldBackQty.toFixed(2)).toLocaleString()}m</strong> was held back and routed to Admin Review.
                  </div>
                </div>
              )}

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-primary px-3.5 py-2 rounded-3 fs-13 text-white fw-semibold shadow-sm"
                  style={{ backgroundColor: '#2e3748', borderColor: '#2e3748' }}
                  onClick={() => {
                    setSuccessModalData(null);
                    if (onNavigateToStockPool) onNavigateToStockPool();
                    else if (onBack) onBack();
                  }}
                >
                  View Stock Pool
                </button>
                <button
                  type="button"
                  className="btn btn-white border px-3.5 py-2 rounded-3 fs-13 text-secondary fw-medium shadow-sm"
                  style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#475569' }}
                  onClick={() => {
                    setSuccessModalData(null);
                    if (onNavigateToGRN) onNavigateToGRN(successModalData.grnId);
                    else if (onBack) onBack();
                  }}
                >
                  Back to GRN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REAL CAMERA CAPTURE MODAL */}
      {isCameraActive && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1060 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-white">
              <div className="modal-header border-bottom px-4 py-3 bg-light">
                <div className="d-flex align-items-center gap-2">
                  <span className="p-1.5 rounded-circle bg-primary-subtle text-primary">
                    <i className="ti ti-camera fs-18"></i>
                  </span>
                  <div>
                    <h5 className="modal-title fw-bold text-dark fs-16 mb-0">
                      Capture Photo via Camera
                    </h5>
                    <span className="text-muted fs-11">
                      {cameraTargetKey === 'shipment' ? 'Whole Shipment Inspection Photo' : 'Piece-Level Inspection Photo'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseCamera}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body p-4 text-center">
                {cameraError ? (
                  <div className="p-4 bg-light rounded-3 border text-start">
                    <div className="d-flex align-items-start gap-2.5 mb-3 text-warning-emphasis">
                      <i className="ti ti-alert-triangle fs-22 flex-shrink-0 mt-0.5 text-warning"></i>
                      <div>
                        <h6 className="fw-bold mb-1 text-dark">Camera Access Not Available</h6>
                        <p className="fs-13 text-secondary mb-0">{cameraError}</p>
                      </div>
                    </div>
                    <div className="border-top pt-3 text-center">
                      <label className="btn btn-primary btn-sm px-4 py-2 fs-13 rounded-3 text-white shadow-sm cursor-pointer">
                        <i className="ti ti-upload me-1"></i> Choose File from Computer
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="d-none"
                          onChange={(e) => {
                            if (cameraTargetKey === 'shipment') {
                              handlePhotoUpload(e);
                            } else {
                              handlePiecePhotoUpload(cameraTargetKey, e);
                            }
                            handleCloseCamera();
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="position-relative bg-dark rounded-3 overflow-hidden d-inline-block w-100 shadow-inner" style={{ minHeight: '340px' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-100 rounded-3"
                      style={{ maxHeight: '420px', objectFit: 'contain', background: '#000' }}
                    />
                    <div
                      className="position-absolute bottom-0 start-0 end-0 p-2 text-center text-white-50 fs-11"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}
                    >
                      Point camera at the fabric or defect area, then click &ldquo;Capture Photo&rdquo;
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-white border px-3 py-2 fs-13 text-secondary rounded-3"
                  onClick={handleCloseCamera}
                >
                  Cancel
                </button>
                {!cameraError && (
                  <button
                    type="button"
                    className="btn btn-primary px-4 py-2 fs-13 rounded-3 text-white fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm"
                    style={{ backgroundColor: '#5b47fb', borderColor: '#5b47fb' }}
                    onClick={handleCapturePhoto}
                  >
                    <i className="ti ti-camera fs-16"></i>
                    <span>Capture Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INLINE TOAST NOTIFICATION */}
      {toastNotification && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 9999 }}
        >
          <div
            className={`toast show border-0 rounded-3 shadow-lg px-3 py-2.5 d-flex align-items-center gap-2.5 text-white ${
              toastNotification.type === 'danger'
                ? 'bg-danger'
                : toastNotification.type === 'warning'
                ? 'bg-warning text-dark'
                : 'bg-dark'
            }`}
            style={{ minWidth: '280px', animation: 'fadeIn 0.2s ease-in-out' }}
          >
            <i
              className={`fs-16 ${
                toastNotification.type === 'danger'
                  ? 'ti ti-alert-circle text-white'
                  : toastNotification.type === 'warning'
                  ? 'ti ti-alert-triangle text-dark'
                  : 'ti ti-circle-check text-success'
              }`}
            ></i>
            <span className="fs-13 fw-medium flex-grow-1">{toastNotification.message}</span>
            <button
              type="button"
              className="btn-close btn-close-white ms-auto"
              style={{ fontSize: '10px' }}
              onClick={() => setToastNotification(null)}
            ></button>
          </div>
        </div>
      )}
    </div>
  );
}
