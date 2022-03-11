export type PossibleDbTypes = (string | number | null | Date);
export interface IDBFieldDef {
    field: string; //actual field
    name?: string; //name
    desc: string;
    type?: string;
    size?: string;
    required?: boolean;
    isId?: boolean;
    def?: string;
    unique?: boolean;
    //key?: 'UNI' | 'PRI' | null;
    formatter?: (v: PossibleDbTypes) => string;
    autoValueFunc?: (row: { [key: string]: (string | number) }, field: IDBFieldDef, val: PossibleDbTypes) => (string);
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