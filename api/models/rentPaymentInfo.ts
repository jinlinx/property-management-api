import { IDBModel } from './types';
export const rentPaymentInfo = {
    fields:
        [
            { field: 'paymentID', desc: 'Id', type: 'uuid', required: true, unique: true, isId: true },
            { field: 'receivedDate', desc: 'Received Date', type: 'datetime' },
            { field: 'receivedAmount', desc: 'Received Amount', type: 'decimal' },
            { field: 'paidBy', desc: 'Paid By', },
            { field: 'notes', desc: 'Notes', size: 1024}, //alter table rentPaymentInfo modify column notes varchar(1024);
            { field: 'month', desc: 'Month', },
            { field: 'paymentTypeID', desc: 'PaymentType', foreignKey:{table:'paymentType', field:'paymentTypeID'} },
            //{ field: 'leaseID', desc: 'Lease ID', foreignKey: {table: 'leaseInfo', field:'leaseID'}},
            { field: 'houseID', desc: 'House', foreignKey: { table: 'houseInfo', field: 'houseID' } },
            { field: 'ownerID', type: 'int', desc: 'Owner', foreignKey: { table: 'ownerInfo', field: 'ownerID' }, required: true, def:'0', isOwnerSecurityField: true,},
            { field: 'paymentProcessor', desc: 'Processor', },
        ],
        view:{
            name: 'view_rentPaymentInfo',
            fields:[
                { name: 'paymentTypeName', field: 'paymentTypeName', desc: 'Payment Type', table: 'paymentType' },
                { field: 'includeInCommission', desc: 'includeInCommission', table: 'paymentType' },
                { name: 'address', field: 'address', desc: 'House', table: 'houseInfo' },
                { name: 'addressId', field: 'houseID', desc: 'HouseID', table: 'houseInfo' },
                { field: 'source', desc: 'Source', table: 'ip' },
                { name:'ownerName', field: 'shortName', desc: 'OwnerName', table: 'oi' },                
            ], 
            extraViewJoins: ' inner join ownerInfo oi on oi.ownerID  = houseInfo.ownerID left join importPayments ip  on ip.paymentID  = rentPaymentInfo.paymentID ',
        }
} as IDBModel;