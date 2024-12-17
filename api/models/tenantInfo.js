module.exports = {
    fields:
        [
            { field: 'tenantID', desc: 'Id', type: 'uuid', required: true, isId: true },
            { field: 'firstName', desc: 'First Name', required: true },
            { field: 'lastName', desc: 'Last Name', required: true },
            { field: 'fullName', desc: 'Full Name', required: true, def: '' },
            { field: 'email', desc: 'Email', },
            { field: 'phone', desc: 'Phone', },
            { field: 'ssn', desc: 'SSN', },
            { field: 'driverID', desc: 'Driver License', },
            { field: 'driverIDState', desc: 'State', },
            { field: 'momName', desc: 'Mother', },
            { field: 'momPhone', desc: 'Mom\'s phone number', },
            { field: 'dadName', desc: 'Dad Name', },
            { field: 'dadPhone', desc: 'Dad Phone', },
            { field: 'userID', type: 'uuid', desc: 'Owner', foreignKey: { table: 'userInfo', field: 'userID' }, required: true, def:'0', isOwnerSecurityField: true,},
        ]
};