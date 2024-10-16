const express = require('express');
const Classroom = require('../schemas/classroom.js');
const Schedule = require('../schemas/schedule.js');
const User = require('../schemas/user.js');

const router = express.Router();

router.post('/update-classrooms', async (req, res) => {
    try {
        const documents = await Classroom.find();

        const schemaPaths = Object.keys(Classroom.paths);

        for (const doc of documents) {
            let needsUpdate = false;
            for (const path of schemaPaths) {
                if (doc[path] === undefined) {
                    doc[path] = Classroom.paths[path].defaultValue;
                    needsUpdate = true;
                }
            }
            if (needsUpdate) {
                await doc.save();
            }
        }

        res.status(200).send('Documents checked and updated where necessary');
    } catch (error) {
        console.error('Error checking and updating documents:', error);
        res.status(500).send('An error occurred');
    }
});

router.get('/update-users', async (req, res) => {
    try {
        const documents = await User.find();

        // Get the schema paths and default values
        const schemaPaths = Object.keys(User.schema.paths);
        const defaultValues = schemaPaths.reduce((defaults, path) => {
            if (User.schema.paths[path].defaultValue !== undefined) {
                defaults[path] = User.schema.paths[path].defaultValue;
            }
            return defaults;
        }, {});


        let updatedPaths = [];

        for (const doc of documents) {
            let needsUpdate = false;

            for (const path of schemaPaths) {
                // Ensure the path is not '_id' or '__v', as they don't have defaults
                if (path === '_id' || path === '__v') continue;

                // Check if the document's path value is undefined and has a default value
                if (doc[path] === undefined && defaultValues[path] !== undefined) {
                    // Get the schema type of the path
                    const schemaType = User.schema.paths[path];
                    
                    // Check if the default value is of the correct type
                    if (typeof defaultValues[path] === typeof schemaType.cast(defaultValues[path])) {
                        doc[path] = defaultValues[path];
                        needsUpdate = true;
                        updatedPaths.push(path);
                    } else {
                        console.warn(`Type mismatch for path ${path}: expected ${typeof schemaType.cast(defaultValues[path])}, but got ${typeof defaultValues[path]}`);
                    }
                }
            }

            if (needsUpdate) {
                await doc.save();
            }
        }

        res.status(200).json({
            message: 'Documents checked and updated where necessary',
            updatedPaths: updatedPaths,
        });
    } catch (error) {
        console.error('Error checking and updating documents:', error);
        res.status(500).send('An error occurred');
    }
});

module.exports = router;
