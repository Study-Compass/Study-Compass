import React from 'react';
import './ApprovalTimeline.scss';

/**
 * @param {Object} props.event
 *   Required shape (at least):
 *   {
 *     createdAt: Date|String,
 *     start_time: Date|String,
 *     approvalReference: {
 *       currentStepIndex: Number,
 *       approvals: [
 *         { role: String, status: 'pending'|'approved'|'rejected', approvedAt?: Date, approvedByUserId?: String }
 *       ]
 *     }
 *   }
 */
const EventTimeline = ({ event }) => {
  const { approvalReference } = event || {};
  const { currentStepIndex = 0, approvals = [] } = approvalReference || {};

  // Build your “timelineSteps” array
  const timelineSteps = [
    {
      title: 'Event Created',
      date: new Date(event?.createdAt || Date.now()).toLocaleString(),
      subText: 'Created by Jeremy Pankow', // or from your real data
      status: 'completed',
    },
    ...approvals.map((appr) => ({
      title: `${appr.role} Approval`,
      date: appr.approvedAt ? new Date(appr.approvedAt).toLocaleString() : null,
      subText:
        appr.status === 'approved'
          ? `Approved by user #${appr.approvedByUserId}`
          : appr.status === 'rejected'
          ? 'Rejected'
          : 'Waiting for approval',
      status: appr.status, // “pending” | “approved” | “rejected”
    })),
    {
      title: 'Proposed Event Date',
      date: new Date(event?.start_time || Date.now()).toLocaleString(),
      subText: '', // e.g. "19 Mar 2025, 6:00 PM"
      status: 'upcoming',
    },
  ];

  return (
    <div className="timeline-container">
      {timelineSteps.map((step, index) => {
        // Compare index to currentStepIndex
        // Steps before currentStepIndex = "completed"
        // Step == currentStepIndex = "active"
        // Steps after are upcoming/pending
        let stepClass = '';
        if (index < currentStepIndex) stepClass = 'completed';
        else if (index === currentStepIndex) stepClass = 'active';

        return (
          <div className="timeline-step" key={index}>
            {/* Left side: date */}
            <div className="step-date">{step.date}</div>

            {/* Middle: dot + connecting line */}
            <div className="timeline-marker">
              <div className={`marker-circle ${stepClass}`} />
              {/* Only show a vertical line if it's not the last step */}
              {index < timelineSteps.length - 1 && (
                <div className="marker-line" />
              )}
            </div>

            {/* Right side: content (title, subtext) */}
            <div className="timeline-content">
              <div className="content-title">{step.title}</div>
              {step.subText && (
                <div className="content-subtext">{step.subText}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EventTimeline;
