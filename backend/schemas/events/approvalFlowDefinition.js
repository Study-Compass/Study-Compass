const mongoose = require("mongoose");


// Define available operators for different field types
const operators = {
  string: ["equals", "notEquals", "contains", "notContains", "in", "notIn"],
  number: ["equals", "notEquals", "greaterThan", "lessThan", "greaterThanOrEqual", "lessThanOrEqual", "in", "notIn"],
  boolean: ["equals", "notEquals"],
  date: ["equals", "notEquals", "before", "after", "between"]
};


// Schema for allowed operators for a field
const allowedOperatorSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  operators: [{
    type: String,
    required: true
  }]
});


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
  // For "in" and "notIn" operators, value will be an array
});

// Schema for a group of conditions
const conditionGroupSchema = new mongoose.Schema({
  conditions: [conditionSchema],
  conditionLogicalOperators: [{
    type: String,
    enum: ["AND", "OR"],
  }]
});

const stepSchema = new mongoose.Schema({
  role: String, // e.g. "AlumniHouseAdmin", "EventsOfficeAdmin"
  conditionGroups: [conditionGroupSchema],
  groupLogicalOperators: [{
    type: String,
    enum: ["AND", "OR"],
  }],
  checkItems:[
    {
      type: String,
      required: false,
      default: {}
    }
  ],
  formDefinition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Form",
    // required: true,
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
    enum: ["string", "number", "boolean", "date"],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  description: String,
  inputType: {
    type: String,
    enum: ["text", "number", "boolean", "date"],
    required: true
  },
//   validation: {
//     required: Boolean,
//     min: Number,
//     max: Number,
//     pattern: String,
//     // Add more validation options as needed
//   }
});

const approvalFlowDefinition = new mongoose.Schema({
  steps: [stepSchema],
  fieldDefinitions: [fieldDefinitionSchema],
  allowedOperators: [allowedOperatorSchema],
  version: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

/*
Example of a complex workflow definition with the new structure:
{
  steps: [
    {
      role: "AlumniHouseAdmin",
      conditionGroups: [
        {
          conditions: [
            {
              field: "location",
              operator: "equals",
              value: "AlumniHouse"
            },
            {
              field: "location",
              operator: "equals",
              value: "StudentCenter"
            },
            {
              field: "expectedAttendance",
              operator: "greaterThan",
              value: 50
            }
          ],
          conditionLogicalOperators: ["OR", "AND"]
        }
      ],
      groupLogicalOperators: ["OR"],
      allowedOperators: [
        {
          field: "location",
          operators: ["equals", "notEquals", "in", "notIn"]
        },
        {
          field: "expectedAttendance",
          operators: ["greaterThan", "lessThan", "equals", "notEquals"]
        }
      ],
      sortingFields: [
        {
          field: "location",
          type: "string",
          label: "Event Location",
          allowedOperators: ["equals", "notEquals", "in", "notIn"]
        },
        {
          field: "expectedAttendance",
          type: "number",
          label: "Expected Attendance",
          allowedOperators: ["greaterThan", "lessThan", "equals", "notEquals"]
        }
      ],
      formDefinition: { ... }
    }
  ],
  fieldDefinitions: [
    {
      name: "location",
      type: "string",
      label: "Event Location",
      description: "The physical location of the event"
    },
    {
      name: "expectedAttendance",
      type: "number",
      label: "Expected Attendance",
      description: "Number of expected attendees",
      validation: {
        required: true,
        min: 0
      }
    }
  ]
}
*/

module.exports = approvalFlowDefinition;
