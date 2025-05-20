const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  type: String,    // "text", "select", "checkbox", ...
  label: String,
  //possibly more: options (for select), validations, defaultValue, etc.
});

const criteriaSchema = new mongoose.Schema({
    type: String,
    value: mongoose.Schema.Types.Mixed,
})

const stepSchema = new mongoose.Schema({
  role: String, // e.g. "AlumniHouseAdmin", "EventsOfficeAdmin"
  criteria: [criteriaSchema],
  checkItems:[
    {
      type: String,
      required: false,
      default: {}
    }
  ],
  formDefinition: {
    //reference
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true,
  },
  // Possibly an `order` field or we rely on the array index for ordering
});

const approvalFlowDefinition = new mongoose.Schema({
  steps: [stepSchema],
  //optionally, store version, timestamps, etc.
}, { timestamps: true });

/*
each workflow definition might look like this:
{
  name: 'RPI Event Workflow',
  steps: [
    {
      role: 'AlumniHouseAdmin',
      criteria: {
        location: 'AlumniHouse'
      },
      formDefinition: {
        fields: [
          { type: 'text', label: 'Catering Requirements' },
          { type: 'checkbox', label: 'Security Required?' }
        ]
      }
    },
    {
      role: 'EventsOfficeAdmin',
      criteria: {
        // e.g., attendance > 100 OR specialFlag == true
      },
      formDefinition: { }
    },
    // ... possibly more steps ...
  ]
}
*/

module.exports = approvalFlowDefinition;
