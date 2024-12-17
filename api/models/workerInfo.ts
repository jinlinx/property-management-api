import { IDBModel } from './types';
export const workerInfo: IDBModel = {
    fields:
        [
            {field: 'workerID',desc: 'Id',type: 'uuid',required: true,isId: true},
            {field: 'firstName',desc: 'First Name',required: true},
            {field: 'lastName',desc: 'Last Name',required: true},
            {field: 'email',desc: 'Email',},
            {field: 'phone',desc: 'Phone',},
            {field: 'taxID',desc: 'SSN',},
            { field: 'address', desc: 'Address', },
            { field: 'vdPosControl', desc: 'PosControl' },
        ]
};