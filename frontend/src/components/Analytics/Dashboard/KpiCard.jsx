import React from 'react';

function KpiCard({ title, value, subtitle }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card__title">{title}</div>
      <div className="kpi-card__value">{value}</div>
      {subtitle && <div className="kpi-card__subtitle">{subtitle}</div>}
    </div>
  );
}

export default KpiCard;


