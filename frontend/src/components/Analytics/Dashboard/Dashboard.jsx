import React from 'react';

import KpiCard from './KpiCard';
import ComparisonBadge from './ComparisonBadge';

const formatPercent = (v) => `${Math.round(v * 100)}%`;

function Dashboard({ summary }) {
  if (!summary) {
    return (
      <div className="kpi-dashboard">
        <KpiCard title="Total Users" value="—" />
        <KpiCard title="New Users (MoM)" value="—" />
        <KpiCard title="Visits (MoM)" value="—" />
        <KpiCard title="Repeat Visit Rate" value="—" />
      </div>
    );
  }

  const { totals, current, previous, deltas } = summary;

  return (
    <div className="kpi-dashboard">
      <KpiCard title="Total Users" value={totals.totalUsers.toLocaleString()} subtitle={<span>Cumulative</span>} />

      <KpiCard title="New Users" value={current.newUsers.toLocaleString()} subtitle={<ComparisonBadge delta={deltas.newUsers} previous={previous.newUsers} />} />

      <KpiCard title="Visits" value={current.uniqueVisitors.toLocaleString()} subtitle={<ComparisonBadge delta={deltas.uniqueVisitors} previous={previous.uniqueVisitors} />} />

      <KpiCard title="Repeat Visit Rate" value={formatPercent(current.repeatRate)} subtitle={<ComparisonBadge delta={deltas.repeatRate} previous={previous.repeatRate} isPercent />} />
    </div>
  );
}

export default Dashboard;


