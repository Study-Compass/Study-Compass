import React, {useState} from 'react';
import './ApprovalCriteria.scss';
import Select from '../../../../components/Select/Select';

const ApprovalCriteria = ({criteria, onChange, approvalKey}) => {
    const [internalCriteria, setInternalCriteria] = useState(criteria);
    const [editing, setEditing] = useState(false);
    console.log(approvalKey);
    const onApprovalChange = (prev, key, value) => {
        onChange(key, value);
    }
    return(
        <div className="criteria-option">
            <Select options={['location', 'attendee count']} onChange={(option)=>onApprovalChange(approvalKey, option, null)} defaultValue={approvalKey} />
            <input type="text" value={criteria[approvalKey]} onChange={(e)=>{onApprovalChange(approvalKey, approvalKey, e.target.value )}}/>
        </div>
    )
}

export default ApprovalCriteria;