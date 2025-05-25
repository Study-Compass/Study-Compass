const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  type: String,    // "text", "select", "checkbox", ...
  label: String,
  //possibly more: options (for select), validations, defaultValue, etc.
});

// Define available operators for different field types
const OPERATORS = {
  string: ['equals', 'notEquals', 'contains', 'notContains', 'in', 'notIn'],
  number: ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual', 'in', 'notIn'],
  boolean: ['equals', 'notEquals'],
  date: ['equals', 'notEquals', 'before', 'after', 'between']
};

// Schema for a single condition
const conditionSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true
  },
  operator: {
    type: String,
    required: true
  },
  value: mongoose.Schema.Types.Mixed,
  // For 'in' and 'notIn' operators, value will be an array
});

// Schema for a group of conditions with a logical operator
const conditionGroupSchema = new mongoose.Schema({
  logicalOperator: {
    type: String,
    enum: ['AND', 'OR'],
    required: true
  },
  conditions: [conditionSchema],
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConditionGroup'
  }]
});

const stepSchema = new mongoose.Schema({
  role: String, // e.g. "AlumniHouseAdmin", "EventsOfficeAdmin"
  conditionGroups: [conditionGroupSchema],
  checkItems:[
    {
      type: String,
      required: false,
      default: {}
    }
  ],
  formDefinition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true,
  },
});

// Schema for field definitions that can be used in conditions
const fieldDefinitionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'date'],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  description: String,
  validation: {
    required: Boolean,
    min: Number,
    max: Number,
    pattern: String,
    // Add more validation options as needed
  }
});

const approvalFlowDefinition = new mongoose.Schema({
  steps: [stepSchema],
  fieldDefinitions: [fieldDefinitionSchema],
  version: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

/*
Example of a complex workflow definition:
{
  steps: [
    {
      role: 'AlumniHouseAdmin',
      conditionGroups: [
        {
          logicalOperator: 'OR',
          conditions: [
            {
              field: 'location',
              operator: 'equals',
              value: 'AlumniHouse'
            },
            {
              field: 'location',
              operator: 'equals',
              value: 'StudentCenter'
            }
          ],
          groups: [
            {
              logicalOperator: 'AND',
              conditions: [
                {
                  field: 'expectedAttendance',
                  operator: 'greaterThan',
                  value: 100
                },
                {
                  field: 'requiresSecurity',
                  operator: 'equals',
                  value: true
                }
              ]
            }
          ]
        }
      ],
      formDefinition: { ... }
    }
  ],
  fieldDefinitions: [
    {
      name: 'location',
      type: 'string',
      label: 'Event Location',
      description: 'The physical location of the event'
    },
    {
      name: 'expectedAttendance',
      type: 'number',
      label: 'Expected Attendance',
      description: 'Number of expected attendees',
      validation: {
        required: true,
        min: 0
      }
    }
  ]
}
*/

module.exports = approvalFlowDefinition;
