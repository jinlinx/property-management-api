import { IDBModel, IUserAuth } from './types';

export const ownerInfo = {
    fields:
        [
            { field: 'ownerID', desc: 'Id', type: 'int', ident:true, required: true, isId: true, isOwnerSecurityField: true, },
            { field: 'ownerName', desc: 'Owner Name', required: true, },
            { field: 'username', desc: 'username', required: true, unique: true, },
            { field: 'password', desc:'Password', required: false },
            { field: 'shortName', desc: 'Short Name', required: true },
            {
                field: 'parentID', type: 'int', desc: 'Parent', def: '0', required: true, isOwnerSecurityParentField:true,
                //specialCreateVal: (auth: IUserAuth) => auth.code automatic
            },
            { field: 'googleToken', desc: 'Google Token' , size: 512},
            { field: 'googleSheetId', desc:'Google SheetId', size: 512},
        ]
} as IDBModel;
