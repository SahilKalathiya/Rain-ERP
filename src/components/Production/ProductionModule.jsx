import React, { useState, useEffect } from 'react';
import EmbroideryList from './EmbroideryList';
import NewEmbroideryPO from './NewEmbroideryPO';
import EmbroideryInward from './EmbroideryInward';
import EmbroideryPODetail from './EmbroideryPODetail';
import SingleCutOrder from './SingleCutOrder';
import StitchingJobsList from './StitchingJobsList';
import NewStitchingJob from './NewStitchingJob';
import StitchingInward from './StitchingInward';
import StitchingJobDetail from './StitchingJobDetail';

import {
  initialEmbroideryPOs,
  initialSingleCuts,
  initialStitchingJobs
} from '../../data/initialData';

/**
 * ProductionModule - Master Production Dashboard with Tabs and Subviews
 */
export default function ProductionModule({ initialTab = 'embroidery', initialView = 'list' }) {
  // Tabs: 'embroidery', 'single_cuts', 'stitching'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Subviews
  const [embView, setEmbView] = useState(initialView === 'new' ? 'new_po' : 'pos_list');
  const [selectedEmbPoId, setSelectedEmbPoId] = useState('EMB-2026-0001');

  const [stitchView, setStitchView] = useState('jobs_list');
  const [selectedJobId, setSelectedJobId] = useState('ST-2026-0001');

  // Notifications
  const [alert, setAlert] = useState(null);
  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // 1. Embroidery POs State
  const [embroideryPOs, setEmbroideryPOs] = useState(() => {
    try {
      const saved = localStorage.getItem('erp_embroidery_pos_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialEmbroideryPOs;
  });

  useEffect(() => {
    try {
      localStorage.setItem('erp_embroidery_pos_v1', JSON.stringify(embroideryPOs));
    } catch (e) {}
  }, [embroideryPOs]);

  // 2. Single Cuts State
  const [singleCuts, setSingleCuts] = useState(() => {
    try {
      const saved = localStorage.getItem('erp_single_cuts_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialSingleCuts;
  });

  useEffect(() => {
    try {
      localStorage.setItem('erp_single_cuts_v1', JSON.stringify(singleCuts));
    } catch (e) {}
  }, [singleCuts]);

  // 3. Stitching Jobs State
  const [stitchingJobs, setStitchingJobs] = useState(() => {
    try {
      const saved = localStorage.getItem('erp_stitching_jobs_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialStitchingJobs;
  });

  useEffect(() => {
    try {
      localStorage.setItem('erp_stitching_jobs_v1', JSON.stringify(stitchingJobs));
    } catch (e) {}
  }, [stitchingJobs]);

  // Handlers
  const handleSaveEmbroideryPO = (newPO) => {
    setEmbroideryPOs((prev) => [newPO, ...prev]);
    showAlert(`Embroidery PO ${newPO.id} created successfully!`);
    setEmbView('pos_list');
  };

  const handleSaveEmbroideryInward = (inwardData) => {
    setEmbroideryPOs((prev) =>
      prev.map((po) => {
        if (po.id === inwardData.poId) {
          const newRecNum = (po.totalReceivedNum || 0) + inwardData.piecesReceived;
          const status = newRecNum >= (po.totalSentNum || 0) ? 'Completed' : 'In Progress';
          return {
            ...po,
            status,
            totalReceived: `${newRecNum} pcs`,
            totalReceivedNum: newRecNum
          };
        }
        return po;
      })
    );
    showAlert(`Inward recorded for ${inwardData.poId} (${inwardData.piecesReceived} pcs)!`);
    setEmbView('pos_list');
  };

  const handleCreateSingleCut = (newCut) => {
    setSingleCuts((prev) => [newCut, ...prev]);
    showAlert(`Single Cut Order ${newCut.id} created successfully!`);
  };

  const handleSaveStitchingJob = (newJob) => {
    setStitchingJobs((prev) => [newJob, ...prev]);
    showAlert(`Stitching Job ${newJob.id} created successfully!`);
    setStitchView('jobs_list');
  };

  const handleSaveStitchingInward = (inwardData) => {
    setStitchingJobs((prev) =>
      prev.map((job) => {
        if (job.id === inwardData.jobId) {
          const newRec = (job.totalReceivedNum || 0) + inwardData.totalReceived;
          const status = newRec >= (job.totalSentNum || 0) ? 'Completed' : 'In Progress';
          return {
            ...job,
            status,
            totalReceived: `${newRec} pcs`,
            totalReceivedNum: newRec
          };
        }
        return job;
      })
    );
    showAlert(`Stitching Inward recorded for ${inwardData.jobId} (${inwardData.totalReceived} pcs)!`);
    setStitchView('jobs_list');
  };

  return (
    <div className="p-4" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Toast Alert */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm mb-4`}
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i
              className={`ti ${
                alert.type === 'success' ? 'ti-circle-check' : 'ti-alert-circle'
              } fs-18`}
            ></i>
            <span>{alert.message}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Pill Tab Switcher */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        <button
          type="button"
          className={`btn d-flex align-items-center gap-2 px-3 py-2 rounded-pill fw-medium fs-13 transition-all ${
            activeTab === 'embroidery'
              ? 'btn-primary shadow-sm'
              : 'btn-outline-secondary border-0 bg-white text-dark shadow-sm'
          }`}
          onClick={() => {
            setActiveTab('embroidery');
            setEmbView('pos_list');
          }}
        >
          <i className="ti ti-sparkles fs-15"></i>
          <span>After-Cut Embroidery</span>
          <span
            className={`badge rounded-pill ${
              activeTab === 'embroidery' ? 'bg-white text-primary' : 'bg-light text-secondary'
            }`}
          >
            {embroideryPOs.length}
          </span>
        </button>

        <button
          type="button"
          className={`btn d-flex align-items-center gap-2 px-3 py-2 rounded-pill fw-medium fs-13 transition-all ${
            activeTab === 'single_cuts'
              ? 'btn-primary shadow-sm'
              : 'btn-outline-secondary border-0 bg-white text-dark shadow-sm'
          }`}
          onClick={() => setActiveTab('single_cuts')}
        >
          <i className="ti ti-scissors fs-15"></i>
          <span>Single Cut Order</span>
          <span
            className={`badge rounded-pill ${
              activeTab === 'single_cuts' ? 'bg-white text-primary' : 'bg-light text-secondary'
            }`}
          >
            {singleCuts.length}
          </span>
        </button>

        <button
          type="button"
          className={`btn d-flex align-items-center gap-2 px-3 py-2 rounded-pill fw-medium fs-13 transition-all ${
            activeTab === 'stitching'
              ? 'btn-primary shadow-sm'
              : 'btn-outline-secondary border-0 bg-white text-dark shadow-sm'
          }`}
          onClick={() => {
            setActiveTab('stitching');
            setStitchView('jobs_list');
          }}
        >
          <i className="ti ti-shirt fs-15"></i>
          <span>Stitching Jobs</span>
          <span
            className={`badge rounded-pill ${
              activeTab === 'stitching' ? 'bg-white text-primary' : 'bg-light text-secondary'
            }`}
          >
            {stitchingJobs.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Embroidery */}
      {activeTab === 'embroidery' && (
        <>
          {embView === 'pos_list' && (
            <EmbroideryList
              orders={embroideryPOs}
              onNewPO={() => setEmbView('new_po')}
              onRecordInward={(id) => {
                if (id) setSelectedEmbPoId(id);
                setEmbView('record_inward');
              }}
              onViewDetails={(id) => {
                setSelectedEmbPoId(id);
                setEmbView('po_detail');
              }}
            />
          )}

          {embView === 'new_po' && (
            <NewEmbroideryPO
              onBack={() => setEmbView('pos_list')}
              onSave={handleSaveEmbroideryPO}
            />
          )}

          {embView === 'record_inward' && (
            <EmbroideryInward
              orders={embroideryPOs}
              onBack={() => setEmbView('pos_list')}
              onSaveInward={handleSaveEmbroideryInward}
            />
          )}

          {embView === 'po_detail' && (
            <EmbroideryPODetail
              po={embroideryPOs.find((p) => p.id === selectedEmbPoId)}
              onBack={() => setEmbView('pos_list')}
              onRecordInward={() => setEmbView('record_inward')}
            />
          )}
        </>
      )}

      {/* Tab 2: Single Cuts */}
      {activeTab === 'single_cuts' && (
        <SingleCutOrder
          singleCuts={singleCuts}
          onBack={() => setActiveTab('embroidery')}
          onCreateSingleCut={handleCreateSingleCut}
        />
      )}

      {/* Tab 3: Stitching */}
      {activeTab === 'stitching' && (
        <>
          {stitchView === 'jobs_list' && (
            <StitchingJobsList
              jobs={stitchingJobs}
              onNewJob={() => setStitchView('new_job')}
              onRecordInward={(id) => {
                if (id) setSelectedJobId(id);
                setStitchView('record_inward');
              }}
              onViewDetails={(id) => {
                setSelectedJobId(id);
                setStitchView('job_detail');
              }}
            />
          )}

          {stitchView === 'new_job' && (
            <NewStitchingJob
              onBack={() => setStitchView('jobs_list')}
              onSave={handleSaveStitchingJob}
            />
          )}

          {stitchView === 'record_inward' && (
            <StitchingInward
              jobs={stitchingJobs}
              onBack={() => setStitchView('jobs_list')}
              onSaveInward={handleSaveStitchingInward}
            />
          )}

          {stitchView === 'job_detail' && (
            <StitchingJobDetail
              job={stitchingJobs.find((j) => j.id === selectedJobId)}
              onBack={() => setStitchView('jobs_list')}
              onRecordInward={() => setStitchView('record_inward')}
            />
          )}
        </>
      )}
    </div>
  );
}
