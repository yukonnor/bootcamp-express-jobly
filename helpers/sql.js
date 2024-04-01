const { BadRequestError } = require("../expressError");

/** sqlForPartialUpdate returns sql syntax for partial record updates used in Model classes.
 *
 *  Accepts:
 *  - dataToUpdate: An object with the columns to be updated along with what the new values should be.
 *     eg: {name, description, numEmployees}
 *  - jsToSql: An object that helps translate JS column names to Sql-syntax column names.
 *     eg: {
 *         numEmployees: "num_employees",
 *         logoUrl: "logo_url",
 *        }
 *
 *  Returns:
 *  - An object with two properties: setCols and values
 *  - setCols: A string of column names to be updated, separated by commas. To be injected into the SQL statement
 *     eg: '"name"=$1, "description"=$2, "num_employees"=$3'
 *  - values: Returns an array showing the values of the columns to be updated
 *     eg: ['NewCo', 'A company..', 35]
 *
 *  Throws a BadRequestError if no data is provided.
 *
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
    const keys = Object.keys(dataToUpdate);
    if (keys.length === 0) throw new BadRequestError("No data");

    // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
    const cols = keys.map((colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`);

    return {
        setCols: cols.join(", "),
        values: Object.values(dataToUpdate),
    };
}

/** sqlForVariableWhere returns sql syntax for a variable amount of filters to add to a WHERE statement.
 *
 *  This function includes some hard coded logic based on specific columns in our data model.
 *
 *  Accepts:
 *  - filters: An object with the columns to be filtered along with their filter values.
 *     eg: {name, minEmployees}
 *
 *  Returns:
 *  - A string to be appended to the WHERE statement in a SQL query.
 *   eg: "name ILIKE '%net%' AND num_employees >= 10"
 *
 *  Throws a BadRequestError if no data is provided or if an unsupported filter is provided.
 *
 */

function sqlForVariableWhere(filters) {
    const keys = Object.keys(filters);
    if (keys.length === 0) throw new BadRequestError("No data");

    const filterConditions = {
        name: (value) => `"name" ILIKE '%${value}%'`,
        minEmployees: (value) => `"num_employees" >= ${value}`,
        maxEmployees: (value) => `"num_employees" <= ${value}`,
    };

    let whereStatements = [];
    for (let filter in filters) {
        if (filter in filterConditions) {
            const condition = filterConditions[filter](filters[filter]);
            whereStatements.push(condition);
        } else {
            throw new BadRequestError("Unsupported filter");
        }
    }

    const whereStatement = whereStatements.join(" AND ");

    return whereStatement;
}

module.exports = { sqlForPartialUpdate, sqlForVariableWhere };
