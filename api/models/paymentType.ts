import { IDBModel } from './types';
const paymentType: IDBModel = {
    fields:
        [            
            { field: 'paymentTypeName', desc: 'date', isId: true, },
            { field: 'includeInCommission', desc: 'includeInCommission' },
            { field: 'displayOrder', type:'int', desc: 'Order' }, 
        ]
};