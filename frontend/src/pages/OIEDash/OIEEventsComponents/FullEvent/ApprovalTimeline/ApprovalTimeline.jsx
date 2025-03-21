import React, { useEffect, useState } from "react";
import "./ApprovalTimeline.scss";
import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
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
    console.log(event);
    const { approvalReference } = event || {};
    const [currentStepIndex, setCurrentStepIndex] = useState(approvalReference?.currentStepIndex ?? 2);
    const approvals = approvalReference?.approvals || [];

    const dateOptions = { year: "numeric", month: "short", day: "numeric" };
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

    useEffect(() => {
        console.log("Current step index:", currentStepIndex);
    }, [currentStepIndex]);
    // Build your “timelineSteps” array
    const timelineSteps = [
        {
            title: "Event Created",
            date: new Date(event?.createdAt || Date.now()),
            subText: `created by ${event.hostingId.name}`, // or from your real data
            status: "completed",
        },
        ...approvals.map((appr) => ({
            title: `${appr.role} Approval`,
            date: appr.approvedAt ? new Date(appr.approvedAt) : null,
            subText:
                appr.status === "approved"
                    ? `Approved by user #${appr.approvedByUserId}`
                    : appr.status === "rejected"
                        ? "Rejected"
                        : "Waiting for approval",
            status: appr.status, // “pending” | “approved” | “rejected”
        })),
        {
            title: "Proposed Event Date",
            date: new Date(event?.start_time || Date.now()),
            subText: "", // e.g. "19 Mar 2025, 6:00 PM"
            status: "upcoming",
        },
    ];

    return (
        <div className="timeline">
            <div className="header">
                <Icon icon="mdi:tag-approve" />
                <h2>timeline</h2>
            </div>
            <div className="timeline-container">
                {timelineSteps.map((step, index) => {
                    // Compare index to currentStepIndex
                    // Steps before currentStepIndex = "completed"
                    // Step == currentStepIndex = "active"
                    // Steps after are upcoming/pending
                    let stepClass = "";
                    if (index < currentStepIndex+1) stepClass = "completed";
                    else if (index === currentStepIndex+1) stepClass = "active";

                    return (
                        <div className="timeline-step" key={index}>
                            {/* Left side: date, no time */}
                            <div className="step-date">
                                <h3>{step.date?.toLocaleDateString('en-GB', dateOptions)}</h3>
                                <p>{step.date?.toLocaleTimeString('en-US', timeOptions)}</p>
                            </div>

                            {/* Middle: dot + connecting line */}
                            <div className="timeline-marker">
                                <div className="marker-container">
                                    <div className={`marker-circle ${stepClass}`}/>
                                </div>
                                    
                                
                                
                                {/* Only show a vertical line if it's not the last step */}
                                {index < timelineSteps.length - 1 && (
                                    <div className="marker-line" />
                                )}
                            </div>

                            {/* Right side: content (title, subtext) */}
                            <div className="timeline-content">
                                <div className="content-title"><h3>{step.title}</h3></div>
                                {step.subText && (
                                    <div className="content-subtext">{step.subText}</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EventTimeline;
