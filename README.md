# bootcamp-express-jobly

A practice exercise demonstrating understanding of developing a Node / Express based API.

## About Jobly

This API-based app allows users to view companies, jobs at those companies and apply to said jobs.

-   Two user types: admin and non-admin
-   Admins can create users, companies, jobs, job applications. Admins can view and edit all users.
-   All users can view compananies and jobs and create job applications.
-   Users can edit their own user account.

**To setup and seed dbs:**
    
    npm seed
    
**To run the app:**

    npm start 

alternatively: `npm dev` which launches using nodemon.

**To run the tests:**

    npm test

Runs tests using `jest -i`.

**To use app with Postman:**

Download and import the Postman collection found in root directory: `Jobly.postman_collection.json`
