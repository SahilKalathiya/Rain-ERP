import React, { useState } from 'react';

export default function CuttingModule() {
  const [cuttingJobs] = useState([
    {
      id: 'CUT-2026-001',
      order: 'ORD-2026-001 (Summer Kurti)',
      fabric: 'Rayon 14kg Print (Surat Mills)',
      totalLayers: '120 Layers',
      totalPcs: '2,400 pcs',
      master: 'Ramesh Patel',
      status: 'Completed'
    },
    {
      id: 'CUT-2026-002',
      order: 'ORD-2026-002 (Designer Anarkali)',
      fabric: 'Georgette 60g Dyed',
      totalLayers: '80 Layers',
      totalPcs: '1,200 pcs',
      master: 'Suresh Verma',
      status: 'In Progress'
    }
  ]);

  return (
    <div className="p-4" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1 fs-24">Cutting Master Section</h2>
          <p className="text-secondary mb-0 fs-13">Lay Planning, Table Spreading &amp; Bundle Generation</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-medium rounded-3">
          <i className="ti ti-plus fs-16"></i>
          <span>New Cutting Order</span>
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 fs-13">
            <thead className="table-light text-secondary">
              <tr>
                <th>Cutting ID</th>
                <th>Order Ref</th>
                <th>Fabric Used</th>
                <th>Table Plies</th>
                <th>Output Pcs</th>
                <th>Cutting Master</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cuttingJobs.map((c) => (
                <tr key={c.id}>
                  <td className="fw-bold text-primary">{c.id}</td>
                  <td className="fw-medium">{c.order}</td>
                  <td>{c.fabric}</td>
                  <td>{c.totalLayers}</td>
                  <td className="fw-bold text-dark">{c.totalPcs}</td>
                  <td>{c.master}</td>
                  <td>
                    <span
                      className={`badge px-2 py-1 ${
                        c.status === 'Completed'
                          ? 'bg-success-subtle text-success'
                          : 'bg-primary-subtle text-primary'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
