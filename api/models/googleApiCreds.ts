import { IDBModel } from './types';
export const googleApiCreds = {
    fields:
        [
            { field: 'private_key_id', desc: 'Key Id', required: true,},
            { field: 'private_key', desc: 'Key',  size: 4096},
            { field: 'client_email', desc: 'Client Email', },
            { field: 'googleSheetId', desc: 'Sheet Id', },
            { field: 'ownerID', desc: 'Owner ID', isId: true, required: true, isOwnerSecurityField: true, foreignKey: { table: 'ownerInfo', field: 'ownerID' } },
        ],    
} as IDBModel;