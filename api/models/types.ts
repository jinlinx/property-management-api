export interface IUserAuth {
    userID: string;    
}

export type ModelTableNames = 'userInfo' | 'houseInfo' | 'tenantInfo' | 'workerInfo' | 'workerComp' | 'maintenanceRecords' | 'googleApiCreds';

export type PossibleDbTypes = (string | number | null | Date);
export interface IDBFieldDef {
    field: string; //actual field
    name?: string; //name
    desc: string;
    type?: '' | undefined | 'int' | 'string' | 'date' | 'datetime'| 'decimal' | 'uuid';
    size?: string | number;
    required?: boolean;
    isId?: boolean;
    def?: string;
    unique?: boolean;
    ident?: boolean;    
    //isOwnerSecurityParentField?: boolean;
    //key?: 'UNI' | 'PRI' | null;
    formatter?: (v: PossibleDbTypes) => string;
    autoValueFunc?: (row: { [key: string]: (string | number) }, field: IDBFieldDef, val: PossibleDbTypes) => (string);
    foreignKey?: {
        table: ModelTableNames;
        field: string;
    };
}

export interface IDBViewFieldDef extends IDBFieldDef {
    table: string; //for views only  
}

export interface IDBModel {
    fields: IDBFieldDef[];
    fieldMap?: {
        [key: string]: IDBFieldDef;
    };
    view?: {
        name: string;
        fields: IDBViewFieldDef[];
        extraViewJoins?: string;
    }
}