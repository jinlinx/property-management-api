import { IDBModel } from './types';
export const googleApiCreds = {
    fields:
        [
            { field: 'private_key_id', desc: 'Key Id', required: true },
            { field: 'private_key', desc: 'Key',  size: 4096},
            { field: 'client_email', desc: 'Client Email', },
            { field: 'sheetId', desc: 'Sheet Id', },
            { field: 'ownerID', type: 'int', desc: 'Owner ID', required: true, isOwnerSecurityField: true, foreignKey: { table: 'ownerInfo', field: 'ownerID' } },
        ],    
} as IDBModel;