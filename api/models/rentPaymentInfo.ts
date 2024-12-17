import { IDBModel } from './types';
export const rentPaymentInfo: IDBModel = {
    fields:
        [
            { field: 'paymentID', desc: 'Id', type: 'uuid', required: true, unique: true, isId: true },
            { field: 'receivedDate', desc: 'Received Date', type: 'datetime' },
            { field: 'receivedAmount', desc: 'Received Amount', type: 'decimal' },
            { field: 'paidBy', desc: 'Paid By', },
            { field: 'notes', desc: 'Notes', size: 1024}, //alter table rentPaymentInfo modify column notes varchar(1024);
            { field: 'month', desc: 'Month', },
            { field: 'paymentTypeID', desc: 'PaymentType'},
            //{ field: 'leaseID', desc: 'Lease ID', foreignKey: {table: 'leaseInfo', field:'leaseID'}},
            { field: 'houseID', desc: 'House', foreignKey: { table: 'houseInfo', field: 'houseID' } },
            { field: 'userID', desc: 'Owner', foreignKey: { table: 'userInfo', field: 'userID' }, required: true,},
            { field: 'paymentProcessor', desc: 'Processor', },
        ],
        view:{
            name: 'view_rentPaymentInfo',
            fields:[
                { name: 'paymentTypeName', field: 'paymentTypeName', desc: 'Payment Type', table: 'pt' },
                { field: 'includeInCommission', desc: 'includeInCommission', table: 'pt' },
                { name: 'address', field: 'address', desc: 'House', table: 'houseInfo' },
                { name: 'addressId', field: 'houseID', desc: 'HouseID', table: 'houseInfo' },
                { field: 'source', desc: 'Source', table: 'ip' },
                { name:'userName', field: 'username', desc: 'UserName', table: 'oi' },                
            ], 
            extraViewJoins: ' inner join userInfo oi on oi.userID  = houseInfo.userID left join importPayments ip  on ip.paymentID  = rentPaymentInfo.paymentID left join paymentType pt on pt.paymentTypeName = paymentTypeID ',
        }
};