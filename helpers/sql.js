const { BadRequestError } = require("../expressError");

/** returns sql syntax for partial record updates used in Model classes.
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

module.exports = { sqlForPartialUpdate };
