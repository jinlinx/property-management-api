export interface IUserAuth {
    username: string;
    parentID: string;
    pmInfo: {
        ownerPCodes: string[];
    }
}

export const OWNER_SEC_FIELD = 'ownerID';
export const OWNER_PARENT_SEC_FIELD = 'parentID';
export type PossibleDbTypes = (string | number | null | Date);
export interface IDBFieldDef {
    field: string; //actual field
    name?: string; //name
    desc: string;
    type?: '' | undefined | 'int' | 'string' | 'date' | 'datetime'| 'decimal' | 'uuid';
    size?: string;
    required?: boolean;
    isId?: boolean;
    def?: string;
    unique?: boolean;
    ident?: boolean;
    dontUpdate?: boolean;
    isOwnerSecurityField?: boolean;
    //isOwnerSecurityParentField?: boolean;
    //key?: 'UNI' | 'PRI' | null;
    formatter?: (v: PossibleDbTypes) => string;
    autoValueFunc?: (row: { [key: string]: (string | number) }, field: IDBFieldDef, val: PossibleDbTypes) => (string);
    specialCreateVal?: (auth: IUserAuth) => PossibleDbTypes;
    foreignKey?: {
        table: string;
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
    view: {
        name: string;
        fields: IDBViewFieldDef[];
        extraViewJoins?: string;
    }
}